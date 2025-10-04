<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService
{
    /**
     * Create a new notification
     */
    public function create(array $data): Notification
    {
        return Notification::create($data);
    }

    /**
     * Get notifications for a user
     */
    public function getUserNotifications(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get unread notifications count for a user
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(User $user): void
    {
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);
    }

    /**
     * Create bid status notification
     */
    public function createBidStatusNotification(User $user, string $status, array $bidData): Notification
    {
        $statusMessages = [
            'accepted' => [
                'title' => '🎉 Bid Accepted!',
                'message' => "Congratulations! Your bid for '{$bidData['job_title']}' has been accepted.",
                'icon' => 'check-circle',
                'action_url' => route('contracts.show', $bidData['contract_id'] ?? '#')
            ],
            'rejected' => [
                'title' => 'Bid Not Accepted',
                'message' => "Your bid for '{$bidData['job_title']}' was not selected this time.",
                'icon' => 'x-circle',
                'action_url' => route('jobs.show', $bidData['job_id'])
            ]
        ];

        if (!isset($statusMessages[$status])) {
            throw new \InvalidArgumentException("Invalid bid status: {$status}");
        }

        $messageData = $statusMessages[$status];

        return $this->create([
            'user_id' => $user->id,
            'type' => 'bid_status',
            'title' => $messageData['title'],
            'message' => $messageData['message'],
            'data' => $bidData,
            'action_url' => $messageData['action_url'],
            'icon' => $messageData['icon']
        ]);
    }

    /**
     * Create contract signing notification
     */
    public function createContractSigningNotification(User $user, array $contractData): Notification
    {
        return $this->create([
            'user_id' => $user->id,
            'type' => 'contract_signing',
            'title' => '📋 Contract Ready for Signing',
            'message' => "Contract for '{$contractData['job_title']}' is ready for your signature.",
            'data' => $contractData,
            'action_url' => route('contracts.sign', $contractData['contract_id']),
            'icon' => 'file-text'
        ]);
    }

    /**
     * Create AI recommendation notification
     */
    public function createAIRecommendationNotification(User $user, array $recommendationData): Notification
    {
        return $this->create([
            'user_id' => $user->id,
            'type' => 'ai_recommendation',
            'title' => '🤖 AI Match Found!',
            'message' => "We found a great match for you: '{$recommendationData['job_title']}'.",
            'data' => $recommendationData,
            'action_url' => route('jobs.show', $recommendationData['job_id']),
            'icon' => 'brain'
        ]);
    }

    /**
     * Create contract fully signed notification
     */
    public function createContractFullySignedNotification(User $user, array $contractData): Notification
    {
        return $this->create([
            'user_id' => $user->id,
            'type' => 'contract_fully_signed',
            'title' => '✅ Contract Fully Signed!',
            'message' => "Contract for '{$contractData['job_title']}' has been fully signed and work can begin.",
            'data' => $contractData,
            'action_url' => route('projects.show', $contractData['project_id']),
            'icon' => 'check-circle'
        ]);
    }

    /**
     * Delete old notifications (older than 30 days)
     */
    public function cleanupOldNotifications(): int
    {
        return Notification::where('created_at', '<', now()->subDays(30))
            ->delete();
    }

    /**
     * Get notifications by type for a user
     */
    public function getNotificationsByType(User $user, string $type, int $limit = 10): \Illuminate\Support\Collection
    {
        return Notification::where('user_id', $user->id)
            ->where('type', $type)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Create escrow status notification
     */
    public function createEscrowStatusNotification(User $user, array $escrowData): Notification
    {
        $title = '💰 Escrow Status Update';
        $message = "Escrow status updated for '{$escrowData['project_title']}'";

        if ($escrowData['status'] === 'low_balance') {
            $title = '⚠️ Low Escrow Balance';
            $message = "Escrow balance for '{$escrowData['project_title']}' is running low";
        } elseif ($escrowData['status'] === 'payment_released') {
            $title = '✅ Payment Released';
            $message = "Payment released for '{$escrowData['project_title']}'";
        }

        return $this->create([
            'user_id' => $user->id,
            'type' => 'escrow_status',
            'title' => $title,
            'message' => $message,
            'data' => $escrowData,
            'action_url' => route('projects.show', $escrowData['project_id']),
            'icon' => 'currency-dollar'
        ]);
    }

    /**
     * Create deadline notification
     */
    public function createDeadlineNotification(User $user, array $deadlineData): Notification
    {
        $title = '⏰ Deadline Update';
        $message = "Deadline update for '{$deadlineData['milestone_name']}'";

        if ($deadlineData['status'] === 'approaching') {
            $title = '⏰ Deadline Approaching';
            $message = "Deadline for '{$deadlineData['milestone_name']}' is approaching";
        } elseif ($deadlineData['status'] === 'overdue') {
            $title = '🚨 Deadline Overdue';
            $message = "Deadline for '{$deadlineData['milestone_name']}' is overdue";
        }

        return $this->create([
            'user_id' => $user->id,
            'type' => 'deadline_approaching',
            'title' => $title,
            'message' => $message,
            'data' => $deadlineData,
            'action_url' => route('projects.show', $deadlineData['project_id']),
            'icon' => 'clock'
        ]);
    }

    /**
     * Create message notification
     */
    public function createMessageNotification(User $user, array $messageData): Notification
    {
        return $this->create([
            'user_id' => $user->id,
            'type' => 'message_received',
            'title' => '💬 New Message',
            'message' => "New message from {$messageData['sender_name']}",
            'data' => $messageData,
            'action_url' => null, // Don't set action_url to prevent redirect, use MiniChat instead
            'icon' => 'chat-bubble-left'
        ]);
    }

    /**
     * Create bid accepted with messaging notification
     */
    public function createBidAcceptedMessagingNotification(User $user, array $bidData): Notification
    {
        $otherUserName = $bidData['other_user_name'];
        $jobTitle = $bidData['job_title'];

        return $this->create([
            'user_id' => $user->id,
            'type' => 'bid_accepted_messaging',
            'title' => '🎉 Bid Accepted - Start Messaging!',
            'message' => "Great news! Your bid for '{$jobTitle}' was accepted. You can now message {$otherUserName} directly to discuss the project details.",
            'data' => array_merge($bidData, [
                'show_message_button' => true,
                'message_target_user_id' => $bidData['other_user_id']
            ]),
            'action_url' => null, // Don't set action_url to prevent redirect, use MiniChat instead
            'icon' => 'chat-bubble-left'
        ]);
    }

    /**
     * Get recent notifications for dashboard
     */
    public function getRecentNotifications(User $user, int $limit = 10): \Illuminate\Support\Collection
    {
        return Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get notifications by multiple types
     */
    public function getNotificationsByTypes(User $user, array $types, int $limit = 10): \Illuminate\Support\Collection
    {
        return Notification::where('user_id', $user->id)
            ->whereIn('type', $types)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}