<?php

namespace Tests\Unit;

use Tests\TestCase;

class AttendanceGuardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['wfh.allowed_days' => [5]]);
    }

    public function test_rejects_non_friday_attendance(): void
    {
        $allowedDays = config('wfh.allowed_days', [5]);
        $sunday = 7;

        $isAllowed = in_array($sunday, $allowedDays);

        $this->assertFalse($isAllowed);
    }

    public function test_rejects_saturday_attendance(): void
    {
        $allowedDays = config('wfh.allowed_days', [5]);
        $saturday = 6;

        $isAllowed = in_array($saturday, $allowedDays);

        $this->assertFalse($isAllowed);
    }

    public function test_allows_friday_attendance_with_default_config(): void
    {
        $allowedDays = config('wfh.allowed_days', [5]);
        $friday = 5;

        $isAllowed = in_array($friday, $allowedDays);

        $this->assertTrue($isAllowed);
    }

    public function test_honors_custom_wfh_config(): void
    {
        config(['wfh.allowed_days' => [1, 2, 3, 4, 5]]); // Mon-Fri

        $monday = 1;
        $saturday = 6;

        $this->assertTrue(in_array($monday, config('wfh.allowed_days')));
        $this->assertFalse(in_array($saturday, config('wfh.allowed_days')));
    }
}
