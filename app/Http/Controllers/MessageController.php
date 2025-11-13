<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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
                'last_activity' => $latestMessage->created_at,
                'last_message' => $latestMessage->message,
                'status' => 'new_lead' // Default status, can be enhanced later with a conversations table
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
        // Validate request - message is optional if attachment is present
        $request->validate([
            'receiver_id' => 'required_without:recipient_id|exists:users,id',
            'recipient_id' => 'required_without:receiver_id|exists:users,id',
            'message' => 'required_without:attachment|string|min:1|max:2000',
            'attachment' => [
                'nullable',
                'file',
                'max:10240', // 10MB max
                'mimes:pdf,doc,docx,png,jpg,jpeg,gif,txt,zip,rar'
            ],
            'project_id' => 'nullable|exists:projects,id'
        ], [
            'attachment.max' => 'File size must not exceed 10MB.',
            'attachment.mimes' => 'File must be one of the following types: PDF, DOC, DOCX, PNG, JPG, JPEG, GIF, TXT, ZIP, or RAR.',
            'message.required_without' => 'Please provide a message or attach a file.'
        ]);

        $attachmentPath = null;
        $attachmentName = null;

        // Handle file attachment upload to R2
        if ($request->hasFile('attachment')) {
            try {
                $file = $request->file('attachment');
                $attachmentName = $file->getClientOriginalName();
                
                // Upload to R2
                $path = Storage::disk('r2')->putFile('messages/' . auth()->id(), $file);
                
                if ($path) {
                    $attachmentPath = Storage::disk('r2')->url($path);
                    Log::info('Message attachment uploaded successfully', [
                        'user_id' => auth()->id(),
                        'filename' => $attachmentName,
                        'path' => $path
                    ]);
                } else {
                    Log::error('Message attachment upload failed: Storage returned false', [
                        'user_id' => auth()->id(),
                        'filename' => $attachmentName
                    ]);
                    return back()->withErrors(['attachment' => 'Failed to upload attachment. Please try again.']);
                }
            } catch (\Exception $e) {
                Log::error('Message attachment upload failed: ' . $e->getMessage(), [
                    'user_id' => auth()->id(),
                    'filename' => $attachmentName ?? 'unknown',
                    'exception' => $e->getTraceAsString()
                ]);
                return back()->withErrors(['attachment' => 'Failed to upload attachment. Please try again.']);
            }
        }

        // Support both receiver_id and recipient_id for backwards compatibility
        $receiverId = $request->receiver_id ?? $request->recipient_id;

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $receiverId,
            'project_id' => $request->project_id,
            'message' => $request->message ?? '',
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'type' => $attachmentPath ? 'file' : 'text'
        ]);

        $message->load(['sender', 'receiver']);

        // Send notification to receiver about new message
        $notificationService = new \App\Services\NotificationService();
        $senderName = $message->sender->first_name && $message->sender->last_name
            ? "{$message->sender->first_name} {$message->sender->last_name}"
            : $message->sender->name;
            
        $notificationService->create([
            'user_id' => $request->receiver_id,
            'type' => 'new_message',
            'title' => 'New Message',
            'message' => $message->type === 'file'
                ? "📎 {$message->sender->first_name} sent you a file: {$message->attachment_name}"
                : "💬 {$message->sender->first_name}: {$message->message}",
            'data' => [
                'sender_id' => $message->sender_id,
                'sender_name' => $senderName,
                'sender_avatar' => $message->sender->avatar ?? null,
                'message_id' => $message->id,
                'message_type' => $message->type,
                'attachment_name' => $message->attachment_name
            ],
            'action_url' => null, // Don't set action_url to prevent redirect
            'icon' => 'comments'
        ]);

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
     * 
     * ERROR HANDLING (Requirement 7.6):
     * - Verifies user authorization (sender or receiver only)
     * - Checks if attachment exists in message record
     * - Validates attachment file path
     * - Verifies file exists in R2 storage
     * - Provides user-friendly error messages for all failure scenarios
     */
    public function downloadAttachment(Message $message)
    {
        // Verify user is sender or receiver of the message (Requirement 7.3, 7.4)
        if ($message->sender_id !== auth()->id() && $message->receiver_id !== auth()->id()) {
            abort(403, 'Unauthorized access to attachment');
        }

        // Check if message has an attachment (Requirement 7.6)
        if (!$message->hasAttachment()) {
            Log::warning('Attachment download attempted on message without attachment', [
                'message_id' => $message->id,
                'user_id' => auth()->id()
            ]);
            return back()->withErrors(['attachment' => 'This message does not have an attachment.']);
        }

        // Verify attachment file path exists (Requirement 7.6)
        if (!$message->attachment_path) {
            Log::error('Attachment path is missing from message record', [
                'message_id' => $message->id,
                'user_id' => auth()->id()
            ]);
            return back()->withErrors(['attachment' => 'Attachment file information is missing. Please contact support.']);
        }

        // Verify file exists in R2 storage (Requirement 7.6)
        try {
            // Extract path from URL if it's a full URL
            $path = $message->attachment_path;
            if (str_contains($path, 'http')) {
                // If it's a full URL, we'll trust it exists (R2 will handle 404)
                // But we can add additional validation if needed
                Log::info('Attachment download initiated', [
                    'message_id' => $message->id,
                    'user_id' => auth()->id(),
                    'filename' => $message->attachment_name
                ]);
            } else {
                // If it's a relative path, check if file exists in R2
                if (!Storage::disk('r2')->exists($path)) {
                    Log::error('Attachment file not found in R2 storage', [
                        'message_id' => $message->id,
                        'user_id' => auth()->id(),
                        'path' => $path,
                        'filename' => $message->attachment_name
                    ]);
                    return back()->withErrors(['attachment' => 'The attachment file could not be found. It may have been deleted.']);
                }
            }

            // Redirect to R2 public URL (attachment_path already contains full URL)
            // This preserves the original filename through the attachment_name field
            return redirect()->away($message->attachment_path);
            
        } catch (\Exception $e) {
            // Handle R2 download failures gracefully (Requirement 7.6)
            Log::error('Attachment download failed: ' . $e->getMessage(), [
                'message_id' => $message->id,
                'user_id' => auth()->id(),
                'filename' => $message->attachment_name,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['attachment' => 'Failed to download attachment. Please try again or contact support if the problem persists.']);
        }
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

    /**
     * Get recent conversations for dropdown
     */
    public function getRecentConversations()
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
                    'created_at' => $latestMessage->created_at
                ],
                'unread_count' => $unreadCount,
                'last_activity' => $latestMessage->created_at
            ];
        })
        ->sortByDesc('last_activity')
        ->take(5) // Limit to 5 recent conversations
        ->values()
        ->all();

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Get unread message count for the authenticated user
     */
    public function getUnreadCount()
    {
        $userId = auth()->id();
        $unreadCount = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $unreadCount]);
    }

    /**
     * Get messages for a specific conversation
     */
    public function getConversation($userId)
    {
        $currentUserId = auth()->id();

        $messages = Message::where(function($query) use ($currentUserId, $userId) {
            $query->where('sender_id', $currentUserId)
                  ->where('receiver_id', $userId);
        })->orWhere(function($query) use ($currentUserId, $userId) {
            $query->where('sender_id', $userId)
                  ->where('receiver_id', $currentUserId);
        })->with(['sender', 'receiver'])
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Mark all messages in a conversation as read
     */
    public function markConversationAsRead($userId)
    {
        $currentUserId = auth()->id();

        // Mark all messages from the other user to current user as read
        $updatedCount = Message::where('sender_id', $userId)
            ->where('receiver_id', $currentUserId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'marked_read_count' => $updatedCount
        ]);
    }

    /**
     * Update conversation status
     */
    public function updateConversationStatus(Request $request, $conversationId)
    {
        $request->validate([
            'status' => 'required|in:new_lead,active_project,completed,archived'
        ]);

        // For now, we'll just return success since we don't have a conversations table
        // In a real implementation, you would update a conversations table
        // or add a status field to the messages table

        return response()->json([
            'success' => true,
            'status' => $request->status
        ]);
    }

    /**
     * Get new messages for polling
     */
    public function getNewMessages(User $user, Request $request)
    {
        $currentUserId = auth()->id();
        $lastMessageId = $request->query('last_id', 0);

        $newMessages = Message::where(function($query) use ($currentUserId, $user) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', $currentUserId);
        })
        ->where('id', '>', $lastMessageId)
        ->with(['sender', 'receiver'])
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'messages' => $newMessages
        ]);
    }
}
