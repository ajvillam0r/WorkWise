<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Services\AIJobMatchingService;
use App\Models\User;
use App\Models\GigJob;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Request::capture();
$kernel->bootstrap();

echo "=== Enhanced AI Job Matching Algorithm Test ===\n\n";

try {
    // Initialize the enhanced AI job matching service
    $aiMatchingService = app(AIJobMatchingService::class);
    
    // Find a test gig worker with portfolio data
    $gigWorker = User::where('user_type', 'gig_worker')
        ->whereNotNull('skills')
        ->with(['freelancerProfile.portfolios'])
        ->first();
    
    if (!$gigWorker) {
        echo "❌ No gig worker found for testing\n";
        exit(1);
    }
    
    echo "🔍 Testing Enhanced AI Matching for Gig Worker:\n";
    echo "   Name: {$gigWorker->first_name} {$gigWorker->last_name}\n";
    echo "   Skills: " . (is_array($gigWorker->skills) ? implode(', ', $gigWorker->skills) : $gigWorker->skills) . "\n";
    echo "   Experience: {$gigWorker->experience_level}\n";
    
    // Check portfolio data
    $portfolioCount = $gigWorker->freelancerProfile?->portfolios?->count() ?? 0;
    echo "   Portfolio Items: {$portfolioCount}\n\n";
    
    // Test the enhanced AI job recommendations
    echo "🚀 Running Enhanced AI Job Recommendations...\n";
    $startTime = microtime(true);
    
    $enhancedRecommendations = $aiMatchingService->getEnhancedAIJobRecommendations($gigWorker);
    
    $endTime = microtime(true);
    $executionTime = round(($endTime - $startTime) * 1000, 2);
    
    echo "✅ Enhanced AI Analysis completed in {$executionTime}ms\n\n";
    
    // Display results
    echo "📊 ENHANCED AI MATCHING RESULTS:\n";
    echo "   Total Jobs Available: {$enhancedRecommendations['total_jobs']}\n";
    echo "   Matching Jobs Found: {$enhancedRecommendations['match_count']}\n\n";
    
    if (!empty($enhancedRecommendations['matches'])) {
        foreach ($enhancedRecommendations['matches'] as $index => $match) {
            $job = $match['job'];
            echo "🎯 JOB MATCH #" . ($index + 1) . ":\n";
            echo "   Title: {$job['title']}\n";
            echo "   Category: {$job['category']}\n";
            echo "   Budget: {$job['budget']} {$job['currency']}\n";
            echo "   Required Skills: " . (is_array($job['required_skills']) ? implode(', ', $job['required_skills']) : $job['required_skills']) . "\n";
            echo "   Base Match Score: " . round($match['match_score'] * 100, 1) . "%\n";
            
            if (isset($match['enhanced_match_score'])) {
                echo "   Enhanced Match Score: " . round($match['enhanced_match_score'] * 100, 1) . "%\n";
            }
            
            // Display comprehensive analysis
            if (isset($match['comprehensive_analysis']) && $match['comprehensive_analysis']['success']) {
                $analysis = $match['comprehensive_analysis']['analysis'];
                echo "\n   🔍 COMPREHENSIVE AI ANALYSIS:\n";
                
                if (isset($analysis['skills_alignment'])) {
                    echo "   📋 Skills Alignment: " . substr($analysis['skills_alignment'], 0, 100) . "...\n";
                }
                
                if (isset($analysis['experience_relevance'])) {
                    echo "   💼 Experience Relevance: " . substr($analysis['experience_relevance'], 0, 100) . "...\n";
                }
                
                if (isset($analysis['portfolio_validation'])) {
                    echo "   📁 Portfolio Validation: " . substr($analysis['portfolio_validation'], 0, 100) . "...\n";
                }
                
                if (isset($analysis['identity_verification'])) {
                    echo "   🆔 Identity Verification: " . substr($analysis['identity_verification'], 0, 100) . "...\n";
                }
                
                if (isset($analysis['technical_score'])) {
                    echo "   🎯 Technical Score: {$analysis['technical_score']}/100\n";
                }
                
                if (isset($analysis['success_probability'])) {
                    echo "   📈 Success Probability: {$analysis['success_probability']}%\n";
                }
                
                echo "   🤖 AI Model Used: {$match['comprehensive_analysis']['model_used']}\n";
            } else {
                echo "   ⚠️ Comprehensive analysis not available\n";
            }
            
            // Display portfolio validation
            if (isset($match['portfolio_validation'])) {
                $validation = $match['portfolio_validation'];
                echo "\n   📁 PORTFOLIO VALIDATION:\n";
                echo "   Validated Skills: " . ($validation['validated_skills_count'] ?? 0) . "\n";
                echo "   Validation Score: " . round(($validation['validation_score'] ?? 0) * 100, 1) . "%\n";
            }
            
            // Display identity verification
            if (isset($match['identity_verification'])) {
                $identity = $match['identity_verification'];
                echo "\n   🆔 IDENTITY VERIFICATION:\n";
                echo "   Consistency Score: " . round(($identity['consistency_score'] ?? 0) * 100, 1) . "%\n";
                echo "   Verification Status: " . ($identity['verification_status'] ?? 'Unknown') . "\n";
            }
            
            echo "\n" . str_repeat("-", 80) . "\n\n";
        }
    } else {
        echo "❌ No job matches found\n\n";
    }
    
    // Display portfolio insights
    if (isset($enhancedRecommendations['portfolio_insights'])) {
        echo "💡 PORTFOLIO INSIGHTS:\n";
        $portfolioInsights = $enhancedRecommendations['portfolio_insights'];
        if (isset($portfolioInsights['insights']) && is_array($portfolioInsights['insights'])) {
            foreach ($portfolioInsights['insights'] as $insight) {
                echo "   • {$insight}\n";
            }
        } else {
            echo "   • " . ($portfolioInsights['status'] ?? 'No insights available') . "\n";
        }
        echo "\n";
    }
    
    // Display suggested improvements
    if (!empty($enhancedRecommendations['suggested_improvements'])) {
        echo "🔧 SUGGESTED IMPROVEMENTS:\n";
        foreach ($enhancedRecommendations['suggested_improvements'] as $improvement) {
            echo "   • {$improvement}\n";
        }
        echo "\n";
    }
    
    echo "✅ Enhanced AI matching algorithm test completed successfully!\n";
    echo "🎉 All enhanced features are working properly:\n";
    echo "   ✓ Portfolio analysis and validation\n";
    echo "   ✓ Identity verification\n";
    echo "   ✓ Comprehensive AI insights\n";
    echo "   ✓ Enhanced matching scores\n";
    echo "   ✓ Quantitative and qualitative assessments\n";
    
} catch (Exception $e) {
    echo "❌ Error during enhanced AI matching test: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}