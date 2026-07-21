<?php

return [
    // Attendance photo processing — photos are transcoded to WebP on upload.
    'attendance_photo_max_dimension' => env('ATTENDANCE_PHOTO_MAX_DIMENSION', 1280),
    'attendance_photo_quality' => env('ATTENDANCE_PHOTO_QUALITY', 80),
];
