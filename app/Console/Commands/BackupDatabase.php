<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Portable, pure-PHP data export for the currently-configured PostgreSQL database —
 * written because pg_dump isn't installed anywhere on this machine (checked PATH and
 * common install locations; nothing found). Produces a single timestamped .sql file
 * in database/backups/, matching the naming convention of the existing manual dump
 * already in that folder (kominfo_wfh_YYYY-MM-DD_HHMMSS.sql).
 *
 * This is a DATA-only dump — schema is already fully reproducible from
 * database/migrations/. To restore: `php artisan migrate:fresh` then run this file's
 * INSERT statements (e.g. `psql -f <file>`, or feed it through any Postgres client).
 */
class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--connection= : Override the DB connection to back up (defaults to config default)}';

    protected $description = 'Export all rows of the current PostgreSQL database to a single timestamped .sql file in database/backups/';

    public function handle(): int
    {
        $connectionName = $this->option('connection') ?: config('database.default');
        $connection = DB::connection($connectionName);

        if ($connection->getDriverName() !== 'pgsql') {
            $this->error("Connection '{$connectionName}' is not PostgreSQL (driver: {$connection->getDriverName()}). This command only supports pgsql.");

            return Command::FAILURE;
        }

        $databaseName = $connection->getDatabaseName();
        $tables = $this->listTables($connection);

        if (empty($tables)) {
            $this->warn('No tables found — nothing to back up.');

            return Command::SUCCESS;
        }

        $timestamp = now()->format('Y-m-d_His');
        $directory = database_path('backups');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        $filename = "{$directory}/{$databaseName}_{$timestamp}.sql";

        $handle = fopen($filename, 'w');
        if ($handle === false) {
            $this->error("Could not open {$filename} for writing.");

            return Command::FAILURE;
        }

        fwrite($handle, "-- Data-only export of \"{$databaseName}\" (connection: {$connectionName})\n");
        fwrite($handle, '-- Generated '.now()->toDateTimeString()." by php artisan db:backup\n");
        fwrite($handle, "-- Schema is NOT included — restore via `php artisan migrate:fresh` first, then run this file.\n\n");
        // Disables FK/trigger checks for the duration of the restore so table insert
        // order doesn't need to respect foreign-key dependencies.
        fwrite($handle, "SET session_replication_role = 'replica';\n\n");

        $totalRows = 0;
        foreach ($tables as $table) {
            $columns = Schema::connection($connectionName)->getColumnListing($table);
            if (empty($columns)) {
                continue;
            }

            $quotedColumns = implode(', ', array_map(fn ($c) => '"'.$c.'"', $columns));
            $rowCount = 0;

            fwrite($handle, "-- Table: {$table}\n");

            foreach ($connection->table($table)->cursor() as $row) {
                $rowArray = (array) $row;
                $values = implode(', ', array_map(fn ($v) => $this->formatValue($v), $rowArray));
                fwrite($handle, "INSERT INTO \"{$table}\" ({$quotedColumns}) VALUES ({$values});\n");
                $rowCount++;
            }

            if ($rowCount === 0) {
                fwrite($handle, "-- (empty)\n");
            }

            fwrite($handle, "\n");
            $totalRows += $rowCount;
            $this->line("  {$table}: {$rowCount} row(s)");
        }

        fwrite($handle, "SET session_replication_role = 'origin';\n");
        fclose($handle);

        $this->info("Backup written to {$filename} ({$totalRows} total rows across ".count($tables).' tables).');

        return Command::SUCCESS;
    }

    /** @return list<string> */
    private function listTables($connection): array
    {
        $rows = $connection->select(
            "select tablename from pg_tables where schemaname = 'public' order by tablename"
        );

        return array_map(fn ($r) => $r->tablename, $rows);
    }

    private function formatValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? 'TRUE' : 'FALSE';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        // Everything else (strings, dates, decimals-as-strings, json, etc.) — quote
        // and escape. Postgres coerces the literal to the target column's type.
        return "'".str_replace("'", "''", (string) $value)."'";
    }
}
