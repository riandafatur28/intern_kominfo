<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Partial unique index: at most one draft/rejected report per (user, date).
        // Backstop for the app-level get-or-create in store(); lets approved
        // reports coexist with a fresh draft for the same user+date.
        DB::statement("
            CREATE UNIQUE INDEX IF NOT EXISTS wfh_reports_active_draft_unique
            ON wfh_reports (user_id, report_date)
            WHERE status IN ('draft', 'rejected')
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS wfh_reports_active_draft_unique');
    }
};
