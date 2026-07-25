<?php

namespace App\Domains\Wfh\Models;

use Illuminate\Database\Eloquent\Model;

class WfhReminderDispatch extends Model
{
    protected $fillable = [
        'dispatch_date',
        'dispatched_at',
    ];

    protected $casts = [
        'dispatch_date' => 'date',
        'dispatched_at' => 'datetime',
    ];
}
