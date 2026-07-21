<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class PurgePdfTempImages extends Command
{
    protected $signature = 'pdf:purge-temp-images';

    protected $description = 'Hapus file PNG temp hasil konversi WebP untuk dompdf yang sudah berusia > 1 hari';

    public function handle(): int
    {
        $dir = storage_path('app/temp/pdf-images');

        if (! is_dir($dir)) {
            $this->info('No temp directory to clean.');

            return self::SUCCESS;
        }

        $cutoff = now()->subDay()->getTimestamp();
        $purged = 0;

        foreach (glob("{$dir}/*.png") ?: [] as $file) {
            if (filemtime($file) < $cutoff) {
                File::delete($file);
                $purged++;
            }
        }

        $this->info("Purged {$purged} stale temp PDF images.");

        return self::SUCCESS;
    }
}
