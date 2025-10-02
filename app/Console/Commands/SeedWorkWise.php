<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\WorkWiseComprehensiveSeeder;

class SeedWorkWise extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workwise:seed {--fresh : Drop all tables and migrate fresh before seeding}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed WorkWise application with sample employers, gig workers, and jobs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting WorkWise seeding process...');

        if ($this->option('fresh')) {
            $this->info('🔄 Running fresh migration...');
            $this->call('migrate:fresh');
        }

        $this->info('🌱 Running WorkWise seeder...');
        $this->call('db:seed', ['--class' => WorkWiseComprehensiveSeeder::class]);

        $this->info('');
        $this->info('✅ WorkWise seeding completed successfully!');
        $this->info('');
        $this->info('📋 Test Accounts Created:');
        $this->info('');
        $this->info('👔 EMPLOYERS:');
        $this->info('   • maria.santos@techstartup.ph (password: password123)');
        $this->info('   • john.delacruz@digitalagency.com (password: password123)');
        $this->info('   • ana.rodriguez@ecommerce.ph (password: password123)');
        $this->info('');
        $this->info('👨‍💻 GIG WORKERS:');
        $this->info('   • carlos.mendoza@developer.ph (password: password123)');
        $this->info('   • michelle.garcia@webdev.ph (password: password123)');
        $this->info('   • mark.villanueva@design.ph (password: password123)');
        $this->info('');
        $this->info('🎯 Each employer has job postings and some jobs have sample bids!');
        
        return 0;
    }
}
