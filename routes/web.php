<?php

use App\Http\Controllers\BidController;
use App\Http\Controllers\GigJobController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\FreelancerOnboardingController;
use App\Http\Controllers\ClientOnboardingController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\AIRecommendationController;
use App\Http\Controllers\ClientWalletController;
use App\Http\Controllers\FreelancerWalletController;
use App\Http\Controllers\DepositController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = auth()->user();

    if (!$user) {
        \Log::error('Dashboard route accessed - User is null');
    }

    \Log::info('Dashboard route accessed', ['user' => $user ? $user->toArray() : null]);

    return Inertia::render('Dashboard', [
        'user' => $user,
        'debug' => [
            'authenticated' => auth()->check(),
            'user_id' => $user ? $user->id : null,
            'user_type' => $user ? $user->user_type : null,
        ]
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

// Test route to debug - old dashboard
Route::get('/test-dashboard', function () {
    $user = auth()->user();
    return Inertia::render('Dashboard', [
        'user' => $user,
        'debug' => [
            'authenticated' => auth()->check(),
            'user_id' => $user ? $user->id : null,
            'user_type' => $user ? $user->user_type : null,
        ]
    ]);
})->middleware(['auth'])->name('test.dashboard');

// Simple test route
Route::get('/test-simple', function () {
    return Inertia::render('TestDashboard');
})->name('test.simple');

// Public job listings
Route::get('/jobs', [GigJobController::class, 'index'])->name('jobs.index');

// AI Test Connection (public route for testing)
Route::get('/ai/test-connection', [AIRecommendationController::class, 'testConnection'])->name('ai.test-connection');

Route::middleware('auth')->group(function () {
    // Onboarding routes
    Route::get('/onboarding/freelancer', [FreelancerOnboardingController::class, 'show'])->name('freelancer.onboarding');
    Route::post('/onboarding/freelancer', [FreelancerOnboardingController::class, 'store']);

    Route::get('/onboarding/client', [ClientOnboardingController::class, 'show'])->name('client.onboarding');
    Route::post('/onboarding/client', [ClientOnboardingController::class, 'store']);
    Route::post('/onboarding/client/skip', [ClientOnboardingController::class, 'skip'])->name('client.onboarding.skip');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Job management routes (for employers) - specific routes first
    Route::get('/jobs/create', [GigJobController::class, 'create'])->name('jobs.create');
    Route::post('/jobs', [GigJobController::class, 'store'])->name('jobs.store');
    Route::get('/jobs/{job}/edit', [GigJobController::class, 'edit'])->name('jobs.edit');
    Route::patch('/jobs/{job}', [GigJobController::class, 'update'])->name('jobs.update');
    Route::delete('/jobs/{job}', [GigJobController::class, 'destroy'])->name('jobs.destroy');

    // Job show route (after specific routes to avoid conflicts)
    Route::get('/jobs/{job}', [GigJobController::class, 'show'])->name('jobs.show');

    // Bid routes
    Route::get('/bids', [BidController::class, 'index'])->name('bids.index');
    Route::post('/bids', [BidController::class, 'store'])->name('bids.store');

    // Additional feature routes

    Route::get('/messages', function () {
        return Inertia::render('Messages/Index');
    })->name('messages.index');

    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');


    Route::get('/bids/{bid}', [BidController::class, 'show'])->name('bids.show');
    Route::patch('/bids/{bid}', [BidController::class, 'update'])->name('bids.update');
    Route::delete('/bids/{bid}', [BidController::class, 'destroy'])->name('bids.destroy');
    Route::patch('/bids/{bid}/status', [BidController::class, 'updateStatus'])->name('bids.updateStatus');

    // Project routes
    Route::resource('projects', ProjectController::class)->only(['index', 'show']);
    Route::post('/projects/{project}/complete', [ProjectController::class, 'complete'])->name('projects.complete');
    Route::post('/projects/{project}/approve', [ProjectController::class, 'approve'])->name('projects.approve');
    Route::post('/projects/{project}/request-revision', [ProjectController::class, 'requestRevision'])->name('projects.requestRevision');
    Route::post('/projects/{project}/cancel', [ProjectController::class, 'cancel'])->name('projects.cancel');
    Route::post('/projects/{project}/review', [ProjectController::class, 'review'])->name('projects.review');

    // Payment routes
    Route::get('/projects/{project}/payment', [PaymentController::class, 'show'])->name('payment.show');
    Route::post('/projects/{project}/payment/intent', [PaymentController::class, 'createPaymentIntent'])->name('payment.intent');
    Route::post('/payment/confirm', [PaymentController::class, 'confirmPayment'])->name('payment.confirm');
    Route::post('/projects/{project}/payment/release', [PaymentController::class, 'releasePayment'])->name('payment.release');
    Route::post('/projects/{project}/payment/refund', [PaymentController::class, 'refundPayment'])->name('payment.refund');
    Route::get('/payment/history', [PaymentController::class, 'history'])->name('payment.history');
    Route::get('/transactions/{transaction}', [PaymentController::class, 'transaction'])->name('transactions.show');

    // AI Recommendation Routes
    Route::get('/ai/recommendations', [AIRecommendationController::class, 'index'])->name('ai.recommendations');

    // Message attachment download
    Route::get('/messages/{message}/download', [MessageController::class, 'downloadAttachment'])->name('messages.download');

    // Role-specific wallet routes
    Route::middleware(['auth'])->group(function () {
        // Client wallet (deposits and escrow management)
        Route::prefix('client/wallet')->middleware(['auth'])->group(function () {
            Route::get('/', [ClientWalletController::class, 'index'])->name('client.wallet');
            Route::post('/create-intent', [ClientWalletController::class, 'createIntent'])->name('client.wallet.create-intent');
        });

        // Freelancer wallet (earnings and withdrawals)
        Route::prefix('freelancer/wallet')->middleware(['auth'])->group(function () {
            Route::get('/', [FreelancerWalletController::class, 'index'])->name('freelancer.wallet');
            Route::post('/withdraw', [FreelancerWalletController::class, 'requestWithdrawal'])->name('freelancer.wallet.withdraw');
        });

        // Legacy deposits route - redirect to appropriate wallet
        Route::get('/deposits', function () {
            $user = auth()->user();
            if ($user->user_type === 'client') {
                return redirect()->route('client.wallet');
            } else {
                return redirect()->route('freelancer.wallet');
            }
        })->name('deposits.index');
    });

    // Stripe webhooks (unified)
    Route::post('stripe/webhook', [WebhookController::class, 'handleStripeWebhook'])
        ->withoutMiddleware(['auth', 'csrf'])
        ->name('stripe.webhook');
});

require __DIR__.'/auth.php';
