<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Priority: low/medium/high/critical → normal/emergency
        DB::statement("UPDATE change_implementations SET priority = 'normal' WHERE priority NOT IN ('normal', 'emergency')");

        // Impact: low/medium/high → Minor/Mayor
        DB::statement("UPDATE change_implementations SET impact = 'Minor' WHERE impact NOT IN ('Minor', 'Mayor')");
    }

    public function down(): void
    {
        // Not reversible — old values are ambiguous.
    }
};
