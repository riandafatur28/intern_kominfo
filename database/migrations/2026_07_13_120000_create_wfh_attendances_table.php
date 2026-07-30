<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wfh_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('session', 10)->default('pagi'); // pagi, sore
            $table->string('photo_path');
            $table->timestamp('check_in_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'date', 'session'], 'wfh_attendance_unique');
            $table->index(['date', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wfh_attendances');
    }
};
