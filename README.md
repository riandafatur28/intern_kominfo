# WFH & Change Management Backend — Kominfo Jatimprov

Backend API for Kominfo Jatimprov with two modules:
1. **WFH Module** — Attendance + activity reporting with PDF export
2. **Change Management Module** — Change initiation + implementation approval workflow with PDF export

## Tech Stack
- PHP 8.2+ / Laravel 11
- PostgreSQL 15+
- Spatie Permission (RBAC)
- dompdf (PDF generation)
- Intervention Image (signature normalization)
- Maatwebsite Excel (bulk import)
- Bacon QR Code (document verification)

## Requirements
PHP extensions (MANDATORY):
```
ext-pdo_pgsql, ext-gd, ext-mbstring, ext-xml, ext-dom, ext-zip
```

## Setup
```bash
composer install
cp .env.example .env
php artisan key:generate

# Configure PostgreSQL in .env:
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kominfo_wfh
DB_USERNAME=your_user
DB_PASSWORD=your_password

php artisan storage:link
php artisan migrate
php artisan db:seed --class=RolePermissionSeeder
php artisan db:seed --class=ChangeTypeSeeder
php artisan db:seed --class=AdminUserSeeder
```

Default admin: `admin@kominfo.go.id` / `password`

## Test
```bash
php artisan test
```

## API Structure
- `/api/auth/*` — Login, me, logout
- `/api/profile/*` — Profile view, update, signature upload
- `/api/admin/users/*` — User CRUD + Excel import
- `/api/wfh/*` — Attendance, reports, approval flow, PDF export
- `/api/changes/*` — Initiation, implementation, review, PDF export
- `/api/admin/wfh/monitoring` — Admin attendance monitoring

## Architecture
- Domain-driven: `app/Domains/{Auth,Organization,Wfh,ChangeManagement}`
- Repository pattern with interfaces for testability
- Cross-cutting services: `app/Support/{Pdf,Signature,QrCode,Import}`
- Spatie RBAC: roles (admin, kepala_tim, staf) + 27 permissions

## PDF Generation
- dompdf + Blade templates replicate government form layouts
- Signature images rendered via `position:absolute` coordinates
- QR codes as inline SVG (bacon/bacon-qr-code)
- Templates: `resources/views/pdf/{wfh-report,change-initiation,change-implementation}.blade.php`

## Config
- `config/wfh.php` — Allowed WFH days (default: Friday)
- `config/change-mgmt.php` — Document number prefix format
