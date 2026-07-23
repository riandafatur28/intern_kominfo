<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_team_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->date('report_date');
            $table->string('status', 20)->default('draft'); // draft, pending, approved, rejected
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('maker_signed_at')->nullable();
            $table->timestamp('supervisor_signed_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->string('verification_token', 64)->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'report_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_team_reports');
    }
};
