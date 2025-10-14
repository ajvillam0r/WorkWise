<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use App\Models\GigJob;
use App\Models\Bid;
use App\Models\Project;
use App\Models\Transaction;

class DiagnoseRailwayIssue extends Command
{
    protected $signature = 'diagnose:railway';
    protected $description = 'Diagnose potential Railway deployment issues';

    public function handle()
    {
        $this->info('🔍 Diagnosing Railway deployment issues...');
        $this->newLine();

        // Check database connection
        $this->checkDatabaseConnection();
        
        // Check required tables
        $this->checkRequiredTables();
        
        // Check for gig workers
        $this->checkGigWorkers();
        
        // Check environment variables
        $this->checkEnvironmentVariables();
        
        // Check model relationships
        $this->checkModelRelationships();
        
        // Test dashboard controller methods
        $this->testDashboardMethods();

        $this->newLine();
        $this->info('✅ Diagnosis complete!');
        
        return 0;
    }

    private function checkDatabaseConnection()
    {
        $this->info('📊 Checking database connection...');
        
        try {
            DB::connection()->getPdo();
            $this->info('✅ Database connection: OK');
            
            $driver = DB::connection()->getDriverName();
            $this->info("   Database driver: {$driver}");
            
        } catch (\Exception $e) {
            $this->error('❌ Database connection failed: ' . $e->getMessage());
        }
    }

    private function checkRequiredTables()
    {
        $this->info('🗄️  Checking required tables...');
        
        $requiredTables = ['users', 'gig_jobs', 'bids', 'projects', 'transactions'];
        
        foreach ($requiredTables as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                $this->info("✅ Table '{$table}': exists ({$count} records)");
            } else {
                $this->error("❌ Table '{$table}': missing");
            }
        }
    }

    private function checkGigWorkers()
    {
        $this->info('👥 Checking gig workers...');
        
        try {
            $gigWorkerCount = User::where('user_type', 'gig_worker')->count();
            $this->info("✅ Gig workers found: {$gigWorkerCount}");
            
            if ($gigWorkerCount > 0) {
                $firstGigWorker = User::where('user_type', 'gig_worker')->first();
                $this->info("   First gig worker: {$firstGigWorker->name} (ID: {$firstGigWorker->id})");
            }
            
        } catch (\Exception $e) {
            $this->error('❌ Error checking gig workers: ' . $e->getMessage());
        }
    }

    private function checkEnvironmentVariables()
    {
        $this->info('🔧 Checking environment variables...');
        
        $requiredEnvVars = [
            'APP_KEY',
            'DB_CONNECTION',
            'DB_HOST',
            'DB_DATABASE',
            'DB_USERNAME'
        ];
        
        foreach ($requiredEnvVars as $var) {
            $value = env($var);
            if ($value) {
                $displayValue = in_array($var, ['DB_PASSWORD', 'APP_KEY']) ? '***' : $value;
                $this->info("✅ {$var}: {$displayValue}");
            } else {
                $this->error("❌ {$var}: not set");
            }
        }
    }

    private function checkModelRelationships()
    {
        $this->info('🔗 Checking model relationships...');
        
        try {
            // Check if User model has required methods
            $user = new User();
            $methods = ['isGigWorker', 'bids', 'gigWorkerProjects', 'paymentsReceived'];
            
            foreach ($methods as $method) {
                if (method_exists($user, $method)) {
                    $this->info("✅ User::{$method}(): exists");
                } else {
                    $this->error("❌ User::{$method}(): missing");
                }
            }
            
        } catch (\Exception $e) {
            $this->error('❌ Error checking model relationships: ' . $e->getMessage());
        }
    }

    private function testDashboardMethods()
    {
        $this->info('🎛️  Testing dashboard controller methods...');
        
        try {
            // Find or create a gig worker for testing
            $gigWorker = User::where('user_type', 'gig_worker')->first();
            
            if (!$gigWorker) {
                $this->warn('⚠️  No gig worker found, creating test user...');
                $gigWorker = User::create([
                    'name' => 'Test Gig Worker',
                    'email' => 'test-gig-worker@example.com',
                    'password' => bcrypt('password'),
                    'user_type' => 'gig_worker',
                    'email_verified_at' => now(),
                ]);
            }
            
            // Test basic queries that the dashboard uses
            $this->testQuery('Active bids', function() use ($gigWorker) {
                return Bid::where('gig_worker_id', $gigWorker->id)->count();
            });
            
            $this->testQuery('Active projects', function() use ($gigWorker) {
                return Project::where('gig_worker_id', $gigWorker->id)->count();
            });
            
            $this->testQuery('Transactions', function() use ($gigWorker) {
                return Transaction::where('payee_id', $gigWorker->id)->count();
            });
            
            $this->testQuery('Available jobs', function() use ($gigWorker) {
                return GigJob::where('status', 'open')->count();
            });
            
        } catch (\Exception $e) {
            $this->error('❌ Error testing dashboard methods: ' . $e->getMessage());
            $this->error('   Stack trace: ' . $e->getTraceAsString());
        }
    }

    private function testQuery($name, $callback)
    {
        try {
            $result = $callback();
            $this->info("✅ {$name}: {$result}");
        } catch (\Exception $e) {
            $this->error("❌ {$name}: " . $e->getMessage());
        }
    }
}