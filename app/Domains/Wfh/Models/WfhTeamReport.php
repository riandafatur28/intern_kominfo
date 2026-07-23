<?php

namespace App\Domains\Wfh\Models;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WfhTeamReport extends Model
{
    protected $table = 'wfh_team_reports';

    protected $fillable = [
        'team_id',
        'report_date',
        'status',
        'created_by',
        'supervisor_id',
        'maker_signed_at',
        'supervisor_signed_at',
        'reject_reason',
        'verification_token',
    ];

    protected $casts = [
        'report_date' => 'date',
        'maker_signed_at' => 'datetime',
        'supervisor_signed_at' => 'datetime',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
