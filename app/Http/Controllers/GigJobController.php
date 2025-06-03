<?php

namespace App\Http\Controllers;

use App\Models\GigJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigJobController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = GigJob::with(['employer', 'bids'])
            ->where('status', 'open')
            ->latest();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereJsonContains('required_skills', $search);
            });
        }

        // Filter by skills
        if ($request->filled('skills')) {
            $skills = $request->get('skills');
            if (is_array($skills)) {
                foreach ($skills as $skill) {
                    $query->whereJsonContains('required_skills', $skill);
                }
            }
        }

        // Filter by budget range
        if ($request->filled('min_budget')) {
            $query->where('budget_min', '>=', $request->get('min_budget'));
        }
        if ($request->filled('max_budget')) {
            $query->where('budget_max', '<=', $request->get('max_budget'));
        }

        $jobs = $query->paginate(12);

        // Add budget display and bids count to each job
        $jobs->getCollection()->transform(function ($job) {
            $job->budget_display = $job->getBudgetDisplayAttribute();
            $job->bids_count = $job->bids()->count();
            return $job;
        });

        return Inertia::render('Jobs/Index', [
            'jobs' => $jobs,
            'filters' => $request->only(['search', 'skills', 'min_budget', 'max_budget']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Only clients can create jobs
        if (!auth()->user()->isClient()) {
            abort(403, 'Only clients can post jobs.');
        }

        return Inertia::render('Jobs/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Only clients can create jobs
        if (!auth()->user()->isClient()) {
            abort(403, 'Only clients can post jobs.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:100',
            'required_skills' => 'required|array|min:1',
            'required_skills.*' => 'string|max:50',
            'budget_type' => 'required|in:fixed,hourly',
            'budget_min' => 'required|numeric|min:5',
            'budget_max' => 'required|numeric|min:5|gte:budget_min',
            'experience_level' => 'required|in:beginner,intermediate,expert',
            'estimated_duration_days' => 'required|integer|min:1',
            'deadline' => 'nullable|date|after:today',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'boolean',
        ]);

        $validated['employer_id'] = auth()->id();
        $validated['status'] = 'open';

        $job = GigJob::create($validated);

        return redirect()->route('jobs.show', $job)
            ->with('success', 'Job posted successfully! Your job is now live and freelancers can start submitting proposals.');
    }

    /**
     * Display the specified resource.
     */
    public function show(GigJob $job): Response
    {
        $job->load(['employer', 'bids.freelancer']);
        $job->budget_display = $job->getBudgetDisplayAttribute();

        return Inertia::render('Jobs/Show', [
            'job' => $job,
            'canBid' => auth()->user()?->isFreelancer() &&
                       !$job->bids()->where('freelancer_id', auth()->id())->exists(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GigJob $job): Response
    {
        // Only allow employer to edit their own jobs
        if ($job->employer_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('Jobs/Edit', [
            'job' => $job,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GigJob $job)
    {
        // Only allow employer to update their own jobs
        if ($job->employer_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'required_skills' => 'required|array|min:1',
            'required_skills.*' => 'string',
            'budget_type' => 'required|in:fixed,hourly',
            'budget_min' => 'required|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0|gte:budget_min',
            'experience_level' => 'required|in:beginner,intermediate,expert',
            'estimated_duration_days' => 'nullable|integer|min:1',
            'deadline' => 'nullable|date|after:today',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'boolean',
        ]);

        $job->update($validated);

        return redirect()->route('jobs.show', $job)
            ->with('success', 'Job updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GigJob $job)
    {
        // Only allow employer to delete their own jobs
        if ($job->employer_id !== auth()->id()) {
            abort(403);
        }

        $job->delete();

        return redirect()->route('jobs.index')
            ->with('success', 'Job deleted successfully!');
    }
}
