<?php

use App\Http\Controllers\BidController;
use App\Http\Controllers\GigJobController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FreelancerOnboardingController;
use App\Http\Controllers\ClientOnboardingController;
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
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Public job listings
Route::get('/jobs', [GigJobController::class, 'index'])->name('jobs.index');
Route::get('/jobs/{job}', [GigJobController::class, 'show'])->name('jobs.show');

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

    // Job management routes (for employers)
    Route::get('/jobs/create', [GigJobController::class, 'create'])->name('jobs.create');
    Route::post('/jobs', [GigJobController::class, 'store'])->name('jobs.store');
    Route::get('/jobs/{job}/edit', [GigJobController::class, 'edit'])->name('jobs.edit');
    Route::patch('/jobs/{job}', [GigJobController::class, 'update'])->name('jobs.update');
    Route::delete('/jobs/{job}', [GigJobController::class, 'destroy'])->name('jobs.destroy');

    // Bid routes
    Route::get('/bids', [BidController::class, 'index'])->name('bids.index');
    Route::post('/bids', [BidController::class, 'store'])->name('bids.store');
    Route::get('/bids/{bid}', [BidController::class, 'show'])->name('bids.show');
    Route::patch('/bids/{bid}', [BidController::class, 'update'])->name('bids.update');
    Route::delete('/bids/{bid}', [BidController::class, 'destroy'])->name('bids.destroy');
});

require __DIR__.'/auth.php';
