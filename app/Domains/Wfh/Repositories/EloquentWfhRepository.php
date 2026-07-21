<?php

namespace App\Domains\Wfh\Repositories;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\User;
use App\Repositories\EloquentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentWfhRepository extends EloquentRepository implements WfhRepositoryInterface
{
    public function __construct(WfhReport $model)
    {
        parent::__construct($model);
    }

    // === Attendance ===

    public function findAttendanceByUserAndDate(int $userId, string $date, ?string $session = null): ?WfhAttendance
    {
        $query = WfhAttendance::where('user_id', $userId)->where('date', $date);

        if ($session) {
            $query->where('session', $session);
        }

        return $query->first();
    }

    public function getUserAttendanceByDate(int $userId, string $date): Collection
    {
        return WfhAttendance::where('user_id', $userId)
            ->where('date', $date)
            ->orderBy('session')
            ->get();
    }

    public function createAttendance(array $data): WfhAttendance
    {
        return WfhAttendance::create($data);
    }

    // === Reports ===

    public function paginateReportsForUser(int $userId, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = WfhReport::where('user_id', $userId)
            ->with(['activities.links', 'supervisor']);

        if (isset($filters['date_from'])) {
            $query->where('report_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('report_date', '<=', $filters['date_to']);
        }

        return $query->orderByDesc('report_date')->paginate($perPage);
    }

    public function paginateAllReports(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = WfhReport::with(['user.team', 'activities.links', 'supervisor']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['team_id'])) {
            $query->whereHas('user', fn ($q) => $q->where('team_id', $filters['team_id']));
        }
        if (isset($filters['field_ids'])) {
            $query->whereHas('user.team', fn ($q) => $q->whereIn('field_id', (array) $filters['field_ids']));
        } elseif (isset($filters['field_id'])) {
            $query->whereHas('user.team', fn ($q) => $q->where('field_id', $filters['field_id']));
        }

        if (isset($filters['date_from'])) {
            $query->where('report_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('report_date', '<=', $filters['date_to']);
        }

        return $query->orderByDesc('report_date')->paginate($perPage);
    }

    public function findReportWithRelations(int $id): ?WfhReport
    {
        return WfhReport::with(['user.team.field', 'attendance', 'activities.links', 'supervisor.team'])
            ->find($id);
    }

    public function getTeamReportsForDate(int $teamId, string $date): Collection
    {
        return WfhReport::with(['user', 'activities.links'])
            ->where('report_date', $date)
            ->whereHas('user', fn ($q) => $q->where('team_id', $teamId))
            ->orderBy('status')
            ->get();
    }

    public function getTeamAttendancesForDate(int $teamId, string $date): Collection
    {
        return WfhAttendance::with('user')
            ->where('date', $date)
            ->whereHas('user', fn ($q) => $q->where('team_id', $teamId))
            ->get();
    }

    public function createReportWithRelations(array $reportData, array $activities): WfhReport
    {
        return DB::transaction(function () use ($reportData, $activities) {
            $report = WfhReport::create($reportData);

            $this->syncActivities($report, $activities);

            return $report->fresh(['activities.links']);
        });
    }

    public function updateReportWithRelations(int $id, array $reportData, array $activities): bool
    {
        return DB::transaction(function () use ($id, $reportData, $activities) {
            $report = WfhReport::find($id);
            if (! $report) {
                return false;
            }

            $report->update($reportData);

            // Delete existing activities + links, recreate
            $report->activities()->delete();
            $this->syncActivities($report, $activities);

            return true;
        });
    }

    // === Monitoring ===

    public function getUsersWithoutAttendance(string $date, ?int $teamId = null): array
    {
        $checkedInIds = WfhAttendance::where('date', $date)->pluck('user_id')->toArray();

        $query = User::where('is_active', true)->whereNotIn('id', $checkedInIds);

        if ($teamId) {
            $query->where('team_id', $teamId);
        }

        return $query->with('team')->get()->toArray();
    }

    public function getUsersWithoutReport(string $date, ?int $teamId = null): array
    {
        $reportedIds = WfhReport::where('report_date', $date)->pluck('user_id')->toArray();

        $query = User::where('is_active', true)->whereNotIn('id', $reportedIds);

        if ($teamId) {
            $query->where('team_id', $teamId);
        }

        return $query->with('team')->get()->toArray();
    }

    // === Private helpers ===

    private function syncActivities(WfhReport $report, array $activities): void
    {
        foreach ($activities as $index => $activity) {
            $activityModel = $report->activities()->create([
                'start_time' => $activity['start_time'],
                'end_time' => $activity['end_time'],
                'activity' => $activity['activity'],
                'sort_order' => $activity['sort_order'] ?? $index,
            ]);

            if (! empty($activity['links'])) {
                foreach ($activity['links'] as $linkIndex => $url) {
                    $activityModel->links()->create([
                        'url' => $url,
                        'sort_order' => $linkIndex,
                    ]);
                }
            }
        }
    }
}
