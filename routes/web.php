<?php

use App\Http\Controllers\SpikeController;
use Illuminate\Support\Facades\Route;

// Spike routes — development only. Remove before production.
if (app()->environment('local')) {
    Route::get('/spike/wfh', [SpikeController::class, 'wfh']);
    Route::get('/spike/change-impl', [SpikeController::class, 'changeImpl']);
}
