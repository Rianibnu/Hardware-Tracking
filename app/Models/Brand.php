<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasRealtimeUpdates;

class Brand extends Model
{
    use HasRealtimeUpdates;

    protected $fillable = ['name', 'description'];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
