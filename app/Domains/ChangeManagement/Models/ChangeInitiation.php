<?php

namespace App\Domains\ChangeManagement\Models;

use App\Models\Field;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChangeInitiation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'field_id',
        'initiator_id',
        'reviewer_id',
        'doc_number',
        'initiation_date',
        'needed_by_date',
        'description',
        'reason',
        'status',
        'review_status',
        'reviewed_at',
        'review_reason',
        'initiator_signed_at',
        'verification_token',
    ];

    protected $casts = [
        'initiation_date' => 'date',
        'needed_by_date' => 'date',
        'reviewed_at' => 'datetime',
        'initiator_signed_at' => 'datetime',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiator_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function implementations(): HasMany
    {
        return $this->hasMany(ChangeImplementation::class);
    }
}
