<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasRealtimeUpdates;

class Location extends Model
{
    use HasRealtimeUpdates;
    protected $fillable = ['name', 'building', 'floor', 'room'];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
}
