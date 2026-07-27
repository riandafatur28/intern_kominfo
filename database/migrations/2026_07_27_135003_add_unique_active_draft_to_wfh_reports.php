<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE UNIQUE INDEX wfh_reports_active_draft_unique
            ON wfh_reports (user_id, report_date)
            WHERE status IN ('draft', 'rejected')
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS wfh_reports_active_draft_unique');
    }
};