<?php

namespace App\Console\Commands;

use App\Domains\Auth\Services\OtpService;
use Illuminate\Console\Command;

class PurgeExpiredOtps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:purge-expired-otps';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hapus OTP expired/used yang sudah tidak diperlukan';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $count = app(OtpService::class)->purgeExpired();

        $this->info("Purged {$count} expired/used OTP records.");
    }
}
