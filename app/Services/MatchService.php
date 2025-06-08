<?php

namespace App\Services;

use App\Models\GigJob;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class MatchService
{
    private ?string $apiKey;
    private string $model;
    private string $baseUrl;
    private string $certPath;
    private bool $isConfigured;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key');
        $this->model = config('services.openrouter.model', 'meta-llama/llama-4-scout:free');
        $this->baseUrl = config('services.openrouter.base_url');
        $this->certPath = base_path('cacert.pem');
        $this->isConfigured = !empty($this->apiKey);

        if (!$this->isConfigured) {
            Log::warning('OpenRouter API key is not configured. AI matching will use fallback mode.');
        }
    }

    /**
     * Get match score between a job and a freelancer using keyword matching as fallback
     */
    private function getFallbackMatch(GigJob $job, User $freelancer): array
    {
        $score = 0;
        $reasons = [];

        // Compare required skills
        $freelancerSkills = array_map('strtolower', $freelancer->skills ?? []);
        $jobSkills = array_map('strtolower', $job->required_skills ?? []);
        
        $matchingSkills = array_intersect($freelancerSkills, $jobSkills);
        $skillScore = count($matchingSkills) > 0 
            ? (count($matchingSkills) / count($jobSkills)) * 100 
            : 0;

        $score += $skillScore * 0.6; // Skills are 60% of the score

        // Compare experience level
        $experienceLevels = ['beginner' => 1, 'intermediate' => 2, 'expert' => 3];
        $jobLevel = $experienceLevels[$job->experience_level] ?? 1;
        $freelancerLevel = $experienceLevels[$freelancer->expertise_level] ?? 1;
        
        $levelDiff = abs($jobLevel - $freelancerLevel);
        $experienceScore = (3 - $levelDiff) * 33.33; // Convert to percentage
        $score += $experienceScore * 0.4; // Experience is 40% of the score

        // Build reason text
        if (count($matchingSkills) > 0) {
            $reasons[] = "Matches " . count($matchingSkills) . " required skills: " . implode(', ', $matchingSkills);
        }
        if ($levelDiff === 0) {
            $reasons[] = "Experience level matches perfectly";
        } elseif ($levelDiff === 1) {
            $reasons[] = "Experience level is close to requirements";
        }

        return [
            'score' => round($score),
            'reason' => count($reasons) > 0 
                ? implode('. ', $reasons) 
                : 'Basic match based on available profile data',
            'success' => true
        ];
    }

    /**
     * Get match score between a job and a freelancer
     */
    public function getJobMatch(GigJob $job, User $freelancer): array
    {
        // If OpenRouter is not configured, use fallback matching
        if (!$this->isConfigured) {
            return $this->getFallbackMatch($job, $freelancer);
        }

        // Generate cache key
        $cacheKey = "match_score_{$job->id}_{$freelancer->id}";

        // Check cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            // Prepare job description
            $jobText = "Job Title: {$job->title}\n" .
                      "Description: {$job->description}\n" .
                      "Required Skills: " . implode(', ', $job->required_skills) . "\n" .
                      "Experience Level: {$job->experience_level}\n" .
                      "Budget: {$job->budget_min} - {$job->budget_max} {$job->budget_type}";

            // Prepare freelancer profile
            $freelancerText = "Name: {$freelancer->name}\n" .
                            "Skills: " . implode(', ', $freelancer->skills ?? []) . "\n" .
                            "Experience: {$freelancer->experience_years} years\n" .
                            "Expertise Level: {$freelancer->expertise_level}";

            // Make API call to OpenRouter
            $response = Http::withToken($this->apiKey)
                ->withOptions([
                    'verify' => $this->certPath
                ])
                ->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => 'WorkWise Job Matching'
                ])
                ->post($this->baseUrl . '/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expert job matching assistant that analyzes job requirements and freelancer profiles to determine compatibility. Provide a match score from 1-100 and a concise explanation focusing on key matching factors like skills, experience level, and expertise. Consider both technical qualifications and seniority requirements. Format your response exactly as: "Score: X\nReason: [Brief explanation focusing on strongest matching points or key mismatches]"'
                        ],
                        [
                            'role' => 'user',
                            'content' => "Analyze this job post:\n{$jobText}\n\nWith this freelancer profile:\n{$freelancerText}\n\nProvide a match score and brief explanation."
                        ]
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 200
                ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'];
                
                // Parse the response
                preg_match('/Score: (\d+)/', $content, $scoreMatch);
                preg_match('/Reason: (.+)/', $content, $reasonMatch);

                $result = [
                    'score' => (int) ($scoreMatch[1] ?? 0),
                    'reason' => $reasonMatch[1] ?? 'No explanation provided',
                    'success' => true
                ];

                // Cache the result for 24 hours
                Cache::put($cacheKey, $result, now()->addHours(24));

                return $result;
            }

            throw new \Exception('Failed to get response from OpenRouter API');

        } catch (\Exception $e) {
            Log::error('AI Match Error', [
                'job_id' => $job->id,
                'freelancer_id' => $freelancer->id,
                'error' => $e->getMessage()
            ]);

            // Use fallback matching if AI fails
            return $this->getFallbackMatch($job, $freelancer);
        }
    }

    /**
     * Get matches for a specific job
     */
    public function getJobMatches(GigJob $job, int $limit = 5): array
    {
        $freelancers = User::where('user_type', 'freelancer')
            ->where('status', 'active')
            ->get();

        $matches = [];
        foreach ($freelancers as $freelancer) {
            $match = $this->getJobMatch($job, $freelancer);
            if ($match['success']) {
                $matches[] = [
                    'freelancer' => $freelancer,
                    'score' => $match['score'],
                    'reason' => $match['reason']
                ];
            }
        }

        // Sort by score descending
        usort($matches, fn($a, $b) => $b['score'] - $a['score']);

        // Return top matches
        return array_slice($matches, 0, $limit);
    }

    /**
     * Get recommended jobs for a freelancer
     */
    public function getRecommendedJobs(User $freelancer, int $limit = 5): array
    {
        $jobs = GigJob::where('status', 'open')->get();

        $matches = [];
        foreach ($jobs as $job) {
            $match = $this->getJobMatch($job, $freelancer);
            if ($match['success']) {
                $matches[] = [
                    'job' => $job,
                    'score' => $match['score'],
                    'reason' => $match['reason']
                ];
            }
        }

        // Sort by score descending
        usort($matches, fn($a, $b) => $b['score'] - $a['score']);

        // Return top matches
        return array_slice($matches, 0, $limit);
    }
} 