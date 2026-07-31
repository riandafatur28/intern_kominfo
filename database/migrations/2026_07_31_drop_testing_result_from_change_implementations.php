<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('change_implementations', function ($table) {
            $table->dropColumn('testing_result');
        });
    }

    public function down(): void
    {
        Schema::table('change_implementations', function ($table) {
            $table->text('testing_result')->nullable();
        });
    }
};
