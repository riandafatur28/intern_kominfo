<?php
use App\Http\Controllers\SpikeController;
use Illuminate\Support\Facades\Route;
if (app()->environment('local')) {
    Route::get('/spike/wfh', [SpikeController::class, 'wfh']);
    Route::get('/spike/change-impl', [SpikeController::class, 'changeImpl']);
}
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
