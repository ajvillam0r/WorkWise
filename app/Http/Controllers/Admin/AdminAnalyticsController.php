<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminAnalyticsController extends Controller
{
    public function overview()
    {
        return Inertia::render('Admin/Analytics/Overview', [
            'stats' => []
        ]);
    }

    public function jobsContracts()
    {
        return Inertia::render('Admin/Analytics/JobsContracts', [
            'stats' => []
        ]);
    }

    public function financial()
    {
        return Inertia::render('Admin/Analytics/Financial', [
            'stats' => []
        ]);
    }

    public function quality()
    {
        return Inertia::render('Admin/Analytics/Quality', [
            'stats' => []
        ]);
    }
}
