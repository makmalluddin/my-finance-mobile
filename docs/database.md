# Database Design

## 1. Database Overview

Database ini dirancang untuk mendukung MVP Personal Finance Tracking menggunakan PostgreSQL pada platform Supabase. Model data memisahkan saldo aktual pada Fund, transaksi keuangan, pengelompokan aktivitas melalui Pocket, serta jadwal Automation dan konfirmasi occurrence.

Dokumen ini menjadi sumber utama definisi tabel, kolom, tipe data, constraint, relasi, indexing, aturan database, keamanan data, dan seed data. Detail arsitektur aplikasi dan tanggung jawab service berada di `sdd.md`.

### 1.1 Design Principles

1. Saldo Fund merupakan hasil perhitungan Opening Balance dan transaksi aktual, bukan nilai yang diubah langsung oleh UI.
2. Pocket merupakan wadah pengelompokan dan tidak menyimpan saldo.
3. Planned Expense merupakan alokasi yang dihitung untuk Active Balance, bukan transaksi aktual.
4. Transaksi aktual menjadi sumber perubahan saldo Fund.
5. Seluruh nilai uang menggunakan satuan IDR dan tipe numerik presisi tetap.
6. Operasi keuangan yang saling bergantung harus dijalankan secara atomik.
7. Relasi transaksi dengan Pocket Item dan Automation Occurrence harus menjaga asal transaksi serta mencegah pemrosesan occurrence lebih dari satu kali.
8. Data pengguna harus terisolasi menggunakan identitas Supabase Auth dan Row Level Security (RLS).

### 1.2 Naming and Data Conventions

- Nama tabel, kolom, index, constraint, dan function menggunakan `snake_case`.
- Tabel menggunakan nama jamak.
- Primary key menggunakan UUID.
- Timestamp disimpan dalam `timestamptz` dan dinormalisasi oleh PostgreSQL.
- Tanggal jadwal berulang menggunakan `date` atau representasi tanggal/waktu lokal sesuai kebutuhan proses penjadwalan.
- Nominal uang menggunakan `numeric(14,2)`.
- Semua tabel milik pengguna memiliki `user_id` yang mereferensikan `auth.users(id)`.
- Foreign key yang menghubungkan data milik pengguna harus disertai validasi kepemilikan agar data lintas pengguna tidak dapat saling direferensikan.

## 2. Entity Relationship Overview

Entitas utama:

- `funds`: sumber atau tempat penyimpanan uang.
- `categories`: kategori sistem untuk Income dan Expense.
- `transactions`: catatan keuangan aktual.
- `pockets`: wadah pengelompokan aktivitas.
- `pocket_items`: item yang dikelompokkan di dalam Pocket.
- `automations`: konfigurasi jadwal berulang untuk Pocket Item.
- `automation_occurrences`: kejadian jadwal yang perlu diproses untuk suatu periode.
- `notifications`: kartu konfirmasi yang ditampilkan untuk occurrence yang masih menunggu tindakan.

Relasi konseptual:

```text
auth.users
  ├── funds
  ├── transactions
  ├── pockets
  │     └── pocket_items
  │            └── automations
  │                   └── automation_occurrences
  │                          └── notifications
  ├── categories
  └── automation_occurrences

funds ─────────────── transactions (source / destination)
funds ─────────────── pocket_items (fund reference)
categories ───────── transactions
pocket_items ──────── transactions (provenance)
automation_occurrences ─ transactions (generated transaction)
```

Relasi aktual dan batasan setiap tabel dijelaskan pada bagian berikut.

## 3. Table Definitions

### 3.1 `funds`

Menyimpan sumber atau tempat penyimpanan uang milik pengguna.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Fund |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik Fund |
| `name` | `text` | Not null | Nama Fund |
| `opening_balance` | `numeric(14,2)` | Not null, default `0`, CHECK `>= 0` | Saldo awal saat Fund dibuat |
| `fund_type` | `text` | Not null, CHECK in (`active`, `savings_goal`) | Klasifikasi Fund |
| `is_archived` | `boolean` | Not null, default `false` | Status arsip Fund |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pembuatan |
| `updated_at` | `timestamptz` | Not null, default `now()` | Waktu perubahan terakhir |

**Rules:**
- `opening_balance` ditetapkan saat insert dan tidak boleh diubah setelahnya.
- Opening Balance tidak dibuat sebagai baris pada `transactions`.
- Saldo aktual dihitung dari `opening_balance` ditambah dampak transaksi aktual.
- `fund_type` dapat berubah antara `active` dan `savings_goal`.
- Fund yang diarsipkan tidak dapat digunakan pada transaksi baru.
- Fund tidak dapat dihapus atau diarsipkan selama masih direferensikan oleh `pocket_items`.
- Fund dengan transaksi tidak dapat dihapus.
- Fund dengan saldo aktual bukan nol tidak dapat diarsipkan.
- Penghapusan Fund yang diperbolehkan menghapus record Fund beserta Opening Balance-nya.

**Saldo aktual:**

```text
fund_balance =
  opening_balance
  + total_income
  - total_expense
  + total_transfer_in
  - total_transfer_out
```

Saldo dihitung langsung dari Opening Balance dan transaksi aktual. Tidak ada kolom cached balance.

Fund tidak memiliki kolom deskripsi.

### 3.2 `categories`

Menyimpan kategori sistem untuk transaksi Income dan Expense tanpa Pocket.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Category |
| `type` | `text` | Not null, CHECK in (`income`, `expense`) | Jenis transaksi yang menggunakan Category |
| `name` | `text` | Not null | Nama Category |
| `sort_order` | `smallint` | Not null | Urutan tampilan |
| `is_active` | `boolean` | Not null, default `true` | Status penggunaan Category |

Constraint:
- Unique (`type`, `name`).
- Category merupakan data sistem, bukan data yang dibuat pengguna.
- Kategori yang sudah digunakan tidak boleh dihapus sehingga riwayat transaksi tetap valid.

**Seed data:**

| Type | Name | Sort Order |
|---|---|---:|
| `income` | Salary | 1 |
| `income` | Freelance | 2 |
| `income` | Bonus | 3 |
| `income` | Other Income | 4 |
| `expense` | Food | 1 |
| `expense` | Transportation | 2 |
| `expense` | Bills | 3 |
| `expense` | Shopping | 4 |
| `expense` | Entertainment | 5 |
| `expense` | Other | 6 |

### 3.3 `pockets`

Menyimpan wadah pengelompokan aktivitas keuangan.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Pocket |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik Pocket |
| `name` | `text` | Not null | Nama Pocket |
| `description` | `text` | Nullable | Deskripsi opsional Pocket |
| `type` | `text` | Not null, CHECK in (`income`, `expense`, `transfer`) | Tipe Pocket |
| `is_archived` | `boolean` | Not null, default `false` | Status arsip Pocket |
| `has_ever_had_item` | `boolean` | Not null, default `false` | Penanda bahwa Pocket pernah memiliki item |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pembuatan |
| `updated_at` | `timestamptz` | Not null, default `now()` | Waktu perubahan terakhir |

**Rules:**
- Pocket dibuat tanpa item dan tidak memiliki saldo.
- `type` hanya dapat diubah ketika `has_ever_had_item = false`.
- `has_ever_had_item` berubah menjadi `true` ketika item pertama kali ditambahkan dan tidak boleh kembali menjadi `false`.
- Pocket dapat diarsipkan dan diaktifkan kembali.
- Penghapusan Pocket bersifat permanen.
- Penghapusan Pocket tidak menghapus transaksi aktual.
- Penghapusan Pocket menghapus seluruh `pocket_items` yang dimilikinya beserta data konfigurasi/occurrence Automation yang masih terkait, sesuai aturan retensi pada bagian relasi dan penghapusan.

`description` bersifat opsional dan boleh bernilai NULL atau kosong.

### 3.4 `pocket_items`

Menyimpan item yang berada di dalam Pocket.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Pocket Item |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik item |
| `pocket_id` | `uuid` | Not null, FK → `pockets.id` | Pocket pemilik item |
| `name` | `text` | Not null | Nama item |
| `amount` | `numeric(14,2)` | Not null, CHECK `> 0` | Nominal item |
| `fund_id` | `uuid` | Nullable, FK → `funds.id` | Fund default untuk template Automation (tujuan Income / sumber Expense); NULL untuk item lain |
| `status` | `text` | Not null | Status item sesuai tipe Pocket |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pembuatan |
| `updated_at` | `timestamptz` | Not null, default `now()` | Waktu perubahan terakhir |

**Status berdasarkan tipe Pocket:**

| Pocket Type | Status | Meaning |
|---|---|---|
| Income tanpa Automation | `pending`, `confirmed` | Pemasukan menunggu konfirmasi atau sudah dicatat |
| Income dengan Automation | `template` | Template pemasukan berulang |
| Expense tanpa Automation | `planned`, `converted` | Rencana pengeluaran atau sudah menjadi transaksi aktual |
| Expense dengan Automation | `template` | Template pengeluaran berulang |
| Transfer | `completed` | Transfer aktual telah dibuat |

**Rules:**
- `pocket_id` dan `user_id` harus merujuk Pocket milik pengguna yang sama.
- `fund_id`, jika diisi, harus merujuk Fund milik pengguna yang sama.
- Referensi Fund pada Pocket Item tidak boleh otomatis menjadi `NULL` akibat penghapusan Fund. Penghapusan dan pengarsipan Fund harus ditolak selama referensi masih ada.
- `status` yang valid bergantung pada `pockets.type`.
- Pocket Item Expense tanpa Automation berstatus `planned` dihitung sebagai outstanding Expense allocation.
- Pocket Item Expense tanpa Automation berstatus `converted` tidak lagi dihitung sebagai allocation.
- Pocket Item Expense dengan Automation menggunakan status `template`; nominal template tidak dihitung sebagai outstanding Expense allocation.
- Pocket Item Income berstatus `pending` belum menghasilkan dampak saldo.
- Pocket Item Income berstatus `template` dapat memiliki beberapa Automation Occurrence dan transaksi aktual.
- Pocket Item Transfer berstatus `completed` merepresentasikan Transfer yang sudah terjadi.
- Transfer Pocket Item dihapus bersama transaksi aktualnya ketika transaksi Transfer tersebut dihapus.
- Satu item hanya dapat berada di satu Pocket.
- `fund_id` hanya dapat diisi untuk Pocket Item berstatus `template`. Item non-template dan item Transfer memiliki `fund_id` NULL; Fund Transfer tersimpan pada `transactions`. Fund dipilih saat konfirmasi atau konversi.
- Pocket Item `template` dibuat bersamaan dengan Automation-nya. Item yang sudah ada tidak dapat diubah menjadi `template`, dan item `template` tidak dapat diubah menjadi non-template.
- Pocket Item Income berstatus `pending` dapat dihapus tanpa dampak saldo. Pocket Item Income berstatus `confirmed` tidak dapat dihapus langsung; transaksi Income-nya dihapus melalui Pocket sehingga item kembali `pending`.

### 3.5 `transactions`

Menyimpan seluruh transaksi aktual Income, Expense, dan Transfer.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas transaksi |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik transaksi |
| `type` | `text` | Not null, CHECK in (`income`, `expense`, `transfer`) | Jenis transaksi |
| `amount` | `numeric(14,2)` | Not null, CHECK `> 0` | Nominal transaksi |
| `occurred_at` | `timestamptz` | Not null | Waktu/tanggal transaksi |
| `source_fund_id` | `uuid` | Nullable, FK → `funds.id` | Fund sumber untuk Expense/Transfer |
| `destination_fund_id` | `uuid` | Nullable, FK → `funds.id` | Fund tujuan untuk Income/Transfer |
| `category_id` | `uuid` | Nullable, FK → `categories.id` | Category transaksi |
| `pocket_item_id` | `uuid` | Nullable, FK → `pocket_items.id` | Asal Pocket Item jika transaksi berasal dari Pocket |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pencatatan |
| `updated_at` | `timestamptz` | Not null, default `now()` | Waktu perubahan terakhir |

**Combination rules:**

| Transaction Type | `source_fund_id` | `destination_fund_id` | `category_id` |
|---|---|---|---|
| Income | NULL | Required | Required jika tanpa Pocket; NULL jika dari Pocket |
| Expense | Required | NULL | Required jika tanpa Pocket; NULL jika dari Pocket |
| Transfer | Required | Required | NULL |

**Additional constraints:**
- Transfer harus memiliki Fund sumber dan tujuan yang berbeda.
- Income harus memiliki destination Fund.
- Expense harus memiliki source Fund.
- Fund sumber Expense wajib berklasifikasi `active` dan tidak diarsipkan. Fund `savings_goal` tidak dapat menjadi sumber Expense.
- Fund yang digunakan harus dimiliki pengguna yang sama dan tidak diarsipkan.
- Category harus sesuai dengan `transactions.type`.
- `occurred_at` merepresentasikan tanggal kalender lokal dan disimpan pada pukul 12.00 waktu lokal perangkat dalam bentuk `timestamptz`.
- Transaksi yang memiliki `pocket_item_id` harus sesuai dengan tipe Pocket dan aturan status Pocket Item.
- Transaksi yang berasal dari Income Automation tidak dapat dihapus oleh pengguna. Proteksi ini bergantung pada hubungan transaksi dengan occurrence Income Automation berstatus `confirmed`; setelah Automation atau Pocket dihapus, hubungan ini hilang dan transaksi menjadi transaksi biasa.
- Penghapusan transaksi biasa harus membalik dampak ke saldo Fund.
- Penghapusan Transfer dari Transfer Pocket juga menghapus Pocket Item terkait.
- Satu Pocket Item non-Automation hanya dapat menghasilkan satu transaksi aktual.
- Pocket Item Automation dapat menghasilkan beberapa transaksi aktual melalui occurrence yang berbeda.

**Relationship note:** `transactions.pocket_item_id` menyimpan hubungan langsung transaksi dengan Pocket Item sebagai asal transaksi. Untuk transaksi Automation, hubungan langsung ini menunjuk template Pocket Item yang sama; `automation_occurrences.transaction_id` membedakan transaksi yang dihasilkan oleh setiap occurrence. Karena itu, satu Pocket Item Automation dapat berhubungan dengan banyak transaksi aktual melalui occurrence.

**Important:** penghapusan Pocket harus menghapus relasi `pocket_item_id` pada transaksi aktual (menjadikannya `NULL`) sebelum Pocket Item dihapus. Transaksi aktual harus tetap ada dan dampak saldonya tidak berubah. Pada langkah yang sama, `category_id` transaksi Income diisi Category `Other Income` dan transaksi Expense diisi Category `Other` agar memenuhi aturan Category untuk transaksi tanpa Pocket; transaksi Transfer tetap tanpa Category. Hal yang sama berlaku ketika Pocket Item template dilepas akibat penghapusan Automation.

### 3.6 `automations`

Menyimpan konfigurasi pengulangan untuk Income atau Expense Pocket Item.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Automation |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik Automation |
| `pocket_item_id` | `uuid` | Not null, FK → `pocket_items.id` | Pocket Item template |
| `frequency` | `text` | Not null, CHECK in (`weekly`, `every_two_weeks`, `monthly`) | Frekuensi pengulangan |
| `start_date` | `date` | Not null | Tanggal awal jadwal |
| `next_run_at` | `timestamptz` | Not null | Waktu occurrence berikutnya yang perlu diproses |
| `timezone` | `text` | Not null | Identifier zona waktu saat Automation dibuat |
| `is_active` | `boolean` | Not null, default `true` | Status Automation |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pembuatan |
| `updated_at` | `timestamptz` | Not null, default `now()` | Waktu perubahan terakhir |

**Rules:**
- Satu Pocket Item hanya memiliki satu konfigurasi Automation aktif.
- Automation hanya berlaku untuk Pocket Item bertipe Income atau Expense.
- `pocket_item_id` harus menunjuk Pocket Item milik pengguna yang sama.
- Pocket Item yang menjadi template Automation harus memiliki status `template`, baik untuk Income maupun Expense.
- Pocket Item Expense berstatus `template` tidak dihitung sebagai outstanding Expense allocation.
- Zona waktu disimpan sebagai identifier zona waktu IANA, misalnya `Asia/Jakarta`.
- Zona waktu tidak berubah otomatis ketika zona waktu perangkat berubah.
- Mengubah `start_date` harus menghitung ulang jadwal berikutnya.
- Monthly recurrence yang tanggalnya tidak tersedia pada suatu bulan menggunakan hari terakhir bulan tersebut.
- Automation dibuat bersamaan dengan Pocket Item template-nya; Automation tidak dapat ditambahkan ke Pocket Item yang sudah ada.
- Menghapus Automation menghapus Pocket Item template-nya beserta seluruh occurrence (pending maupun confirmed) dan Notification terkait.
- Menghapus Automation tidak menghapus transaksi aktual yang sudah terbentuk; transaksi tersebut dilepas dari Pocket Item (`pocket_item_id` menjadi `NULL`) dan mengikuti aturan transaksi tanpa Pocket pada Bagian 3.5.
- Fund default pada template Expense Automation wajib berklasifikasi `active` dan tidak diarsipkan. Fund default pada template Income Automation boleh berklasifikasi `active` atau `savings_goal` selama tidak diarsipkan.

### 3.7 `automation_occurrences`

Menyimpan setiap kejadian jadwal Automation yang harus diproses secara terpisah.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas occurrence |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik occurrence |
| `automation_id` | `uuid` | Nullable, FK → `automations.id` | Automation sumber |
| `pocket_item_id` | `uuid` | Not null, FK → `pocket_items.id` | Template Pocket Item |
| `scheduled_for` | `timestamptz` | Not null | Waktu jadwal occurrence |
| `status` | `text` | Not null, CHECK in (`pending`, `confirmed`, `rejected`) | Status pemrosesan |
| `confirmed_amount` | `numeric(14,2)` | Nullable, CHECK `> 0` | Nominal final untuk occurrence yang dikonfirmasi |
| `transaction_id` | `uuid` | Nullable, FK → `transactions.id` | Transaksi yang dihasilkan |
| `processed_at` | `timestamptz` | Nullable | Waktu confirm/reject berhasil |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu pembuatan occurrence |

**Constraints and rules:**
- Unique (`automation_id`, `scheduled_for`) untuk mencegah occurrence ganda pada jadwal yang sama.
- `transaction_id` harus unique ketika tidak NULL, sehingga satu transaksi tidak dipakai oleh beberapa occurrence.
- Status `pending` harus memiliki `transaction_id = NULL` dan `processed_at = NULL`.
- Status `confirmed` harus memiliki `transaction_id` dan `processed_at`.
- Status `rejected` harus memiliki `transaction_id = NULL` dan `processed_at`.
- Satu occurrence hanya dapat diproses satu kali.
- Confirm harus membuat transaksi dan memperbarui status occurrence dalam satu transaksi database.
- Reject memperbarui status occurrence tanpa membuat transaksi.
- Untuk Expense Automation, `confirmed_amount` menyimpan nominal yang disetujui pengguna pada occurrence tersebut. Fund sumber dipilih saat konfirmasi.
- Untuk Income Automation, `confirmed_amount` selalu sama dengan nominal template dan tidak dapat disesuaikan saat konfirmasi. Fund tujuan dipilih saat konfirmasi.
- Seluruh occurrence dihapus ketika Automation atau template Pocket Item-nya dihapus.
- Occurrence yang sudah confirmed tidak boleh menyebabkan transaksi aktual terhapus ketika Automation dihapus.
- Jika transaksi Expense yang berasal dari occurrence Automation dihapus oleh pengguna, occurrence terkait ikut dihapus agar status `confirmed` tidak menyimpan `transaction_id` NULL. Item template tetap berstatus `template`.
- Occurrence bukan audit trail permanen.
- Penghapusan Automation menghapus template Pocket Item beserta seluruh occurrence-nya; penghapusan Pocket menghapus seluruh item dan occurrence terkait. Transaksi aktual tetap dipertahankan dan dilepas dari Pocket Item (`pocket_item_id` menjadi `NULL`).

Occurrence merupakan data operasional, bukan audit trail permanen. Ketika Automation atau Pocket dihapus, occurrence terkait ikut dihapus. Transaksi aktual yang sudah terbentuk tetap dipertahankan dan dilepas dari Pocket Item.

### 3.8 `notifications`

Menyimpan persistent confirmation card untuk Automation Occurrence yang menunggu tindakan pengguna.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` | Identitas Notification |
| `user_id` | `uuid` | Not null, FK → `auth.users.id` | Pemilik Notification |
| `occurrence_id` | `uuid` | Not null, FK → `automation_occurrences.id` | Occurrence yang perlu dikonfirmasi |
| `created_at` | `timestamptz` | Not null, default `now()` | Waktu Notification dibuat |

**Constraints and rules:**
- Unique (`occurrence_id`), sehingga satu occurrence memiliki paling banyak satu Notification.
- Notification hanya dibuat untuk occurrence berstatus `pending`.
- Notification tetap tersedia sampai pengguna memilih Confirm atau Reject.
- Notification tidak memiliki `expires_at` dan tidak kedaluwarsa otomatis.
- Tidak ada mekanisme pengingat berkala setiap 12 jam.
- Notification dihapus setelah Confirm atau Reject berhasil diproses.
- Menghapus Automation menghapus Notification untuk occurrence yang masih pending.
- `user_id` harus sama dengan pemilik occurrence terkait.

## 4. Relationships and Referential Integrity

### 4.1 Relationship Summary

| Parent | Child | Cardinality | Referential Rule |
|---|---|---|---|
| `auth.users` | `funds` | 1:N | Cascade delete |
| `auth.users` | `transactions` | 1:N | Cascade delete |
| `auth.users` | `pockets` | 1:N | Cascade delete |
| `pockets` | `pocket_items` | 1:N | Pocket deletion removes its items |
| `funds` | `transactions` | 1:N | Restrict deletion while referenced |
| `funds` | `pocket_items` | 1:N | Restrict deletion and archive while referenced |
| `categories` | `transactions` | 1:N | Restrict deletion |
| `pocket_items` | `transactions` | 1:N | One for ordinary item; multiple for Automation template |
| `pocket_items` | `automations` | 1:0..1 active | One active configuration per item |
| `automations` | `automation_occurrences` | 1:N | All occurrences removed when Automation (and its template item) is deleted |
| `automation_occurrences` | `notifications` | 1:0..1 | Notification exists while pending |
| `automation_occurrences` | `transactions` | 1:0..1 | One occurrence creates at most one transaction |

### 4.2 User Deletion

Penghapusan user menghapus seluruh data milik user melalui `ON DELETE CASCADE`. Penghapusan Pocket atau Automation tetap mengikuti aturan khusus agar transaksi aktual yang telah terbentuk tidak ikut terhapus.

### 4.3 Cross-User Referential Integrity

Foreign keys alone do not guarantee that related records belong to the same user. Database operations must validate ownership for:
- Transaction and its source/destination Funds.
- Transaction and its Category.
- Transaction and its Pocket Item.
- Pocket Item and its Pocket/Fund.
- Automation and its Pocket Item.
- Occurrence and its Automation/Pocket Item.
- Notification and its Occurrence.

Use composite unique keys and composite foreign keys where appropriate, or database functions/triggers that enforce equivalent ownership checks.

### 4.4 Delete Behavior

| Entity Deleted | Required Behavior |
|---|---|
| Fund | Reject if it has any transaction reference or Pocket Item reference; otherwise delete Fund and its Opening Balance |
| Pocket | Delete Pocket Items and Automation data; detach surviving actual transactions from Pocket Items and assign `Other Income` / `Other` Category to detached Income / Expense; preserve actual transactions and their financial impact |
| Planned Expense Pocket Item | Delete item and release allocation; do not change Fund balance |
| Ordinary Income Pocket Item | Pending item may be deleted with no balance impact; confirmed item cannot be deleted directly (delete its Income Transaction via Pocket, item returns to pending); preserve actual transaction if Pocket is deleted |
| Transfer Pocket Item | Delete corresponding Transfer Transaction and reverse both Fund impacts when the user deletes that transaction |
| Automation | Delete template Pocket Item, all occurrences and Notifications; detach and preserve actual transactions already generated (Category assigned as for Pocket deletion) |
| Category | Restrict deletion when referenced by transactions |
| Ordinary Transaction | Reverse financial impact and apply the corresponding Pocket Item lifecycle rule |
| Expense Automation Transaction | Deleting the transaction also deletes its related occurrence; the template Pocket Item remains `template` |
| Automation-generated Income Transaction | Reject user deletion while still linked to its confirmed occurrence; after Automation or Pocket deletion it is an ordinary transaction |

**Important distinction:** deleting a Pocket is not the same as deleting its actual transactions. Deleting a Pocket detaches actual transactions from Pocket Item provenance; deleting an ordinary transaction reverses its financial effect. Transfer Pocket transaction deletion is the explicitly agreed exception that also removes its corresponding Pocket Item.

## 5. Database Constraints and Validation

### 5.1 Amount and Transaction Shape

- All transaction and item amounts must be greater than zero.
- Fund Opening Balance must be greater than or equal to zero.
- Income requires `destination_fund_id` and forbids `source_fund_id`.
- Expense requires `source_fund_id` and forbids `destination_fund_id`.
- Expense source Fund must have `fund_type = 'active'` and must not be archived.
- Transfer requires both Fund references and requires them to be different.
- Category is required for standalone Income and Expense. Income and Expense detached from a deleted Pocket or Automation receive `Other Income` / `Other` (see Section 3.5).
- Category is forbidden for Transfer and Pocket-linked transactions.
- Category type must match transaction type.

### 5.2 Fund Rules

- Opening Balance is immutable after Fund creation.
- Archived Fund cannot be used in a new transaction.
- Fund referenced by any Pocket Item cannot be deleted or archived.
- Fund with transaction history cannot be deleted.
- Fund with non-zero actual balance cannot be archived.
- Fund classification can change without changing its actual balance.
- Fund with `fund_type = 'savings_goal'` cannot be the source of an Expense.

### 5.3 Pocket Rules

- Pocket type must be one of `income`, `expense`, or `transfer`.
- Pocket type cannot change after `has_ever_had_item` becomes true.
- `has_ever_had_item` is monotonic: once true, it remains true.
- Pocket Item status must be valid for its Pocket type.
- One Pocket Item belongs to exactly one Pocket.
- Pocket is not a balance-holding entity.

### 5.4 Expense Allocation

Outstanding Expense allocation is calculated from Pocket Items where:
- Parent Pocket type is `expense`.
- Pocket Item status is `planned`.

```text
outstanding_expense_allocation =
  SUM(pocket_items.amount)
  WHERE pocket.type = 'expense'
    AND pocket_items.status = 'planned'
```

The Active Balance is:

```text
active_balance =
  SUM(balance of funds where fund_type = 'active')
  - outstanding_expense_allocation
```

A successful conversion from Planned Expense to actual Expense must atomically:
1. Validate the Pocket Item is still `planned`.
2. Validate the selected source Fund has `fund_type = 'active'`, is not archived, and belongs to the user.
3. Validate source Fund balance is sufficient.
4. Create the Expense Transaction using the item amount.
5. Change Pocket Item status to `converted`.

The resulting Active Balance remains unchanged by the conversion itself when the same amount is used and the source Fund is an Active Fund.

### 5.5 Automation Rules

- Automation is allowed only for Income and Expense Pocket Items.
- Supported frequency values: `weekly`, `every_two_weeks`, `monthly`.
- Monthly dates that do not exist in a month resolve to the last calendar day of that month.
- Start date changes require recalculation of the next schedule.
- Each occurrence is unique for its Automation and scheduled time.
- An occurrence can be confirmed or rejected only once.
- Confirmation and transaction creation must be atomic.
- Repeated requests for the same occurrence must not create duplicate transactions.
- A pending Notification remains until confirmation or rejection.
- Notification has no expiry and no periodic 12-hour reminder.
- Automation is created together with its template Pocket Item and cannot be added to an existing item.
- Confirming an Expense occurrence requires the user to select a source Fund and validates sufficient balance; confirming an Income occurrence requires a destination Fund and uses the template amount.
- Deleting Automation removes its template Pocket Item, all occurrences, and Notifications but preserves actual transactions (detached from the Pocket Item).

### 5.6 Transaction Deletion Lifecycle

Deleting a transaction must validate its origin and apply the corresponding Pocket Item behavior:

| Transaction Origin | Required Pocket Item Behavior |
|---|---|
| Standalone transaction | No Pocket Item |
| Ordinary Income Pocket | Return item to pending state, if item still exists |
| Expense Pocket conversion | Return item to planned state, if item still exists |
| Transfer Pocket | Delete corresponding Pocket Item |
| Income Automation | User deletion prohibited while linked to its confirmed occurrence |

For Automation-generated transactions, `automation_occurrences.transaction_id` identifies the corresponding occurrence. User deletion of an Automation-generated Income Transaction must be rejected. Income Transaction yang berasal dari Automation dapat diedit sesuai aturan pengeditan transaksi Income biasa. Pengeditan harus tetap menjaga konsistensi saldo Fund dan tidak boleh menghilangkan identitas asal transaksi dari Automation.

Aturan pengubahan dan penghapusan transaksi:
- Pengubahan Expense wajib mempertahankan Fund sumber berklasifikasi `active` dan tidak diarsipkan.
- Pengubahan atau penghapusan transaksi ditolak jika menyebabkan saldo Fund mana pun menjadi negatif.
- Jenis transaksi tidak dapat diubah. Field yang dapat diubah adalah `amount`, `occurred_at`, Fund, dan `category_id` (hanya untuk transaksi tanpa Pocket); semua validasi pembuatan transaksi tetap berlaku.
- `amount` transaksi hasil konversi Planned Expense tidak dapat diubah.
- Perubahan `amount` pada transaksi Income Pocket tanpa Automation dan Transfer Pocket memperbarui `pocket_items.amount` terkait dalam operasi yang sama. Perubahan pada transaksi hasil Automation, baik Income maupun Expense, tidak mengubah template.
- Transaksi yang masih terhubung dengan Pocket diubah atau dihapus melalui halaman Pocket.

## 6. Indexing Strategy

Indexes should support the main query patterns while avoiding redundant indexes already provided by primary keys and unique constraints.

| Table | Index | Purpose |
|---|---|---|
| `funds` | (`user_id`, `is_archived`, `fund_type`) | Load active and archived Fund lists by user |
| `transactions` | (`user_id`, `occurred_at` DESC) | Transaction History newest-first |
| `transactions` | (`user_id`, `type`, `occurred_at` DESC) | Filter History by transaction type and date |
| `transactions` | (`source_fund_id`, `occurred_at` DESC) | Find transactions affecting source Fund |
| `transactions` | (`destination_fund_id`, `occurred_at` DESC) | Find transactions affecting destination Fund |
| `transactions` | (`pocket_item_id`) WHERE not NULL | Find transactions originating from Pocket Item |
| `pocket_items` | (`pocket_id`, `status`) | Load Pocket Items and calculate outstanding allocation |
| `pocket_items` | (`fund_id`) WHERE not NULL | Check Fund references before archive/delete |
| `automations` | (`is_active`, `next_run_at`) | Find due Automation schedules |
| `automation_occurrences` | (`user_id`, `status`, `scheduled_for`) | Load pending occurrences |
| `automation_occurrences` | (`automation_id`, `scheduled_for`) UNIQUE | Prevent duplicate scheduled occurrence |
| `notifications` | (`user_id`, `created_at` DESC) | Load persistent Notification cards |

Additional indexing:
- Foreign key columns used in joins or deletion checks should be reviewed for indexes.
- Avoid adding indexes that duplicate the leading columns and ordering of an existing index without a measured query need.
- Index effectiveness should be reviewed with representative query plans after implementation.

## 7. Database Functions and Triggers

The following database operations are required. Exact function signatures and implementation are part of the technical design and migration phase, not this specification.

### 7.1 Fund Operations

- Create Fund with Opening Balance.
- Update Fund metadata and classification.
- Archive/reactivate Fund after validating Pocket Item references and balance.
- Delete Fund only when no transaction or Pocket Item references exist.
- Reject updates to Opening Balance after creation.
- Calculate Fund balance from Opening Balance and transactions.

### 7.2 Transaction Operations

- Create Income.
- Create Expense with sufficient-balance validation.
- Create Transfer with source/destination validation and sufficient-balance validation.
- Update an existing transaction while preserving financial consistency. Reject changes that would make any Fund balance negative.
- Delete an eligible transaction and reverse its financial impact.
- Allow updates to Income Automation-generated transactions while preserving their Automation origin and financial consistency.
- Enforce the prohibition on deleting Income Automation-generated transactions.
- Apply Pocket Item lifecycle behavior when a linked transaction is deleted.

### 7.3 Pocket Operations

- Create Pocket.
- Update Pocket metadata and archive state.
- Change Pocket type only before the first item is added.
- Set `has_ever_had_item` when the first Pocket Item is inserted.
- Create, update, and delete Pocket Item.
- Calculate outstanding Expense allocation.
- Delete Pocket while detaching actual transactions and deleting associated planning data. and assigning the fallback Category (`Other Income` / `Other`).

### 7.4 Automation Operations

- Create Automation together with its template Pocket Item; update Automation; delete Automation together with its template Pocket Item.
- Determine due schedules.
- Create one occurrence per due period.
- Create one persistent Notification per pending occurrence.
- Confirm or reject occurrence.
- Create the resulting transaction and update occurrence state atomically.
- Remove the template Pocket Item, all occurrences, and Notifications when Automation is deleted.

### 7.5 Integrity and Concurrency

Database functions and triggers must ensure:
- Two concurrent Expense/Transfer operations cannot spend the same available balance.
- Two concurrent confirmations cannot create duplicate transactions for one occurrence.
- A Pocket Item cannot be converted or confirmed more than once.
- Fund archive/delete checks cannot race with insertion of a new Pocket Item reference.
- Transaction edits/deletions preserve correct balances and Pocket Item status. Edits and deletions cannot make any Fund balance negative.

Use appropriate row-level locking and transaction isolation/locking strategy during implementation. The approach is documented in `sdd.md` Section 9.5 and must be implemented in SQL migrations.

## 8. Database Security

### 8.1 Row Level Security

Enable RLS for all user-owned tables:
- `funds`
- `transactions`
- `pockets`
- `pocket_items`
- `automations`
- `automation_occurrences`
- `notifications`

Policies must ensure authenticated users can access only records where `user_id = auth.uid()`.

For child records, ownership checks must also validate parent ownership. Do not rely solely on a client-supplied `user_id`.

### 8.2 System Categories

`categories` is system reference data:
- Authenticated users may read active categories.
- Ordinary users must not insert, update, or delete system categories.
- Changes to seed/reference data must be performed through controlled database migrations or privileged administrative operations.

### 8.3 Privileged Operations

- Financial mutation functions must validate the authenticated user and ownership of all referenced records.
- Do not expose service-role credentials in the mobile application.
- If a function uses elevated privileges, it must explicitly validate `auth.uid()` and must not trust user IDs supplied by the client.
- RLS must remain enabled even when database functions are used; function security configuration must be reviewed carefully.

## 9. Initial and Seed Data

### 9.1 System Seed Data

Insert the ten system Categories defined in Section 3.2.

Seed insertion must be idempotent. Running the seed process more than once must not create duplicate Category rows.

### 9.2 User Data

No sample Fund, Pocket, Transaction, or Automation records are required as production seed data.

A newly registered user starts without user-created financial records. The application may provide onboarding guidance, but default financial balances must not be inserted without an explicit product decision.

## 10. Migration Strategy

1. Database schema changes must be delivered as version-controlled SQL migration files.
2. Migrations must be applied in a deterministic order.
3. Migration scripts must be reviewed before execution.
4. Destructive schema changes require explicit approval.
5. Seed data migrations must be idempotent where practical.
6. Database changes must first be tested in a local Supabase environment.
7. Production database changes must not be applied without explicit user approval.
8. Dokumen spesifikasi telah diselaraskan pada Fase 0. Pembuatan dan penerapan SQL migration tetap menunggu persetujuan pengguna pada setiap tahap implementasi.

---

## 11. Final Schema Decisions

1. Fund tidak memiliki kolom description.
2. Pocket memiliki kolom `description` yang opsional.
3. Pocket Item Expense dengan Automation menggunakan status `template`, sama seperti Income Automation. Template tidak dihitung sebagai outstanding Expense allocation.
4. Saldo Fund dihitung langsung dari Opening Balance dan transaksi aktual; tidak menggunakan cached balance.
5. Occurrence merupakan data operasional, bukan audit trail permanen. Occurrence terkait dapat dihapus ketika Automation atau Pocket dihapus, tetapi transaksi aktual yang telah terbentuk tetap dipertahankan.
6. Penghapusan user menghapus seluruh data milik user melalui cascade delete.
7. Income Transaction dari Automation tidak dapat dihapus oleh pengguna selama masih terhubung dengan Automation asalnya. Aturan pengubahan transaksi didefinisikan pada Bagian 5.6.
8. Transaksi Income/Expense yang dilepas dari Pocket (akibat penghapusan Pocket atau Automation) diberi Category `Other Income` / `Other`.
9. Pocket Item template dibuat bersama Automation dan dihapus bersama Automation.
10. `pocket_items.fund_id` hanya diisi pada template Automation sebagai Fund default.

---

## Document Ownership

Dokumen ini menjadi sumber utama untuk definisi tabel, kolom, tipe data, constraint, relasi, indexing, database functions/triggers, RLS, dan seed data.

Kebutuhan serta perilaku produk tetap mengacu pada `prd.md`. Rancangan arsitektur dan tanggung jawab teknis berada di `sdd.md`. Skenario pengujian berada di `testing.md`. Kontrak RPC, kode error, dan aturan locking berada di `backend-contract.md`.
