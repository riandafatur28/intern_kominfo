<?php

namespace App\Support\Constants;

class Roles
{
    public const ADMIN = 'admin';

    public const KEPALA_BIDANG = 'kepala_bidang';

    public const KEPALA_TIM = 'kepala_tim';

    public const STAF = 'staf';

    public const ALL = [self::ADMIN, self::KEPALA_BIDANG, self::KEPALA_TIM, self::STAF];

    /** Roles whose core permissions must never be fully stripped (prevents system lockout). */
    public const PROTECTED = [self::ADMIN];
}
