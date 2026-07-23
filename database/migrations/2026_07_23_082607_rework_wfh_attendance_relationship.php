<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wfh_attendances', function (Blueprint $table) {
            $table->foreignId('report_id')->nullable()->constrained('wfh_reports')->nullOnDelete()->after('session');
        });

        Schema::table('wfh_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wfh_attendance_id');
        });
    }

    public function down(): void
    {
        Schema::table('wfh_reports', function (Blueprint $table) {
            $table->foreignId('wfh_attendance_id')->nullable()->constrained('wfh_attendances')->nullOnDelete();
        });

        Schema::table('wfh_attendances', function (Blueprint $table) {
            $table->dropConstrainedForeignId('report_id');
        });
    }
};
