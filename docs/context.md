# Project Context

## 1. Project Overview

Personal Finance Tracking adalah aplikasi mobile untuk membantu pengguna mencatat, mengelola, dan memantau aktivitas keuangan pribadi. Aplikasi menyediakan pencatatan transaksi, pengelolaan Fund dan Pocket, serta ringkasan kondisi keuangan melalui Dashboard. Pengembangan MVP difokuskan pada pencatatan keuangan yang konsisten dan pengelolaan alokasi dana tanpa mengubah Fund menjadi sekadar wadah perencanaan.

## 2. Technology Stack

| Area | Technology | Version |
|---|---|---|
| Mobile framework | React Native | `0.88.1` |
| Development platform | Expo | SDK 58 (`expo ~58.0.26`) |
| Navigation and routing | Expo Router | Versi kompatibel SDK 58, dipasang melalui `npx expo install expo-router` |
| Programming language | JavaScript | ES2022 pada Hermes; TypeScript tidak digunakan |
| Backend and database platform | Supabase | `@supabase/supabase-js` v2 dan Supabase CLI lokal (belum terpasang) |
| Database | PostgreSQL | Versi bawaan Supabase CLI lokal |
| Source control | Git | Mengikuti versi lingkungan pengembangan |

**Catatan versi:** Versi dependency dan tools harus diverifikasi dari konfigurasi proyek aktual, seperti `package.json`, lockfile, `app.json`/`app.config.js`, serta lingkungan Supabase. Jangan menetapkan atau mengasumsikan nomor versi sebelum konfigurasi tersebut tersedia.

## 3. Project Directory Structure

Struktur direktori tingkat atas yang direncanakan:

```text
my-finance-mobile/
├── src/
│   ├── app/
│   ├── modules/
│   ├── appservices/
│   ├── data/
│   ├── shared/
│   └── config/
├── assets/
├── docs/
│   ├── context.md
│   ├── prd.md
│   ├── database.md
│   ├── sdd.md
│   ├── testing.md
│   └── backend-contract.md
├── supabase/
│   ├── migrations/
│   └── tests/
├── AGENTS.md
├── app.json
└── package.json
```

Keterangan:
- `src/app/` — direktori route dan layar aplikasi yang dikelola oleh Expo Router.
- `src/modules/` — komponen, hook, dan tampilan per fitur di luar definisi route.
- `src/appservices/` — use case dan orkestrasi bisnis.
- `src/data/` — repository dan konfigurasi akses Supabase.
- `src/shared/` — komponen, theme, hook, dan utilitas lintas fitur.
- `src/config/` — konfigurasi aplikasi seperti inisialisasi Supabase.
- `assets/` — aset statis aplikasi seperti gambar, ikon, dan font.
- `docs/` — dokumen spesifikasi dan perancangan proyek.
- `supabase/migrations/` — SQL migration yang version-controlled.
- `supabase/tests/` — skenario pgTAP untuk aturan database.
- `AGENTS.md` — instruksi kerja untuk AI atau kontributor pengembangan.
- `app.json` — konfigurasi aplikasi Expo.
- `package.json` — metadata proyek, scripts, dan dependency JavaScript.

Struktur di atas merupakan struktur target. Direktori `src/` dan `supabase/` dibuat pada tahap implementasi sesuai fase yang disetujui.

## 4. Naming Conventions

Konvensi penamaan yang digunakan:

- **File dan folder:** gunakan `kebab-case` untuk nama file dan folder umum, kecuali file konfigurasi atau file khusus yang mengikuti standar tool terkait.
- **Komponen React:** gunakan `PascalCase`, misalnya `FundCard.jsx`.
- **Variabel dan fungsi JavaScript:** gunakan `camelCase`, misalnya `activeBalance` dan `calculateBalance`.
- **Konstanta:** gunakan `UPPER_SNAKE_CASE` untuk nilai konstan yang benar-benar bersifat konstan, misalnya `DEFAULT_CURRENCY`.
- **Custom hooks:** awali nama dengan `use`, misalnya `useFunds`.
- **Nama service dan repository:** gunakan nama domain yang jelas diikuti tanggung jawabnya, misalnya `transactionService` atau `fundRepository`.
- **Nama database:** gunakan `snake_case` untuk tabel, kolom, function, dan objek database.

Nama harus deskriptif, konsisten, dan mencerminkan tanggung jawab atau domain yang diwakili. Hindari singkatan yang tidak umum.

**Catatan terminologi:** "Fund aktif" berarti Fund dengan `is_archived = false`. "Active Fund" berarti Fund dengan `fund_type = 'active'`. Keduanya bukan sinonim dan harus ditulis sesuai maksudnya.

## 5. Explicit Project Restrictions

Batasan dan keputusan teknis yang telah disepakati:

1. Aplikasi dikembangkan menggunakan React Native dengan Expo dan JavaScript. TypeScript tidak digunakan.
2. Expo Router digunakan untuk routing aplikasi.
3. Supabase digunakan sebagai platform backend dan PostgreSQL sebagai database.
4. Pengembangan utama dilakukan melalui terminal dan Neovim pada Fedora Workstation. Android Studio tidak menjadi IDE utama.
5. Terapkan **Modular Layered Architecture** dengan alur tanggung jawab Presentation → Application/AppServices → Repositories/Data Access → Supabase/PostgreSQL.
6. Komponen UI tidak boleh mengakses Supabase secara langsung. Akses data harus melalui lapisan repository atau mekanisme data access yang ditentukan dalam SDD.
7. Seluruh mutasi keuangan harus melewati Transaction Service. Komponen atau service lain tidak boleh mengubah saldo Fund secara langsung.
8. Validasi dan mutasi keuangan yang membutuhkan konsistensi, atomicity, atau pengendalian konkurensi harus ditegakkan di sisi database melalui mekanisme PostgreSQL yang dirancang dan didokumentasikan.
9. Perubahan skema database harus menggunakan SQL migration yang telah ditinjau dan disetujui. Jangan menerapkan migration atau mengubah database tanpa persetujuan eksplisit pengguna.
10. Dokumen spesifikasi harus dijaga konsisten sebelum SQL migration dibuat atau diterapkan.
11. AI atau kontributor tidak boleh menjalankan Git commit maupun Git push tanpa instruksi eksplisit pengguna.
12. Setiap tahap pekerjaan harus menunggu persetujuan pengguna sebelum melanjutkan ke tahap berikutnya.
13. Setelah pekerjaan implementasi, laporkan file yang berubah, ringkasan perubahan, hasil pengujian, kendala, dan risiko yang masih ada.
14. Jangan menambahkan library, layanan eksternal, atau dependensi baru tanpa alasan teknis yang jelas dan persetujuan pengguna bila perubahan tersebut berdampak pada keputusan stack.

### 5.1 Keputusan Implementasi yang Disepakati

Keputusan berikut melengkapi batasan pada bagian sebelumnya dan menjadi acuan implementasi:

1. Route Expo Router berada di `src/app/`. Kode non-route berada di `src/modules/`, `src/appservices/`, `src/data/`, dan `src/shared/`.
2. UI dibangun dengan komponen React Native murni dan theme internal. UI library tambahan tidak digunakan.
3. Pengembangan backend dimulai dari Supabase lokal melalui Supabase CLI dan Docker. Project cloud disiapkan setelah alur lokal stabil.
4. Expense hanya boleh menggunakan Fund dengan `fund_type = 'active'` dan `is_archived = false`. Aturan ini berlaku pada pembuatan Expense, pengubahan Expense, konversi Planned Expense, dan konfirmasi Expense Automation.
5. Transfer boleh melibatkan Fund `savings_goal` pada sisi sumber maupun tujuan selama Fund tidak diarsipkan.
6. Income boleh menggunakan Fund `savings_goal` sebagai Fund tujuan selama Fund tidak diarsipkan.
7. Pocket yang diarsipkan menolak penambahan item baru, tetapi item yang sudah ada tetap dapat dikonfirmasi, dikonversi, diubah, atau dihapus sesuai aturan tipenya.
8. Tanggal transaksi bersifat tanggal kalender lokal. Nilai `occurred_at` disimpan sebagai `timestamptz` pada pukul 12.00 waktu lokal perangkat agar tanggal tidak bergeser. Filter dan agregasi memakai batas hari lokal.
9. Autentikasi menggunakan email dan password melalui Supabase Auth. Reset password dan layar penghapusan akun tidak termasuk MVP. Email confirmation dinonaktifkan pada environment lokal.
10. Aplikasi tidak menyediakan mode offline. Data dibaca dari Supabase dan memerlukan koneksi.
11. Pengujian otomatis menggunakan pgTAP untuk aturan database, Jest untuk logika JavaScript, dan matriks manual dari `testing.md`.
12. Kontrak RPC, kode error, dan aturan locking didokumentasikan di `docs/backend-contract.md` dan menjadi acuan pembuatan migration.

---

## Document Ownership

Dokumen ini hanya menjadi sumber utama untuk konteks proyek, stack dan versi, struktur direktori, konvensi penamaan, serta batasan teknis yang berlaku secara umum.

Rincian kebutuhan produk dan perilaku fitur berada di `prd.md`. Definisi skema dan aturan pada tingkat database berada di `database.md`. Rancangan arsitektur dan tanggung jawab teknis berada di `sdd.md`. Skenario pengujian berada di `testing.md`.
