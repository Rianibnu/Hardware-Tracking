<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoogleSheetConfig extends Model
{
    protected $table = 'google_sheets_configs';

    protected $fillable = [
        'name',
        'spreadsheet_id',
        'spreadsheet_url',
        'sync_sheets',
        'auto_sync',
        'sync_interval_minutes',
        'status',
        'last_error',
        'last_synced_at',
        'last_sync_rows',
        'created_by',
    ];

    protected $casts = [
        'sync_sheets' => 'array',
        'auto_sync' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(GoogleSheetSyncLog::class, 'config_id');
    }

    /**
     * Extract spreadsheet ID from a Google Sheets URL
     */
    public static function extractSpreadsheetId(string $url): ?string
    {
        if (preg_match('/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $url, $matches)) {
            return $matches[1];
        }
        // If it's already just an ID
        if (preg_match('/^[a-zA-Z0-9-_]+$/', $url)) {
            return $url;
        }
        return null;
    }
}
