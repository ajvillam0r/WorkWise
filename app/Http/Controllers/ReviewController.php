<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ReviewController extends Controller
{
    /**
     * Submit a review for a project
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
            'reviewee_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'review_title' => 'nullable|string|max:100',
            'criteria_ratings' => 'nullable|array',
        ]);

        $user = Auth::user();
        $project = Project::findOrFail($request->project_id);
        $reviewee = User::findOrFail($request->reviewee_id);

        // Validate that the user can review this project
        if (!$this->canUserReviewProject($user, $project, $reviewee)) {
            return response()->json([
                'message' => 'You are not authorized to review this project or user.'
            ], 403);
        }

        // Check if review already exists
        $existingReview = Review::where('project_id', $request->project_id)
            ->where('reviewer_id', $user->id)
            ->where('reviewee_id', $request->reviewee_id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this project.'
            ], 409);
        }

        // Determine reviewer and reviewee types
        $reviewerType = $user->isEmployer() ? 'employer' : 'gig_worker';
        $revieweeType = $reviewee->isEmployer() ? 'employer' : 'gig_worker';

        // Set visibility deadline (7 days from now)
        $visibilityDeadline = Carbon::now()->addDays(7);

        $review = Review::create([
            'project_id' => $request->project_id,
            'reviewer_id' => $user->id,
            'reviewee_id' => $request->reviewee_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'review_title' => $request->review_title,
            'criteria_ratings' => $request->criteria_ratings,
            'reviewer_type' => $reviewerType,
            'reviewee_type' => $revieweeType,
            'visibility_deadline' => $visibilityDeadline,
            'is_public' => true,
            'is_visible' => false,
        ]);

        // Check if counterpart review exists and handle mutual completion
        $this->handleMutualReviewCompletion($review);

        return response()->json([
            'message' => 'Review submitted successfully.',
            'review' => $review->load(['reviewer', 'reviewee', 'project']),
        ], 201);
    }

    /**
     * Get reviews for a specific user
     */
    public function getUserReviews(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'type' => 'nullable|in:received,given',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $user = User::findOrFail($userId);
        $perPage = $request->get('per_page', 10);
        $type = $request->get('type', 'received');

        $query = Review::with(['reviewer', 'reviewee', 'project'])
            ->visible();

        if ($type === 'received') {
            $query->forUser($userId);
        } else {
            $query->byUser($userId);
        }

        $reviews = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'reviews' => $reviews->items(),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'average_rating' => $user->average_rating,
                'total_reviews' => Review::forUser($userId)->visible()->count(),
            ],
        ]);
    }

    /**
     * Get reviews for a specific project
     */
    public function getProjectReviews($projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        
        $reviews = Review::with(['reviewer', 'reviewee'])
            ->forProject($projectId)
            ->visible()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'reviews' => $reviews,
            'project' => $project,
        ]);
    }

    /**
     * Add a reply to a review (gig workers only)
     */
    public function addReply(Request $request, $reviewId): JsonResponse
    {
        $request->validate([
            'reply' => 'required|string|max:500',
        ]);

        $user = Auth::user();
        $review = Review::findOrFail($reviewId);

        // Check if user can reply to this review
        if ($review->reviewee_id !== $user->id || !$review->canReply()) {
            return response()->json([
                'message' => 'You are not authorized to reply to this review.'
            ], 403);
        }

        $review->addReply($request->reply);

        return response()->json([
            'message' => 'Reply added successfully.',
            'review' => $review->fresh()->load(['reviewer', 'reviewee', 'project']),
        ]);
    }

    /**
     * Get pending reviews for the authenticated user
     */
    public function getPendingReviews(): JsonResponse
    {
        $user = Auth::user();
        
        // Get projects where user needs to submit reviews
        $pendingReviews = [];
        
        if ($user->isEmployer()) {
            // Employer needs to review completed projects
            $projects = Project::where('employer_id', $user->id)
                ->where('status', 'completed')
                ->with(['gigWorker'])
                ->get();
                
            foreach ($projects as $project) {
                $existingReview = Review::where('project_id', $project->id)
                    ->where('reviewer_id', $user->id)
                    ->where('reviewee_id', $project->gig_worker_id)
                    ->first();
                    
                if (!$existingReview) {
                    $pendingReviews[] = [
                        'project' => $project,
                        'reviewee' => $project->gigWorker,
                        'type' => 'gig_worker',
                    ];
                }
            }
        } else {
            // Gig worker needs to review completed projects
            $projects = Project::where('gig_worker_id', $user->id)
                ->where('status', 'completed')
                ->with(['employer'])
                ->get();
                
            foreach ($projects as $project) {
                $existingReview = Review::where('project_id', $project->id)
                    ->where('reviewer_id', $user->id)
                    ->where('reviewee_id', $project->employer_id)
                    ->first();
                    
                if (!$existingReview) {
                    $pendingReviews[] = [
                        'project' => $project,
                        'reviewee' => $project->employer,
                        'type' => 'employer',
                    ];
                }
            }
        }

        return response()->json([
            'pending_reviews' => $pendingReviews,
            'count' => count($pendingReviews),
        ]);
    }

    /**
     * Process reviews that have passed their visibility deadline
     */
    public function processExpiredReviews(): JsonResponse
    {
        $expiredReviews = Review::pendingVisibility()->get();
        
        foreach ($expiredReviews as $review) {
            $review->makePublic();
        }

        return response()->json([
            'message' => "Processed {$expiredReviews->count()} expired reviews.",
            'processed_count' => $expiredReviews->count(),
        ]);
    }

    /**
     * Get review statistics for a user
     */
    public function getUserReviewStats($userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        
        $receivedReviews = Review::forUser($userId)->visible();
        $givenReviews = Review::byUser($userId)->visible();
        
        $stats = [
            'received' => [
                'total' => $receivedReviews->count(),
                'average_rating' => round($receivedReviews->avg('rating'), 2),
                'rating_distribution' => [
                    '5' => $receivedReviews->where('rating', 5)->count(),
                    '4' => $receivedReviews->where('rating', 4)->count(),
                    '3' => $receivedReviews->where('rating', 3)->count(),
                    '2' => $receivedReviews->where('rating', 2)->count(),
                    '1' => $receivedReviews->where('rating', 1)->count(),
                ],
                'positive_percentage' => $receivedReviews->count() > 0 
                    ? round(($receivedReviews->where('rating', '>=', 4)->count() / $receivedReviews->count()) * 100, 1)
                    : 0,
            ],
            'given' => [
                'total' => $givenReviews->count(),
                'average_rating' => round($givenReviews->avg('rating'), 2),
            ],
        ];

        return response()->json([
            'user' => $user,
            'stats' => $stats,
        ]);
    }

    /**
     * Check if a user can review a project
     */
    private function canUserReviewProject(User $user, Project $project, User $reviewee): bool
    {
        // Project must be completed
        if ($project->status !== 'completed') {
            return false;
        }

        // User must be either the employer or gig worker of the project
        if ($user->id !== $project->employer_id && $user->id !== $project->gig_worker_id) {
            return false;
        }

        // Reviewee must be the other party in the project
        if ($user->id === $project->employer_id) {
            return $reviewee->id === $project->gig_worker_id;
        } else {
            return $reviewee->id === $project->employer_id;
        }
    }

    /**
     * Handle mutual review completion logic
     */
    private function handleMutualReviewCompletion(Review $review): void
    {
        $counterpartReview = $review->getCounterpartReview();
        
        if ($counterpartReview) {
            // Both reviews exist, mark them as mutually completed and make visible
            $review->markMutualReviewCompleted();
            $review->makePublic();
            $counterpartReview->makePublic();
        }
    }
}
