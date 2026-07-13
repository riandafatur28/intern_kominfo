<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('wfh_attendance_id')->nullable()->constrained('wfh_attendances')->nullOnDelete();
            $table->date('report_date');
            $table->string('status', 20)->default('draft'); // draft, pending, approved, rejected
            $table->timestamp('maker_signed_at')->nullable();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('supervisor_signed_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'report_date']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_reports');
    }
};
