<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AIJobMatchingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkerDiscoveryController extends Controller
{
    protected AIJobMatchingService $matchingService;

    public function __construct(AIJobMatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
        $this->middleware('employer');
    }

    /**
     * Display a listing of gig workers with advanced filtering
     */
    public function index(Request $request): Response
    {
        $query = User::where('user_type', 'gig_worker')
            ->where('profile_completed', true);

        // Search by name or bio
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                  ->orWhere('professional_title', 'LIKE', "%{$search}%")
                  ->orWhere('bio', 'LIKE', "%{$search}%");
            });
        }

        // Filter by skills
        if ($request->filled('skills')) {
            $skills = $request->input('skills'); // Array of skill names
            $query->whereJsonContains('skills_with_experience', function ($subquery) use ($skills) {
                foreach ($skills as $skill) {
                    $subquery->orWhereJsonContains('skills_with_experience[*].skill', $skill);
                }
            });

            // If specific experience level required
            if ($request->filled('min_experience')) {
                $minExp = $request->input('min_experience'); // 'beginner', 'intermediate', 'expert'
                $levels = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
                $minLevel = $levels[$minExp] ?? 1;

                $query->whereRaw("
                    JSON_EXTRACT(skills_with_experience, '$[*].experience_level') 
                    IN ('expert', 'intermediate', 'beginner')
                ");
            }
        }

        // Filter by hourly rate
        if ($request->filled('min_rate') || $request->filled('max_rate')) {
            $minRate = $request->input('min_rate', 0);
            $maxRate = $request->input('max_rate', 9999);
            $query->whereBetween('hourly_rate', [$minRate, $maxRate]);
        }

        // Filter by experience level
        if ($request->filled('experience_level')) {
            $experience = $request->input('experience_level'); // 'beginner', 'intermediate', 'expert'
            // Average worker skill level (can be calculated from skills_with_experience)
            $levels = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        }

        // Filter by category
        if ($request->filled('category')) {
            $category = $request->input('category');
            $query->where('broad_category', $category);
        }

        // Filter by location
        if ($request->filled('location')) {
            $location = $request->input('location');
            $query->where('city', 'LIKE', "%{$location}%")
                  ->orWhere('country', 'LIKE', "%{$location}%");
        }

        // Filter by timezone
        if ($request->filled('timezone')) {
            $timezone = $request->input('timezone');
            $query->where('timezone', $timezone);
        }

        // Filter by minimum rating
        if ($request->filled('min_rating')) {
            $minRating = $request->input('min_rating', 0);
            $query->whereRaw(
                "COALESCE((SELECT AVG(rating) FROM reviews WHERE reviews.reviewee_id = users.id), 0) >= ?",
                [$minRating]
            );
        }

        // Sort options
        $sortBy = $request->input('sort_by', 'recent');
        switch ($sortBy) {
            case 'rating':
                $query->orderByDesc(User::query()
                    ->selectRaw('COALESCE(AVG(rating), 0)')
                    ->from('reviews')
                    ->whereColumn('reviews.reviewee_id', 'users.id'));
                break;
            case 'rate_high':
                $query->orderByDesc('hourly_rate');
                break;
            case 'rate_low':
                $query->orderBy('hourly_rate');
                break;
            case 'completions':
                $query->orderByDesc(User::query()
                    ->selectRaw('COUNT(*)')
                    ->from('projects')
                    ->where('status', 'completed')
                    ->whereColumn('gig_worker_id', 'users.id'));
                break;
            case 'recent':
            default:
                $query->orderByDesc('created_at');
        }

        // Paginate results
        $workers = $query->select([
            'users.id',
            'users.first_name',
            'users.last_name',
            'users.professional_title',
            'users.bio',
            'users.hourly_rate',
            'users.broad_category',
            'users.specific_services',
            'users.skills_with_experience',
            'users.profile_photo',
            'users.avatar',
            'users.city',
            'users.country',
            'users.timezone',
            'users.created_at'
        ])
        ->with(['receivedReviews' => function ($q) {
            $q->select('id', 'reviewee_id', 'rating', 'created_at');
        }])
        ->paginate(12);

        // Add match scores if employer has typical needs
        $employer = auth()->user();
        $workersWithScores = $workers->map(function ($worker) use ($employer) {
            $matchScore = 0;
            
            if ($employer->primary_hiring_needs) {
                // Calculate match score based on employer's hiring preferences
                $needs = is_array($employer->primary_hiring_needs) ? 
                    $employer->primary_hiring_needs : 
                    json_decode($employer->primary_hiring_needs, true);
                
                if (in_array($worker->broad_category, $needs)) {
                    $matchScore += 0.3; // 30% for category match
                }

                // Check skill overlap with employer's typical needs
                $workerSkills = $worker->skills_with_experience ?? [];
                if (!empty($workerSkills)) {
                    $matchScore += 0.7; // 70% if they have skills in the category
                }
            }

            return [
                'id' => $worker->id,
                'first_name' => $worker->first_name,
                'last_name' => $worker->last_name,
                'professional_title' => $worker->professional_title,
                'bio' => $worker->bio,
                'hourly_rate' => $worker->hourly_rate,
                'broad_category' => $worker->broad_category,
                'specific_services' => $worker->specific_services,
                'skills_with_experience' => $worker->skills_with_experience,
                'profile_photo' => $worker->profile_photo,
                'avatar' => $worker->avatar,
                'city' => $worker->city,
                'country' => $worker->country,
                'timezone' => $worker->timezone,
                'created_at' => $worker->created_at,
                'rating' => $worker->receivedReviews->avg('rating') ?? 0,
                'total_reviews' => $worker->receivedReviews->count(),
                'match_score' => round($matchScore * 100, 1),
                'profile_url' => route('worker.profile', $worker->id)
            ];
        });

        // Get available categories and timezones for filters
        $categories = User::where('user_type', 'gig_worker')
            ->distinct()
            ->pluck('broad_category')
            ->filter()
            ->sort()
            ->values();

        $timezones = User::where('user_type', 'gig_worker')
            ->distinct()
            ->pluck('timezone')
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Discovery/WorkerDiscovery', [
            'workers' => $workersWithScores,
            'filters' => [
                'search' => $request->input('search'),
                'skills' => $request->input('skills', []),
                'min_experience' => $request->input('min_experience'),
                'min_rate' => $request->input('min_rate'),
                'max_rate' => $request->input('max_rate'),
                'category' => $request->input('category'),
                'location' => $request->input('location'),
                'timezone' => $request->input('timezone'),
                'min_rating' => $request->input('min_rating'),
                'sort_by' => $sortBy
            ],
            'filter_options' => [
                'categories' => $categories,
                'timezones' => $timezones,
                'experience_levels' => ['beginner', 'intermediate', 'expert']
            ]
        ]);
    }

    /**
     * Show a specific worker's profile
     */
    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        $user->load([
            'receivedReviews' => function ($q) {
                $q->latest()->limit(10);
            },
            'gigWorkerProjects' => function ($q) {
                $q->where('status', 'completed')->latest()->limit(6);
            },
            'portfolioItems' => function ($q) {
                $q->orderBy('display_order')->limit(12);
            }
        ]);

        return Inertia::render('Discovery/WorkerProfile', [
            'worker' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'professional_title' => $user->professional_title,
                'bio' => $user->bio,
                'hourly_rate' => $user->hourly_rate,
                'broad_category' => $user->broad_category,
                'specific_services' => $user->specific_services,
                'skills_with_experience' => $user->skills_with_experience,
                'profile_photo' => $user->profile_photo,
                'avatar' => $user->avatar,
                'city' => $user->city,
                'country' => $user->country,
                'timezone' => $user->timezone,
                'working_hours' => $user->working_hours,
                'availability_notes' => $user->availability_notes,
                'rating' => $user->receivedReviews->avg('rating') ?? 0,
                'total_reviews' => $user->receivedReviews->count(),
                'completed_projects' => $user->gigWorkerProjects->count(),
                'reviews' => $user->receivedReviews->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'reviewer' => $review->reviewer->name,
                        'created_at' => $review->created_at->diffForHumans()
                    ];
                }),
                'portfolio' => $user->portfolioItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'description' => $item->description,
                        'image_url' => $item->image_url,
                        'project_url' => $item->project_url,
                        'display_order' => $item->display_order
                    ];
                })
            ]
        ]);
    }

    /**
     * Invite a worker to a specific job
     */
    public function inviteToJob(Request $request, User $worker)
    {
        $this->authorize('invite', $worker);

        $validated = $request->validate([
            'job_id' => 'required|exists:gig_jobs,id'
        ]);

        $job = \App\Models\GigJob::findOrFail($validated['job_id']);

        // Check if employer owns the job
        if ($job->employer_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check if already invited
        if ($job->invitations()->where('worker_id', $worker->id)->exists()) {
            return redirect()->back()->with('message', 'Worker already invited to this job');
        }

        // Create invitation
        $job->invitations()->create([
            'worker_id' => $worker->id,
            'invited_by' => auth()->id(),
            'status' => 'pending'
        ]);

        // TODO: Send notification to worker

        return redirect()->back()->with('success', 'Worker invited successfully!');
    }
}
