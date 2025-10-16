<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\AIRecommendationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\GigWorkerController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\EmployerDashboardController;
use App\Http\Controllers\JobInvitationController;
use App\Http\Controllers\IdentityVerificationController;
use App\Http\Controllers\StripeIdentityWebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authenticated API Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/projects/{project}/complete', [ProjectController::class, 'complete']);
    
    // User Routes
    Route::get('/users/{id}', [UserController::class, 'show']);
    
    // Review Routes
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class, 'store']);
        Route::get('/pending', [ReviewController::class, 'getPendingReviews']);
        Route::post('/{review}/reply', [ReviewController::class, 'addReply']);
        Route::post('/process-expired', [ReviewController::class, 'processExpiredReviews']);
    });
    
    // User-specific review routes
    Route::get('/users/{user}/reviews', [ReviewController::class, 'getUserReviews']);
    Route::get('/users/{user}/reviews/stats', [ReviewController::class, 'getUserReviewStats']);

    // Project routes
    Route::apiResource('projects', ProjectController::class);

    // Employer routes
    Route::get('/employer/jobs', function (Request $request) {
        $user = $request->user();
        
        if ($user->user_type !== 'employer') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $jobs = \App\Models\GigJob::where('employer_id', $user->id)
            ->where('status', 'open')
            ->select('id', 'title', 'budget_type', 'budget_min', 'budget_max')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['data' => $jobs]);
    });

    // Job Invitation routes
    Route::post('/job-invitations/send', [JobInvitationController::class, 'sendInvitation']);

    // AI Gig Worker Matching routes
    Route::get('/jobs/{job}/ai-gig-worker-matches', [AIRecommendationController::class, 'getAiGigWorkerMatches']);

    // Gig Worker routes
    Route::prefix('gig-worker')->group(function () {
        Route::get('/job-invitations', [JobInvitationController::class, 'getInvitations']);
        Route::patch('/job-invitations/{invitation}/respond', [JobInvitationController::class, 'respondToInvitation']);
    });

    // Identity Verification routes
    Route::prefix('identity')->group(function () {
        Route::post('/verification/create', [IdentityVerificationController::class, 'createVerificationSession']);
        Route::get('/verification/status', [IdentityVerificationController::class, 'getVerificationStatus']);
    });
});

// Public API Routes (no authentication required)
Route::prefix('gig-workers')->group(function () {
    Route::get('/', [GigWorkerController::class, 'index']);
    Route::get('/skills/available', [GigWorkerController::class, 'getAvailableSkills']);
    Route::get('/stats/overview', [GigWorkerController::class, 'getStats']);
    Route::get('/{id}', [GigWorkerController::class, 'show']);
});

// Public review routes (for viewing reviews without authentication)
Route::prefix('reviews')->group(function () {
    Route::get('/projects/{project}', [ReviewController::class, 'getProjectReviews']);
});

// Public user review routes (for viewing user profiles)
Route::get('/public/users/{user}/reviews', [ReviewController::class, 'getUserReviews']);
Route::get('/public/users/{user}/reviews/stats', [ReviewController::class, 'getUserReviewStats']);

// Stripe webhook
Route::post('/stripe/webhook', [WebhookController::class, 'handleStripeWebhook']);

// Stripe Identity webhook
Route::post('/stripe/identity/webhook', [StripeIdentityWebhookController::class, 'handleWebhook']);

// AI Test Connection
Route::match(['GET', 'POST'], '/ai/test-connection', [AIRecommendationController::class, 'testConnection'])
    ->withoutMiddleware(['web', 'csrf']);

Route::post('/recommendations/skills', [AIRecommendationController::class, 'recommendSkills']);
Route::post('/recommendations/skills/accept', [AIRecommendationController::class, 'acceptSuggestion']);