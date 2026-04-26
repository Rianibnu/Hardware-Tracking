<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasRealtimeUpdates;

class Category extends Model
{
    use HasRealtimeUpdates;
    protected $fillable = ['name', 'description'];

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }
}
