<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_report_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wfh_report_activity_id')->constrained('wfh_report_activities')->cascadeOnDelete();
            $table->text('url');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('wfh_report_activity_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_report_links');
    }
};
