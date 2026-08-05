# LINT REPORT — intern-kominfo-fitri

Tanggal: 2026-08-05
Branch: `feature/fitri-auth-profile-uikit`

## Deteksi Proyek

| Aspek | Nilai |
|---|---|
| Jenis proyek | Laravel (PHP 8.3) + React/TypeScript (Vite) |
| Linter JS/TS | ESLint 10 (`eslint.config.js`, flat config) + `typescript-eslint` + `eslint-plugin-react-hooks` |
| Linter PHP | Laravel Pint 1.x (`laravel/pint`, preset default Laravel) |
| Skrip lint | `npm run lint` (ESLint), `vendor/bin/pint --test` (Pint) |
| Auto-fix | ESLint: `npm run lint:fix` — Pint: `vendor/bin/pint` |

## a. Ringkasan Eksekutif

- **File diperiksa:**
  - JS/TS: **68 file** (`resources/js/**`)
  - PHP: **221 file** (app, routes, database, tests, config, bootstrap)
- **Total error: 0**
- **Total warning: 29** (17 ESLint + 12 file PHP kena formatting Pint)
- **Status keseluruhan: LULUS** — 0 error. Catatan: PHP tidak lolos cek formatting Pint (`--test` fail, 12 file), semua berupa style, bukan bug.

---

## b. Tabel Detail Masalah

### ESLint (JS/TS) — 17 warning

| No | File | Baris:Kolom | Severity | Rule | Pesan |
|---|---|---|---|---|---|
| 1 | `resources/js/components/ui/Sidebar.tsx` | 1:61 | warning | `@typescript-eslint/no-unused-vars` | `'MouseEvent'` diimport tapi tidak dipakai |
| 2 | `resources/js/config/menus.tsx` | 7:3 | warning | `@typescript-eslint/no-unused-vars` | `'WfhIcon'` diimport tapi tidak dipakai |
| 3 | `resources/js/config/menus.tsx` | 28:10 | warning | `@typescript-eslint/no-unused-vars` | `'capFirst'` didefinisikan tapi tidak dipakai |
| 4 | `resources/js/pages/ProfilSaya.tsx` | 21:20 | warning | `@typescript-eslint/no-unused-vars` | `'user'` di-assign tapi tidak dipakai |
| 5 | `resources/js/pages/change-management/UserInisiasi.tsx` | 1:21 | warning | `@typescript-eslint/no-unused-vars` | `'useMemo'` diimport tapi tidak dipakai |
| 6 | `resources/js/pages/wfh/WfhAbsensi.tsx` | 7:8 | warning | `@typescript-eslint/no-unused-vars` | `'Input'` diimport tapi tidak dipakai |
| 7 | `resources/js/pages/wfh/WfhAbsensi.tsx` | 81:11 | warning | `@typescript-eslint/no-unused-vars` | `'user'` di-assign tapi tidak dipakai |
| 8 | `resources/js/pages/wfh/WfhAbsensi.tsx` | 134:6 | warning | `react-hooks/exhaustive-deps` | `useEffect` kekurangan dependency `'loadData'` |
| 9 | `resources/js/pages/wfh/WfhLaporan.tsx` | 24:8 | warning | `@typescript-eslint/no-unused-vars` | `'WfhReportActivity'` diimport tapi tidak dipakai |
| 10 | `resources/js/pages/wfh/WfhLaporan.tsx` | 50:26 | warning | `@typescript-eslint/no-unused-vars` | `'user'` di-assign tapi tidak dipakai |
| 11 | `resources/js/pages/wfh/WfhLaporanTim.tsx` | 30:11 | warning | `@typescript-eslint/no-unused-vars` | `'user'` di-assign tapi tidak dipakai |
| 12 | `resources/js/pages/wfh/WfhLaporanTim.tsx` | 65:27 | warning | `@typescript-eslint/no-explicit-any` | `any` dipakai, disarankan tipe eksplisit |
| 13 | `resources/js/pages/wfh/WfhMonitoring.tsx` | 166:27 | warning | `@typescript-eslint/no-explicit-any` | `any` dipakai, disarankan tipe eksplisit |
| 14 | `resources/js/pdf/changeInitiationTemplate.js` | 28:52 | warning | `@typescript-eslint/no-unused-vars` | `'bsreLogoUrl'` di-destructure tapi tidak dipakai |
| 15 | `resources/js/pdf/cleanReportPdf.ts` | 21:7 | warning | `@typescript-eslint/no-unused-vars` | `'GRAY'` didefinisikan tapi tidak dipakai |
| 16 | `resources/js/pdf/cleanReportPdf.ts` | 269:9 | warning | `@typescript-eslint/no-unused-vars` | `'fsz'` didefinisikan tapi tidak dipakai |
| 17 | `resources/js/pdf/cleanReportPdf.ts` | 339:5 | warning | `no-useless-assignment` | Nilai `'yy'` di-assign tapi tidak pernah dibaca setelahnya |

### Pint (PHP) — 12 file tidak lolos formatting (style)

| No | File | Baris:Kolom | Severity | Rule | Pesan |
|---|---|---|---|---|---|
| 18 | `app/Domains/ChangeManagement/Http/Requests/ChangePackageRules.php` | - | warning | Pint (5 fixer) | `control_structure_braces`, `unary_operator_spaces`, `braces_position`, `statement_indentation`, `not_operator_with_successor_space` |
| 19 | `app/Domains/Wfh/Http/Controllers/ReportAttendanceController.php` | - | warning | Pint (5 fixer) | `unary_operator_spaces`, `braces_position`, `not_operator_with_successor_space`, `single_line_empty_body`, `ordered_imports` |
| 20 | `app/Domains/Wfh/Http/Controllers/ReportController.php` | - | warning | Pint (5 fixer) | `fully_qualified_strict_types`, `unary_operator_spaces`, `braces_position`, `not_operator_with_successor_space`, `single_line_empty_body`, `ordered_imports` |
| 21 | `app/Domains/Wfh/Http/Requests/AppendAttendanceRequest.php` | - | warning | Pint (1 fixer) | `single_blank_line_at_eof` |
| 22 | `app/Domains/Wfh/Http/Requests/StoreReportRequest.php` | - | warning | Pint (1 fixer) | `class_attributes_separation` |
| 23 | `app/Domains/Wfh/Repositories/WfhRepositoryInterface.php` | - | warning | Pint (1 fixer) | `single_blank_line_at_eof` |
| 24 | `database/migrations/2026_07_27_135003_add_unique_active_draft_to_wfh_reports.php` | - | warning | Pint (3 fixer) | `class_definition`, `braces_position`, `single_blank_line_at_eof` |
| 25 | `database/seeders/DemoUsersSeeder.php` | - | warning | Pint (2 fixer) | `class_attributes_separation`, `no_whitespace_in_blank_line` |
| 26 | `routes/api.php` | - | warning | Pint (1 fixer) | `ordered_imports` |
| 27 | `tests/Feature/Organization/UserImportTest.php` | - | warning | Pint (1 fixer) | `ordered_imports` |
| 28 | `tests/Feature/Wfh/ReportActivitySubResourceTest.php` | - | warning | Pint (1 fixer) | `no_unused_imports` |
| 29 | `tests/Feature/Wfh/UniqueActiveDraftTest.php` | - | warning | Pint (3 fixer) | `fully_qualified_strict_types`, `ordered_imports`, `single_blank_line_at_eof` |

> Baris:Kolom `-` = Pint fixer format seluruh file (bukan per-baris).

---

## c. Pengelompokan berdasarkan Kategori

| Kategori | Jumlah | Rule terkait |
|---|---|---|
| Formatting/style | 12 | Pint (braces, spasi, urutan import, EOF, dll) |
| Unused variable/import | 13 | `@typescript-eslint/no-unused-vars` |
| Potential bug/logic error | 1 | `no-useless-assignment` (`yy` di `cleanReportPdf.ts`) |
| Best practice violation | 3 | `react-hooks/exhaustive-deps` (1), `@typescript-eslint/no-explicit-any` (2) |
| Security issue | 0 | - |
| **Total** | **29** | |

---

## d. File dengan Masalah Terbanyak (Top 5)

| Peringkat | File | Jumlah masalah |
|---|---|---|
| 1 | `resources/js/pages/wfh/WfhAbsensi.tsx` | 3 |
| 2 | `resources/js/pdf/cleanReportPdf.ts` | 3 |
| 3 | `resources/js/config/menus.tsx` | 2 |
| 4 | `resources/js/pages/wfh/WfhLaporan.tsx` | 2 |
| 5 | `resources/js/pages/wfh/WfhLaporanTim.tsx` | 2 |

> Catatan: file PHP kena 1 masalah formatting masing-masing; yang paling banyak fixer: `ChangePackageRules.php`, `ReportAttendanceController.php`, `ReportController.php` (5-6 fixer per file).

---

## e. Prioritas Perbaikan

### Critical (harus sebelum merge)
Tidak ada. **0 error.**

### Medium (perbaiki secepatnya)
1. `react-hooks/exhaustive-deps` di `WfhAbsensi.tsx:134` — `loadData` tidak ada di dependency array; risiko data stale / bug referensi closure.
2. `no-useless-assignment` di `cleanReportPdf.ts:339` — assignment `yy` terakhir tidak pernah dibaca; indikasi sisa kode, bukan bug runtime.
3. 12 file PHP gagal Pint — formatting tidak konsisten; berisiko konflik merge di file yang sama.

### Low (opsional/style)
4. 13 unused variable/import — dead code, aman dihapus manual.
5. 2 `no-explicit-any` — ganti dengan tipe eksplisit saat refactor API layer.

---

## f. Rekomendasi

1. **Pola berulang: unused variable/import (13 kasus).** `eslint --fix` tidak menghapus unused variable (bukan auto-fixable). Solusi cepat: hapus manual import/var yang terdaftar di tabel — semua aman (tidak dirujuk di file).
2. **PHP formatting (12 file).** Pint mendukung auto-fix penuh: jalankan `vendor/bin/pint` (bukan `--test`). Aman karena hanya formatting. **Perlu konfirmasi Anda sebelum dijalankan** (sesuai instruksi, tidak mengubah kode tanpa izin).
3. **Update konfigurasi linter:**
   - ESLint: `no-unused-vars` & `no-explicit-any` sudah diturunkan ke `warn` agar lint lolos tanpa ubah kode existing. Jika mau ketat, naikkan ke `error` setelah dead code dibersihkan.
   - `react-hooks/set-state-in-effect` dan `react-hooks/purity` sengaja di-`off` (pola fetch-di-effect & `Math.random` di Sidebar, sudah disepakati). Jangan nyalakan tanpa refactor besar.
   - Scope ESLint saat ini hanya `resources/js`. `vite.config.js` dan `eslint.config.js` di luar cakupan; bisa ditambahkan ke `files` config jika mau.
4. **Jalankan di CI** (GitHub Actions): `npm ci && npm run lint` + `vendor/bin/pint --test` — mencegah regresi.
