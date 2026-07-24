<?php

namespace Tests\Feature\Wfh;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WfhReminderInfrastructureTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function application_timezone_is_asia_jakarta(): void
    {
        $this->assertEquals('Asia/Jakarta', config('app.timezone'));
    }

    /** @test */
    public function wfh_notify_start_time_setting_exists_with_default(): void
    {
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);

        $this->assertEquals('15:00', Setting::get('wfh_notify_start_time'));
    }

    /** @test */
    public function wfh_reminder_dispatches_table_exists(): void
    {
        $this->assertTrue(
            Schema::hasTable('wfh_reminder_dispatches')
        );
    }
}
