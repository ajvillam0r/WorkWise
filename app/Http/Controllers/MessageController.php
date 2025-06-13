<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Display message inbox
     */
    public function index(): Response
    {
        $userId = auth()->id();

        // Get conversations (unique users the current user has messaged with)
        $conversations = Message::where(function($query) use ($userId) {
            $query->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
        })
        ->with(['sender:id,first_name,last_name,user_type,professional_title', 
                'receiver:id,first_name,last_name,user_type,professional_title'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->groupBy(function($message) use ($userId) {
            // Group by the other user in the conversation
            return $message->sender_id === $userId
                ? $message->receiver_id
                : $message->sender_id;
        })
        ->map(function($messages) use ($userId) {
            $latestMessage = $messages->first();
            $otherUser = $latestMessage->sender_id === $userId
                ? $latestMessage->receiver
                : $latestMessage->sender;

            $unreadCount = $messages->where('receiver_id', $userId)
                                  ->where('is_read', false)
                                  ->count();

            return [
                'user' => $otherUser,
                'latest_message' => [
                    'message' => $latestMessage->message,
                    'type' => $latestMessage->type,
                    'attachment_name' => $latestMessage->attachment_name,
                ],
                'unread_count' => $unreadCount,
                'last_activity' => $latestMessage->created_at
            ];
        })
        ->sortByDesc('last_activity')
        ->values()
        ->all();

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations
        ]);
    }

    /**
     * Display conversation with specific user
     */
    public function conversation(User $user): Response
    {
        $currentUserId = auth()->id();

        // Get messages between current user and specified user
        $messages = Message::where(function($query) use ($currentUserId, $user) {
            $query->where('sender_id', $currentUserId)
                  ->where('receiver_id', $user->id);
        })
        ->orWhere(function($query) use ($currentUserId, $user) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', $currentUserId);
        })
        ->with(['sender', 'receiver'])
        ->orderBy('created_at', 'asc')
        ->get();

        // Mark messages from the other user as read
        Message::where('sender_id', $user->id)
               ->where('receiver_id', $currentUserId)
               ->where('is_read', false)
               ->update(['is_read' => true, 'read_at' => now()]);

        return Inertia::render('Messages/Conversation', [
            'user' => $user,
            'messages' => $messages,
            'currentUser' => auth()->user()
        ]);
    }

    /**
     * Send a new message
     */
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_without:attachment|string|max:2000',
            'attachment' => 'nullable|file|max:10240', // 10MB max
            'project_id' => 'nullable|exists:projects,id'
        ]);

        $attachmentPath = null;
        $attachmentName = null;

        // Handle file attachment
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->store('message-attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $request->receiver_id,
            'project_id' => $request->project_id,
            'message' => $request->message ?? '',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'type' => $attachmentPath ? 'file' : 'text'
        ]);

        $message->load(['sender', 'receiver']);

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }

    /**
     * Mark message as read
     */
    public function markAsRead(Message $message)
    {
        // Only receiver can mark as read
        if ($message->receiver_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $message->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Get unread message count
     */
    public function unreadCount()
    {
        $count = Message::where('receiver_id', auth()->id())
                       ->where('is_read', false)
                       ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Download message attachment
     */
    public function downloadAttachment(Message $message)
    {
        // Ensure user is involved in this conversation
        if ($message->sender_id !== auth()->id() && $message->receiver_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        if (!$message->hasAttachment()) {
            abort(404, 'Attachment not found');
        }

        return Storage::disk('public')->download(
            $message->attachment_path,
            $message->attachment_name
        );
    }

    /**
     * Get users available for starting conversations
     */
    public function getUsers()
    {
        $currentUserId = auth()->id();

        // Get users that the current user hasn't messaged with yet
        $existingConversationUserIds = Message::where(function($query) use ($currentUserId) {
            $query->where('sender_id', $currentUserId)
                  ->orWhere('receiver_id', $currentUserId);
        })
        ->get()
        ->pluck('sender_id', 'receiver_id')
        ->flatten()
        ->unique()
        ->filter(function($id) use ($currentUserId) {
            return $id !== $currentUserId;
        })
        ->values()
        ->toArray();

        // Get all users except current user and those already in conversations
        $users = User::where('id', '!=', $currentUserId)
            ->whereNotIn('id', $existingConversationUserIds)
            ->select('id', 'first_name', 'last_name', 'user_type', 'professional_title', 'profile_photo')
            ->orderBy('first_name')
            ->get();

        return response()->json(['users' => $users]);
    }
}
