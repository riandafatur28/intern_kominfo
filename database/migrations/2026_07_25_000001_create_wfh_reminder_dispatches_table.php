<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_reminder_dispatches', function (Blueprint $table) {
            $table->id();
            $table->date('dispatch_date')->unique();
            $table->timestamp('dispatched_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_reminder_dispatches');
    }
};
