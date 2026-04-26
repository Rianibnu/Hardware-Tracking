<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Send notification to a user.
     */
    public static function send(int $userId, string $type, string $title, string $message, ?string $link = null, ?array $data = null): self
    {
        $notification = static::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'data' => $data,
        ]);

        event(new \App\Events\NotificationSent($notification));

        return $notification;
    }

    /**
     * Send notification to multiple users.
     */
    public static function sendToMany(array $userIds, string $type, string $title, string $message, ?string $link = null, ?array $data = null): void
    {
        foreach ($userIds as $userId) {
            static::send($userId, $type, $title, $message, $link, $data);
        }
    }
}
