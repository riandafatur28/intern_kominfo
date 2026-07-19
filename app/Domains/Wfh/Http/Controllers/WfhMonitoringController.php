<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Models\Field;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WfhMonitoringController extends Controller
{
    use AuthorizesRequests;

    private const SESSIONS = ['pagi', 'siang', 'sore'];

    private const SESSION_LABEL = ['pagi' => 'Pagi', 'siang' => 'Siang', 'sore' => 'Sore'];

    private const AVATAR_COLORS = [
        'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-fuchsia-500',
    ];

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('wfh.monitoring.view');

        $date = $request->input('date', now()->toDateString());
        $teamId = $request->input('team_id');

        // Kepala tim sees own team only, admin sees all
        if (! $request->user()->hasRole('admin') && $teamId === null) {
            $teamId = $request->user()->ledTeams()->pluck('id')->first()
                ?? $request->user()->team_id;
        }

        $notCheckedIn = $this->wfhRepository->getUsersWithoutAttendance($date, $teamId);
        $noReport = $this->wfhRepository->getUsersWithoutReport($date, $teamId);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'team_id' => $teamId,
                'not_checked_in' => $notCheckedIn,
                'no_report' => $noReport,
            ],
        ]);
    }

    /**
     * Per-employee monitoring board for a given date.
     *
     * Query params:
     *  - date (Y-m-d): target Friday. Default: latest allowed WFH day <= today.
     *  - search: filter by name/nip.
     *  - status: terkirim | tidak_lengkap | belum_absensi | '' (all).
     *  - page, per_page.
     */
    public function board(Request $request): JsonResponse
    {
        $this->authorize('wfh.monitoring.view');

        Carbon::setLocale('id');

        // Resolve field scope (admin's own field, or explicit field_id)
        $fieldId = $request->input('field_id');
        $field = null;
        if ($fieldId) {
            $field = Field::find($fieldId);
        } elseif ($request->user()->team?->field) {
            $field = $request->user()->team->field;
            $fieldId = $field->id;
        }

        // Determine target date (default: latest allowed WFH day <= today in current month)
        $allowedDays = config('wfh.allowed_days', [5]);
        $now = Carbon::now();
        $date = $request->input('date');
        if (! $date) {
            $fridays = $this->allowedDatesInMonth($now->year, $now->month, $allowedDays);
            $today = $now->toDateString();
            $past = array_values(array_filter($fridays, fn ($d) => $d <= $today));
            $date = ! empty($past) ? end($past) : ($fridays[0] ?? $today);
        }
        $carbon = Carbon::parse($date);

        // Base employee query (active, scoped to field) — used for STATS (no search filter)
        $baseUserQuery = User::where('is_active', true);
        if ($fieldId) {
            $baseUserQuery->whereHas('team', fn ($q) => $q->where('field_id', $fieldId));
        }
        $totalPegawai = (int) (clone $baseUserQuery)->count();

        // Display query = base + search filter (used for the employee rows)
        $userQuery = clone $baseUserQuery;
        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $userQuery->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('nip', 'ilike', "%{$search}%");
            });
        }

        $users = $userQuery->orderBy('name')->get();
        $userIds = $users->pluck('id')->toArray();

        // Attendance sessions for the date
        $attendanceMap = []; // user_id => [session => true]
        WfhAttendance::where('date', $date)
            ->whereIn('user_id', $userIds)
            ->get(['user_id', 'session'])
            ->each(function ($a) use (&$attendanceMap) {
                $attendanceMap[$a->user_id][$a->session] = true;
            });

        // Reports for the date (submitted = pending/approved)
        $reportMap = []; // user_id => ['id'=>, 'status'=>]
        WfhReport::where('report_date', $date)
            ->whereIn('user_id', $userIds)
            ->get(['id', 'user_id', 'status'])
            ->each(function ($r) use (&$reportMap) {
                $reportMap[$r->user_id] = ['id' => $r->id, 'status' => $r->status];
            });

        // Build rows
        $statusFilter = $request->input('status');
        $rows = [];
        foreach ($users as $user) {
            $attended = $attendanceMap[$user->id] ?? [];
            $sessions = [];
            foreach (self::SESSIONS as $s) {
                $sessions[$s] = isset($attended[$s]);
            }
            $missing = array_values(array_filter(self::SESSIONS, fn ($s) => ! $sessions[$s]));
            $report = $reportMap[$user->id] ?? null;
            $hasReport = $report && in_array($report['status'], ['pending', 'approved'], true);

            // Derive status + catatan
            if (count($missing) === count(self::SESSIONS)) {
                $status = 'belum_absensi';
                $catatan = 'Tidak absen Semua';
            } elseif (! empty($missing)) {
                $status = 'tidak_lengkap';
                $labels = array_map(fn ($s) => self::SESSION_LABEL[$s], $missing);
                $catatan = 'Tidak Absen '.implode(', ', $labels);
            } elseif ($hasReport) {
                $status = 'terkirim';
                $catatan = 'Lengkap';
            } else {
                $status = 'tidak_lengkap';
                $catatan = 'Laporan belum dikirim';
            }

            if ($statusFilter && $statusFilter !== $status) {
                continue;
            }

            $rows[] = [
                'id' => $user->id,
                'name' => $user->name,
                'nip' => $user->nip,
                'initials' => $this->initials($user->name),
                'avatar_color' => self::AVATAR_COLORS[$user->id % count(self::AVATAR_COLORS)],
                'sessions' => $sessions,
                'report_status' => $status,
                'report_id' => $report['id'] ?? null,
                'report_raw_status' => $report['status'] ?? null,
                'catatan' => $catatan,
            ];
        }

        // Manual pagination
        $perPage = min((int) $request->input('per_page', 6), 100);
        $page = max((int) $request->input('page', 1), 1);
        $total = count($rows);
        $lastPage = max((int) ceil($total / $perPage), 1);
        $paged = array_slice($rows, ($page - 1) * $perPage, $perPage);

        // Stats
        $fridaysInMonth = $this->allowedDatesInMonth($carbon->year, $carbon->month, $allowedDays);
        $jumatTerlaksana = count(array_filter($fridaysInMonth, fn ($d) => $d <= $date));
        $laporanMasuk = $this->countSubmittedReports($date, $fieldId);
        $kepatuhan = $this->complianceRate($fridaysInMonth, $date, $fieldId, $totalPegawai);

        return response()->json([
            'success' => true,
            'data' => [
                'field' => $field ? ['id' => $field->id, 'name' => $field->name] : null,
                'date' => $date,
                'date_label' => $carbon->translatedFormat('l, j F Y'),
                'stats' => [
                    'jumat_terlaksana' => $jumatTerlaksana,
                    'jumat_total' => count($fridaysInMonth),
                    'month_label' => $carbon->translatedFormat('F Y'),
                    'laporan_masuk' => $laporanMasuk,
                    'laporan_diharapkan' => $totalPegawai,
                    'tingkat_kepatuhan' => $kepatuhan,
                ],
                'employees' => $paged,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $lastPage,
                    'per_page' => $perPage,
                    'total' => $total,
                ],
            ],
        ]);
    }

    private function countSubmittedReports(string $date, ?int $fieldId): int
    {
        $ids = WfhReport::where('report_date', $date)
            ->whereIn('status', ['pending', 'approved'])
            ->pluck('user_id')->unique()->toArray();

        if (empty($ids)) {
            return 0;
        }
        if (! $fieldId) {
            return count(array_unique($ids));
        }

        return User::whereIn('id', $ids)
            ->whereHas('team', fn ($q) => $q->where('field_id', $fieldId))
            ->count();
    }

    /**
     * Average compliance (reports submitted / total pegawai) over the last up-to-2
     * allowed WFH days <= the target date, as a rounded percentage.
     */
    private function complianceRate(array $fridays, string $date, ?int $fieldId, int $totalPegawai): int
    {
        if ($totalPegawai <= 0) {
            return 0;
        }

        $past = array_values(array_filter($fridays, fn ($d) => $d <= $date));
        $recent = array_slice($past, -2);
        if (empty($recent)) {
            return 0;
        }

        $sum = 0;
        foreach ($recent as $d) {
            $sum += $this->countSubmittedReports($d, $fieldId) / $totalPegawai;
        }

        return (int) round(($sum / count($recent)) * 100);
    }

    private function allowedDatesInMonth(int $year, int $month, array $isoDays): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = (clone $start)->endOfMonth();
        $dates = [];
        for ($d = clone $start; $d->lte($end); $d->addDay()) {
            if (in_array($d->isoWeekday(), $isoDays, true)) {
                $dates[] = $d->toDateString();
            }
        }

        return $dates;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $p) {
            $initials .= mb_strtoupper(mb_substr($p, 0, 1));
        }

        return $initials ?: 'U';
    }
}
