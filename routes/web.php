<?php

use App\Http\Controllers\SpikeController;
use Illuminate\Support\Facades\Route;

if (app()->environment('local')) {
    Route::get('/spike/wfh', [SpikeController::class, 'wfh']);
    Route::get('/spike/change-impl', [SpikeController::class, 'changeImpl']);
}
// Named 'login' route agar redirect middleware auth tidak crash pada SPA.
// Mengembalikan view SPA; routing halaman login ditangani di sisi klien.
Route::view('/login', 'app')->name('login');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
