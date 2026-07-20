<?php

use App\Domains\Auth\Http\Controllers\AuthController;
use App\Domains\ChangeManagement\Http\Controllers\ChangeManagementPdfController;
use App\Domains\ChangeManagement\Http\Controllers\ImplementationController;
use App\Domains\ChangeManagement\Http\Controllers\ImplementationReviewController;
use App\Domains\ChangeManagement\Http\Controllers\InitiationController;
use App\Domains\Organization\Http\Controllers\PermissionController;
use App\Domains\Organization\Http\Controllers\ProfileController;
use App\Domains\Organization\Http\Controllers\RoleController;
use App\Domains\Organization\Http\Controllers\TeamController;
use App\Domains\Organization\Http\Controllers\UserController;
use App\Domains\Wfh\Http\Controllers\AttendanceController;
use App\Domains\Wfh\Http\Controllers\DashboardController;
use App\Domains\Wfh\Http\Controllers\ReportApprovalController;
use App\Domains\Wfh\Http\Controllers\ReportController;
use App\Domains\Wfh\Http\Controllers\ReportPdfController;
use App\Domains\Wfh\Http\Controllers\SpreadsheetSyncController;
use App\Domains\Wfh\Http\Controllers\WfhMonitoringController;
use App\Http\Controllers\QrVerificationController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::get('/verify/{token}', [QrVerificationController::class, 'verify']);

// Password Reset (public)
Route::prefix('password')->group(function () {
    Route::post('forgot', [\App\Domains\Auth\Http\Controllers\PasswordResetController::class, 'forgot'])
        ->middleware('throttle:5,1');
    Route::post('resend', [\App\Domains\Auth\Http\Controllers\PasswordResetController::class, 'resend'])
        ->middleware('throttle:5,1');
    Route::post('reset', [\App\Domains\Auth\Http\Controllers\PasswordResetController::class, 'reset'])
        ->middleware('throttle:5,1');
});

Route::middleware('auth:sanctum')->group(function () {
    // Auth — always available (password change flag emitted in response)
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Change own password — must remain reachable while must_change_password=true
    Route::post('/profile/password', [ProfileController::class, 'changePassword']);

    // All other authenticated routes require the user to have cleared first-login password change
    Route::middleware('password.changed')->group(function () {
        // Profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/signature', [ProfileController::class, 'uploadSignature']);
        Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);

        // Admin User Management
        Route::middleware('permission:user.manage')->group(function () {
            Route::get('/admin/users', [UserController::class, 'index']);
            Route::post('/admin/users', [UserController::class, 'store']);
            Route::get('/admin/users/{user}', [UserController::class, 'show']);
            Route::put('/admin/users/{user}', [UserController::class, 'update']);
            Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
            Route::get('/admin/teams', [TeamController::class, 'index']);
        });

        Route::middleware('permission:user.import')->group(function () {
            Route::post('/admin/users/import', [UserController::class, 'import']);
        });

        // RBAC Management
        Route::middleware('permission:role.manage')->group(function () {
            Route::get('/admin/roles', [RoleController::class, 'index']);
            Route::put('/admin/roles/{id}/permissions', [RoleController::class, 'updatePermissions']);
        });

        Route::middleware('permission:permission.manage')->group(function () {
            Route::get('/admin/permissions', [PermissionController::class, 'index']);
        });

        // WFH Module
        Route::post('/wfh/attendance', [AttendanceController::class, 'checkIn'])
            ->middleware('permission:wfh.attendance.create');

        Route::get('/wfh/reports', [ReportController::class, 'index']);
        Route::post('/wfh/reports', [ReportController::class, 'store'])
            ->middleware('permission:wfh.report.create');
        Route::get('/wfh/reports/{report}', [ReportController::class, 'show']);
        Route::put('/wfh/reports/{report}', [ReportController::class, 'update'])
            ->middleware('permission:wfh.report.update');
        Route::delete('/wfh/reports/{report}', [ReportController::class, 'destroy'])
            ->middleware('permission:wfh.report.delete');

        Route::post('/wfh/reports/{report}/submit', [ReportApprovalController::class, 'submit']);
        Route::post('/wfh/reports/{report}/approve', [ReportApprovalController::class, 'approve'])
            ->middleware('permission:wfh.report.approve');
        Route::post('/wfh/reports/{report}/reject', [ReportApprovalController::class, 'reject'])
            ->middleware('permission:wfh.report.reject');
        Route::post('/wfh/reports/{report}/revise', [ReportApprovalController::class, 'revise']);

        Route::get('/admin/wfh/monitoring', [WfhMonitoringController::class, 'index'])
            ->middleware('permission:wfh.monitoring.view');

        Route::get('/admin/wfh/monitoring/board', [WfhMonitoringController::class, 'board'])
            ->middleware('permission:wfh.monitoring.view');

        Route::get('/admin/wfh/spreadsheet', [SpreadsheetSyncController::class, 'status'])
            ->middleware('permission:wfh.monitoring.view');

        Route::get('/admin/wfh/dashboard', [DashboardController::class, 'index'])
            ->middleware('permission:wfh.monitoring.view');

        Route::get('/admin/wfh/reports', [ReportController::class, 'adminIndex'])
            ->middleware('permission:wfh.monitoring.view');

        Route::get('/wfh/reports/{report}/pdf', [ReportPdfController::class, 'export'])
            ->middleware('permission:wfh.report.export_pdf');

        Route::get('/admin/wfh/teams/{team}/pdf', [ReportPdfController::class, 'exportTeam'])
            ->middleware('permission:wfh.report.export_pdf');

        // Change Management Module
        Route::get('/changes/initiations', [InitiationController::class, 'index'])
            ->middleware('permission:change.initiation.view');
        Route::post('/changes/initiations', [InitiationController::class, 'store'])
            ->middleware('permission:change.initiation.create');
        Route::get('/changes/initiations/{id}', [InitiationController::class, 'show'])
            ->middleware('permission:change.initiation.view');
        Route::post('/changes/initiations/{id}/submit', [InitiationController::class, 'submit'])
            ->middleware('permission:change.initiation.submit');
        Route::post('/changes/initiations/{id}/approve', [InitiationController::class, 'approve'])
            ->middleware('permission:change.initiation.approve');
        Route::post('/changes/initiations/{id}/reject', [InitiationController::class, 'reject'])
            ->middleware('permission:change.initiation.reject');
        Route::post('/changes/initiations/{id}/revise', [InitiationController::class, 'revise'])
            ->middleware('permission:change.initiation.submit');

        Route::post('/changes/initiations/{id}/implementations', [ImplementationController::class, 'store'])
            ->middleware('permission:change.implementation.create');
        Route::get('/changes/implementations/{id}', [ImplementationController::class, 'show'])
            ->middleware('permission:change.implementation.view');
        Route::put('/changes/implementations/{id}', [ImplementationController::class, 'update'])
            ->middleware('permission:change.implementation.update');
        Route::post('/changes/implementations/{id}/attachments', [ImplementationController::class, 'uploadAttachments'])
            ->middleware('permission:change.implementation.update');
        Route::post('/changes/implementations/{id}/submit', [ImplementationController::class, 'submit'])
            ->middleware('permission:change.implementation.submit');
        Route::post('/changes/implementations/{id}/review', [ImplementationReviewController::class, 'review'])
            ->middleware('permission:change.implementation.review');

        // Change Management PDF Export
        Route::get('/changes/initiations/{id}/pdf', [ChangeManagementPdfController::class, 'exportInitiation'])
            ->middleware('permission:change.initiation.export_pdf');
        Route::get('/changes/implementations/{id}/pdf', [ChangeManagementPdfController::class, 'exportImplementation'])
            ->middleware('permission:change.implementation.export_pdf');
    });
});
