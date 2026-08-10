<?php

namespace App\Domains\Auth\Models;

use Database\Factories\Domains\Auth\PasswordResetOtpFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordResetOtp extends Model
{
    use HasFactory;

    protected $table = 'password_reset_otps';

    protected $primaryKey = 'email';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'email',
        'code_hash',
        'expires_at',
        'used_at',
        'attempts',
        'last_sent_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'attempts' => 'integer',
    ];

    protected static function newFactory(): PasswordResetOtpFactory
    {
        return PasswordResetOtpFactory::new();
    }
}
