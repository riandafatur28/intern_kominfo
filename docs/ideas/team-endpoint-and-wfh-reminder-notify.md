# Team Endpoint (per Bidang) + WFH Reminder Notify via Email

## Problem Statement

**How Might We** menyediakan endpoint dropdown daftar tim per bidang agar user cukup memilih dari opsi (bukan hafal ID), **dan** mengingatkan user via email secara otomatis di jam tertentu jika mereka belum absen **dan** belum melaporkan kegiatan WFH sama sekali pada hari itu?

## Recommended Direction

Dua fitur terpisah, masing-masing minimal:

### A. Endpoint List Tim per Bidang

`GET /teams?field_id={id}` — endpoint flat, filter via query string. Terbuka untuk semua user terautentikasi (`auth:sanctum`, tanpa permission flag tambahan). Konsisten dengan pola `?team_id=` di `WfhMonitoringController`. Filter tambahan masa depan (`leader_id`, `active`) tinggal tambah query param, tanpa endpoint baru.

Response: `data: [{ id, name, leader_id }]`. Frontend pakai langsung untuk `<select>`.

### B. Notify Pengingat WFH (Single-Notify)

Satu email per user per hari, dipicu pada jam yang dikonfigurasi admin (`Setting` key `wfh_notify_start_time`, default `15:00`). Penerima: hanya user yang **belum absen DAN belum melaporkan kegiatan WFH** — intersection dua list, bukan union. Logika trigger reuse `WfhRepositoryInterface::getUsersWithoutAttendance()` ∩ `getUsersWithoutReport()` yang sudah ada.

Transport: `resend/laravel` (official package). Dikirim via Laravel `Notification` class `ShouldQueue`. Dijalankan oleh scheduler Laravel `schedule:run` tiap menit → command artisan `wfh:send-reminders`. Semua config dibaca dari `Setting` runtime — admin ubah jam, efek langsung, tanpa redeploy.

**Skip weekend** otomatis via `Setting::get('wfh_allowed_days')` yang sudah ada. **Tidak ada** skip hari libur nasional, cuti, atau exempt flag — semua user aktif diperlakukan sama untuk MVP.

## Key Assumptions to Validate

- [ ] **Cron worker aktif di server prod.** Validasi: `crontab -l` berisi `* * * * * cd /app && php artisan schedule:run >> /dev/null 2>&1`. Tanpa ini, notify tidak pernah jalan. **Status: belum terpasang** → langkah setup disertakan di bagian Prasyarat Deploy.
- [x] **Domain pengirim Resend terverifikasi** (SPF/DKIM DNS). **Status: sudah verified** → tinggal taruh `RESEND_API_KEY` di `.env`.
- [ ] **Queue worker berjalan** via supervisor (`php artisan queue:work`). **Status: belum ada, akan di-setup** → supervisor config disertakan di Prasyarat Deploy. Notifikasi pakai `ShouldQueue`.
- [x] **Timezone aplikasi** `Asia/Jakarta` (WIB) dan jam default `15:00`. **Status: confirmed** → set di `config/app.php` (jika belum) dan seed `wfh_notify_start_time = '15:00'`.
- [x] **Template email baseline** (subjek + body statis). **Status: confirmed** → body hardcode di Blade, tidak editable admin untuk MVP.

## MVP Scope

### A. Endpoint Tim

- Route `GET /teams?field_id={id}` (optional, tanpa filter = semua).
- `TeamController@index` sederhana: `Team::when($fieldId, fn($q,$f) => $q->where('field_id', $f))->get(['id','name','leader_id'])`.
- Response JSON standar `{ success, data }`.
- Test: 1 feature test cek filter `field_id` work.

### B. WFH Reminder Notify

- `composer require resend/laravel`, set `RESEND_API_KEY` + `MAIL_FROM_ADDRESS` di `.env`.
- Migration tambahan: insert key `wfh_notify_start_time` ke tabel settings (value `15:00`) via seeder/migration.
- Migration: tabel `wfh_reminder_dispatches(date date unique, dispatched_at timestamp)` — idempotency guard.
- `App\Notifications\WfhReminderNotification` (channel `mail`, `ShouldQueue`), view Blade baseline: subjek "Pengingat WFH — Anda belum absen dan belum melaporkan kegiatan", body "Halo {nama}, pukul {jam} hari ini {tanggal} tercatat Anda belum melakukan absensi WFH dan belum mengirim laporan kegiatan WFH. Mohon segera melakukan absensi dan pelaporan di sistem e-office."
- `App\Console\Commands\SendWfhReminders`:
  1. Skip jika hari ini tidak di `wfh_allowed_days`.
  2. Skip jika jam sekarang < `wfh_notify_start_time`.
  3. Skip jika row `wfh_reminder_dispatches` untuk hari ini sudah ada.
  4. Ambil intersect `getUsersWithoutAttendance(today)` ∩ `getUsersWithoutReport(today)`.
  5. `Notification::send($users, new WfhReminderNotification())`.
  6. Insert row `wfh_reminder_dispatches(today, now)`.
- Daftar command di `app/Console/Kernel.php` `$schedule->command('wfh:send-reminders')->everyMinute()`.
- Admin UI untuk edit `wfh_notify_start_time` via `SettingController` yang sudah ada (tidak perlu endpoint baru, hanya frontend).
- Test: 1 feature test — user tanpa absen+lapor → notifikasi dispatched + idempotency row dibuat; run kedua → skip.

### Prasyarat Deploy (di luar kode)

Wajib dieksekusi sekali di server production sebelum fitur notify berfungsi:

1. **Pasang cron Laravel** (karena cron belum ada):
   ```cron
   * * * * * cd /path/to/aptika-eoffice && php artisan schedule:run >> /dev/null 2>&1
   ```
   - Cek via `crontab -l`, edit via `crontab -e` (user yang menjalankan web app, biasanya `www-data` atau user deploy).
   - Pastikan `php` di PATH atau gunakan path absolut (mis. `/usr/bin/php`).

2. **Setup queue worker via supervisor** (karena queue dipilih):
   - Buat config `/etc/supervisor/conf.d/aptika-eoffice-worker.conf`:
     ```ini
     [program:aptika-eoffice-worker]
     process_name=%(program_name)s_%(process_num)02d
     command=php /path/to/aptika-eoffice/artisan queue:work --sleep=3 --tries=3 --max-time=3600
     autostart=true
     autorestart=true
     user=www-data
     numprocs=2
     redirect_stderr=true
     stdout_logfile=/path/to/aptika-eoffice/storage/logs/worker.log
     stopwaitsecs=3600
     ```
   - Reload: `sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start aptika-eoffice-worker:*`.
   - Pastikan `QUEUE_CONNECTION=database` (atau `redis`) di `.env`, tabel `jobs`/`failed_jobs` sudah termigrasi (`php artisan queue:table && php artisan migrate` jika belum).

3. **Set `.env` Resend** (domain sudah verified, tinggal API key):
   ```
   RESEND_API_KEY=re_xxxxxxxx
   MAIL_FROM_ADDRESS=noreply@<domain-yang-sudah-verified>
   MAIL_FROM_NAME="e-Office Aptika"
   ```

4. **Set timezone aplikasi** `config/app.php` `'timezone' => 'Asia/Jakarta'` (cek dulu, ubah jika masih `UTC`).

## Not Doing (and Why)

- **Multi-notify / jeda antar notify.** Anda putuskan single-notify cukup. Drop seluruh konfigurasi jumlah+jeda. Lebih sederhana, kurangi risiko nag-spam.
- **Sistem cuti/izin.** Out of scope MVP. Konsekuensi: user sakit tetap kena email. Accept untuk MVP.
- **Flag `is_exempt_from_notify`.** Anda putuskan semua user kena tanpa kecuali. Tambah kompleksitas tanpa value sekarang.
- **Eskalasi ke leader/tim.** User saja yang di-notify. Leader CC bikin kompleks dan berisiko fitnah anggota.
- **Skip hari libur nasional.** Butuh data libur eksternal. MVP pakai `wfh_allowed_days` saja. Risiko: email kirim di hari kerja yang kebetulan libur nasional — acceptable.
- **Timezone per user.** Single kantor → satu timezone cukup.
- **Channel lain (WhatsApp/SMS/push).** Email saja sesuai permintaan.
- **Retry policy custom.** Default queue retry Laravel cukup.
- **Audit UI untuk admin lihat siapa sudah diingatkan.** Tabel idempotency ada, tapi tidak dibuat view-nya untuk MVP.
- **Custom email template bersifat editable.** Body hardcode dulu di Blade. Admin tidak perlu edit konten.

## Resolved / Status

**Fase 1-3 selesai & di-commit.** Implementasi sesuai spesifikasi.

| Fase | Status | Commit |
|------|--------|--------|
| 1. Endpoint Tim | ✅ Selesai | `67d3e70` |
| 2. Foundation Notify (timezone, queue, Resend, config) | ✅ Selesai | `df51fcc` |
| 3. Notification + Command + Scheduler + Test | ✅ Selesai | `da7c327` + `b92897b` (fix) |
| 4. Deploy Documentation | ✅ Selesai | (current) |

Dokumen deploy: `docs/deploy/wfh-reminder-notify.md`
