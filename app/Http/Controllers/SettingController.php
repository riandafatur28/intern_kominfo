<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(fn ($s) => [
            $s->key => Setting::get($s->key),
        ]);

        return response()->json(['data' => $settings]);
    }

    public function update(string $key, UpdateSettingRequest $request): JsonResponse
    {
        if (! Setting::where('key', $key)->exists()) {
            return response()->json([
                'message' => "Setting '{$key}' tidak ditemukan.",
            ], 422);
        }

        $value = $request->input('value');

        Setting::set($key, $value);

        return response()->json([
            'data' => [
                'key' => $key,
                'value' => Setting::get($key),
            ],
        ]);
    }
}
