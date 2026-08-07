<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/*
 * Drop the default Laravel `password_reset_tokens` table.
 *
 * Replaced by `password_reset_otps` (OTP-based flow via Resend).
 * No code references the default broker — the public reset flow uses
 * PasswordResetService, not Password::broker().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }

    public function down(): void
    {
        Schema::create('password_reset_tokens', function ($table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
