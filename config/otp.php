<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OTP Configuration
    |--------------------------------------------------------------------------
    |
    | Configure one-time password behavior for password reset flow.
    | All values can be overridden via environment variables for easy
    | policy changes without code deployment.
    |
    */

    // How long an OTP code remains valid (minutes).
    'expires_minutes' => (int) env('OTP_EXPIRES_MINUTES', 15),

    // Minimum seconds before a new OTP can be requested for the same email.
    'cooldown_seconds' => (int) env('OTP_COOLDOWN_SECONDS', 300),

    // Number of digits in the OTP code.
    'length' => (int) env('OTP_LENGTH', 6),

    // Max failed verification attempts before the OTP is invalidated.
    'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),

];
