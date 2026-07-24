<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Package model: parent change_initiations is source of truth.
     * Child status mirror: draft→draft, pending→submitted, approved→completed, rejected→rejected.
     * No revision status on package flow.
     *
     * Duplicate cleanup: soft-delete extras, keep latest id per initiation.
     * Unique is partial (deleted_at IS NULL) so soft-deleted extras do not block 1:1.
     */
    public function up(): void
    {
        $duplicates = DB::table('change_implementations')
            ->select('change_initiation_id')
            ->whereNull('deleted_at')
            ->groupBy('change_initiation_id')
            ->havingRaw('count(*) > 1')
            ->pluck('change_initiation_id');

        foreach ($duplicates as $initiationId) {
            $keepId = DB::table('change_implementations')
                ->where('change_initiation_id', $initiationId)
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->value('id');

            DB::table('change_implementations')
                ->where('change_initiation_id', $initiationId)
                ->whereNull('deleted_at')
                ->where('id', '!=', $keepId)
                ->update(['deleted_at' => now()]);
        }

        DB::table('change_implementations')
            ->where('status', 'revision')
            ->update(['status' => 'rejected']);

        Schema::table('change_implementations', function (Blueprint $table) {
            $table->dropIndex(['change_initiation_id']);
        });

        // Partial unique: one live implementation per initiation.
        DB::statement('CREATE UNIQUE INDEX change_implementations_change_initiation_id_unique ON change_implementations (change_initiation_id) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS change_implementations_change_initiation_id_unique');

        Schema::table('change_implementations', function (Blueprint $table) {
            $table->index('change_initiation_id');
        });
    }
};
