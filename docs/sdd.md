# SYSTEM DESIGN DOCUMENT (SDD)
## Personal Finance Tracking Application

**Document Version:** 0.2  
**Document Status:** Draft — revisi Fase 0 (penyelarasan dokumen dan kontrak backend)  
**Last Updated:** 21 November 2026  
**Platform:** Android (MVP)  
**Technology Stack:** React Native, Expo, JavaScript, Supabase, PostgreSQL

---

# 1. Purpose and Scope

Dokumen ini menjelaskan rancangan teknis aplikasi Personal Finance Tracking sebagai acuan implementasi. SDD mencakup arsitektur aplikasi, tanggung jawab setiap layer dan modul, alur komunikasi, serta penanganan operasi finansial dan Automation.

Dokumen ini tidak mengulang definisi kebutuhan produk maupun struktur tabel database. Rincian fitur dan perilaku pengguna mengacu pada `prd.md`, sedangkan struktur tabel, kolom, relasi, constraint, index, dan seed data mengacu pada `database.md`.

## 1.1 Design Principles

1. Menggunakan Modular Layered Architecture dalam satu aplikasi, bukan Microservices.
2. Memisahkan UI, business orchestration, data access, dan backend/database.
3. Seluruh perubahan finansial harus melewati Transaction Service.
4. Presentation Layer tidak boleh mengakses Supabase secara langsung.
5. Validasi penting dan operasi finansial harus ditegakkan kembali di backend/database.
6. Operasi yang mengubah data finansial harus atomic.
7. Saldo Fund dihitung dari Opening Balance dan transaksi aktual, bukan dari cache saldo.
8. Pocket merupakan pengelompokan transaksi dan tidak menjadi sumber saldo tersendiri.
9. Implementasi mengikuti keputusan bisnis dalam `prd.md` dan struktur data dalam `database.md`.
10. Tidak menambahkan layanan eksternal atau kompleksitas yang belum dibutuhkan MVP.

# 2. Technology and Runtime Architecture

## 2.1 Technology Responsibilities

| Technology | Responsibility |
|---|---|
| React Native | Membangun antarmuka aplikasi mobile |
| Expo | Menyediakan toolchain dan integrasi native |
| JavaScript | Bahasa pemrograman aplikasi |
| Expo Router | Navigasi dan routing aplikasi |
| Supabase | Backend platform dan akses layanan backend |
| PostgreSQL | Penyimpanan data, constraint, RLS, dan operasi database |
| Supabase Auth | Autentikasi pengguna |
| PostgreSQL RLS | Membatasi akses data berdasarkan pengguna |
| PostgreSQL Functions / RPC | Menjalankan operasi backend yang membutuhkan validasi dan atomicity |

Versi dependency mengikuti konfigurasi aktual proyek (`package.json` dan konfigurasi Expo). SDD ini tidak menetapkan nomor versi yang belum diverifikasi.

## 2.2 Runtime Components

Aplikasi terdiri dari komponen berikut:

- **Mobile Application:** Menampilkan halaman, menerima input, dan mengirim permintaan use case.
- **AppServices:** Mengatur alur use case dan mengoordinasikan repository.
- **Repositories:** Menjadi jalur akses data dari aplikasi ke Supabase.
- **Supabase Auth:** Menyediakan identitas sesi pengguna.
- **PostgreSQL:** Menyimpan data dan menegakkan aturan integritas.
- **Database Functions / RPC:** Menangani operasi finansial yang harus dijalankan sebagai satu kesatuan.
- **Automation Schedule Check:** Memeriksa jadwal Automation melalui kemampuan backend Supabase dan pemeriksaan saat aplikasi dibuka kembali.

Tidak ada akses database langsung dari komponen UI.

# 3. Application Architecture

## 3.1 Modular Layered Architecture

Aplikasi menggunakan empat layer utama.

```text
┌────────────────────────────────────────────┐
│              PRESENTATION                 │
│ Screens · Components · Forms · Hooks      │
└──────────────────────┬─────────────────────┘
                       │ use case request
                       ▼
┌────────────────────────────────────────────┐
│              APPLICATION                  │
│ AppServices · Business Orchestration      │
└──────────────────────┬─────────────────────┘
                       │ repository request
                       ▼
┌────────────────────────────────────────────┐
│               DATA ACCESS                 │
│ Repositories · Supabase Client · Mapping  │
└──────────────────────┬─────────────────────┘
                       │ authenticated request
                       ▼
┌────────────────────────────────────────────┐
│            BACKEND / DATABASE             │
│ Supabase Auth · PostgreSQL · RLS · RPC    │
│ Backend schedule checking                 │
└────────────────────────────────────────────┘
```

Arah dependensi utama adalah Presentation → Application → Data Access → Backend/Database. Layer yang lebih rendah tidak bergantung pada komponen UI.

## 3.2 Presentation Layer

Tanggung jawab:

- Menampilkan screens dan reusable UI components.
- Mengelola input form dan local UI state.
- Menampilkan loading, success, empty, dan error state.
- Memanggil AppServices untuk menjalankan use case.
- Memperbarui tampilan berdasarkan hasil use case.

Batasan:

- Tidak mengimpor atau memanggil Supabase Client secara langsung.
- Tidak menjalankan query database.
- Tidak menghitung atau mengubah saldo sebagai sumber kebenaran.
- Tidak memutuskan sendiri apakah operasi finansial valid.

## 3.3 Application Layer (AppServices)

Tanggung jawab:

- Menyediakan use case yang dipanggil Presentation Layer.
- Mengatur urutan proses bisnis.
- Memanggil satu atau beberapa repository sesuai kebutuhan.
- Menyampaikan hasil proses dalam bentuk yang dapat digunakan UI.
- Menangani pemetaan error teknis menjadi error aplikasi yang konsisten.

AppServices menjadi tempat orkestrasi, bukan tempat untuk menggantikan validasi backend. Aturan finansial yang kritis tetap ditegakkan oleh PostgreSQL.

## 3.4 Data Access Layer

Tanggung jawab:

- Menyediakan repository untuk setiap kelompok data.
- Mengirim query atau RPC ke Supabase.
- Mengubah hasil backend menjadi bentuk data aplikasi.
- Menangani detail komunikasi backend agar tidak tersebar ke UI.
- Mengembalikan error akses data kepada AppServices.

Repository tidak boleh menjadi jalur alternatif untuk melewati Transaction Service dalam operasi finansial.

## 3.5 Backend and Database Layer

Tanggung jawab:

- Menyimpan data aplikasi.
- Memverifikasi identitas dan hak akses pengguna.
- Menegakkan Row Level Security.
- Menegakkan constraints dan aturan integritas data.
- Menjalankan operasi finansial secara atomic melalui database function/RPC.
- Memeriksa dan menghasilkan occurrence Automation sesuai jadwal yang telah ditentukan.

Validasi di client digunakan untuk membantu pengalaman pengguna, tetapi backend tetap menjadi pihak yang menentukan apakah operasi dapat dijalankan.

# 4. Project Module Structure

Struktur modul mengikuti pemisahan fitur dan tanggung jawab layer. Struktur ini menjadi acuan organisasi kode, bukan definisi schema database.

```text
my-finance-mobile/
├── src/
│   ├── app/
│   │   ├── _layout.jsx
│   │   ├── (auth)/
│   │   └── (app)/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── funds/
│   │   ├── pockets/
│   │   ├── automations/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── appservices/
│   │   ├── transaction/
│   │   ├── fund/
│   │   ├── pocket/
│   │   ├── automation/
│   │   ├── dashboard/
│   │   ├── category/
│   │   └── notification/
│   │
│   ├── data/
│   │   ├── repositories/
│   │   └── supabase/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── theme/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── validators/
│   │
│   └── config/
│       └── supabase.js
│
├── supabase/
│   ├── migrations/
│   ├── tests/
│   └── config.toml
│
├── assets/
├── docs/
├── AGENTS.md
├── app.json
└── package.json
```

`src/app/` digunakan untuk route Expo Router. `src/modules/` berisi tampilan dan komponen yang terkait dengan fitur. `src/appservices/` berisi use case dan business orchestration. `src/data/` berisi repository dan konfigurasi akses Supabase. `src/shared/` berisi komponen, theme, dan utilitas lintas fitur. `supabase/migrations/` dan `supabase/tests/` berisi migration SQL dan skenario pgTAP.

# 5. Module Responsibilities

## 5.1 Transaction Module and Transaction Service

Transaction Service adalah satu-satunya jalur untuk membuat, mengubah, dan menghapus transaksi finansial.

Tanggung jawab:

- Create Income.
- Create Expense.
- Create Transfer.
- Update Transaction.
- Delete Transaction.
- Memvalidasi kombinasi data transaksi.
- Memastikan Fund sumber dan tujuan sesuai.
- Memastikan saldo mencukupi untuk Expense dan Transfer.
- Memastikan Fund sumber Expense berklasifikasi Active dan tidak diarsipkan.
- Mengirim operasi ke backend atomic function/RPC.
- Mengembalikan hasil transaksi kepada pemanggil.

Semua sumber transaksi menggunakan service ini, termasuk:

- Transaction Screen.
- Pocket.
- Konfirmasi Income Automation.
- Konfirmasi Expense Automation.

Transaction Repository hanya menyediakan akses data yang diperlukan oleh Transaction Service. Modul lain tidak boleh menulis langsung ke data transaksi melalui repository.

## 5.2 Fund Service

Tanggung jawab:

- Membuat Fund dan menginisialisasi Opening Balance.
- Mengubah informasi Fund.
- Mengarsipkan dan mengaktifkan kembali Fund.
- Mengambil daftar dan detail Fund.
- Mengambil saldo Fund berdasarkan hasil perhitungan data aktual.
- Memeriksa ketentuan penghapusan atau pengarsipan Fund melalui backend.

Fund Service tidak menyediakan fungsi untuk mengubah saldo secara manual. Saldo berasal dari Opening Balance dan transaksi aktual. Perhitungan saldo tidak menggunakan cached balance.

## 5.3 Pocket Service

Tanggung jawab:

- Membuat dan mengubah informasi Pocket.
- Mengarsipkan dan mengaktifkan kembali Pocket.
- Mengubah tipe Pocket hanya jika masih diizinkan oleh aturan produk.
- Mengambil daftar Pocket dan detail item di dalamnya.
- Memvalidasi status serta tipe Pocket sebelum item transaksi dibuat.
- Menghubungkan transaksi dengan Pocket melalui Transaction Service.
- Mengelola penghapusan Pocket sesuai aturan retensi transaksi. Transaksi yang dilepas diberi Category Other Income (Income) atau Other (Expense).

Pocket Service tidak mengubah saldo Fund secara langsung. Untuk item yang menghasilkan transaksi finansial, Pocket Service meneruskan data ke Transaction Service.

## 5.4 Automation Service

Tanggung jawab:

- Membuat Automation bersama template Pocket Item-nya dan mengubah konfigurasi Automation.
- Mengelola jadwal dan template Income atau Expense.
- Mengambil occurrence yang menunggu konfirmasi.
- Memproses konfirmasi atau penolakan pengguna.
- Memastikan satu occurrence tidak dieksekusi lebih dari sekali.
- Memanggil Transaction Service ketika pengguna mengonfirmasi transaksi.
- Menghapus template Pocket Item, seluruh occurrence, dan notifikasi terkait ketika Automation dihapus sesuai aturan produk.

Automation Service tidak mencatat transaksi aktual sebelum pengguna mengonfirmasi occurrence. Automation untuk Transfer tidak termasuk dalam MVP.

## 5.5 Notification Service

Tanggung jawab:

- Mengambil daftar Notification.
- Menampilkan kartu konfirmasi yang masih pending.
- Mengarahkan pengguna ke konteks Pocket/Automation terkait.
- Memproses perubahan status yang memang tersedia pada fitur.
- Menghapus Notification terkait setelah occurrence dikonfirmasi atau ditolak.

Notification adalah representasi permintaan konfirmasi yang masih perlu ditindaklanjuti. Kartu tetap tersedia setelah aplikasi ditutup dan hanya hilang setelah pengguna memilih Confirm atau Reject. Tidak ada mekanisme pengingat berulang atau kedaluwarsa otomatis.

Notification Service tidak membuat transaksi finansial. Aksi Confirm diteruskan ke Automation Service.

## 5.6 Dashboard Service

Tanggung jawab:

- Mengambil saldo Fund.
- Menghitung Active Balance.
- Mengambil data Expense aktual untuk grafik tujuh hari kalender terakhir termasuk hari ini.
- Menyediakan data ringkasan yang diperlukan Dashboard.

Dashboard Service bersifat read-only. Dashboard tidak menulis transaksi atau mengubah saldo.

Active Balance dihitung dari total saldo Fund berstatus Active dikurangi alokasi Expense Pocket yang masih planned. Fund kategori Savings/Goal tidak dimasukkan. Template Automation tidak dihitung sebagai alokasi Expense.

## 5.7 Category Service

Tanggung jawab:

- Mengambil daftar Category sistem.
- Menyediakan Category berdasarkan tipe transaksi.
- Memvalidasi pemilihan Category untuk transaksi yang tidak terhubung dengan Pocket.

Pengelolaan Category kustom tidak termasuk dalam cakupan MVP yang telah ditetapkan.

# 6. Core Application Workflows

## 6.1 Create Income

```text
User
  │
  ▼
Transaction Screen
  │
  ▼
Transaction Service
  │
  ├─ Validate amount and transaction input
  ├─ Validate destination Fund
  └─ Validate Category / Pocket rules
  │
  ▼
Transaction Repository
  │
  ▼
PostgreSQL Function / RPC
  │
  ├─ Validate ownership and Fund status
  ├─ Validate transaction constraints
  └─ Record Income atomically
  │
  ▼
Return result
  │
  ▼
Refresh affected screens
```

Income menambah saldo Fund tujuan melalui transaksi aktual. Opening Balance tidak diperlakukan sebagai Income.

## 6.2 Create Expense

```text
User
  │
  ▼
Transaction Screen
  │
  ▼
Transaction Service
  │
  ├─ Validate amount
  ├─ Validate source Fund is Active and not archived
  ├─ Validate Category / Pocket rules
  └─ Check sufficient balance
  │
  ▼
PostgreSQL Function / RPC
  │
  ├─ Revalidate ownership, Fund status, and fund_type = 'active'
  ├─ Check current available balance
  └─ Record Expense atomically
  │
  ▼
Return result
  │
  ▼
Refresh Fund, History, and Dashboard data
```

Pemeriksaan saldo di client hanya untuk memberi umpan balik awal. Pemeriksaan akhir dilakukan di backend agar dua operasi bersamaan tidak menghasilkan saldo negatif. Fund `savings_goal` tidak dapat menjadi sumber Expense; pengguna harus memindahkan dana ke Active Fund terlebih dahulu melalui Transfer.

## 6.3 Create Transfer

```text
User
  │
  ▼
Transaction Screen / Transfer Pocket
  │
  ▼
Transaction Service
  │
  ├─ Validate amount
  ├─ Validate source Fund
  ├─ Validate destination Fund
  ├─ Ensure source and destination differ
  └─ Check sufficient source balance
  │
  ▼
PostgreSQL Function / RPC
  │
  ├─ Revalidate ownership and Fund status
  ├─ Check current source balance
  └─ Record Transfer atomically
  │
  ▼
Return result
  │
  ▼
Refresh both Fund balances and related views
```

Pencatatan Transfer, pengurangan saldo sumber, dan penambahan saldo tujuan harus berhasil sebagai satu kesatuan. Transfer tidak dihitung sebagai Income atau Expense.

## 6.4 Create Transaction from Pocket

```text
User
  │
  ▼
Pocket Screen
  │
  ▼
Pocket Service
  │
  ├─ Validate Pocket exists and is active
  ├─ Validate Pocket type
  └─ Prepare transaction input
  │
  ▼
Transaction Service
  │
  ├─ Validate transaction rules
  ├─ Validate Active Fund requirement for Expense items
  └─ Execute requested transaction
  │
  ▼
PostgreSQL Function / RPC
  │
  └─ Persist transaction and Pocket relation atomically
  │
  ▼
Return result
  │
  ▼
Refresh Pocket, Fund, History, and Dashboard
```

Pocket tidak menambah atau mengurangi saldo secara terpisah. Dampak finansial hanya berasal dari transaksi yang berhasil dicatat. Konversi Planned Expense dan konfirmasi Expense Automation hanya boleh memakai Fund dengan `fund_type = 'active'` yang tidak diarsipkan.

## 6.5 Update and Delete Transaction

Transaksi yang dapat dikelola melalui Transaction History atau Pocket tetap diproses melalui Transaction Service. Transaksi yang masih terhubung dengan Pocket hanya diubah atau dihapus melalui halaman Pocket.

**Update:**
1. UI mengirim perubahan ke Transaction Service.
2. Service memvalidasi data baru dan konteks transaksi.
3. Backend memeriksa ulang dampak transaksi lama dan transaksi baru.
4. Backend menjalankan perubahan secara atomic.
5. UI memperbarui data Fund, Pocket, History, dan Dashboard yang terdampak.

**Delete:**
1. UI meminta penghapusan melalui Transaction Service.
2. Service memeriksa apakah transaksi boleh dihapus.
3. Backend memvalidasi aturan penghapusan.
4. Dampak finansial transaksi dibatalkan dalam operasi yang konsisten.
5. Data terkait diperbarui pada tampilan.

Income yang dihasilkan dari Income Automation tidak dapat dihapus oleh pengguna selama masih terhubung dengan occurrence asalnya (setelah Pocket atau Automation dihapus, transaksi menjadi transaksi biasa). Pembatasan ini harus ditegakkan di backend, bukan hanya dengan menyembunyikan tombol di UI. Jika transaksi tersebut berasal dari Transfer Pocket, penghapusan transaksi juga menghapus item Pocket terkait sesuai aturan produk. Expense Transaction hasil Automation tidak dilindungi dari penghapusan; penghapusannya juga menghapus occurrence terkait dan mempertahankan template untuk periode berikutnya.

Aturan tambahan yang ditegakkan di backend:

- Pengubahan atau penghapusan ditolak jika membuat saldo Fund mana pun negatif.
- Expense, baik saat dibuat maupun diubah, hanya boleh menggunakan Fund `active` yang tidak diarsipkan.
- Jenis transaksi tidak dapat diubah. Nominal transaksi hasil konversi Planned Expense tidak dapat diubah.
- Perubahan nominal pada Income Pocket tanpa Automation dan Transfer Pocket memperbarui nominal Pocket Item terkait.
- Penghapusan transaksi dari Pocket menerapkan siklus item: Income Pocket kembali ke pending, Expense konversi kembali ke planned, Transfer menghapus Pocket Item.

## 6.6 Fund Balance Retrieval

Saldo Fund dihitung langsung dari:

`Opening Balance + Total Income - Total Expense + Net Transfer`

Alur:

1. Fund Service meminta data saldo melalui repository.
2. Repository meminta hasil perhitungan ke PostgreSQL.
3. PostgreSQL menghitung berdasarkan Opening Balance dan transaksi aktual.
4. Hasil dikembalikan ke Fund Service.
5. UI menampilkan saldo.

Tidak ada cached balance atau proses mutasi saldo manual. Pocket dan template Automation tidak dihitung sebagai transaksi aktual.

## 6.7 Dashboard Retrieval

1. Dashboard Screen meminta ringkasan kepada Dashboard Service.
2. Dashboard Service meminta data Fund, transaksi aktual, dan alokasi Expense Pocket.
3. Repository mengambil data dari PostgreSQL.
4. Dashboard Service menghitung Active Balance dan menyiapkan data grafik.
5. Dashboard Screen menampilkan hasil.

Active Balance:

`Total saldo Active Funds - Outstanding Expense Pocket allocations`

Outstanding allocation hanya berasal dari item Expense berstatus planned yang bukan template Automation. Grafik Expense mengambil transaksi Expense aktual pada tujuh hari kalender terakhir termasuk hari ini.

# 7. Automation and Notification Processing

## 7.1 Automation Scope

Automation pada MVP berlaku untuk:

- Income Pocket.
- Expense Pocket.

Automation tidak berlaku untuk Transfer Pocket.

Setiap Automation terhubung dengan item Pocket sebagai template. Template tidak dengan sendirinya menghasilkan perubahan saldo. Automation dipilih ketika item dibuat, dan menghapus Automation menghapus item template-nya.

## 7.2 Schedule Checking

Pemeriksaan jadwal menggunakan kemampuan backend Supabase yang tersedia dan pemeriksaan saat aplikasi dibuka.

Ketentuan proses:

1. Backend memeriksa Automation yang sudah mencapai waktu eksekusi.
2. Sistem membuat satu occurrence untuk setiap periode jadwal yang terlewat dan masih perlu diproses.
3. Setiap occurrence menghasilkan satu Notification pending.
4. Jika aplikasi tidak dibuka pada tanggal jadwal, pemeriksaan dilanjutkan ketika aplikasi dibuka kembali.
5. Jika beberapa periode terlewat, sistem membuat satu occurrence dan satu kartu konfirmasi untuk setiap periode yang terlewat.
6. Sistem tidak membuat transaksi aktual sebelum pengguna mengonfirmasi.

Tidak ada ketergantungan pada layanan scheduler pihak ketiga. Pemeriksaan saat aplikasi dibuka menjadi mekanisme catch-up ketika aplikasi tidak aktif.

## 7.3 Recurrence Handling

Frekuensi yang didukung:

- Weekly.
- Every two weeks.
- Monthly.

Untuk jadwal bulanan pada tanggal yang tidak tersedia di bulan tertentu, tanggal eksekusi menggunakan hari terakhir bulan tersebut. Jadwal bulanan mengacu pada tanggal mulai Automation. Jika tanggal mulai diubah, perhitungan jadwal berikutnya mengikuti tanggal mulai baru.

Occurrence dianggap jatuh tempo sejak pukul 00.00 pada tanggal jadwal di zona waktu Automation yang tersimpan. Waktu eksekusi tidak dikonfigurasi oleh pengguna pada MVP.

Timezone identifier disimpan ketika Automation dibuat dan tetap digunakan sampai pengguna mengubahnya secara manual. Perubahan timezone perangkat tidak otomatis mengubah timezone Automation.

## 7.4 Pending Notification Lifecycle

```text
Schedule becomes due
        │
        ▼
Create occurrence
        │
        ▼
Create pending Notification
        │
        ▼
Display persistent confirmation card
        │
        ├───────────────┐
        ▼               ▼
     Confirm           Reject
        │               │
        ▼               ▼
Automation Service   Mark occurrence rejected
        │               │
        ▼               ▼
Transaction Service  Delete related Notification
        │
        ▼
Create actual transaction
        │
        ▼
Mark occurrence confirmed
        │
        ▼
Delete related Notification
```

Kartu Notification tetap tersimpan ketika aplikasi ditutup. Kartu hanya hilang setelah Confirm atau Reject. Tidak ada pengingat berulang dan tidak ada expiry otomatis.

## 7.5 Confirm Income Automation

1. Pengguna membuka kartu konfirmasi Income.
2. UI menampilkan detail transaksi (nominal sama dengan template), pilihan Fund tujuan (default dari template), dan peringatan bahwa setelah dikonfirmasi, Income Transaction akan tercatat permanen dan tidak dapat dihapus.
3. Pengguna memilih Confirm.
4. Automation Service memvalidasi occurrence masih pending.
5. Automation Service meneruskan data transaksi ke Transaction Service.
6. Transaction Service menjalankan operasi melalui backend atomic function/RPC.
7. Setelah berhasil, occurrence ditandai confirmed dan Notification terkait dihapus.

Fund tujuan Income boleh berupa Fund `active` maupun `savings_goal` selama Fund tidak diarsipkan. Jika pengguna memilih Reject, tidak ada Income Transaction yang dibuat. Jadwal berikutnya tetap berjalan.

## 7.6 Confirm Expense Automation

1. Pengguna membuka kartu konfirmasi Expense.
2. UI menampilkan nominal template dan pilihan Fund sumber Active (default dari template).
3. Pengguna dapat menyesuaikan nominal untuk occurrence tersebut.
4. Pengguna memilih Confirm.
5. Automation Service memvalidasi occurrence, nominal, dan Fund sumber. Fund sumber wajib berklasifikasi `active` dan tidak diarsipkan.
6. Transaction Service memproses Expense menggunakan nominal yang dikonfirmasi dan memeriksa saldo Fund sumber; jika tidak mencukupi, konfirmasi ditolak dan occurrence tetap pending.
7. Setelah berhasil, occurrence ditandai confirmed dan Notification terkait dihapus.

Perubahan nominal pada konfirmasi hanya berlaku untuk occurrence tersebut. Nominal template tetap menjadi acuan periode berikutnya kecuali pengguna mengubah template secara terpisah.

Jika pengguna memilih Reject, tidak ada Expense Transaction yang dibuat dan jadwal berikutnya tetap berjalan.

## 7.7 Idempotency and Concurrency

Konfirmasi occurrence harus idempotent. Pengiriman permintaan Confirm berulang untuk occurrence yang sama tidak boleh membuat lebih dari satu transaksi.

Pemeriksaan status occurrence dan pencatatan transaksi harus dilindungi oleh operasi backend yang konsisten. Validasi di client tidak cukup untuk mencegah permintaan ganda atau konflik dari beberapa request. Strategi penguncian dijelaskan pada Bagian 9.5.

## 7.8 Automation Deletion

Ketika Automation dihapus:

- Template Pocket Item dan seluruh occurrence terkait dihapus.
- Notification terkait dihapus.
- Transaksi aktual yang sudah berhasil dibuat tetap dipertahankan; transaksi tersebut dilepas dari Pocket Item dan diberi Category Other Income (Income) atau Other (Expense).
- Penghapusan occurrence tidak boleh menghapus transaksi aktual yang pernah dihasilkannya.

# 8. Data Access and Backend Interaction

## 8.1 Repository Responsibilities

Repository dikelompokkan berdasarkan domain data, misalnya:

- Transaction Repository.
- Fund Repository.
- Pocket Repository.
- Automation Repository.
- Notification Repository.
- Category Repository.
- Dashboard data access.

Repository bertugas melakukan query atau memanggil RPC. Repository tidak boleh memuat aturan bisnis kompleks yang seharusnya menjadi tanggung jawab AppServices atau backend.

## 8.2 Direct Query and RPC Usage

Query repository dapat digunakan untuk membaca data yang tidak memerlukan perubahan finansial atomik.

Database Function / RPC digunakan untuk operasi yang membutuhkan validasi backend dan atomicity, terutama:

- Create, update, dan delete transaksi.
- Create transaksi melalui Pocket.
- Konfirmasi Automation yang menghasilkan transaksi.
- Operasi yang membutuhkan pemeriksaan saldo dan pencegahan saldo negatif.
- Operasi Fund atau Pocket yang memiliki aturan relasi dan penghapusan khusus.

Daftar ini menjelaskan tanggung jawab teknis. Nama fungsi, parameter, return type, dan detail implementasi ditetapkan pada `backend-contract.md` dan tetap mengikuti `database.md`.

## 8.3 Data Ownership and Access Control

- Setiap data milik pengguna harus memiliki batas kepemilikan yang jelas.
- Supabase Auth menyediakan identitas pengguna.
- Masuk dan pengelolaan sesi menggunakan Supabase Auth melalui Data Access Layer (`src/data/supabase`); Presentation Layer tidak mengimpor Supabase Client. MVP tidak menyediakan layar penghapusan akun; penghapusan akun dilakukan di sisi backend.
- PostgreSQL RLS membatasi akses hanya ke data milik pengguna yang sedang terautentikasi.
- Operasi RPC harus memvalidasi kepemilikan data yang digunakan.
- Client tidak boleh dipercaya sebagai satu-satunya sumber identitas atau otorisasi.
- Penghapusan akun pengguna mengikuti aturan cascade data milik pengguna yang ditetapkan pada `database.md`.

## 8.4 Error Handling

Error backend diterjemahkan melalui Repository dan AppServices menjadi hasil yang konsisten untuk UI.

Kondisi yang perlu ditangani antara lain:

- Amount tidak valid.
- Saldo Fund tidak mencukupi.
- Fund tidak ditemukan atau bukan milik pengguna.
- Fund berstatus archived.
- Fund masih direferensikan oleh Pocket Item sehingga tidak dapat dihapus atau diarsipkan.
- Pocket tidak ditemukan, archived, atau tipe tidak sesuai.
- Transaksi tidak dapat dihapus, termasuk Income dari Automation.
- Occurrence Automation sudah diproses.
- Akses tidak diizinkan.
- Kegagalan koneksi atau operasi database.

UI menampilkan pesan yang mudah dipahami. Detail teknis dapat dipertahankan untuk kebutuhan debugging tanpa menampilkan informasi sensitif kepada pengguna.

# 9. Security and Financial Integrity

## 9.1 Atomic Financial Operations

Operasi finansial harus bersifat all-or-nothing. Jika salah satu bagian operasi gagal, seluruh perubahan dalam operasi tersebut harus dibatalkan.

Contoh Transfer mencakup pencatatan transaksi, pengurangan Fund sumber, dan penambahan Fund tujuan sebagai satu kesatuan.

## 9.2 Balance Validation

- Saldo dihitung dari Opening Balance dan transaksi aktual.
- Expense dan Transfer harus memeriksa saldo Fund sumber di backend.
- Expense hanya dapat menggunakan Fund `fund_type = 'active'` yang tidak diarsipkan.
- Operasi bersamaan tidak boleh membuat saldo menjadi negatif.
- Fund balance tidak dapat diedit langsung oleh UI atau service.
- Pocket tidak boleh membuat dampak saldo tambahan di luar transaksi aktual.

## 9.3 Authorization

RLS diterapkan pada akses data pengguna. Setiap operasi backend yang menerima ID Fund, Pocket, Transaction, atau Automation harus memeriksa bahwa data tersebut berada dalam cakupan pengguna yang terautentikasi.

## 9.4 Protected Automation Income

Larangan penghapusan Income yang berasal dari Automation harus ditegakkan oleh backend. UI dapat menyesuaikan pilihan tindakan, tetapi keamanan dan integritas aturan tidak boleh bergantung pada UI.

## 9.5 Concurrency and Locking Strategy

Strategi berikut menjadi acuan implementasi RPC dan migration, dan memenuhi `database.md` Bagian 7.5. Nama fungsi dan signature tetap ditentukan pada tahap desain kontrak backend.

1. Setiap operasi finansial berjalan dalam satu transaksi database di dalam satu fungsi RPC, menggunakan isolation level default PostgreSQL (READ COMMITTED) ditambah penguncian baris eksplisit.
2. Sebelum memeriksa atau menghitung saldo, fungsi mengunci baris `funds` yang terlibat dengan `SELECT ... FOR UPDATE`. Jika lebih dari satu Fund terlibat (Transfer, atau edit yang mengganti Fund), kunci diambil berurutan menurut `id` untuk mencegah deadlock. Saldo dihitung setelah kunci diperoleh.
3. Create, update, dan delete transaksi mengunci semua Fund yang terdampak (lama dan baru) sebelum validasi saldo, sehingga larangan saldo negatif berlaku juga pada edit dan hapus.
4. Konfirmasi atau penolakan occurrence mengunci baris `automation_occurrences` dengan `FOR UPDATE` lalu memastikan status masih `pending`. Request kedua menunggu, lalu ditolak karena status sudah berubah. Unique constraint pada `transaction_id` dan (`automation_id`, `scheduled_for`) menjadi pengaman terakhir.
5. Konversi Planned Expense dan konfirmasi Income Pocket Item mengunci baris `pocket_items` terkait dan memeriksa status (`planned` atau `pending`) sebelum membuat transaksi, serta mengunci Fund yang dipilih sesuai poin 2.
6. Pembuatan atau perubahan template Pocket Item yang mengisi `fund_id` mengunci baris Fund terkait dengan `FOR UPDATE`. Arsip dan hapus Fund juga mengunci baris Fund, lalu memeriksa referensi `pocket_items` dan transaksi, sehingga tidak terjadi race dengan referensi baru.
7. Pembuatan occurrence oleh pemeriksaan jadwal mengunci baris `automations` yang jatuh tempo sebelum membuat occurrence dan memajukan `next_run_at`, sehingga pemeriksaan bersamaan tidak membuat occurrence ganda.
8. Kunci hanya dipegang selama satu fungsi RPC. Tidak digunakan advisory lock atau layanan penguncian eksternal.

# 10. Implementation Boundaries

Hal-hal berikut berada di luar keputusan SDD ini dan tidak boleh diasumsikan sebagai keputusan final:

- Detail implementasi internal query dan optimasi database.
- Versi dependency yang belum diverifikasi dari konfigurasi proyek.
- Penambahan layanan scheduler pihak ketiga.
- Fitur di luar cakupan MVP pada `prd.md`.
- Perubahan struktur database yang belum disetujui.

Perubahan arsitektur, dependency utama, atau business rules harus dibahas dan disetujui sebelum implementasi.

# 11. Document References

| Document | Responsibility |
|---|---|
| `context.md` | Konteks proyek, stack, struktur umum, konvensi, dan batasan |
| `prd.md` | Kebutuhan produk, fitur, alur pengguna, business rules, dan acceptance criteria |
| `database.md` | Struktur database, kolom, tipe data, relasi, constraint, index, dan seed data |
| `sdd.md` | Arsitektur aplikasi, tanggung jawab layer/modul, dan alur teknis |
| `testing.md` | Skenario pengujian dan hasil yang diharapkan |
| `backend-contract.md` | Kontrak RPC, kode error, return shape, dan aturan locking backend |

---

**Document Status:** Draft untuk direview.  
Dokumen ini menjadi acuan desain teknis setelah direview dan disetujui. Penyusunan SDD tidak berarti SQL migration atau perubahan database telah dibuat maupun dijalankan.
