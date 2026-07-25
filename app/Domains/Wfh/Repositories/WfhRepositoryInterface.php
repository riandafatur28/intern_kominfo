<?php

namespace App\Domains\Wfh\Repositories;

use App\Domains\Shared\Contracts\RepositoryInterface;
use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface WfhRepositoryInterface extends RepositoryInterface
{
    // Attendance
    public function findAttendanceByUserAndDate(int $userId, string $date, ?string $session = null): ?WfhAttendance;

    public function createAttendance(array $data): WfhAttendance;

    // Reports
    public function paginateReportsForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function paginateAllReports(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function findReportWithRelations(int $id): ?WfhReport;

    public function createReportWithRelations(array $reportData, array $activities, array $attendances = []): WfhReport;

    public function updateReportWithRelations(int $id, array $reportData, array $activities, array $attendances = []): bool;

    public function getTeamReportData(int $teamId, string $date): array;

    public function getUsersWithoutAttendance(string $date, ?int $teamId = null, ?int $fieldId = null): array;
    public function getUsersWithoutReport(string $date, ?int $teamId = null, ?int $fieldId = null): array;
}
