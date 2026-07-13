<?php

namespace App\Support\Constants;

class Roles
{
    public const ADMIN = 'admin';

    public const KEPALA_TIM = 'kepala_tim';

    public const STAF = 'staf';

    public const ALL = [self::ADMIN, self::KEPALA_TIM, self::STAF];
}
