<?php

namespace App\Http\Controllers;

use App\Services\MatchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Http;

class AIRecommendationController extends Controller
{
    private MatchService $matchService;

    public function __construct(MatchService $matchService)
    {
        $this->matchService = $matchService;
    }

    /**
     * Show AI recommendations page
     */
    public function index(): Response
    {
        $user = auth()->user();
        $recommendations = [];

        if ($user->user_type === 'freelancer') {
            $recommendations = $this->matchService->getRecommendedJobs($user);
        } else {
            // For employers, get matching freelancers for their active jobs
            $activeJobs = $user->jobs()->where('status', 'open')->get();
            foreach ($activeJobs as $job) {
                $recommendations[$job->id] = [
                    'job' => $job,
                    'matches' => $this->matchService->getJobMatches($job)
                ];
            }
        }

        return Inertia::render('AI/Recommendations', [
            'recommendations' => $recommendations,
            'userType' => $user->user_type
        ]);
    }

    /**
     * Test OpenRouter API connectivity
     */
    public function testConnection()
    {
        try {
            $apiKey = config('services.openrouter.api_key');
            $certPath = base_path('cacert.pem');
            
            if (empty($apiKey)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OpenRouter API key is not configured in .env file'
                ]);
            }

            $response = Http::withToken($apiKey)
                ->withOptions([
                    'verify' => $certPath
                ])
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'WorkWise Job Matching'
                ])
                ->post(config('services.openrouter.base_url') . '/chat/completions', [
                    'model' => config('services.openrouter.model'),
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                        ['role' => 'user', 'content' => 'Hi, this is a test message.']
                    ]
                ]);

            $data = $response->json();
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'API Connection Successful',
                    'data' => $data
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API request failed',
                'error' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'API Connection Failed',
                'error' => $e->getMessage()
            ]);
        }
    }
} 