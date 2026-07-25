# Deploy — WFH Reminder Notify (fitur notifikasi email)

## Prasyarat

Sebelum fitur notify berfungsi di production, jalankan langkah-langkah ini **sekali**.

---

### 1. Cron Laravel (wajib — tanpanya notify tidak pernah jalan)

Command `wfh:send-reminders` berjalan via Laravel Scheduler tiap menit. Scheduler butuh cron entry di OS:

```cron
* * * * * cd /path/ke/aptika-eoffice && php artisan schedule:run >> /dev/null 2>&1
```

**Cara pasang:**

```bash
# SSH ke server production
crontab -e

# Tambah baris di atas (ganti path sesuai lokasi deploy)
# Contoh:
* * * * * cd /var/www/aptika-eoffice && php artisan schedule:run >> /dev/null 2>&1
```

**Verifikasi:**

```bash
crontab -l | grep schedule:run
# Harus return baris cron entry
```

**Catatan:** Pastikan `php` ada di PATH atau gunakan path absolut (mis. `/usr/bin/php`). Jalankan cron sebagai user yang menjalankan web server (biasanya `www-data`).

---

### 2. Queue Worker via Supervisor (wajib — tanpanya email mengantri di jobs)

Notifikasi menggunakan `ShouldQueue` dengan koneksi `database`. Worker `queue:work` harus berjalan terus-menerus.

```bash
# Pastikan .env sudah QUEUE_CONNECTION=database
# Pastikan tabel jobs sudah termigrasi:
php artisan migrate
```

**Config supervisor** — buat file `/etc/supervisor/conf.d/aptika-eoffice-worker.conf`:

```ini
[program:aptika-eoffice-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/ke/aptika-eoffice/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/ke/aptika-eoffice/storage/logs/worker.log
stopwaitsecs=3600
```

**Aktifkan:**

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start aptika-eoffice-worker:*
```

**Verifikasi:**

```bash
sudo supervisorctl status
# Harus return: aptika-eoffice-worker:* RUNNING
```

---

### 3. Environment Variables

Tambahkan/timpa di `.env` production:

```env
MAIL_MAILER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx   # Ganti dengan actual API key dari dashboard Resend

MAIL_FROM_ADDRESS=noreply@domain-terverifikasi.go.id
MAIL_FROM_NAME="e-Office Aptika"

QUEUE_CONNECTION=database
```

**Verifikasi domain Resend:**

- Login ke https://resend.com/domains
- Pastikan status domain `Verified` (SPF + DKIM)
- Jika belum: tambah record DNS SPF + DKIM dari dashboard Resend ke domain Anda

---

### 4. Setelah env diisi

```bash
php artisan config:cache        # Freeze config ke cache (termasuk timezone)
php artisan migrate             # Jalankan migration baru
php artisan db:seed --class=SettingsSeeder   # Tambah setting wfh_notify_start_time
```

---

### 5. Verifikasi end-to-end

```bash
# Cek command berjalan tanpa error
php artisan wfh:send-reminders
# Output: "Hari ini bukan hari WFH. Lewati." atau "Tidak ada user yang perlu diingatkan."

# Cek scheduler terdaftar
php artisan schedule:list
# Harus ada: artisan wfh:send-reminders  * * * * *  (every minute)

# Cek route istnie
php artisan route:list | grep /teams
# Harus ada: GET /teams
```

---

## Catatan

- **Hari libur nasional:** Tidak di-skip otomatis. Hanya skip hari non-WFH (`wfh_allowed_days` di SettingsSeeder). Jika ada hari libur nasional yang jatuh di hari kerja, admin harus atur setting atau menerima risiko email terkirim.
- **Timezone:** `config/app.php` = `Asia/Jakarta`. Jika server berbeda zona waktu, Laravel internal menangani konversi.
- **Waktu notify default:** `15:00` WIB. Admin bisa ubah via menu Settings → key `wfh_notify_start_time`. Efek langsung tanpa restart/deploy.