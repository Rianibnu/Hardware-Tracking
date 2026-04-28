<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditDetail extends Model
{
    protected $fillable = [
        'audit_id',
        'asset_id',
        'status',
        'scanned_at',
        'notes',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function audit()
    {
        return $this->belongsTo(Audit::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }
}
