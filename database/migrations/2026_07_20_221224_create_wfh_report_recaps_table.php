<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_report_recaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users');
            $table->foreignId('team_id')->constrained('teams');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('status')->default('draft'); // draft, pending, approved, rejected
            $table->foreignId('kabid_id')->nullable()->constrained('users');
            $table->timestamp('kabid_signed_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_report_recaps');
    }
};
