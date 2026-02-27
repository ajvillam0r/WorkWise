<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class UserHeartbeatController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get unread counts for notifications and messages
     */
    public function heartbeat(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $unreadNotifications = $this->notificationService->getUnreadCount($user);
        
        $unreadMessages = Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_notifications_count' => $unreadNotifications,
            'unread_messages_count' => $unreadMessages,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
