<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user (JSON for bell dropdown).
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->latest()
            ->limit(20)
            ->get();

        $unreadCount = Notification::where('user_id', auth()->id())
            ->unread()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            abort(403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
