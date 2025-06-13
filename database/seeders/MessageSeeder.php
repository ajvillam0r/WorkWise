<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Message;
use App\Models\User;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some users to create conversations between
        $users = User::take(4)->get();

        if ($users->count() < 2) {
            $this->command->info('Not enough users to create messages. Please create some users first.');
            return;
        }

        // Create some sample conversations
        $conversations = [
            [
                'sender' => $users[0],
                'receiver' => $users[1],
                'messages' => [
                    'Hi! I saw your job posting for web development. I\'m interested in working on this project.',
                    'Hello! Thanks for your interest. Could you tell me more about your experience with Laravel?',
                    'I have 3 years of experience with Laravel and have built several e-commerce platforms. I can share my portfolio if you\'d like.',
                    'That sounds great! Please send me your portfolio. What\'s your estimated timeline for this project?',
                    'I can complete this project in 2-3 weeks. I\'ll send you my portfolio right now.'
                ]
            ],
            [
                'sender' => $users[1],
                'receiver' => $users[2] ?? $users[0],
                'messages' => [
                    'Hello! I\'m looking for a graphic designer for my new startup. Are you available?',
                    'Hi there! Yes, I\'m available. What kind of design work do you need?',
                    'I need a logo design and some marketing materials. What\'s your rate?',
                    'My rate is $50/hour for logo design. For marketing materials, it depends on the scope. Can we schedule a call?'
                ]
            ]
        ];

        foreach ($conversations as $conversation) {
            $sender = $conversation['sender'];
            $receiver = $conversation['receiver'];
            $messages = $conversation['messages'];

            foreach ($messages as $index => $messageText) {
                // Alternate between sender and receiver
                $currentSender = ($index % 2 === 0) ? $sender : $receiver;
                $currentReceiver = ($index % 2 === 0) ? $receiver : $sender;

                Message::create([
                    'sender_id' => $currentSender->id,
                    'receiver_id' => $currentReceiver->id,
                    'message' => $messageText,
                    'type' => 'text',
                    'is_read' => $index < count($messages) - 1, // Last message is unread
                    'read_at' => $index < count($messages) - 1 ? now()->subMinutes(rand(1, 60)) : null,
                    'created_at' => now()->subHours(rand(1, 24))->subMinutes($index * 10),
                    'updated_at' => now()->subHours(rand(1, 24))->subMinutes($index * 10),
                ]);
            }
        }

        $this->command->info('Sample messages created successfully!');
    }
}
