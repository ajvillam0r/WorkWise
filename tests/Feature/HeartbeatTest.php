<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HeartbeatTest extends TestCase
{
    use RefreshDatabase;

    public function test_heartbeat_returns_correct_counts()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Create 3 unread notifications
        for ($i = 0; $i < 3; $i++) {
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Test Notification ' . $i,
                'message' => 'Test Message ' . $i,
                'type' => 'test',
                'is_read' => false
            ]);
        }

        // Create 2 unread messages
        $sender = User::factory()->create();
        for ($i = 0; $i < 2; $i++) {
            Message::create([
                'receiver_id' => $user->id,
                'sender_id' => $sender->id,
                'message' => 'Test message ' . $i,
                'is_read' => false,
            ]);
        }

        $response = $this->getJson(route('api.user.heartbeat'));

        $response->assertStatus(200)
            ->assertJson([
                'unread_notifications_count' => 3,
                'unread_messages_count' => 2,
            ]);
    }

    public function test_heartbeat_requires_authentication()
    {
        $response = $this->getJson(route('api.user.heartbeat'));
        $response->assertStatus(401);
    }
}
