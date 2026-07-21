<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Models\WfhAttendance;
use App\Domains\Wfh\Models\WfhReport;
use App\Models\Field;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Admin WFH dashboard aggregate stats.
     *
     * Query params:
     *  - month (1-12), year (YYYY): target month. Default: current month.
     *  - field_id: filter by field/bidang. Default: admin's own field (or all).
     *  - date (YYYY-MM-DD): target Friday for the "current" stats. Default: latest Friday <= today within month.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('wfh.monitoring.view');

        Carbon::setLocale('id');

        $now = Carbon::now();
        $month = (int) $request->input('month', $now->month);
        $year = (int) $request->input('year', $now->year);
        $fieldId = $request->input('field_id');

        // Resolve field: explicit > admin's own field > null (all)
        $field = null;
        if ($fieldId) {
            $field = Field::find($fieldId);
        } elseif ($request->user()->team?->field) {
            $field = $request->user()->team->field;
            $fieldId = $field->id;
        }

        // Active user base (optionally scoped to field)
        $userQuery = User::where('is_active', true);
        if ($fieldId) {
            $userQuery->whereHas('team', fn ($q) => $q->where('field_id', $fieldId));
        }
        $totalPegawai = (int) $userQuery->count();

        // All Fridays in the target month (allowed WFH days from config)
        $allowedDays = config('wfh.allowed_days', [5]);
        $fridays = $this->allowedDatesInMonth($year, $month, $allowedDays);

        // Determine the "focus" Friday for stat cards
        $focusDate = $request->input('date');
        if (! $focusDate) {
            $today = $now->toDateString();
            $past = array_values(array_filter($fridays, fn ($d) => $d <= $today));
            $focusDate = ! empty($past) ? end($past) : ($fridays[0] ?? $today);
        }

        // Per-Friday chart data
        $chart = [];
        foreach ($fridays as $date) {
            $breakdown = $this->breakdownForDate($date, $fieldId, $totalPegawai);
            $chart[] = array_merge([
                'date' => $date,
                'label' => Carbon::parse($date)->translatedFormat('j M'),
            ], $breakdown);
        }

        // Focus-date stats for cards
        $focusBreakdown = $this->breakdownForDate($focusDate, $fieldId, $totalPegawai);
        $laporanPending = $this->countReportsByStatus($focusDate, $fieldId, 'pending');

        // "Terkini" = today if Jumat, otherwise next upcoming Friday
        $todayStr = $now->toDateString();
        $nextFriday = null;
        foreach ($fridays as $d) {
            if ($d >= $todayStr) {
                $nextFriday = $d;
                break;
            }
        }
        $nextFriday ??= $fridays[count($fridays) - 1] ?? null;
        $calendar = array_map(function ($date) use ($focusDate, $nextFriday) {
            $c = Carbon::parse($date);

            return [
                'date' => $date,
                'label' => 'Jumat '.$c->format('d/m'),
                'is_current' => $date === $nextFriday,
                'is_focus' => $date === $focusDate,
            ];
        }, $fridays);

        // WFH completion status for focus date
        $wfhSelesai = $focusBreakdown['belum_absensi'] === 0 && $focusBreakdown['tidak_lengkap'] === 0
            && $totalPegawai > 0;

        return response()->json([
            'success' => true,
            'data' => [
                'field' => $field ? ['id' => $field->id, 'name' => $field->name] : null,
                'month' => $month,
                'year' => $year,
                'month_label' => Carbon::create($year, $month, 1)->translatedFormat('F Y'),
                'focus_date' => $focusDate,
                'focus_date_label' => Carbon::parse($focusDate)->translatedFormat('l, j F Y'),
                'stats' => [
                    'total_pegawai' => $totalPegawai,
                    'laporan_terkirim' => $focusBreakdown['laporan_terkirim'],
                    'laporan_pending' => $laporanPending,
                    'wfh_selesai' => $wfhSelesai,
                ],
                'chart' => $chart,
                'calendar' => $calendar,
            ],
        ]);
    }

    /**
     * Breakdown of compliance for a given date within a field scope.
     *
     * @return array{laporan_terkirim:int, tidak_lengkap:int, belum_absensi:int}
     */
    private function breakdownForDate(string $date, ?int $fieldId, int $totalPegawai): array
    {
        // Users who checked in (attendance) on that date within field
        $checkedInIds = $this->scopedUserIds(
            WfhAttendance::where('date', $date)->pluck('user_id')->unique()->toArray(),
            $fieldId
        );

        // Users who submitted a report (pending/approved) on that date within field
        $reportedIds = $this->scopedUserIds(
            WfhReport::where('report_date', $date)
                ->whereIn('status', ['pending', 'approved'])
                ->pluck('user_id')->unique()->toArray(),
            $fieldId
        );

        $laporanTerkirim = count($reportedIds);
        // Checked in but no submitted report = incomplete
        $tidakLengkap = count(array_diff($checkedInIds, $reportedIds));
        // Not checked in at all
        $belumAbsensi = max(0, $totalPegawai - count(array_unique(array_merge($checkedInIds, $reportedIds))));

        return [
            'laporan_terkirim' => $laporanTerkirim,
            'tidak_lengkap' => $tidakLengkap,
            'belum_absensi' => $belumAbsensi,
        ];
    }

    private function countReportsByStatus(string $date, ?int $fieldId, string $status): int
    {
        $ids = WfhReport::where('report_date', $date)
            ->where('status', $status)
            ->pluck('user_id')->unique()->toArray();

        return count($this->scopedUserIds($ids, $fieldId));
    }

    /**
     * Filter user IDs to only those within the given field (if provided).
     */
    private function scopedUserIds(array $userIds, ?int $fieldId): array
    {
        if (empty($userIds)) {
            return [];
        }
        if (! $fieldId) {
            return array_values(array_unique($userIds));
        }

        return User::whereIn('id', $userIds)
            ->whereHas('team', fn ($q) => $q->where('field_id', $fieldId))
            ->pluck('id')->toArray();
    }

    /**
     * All dates in a month matching ISO weekdays (1=Mon..7=Sun).
     *
     * @return array<string> list of Y-m-d
     */
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
}
