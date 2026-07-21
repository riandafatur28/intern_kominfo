<?php

namespace App\Domains\Wfh\Models;

use App\Models\User;
use App\Models\Team;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WfhReportRecap extends Model
{
    protected $fillable = [
        'admin_id',
        'team_id',
        'period_start',
        'period_end',
        'status',
        'kabid_id',
        'kabid_signed_at',
        'reject_reason',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'kabid_signed_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function kabid(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kabid_id');
    }
}
