<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $perPage = $request->get('per_page', 10);

        $notifications = $this->notificationService->getUserNotifications($user, $perPage);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $this->notificationService->getUnreadCount($user)
        ]);
    }

    /**
     * Get notifications as JSON for API
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $user = auth()->user();
        $perPage = $request->get('per_page', 10);

        $notifications = $this->notificationService->getUserNotifications($user, $perPage);

        return response()->json([
            'notifications' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => $this->notificationService->getUnreadCount($user)
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        $user = auth()->user();

        // Check if user owns this notification
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $this->notificationService->markAsRead($notification);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'unread_count' => $this->notificationService->getUnreadCount($user)
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = auth()->user();

        $this->notificationService->markAllAsRead($user);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
            'unread_count' => 0
        ]);
    }

    /**
     * Get unread count for badge
     */
    public function getUnreadCount(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'unread_count' => $this->notificationService->getUnreadCount($user)
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Notification $notification): JsonResponse
    {
        $user = auth()->user();

        // Check if user owns this notification
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
            'unread_count' => $this->notificationService->getUnreadCount($user)
        ]);
    }
}
