<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Guard against empty APP_DEFAULT_USER_PASSWORD — otherwise User::create() would
        // hash an empty string and every new account would be loggable with no password.
        if (config('app.default_user_password') === '') {
            throw new \RuntimeException('APP_DEFAULT_USER_PASSWORD must not be empty.');
        }
    }
}
