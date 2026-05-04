<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumableTransaction extends Model
{
    protected $fillable = [
        'consumable_id',
        'type',
        'quantity',
        'unit_price',
        'supplier',
        'request_id',
        'distributed_to',
        'location_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function consumable(): BelongsTo
    {
        return $this->belongsTo(Consumable::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(ConsumableRequest::class, 'request_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'distributed_to');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
