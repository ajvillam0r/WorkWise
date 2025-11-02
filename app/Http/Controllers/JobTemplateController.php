<?php

namespace App\Http\Controllers;

use App\Models\JobTemplate;
use App\Models\GigJob;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class JobTemplateController extends Controller
{
    /**
     * Display a listing of job templates
     */
    public function index(): Response
    {
        $templates = auth()->user()->jobTemplates()
            ->orderByDesc('is_favorite')
            ->orderByDesc('last_used_at')
            ->paginate(15);

        return Inertia::render('JobTemplates/Index', [
            'templates' => $templates,
        ]);
    }

    /**
     * Show the form for creating a new job template
     */
    public function create(): Response
    {
        return Inertia::render('JobTemplates/Create');
    }

    /**
     * Store a newly created job template in storage
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'template_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'title_template' => 'required|string|max:255',
            'description_template' => 'required|string|min:50|max:2000',
            'project_category' => 'nullable|string|max:255',
            'skills_requirements' => 'nullable|array',
            'nice_to_have_skills' => 'nullable|array',
            'budget_type' => 'required|in:fixed,hourly',
            'typical_budget_min' => 'required|numeric|min:0',
            'typical_budget_max' => 'required|numeric|min:0|gte:typical_budget_min',
            'typical_duration' => 'nullable|in:short_term,medium_term,long_term,ongoing',
            'estimated_duration_days' => 'nullable|integer|min:1',
            'experience_level' => 'nullable|in:beginner,intermediate,expert',
            'job_complexity' => 'nullable|in:simple,moderate,complex,expert',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'boolean',
        ]);

        $validated['employer_id'] = auth()->id();

        JobTemplate::create($validated);

        return redirect()->route('job-templates.index')
            ->with('success', 'Job template created successfully!');
    }

    /**
     * Show the form for editing a job template
     */
    public function edit(JobTemplate $jobTemplate): Response
    {
        $this->authorize('update', $jobTemplate);

        return Inertia::render('JobTemplates/Edit', [
            'template' => $jobTemplate,
        ]);
    }

    /**
     * Update a job template in storage
     */
    public function update(Request $request, JobTemplate $jobTemplate): RedirectResponse
    {
        $this->authorize('update', $jobTemplate);

        $validated = $request->validate([
            'template_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'title_template' => 'required|string|max:255',
            'description_template' => 'required|string|min:50|max:2000',
            'project_category' => 'nullable|string|max:255',
            'skills_requirements' => 'nullable|array',
            'nice_to_have_skills' => 'nullable|array',
            'budget_type' => 'required|in:fixed,hourly',
            'typical_budget_min' => 'required|numeric|min:0',
            'typical_budget_max' => 'required|numeric|min:0|gte:typical_budget_min',
            'typical_duration' => 'nullable|in:short_term,medium_term,long_term,ongoing',
            'estimated_duration_days' => 'nullable|integer|min:1',
            'experience_level' => 'nullable|in:beginner,intermediate,expert',
            'job_complexity' => 'nullable|in:simple,moderate,complex,expert',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'boolean',
            'is_favorite' => 'boolean',
        ]);

        $jobTemplate->update($validated);

        return redirect()->route('job-templates.show', $jobTemplate)
            ->with('success', 'Job template updated successfully!');
    }

    /**
     * Show a job template
     */
    public function show(JobTemplate $jobTemplate): Response
    {
        $this->authorize('view', $jobTemplate);

        return Inertia::render('JobTemplates/Show', [
            'template' => $jobTemplate,
        ]);
    }

    /**
     * Delete a job template
     */
    public function destroy(JobTemplate $jobTemplate): RedirectResponse
    {
        $this->authorize('delete', $jobTemplate);

        $jobTemplate->delete();

        return redirect()->route('job-templates.index')
            ->with('success', 'Job template deleted successfully!');
    }

    /**
     * Create a job from this template
     */
    public function createJobFromTemplate(JobTemplate $jobTemplate): RedirectResponse
    {
        $this->authorize('view', $jobTemplate);

        try {
            $job = $jobTemplate->createJob();

            return redirect()->route('jobs.show', $job)
                ->with('success', 'Job created from template! You can now review and post it.');
        } catch (\Exception $e) {
            \Log::error('Error creating job from template: ' . $e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to create job from template. Please try again.');
        }
    }

    /**
     * Toggle favorite status
     */
    public function toggleFavorite(JobTemplate $jobTemplate): RedirectResponse
    {
        $this->authorize('update', $jobTemplate);

        $jobTemplate->update([
            'is_favorite' => !$jobTemplate->is_favorite
        ]);

        return redirect()->back()
            ->with('success', $jobTemplate->is_favorite ? 'Added to favorites!' : 'Removed from favorites.');
    }
}
