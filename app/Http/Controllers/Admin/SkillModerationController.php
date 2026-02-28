<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GigJob;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SkillModerationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Skill::query();

        if ($filter = $request->input('filter')) {
            if ($filter === 'verified') {
                $query->verified();
            } elseif ($filter === 'unverified') {
                $query->unverified();
            }
        }

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $skills = $query->orderBy('name')
            ->paginate(50)
            ->through(function ($skill) {
                // pivot usage count
                $pivotCount = DB::table('skill_user')
                    ->where('skill_id', $skill->id)
                    ->distinct('user_id')
                    ->count('user_id');

                // job usage count
                $jobCount = GigJob::whereNotNull('skills_requirements')
                    ->get(['employer_id', 'skills_requirements'])
                    ->filter(function ($job) use ($skill) {
                        $reqs = $job->skills_requirements;
                        if (!is_array($reqs)) return false;
                        foreach ($reqs as $req) {
                            if (is_array($req) && strcasecmp(trim($req['skill'] ?? ''), $skill->name) === 0) {
                                return true;
                            }
                        }
                        return false;
                    })
                    ->pluck('employer_id')
                    ->unique()
                    ->count();

                $skill->usage_count = $pivotCount + $jobCount;
                $skill->pivot_count = $pivotCount;
                $skill->job_employer_count = $jobCount;

                return $skill;
            });

        $allSkills = Skill::orderBy('name')->pluck('name', 'id');

        return Inertia::render('Admin/Skills/Index', [
            'skills'    => $skills,
            'allSkills' => $allSkills,
            'filters'   => [
                'search' => $request->input('search', ''),
                'filter' => $request->input('filter', ''),
            ],
        ]);
    }

    public function merge(Request $request)
    {
        $request->validate([
            'from_skill_id' => 'required|integer|exists:skills,id',
            'to_skill_id'   => 'required|integer|exists:skills,id|different:from_skill_id',
        ]);

        $from = Skill::findOrFail($request->input('from_skill_id'));
        $to   = Skill::findOrFail($request->input('to_skill_id'));

        DB::transaction(function () use ($from, $to) {
            // 1. Move skill_user rows (skip existing to avoid duplicate key)
            $existingUserIds = DB::table('skill_user')
                ->where('skill_id', $to->id)
                ->pluck('user_id')
                ->toArray();

            DB::table('skill_user')
                ->where('skill_id', $from->id)
                ->whereNotIn('user_id', $existingUserIds)
                ->update(['skill_id' => $to->id]);

            // Delete remaining duplicates for the old skill
            DB::table('skill_user')->where('skill_id', $from->id)->delete();

            // 2. Update gig_jobs.skills_requirements JSON
            GigJob::whereNotNull('skills_requirements')
                ->chunkById(100, function ($jobs) use ($from, $to) {
                    foreach ($jobs as $job) {
                        $reqs = $job->skills_requirements;
                        if (!is_array($reqs)) continue;
                        $changed = false;
                        foreach ($reqs as &$req) {
                            if (is_array($req) && strcasecmp(trim($req['skill'] ?? ''), $from->name) === 0) {
                                $req['skill'] = $to->name;
                                $changed = true;
                            }
                        }
                        unset($req);
                        if ($changed) {
                            $job->skills_requirements = $reqs;
                            $job->required_skills = array_map(fn ($r) => $r['skill'], $reqs);
                            $job->save();
                        }
                    }
                });

            // 3. Update users.primary_hiring_skills JSON
            DB::table('users')
                ->whereNotNull('primary_hiring_skills')
                ->orderBy('id')
                ->chunkById(100, function ($users) use ($from, $to) {
                    foreach ($users as $user) {
                        $skills = json_decode($user->primary_hiring_skills, true);
                        if (!is_array($skills)) continue;
                        $changed = false;
                        foreach ($skills as &$s) {
                            if (strcasecmp(trim($s), $from->name) === 0) {
                                $s = $to->name;
                                $changed = true;
                            }
                        }
                        unset($s);
                        if ($changed) {
                            DB::table('users')
                                ->where('id', $user->id)
                                ->update(['primary_hiring_skills' => json_encode(array_unique($skills))]);
                        }
                    }
                });

            // 4. Update users.skills_with_experience JSON
            DB::table('users')
                ->whereNotNull('skills_with_experience')
                ->orderBy('id')
                ->chunkById(100, function ($users) use ($from, $to) {
                    foreach ($users as $user) {
                        $swe = json_decode($user->skills_with_experience, true);
                        if (!is_array($swe)) continue;
                        $changed = false;
                        foreach ($swe as &$entry) {
                            if (is_array($entry) && strcasecmp(trim($entry['skill'] ?? ''), $from->name) === 0) {
                                $entry['skill'] = $to->name;
                                $changed = true;
                            }
                        }
                        unset($entry);
                        if ($changed) {
                            DB::table('users')
                                ->where('id', $user->id)
                                ->update(['skills_with_experience' => json_encode($swe)]);
                        }
                    }
                });

            // 5. Delete the "from" skill
            $from->delete();
        });

        return redirect()->route('admin.skills.index')
            ->with('success', "Skill \"{$from->name}\" merged into \"{$to->name}\" successfully.");
    }
}
