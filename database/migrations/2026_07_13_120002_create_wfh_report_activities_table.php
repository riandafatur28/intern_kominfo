<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_report_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wfh_report_id')->constrained('wfh_reports')->cascadeOnDelete();
            $table->time('start_time');
            $table->time('end_time');
            $table->text('activity');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('wfh_report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_report_activities');
    }
};
