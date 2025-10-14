<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Http\Controllers\GigWorkerDashboardController;
use Illuminate\Http\Request;

class TestGigWorkerDashboard extends Command
{
    protected $signature = 'test:gig-worker-dashboard';
    protected $description = 'Test the gig worker dashboard functionality';

    public function handle()
    {
        $this->info('Testing Gig Worker Dashboard...');

        try {
            // Find or create a gig worker
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if (!$gigWorker) {
                $this->info('No gig worker found, creating one...');
                $gigWorker = User::create([
                    'first_name' => 'Test',
                    'last_name' => 'GigWorker',
                    'email' => 'test.gigworker@example.com',
                    'password' => bcrypt('password'),
                    'user_type' => 'gig_worker',
                    'email_verified_at' => now(),
                ]);
                $this->info('Created test gig worker: ' . $gigWorker->email);
            } else {
                $this->info('Found existing gig worker: ' . $gigWorker->email);
            }

            // Simulate authentication
            auth()->login($gigWorker);
            
            // Test the dashboard controller
            $controller = new GigWorkerDashboardController();
            $request = new Request();
            
            $this->info('Testing dashboard controller...');
            $response = $controller->index($request);
            
            $this->info('Dashboard controller executed successfully!');
            $this->info('Response type: ' . get_class($response));
            
            // Test individual methods
            $this->testControllerMethods($controller, $gigWorker);
            
        } catch (\Exception $e) {
            $this->error('Error testing dashboard: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }

        return 0;
    }

    private function testControllerMethods($controller, $gigWorker)
    {
        $reflection = new \ReflectionClass($controller);
        
        try {
            // Test getGigWorkerStats
            $method = $reflection->getMethod('getGigWorkerStats');
            $method->setAccessible(true);
            $stats = $method->invoke($controller, $gigWorker);
            $this->info('✓ getGigWorkerStats: ' . json_encode($stats));
        } catch (\Exception $e) {
            $this->error('✗ getGigWorkerStats failed: ' . $e->getMessage());
        }

        try {
            // Test getActiveContracts
            $method = $reflection->getMethod('getActiveContracts');
            $method->setAccessible(true);
            $contracts = $method->invoke($controller, $gigWorker);
            $this->info('✓ getActiveContracts: ' . $contracts->count() . ' contracts');
        } catch (\Exception $e) {
            $this->error('✗ getActiveContracts failed: ' . $e->getMessage());
        }

        try {
            // Test getJobInvites
            $method = $reflection->getMethod('getJobInvites');
            $method->setAccessible(true);
            $invites = $method->invoke($controller, $gigWorker);
            $this->info('✓ getJobInvites: ' . $invites->count() . ' invites');
        } catch (\Exception $e) {
            $this->error('✗ getJobInvites failed: ' . $e->getMessage());
        }

        try {
            // Test getEarningsSummary
            $method = $reflection->getMethod('getEarningsSummary');
            $method->setAccessible(true);
            $earnings = $method->invoke($controller, $gigWorker);
            $this->info('✓ getEarningsSummary: ' . json_encode($earnings));
        } catch (\Exception $e) {
            $this->error('✗ getEarningsSummary failed: ' . $e->getMessage());
        }
    }
}
