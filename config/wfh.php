<?php

return [
    // Day of week ISO (1=Mon..7=Sun). Default: Friday only.
    'allowed_days' => [5], // Friday only.

    // Attendance photo processing
    'attendance_photo_max_dimension' => env('WFH_ATTENDANCE_PHOTO_MAX_DIMENSION', 1280),
    'attendance_photo_quality' => env('WFH_ATTENDANCE_PHOTO_QUALITY', 80),
];
