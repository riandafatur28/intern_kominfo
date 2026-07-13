<?php

namespace App\Domains\Wfh\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WfhReport extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'wfh_attendance_id',
        'report_date',
        'status',
        'maker_signed_at',
        'supervisor_id',
        'supervisor_signed_at',
        'reject_reason',
    ];

    protected $casts = [
        'report_date' => 'date',
        'maker_signed_at' => 'datetime',
        'supervisor_signed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(WfhAttendance::class, 'wfh_attendance_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(WfhReportActivity::class)->orderBy('sort_order');
    }
}
