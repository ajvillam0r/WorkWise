<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class ErrorLogController extends Controller
{
    public function captureGigWorkerError()
    {
        try {
            // Find a gig worker
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if (!$gigWorker) {
                return response()->json([
                    'error' => 'No gig worker found'
                ], 404);
            }

            // Mock authentication
            auth()->login($gigWorker);

            // Try to instantiate the controller and call index
            $controller = new \App\Http\Controllers\GigWorkerDashboardController();
            $request = new Request();
            
            $response = $controller->index($request);
            
            return response()->json([
                'success' => true,
                'message' => 'No error occurred',
                'user' => $gigWorker->name
            ]);
            
        } catch (\Throwable $e) {
            // Log the full error details
            $errorDetails = [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'previous' => $e->getPrevious() ? $e->getPrevious()->getMessage() : null
            ];
            
            Log::error('GigWorkerDashboard Error', $errorDetails);
            
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e),
                'trace' => explode("\n", $e->getTraceAsString())
            ], 500);
        }
    }
}