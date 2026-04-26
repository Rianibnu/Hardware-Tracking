<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasRealtimeUpdates;

class Asset extends Model
{
    use HasRealtimeUpdates;
    protected $fillable = [
        'code', 'name', 'category_id', 'serial_number',
        'brand_id', 'model', 'purchase_year',
        'status', 'location_id', 'notes',
    ];

    protected $casts = [
        'purchase_year' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AssetLog::class);
    }

    public function serviceRecords(): HasMany
    {
        return $this->hasMany(ServiceRecord::class);
    }
}
