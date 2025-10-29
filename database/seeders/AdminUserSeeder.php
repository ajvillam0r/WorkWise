<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin user already exists
        $adminExists = User::where('email', 'admin@workwise.com')->exists();

        if (!$adminExists) {
            User::create([
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@workwise.com',
                'password' => Hash::make('password'),
                'user_type' => 'admin',
                'is_admin' => true,
                'profile_completed' => true,
                'profile_status' => 'approved',
                'email_verified_at' => now(),
                'country' => 'Philippines',
                'city' => 'Manila',
            ]);

            $this->command->info('Admin user created successfully!');
            $this->command->info('Email: admin@workwise.com');
            $this->command->info('Password: password');
        } else {
            $this->command->info('Admin user already exists.');
        }
    }
}
