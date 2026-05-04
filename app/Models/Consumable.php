<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consumable extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'category_id',
        'unit',
        'current_stock',
        'min_stock',
        'description',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'min_stock' => 'integer',
    ];

    protected $appends = ['stock_status'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(ConsumableTransaction::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ConsumableRequest::class);
    }

    /**
     * Stock status: safe, low, empty
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->current_stock <= 0) return 'empty';
        if ($this->current_stock <= $this->min_stock) return 'low';
        return 'safe';
    }
}
