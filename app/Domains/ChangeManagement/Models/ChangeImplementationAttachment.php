<?php

namespace App\Domains\ChangeManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChangeImplementationAttachment extends Model
{
    protected $fillable = [
        'change_implementation_id',
        'path',
        'sort_order',
    ];

    public function implementation(): BelongsTo
    {
        return $this->belongsTo(ChangeImplementation::class, 'change_implementation_id');
    }
}
