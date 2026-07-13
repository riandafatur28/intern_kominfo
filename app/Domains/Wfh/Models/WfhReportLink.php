<?php

namespace App\Domains\Wfh\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WfhReportLink extends Model
{
    protected $fillable = [
        'wfh_report_activity_id',
        'url',
        'sort_order',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(WfhReportActivity::class, 'wfh_report_activity_id');
    }
}
