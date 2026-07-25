<?php

namespace Tests\Feature\Wfh;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WfhReminderInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_timezone_is_asia_jakarta(): void
    {
        $this->assertEquals('Asia/Jakarta', config('app.timezone'));
    }

    public function test_wfh_notify_start_time_setting_exists_with_default(): void
    {
        // Seed here (not in setUp) to assert the seeder output directly,
        // rather than depending on a broader setUp seeding policy.
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);

        $this->assertEquals('15:00', Setting::get('wfh_notify_start_time'));
    }

    public function test_wfh_reminder_dispatches_table_exists(): void
    {
        $this->assertTrue(
            Schema::hasTable('wfh_reminder_dispatches')
        );
    }
}
