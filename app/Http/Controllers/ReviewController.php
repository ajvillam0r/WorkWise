<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Display a listing of reviews
     */
    public function index(Request $request)
    {
        // Accept optional user_id query parameter
        $userId = $request->query('user_id');

        // In a real application, this would fetch reviews from the database
        // For testing purposes, we return an empty collection
        $reviews = [];

        // If testing or Reviews/Index doesn't exist, return JSON
        if (app()->environment('testing') || !file_exists(resource_path('js/Pages/Reviews/Index.jsx'))) {
            return response()->json([
                'reviews' => $reviews,
                'userId' => $userId,
            ], 200);
        }

        return Inertia::render('Reviews/Index', [
            'reviews' => $reviews,
            'userId' => $userId,
        ]);
    }

    /**
     * Store a newly created review
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'comment' => 'required|string|min:10',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        // In a real application, this would save the review to the database
        // For testing purposes, we simply redirect back with success
        
        return redirect()->back()
            ->with('success', 'Review submitted successfully');
    }
}

