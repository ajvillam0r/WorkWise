<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')
            ->where('user_type', 'gig_worker')
            ->whereNotNull('skills_with_experience')
            ->get(['id', 'skills_with_experience']);

        foreach ($users as $user) {
            $raw = json_decode($user->skills_with_experience, true);
            if (!is_array($raw)) {
                continue;
            }
            $names = [];
            foreach ($raw as $item) {
                $name = is_array($item) ? ($item['skill'] ?? $item['name'] ?? null) : $item;
                if ($name && trim((string) $name) !== '') {
                    $names[] = trim((string) $name);
                }
            }
            $names = array_unique($names);
            if (empty($names)) {
                continue;
            }
            foreach ($names as $name) {
                $skillId = DB::table('skills')->where('name', $name)->value('id');
                if (!$skillId) {
                    $skillId = DB::table('skills')->insertGetId(['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
                }
                $exists = DB::table('skill_user')
                    ->where('user_id', $user->id)
                    ->where('skill_id', $skillId)
                    ->exists();
                if (!$exists) {
                    DB::table('skill_user')->insert([
                        'user_id' => $user->id,
                        'skill_id' => $skillId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $userIds = DB::table('users')->where('user_type', 'gig_worker')->pluck('id');
        DB::table('skill_user')->whereIn('user_id', $userIds)->delete();
    }
};
