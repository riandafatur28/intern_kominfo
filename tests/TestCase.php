<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Give a user a real signature file on the public disk so PDF export can
     * resolve it (signature_path may otherwise be null in tests).
     */
    protected function setUserSignature(User $user): User
    {
        $path = "signatures/{$user->id}.png";

        $dir = public_path('storage/signatures');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(public_path('storage/'.$path), 'dummy-signature');

        $user->update(['signature_path' => $path]);

        return $user->fresh();
    }
}
