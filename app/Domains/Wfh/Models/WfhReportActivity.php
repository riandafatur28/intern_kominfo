<?php

namespace App\Domains\Wfh\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WfhReportActivity extends Model
{
    protected $fillable = [
        'wfh_report_id',
        'start_time',
        'end_time',
        'activity',
        'sort_order',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(WfhReport::class, 'wfh_report_id');
    }

    public function links(): HasMany
    {
        return $this->hasMany(WfhReportLink::class)->orderBy('sort_order');
    }
}
