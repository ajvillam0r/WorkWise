<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GigWorkerOnboardingController extends Controller
{
    /**
     * Show the gig worker onboarding page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If not a gig worker, redirect
        if (!$user->isGigWorker()) {
            return redirect()->route('dashboard');
        }

        // If onboarding already completed, redirect to jobs
        if ($user->profile_completed) {
            return redirect()->route('jobs.index')
                ->with('message', 'Your profile is already complete!');
        }

        return Inertia::render('Onboarding/GigWorkerOnboarding', [
            'user' => $user,
            'currentStep' => $user->onboarding_step ?: 1,
        ]);
    }

    /**
     * Save a specific onboarding step (supports partial/draft saving).
     */
    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $step = $request->input('step', 1);
        $isDraft = $request->boolean('is_draft', false);

        // #region agent log
        $__dbg = json_encode(['sessionId'=>'b0ba4d','hypothesisId'=>'B','location'=>'GigWorkerOnboardingController.php:store-entry','message'=>'store called','data'=>['step'=>$step,'isDraft'=>$isDraft,'user_id'=>$user->id,'profile_completed'=>$user->profile_completed,'onboarding_step'=>$user->onboarding_step],'timestamp'=>round(microtime(true)*1000)])."\n";
        file_put_contents(storage_path('logs/debug-b0ba4d.log'), $__dbg, FILE_APPEND);
        Log::info('[DEBUG-b0ba4d] store-entry', ['step'=>$step,'isDraft'=>$isDraft,'user_id'=>$user->id,'profile_completed'=>$user->profile_completed]);
        // #endregion

        try {
            match ((int) $step) {
                2 => $this->saveStep2($request, $user),
                3 => $this->saveStep3($request, $user),
                4 => $this->saveStep4($request, $user),
                5 => $this->saveStep5($request, $user),
                default => null,
            };

            // #region agent log
            $__dbg2 = json_encode(['sessionId'=>'b0ba4d','hypothesisId'=>'B','location'=>'GigWorkerOnboardingController.php:after-save','message'=>'step save succeeded','data'=>['step'=>$step,'professional_title'=>$user->professional_title,'bio_len'=>strlen($user->bio??''),'skills_count'=>count($user->skills_with_experience??[])],'timestamp'=>round(microtime(true)*1000)])."\n";
            file_put_contents(storage_path('logs/debug-b0ba4d.log'), $__dbg2, FILE_APPEND);
            Log::info('[DEBUG-b0ba4d] after-save', ['step'=>$step,'title'=>$user->professional_title,'skills'=>count($user->skills_with_experience??[])]);
            // #endregion

            // Update onboarding step progress
            if (!$isDraft && $user->onboarding_step < $step) {
                $user->onboarding_step = $step;
                $user->save();
            }

            if ($isDraft) {
                return response()->json([
                    'success' => true,
                    'message' => 'Progress saved as draft.',
                ]);
            }

            // If step 5 is submitted, mark profile as complete
            if ((int) $step === 5) {
                $user->profile_completed = true;
                $user->onboarding_step = 5;
                $user->save();

                // #region agent log
                $__dbg3 = json_encode(['sessionId'=>'b0ba4d','hypothesisId'=>'C','location'=>'GigWorkerOnboardingController.php:step5-redirect','message'=>'redirecting to jobs.index','data'=>['user_id'=>$user->id,'profile_completed'=>$user->profile_completed],'timestamp'=>round(microtime(true)*1000)])."\n";
                file_put_contents(storage_path('logs/debug-b0ba4d.log'), $__dbg3, FILE_APPEND);
                Log::info('[DEBUG-b0ba4d] step5-redirect', ['user_id'=>$user->id,'profile_completed'=>$user->profile_completed]);
                // #endregion

                return redirect()->route('jobs.index')
                    ->with('success', 'Welcome to WorkWise! Your profile has been submitted for review.');
            }

            return back()->with('success', "Step {$step} saved successfully.");

        } catch (\Throwable $e) {
            // #region agent log
            $__dbg4 = json_encode(['sessionId'=>'b0ba4d','hypothesisId'=>'B','location'=>'GigWorkerOnboardingController.php:catch','message'=>'exception caught','data'=>['step'=>$step,'class'=>get_class($e),'msg'=>$e->getMessage(),'is_validation'=>($e instanceof ValidationException)],'timestamp'=>round(microtime(true)*1000)])."\n";
            file_put_contents(storage_path('logs/debug-b0ba4d.log'), $__dbg4, FILE_APPEND);
            Log::error('[DEBUG-b0ba4d] catch', ['step'=>$step,'class'=>get_class($e),'msg'=>$e->getMessage()]);
            // #endregion

            if ($e instanceof ValidationException) {
                throw $e;
            }
            Log::error('Onboarding save error', [
                'user_id' => $user->id,
                'step' => $step,
                'error' => $e->getMessage(),
            ]);

            if ($isDraft) {
                return response()->json(['success' => false, 'message' => 'Failed to save draft.'], 500);
            }

            return back()->withErrors(['error' => 'Failed to save. Please try again.']);
        }
    }

    /**
     * Skip onboarding and go to jobs page.
     */
    public function skip(Request $request): RedirectResponse
    {
        return redirect()->route('jobs.index')
            ->with('message', 'You can complete your profile anytime from the Profile page.');
    }

    // ─── Step Handlers ───────────────────────────────────────────────────────

    private function saveStep2(Request $request, User $user): void
    {
        $validated = $request->validate([
            'professional_title' => 'required|string|max:150',
            'hourly_rate'        => 'nullable|numeric|min:0|max:99999',
            'bio'                => 'required|string|max:1000',
            'profile_picture'    => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('profile_picture')) {
            try {
                Log::info('Onboarding: uploading profile picture to Supabase', ['user_id' => $user->id]);

                if ($user->profile_picture) {
                    try {
                        $oldPath = ltrim(str_replace('/supabase/', '', $user->profile_picture), '/');
                        if (Storage::disk('supabase')->exists($oldPath)) {
                            Storage::disk('supabase')->delete($oldPath);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Onboarding: could not delete old profile picture: ' . $e->getMessage());
                    }
                }

                $path = Storage::disk('supabase')->putFile('profiles/' . $user->id, $request->file('profile_picture'));
                if ($path) {
                    $url = '/supabase/' . $path;
                    $user->profile_picture = $url;
                    $user->profile_photo   = $url;
                    Log::info('Onboarding: profile picture uploaded', ['user_id' => $user->id, 'path' => $path]);
                } else {
                    Log::error('Onboarding: Supabase upload returned null path', ['user_id' => $user->id]);
                    throw ValidationException::withMessages([
                        'profile_picture' => 'Profile picture upload failed. Please try again or continue without.',
                    ]);
                }
            } catch (ValidationException $e) {
                throw $e;
            } catch (\Exception $e) {
                Log::error('Onboarding: profile picture upload failed: ' . $e->getMessage(), ['user_id' => $user->id]);
                throw ValidationException::withMessages([
                    'profile_picture' => 'Profile picture upload failed. Please try again or continue without.',
                ]);
            }
        }

        $user->professional_title = $validated['professional_title'];
        $user->hourly_rate        = $validated['hourly_rate'] ?? null;
        $user->bio                = $validated['bio'];
        $user->save();
    }

    private function saveStep3(Request $request, User $user): void
    {
        // Skills come as a JSON string (from FormData) or array
        $skillsRaw = $request->input('skills_with_experience');
        if (is_string($skillsRaw)) {
            $skills = json_decode($skillsRaw, true);
            if (is_array($skills) && count($skills) > 0) {
                $user->skills_with_experience = $skills;
                $user->save();
            }
        } elseif (is_array($skillsRaw) && count($skillsRaw) > 0) {
            $user->skills_with_experience = $skillsRaw;
            $user->save();
        }
    }

    private function saveStep4(Request $request, User $user): void
    {
        $validated = $request->validate([
            'portfolio_link' => 'nullable|string|max:500',
            'resume_file'    => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        // Persist all accumulated text fields (buildFormData always sends everything)
        if ($request->filled('professional_title')) {
            $user->professional_title = $request->input('professional_title');
        }
        if ($request->filled('bio')) {
            $user->bio = $request->input('bio');
        }
        if ($request->has('hourly_rate')) {
            $user->hourly_rate = $request->input('hourly_rate') ?: null;
        }

        // Persist skills
        $skillsRaw = $request->input('skills_with_experience');
        if (is_string($skillsRaw)) {
            $skills = json_decode($skillsRaw, true);
            if (is_array($skills) && count($skills) > 0) {
                $user->skills_with_experience = $skills;
            }
        } elseif (is_array($skillsRaw) && count($skillsRaw) > 0) {
            $user->skills_with_experience = $skillsRaw;
        }

        // Upload resume
        if ($request->hasFile('resume_file')) {
            try {
                Log::info('Onboarding: uploading resume to Supabase', ['user_id' => $user->id]);
                $path = Storage::disk('supabase')->putFile('resumes/' . $user->id, $request->file('resume_file'));
                if ($path) {
                    $user->resume_file = '/supabase/' . $path;
                    Log::info('Onboarding: resume uploaded', ['user_id' => $user->id, 'path' => $path]);
                } else {
                    Log::error('Onboarding: resume upload returned null', ['user_id' => $user->id]);
                    throw ValidationException::withMessages([
                        'resume_file' => 'Resume upload failed. Please try again or continue without.',
                    ]);
                }
            } catch (ValidationException $e) {
                throw $e;
            } catch (\Exception $e) {
                Log::error('Onboarding: resume upload failed: ' . $e->getMessage(), ['user_id' => $user->id]);
                throw ValidationException::withMessages([
                    'resume_file' => 'Resume upload failed. Please try again or continue without.',
                ]);
            }
        }

        $user->portfolio_link = $validated['portfolio_link'] ?? null;
        $user->save();
    }

    /**
     * Step 5 = TEXT-DATA SAFETY NET.
     *
     * Files are NOT sent on step 5 (they're handled at steps 2 & 4).
     * This call persists all accumulated text fields before profile_completed=true.
     */
    private function saveStep5(Request $request, User $user): void
    {
        $validated = $request->validate([
            'professional_title'     => 'sometimes|nullable|string|max:150',
            'hourly_rate'            => 'sometimes|nullable|numeric|min:0|max:99999',
            'bio'                    => 'sometimes|nullable|string|max:1000',
            'skills_with_experience' => 'sometimes|nullable|string',
            'portfolio_link'         => 'sometimes|nullable|string|max:500',
        ]);

        // Only overwrite if non-empty so we don't erase data saved at earlier steps
        if (!empty($validated['professional_title'])) {
            $user->professional_title = $validated['professional_title'];
        }
        if (array_key_exists('hourly_rate', $validated)) {
            $user->hourly_rate = $validated['hourly_rate'] ?: null;
        }
        if (!empty($validated['bio'])) {
            $user->bio = $validated['bio'];
        }
        if (!empty($validated['portfolio_link'])) {
            $user->portfolio_link = $validated['portfolio_link'];
        }

        // Skills JSON (sent as string from FormData)
        if (!empty($validated['skills_with_experience'])) {
            $skills = json_decode($validated['skills_with_experience'], true);
            if (is_array($skills) && count($skills) > 0) {
                $user->skills_with_experience = $skills;
            }
        }

        $user->save();
        Log::info('Onboarding step5: text data persisted', [
            'user_id' => $user->id,
            'title'   => $user->professional_title,
            'skills'  => count($user->skills_with_experience ?? []),
        ]);
    }
}

