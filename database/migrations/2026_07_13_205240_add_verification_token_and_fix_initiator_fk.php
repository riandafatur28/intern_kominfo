<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // R9: change initiator_id from cascadeOnDelete to nullOnDelete to preserve audit trail
        Schema::table('change_initiations', function (Blueprint $table) {
            $table->dropForeign(['initiator_id']);
            $table->foreign('initiator_id')->references('id')->on('users')->nullOnDelete();
        });

        // C1: add verification_token for QR document verification
        Schema::table('wfh_reports', function (Blueprint $table) {
            $table->string('verification_token', 64)->nullable()->unique()->after('reject_reason');
        });

        Schema::table('change_initiations', function (Blueprint $table) {
            $table->string('verification_token', 64)->nullable()->unique()->after('initiator_signed_at');
        });
    }

    public function down(): void
    {
        Schema::table('change_initiations', function (Blueprint $table) {
            $table->dropColumn('verification_token');
            $table->dropForeign(['initiator_id']);
            $table->foreign('initiator_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('wfh_reports', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};
