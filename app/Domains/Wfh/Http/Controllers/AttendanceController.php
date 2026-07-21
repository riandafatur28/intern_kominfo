<?php

namespace App\Domains\Wfh\Http\Controllers;

use App\Domains\Wfh\Http\Requests\CheckInRequest;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Support\Constants\WfhSession;
use App\Support\Wfh\AttendancePhotoServiceInterface;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class AttendanceController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private WfhRepositoryInterface $wfhRepository,
        private AttendancePhotoServiceInterface $photoService,
    ) {}

    public function checkIn(CheckInRequest $request): JsonResponse
    {
        $this->authorize('wfh.attendance.create');

        $user = $request->user();
        $date = $request->input('date', now()->toDateString());
        $session = $request->input('session', WfhSession::PAGI);

        if ($date !== now()->toDateString()) {
            return response()->json(['success' => false, 'message' => 'Absensi hanya dapat dilakukan pada hari ini.'], 422);
        }

        // Validate allowed day
        $allowedDays = config('wfh.allowed_days', [5]);
        $dayOfWeek = now()->parse($date)->dayOfWeekIso;

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

        $photo = $request->file('photo');
        $path = $this->photoService->store($photo, $user->id, $date);

        try {
            $attendance = $this->wfhRepository->createAttendance([
                'user_id' => $user->id,
                'date' => $date,
                'session' => $session,
                'photo_path' => $path,
                'check_in_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Orphan cleanup: remove stored photo if DB write fails
            Storage::disk('public')->delete($path);
            throw $e;
        }

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
