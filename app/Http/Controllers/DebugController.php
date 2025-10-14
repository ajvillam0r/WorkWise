<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\GigJob;
use App\Models\Bid;
use App\Models\Project;
use App\Models\Transaction;

class DebugController extends Controller
{
    public function railwayDiagnosis()
    {
        $output = [];
        $output[] = "🚂 Railway Diagnosis Report";
        $output[] = "==========================";
        $output[] = "";

        // Environment info
        $output[] = "📋 Environment Information:";
        $output[] = "PHP Version: " . PHP_VERSION;
        $output[] = "Laravel Version: " . app()->version();
        $output[] = "Environment: " . config('app.env');
        $output[] = "Debug Mode: " . (config('app.debug') ? 'ON' : 'OFF');
        $output[] = "";

        // Database connection
        $output[] = "📊 Database Status:";
        try {
            $pdo = DB::connection()->getPdo();
            $output[] = "✅ Database connection: OK";
            $output[] = "Driver: " . $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
            
            // Test basic queries
            $userCount = DB::table('users')->count();
            $output[] = "Users: {$userCount}";
            
            $gigWorkerCount = DB::table('users')->where('user_type', 'gig_worker')->count();
            $output[] = "Gig Workers: {$gigWorkerCount}";
            
        } catch (\Exception $e) {
            $output[] = "❌ Database error: " . $e->getMessage();
        }
        $output[] = "";

        // Test GigWorkerDashboard functionality
        $output[] = "🎛️  Dashboard Controller Test:";
        try {
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if ($gigWorker) {
                $output[] = "✅ Found gig worker: {$gigWorker->name}";
                
                // Test controller methods
                $controller = new \App\Http\Controllers\GigWorkerDashboardController();
                $reflection = new \ReflectionClass($controller);
                
                $methods = [
                    'getGigWorkerStats',
                    'getActiveContracts', 
                    'getJobInvites',
                    'getEarningsSummary',
                    'getAIRecommendations',
                    'getRecentActivity',
                    'getSkillsProgress',
                    'getUpcomingDeadlines'
                ];
                
                foreach ($methods as $methodName) {
                    try {
                        $method = $reflection->getMethod($methodName);
                        $method->setAccessible(true);
                        $result = $method->invoke($controller, $gigWorker);
                        $output[] = "✅ {$methodName}: OK";
                    } catch (\Exception $e) {
                        $output[] = "❌ {$methodName}: " . $e->getMessage();
                    }
                }
                
                // Test full index method
                try {
                    // Mock authentication
                    auth()->login($gigWorker);
                    
                    $request = new Request();
                    $response = $controller->index($request);
                    $output[] = "✅ Full index method: OK";
                    
                } catch (\Exception $e) {
                    $output[] = "❌ Full index method: " . $e->getMessage();
                    $output[] = "   Stack trace: " . $e->getTraceAsString();
                }
                
            } else {
                $output[] = "❌ No gig worker found";
            }
            
        } catch (\Exception $e) {
            $output[] = "❌ Dashboard test failed: " . $e->getMessage();
            $output[] = "   Stack trace: " . $e->getTraceAsString();
        }
        $output[] = "";

        // Memory usage
        $output[] = "💾 Performance:";
        $output[] = "Memory usage: " . number_format(memory_get_usage(true) / 1024 / 1024, 2) . " MB";
        $output[] = "Peak memory: " . number_format(memory_get_peak_usage(true) / 1024 / 1024, 2) . " MB";
        $output[] = "";

        $output[] = "✅ Diagnosis complete!";

        return response('<pre>' . implode("\n", $output) . '</pre>')
            ->header('Content-Type', 'text/html');
    }

    public function testGigWorkerDashboard()
    {
        try {
            // Find a gig worker
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if (!$gigWorker) {
                return response()->json([
                    'error' => 'No gig worker found',
                    'suggestion' => 'Run php artisan db:seed to create test data'
                ], 404);
            }

            // Mock authentication
            auth()->login($gigWorker);

            // Test each method individually to isolate the error
            $controller = new \App\Http\Controllers\GigWorkerDashboardController();
            $reflection = new \ReflectionClass($controller);
            $results = [];
            
            $methods = [
                'getGigWorkerStats',
                'getActiveContracts', 
                'getJobInvites',
                'getEarningsSummary',
                'getAIRecommendations',
                'getRecentActivity',
                'getSkillsProgress',
                'getUpcomingDeadlines'
            ];
            
            foreach ($methods as $methodName) {
                try {
                    $method = $reflection->getMethod($methodName);
                    $method->setAccessible(true);
                    $result = $method->invoke($controller, $gigWorker);
                    $results[$methodName] = [
                        'status' => 'success',
                        'data_type' => gettype($result),
                        'data_count' => is_array($result) ? count($result) : (is_object($result) ? get_class($result) : 'scalar')
                    ];
                } catch (\Exception $e) {
                    $results[$methodName] = [
                        'status' => 'error',
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ];
                }
            }
            
            // Now test the full index method
            try {
                $request = new Request();
                $response = $controller->index($request);
                $results['full_index'] = [
                    'status' => 'success',
                    'response_type' => get_class($response)
                ];
            } catch (\Exception $e) {
                $results['full_index'] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => explode("\n", $e->getTraceAsString())
                ];
            }
            
            return response()->json([
                'success' => true,
                'user' => $gigWorker->name,
                'method_results' => $results
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString())
            ], 500);
        }
    }
}