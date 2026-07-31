<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('change_initiations', function ($table) {
            $table->dropColumn('review_reason');
        });
    }

    public function down(): void
    {
        Schema::table('change_initiations', function ($table) {
            $table->text('review_reason')->nullable();
        });
    }
};
