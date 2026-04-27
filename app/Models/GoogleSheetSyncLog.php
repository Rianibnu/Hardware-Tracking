<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoogleSheetSyncLog extends Model
{
    protected $table = 'google_sheets_sync_logs';

    protected $fillable = [
        'config_id',
        'type',
        'status',
        'sheets_synced',
        'total_rows',
        'duration_seconds',
        'error_message',
        'triggered_by',
    ];

    protected $casts = [
        'sheets_synced' => 'array',
    ];

    public function config(): BelongsTo
    {
        return $this->belongsTo(GoogleSheetConfig::class, 'config_id');
    }

    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
