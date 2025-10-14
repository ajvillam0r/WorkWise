<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SimpleTestController extends Controller
{
    public function basicTest()
    {
        try {
            // Test 1: Basic PHP functionality
            $phpVersion = phpversion();
            
            // Test 2: Database connection
            $dbConnection = DB::connection()->getPdo() ? 'Connected' : 'Failed';
            
            // Test 3: User model access
            $userCount = User::count();
            
            // Test 4: Find a gig worker
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            // Test 5: Basic authentication simulation
            if ($gigWorker) {
                auth()->login($gigWorker);
                $authUser = auth()->user();
            }
            
            return response()->json([
                'success' => true,
                'tests' => [
                    'php_version' => $phpVersion,
                    'database' => $dbConnection,
                    'user_count' => $userCount,
                    'gig_worker_found' => $gigWorker ? true : false,
                    'gig_worker_name' => $gigWorker ? $gigWorker->name : null,
                    'auth_working' => isset($authUser) && $authUser->id === $gigWorker->id
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    public function testGigWorkerModel()
    {
        try {
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if (!$gigWorker) {
                return response()->json(['error' => 'No gig worker found'], 404);
            }
            
            // Test model methods and relationships
            $tests = [
                'user_id' => $gigWorker->id,
                'user_name' => $gigWorker->name,
                'user_type' => $gigWorker->user_type,
                'is_gig_worker_method' => method_exists($gigWorker, 'isGigWorker') ? $gigWorker->isGigWorker() : 'method_not_found',
                'available_methods' => get_class_methods($gigWorker),
                'available_relations' => []
            ];
            
            // Test common relationships
            $relationMethods = ['bids', 'projects', 'paymentsReceived', 'paymentsMade'];
            foreach ($relationMethods as $method) {
                if (method_exists($gigWorker, $method)) {
                    try {
                        $result = $gigWorker->$method();
                        $tests['available_relations'][$method] = get_class($result);
                    } catch (\Exception $e) {
                        $tests['available_relations'][$method] = 'error: ' . $e->getMessage();
                    }
                } else {
                    $tests['available_relations'][$method] = 'method_not_found';
                }
            }
            
            return response()->json([
                'success' => true,
                'tests' => $tests
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}