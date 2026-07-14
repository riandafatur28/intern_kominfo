<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Requests\CheckInRequest;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
    ) {}

    public function checkIn(CheckInRequest $request): JsonResponse
    {
        $this->authorize('wfh.attendance.create');

        $user = $request->user();
        $date = $request->input('date', now()->toDateString());
        $session = $request->input('session', 'pagi');

        if ($date !== now()->toDateString()) {
            return response()->json(['success' => false, 'message' => 'Absensi hanya dapat dilakukan pada hari ini.'], 422);
        }

        // Validate allowed day (default: Friday only)
        $allowedDays = config('wfh.allowed_days', [5]); // 1=Mon..7=Sun, 5=Friday
        $dayOfWeek = now()->parse($date)->dayOfWeekIso; // 1=Mon..7=Sun

        // Friday in IsoWeek = 5
        if (! in_array($dayOfWeek, $allowedDays)) {
            return response()->json([
                'success' => false,
                'message' => 'Absensi WFH hanya dapat dilakukan pada hari yang ditentukan.',
            ], 422);
        }

        // Check duplicate
        $existing = $this->wfhRepository->findAttendanceByUserAndDate($user->id, $date, $session);
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan absensi untuk sesi ini.',
            ], 422);
        }

        // Store photo
        $photo = $request->file('photo');
        $path = $photo->store("attendances/{$user->id}/{$date}", 'public');

        $attendance = $this->wfhRepository->createAttendance([
            'user_id' => $user->id,
            'date' => $date,
            'session' => $session,
            'photo_path' => $path,
            'check_in_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absensi WFH berhasil.',
            'data' => [
                'id' => $attendance->id,
                'date' => $attendance->date->format('Y-m-d'),
                'session' => $attendance->session,
                'photo_url' => asset("storage/{$path}"),
                'check_in_at' => $attendance->check_in_at,
            ],
        ], 201);
    }
}
