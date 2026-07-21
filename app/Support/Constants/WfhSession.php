<?php

namespace App\Support\Constants;

/**
 * Central source of truth for WFH attendance sessions.
 * Reference this from controllers, requests, commands, and notifications
 * so adding/removing a session is a one-line change.
 */
final class WfhSession
{
    public const PAGI = 'pagi';

    public const SIANG = 'siang';

    public const SORE = 'sore';

    /** @var list<string> */
    public const ALL = [self::PAGI, self::SIANG, self::SORE];

    /** Canonical display labels keyed by session code. */
    public const LABELS = [
        self::PAGI => 'Pagi',
        self::SIANG => 'Siang',
        self::SORE => 'Sore',
    ];

    public static function label(string $session): string
    {
        return self::LABELS[$session] ?? $session;
    }
}
