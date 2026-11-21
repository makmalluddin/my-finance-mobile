# BACKEND CONTRACT
## Personal Finance Tracking Application

**Document Version:** 0.1  
**Document Status:** Draft — Fase 0  
**Last Updated:** 21 November 2026  
**Platform:** Supabase (PostgreSQL + PostgREST)

---

# 1. Purpose and Scope

Dokumen ini menetapkan kontrak antara Data Access Layer (repository) dan backend Supabase/PostgreSQL: nama RPC, parameter, bentuk hasil, kode error, aturan validasi, serta strategi penguncian.

Dokumen ini melengkapi:

- `prd.md` — kebutuhan produk dan acceptance criteria.
- `database.md` — struktur tabel, kolom, constraint, index, RLS, dan seed.
- `sdd.md` — arsitektur layer, tanggung jawab service, dan alur teknis.

Dokumen ini tidak mengubah aturan produk. Jika terjadi konflik, `prd.md` dan `database.md` menjadi acuan dan kontrak ini harus direvisi.

# 2. Conventions

## 2.1 Naming

- Semua fungsi RPC diberi prefiks `rpc_` dan menggunakan `snake_case`.
- Parameter menggunakan prefiks `p_`, misalnya `p_fund_id`.
- Fungsi mutasi mengembalikan record yang terdampak. Fungsi baca mengembalikan `json` atau `setof` view.
- View menggunakan prefiks `v_`.

## 2.2 Authentication and Ownership

- Semua RPC berjalan dengan `SECURITY INVOKER`; RLS tetap aktif.
- Identitas pengguna diambil dari `auth.uid()`. Parameter `user_id` tidak pernah diterima dari client.
- Setiap RPC yang menerima ID record wajib memverifikasi bahwa record tersebut milik `auth.uid()`.
- Relasi lintas tabel dijaga dengan composite foreign key `(parent_id, user_id)` ke `(id, user_id)`, sehingga data milik pengguna berbeda tidak dapat saling merujuk.
- RPC yang dipanggil tanpa sesi valid mengembalikan `UNAUTHENTICATED`.

## 2.3 Data Types and Money

- Nominal uang menggunakan `numeric(14,2)` dan harus `> 0`, kecuali `opening_balance` yang boleh `0`.
- PostgREST mengembalikan `numeric` sebagai string. Repository wajib mengubahnya dengan `Number()` sebelum diteruskan ke AppService, dan tidak melakukan aritmetika uang di float.
- ID menggunakan `uuid`. Timestamp menggunakan `timestamptz`.

## 2.4 Date and Timezone

- Tanggal transaksi bersifat tanggal kalender lokal perangkat.
- Helper `src/shared/utils/date.js#toOccurredAt(localDate)` menghasilkan `occurred_at` pada pukul 12.00 waktu lokal, dikonversi ke `timestamptz`.
- Filter riwayat transaksi menggunakan batas hari lokal (`startOfLocalDay`, `startOfNextLocalDay`) yang dikirim sebagai `timestamptz`.
- Agregasi Dashboard menerima `p_timezone` (IANA identifier perangkat) dan `p_today date`, lalu mengelompokkan dengan `(occurred_at AT TIME ZONE p_timezone)::date`.
- Setiap Automation menyimpan `timezone` saat dibuat. Perubahan timezone perangkat tidak mengubah Automation yang sudah ada.
- Occurrence dianggap jatuh tempo sejak pukul 00.00 pada tanggal jadwal di zona waktu Automation.

## 2.5 Error Format

Semua kegagalan bisnis dilempar sebagai exception dengan:

```sql
raise exception '<ERROR_CODE>' using detail = json_build_object(...)::text;
```

- `message` = kode error stabil (huruf besar, `UPPER_SNAKE_CASE`).
- `detail` = JSON berisi konteks tambahan (ID, nominal, saldo tersedia, nama Fund).
- SQLSTATE default `P0001` untuk error bisnis.
- Error Postgres lain (unique violation `23505`, foreign key `23503`, check `23514`) dipetakan repository menjadi kode generik yang sesuai.

Repository memetakan kode menjadi `AppError` dengan `code`, `message` (Bahasa Indonesia), dan `details`. AppService tidak menampilkan pesan teknis ke UI.

# 3. Error Catalog

| Code | Kondisi | Pesan UI (default) |
|---|---|---|
| `UNAUTHENTICATED` | Tidak ada sesi valid | Sesi Anda berakhir. Silakan masuk kembali. |
| `VALIDATION_ERROR` | Input tidak valid secara umum | Data yang dimasukkan tidak valid. |
| `INVALID_AMOUNT` | Nominal ≤ 0 atau bukan angka | Nominal harus lebih besar dari nol. |
| `INVALID_DATE` | Tanggal tidak valid | Tanggal tidak valid. |
| `INVALID_FUND_TYPE` | `fund_type` bukan `active`/`savings_goal` | Klasifikasi Fund tidak valid. |
| `INVALID_POCKET_TYPE` | Tipe Pocket tidak valid | Tipe Pocket tidak valid. |
| `INVALID_FREQUENCY` | Frekuensi Automation tidak valid | Frekuensi Automation tidak valid. |
| `FUND_NOT_FOUND` | Fund tidak ada atau bukan milik pengguna | Fund tidak ditemukan. |
| `FUND_ARCHIVED` | Fund diarsipkan | Fund sudah diarsipkan dan tidak dapat digunakan. |
| `SOURCE_FUND_NOT_ACTIVE` | Fund sumber Expense berklasifikasi `savings_goal` | Pengeluaran hanya dapat menggunakan Active Fund. Pindahkan dana ke Active Fund terlebih dahulu. |
| `SAME_FUND_TRANSFER` | Fund sumber = tujuan | Fund sumber dan tujuan harus berbeda. |
| `INSUFFICIENT_BALANCE` | Saldo Fund sumber tidak mencukupi | Saldo Fund tidak mencukupi. |
| `FUND_BALANCE_NEGATIVE` | Perubahan/penghapusan membuat saldo Fund negatif | Perubahan ini membuat saldo Fund menjadi negatif. |
| `FUND_BALANCE_NOT_ZERO` | Arsip Fund dengan saldo ≠ 0 | Fund masih memiliki saldo dan tidak dapat diarsipkan. |
| `FUND_HAS_TRANSACTIONS` | Hapus Fund yang punya transaksi | Fund memiliki transaksi dan tidak dapat dihapus. |
| `FUND_REFERENCED_BY_POCKET` | Fund dirujuk Pocket Item template | Fund masih terhubung dengan Pocket Item. |
| `OPENING_BALANCE_IMMUTABLE` | Upaya mengubah Opening Balance | Opening Balance tidak dapat diubah. |
| `CATEGORY_REQUIRED` | Income/Expense tanpa Pocket tanpa Category | Category wajib dipilih. |
| `CATEGORY_FORBIDDEN` | Transfer atau transaksi Pocket memakai Category | Category tidak digunakan untuk transaksi ini. |
| `CATEGORY_TYPE_MISMATCH` | Category tidak sesuai tipe transaksi | Category tidak sesuai dengan jenis transaksi. |
| `CATEGORY_NOT_FOUND` | Category tidak ada/nonaktif | Category tidak ditemukan. |
| `POCKET_NOT_FOUND` | Pocket tidak ada atau bukan milik pengguna | Pocket tidak ditemukan. |
| `POCKET_ARCHIVED` | Menambah item pada Pocket arsip | Pocket sudah diarsipkan. |
| `POCKET_TYPE_IMMUTABLE` | Ubah tipe setelah pernah memiliki item | Tipe Pocket tidak dapat diubah setelah memiliki item. |
| `POCKET_TYPE_MISMATCH` | Item/transaksi tidak sesuai tipe Pocket | Item tidak sesuai dengan tipe Pocket. |
| `POCKET_ITEM_NOT_FOUND` | Item tidak ada atau bukan milik pengguna | Item Pocket tidak ditemukan. |
| `POCKET_ITEM_STATUS_INVALID` | Status item tidak mengizinkan aksi | Tindakan tidak tersedia untuk status item saat ini. |
| `POCKET_ITEM_NOT_PLANNED` | Konversi/ubah item non-planned | Hanya Planned Expense yang dapat diproses. |
| `TRANSACTION_NOT_FOUND` | Transaksi tidak ada atau bukan milik pengguna | Transaksi tidak ditemukan. |
| `TRANSACTION_TYPE_IMMUTABLE` | Upaya mengubah jenis transaksi | Jenis transaksi tidak dapat diubah. |
| `TRANSACTION_PROTECTED` | Hapus Income hasil Automation | Transaksi ini berasal dari Automation dan tidak dapat dihapus. |
| `TRANSACTION_MANAGED_BY_POCKET` | Ubah/hapus transaksi Pocket dari History | Transaksi ini dikelola melalui halaman Pocket. |
| `AMOUNT_IMMUTABLE` | Ubah nominal Expense hasil konversi | Nominal transaksi hasil konversi tidak dapat diubah. |
| `AUTOMATION_NOT_FOUND` | Automation tidak ada atau bukan milik pengguna | Automation tidak ditemukan. |
| `AUTOMATION_TYPE_UNSUPPORTED` | Automation pada Pocket Transfer | Automation tidak tersedia untuk Pocket Transfer. |
| `OCCURRENCE_NOT_FOUND` | Occurrence tidak ada atau bukan milik pengguna | Occurrence tidak ditemukan. |
| `OCCURRENCE_ALREADY_PROCESSED` | Confirm/Reject pada occurrence non-pending | Occurrence ini sudah diproses. |
| `AMOUNT_NOT_ALLOWED` | Mengubah nominal Income occurrence | Nominal Income mengikuti template dan tidak dapat diubah. |
| `NOT_FOUND` | Record generik tidak ditemukan | Data tidak ditemukan. |
| `CONFLICT` | Konflik data (unique violation) | Data sudah ada. |
| `DATABASE_ERROR` | Error database tak terduga | Terjadi kesalahan pada server. Coba lagi. |

Pemetaan error → UI dilakukan di `src/data/repositories/error-mapper.js` dan dipakai seluruh repository.

# 4. Read Models (Views)

Semua view dibuat dengan `security_invoker = true` agar RLS tetap berlaku.

## 4.1 `v_fund_balances`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | ID Fund |
| `user_id` | uuid | Pemilik |
| `name` | text | Nama Fund |
| `fund_type` | text | `active` atau `savings_goal` |
| `is_archived` | boolean | Status arsip |
| `opening_balance` | numeric | Opening Balance |
| `balance` | numeric | Saldo aktual hasil perhitungan |

Perhitungan:

```text
opening_balance
+ SUM(income ke destination_fund_id)
- SUM(expense dari source_fund_id)
+ SUM(transfer masuk ke destination_fund_id)
- SUM(transfer keluar dari source_fund_id)
```

## 4.2 `v_outstanding_expense_allocation`

| Column | Type | Description |
|---|---|---|
| `user_id` | uuid | Pemilik |
| `total` | numeric | Total `pocket_items.amount` berstatus `planned` pada Pocket bertipe `expense` |

## 4.3 `v_pocket_transfer_summary`

| Column | Type | Description |
|---|---|---|
| `pocket_id` | uuid | Pocket Transfer |
| `incoming` | numeric | Total transfer masuk ke Fund tujuan |
| `outgoing` | numeric | Total transfer keluar dari Fund sumber |
| `net` | numeric | `incoming - outgoing` |
| `item_count` | integer | Jumlah item Transfer |

Ringkasan ini adalah aktivitas perpindahan uang, bukan Income/Expense.

## 4.4 `v_pending_notifications`

Menggabungkan `notifications`, `automation_occurrences`, `pocket_items`, `pockets`, dan `automations`.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Notification ID |
| `occurrence_id` | uuid | Occurrence ID |
| `automation_id` | uuid | Automation ID |
| `pocket_id` | uuid | Pocket ID |
| `pocket_name` | text | Nama Pocket |
| `pocket_type` | text | `income` atau `expense` |
| `pocket_item_id` | uuid | Template item ID |
| `item_name` | text | Nama item template |
| `template_amount` | numeric | Nominal template |
| `default_fund_id` | uuid | Fund default template |
| `scheduled_for` | timestamptz | Waktu jadwal |
| `created_at` | timestamptz | Waktu notifikasi dibuat |

# 5. RPC Catalog

Setiap entri menjelaskan kategori, parameter, hasil, aturan, kode error utama, dan penguncian. Parameter `p_` selalu bernilai skalar atau `NULL` bila opsional.

## 5.1 Fund

### 5.1.1 `rpc_create_fund`

- **Params:** `p_name text`, `p_opening_balance numeric`, `p_fund_type text`
- **Returns:** `funds`
- **Rules:** nama setelah `trim` tidak kosong; `p_opening_balance >= 0`; `p_fund_type` valid; `user_id = auth.uid()`; `is_archived = false`.
- **Errors:** `VALIDATION_ERROR`, `INVALID_AMOUNT`, `INVALID_FUND_TYPE`, `UNAUTHENTICATED`
- **Locks:** tidak ada
- **AppService:** `fundService.createFund`

### 5.1.2 `rpc_update_fund`

- **Params:** `p_fund_id uuid`, `p_name text`, `p_fund_type text`
- **Returns:** `funds`
- **Rules:** hanya `name` dan `fund_type`. Opening Balance tidak dapat diubah (`OPENING_BALANCE_IMMUTABLE` bila upaya dilakukan melalui parameter tambahan). Perubahan klasifikasi tidak mengubah saldo.
- **Errors:** `FUND_NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_FUND_TYPE`
- **Locks:** `funds` (`FOR UPDATE`) untuk `p_fund_id`
- **AppService:** `fundService.updateFund`

### 5.1.3 `rpc_archive_fund`

- **Params:** `p_fund_id uuid`
- **Returns:** `funds`
- **Rules:** tolak bila direferensikan `pocket_items.fund_id` (`FUND_REFERENCED_BY_POCKET`); tolak bila `balance <> 0` (`FUND_BALANCE_NOT_ZERO`); set `is_archived = true`.
- **Errors:** `FUND_NOT_FOUND`, `FUND_REFERENCED_BY_POCKET`, `FUND_BALANCE_NOT_ZERO`
- **Locks:** `funds` (`FOR UPDATE`)
- **AppService:** `fundService.archiveFund`

### 5.1.4 `rpc_unarchive_fund`

- **Params:** `p_fund_id uuid`
- **Returns:** `funds`
- **Rules:** set `is_archived = false`. Tidak ada validasi saldo.
- **Errors:** `FUND_NOT_FOUND`
- **Locks:** `funds` (`FOR UPDATE`)
- **AppService:** `fundService.unarchiveFund`

### 5.1.5 `rpc_delete_fund`

- **Params:** `p_fund_id uuid`
- **Returns:** `void`
- **Rules:** tolak bila ada transaksi (`source_fund_id` atau `destination_fund_id`) → `FUND_HAS_TRANSACTIONS`; tolak bila direferensikan `pocket_items.fund_id` → `FUND_REFERENCED_BY_POCKET`. Penghapusan menghapus Opening Balance yang melekat.
- **Errors:** `FUND_NOT_FOUND`, `FUND_HAS_TRANSACTIONS`, `FUND_REFERENCED_BY_POCKET`
- **Locks:** `funds` (`FOR UPDATE`)
- **AppService:** `fundService.deleteFund`

### 5.1.6 `rpc_get_fund_balances`

- **Params:** `p_include_archived boolean default false`
- **Returns:** `TABLE(id uuid, name text, fund_type text, is_archived boolean, opening_balance numeric, balance numeric)`
- **Rules:** hanya Fund milik `auth.uid()`; urut `is_archived`, `name`.
- **Errors:** `UNAUTHENTICATED`
- **Locks:** tidak ada (read-only)
- **AppService:** `fundService.listFunds`

## 5.2 Transaction

Semua RPC transaksi memvalidasi bentuk transaksi: Income tanpa `source_fund_id`, Expense tanpa `destination_fund_id`, Transfer memiliki keduanya dan berbeda, Category wajib hanya untuk transaksi tanpa Pocket, Category harus sesuai tipe.

### 5.2.1 `rpc_create_income`

- **Params:** `p_amount numeric`, `p_occurred_at timestamptz`, `p_destination_fund_id uuid`, `p_category_id uuid`
- **Returns:** `transactions`
- **Rules:** nominal > 0; Fund tujuan milik pengguna dan tidak diarsipkan (boleh `active` atau `savings_goal`); Category wajib dan bertipe `income`; `pocket_item_id = NULL`.
- **Errors:** `INVALID_AMOUNT`, `INVALID_DATE`, `FUND_NOT_FOUND`, `FUND_ARCHIVED`, `CATEGORY_REQUIRED`, `CATEGORY_TYPE_MISMATCH`
- **Locks:** `funds` (`FOR UPDATE`) untuk Fund tujuan
- **AppService:** `transactionService.createIncome`

### 5.2.2 `rpc_create_expense`

- **Params:** `p_amount numeric`, `p_occurred_at timestamptz`, `p_source_fund_id uuid`, `p_category_id uuid`
- **Returns:** `transactions`
- **Rules:** nominal > 0; Fund sumber milik pengguna, tidak diarsipkan, dan `fund_type = 'active'` (`SOURCE_FUND_NOT_ACTIVE`); saldo cukup setelah kunci diperoleh; Category wajib dan bertipe `expense`; `pocket_item_id = NULL`.
- **Errors:** `INVALID_AMOUNT`, `INVALID_DATE`, `FUND_NOT_FOUND`, `FUND_ARCHIVED`, `SOURCE_FUND_NOT_ACTIVE`, `INSUFFICIENT_BALANCE`, `CATEGORY_REQUIRED`, `CATEGORY_TYPE_MISMATCH`
- **Locks:** `funds` (`FOR UPDATE`)
- **AppService:** `transactionService.createExpense`

### 5.2.3 `rpc_create_transfer`

- **Params:** `p_amount numeric`, `p_occurred_at timestamptz`, `p_source_fund_id uuid`, `p_destination_fund_id uuid`
- **Returns:** `transactions`
- **Rules:** nominal > 0; kedua Fund milik pengguna dan tidak diarsipkan; sumber ≠ tujuan; saldo sumber cukup; `category_id = NULL`. Sumber boleh `savings_goal`.
- **Errors:** `INVALID_AMOUNT`, `INVALID_DATE`, `FUND_NOT_FOUND`, `FUND_ARCHIVED`, `SAME_FUND_TRANSFER`, `INSUFFICIENT_BALANCE`
- **Locks:** `funds` (`FOR UPDATE`) untuk kedua Fund, urut `id` menaik
- **AppService:** `transactionService.createTransfer`

### 5.2.4 `rpc_update_standalone_transaction`

- **Params:** `p_transaction_id uuid`, `p_amount numeric`, `p_occurred_at timestamptz`, `p_source_fund_id uuid`, `p_destination_fund_id uuid`, `p_category_id uuid`
- **Returns:** `transactions`
- **Rules:** hanya transaksi dengan `pocket_item_id IS NULL` (`TRANSACTION_MANAGED_BY_POCKET`); jenis tidak dapat diubah (`TRANSACTION_TYPE_IMMUTABLE`); validasi bentuk, Category, Fund aktif/tidak diarsipkan, dan `SOURCE_FUND_NOT_ACTIVE` untuk Expense; saldo semua Fund terdampak (lama dan baru) tidak boleh negatif setelah perubahan (`FUND_BALANCE_NEGATIVE`).
- **Errors:** `TRANSACTION_NOT_FOUND`, `TRANSACTION_MANAGED_BY_POCKET`, `TRANSACTION_TYPE_IMMUTABLE`, `INVALID_AMOUNT`, `FUND_ARCHIVED`, `SOURCE_FUND_NOT_ACTIVE`, `INSUFFICIENT_BALANCE`, `FUND_BALANCE_NEGATIVE`
- **Locks:** transaksi (`FOR UPDATE`), lalu Fund lama dan baru (`FOR UPDATE`, urut `id`)
- **AppService:** `transactionService.updateTransaction`

### 5.2.5 `rpc_delete_standalone_transaction`

- **Params:** `p_transaction_id uuid`
- **Returns:** `void`
- **Rules:** hanya transaksi dengan `pocket_item_id IS NULL`; tolak bila terhubung occurrence Income Automation `confirmed` (`TRANSACTION_PROTECTED`); penghapusan membalik dampak saldo; tolak bila membuat saldo Fund mana pun negatif (`FUND_BALANCE_NEGATIVE`).
- **Errors:** `TRANSACTION_NOT_FOUND`, `TRANSACTION_MANAGED_BY_POCKET`, `TRANSACTION_PROTECTED`, `FUND_BALANCE_NEGATIVE`
- **Locks:** transaksi, lalu Fund terdampak
- **AppService:** `transactionService.deleteTransaction`

### 5.2.6 `rpc_update_pocket_transaction`

- **Params:** `p_transaction_id uuid`, `p_amount numeric`, `p_occurred_at timestamptz`, `p_source_fund_id uuid`, `p_destination_fund_id uuid`
- **Returns:** `transactions`
- **Rules:** transaksi wajib memiliki `pocket_item_id` (jika tidak → `TRANSACTION_MANAGED_BY_POCKET`); jenis tidak dapat diubah; nominal Expense hasil konversi immutable (`AMOUNT_IMMUTABLE`); validasi Fund dan saldo sama seperti pembuatan, termasuk `SOURCE_FUND_NOT_ACTIVE` untuk Expense; perubahan nominal pada Income Pocket tanpa Automation atau Transfer Pocket ikut memperbarui `pocket_items.amount`; perubahan nominal transaksi hasil Automation (Income maupun Expense) tidak mengubah template.
- **Errors:** `TRANSACTION_NOT_FOUND`, `TRANSACTION_TYPE_IMMUTABLE`, `AMOUNT_IMMUTABLE`, `SOURCE_FUND_NOT_ACTIVE`, `INSUFFICIENT_BALANCE`, `FUND_BALANCE_NEGATIVE`
- **Locks:** transaksi, item Pocket terkait, lalu Fund terdampak (urut `id`)
- **AppService:** `pocketService.updatePocketTransaction`

### 5.2.7 `rpc_delete_pocket_transaction`

- **Params:** `p_transaction_id uuid`
- **Returns:** `void`
- **Rules:** transaksi wajib memiliki `pocket_item_id`; tolak Income Automation (`TRANSACTION_PROTECTED`); membalik dampak saldo; menerapkan siklus item:
  - Income Pocket tanpa Automation → item kembali `pending`
  - Expense hasil konversi → item kembali `planned`, alokasi dihitung ulang
  - Expense Automation → transaksi boleh dihapus; occurrence terkait dihapus dan item template tetap `template`
  - Transfer Pocket → item terkait dihapus
  - Income Automation → ditolak
  Tolak bila membuat saldo Fund mana pun negatif.
- **Errors:** `TRANSACTION_NOT_FOUND`, `TRANSACTION_PROTECTED`, `FUND_BALANCE_NEGATIVE`
- **Locks:** transaksi, item Pocket, Fund terdampak
- **AppService:** `pocketService.deletePocketTransaction`

## 5.3 Pocket

### 5.3.1 `rpc_create_pocket`

- **Params:** `p_name text`, `p_description text`, `p_type text`
- **Returns:** `pockets`
- **Rules:** nama tidak kosong setelah trim; `type` valid; `has_ever_had_item = false`; `is_archived = false`.
- **Errors:** `VALIDATION_ERROR`, `INVALID_POCKET_TYPE`
- **Locks:** tidak ada
- **AppService:** `pocketService.createPocket`

### 5.3.2 `rpc_update_pocket`

- **Params:** `p_pocket_id uuid`, `p_name text`, `p_description text`, `p_type text`
- **Returns:** `pockets`
- **Rules:** tipe hanya boleh berubah bila `has_ever_had_item = false` (`POCKET_TYPE_IMMUTABLE`); nama tidak kosong.
- **Errors:** `POCKET_NOT_FOUND`, `POCKET_TYPE_IMMUTABLE`, `INVALID_POCKET_TYPE`
- **Locks:** `pockets` (`FOR UPDATE`)
- **AppService:** `pocketService.updatePocket`

### 5.3.3 `rpc_archive_pocket` / `rpc_unarchive_pocket`

- **Params:** `p_pocket_id uuid`
- **Returns:** `pockets`
- **Rules:** hanya mengubah `is_archived`. Pocket arsip tetap menampilkan item lama dan tetap mengizinkan konfirmasi/konversi/ubah/hapus item; hanya penambahan item baru yang ditolak.
- **Errors:** `POCKET_NOT_FOUND`
- **Locks:** `pockets` (`FOR UPDATE`)
- **AppService:** `pocketService.archivePocket`, `pocketService.unarchivePocket`

### 5.3.4 `rpc_delete_pocket`

- **Params:** `p_pocket_id uuid`
- **Returns:** `void`
- **Rules:** operasi permanen dan atomik:
  1. Lepas seluruh transaksi aktual: `transactions.pocket_item_id = NULL`; Income diberi Category `Other Income`, Expense diberi Category `Other`; Transfer tetap tanpa Category.
  2. Hapus Notification dan occurrence Automation terkait.
  3. Hapus Automation.
  4. Hapus seluruh Pocket Item (termasuk Planned Expense, sehingga alokasi dilepas).
  5. Hapus Pocket.
  Dampak saldo transaksi aktual tidak berubah.
- **Errors:** `POCKET_NOT_FOUND`
- **Locks:** `pockets`, `pocket_items`, `automations`
- **AppService:** `pocketService.deletePocket`

### 5.3.5 `rpc_create_income_item`

- **Params:** `p_pocket_id uuid`, `p_name text`, `p_amount numeric`
- **Returns:** `pocket_items`
- **Rules:** Pocket bertipe `income` dan tidak diarsipkan; nominal > 0; status `pending`; `fund_id = NULL`; set `has_ever_had_item = true`. Tidak menghasilkan transaksi.
- **Errors:** `POCKET_NOT_FOUND`, `POCKET_ARCHIVED`, `POCKET_TYPE_MISMATCH`, `INVALID_AMOUNT`
- **Locks:** `pockets` (`FOR UPDATE`)
- **AppService:** `pocketService.createIncomeItem`

### 5.3.6 `rpc_confirm_income_item`

- **Params:** `p_item_id uuid`, `p_destination_fund_id uuid`
- **Returns:** `transactions`
- **Rules:** item `pending` pada Pocket Income; Fund tujuan milik pengguna dan tidak diarsipkan (boleh `savings_goal`); membuat Income Transaction dengan `pocket_item_id` item dan Category `NULL`; status item menjadi `confirmed`; nominal mengikuti item.
- **Errors:** `POCKET_ITEM_NOT_FOUND`, `POCKET_ITEM_STATUS_INVALID`, `FUND_NOT_FOUND`, `FUND_ARCHIVED`
- **Locks:** Fund tujuan (`FOR UPDATE`), lalu item (`FOR UPDATE`), lalu validasi ulang status
- **AppService:** `pocketService.confirmIncomeItem`

### 5.3.7 `rpc_create_planned_expense_item`

- **Params:** `p_pocket_id uuid`, `p_name text`, `p_amount numeric`
- **Returns:** `pocket_items`
- **Rules:** Pocket bertipe `expense` dan tidak diarsipkan; status `planned`; `fund_id = NULL`; set `has_ever_had_item = true`. Alokasi langsung terhitung pada Active Balance.
- **Errors:** `POCKET_NOT_FOUND`, `POCKET_ARCHIVED`, `POCKET_TYPE_MISMATCH`, `INVALID_AMOUNT`
- **Locks:** `pockets` (`FOR UPDATE`)
- **AppService:** `pocketService.createPlannedExpenseItem`

### 5.3.8 `rpc_update_planned_expense_item`

- **Params:** `p_item_id uuid`, `p_name text`, `p_amount numeric`
- **Returns:** `pocket_items`
- **Rules:** hanya item `planned` (`POCKET_ITEM_NOT_PLANNED`); nominal > 0; alokasi dihitung ulang otomatis.
- **Errors:** `POCKET_ITEM_NOT_FOUND`, `POCKET_ITEM_NOT_PLANNED`, `INVALID_AMOUNT`
- **Locks:** item (`FOR UPDATE`)
- **AppService:** `pocketService.updatePlannedExpenseItem`

### 5.3.9 `rpc_convert_planned_expense`

- **Params:** `p_item_id uuid`, `p_source_fund_id uuid`
- **Returns:** `transactions`
- **Rules:** item `planned`; Fund sumber milik pengguna, tidak diarsipkan, dan `fund_type = 'active'` (`SOURCE_FUND_NOT_ACTIVE`); saldo cukup; Expense Transaction dibuat dengan nominal item dan `pocket_item_id` item; status item menjadi `converted`; alokasi dilepas.
- **Errors:** `POCKET_ITEM_NOT_FOUND`, `POCKET_ITEM_NOT_PLANNED`, `FUND_NOT_FOUND`, `FUND_ARCHIVED`, `SOURCE_FUND_NOT_ACTIVE`, `INSUFFICIENT_BALANCE`
- **Locks:** Fund sumber (`FOR UPDATE`), lalu item (`FOR UPDATE`), lalu validasi ulang status
- **AppService:** `pocketService.convertPlannedExpense`

### 5.3.10 `rpc_create_transfer_item`

- **Params:** `p_pocket_id uuid`, `p_name text`, `p_amount numeric`, `p_source_fund_id uuid`, `p_destination_fund_id uuid`, `p_occurred_at timestamptz`
- **Returns:** `pocket_items`
- **Rules:** Pocket bertipe `transfer` dan tidak diarsipkan; nominal > 0; kedua Fund milik pengguna dan tidak diarsipkan (boleh `savings_goal`); sumber ≠ tujuan; saldo sumber cukup; membuat Transfer Transaction dan Pocket Item `completed` dalam satu transaksi database; set `has_ever_had_item = true`.
- **Errors:** `POCKET_NOT_FOUND`, `POCKET_ARCHIVED`, `POCKET_TYPE_MISMATCH`, `INVALID_AMOUNT`, `SAME_FUND_TRANSFER`, `INSUFFICIENT_BALANCE`
- **Locks:** `pockets`, kedua Fund (`FOR UPDATE`, urut `id`)
- **AppService:** `pocketService.createTransferItem`

### 5.3.11 `rpc_delete_pocket_item`

- **Params:** `p_item_id uuid`
- **Returns:** `void`
- **Rules:** berlaku untuk item `pending` (Income) dan `planned` (Expense). Item `confirmed`, `converted`, `completed`, atau `template` ditolak (`POCKET_ITEM_STATUS_INVALID`). Penghapusan tidak mengubah saldo Fund; Planned Expense melepas alokasi.
- **Errors:** `POCKET_ITEM_NOT_FOUND`, `POCKET_ITEM_STATUS_INVALID`
- **Locks:** item (`FOR UPDATE`)
- **AppService:** `pocketService.deletePocketItem`

## 5.4 Automation and Occurrence

### 5.4.1 `rpc_create_automation`

- **Params:** `p_pocket_id uuid`, `p_name text`, `p_amount numeric`, `p_fund_id uuid`, `p_frequency text`, `p_start_date date`, `p_timezone text`
- **Returns:** `automations` (beserta `pocket_item_id`)
- **Rules:** Pocket `income`/`expense`, tidak diarsipkan; Automation tidak berlaku untuk Transfer (`AUTOMATION_TYPE_UNSUPPORTED`); `p_frequency` valid; `p_start_date` valid; `p_timezone` valid IANA; membuat Pocket Item `template` + Automation secara atomik; `pocket_items.fund_id` diisi:
  - Income: Fund tujuan default, tidak diarsipkan (boleh `savings_goal`)
  - Expense: Fund sumber default, tidak diarsipkan, dan `fund_type = 'active'`
  `next_run_at` dihitung dari `start_date` pukul 00.00 waktu `p_timezone`; set `has_ever_had_item = true`.
- **Errors:** `POCKET_NOT_FOUND`, `POCKET_ARCHIVED`, `POCKET_TYPE_MISMATCH`, `AUTOMATION_TYPE_UNSUPPORTED`, `INVALID_FREQUENCY`, `INVALID_AMOUNT`, `SOURCE_FUND_NOT_ACTIVE`, `FUND_ARCHIVED`
- **Locks:** `pockets`, Fund default (`FOR UPDATE`)
- **AppService:** `automationService.createAutomation`

### 5.4.2 `rpc_update_automation`

- **Params:** `p_automation_id uuid`, `p_name text`, `p_amount numeric`, `p_fund_id uuid`, `p_frequency text`, `p_start_date date`, `p_timezone text`
- **Returns:** `automations`
- **Rules:** memperbarui template dan jadwal; menghitung ulang `next_run_at`; menghapus occurrence `pending` beserta Notification-nya lalu membuat ulang occurrence yang sudah jatuh tempo berdasarkan jadwal baru pada pemeriksaan berikutnya; occurrence `confirmed`/`rejected` dipertahankan. Validasi Fund default mengikuti aturan pembuatan.
- **Errors:** `AUTOMATION_NOT_FOUND`, `INVALID_FREQUENCY`, `INVALID_AMOUNT`, `SOURCE_FUND_NOT_ACTIVE`, `FUND_ARCHIVED`
- **Locks:** `automations`, `pocket_items`, Fund default, `automation_occurrences`
- **AppService:** `automationService.updateAutomation`

### 5.4.3 `rpc_delete_automation`

- **Params:** `p_automation_id uuid`
- **Returns:** `void`
- **Rules:** atomik:
  1. Lepas transaksi aktual dari template (`pocket_item_id = NULL`) dan beri Category `Other Income`/`Other`.
  2. Hapus seluruh occurrence dan Notification.
  3. Hapus Automation.
  4. Hapus Pocket Item template.
  Transaksi aktual dan dampak saldonya dipertahankan.
- **Errors:** `AUTOMATION_NOT_FOUND`
- **Locks:** `automations`, `pocket_items`
- **AppService:** `automationService.deleteAutomation`

### 5.4.4 `rpc_process_due_automations`

- **Params:** `p_now timestamptz default now()`
- **Returns:** `json` — `{ "created_occurrences": integer, "created_notifications": integer, "processed_automations": integer }`
- **Rules:** dipanggil saat aplikasi dibuka, saat kembali `active`, dan pada refresh Dashboard. Untuk setiap Automation milik `auth.uid()` dengan `is_active = true` dan `next_run_at <= p_now`:
  1. Kunci baris Automation (`FOR UPDATE`) agar pemeriksaan bersamaan tidak membuat occurrence ganda.
  2. Buat satu occurrence untuk setiap periode jatuh tempo yang belum memiliki baris (`UNIQUE (automation_id, scheduled_for)`).
  3. Buat satu Notification untuk setiap occurrence `pending` baru.
  4. Majukan `next_run_at` melewati `p_now`.
  5. Batasi maksimal 500 occurrence per Automation per pemanggilan; sisa periode diproses pada pemanggilan berikutnya.
  Tidak membuat transaksi aktual.
- **Errors:** `UNAUTHENTICATED`
- **Locks:** `automations` (`FOR UPDATE`, satu per satu)
- **AppService:** `automationService.processDueAutomations`

### 5.4.5 `rpc_confirm_occurrence`

- **Params:** `p_occurrence_id uuid`, `p_fund_id uuid`, `p_amount numeric default null`
- **Returns:** `transactions`
- **Rules:** occurrence `pending` (jika tidak → `OCCURRENCE_ALREADY_PROCESSED`); kunci occurrence lalu validasi ulang status:
  - Income: `p_amount` harus `NULL` atau sama dengan nominal template (`AMOUNT_NOT_ALLOWED`); Fund tujuan tidak diarsipkan, boleh `savings_goal`; membuat Income Transaction dengan nominal template dan `pocket_item_id` template.
  - Expense: nominal = `COALESCE(p_amount, template amount)`, harus > 0; Fund sumber tidak diarsipkan dan `fund_type = 'active'` (`SOURCE_FUND_NOT_ACTIVE`); saldo cukup (`INSUFFICIENT_BALANCE`, occurrence tetap `pending`); membuat Expense Transaction.
  Set `status = 'confirmed'`, `confirmed_amount`, `transaction_id`, `processed_at`; hapus Notification terkait.
- **Errors:** `OCCURRENCE_NOT_FOUND`, `OCCURRENCE_ALREADY_PROCESSED`, `SOURCE_FUND_NOT_ACTIVE`, `FUND_ARCHIVED`, `INSUFFICIENT_BALANCE`, `AMOUNT_NOT_ALLOWED`, `INVALID_AMOUNT`
- **Locks:** Fund yang dipilih (`FOR UPDATE`), lalu occurrence (`FOR UPDATE`), lalu transaksi dibuat
- **AppService:** `automationService.confirmOccurrence`

### 5.4.6 `rpc_reject_occurrence`

- **Params:** `p_occurrence_id uuid`
- **Returns:** `void`
- **Rules:** occurrence `pending`; set `status = 'rejected'`, `processed_at = now()`, `transaction_id = NULL`; hapus Notification. Tidak membuat transaksi.
- **Errors:** `OCCURRENCE_NOT_FOUND`, `OCCURRENCE_ALREADY_PROCESSED`
- **Locks:** occurrence (`FOR UPDATE`)
- **AppService:** `automationService.rejectOccurrence`

## 5.5 Notification

### 5.5.1 `rpc_get_pending_notifications`

- **Params:** tidak ada
- **Returns:** `setof v_pending_notifications`
- **Rules:** hanya Notification milik `auth.uid()`; urut `scheduled_for` menaik.
- **Errors:** `UNAUTHENTICATED`
- **Locks:** tidak ada
- **AppService:** `notificationService.listPendingNotifications`

Tidak ada RPC terpisah untuk menghapus Notification. Penghapusan terjadi di dalam `rpc_confirm_occurrence`, `rpc_reject_occurrence`, `rpc_delete_automation`, dan `rpc_delete_pocket`.

## 5.6 Dashboard

### 5.6.1 `rpc_get_dashboard`

- **Params:** `p_today date`, `p_timezone text`
- **Returns:** `json`

```json
{
  "active_balance": "1500000.00",
  "total_active_funds_balance": "1800000.00",
  "outstanding_expense_allocation": "300000.00",
  "active_funds": [
    { "id": "uuid", "name": "BCA", "balance": "1800000.00" }
  ],
  "expense_series": [
    { "date": "2026-11-15", "total": "0.00" },
    { "date": "2026-11-16", "total": "25000.00" }
  ],
  "pending_notifications": 2
}
```

- **Rules:**
  - `active_balance = total_active_funds_balance - outstanding_expense_allocation`.
  - Hanya Fund `fund_type = 'active'` dan `is_archived = false` yang masuk `active_funds`.
  - Alokasi berasal dari `v_outstanding_expense_allocation`.
  - `expense_series` selalu berisi tepat tujuh hari kalender: `p_today - 6` sampai `p_today`, dikelompokkan memakai `p_timezone`.
  - Hanya Expense aktual yang dihitung; Income, Transfer, Planned Expense, dan template Automation tidak dihitung.
- **Errors:** `UNAUTHENTICATED`, `VALIDATION_ERROR` (timezone tidak valid)
- **Locks:** tidak ada (read-only)
- **AppService:** `dashboardService.getDashboard`

# 6. Locking and Concurrency

Urutan penguncian wajib konsisten untuk mencegah deadlock.

| Operasi | Urutan lock |
|---|---|
| Create/Update/Delete transaksi | `transactions` → `funds` (urut `id` menaik) |
| Update/Delete transaksi Pocket | `transactions` → `pocket_items` → `funds` (urut `id`) |
| Konfirmasi Income item | `funds` → `pocket_items` |
| Konversi Planned Expense | `funds` → `pocket_items` |
| Create Transfer item | `pockets` → `funds` (urut `id`) |
| Confirm/Reject occurrence | `funds` → `automation_occurrences` |
| Process due automations | `automations` (satu per satu) |
| Archive/Delete Fund | `funds` → cek referensi `pocket_items` dan `transactions` |
| Delete Pocket/Automation | `pockets`/`automations` → `pocket_items` → `automation_occurrences` |

Aturan tambahan:

- Saldo selalu dihitung **setelah** lock diperoleh, tidak pernah dari nilai yang dibaca sebelum lock.
- Jika operasi menyentuh lebih dari satu Fund, lock diambil berurutan menurut `id`.
- Validasi status (`is_archived`, `status`, `fund_type`) dilakukan setelah lock, bukan sebelumnya.
- Semua langkah berjalan dalam satu transaksi database; kegagalan membatalkan seluruh perubahan.
- Tidak menggunakan advisory lock atau layanan lock eksternal.

# 7. Idempotency

| Operasi | Strategi |
|---|---|
| Confirm/Reject occurrence | Lock `automation_occurrences` → pastikan `status = 'pending'` → ubah status. Permintaan kedua menerima `OCCURRENCE_ALREADY_PROCESSED`. `UNIQUE (automation_id, scheduled_for)` dan unique `transaction_id` menjadi pengaman terakhir. |
| Pembuatan occurrence | Lock `automations`, lalu `UNIQUE (automation_id, scheduled_for)` mencegah duplikat. |
| Konfirmasi income item / konversi expense | Lock item dan pastikan status `pending`/`planned` sebelum membuat transaksi. |
| Create transaksi biasa | Tidak memiliki idempotency key pada MVP. Retry pengguna diperlakukan sebagai transaksi baru; UI harus menonaktifkan tombol selama request berjalan. |

# 8. Scheduling Semantics

- Frekuensi: `weekly` (+7 hari), `every_two_weeks` (+14 hari), `monthly`.
- Monthly memakai tanggal `start_date`. Bila tanggal tersebut tidak ada pada suatu bulan, gunakan hari terakhir bulan itu.
- Perhitungan tanggal dilakukan pada tanggal lokal `timezone` Automation.
- `next_run_at` disimpan sebagai `timestamptz` hasil konversi tanggal lokal pukul 00.00 ke UTC.
- Bila `start_date` diubah, `next_run_at` dihitung ulang dari `start_date` baru.
- Pemeriksaan dilakukan saat aplikasi dibuka, saat `AppState` kembali `active`, dan pada refresh manual. Tidak ada scheduler pihak ketiga.
- Perubahan `amount`/`fund_id` template tidak mengubah nominal atau Fund transaksi yang sudah terbentuk.

# 9. Database Objects Required

## 9.1 Tables

`funds`, `categories`, `pockets`, `pocket_items`, `transactions`, `automations`, `automation_occurrences`, `notifications` sesuai `database.md`.

## 9.2 Composite Keys for Ownership

Tambahan unique constraint untuk mendukung composite FK:

| Table | Unique |
|---|---|
| `funds` | `(id, user_id)` |
| `pockets` | `(id, user_id)` |
| `pocket_items` | `(id, user_id)` |
| `automations` | `(id, user_id)` |
| `transactions` | `(id, user_id)` |
| `automation_occurrences` | `(id, user_id)` |

Composite FK yang dipakai:

- `pocket_items (pocket_id, user_id)` → `pockets (id, user_id)`
- `pocket_items (fund_id, user_id)` → `funds (id, user_id)`
- `transactions (source_fund_id, user_id)` → `funds (id, user_id)`
- `transactions (destination_fund_id, user_id)` → `funds (id, user_id)`
- `transactions (pocket_item_id, user_id)` → `pocket_items (id, user_id)`
- `automations (pocket_item_id, user_id)` → `pocket_items (id, user_id)`
- `automation_occurrences (automation_id, user_id)` → `automations (id, user_id)`
- `automation_occurrences (pocket_item_id, user_id)` → `pocket_items (id, user_id)`
- `notifications (occurrence_id, user_id)` → `automation_occurrences (id, user_id)`

## 9.3 Triggers (Defense in Depth)

| Trigger | Fungsi |
|---|---|
| `set_updated_at` | Mengisi `updated_at = now()` pada UPDATE untuk tabel yang memilikinya |
| `funds_opening_balance_immutable` | Menolak perubahan `opening_balance` |
| `pockets_type_immutable` | Menolak perubahan `type` saat `has_ever_had_item = true` |
| `pocket_items_validate` | Validasi `status` terhadap tipe Pocket, `fund_id` hanya untuk `template`, set `has_ever_had_item = true`, dan `has_ever_had_item` monoton |
| `transactions_validate` | Validasi bentuk transaksi, Category vs Pocket, Category type, dan kepemilikan Fund |
| `automations_validate` | Satu Automation aktif per Pocket Item, item harus `template`, dan Fund default sesuai tipe |
| `notifications_only_pending` | Notification hanya untuk occurrence `pending` |

Trigger bersifat pertahanan tambahan. Sumber kebenaran validasi tetap RPC.

## 9.4 RLS Policies

| Table | Policy |
|---|---|
| `funds`, `pockets`, `pocket_items`, `transactions`, `automations`, `automation_occurrences`, `notifications` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` hanya bila `user_id = auth.uid()` |
| `categories` | `SELECT` untuk `authenticated` dengan `is_active = true`; tidak ada policy tulis untuk pengguna |

Semua RPC tetap `SECURITY INVOKER`, sehingga RLS berlaku pada setiap akses tabel di dalam fungsi.

# 10. Migration Plan

| File | Isi |
|---|---|
| `0001_helpers.sql` | Extension, `set_updated_at`, helper validasi timezone |
| `0002_core_tables.sql` | `funds`, `categories`, `pockets`, `pocket_items`, `transactions` |
| `0003_automation_tables.sql` | `automations`, `automation_occurrences`, `notifications` |
| `0004_constraints_indexes.sql` | Composite unique/FK, check constraint, index |
| `0005_views.sql` | `v_fund_balances`, `v_outstanding_expense_allocation`, `v_pocket_transfer_summary`, `v_pending_notifications` |
| `0006_rls.sql` | Policy RLS seluruh tabel |
| `0007_seed_categories.sql` | Seed 10 Category idempoten |
| `0008_rpc_funds.sql` | RPC Fund + `rpc_get_fund_balances` |
| `0009_rpc_transactions.sql` | RPC transaksi standalone |
| `0010_rpc_pockets.sql` | RPC Pocket dan Pocket Item |
| `0011_rpc_automations.sql` | RPC Automation, occurrence, notification |
| `0012_rpc_dashboard.sql` | `rpc_get_dashboard` |
| `0013_rpc_schedule.sql` | `rpc_process_due_automations` |

Setiap migration harus direview dan disetujui sebelum dijalankan. Pengujian menggunakan `supabase/tests/*.sql` dengan pgTAP.

# 11. Repository and AppService Mapping

| Repository | RPC/View | AppService |
|---|---|---|
| `fundRepository` | `rpc_get_fund_balances`, `rpc_create_fund`, `rpc_update_fund`, `rpc_archive_fund`, `rpc_unarchive_fund`, `rpc_delete_fund` | `fundService` |
| `transactionRepository` | `rpc_create_income`, `rpc_create_expense`, `rpc_create_transfer`, `rpc_update_standalone_transaction`, `rpc_delete_standalone_transaction` | `transactionService` |
| `pocketRepository` | RPC Pocket dan Pocket Item, `rpc_update_pocket_transaction`, `rpc_delete_pocket_transaction`, `v_pocket_transfer_summary` | `pocketService` |
| `automationRepository` | `rpc_create_automation`, `rpc_update_automation`, `rpc_delete_automation`, `rpc_process_due_automations`, `rpc_confirm_occurrence`, `rpc_reject_occurrence` | `automationService` |
| `notificationRepository` | `rpc_get_pending_notifications` | `notificationService` |
| `categoryRepository` | Query `categories` (read-only) | `categoryService` |
| `dashboardRepository` | `rpc_get_dashboard` | `dashboardService` |

Repository tidak memuat aturan bisnis. AppService tidak memanggil Supabase langsung.

# 12. Open Points and Change Control

- Nama final RPC, tipe parameter, dan bentuk hasil pada dokumen ini berlaku sebagai acuan implementasi Fase 2–4.
- Perubahan signature atau aturan wajib disetujui terlebih dahulu dan dicatat pada revisi dokumen ini.
- Keputusan berikut bersifat kontrak (bukan aturan produk) dan dapat direvisi bila implementasi menemukan kendala: penghapusan occurrence `pending` saat Automation diubah, batas 500 occurrence per pemeriksaan, dan waktu jatuh tempo pukul 00.00 lokal.
- Pengujian konkurensi nyata dilakukan dengan dua sesi `psql` paralel karena pgTAP berjalan pada satu sesi.

---

**Document Status:** Draft untuk direview.
