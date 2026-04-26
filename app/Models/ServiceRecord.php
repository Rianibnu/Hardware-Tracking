<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasRealtimeUpdates;

class ServiceRecord extends Model
{
    use HasRealtimeUpdates;
    protected $fillable = [
        'asset_id',
        'ticket_id',
        'vendor_name',
        'service_description',
        'estimated_completion_date',
        'cost',
        'status',
        'created_by',
        'completed_by',
        'completed_at',
    ];

    protected $casts = [
        'estimated_completion_date' => 'date',
        'completed_at' => 'datetime',
        'cost' => 'decimal:2',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
