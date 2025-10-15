<?php

use App\Http\Controllers\BidController;
use App\Http\Controllers\GigJobController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\GigWorkerOnboardingController;
use App\Http\Controllers\EmployerOnboardingController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\AIRecommendationController;
use App\Http\Controllers\EmployerWalletController;
use App\Http\Controllers\GigWorkerWalletController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AdminAnalyticsController;
use App\Http\Controllers\AdminVerificationController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminFraudController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\EmployerDashboardController;
use App\Http\Controllers\GigWorkerDashboardController;
use App\Http\Controllers\Api\GigWorkerController;
use App\Http\Controllers\DebugController;
use App\Http\Controllers\ErrorLogController;
use App\Http\Controllers\SimpleTestController;
use App\Http\Controllers\FreelancerController;
use App\Http\Controllers\JobInvitationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

Route::get('/', function () {
    // Check if user is authenticated
    if (Auth::check()) {
        $user = Auth::user();

        // Redirect admin users to admin dashboard
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        // Redirect gig workers to jobs page
        if ($user->user_type === 'gig_worker') {
            return redirect()->route('jobs.index');
        }

        // For other authenticated users, show welcome page
        return Inertia::render('Welcome', [
            'canLogin' => false,
            'canRegister' => false,
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
        ]);
    }

    return Inertia::render('Welcome', [
        'canLogin' => true,
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = Auth::user();

    if (!$user) {
        Log::error('Dashboard route accessed - User is null');
        return redirect('/login');
    }

    // Redirect admin users to admin dashboard
    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }

    // Redirect employers to employer dashboard
    if ($user->user_type === 'employer') {
        return redirect()->route('employer.dashboard');
    }

    // Redirect gig workers to their dashboard
    if ($user->user_type === 'gig_worker') {
        return redirect()->route('gig-worker.dashboard');
    }

    Log::info('Dashboard route accessed', ['user' => $user->toArray()]);

    return Inertia::render('Dashboard', [
        'user' => $user,
        'debug' => [
            'authenticated' => Auth::check(),
            'user_id' => $user->id,
            'user_type' => $user->user_type,
        ]
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

// Gig Worker Dashboard Route
Route::get('/gig-worker/dashboard', [GigWorkerDashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('gig-worker.dashboard');

// Job Invitations Route
Route::get('/gig-worker/invitations', function () {
    return Inertia::render('JobInvitations', [
        'auth' => [
            'user' => Auth::user()
        ],
        'jobInvitations' => []
    ]);
})->middleware(['auth', 'verified'])->name('gig-worker.invitations');

// Browse Gig Workers Route
Route::get('/gig-workers', function () {
    // Get basic stats for the page
    $totalFreelancers = \App\Models\User::where('user_type', 'gig_worker')
        ->where('profile_completed', true)
        ->where('profile_status', 'approved')
        ->count();
    
    return Inertia::render('BrowseGigWorkers', [
        'auth' => [
            'user' => Auth::user()
        ],
        'stats' => [
            'total_gig_workers' => $totalFreelancers
        ]
    ]);
})->middleware(['auth', 'verified'])->name('browse.gig-workers');

// Employer Dashboard Route
Route::get('/employer/dashboard', [EmployerDashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('employer.dashboard');

// Search Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api/search', [EmployerDashboardController::class, 'search'])->name('api.search');
    Route::get('/api/search/suggestions', [EmployerDashboardController::class, 'getSuggestions'])->name('api.search.suggestions');
    Route::get('/api/search/filters', [EmployerDashboardController::class, 'getFilters'])->name('api.search.filters');
});

// Export Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api/export', [EmployerDashboardController::class, 'export'])->name('api.export');
    Route::get('/api/export/formats', [EmployerDashboardController::class, 'getExportFormats'])->name('api.export.formats');
    Route::get('/api/export/preview', [EmployerDashboardController::class, 'getExportPreview'])->name('api.export.preview');
});

// Main dashboard route
Route::get('/dashboard', function () {
    $user = Auth::user();
    
    if (!$user) {
        return redirect('/login');
    }
    
    // Redirect based on user type
    if ($user->user_type === 'admin') {
        return redirect()->route('admin.dashboard');
    } elseif ($user->user_type === 'gig_worker') {
        return redirect()->route('gig-worker.dashboard');
    } elseif ($user->user_type === 'employer') {
        return redirect()->route('employer.dashboard');
    }
    
    // Default fallback
    return redirect('/jobs');
})->middleware(['auth'])->name('dashboard');

// Protected job listings - requires authentication
Route::get('/jobs', [GigJobController::class, 'index'])->middleware(['auth.redirect'])->name('jobs.index');

Route::middleware('auth')->group(function () {
    // Onboarding routes
    Route::get('/onboarding/gig-worker', [GigWorkerOnboardingController::class, 'show'])->name('gig-worker.onboarding');
Route::post('/onboarding/gig-worker', [GigWorkerOnboardingController::class, 'store']);
Route::post('/onboarding/gig-worker/skip', [GigWorkerOnboardingController::class, 'skip'])->name('gig-worker.onboarding.skip');

    Route::get('/onboarding/employer', [EmployerOnboardingController::class, 'show'])->name('employer.onboarding');
    Route::post('/onboarding/employer', [EmployerOnboardingController::class, 'store']);
    Route::post('/onboarding/employer/skip', [EmployerOnboardingController::class, 'skip'])->name('employer.onboarding.skip');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Employer-only routes (job management)
    Route::middleware(['employer'])->group(function () {
        Route::get('/jobs/create', [GigJobController::class, 'create'])->name('jobs.create');
        Route::post('/jobs', [GigJobController::class, 'store'])->name('jobs.store');
        Route::get('/jobs/{job}/edit', [GigJobController::class, 'edit'])->name('jobs.edit');
        Route::patch('/jobs/{job}', [GigJobController::class, 'update'])->name('jobs.update');
        Route::delete('/jobs/{job}', [GigJobController::class, 'destroy'])->name('jobs.destroy');
    });

    // Job show route (public for authenticated users)
    Route::get('/jobs/{job}', [GigJobController::class, 'show'])->name('jobs.show');

    // Gig Worker-only routes (bidding)
    Route::middleware(['gig_worker'])->group(function () {
        Route::post('/bids', [BidController::class, 'store'])->name('bids.store');
    });

    // Bid routes (mixed permissions)
    Route::get('/bids', [BidController::class, 'index'])->name('bids.index');

    // Additional feature routes

    // Message routes
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/users', [MessageController::class, 'getUsers'])->name('messages.users');
    Route::get('/messages/{user}', [MessageController::class, 'conversation'])->name('messages.conversation');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
    Route::get('/messages/unread/count', [MessageController::class, 'unreadCount'])->name('messages.unread.count');
    Route::patch('/messages/{message}/read', [MessageController::class, 'markAsRead'])->name('messages.read');
    Route::get('/messages/recent/conversations', [MessageController::class, 'getRecentConversations'])->name('messages.recent');
    Route::get('/messages/unread/count', [MessageController::class, 'getUnreadCount'])->name('messages.unread.count');
    Route::get('/messages/conversation/{userId}', [MessageController::class, 'getConversation'])->name('messages.getConversation');
    Route::patch('/messages/conversation/{userId}/read', [MessageController::class, 'markConversationAsRead'])->name('messages.conversation.read');
    Route::patch('/messages/conversation/{conversationId}/status', [MessageController::class, 'updateConversationStatus'])->name('messages.conversation.status');
    Route::get('/messages/{user}/new', [MessageController::class, 'getNewMessages'])->name('messages.new');

    Route::get('/reports', function () {
        return Inertia::render('Reports/Index');
    })->name('reports.index');

    // Transaction reports routes
    Route::get('/reports/transactions', [ReportController::class, 'transactions'])->name('reports.transactions');
    Route::get('/reports/transactions/export', [ReportController::class, 'exportTransactions'])->name('reports.transactions.export');

    // Bid management routes - mixed permissions
    Route::get('/bids/{bid}', [BidController::class, 'show'])->name('bids.show');

    // Employer-only bid actions (accepting, updating status)
    Route::middleware(['employer'])->group(function () {
        Route::patch('/bids/{bid}', [BidController::class, 'update'])->name('bids.update');
    });

    // Gig Worker-only bid actions (updating, deleting own bids)
    Route::middleware(['gig_worker'])->group(function () {
        Route::patch('/bids/{bid}/status', [BidController::class, 'updateStatus'])->name('bids.updateStatus');
        Route::delete('/bids/{bid}', [BidController::class, 'destroy'])->name('bids.destroy');
    });

    // Project routes - mixed permissions
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');

    // Employer-only project actions
    Route::middleware(['employer'])->group(function () {
        Route::post('/projects/{project}/approve', [ProjectController::class, 'approve'])->name('projects.approve');
        Route::post('/projects/{project}/request-revision', [ProjectController::class, 'requestRevision'])->name('projects.requestRevision');
        Route::post('/projects/{project}/cancel', [ProjectController::class, 'cancel'])->name('projects.cancel');
        Route::post('/projects/{project}/payment/release', [PaymentController::class, 'releasePayment'])->name('payment.release');
        Route::post('/projects/{project}/payment/refund', [PaymentController::class, 'refundPayment'])->name('payment.refund');
    });

    // Gig Worker-only project actions
    Route::middleware(['gig_worker'])->group(function () {
        Route::post('/projects/{project}/complete', [ProjectController::class, 'complete'])->name('projects.complete');
        Route::post('/projects/{project}/review', [ProjectController::class, 'review'])->name('projects.review');
    });

    // Contract routes - mixed permissions
    Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
    Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
    Route::get('/contracts/{contract}/pdf', [ContractController::class, 'downloadPdf'])->name('contracts.downloadPdf');

    // Contract signing (both roles can sign)
    Route::get('/contracts/{contract}/sign', [ContractController::class, 'sign'])->name('contracts.sign');
    Route::post('/contracts/{contract}/signature', [ContractController::class, 'processSignature'])->name('contracts.processSignature');

    // Contract cancellation (both roles can cancel)
    Route::post('/contracts/{contract}/cancel', [ContractController::class, 'cancel'])->name('contracts.cancel');

    // Payment routes - mixed permissions
    Route::get('/projects/{project}/payment', [PaymentController::class, 'show'])->name('payment.show');
    Route::post('/projects/{project}/payment/intent', [PaymentController::class, 'createPaymentIntent'])->name('payment.intent');
    Route::post('/payment/confirm', [PaymentController::class, 'confirmPayment'])->name('payment.confirm');
    Route::get('/payment/history', [PaymentController::class, 'history'])->name('payment.history');
    Route::get('/transactions/{transaction}', [PaymentController::class, 'transaction'])->name('transactions.show');

    // AI Recommendation Routes
    Route::get('/ai/recommendations', [AIRecommendationController::class, 'index'])->name('ai.recommendations');

    // Message attachment download
    Route::get('/messages/{message}/download', [MessageController::class, 'downloadAttachment'])->name('messages.download');

    // Analytics routes
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('/analytics/earnings', [AnalyticsController::class, 'earnings'])->name('analytics.earnings');
    Route::get('/analytics/projects', [AnalyticsController::class, 'projects'])->name('analytics.projects');
    Route::get('/analytics/performance', [AnalyticsController::class, 'performance'])->name('analytics.performance');
    Route::get('/analytics/export', [AnalyticsController::class, 'export'])->name('analytics.export');

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/api', [NotificationController::class, 'getNotifications'])->name('notifications.api');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])->name('notifications.unreadCount');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Job Invitation routes
    Route::post('/job-invitations/send', [JobInvitationController::class, 'sendInvitation'])->name('job-invitations.send');
    Route::get('/job-invitations', [JobInvitationController::class, 'getInvitations'])->name('job-invitations.index');
    Route::patch('/job-invitations/{invitation}/respond', [JobInvitationController::class, 'respondToInvitation'])->name('job-invitations.respond');

    // Role-specific wallet routes with proper middleware
    // Employer wallet (deposits and escrow management)
    Route::middleware(['employer'])->prefix('employer/wallet')->name('employer.wallet.')->group(function () {
        Route::get('/', [EmployerWalletController::class, 'index'])->name('index');
        Route::post('/create-intent', [EmployerWalletController::class, 'createIntent'])->name('create-intent');
    });

    // Gig Worker wallet (earnings and withdrawals)
    Route::middleware(['gig_worker'])->prefix('gig-worker/wallet')->name('gig-worker.wallet.')->group(function () {
        Route::get('/', [GigWorkerWalletController::class, 'index'])->name('index');
        Route::post('/withdraw', [GigWorkerWalletController::class, 'requestWithdrawal'])->name('withdraw');
    });

    // Legacy deposits route - redirect to appropriate wallet based on role
    Route::get('/deposits', function () {
        $user = Auth::user();
        if ($user->user_type === 'employer') {
            return redirect()->route('employer.wallet.index');
        } else {
            return redirect()->route('gig-worker.wallet.index');
        }
    })->middleware('auth')->name('deposits.index');

    // Stripe webhooks (unified)
    Route::post('stripe/webhook', [WebhookController::class, 'handleStripeWebhook'])
        ->withoutMiddleware(['auth', 'csrf'])
        ->name('stripe.webhook');
});

// AI Test Connection
Route::match(['GET', 'POST'], '/api/ai/test-connection', [AIRecommendationController::class, 'testConnection'])
    ->withoutMiddleware(['web', 'csrf']);

// System-wide unique skills endpoint for filters
Route::middleware(['auth'])->get('/api/ai-recommendation/skills', [AIRecommendationController::class, 'allSkills'])->name('ai.skills');

// Freelancer Profile Routes
Route::middleware(['auth'])->group(function () {
    // Public freelancer profile (for employers to view)
    Route::get('/freelancer/{freelancer}', [FreelancerController::class, 'show'])->name('freelancer.profile.show');
    
    // Freelancer dashboard (for freelancers to manage their profile)
    Route::get('/freelancer/dashboard', [FreelancerController::class, 'dashboard'])->name('freelancer.profile.dashboard');
    
    // Profile management
    Route::patch('/freelancer/profile', [FreelancerController::class, 'updateProfile'])->name('freelancer.profile.update');
    Route::post('/freelancer/avatar', [FreelancerController::class, 'uploadAvatar'])->name('freelancer.avatar.upload');
    
    // Experience management
    Route::post('/freelancer/experience', [FreelancerController::class, 'storeExperience'])->name('freelancer.experience.store');
    Route::patch('/freelancer/experience/{experience}', [FreelancerController::class, 'updateExperience'])->name('freelancer.experience.update');
    Route::delete('/freelancer/experience/{experience}', [FreelancerController::class, 'destroyExperience'])->name('freelancer.experience.destroy');
    
    // Education management
    Route::post('/freelancer/education', [FreelancerController::class, 'storeEducation'])->name('freelancer.education.store');
    Route::patch('/freelancer/education/{education}', [FreelancerController::class, 'updateEducation'])->name('freelancer.education.update');
    Route::delete('/freelancer/education/{education}', [FreelancerController::class, 'destroyEducation'])->name('freelancer.education.destroy');
    
    // Skills management
    Route::post('/freelancer/skill', [FreelancerController::class, 'storeSkill'])->name('freelancer.skill.store');
    Route::patch('/freelancer/skill/{skill}', [FreelancerController::class, 'updateSkill'])->name('freelancer.skill.update');
    Route::delete('/freelancer/skill/{skill}', [FreelancerController::class, 'destroySkill'])->name('freelancer.skill.destroy');
    
    // Portfolio management
    Route::get('/freelancer/portfolios', [FreelancerController::class, 'getPortfolios'])->name('freelancer.portfolios.index');
    Route::post('/freelancer/portfolio', [FreelancerController::class, 'storePortfolio'])->name('freelancer.portfolio.store');
    Route::patch('/freelancer/portfolio/{portfolio}', [FreelancerController::class, 'updatePortfolio'])->name('freelancer.portfolio.update');
    Route::delete('/freelancer/portfolio/{portfolio}', [FreelancerController::class, 'deletePortfolio'])->name('freelancer.portfolio.destroy');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Admin dashboard
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard.alt');

    // User management
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/users/{user}', [AdminController::class, 'showUser'])->name('users.show');
    Route::patch('/users/{user}/status', [AdminController::class, 'updateUserStatus'])->name('users.updateStatus');
    Route::patch('/users/{user}/suspend', [AdminController::class, 'suspendUser'])->name('users.suspend');
    Route::patch('/users/{user}/activate', [AdminController::class, 'activateUser'])->name('users.activate');
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('users.delete');

    // Bulk user operations
    Route::post('/users/bulk-approve', [AdminController::class, 'bulkApprove'])->name('users.bulkApprove');
    Route::post('/users/bulk-suspend', [AdminController::class, 'bulkSuspend'])->name('users.bulkSuspend');
    Route::post('/users/bulk-delete', [AdminController::class, 'bulkDelete'])->name('users.bulkDelete');

    // User analytics and export
    Route::get('/users/export', [AdminController::class, 'exportUsers'])->name('users.export');
    Route::get('/users/analytics', [AdminController::class, 'userAnalytics'])->name('users.analytics');

    // Projects management
    Route::get('/projects', [AdminController::class, 'projects'])->name('projects');
    Route::get('/projects/export', [AdminController::class, 'exportProjects'])->name('projects.export');

    // Payments management
    Route::get('/payments', [AdminController::class, 'payments'])->name('payments');
    Route::get('/payments/export', [AdminController::class, 'exportPayments'])->name('payments.export');

    // Report management
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports');
    Route::get('/reports/{report}', [AdminReportController::class, 'show'])->name('reports.show');
    Route::patch('/reports/{report}/status', [AdminReportController::class, 'updateStatus'])->name('reports.updateStatus');
    Route::get('/reports-analytics', [AdminReportController::class, 'fraudAnalytics'])->name('reports.analytics');
    Route::patch('/reports/bulk-update', [AdminReportController::class, 'bulkUpdate'])->name('reports.bulkUpdate');

    // Analytics
    Route::get('/analytics', [AdminAnalyticsController::class, 'overview'])->name('analytics.overview');
    Route::get('/analytics/users', [AdminAnalyticsController::class, 'userGrowth'])->name('analytics.users');
    Route::get('/analytics/financial', [AdminAnalyticsController::class, 'financial'])->name('analytics.financial');
    Route::get('/analytics/projects', [AdminAnalyticsController::class, 'projects'])->name('analytics.projects');
    Route::get('/analytics/export', [AdminAnalyticsController::class, 'export'])->name('analytics.export');

    // User Verifications
    Route::get('/verifications', [AdminVerificationController::class, 'index'])->name('verifications');
    Route::get('/verifications/{verification}', [AdminVerificationController::class, 'show'])->name('verifications.show');
    Route::patch('/verifications/{verification}/approve', [AdminVerificationController::class, 'approve'])->name('verifications.approve');
    Route::patch('/verifications/{verification}/reject', [AdminVerificationController::class, 'reject'])->name('verifications.reject');
    Route::patch('/verifications/{verification}/request-info', [AdminVerificationController::class, 'requestInfo'])->name('verifications.requestInfo');
    Route::patch('/verifications/bulk-approve', [AdminVerificationController::class, 'bulkApprove'])->name('verifications.bulkApprove');
    Route::patch('/verifications/bulk-reject', [AdminVerificationController::class, 'bulkReject'])->name('verifications.bulkReject');
    Route::get('/verifications-analytics', [AdminVerificationController::class, 'analytics'])->name('verifications.analytics');

    // Settings
    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings');
    Route::patch('/settings/platform', [AdminSettingsController::class, 'updatePlatform'])->name('settings.platform');
    Route::patch('/settings/fees', [AdminSettingsController::class, 'updateFees'])->name('settings.fees');
    Route::patch('/settings/limits', [AdminSettingsController::class, 'updateLimits'])->name('settings.limits');
    Route::patch('/settings/notifications', [AdminSettingsController::class, 'updateNotifications'])->name('settings.notifications');
    Route::patch('/settings/security', [AdminSettingsController::class, 'updateSecurity'])->name('settings.security');
    Route::post('/settings/clear-cache', [AdminSettingsController::class, 'clearCache'])->name('settings.clearCache');
    Route::get('/settings/export', [AdminSettingsController::class, 'exportSettings'])->name('settings.export');
    Route::post('/settings/import', [AdminSettingsController::class, 'importSettings'])->name('settings.import');
    Route::get('/system-health', [AdminSettingsController::class, 'systemHealth'])->name('settings.systemHealth');

    // Admin-only logout endpoint
    Route::post('/admin/logout', [AuthenticatedSessionController::class, 'destroy'])->name('admin.logout');

    // Fraud Detection System
    Route::prefix('fraud')->name('fraud.')->group(function () {
        // Fraud detection dashboard
        Route::get('/', [AdminFraudController::class, 'dashboard'])->name('dashboard');
        Route::get('/dashboard', [AdminFraudController::class, 'dashboard'])->name('dashboard.alt');

        // Fraud cases management
        Route::get('/cases', [AdminFraudController::class, 'cases'])->name('cases');
        Route::get('/cases/{case}', [AdminFraudController::class, 'showCase'])->name('cases.show');
        Route::patch('/cases/{case}/status', [AdminFraudController::class, 'updateCaseStatus'])->name('cases.updateStatus');
        Route::patch('/cases/{case}/assign', [AdminFraudController::class, 'assignCase'])->name('cases.assign');

        // Fraud alerts management
        Route::get('/alerts', [AdminFraudController::class, 'alerts'])->name('alerts');
        Route::get('/alerts/{alert}', [AdminFraudController::class, 'showAlert'])->name('alerts.show');
        Route::patch('/alerts/{alert}/acknowledge', [AdminFraudController::class, 'acknowledgeAlert'])->name('alerts.acknowledge');
        Route::patch('/alerts/{alert}/resolve', [AdminFraudController::class, 'resolveAlert'])->name('alerts.resolve');
        Route::patch('/alerts/{alert}/false-positive', [AdminFraudController::class, 'markAlertFalsePositive'])->name('alerts.falsePositive');

        // Fraud detection rules
        Route::get('/rules', [AdminFraudController::class, 'rules'])->name('rules');
        Route::get('/rules/{rule}', [AdminFraudController::class, 'showRule'])->name('rules.show');
        Route::patch('/rules/{rule}/toggle', [AdminFraudController::class, 'toggleRule'])->name('rules.toggle');

        // Audit logs
        Route::get('/audit-logs', [AdminFraudController::class, 'auditLogs'])->name('auditLogs');
        Route::get('/audit-logs/{log}', [AdminFraudController::class, 'showAuditLog'])->name('auditLogs.show');
        Route::post('/audit-logs/{log}/verify', [AdminFraudController::class, 'verifyAuditLog'])->name('auditLogs.verify');

        // Fraud analytics and reporting
        Route::get('/analytics', [AdminFraudController::class, 'analytics'])->name('analytics');
    });
});

// Gig Worker Profile Routes
Route::get('/gig-worker/{id}/profile', [GigWorkerController::class, 'showProfile'])->name('gig-worker.profile');

// Temporary API routes via web (for debugging)
Route::prefix('api/gig-workers')->group(function () {
    Route::get('/', [GigWorkerController::class, 'index']);
    Route::get('/skills/available', [GigWorkerController::class, 'getAvailableSkills']);
    Route::get('/stats/overview', [GigWorkerController::class, 'getStats']);
    Route::get('/{id}', [GigWorkerController::class, 'show']);
});

// Debug routes for Railway deployment issues
Route::get('/debug/railway', [DebugController::class, 'railwayDiagnosis']);
Route::get('/debug/gig-worker-dashboard', [DebugController::class, 'testGigWorkerDashboard']);
Route::get('/debug/error-log', [ErrorLogController::class, 'captureGigWorkerError']);
Route::get('/debug/simple-test', [SimpleTestController::class, 'basicTest']);
Route::get('/debug/test-model', [SimpleTestController::class, 'testModel']);

require __DIR__.'/auth.php';
