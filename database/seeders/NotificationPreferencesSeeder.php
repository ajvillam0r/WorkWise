<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\NotificationPreference;

class NotificationPreferencesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $notificationTypes = [
            'escrow_status',
            'deadline_approaching',
            'message_received',
            'contract_signing',
            'bid_status',
            'contract_fully_signed'
        ];

        foreach ($users as $user) {
            foreach ($notificationTypes as $type) {
                NotificationPreference::firstOrCreate([
                    'user_id' => $user->id,
                    'notification_type' => $type
                ], [
                    'is_enabled' => true,
                    'email_enabled' => true,
                    'push_enabled' => true
                ]);
            }
        }

        $this->command->info('Notification preferences seeded successfully for ' . $users->count() . ' users');
    }
}
