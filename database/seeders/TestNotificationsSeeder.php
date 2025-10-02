<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Notification;
use App\Models\ContractDeadline;
use App\Models\Project;
use Carbon\Carbon;

class TestNotificationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first employer user for testing
        $employer = User::where('user_type', 'employer')->first();

        if (!$employer) {
            $this->command->error('No employer user found. Please run the main seeders first.');
            return;
        }

        // Get the first gig worker for message notifications
        $gigWorker = User::where('user_type', 'gig_worker')->first();

        // Get an active project for testing
        $project = Project::where('employer_id', $employer->id)
            ->where('contract_signed', true)
            ->first();

        if (!$project) {
            $this->command->warn('No active projects found. Creating sample project...');
            $project = $this->createSampleProject($employer, $gigWorker);
        }

        // Create sample notifications
        $this->createSampleNotifications($employer, $gigWorker, $project);

        // Create sample deadlines
        $this->createSampleDeadlines($project);

        $this->command->info('Test notifications created successfully!');
        $this->command->info("Created notifications for employer: {$employer->first_name} {$employer->last_name}");
        $this->command->info("Total notifications: " . Notification::where('user_id', $employer->id)->count());
        $this->command->info("Total deadlines: " . ContractDeadline::whereHas('contract', function($q) use ($employer) {
            $q->where('employer_id', $employer->id);
        })->count());
    }

    private function createSampleProject($employer, $gigWorker)
    {
        return Project::create([
            'employer_id' => $employer->id,
            'gig_worker_id' => $gigWorker->id,
            'job_id' => 1, // Assuming job with ID 1 exists
            'bid_id' => 1, // Assuming bid with ID 1 exists
            'agreed_amount' => 5000,
            'platform_fee' => 250,
            'net_amount' => 4750,
            'status' => 'active',
            'started_at' => now()->subDays(5),
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    private function createSampleNotifications($employer, $gigWorker, $project)
    {
        $notifications = [
            [
                'type' => 'escrow_status',
                'title' => '⚠️ Low Escrow Balance',
                'message' => 'Escrow balance for "Website Development Project" is running low. Current balance: ₱1,000',
                'data' => [
                    'project_id' => $project->id,
                    'project_title' => 'Website Development Project',
                    'alert_type' => 'low_balance',
                    'current_balance' => 1000,
                    'agreed_amount' => 5000
                ],
                'action_url' => "/projects/{$project->id}",
                'icon' => 'currency-dollar'
            ],
            [
                'type' => 'deadline_approaching',
                'title' => '⏰ Deadline Approaching',
                'message' => 'Deadline for "Initial Design Review" is approaching on ' . now()->addDays(3)->format('M j, Y'),
                'data' => [
                    'project_id' => $project->id,
                    'milestone_name' => 'Initial Design Review',
                    'due_date' => now()->addDays(3)->format('M j, Y'),
                    'alert_type' => 'approaching'
                ],
                'action_url' => "/projects/{$project->id}",
                'icon' => 'clock'
            ],
            [
                'type' => 'message_received',
                'title' => '💬 New Message',
                'message' => "New message from {$gigWorker->first_name}: 'I have completed the initial wireframes and would like your feedback...''",
                'data' => [
                    'sender_id' => $gigWorker->id,
                    'sender_name' => $gigWorker->first_name . ' ' . $gigWorker->last_name,
                    'message_preview' => 'I have completed the initial wireframes and would like your feedback...'
                ],
                'action_url' => "/messages/{$gigWorker->id}",
                'icon' => 'chat-bubble-left'
            ],
            [
                'type' => 'contract_fully_signed',
                'title' => '✅ Contract Fully Signed!',
                'message' => 'Contract for "Website Development Project" has been fully signed and work can begin.',
                'data' => [
                    'project_id' => $project->id,
                    'job_title' => 'Website Development Project'
                ],
                'action_url' => "/projects/{$project->id}",
                'icon' => 'check-circle'
            ]
        ];

        foreach ($notifications as $notificationData) {
            Notification::create(array_merge($notificationData, [
                'user_id' => $employer->id,
                'is_read' => false,
                'created_at' => now()->subMinutes(rand(5, 120)),
                'updated_at' => now()
            ]));
        }
    }

    private function createSampleDeadlines($project)
    {
        $deadlines = [
            [
                'milestone_name' => 'Initial Design Review',
                'due_date' => now()->addDays(3),
                'status' => 'pending'
            ],
            [
                'milestone_name' => 'Wireframes Complete',
                'due_date' => now()->addDays(7),
                'status' => 'pending'
            ],
            [
                'milestone_name' => 'Frontend Development',
                'due_date' => now()->addDays(14),
                'status' => 'pending'
            ],
            [
                'milestone_name' => 'Backend Integration',
                'due_date' => now()->addDays(21),
                'status' => 'pending'
            ],
            [
                'milestone_name' => 'Final Review & Testing',
                'due_date' => now()->addDays(28),
                'status' => 'pending'
            ]
        ];

        foreach ($deadlines as $deadlineData) {
            ContractDeadline::create(array_merge($deadlineData, [
                'contract_id' => $project->id,
                'reminder_sent' => false,
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }
}
