<?php

namespace App\Providers;

use App\Domains\ChangeManagement\Repositories\ChangeManagementRepositoryInterface;
use App\Domains\ChangeManagement\Repositories\EloquentChangeManagementRepository;
use App\Domains\Organization\Repositories\EloquentTeamRepository;
use App\Domains\Organization\Repositories\EloquentUserRepository;
use App\Domains\Organization\Repositories\TeamRepositoryInterface;
use App\Domains\Organization\Repositories\UserRepositoryInterface;
use App\Domains\Wfh\Repositories\EloquentWfhRepository;
use App\Domains\Wfh\Repositories\WfhRepositoryInterface;
use App\Support\Signature\ImageSignatureService;
use App\Support\Signature\SignatureServiceInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            SignatureServiceInterface::class,
            ImageSignatureService::class,
        );

        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class,
        );

        $this->app->bind(
            TeamRepositoryInterface::class,
            EloquentTeamRepository::class,
        );

        $this->app->bind(
            WfhRepositoryInterface::class,
            EloquentWfhRepository::class,
        );
        $this->app->bind(
            ChangeManagementRepositoryInterface::class,
            EloquentChangeManagementRepository::class,
        );
    }

    public function boot(): void {}
}
