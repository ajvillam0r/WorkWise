<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\Http;

// Load environment
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🤖 Testing AI Matching with OpenRouter API\n";
echo str_repeat("=", 60) . "\n\n";

// Get API configuration
$apiKey = env('META_LLAMA_L4_SCOUT_FREE') ?: env('OPENROUTER_API_KEY');
$baseUrl = env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
$model = env('OPENROUTER_MODEL', 'meta-llama/llama-4-scout:free');
$certPath = base_path('cacert.pem');

echo "Configuration:\n";
echo "  API Key: " . ($apiKey ? substr($apiKey, 0, 20) . "..." : "NOT SET") . "\n";
echo "  Base URL: $baseUrl\n";
echo "  Model: $model\n";
echo "  Cert Path: $certPath\n";
echo "\n";

if (empty($apiKey)) {
    echo "❌ ERROR: API key is not configured!\n";
    exit(1);
}

// Test API connection
echo "Testing API Connection...\n";
try {
    $response = Http::withToken($apiKey)
        ->withOptions(['verify' => $certPath])
        ->withHeaders([
            'HTTP-Referer' => config('app.url'),
            'X-Title' => 'WorkWise AI Matching Test'
        ])
        ->timeout(30)
        ->post("$baseUrl/chat/completions", [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a helpful assistant.'
                ],
                [
                    'role' => 'user',
                    'content' => 'Say "AI Connection Successful" if you can read this.'
                ]
            ],
            'max_tokens' => 50
        ]);

    if ($response->successful()) {
        $data = $response->json();
        $message = $data['choices'][0]['message']['content'] ?? 'No response';
        echo "✅ API Connection Successful!\n";
        echo "Response: $message\n\n";
    } else {
        echo "❌ API Connection Failed!\n";
        echo "Status: " . $response->status() . "\n";
        echo "Response: " . $response->body() . "\n\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test job matching
echo "Testing Job Matching...\n";
try {
    $jobText = "Job Title: Full Stack Web Developer
Description: Build a modern e-commerce website with React and Laravel
Required Skills: PHP, Laravel, React, JavaScript, MySQL, REST API
Experience Level: intermediate
Budget: ₱50000 - ₱80000 (project)";

    $gigWorkerText = "Professional Title: Full Stack Developer
Skills: PHP, Laravel, JavaScript, React, Vue.js, MySQL, PostgreSQL
Experience Level: intermediate
Hourly Rate: ₱800
Bio: Experienced web developer specializing in Laravel and React applications";

    $response = Http::withToken($apiKey)
        ->withOptions(['verify' => $certPath])
        ->withHeaders([
            'HTTP-Referer' => config('app.url'),
            'X-Title' => 'WorkWise Job Matching'
        ])
        ->timeout(30)
        ->post("$baseUrl/chat/completions", [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an expert AI career advisor for Philippine freelance job matching. You MUST analyze ONLY skills and experience compatibility. SCORING GUIDELINES: Give 80-100 for excellent skill matches (4+ direct skills), 60-79 for good matches (2-3 direct skills), 40-59 for fair matches (1-2 direct skills or many related skills), 20-39 for weak matches (only related/transferable skills), 0-19 for poor matches (minimal relevance). Format: "Score: X\nReason: [Detailed explanation]"'
                ],
                [
                    'role' => 'user',
                    'content' => "Match Analysis:\n\nJOB REQUIREMENTS:\n$jobText\n\nFREELANCER PROFILE:\n$gigWorkerText\n\nAnalyze skills and experience match. Provide score (0-100) and detailed reason."
                ]
            ],
            'temperature' => 0.4,
            'max_tokens' => 250
        ]);

    if ($response->successful()) {
        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? 'No response';
        
        echo "✅ Job Matching Test Successful!\n\n";
        echo "AI Response:\n";
        echo str_repeat("-", 60) . "\n";
        echo $content . "\n";
        echo str_repeat("-", 60) . "\n\n";
        
        // Parse score
        if (preg_match('/Score:\s*(\d+)/i', $content, $matches)) {
            $score = $matches[1];
            echo "Parsed Score: $score%\n";
            
            if ($score >= 80) {
                echo "Match Quality: 🎯 Excellent\n";
            } elseif ($score >= 60) {
                echo "Match Quality: 👍 Good\n";
            } elseif ($score >= 40) {
                echo "Match Quality: ✓ Fair\n";
            } else {
                echo "Match Quality: ⚠️ Weak\n";
            }
        }
        
        echo "\n✅ ALL TESTS PASSED!\n";
    } else {
        echo "❌ Job Matching Test Failed!\n";
        echo "Status: " . $response->status() . "\n";
        echo "Response: " . $response->body() . "\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "🎉 AI Matching System is working correctly!\n";
echo "You can now visit /ai/recommendations to see AI-powered job matches.\n";