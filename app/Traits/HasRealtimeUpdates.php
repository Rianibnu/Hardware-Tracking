<?php

namespace App\Traits;

use App\Events\SystemDataUpdated;

trait HasRealtimeUpdates
{
    protected static function bootHasRealtimeUpdates()
    {
        static::created(function ($model) {
            broadcast(new SystemDataUpdated(class_basename($model)));
        });

        static::updated(function ($model) {
            broadcast(new SystemDataUpdated(class_basename($model)));
        });

        static::deleted(function ($model) {
            broadcast(new SystemDataUpdated(class_basename($model)));
        });
    }
}
