<?php

namespace App\Domains\ChangeManagement\Services;

use App\Domains\ChangeManagement\Models\ChangeInitiation;

class DocNumberGenerator
{
    public function generate(): string
    {
        $year = now()->year;
        $prefix = config('change-mgmt.doc_prefix', '9/1.1/114');

        $lastNumber = ChangeInitiation::whereYear('created_at', $year)
            ->withTrashed()
            ->count();

        $sequence = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);

        return "{$sequence}/{$prefix}/{$year}";
    }
}
