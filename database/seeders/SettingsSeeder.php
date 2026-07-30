<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::set('password_default_admin', 'admin123');
        Setting::set('password_default_user', 'user1234');
        Setting::set('wfh_allowed_days', [1, 2, 3, 4, 5]); // Mon–Fri
        Setting::set('wfh_sessions', ['pagi', 'siang', 'sore']);
        Setting::set('wfh_notify_start_time', '15:00');
    }
}
