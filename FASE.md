# Rencana Fase Pengerjaan Proyek

**Proyek:** Personal Finance Tracking (Expo SDK 58 + React Native 0.88.1 + Supabase lokal)
**Status dokumen:** Disetujui — Fase 5 selesai diimplementasikan, menunggu demo manual dan persetujuan Fase 6
**Dibuat:** 22 November 2026

> Catatan lokasi: dokumentasi proyek berada di `docs/` di root repository, bukan di
> `src/docs/`. Rencana ini disusun berdasarkan `docs/context.md`, `docs/prd.md`,
> `docs/sdd.md`, `docs/database.md`, `docs/testing.md`, dan
> `docs/backend-contract.md`.

---

## 1. Ringkasan kondisi saat ini

### Sudah selesai

| Area | Bukti |
|---|---|
| Fase 0 — dokumentasi & kontrak | `docs/context.md`, `prd.md`, `sdd.md`, `database.md`, `testing.md`, `backend-contract.md` tersedia. Kontrak RPC, error catalog, views, dan aturan locking sudah ditetapkan. |
| Fase 1 — setup Expo & UI shell | Expo Router di `src/app/`, theme internal, komponen bersama di `src/shared/`, layar placeholder Dashboard/Transaksi/Pocket/Fund/Pengaturan, navigasi tab. |
| Fase 2 — backend lokal & autentikasi | 13 migration SQL (`0001`–`0013`), 7 file pgTAP dengan 406 tes, Supabase client + `AuthProvider`, layar masuk/daftar, protected routes, sign-out, 8 tes Jest. |
| Verifikasi | `npx supabase test db` 406/406 lolos, `npm test` 8/8 lolos, `npx expo lint` bersih, `npx expo-doctor` 20/20 lolos, `npx expo export --platform android` berhasil. |
| Git | Working tree bersih pada `HEAD 38f316e` (`feat: create migrations database`). Belum ada rilis/cloud. |

### Yang belum tersedia

- Belum ada repository/AppServices untuk domain Fund, Transaction, Category, Pocket, Automation, Notification, dan Dashboard.
- Layar Fund, Transaction, Pocket, dan Dashboard masih statis/placeholder.
- Data financial belum dibaca atau ditulis dari aplikasi ke Supabase.
- Belum ada alur Pocket, Automation, Notification, dan filter riwayat transaksi di UI.

### Kesimpulan

Back-end sudah jauh lebih lengkap daripada sekadar setup migration: seluruh RPC dan aturan
integritas sudah ada dan teruji. Pekerjaan berikutnya terutama adalah **menghubungkan UI ke
backend melalui lapisan repository dan AppServices**, bukan membuat migration baru. Migration
baru hanya boleh dibuat jika ada kebutuhan yang belum tercakup kontrak, dan tetap memerlukan
persetujuan eksplisit.

---

## 2. Prinsip yang mengikat seluruh fase

1. JavaScript only (`.js`/`.jsx`); tidak menambahkan TypeScript.
2. Expo Router; route hanya di `src/app/`, kode non-route di `src/modules/`, `src/appservices/`, `src/data/`, `src/config/`, `src/shared/`.
3. Alur wajib: **Presentation → AppServices → Repositories → Supabase/PostgreSQL**.
   UI tidak boleh mengimpor Supabase client secara langsung.
4. Semua mutasi finansial wajib melalui AppServices dan RPC di `docs/backend-contract.md`.
   Saldo Fund tidak boleh ditulis langsung dari UI.
5. Tanggal kalender lokal disimpan sebagai `timestamptz` pukul 12.00 waktu perangkat;
   agregasi dan filter memakai batas hari lokal.
6. Tidak ada mode offline. Semua data berasal dari Supabase lokal pada tahap ini.
7. Perubahan skema database wajib berupa migration yang ditinjau dan disetujui.
8. Setiap fase ditutup dengan laporan: file berubah, hasil tes, kendala, risiko, lalu
   menunggu persetujuan sebelum fase berikutnya dimulai.
9. Tidak melakukan `git commit`/`git push` tanpa instruksi eksplisit.

---

## 3. Fase 3 — Fondasi Data & Fund Management

**Status:** Selesai; demo manual di perangkat berhasil dan disetujui pengguna.

**Tujuan:** Menjadikan Fund dan Category sebagai domain pertama yang benar-benar
terhubung ke Supabase, sekaligus membangun pola repository/AppServices yang dipakai fase
berikutnya.

### Cakupan

- `src/data/repositories/fundRepository.js` dan `categoryRepository.js`.
- `src/appservices/fund/fundService.js` dan `src/appservices/category/categoryService.js`.
- Modul presentation `src/modules/funds/` (hook + komponen daftar/form) dan hook kategori.
- Layar Fund:
  - daftar Active Fund dan Savings/Goal Fund beserta saldo dari `v_fund_balances`;
  - buat Fund baru dengan nama, klasifikasi, dan Opening Balance;
  - ubah nama/klasifikasi; arsipkan, aktifkan kembali, dan hapus sesuai aturan;
  - konfirmasi untuk aksi destruktif, banner error dari `AppError`.
- Dashboard: tampilkan Active Balance dan daftar Active Fund dari `rpc_get_dashboard`
  (grafik pengeluaran masih kosong sampai Fase 4).
- categoryService hanya baca (`categories`), tidak ada UI kategori kustom.

### Acceptance criteria

- FUND-001 sampai FUND-021 di `docs/testing.md` dapat dilakukan dari UI.
- CAT-001 dan CAT-002 (daftar Category sistem) tampil sesuai tipe.
- Opening Balance tidak dapat diubah setelah Fund dibuat; saldo tidak berubah saat
  klasifikasi diubah.
- Archive ditolak bila saldo tidak nol; delete ditolak bila ada transaksi/referensi Pocket.
- Active Balance dihitung dari Active Fund saja.

### Pengujian

- Jest: validasi input dan pemetaan error `fundService`.
- pgTAP regression: `010_funds_test.sql`, `060_auth_rls_test.sql`, `070_integrity_test.sql`.
- Manual: matriks FUND dan CAT di `docs/testing.md`.

### Gate keluar

Lint, Jest, pgTAP, doctor, dan bundle Android lolos; demo UI Fund berhasil; laporan fase
disetujui.

### Status implementasi

- Repository Fund/Category/Dashboard + AppService terkait sudah dibuat.
- Layar Fund dan Dashboard sudah memakai data Supabase; Kategori sistem tampil read-only di Pengaturan.
- Verifikasi otomatis: lint bersih, 26 tes Jest lolos, 406 tes pgTAP lolos, doctor 20/20, export Android sukses.
- Demo manual FUND/CAT/DASH di perangkat berhasil; Fase 4 telah disetujui pengguna.

---

## 4. Fase 4 — Transaksi Inti, Riwayat & Dashboard Penuh

**Status:** Implementasi selesai; menunggu verifikasi manual di perangkat/emulator.

**Tujuan:** Pengguna dapat mencatat, mengubah, menghapus, dan meninjau Income, Expense,
dan Transfer standar dengan data nyata.

### Cakupan

- `src/data/repositories/transactionRepository.js` (query riwayat + RPC mutasi).
- `src/appservices/transaction/transactionService.js` sebagai satu-satunya jalur mutasi.
- Form transaksi:
  - pemilih jenis Income/Expense/Transfer;
  - nominal, tanggal (default hari ini, disimpan pukul 12.00 lokal), Fund sumber/tujuan,
    Category untuk Income/Expense tanpa Pocket;
  - validasi saldo, Fund archived, dan batasan Expense pada Active Fund.
- Edit & delete transaksi standalone: kontrol terhadap transaksi yang masih terhubung
  Pocket dan Income hasil Automation.
- Transaction history: daftar terbaru lebih dulu, filter jenis dan tanggal/bulan/rentang,
  tampilan detail.
- Dashboard: grafik Expense 7 hari kalender terakhir dari `rpc_get_dashboard`, refresh
  setelah mutasi.

### Acceptance criteria

- TRX-001–TRX-015, TRX-016–TRX-021, TRX-025–TRX-028, TRX-035–TRX-040, TRX-042–TRX-044
  dapat diverifikasi.
- Transfer tidak dihitung sebagai Income/Expense; Category dilarang pada Transfer.
- Expense dari `savings_goal` atau Fund archived ditolak.
- Penghapusan/edit yang membuat saldo negatif ditolak tanpa perubahan data.
- Grafik hanya Expense aktual; Planned Expense tidak masuk grafik.

### Pengujian

- Jest: validasi tanggal, nominal, dan aturan Category di `transactionService`.
- pgTAP regression: `020_transactions_test.sql`, `050_dashboard_test.sql`, `070_integrity_test.sql`.
- Manual: seluruh matriks TRX dan DASH di `docs/testing.md`.

### Gate keluar

Seluruh transaksi standar end-to-end; dashboard menampilkan angka dan grafik nyata;
laporan fase disetujui.

### Status implementasi

- Repository transaksi + AppService `transactionService` sudah dibuat; seluruh mutasi memakai RPC `0009_rpc_transactions.sql`.
- Layar Transaksi sudah mendukung buat, ubah, hapus, riwayat, filter jenis/periode, dan konfirmasi aksi destruktif.
- Dashboard sudah menampilkan grafik Expense tujuh hari dari `rpc_get_dashboard` tanpa library chart tambahan.
- Verifikasi otomatis: lint bersih, 36 tes Jest lolos, 406 tes pgTAP lolos, doctor 20/20, export Android sukses.
- Demo manual TRX/DASH di perangkat berhasil; Fase 5 telah disetujui pengguna.

---

## 5. Fase 5 — Pocket & Planned Expense

**Status:** Implementasi selesai; menunggu verifikasi manual di perangkat/emulator.

**Tujuan:** Mengelompokkan aktivitas keuangan dan menghubungkan Pocket ke transaksi
aktual tanpa mengubah saldo saat item dibuat.

### Cakupan

- `src/data/repositories/pocketRepository.js` dan `src/appservices/pocket/pocketService.js`.
- Modul `src/modules/pockets/` untuk daftar, detail, dan item.
- Pocket Income: buat item pending, konfirmasi ke Fund tujuan, hapus item pending.
- Pocket Expense: planned item, ubah/hapus item, konversi menjadi Expense Transaction,
  edit/hapus transaksi hasil konversi melalui halaman Pocket.
- Pocket Transfer: item langsung berupa Transfer Transaction, ringkasan
  incoming/outgoing/net dari `v_pocket_transfer_summary`, hapus item/transaksi.
- Pocket CRUD: buat, ubah tipe sebelum pernah ber-item, arsipkan/aktifkan, hapus permanen.
- Dashboard: outstanding Expense allocation mulai memengaruhi Active Balance.

### Acceptance criteria

- PCK-001 sampai PCK-040 dan TRX-022–TRX-024, TRX-029–TRX-034, TRX-041 terpenuhi.
- Membuat Pocket/item tidak mengubah saldo Fund; hanya Planned Expense yang menurunkan
  Active Balance.
- Konversi Planned Expense mempertahankan nominal item dan melepaskan alokasi.
- Pocket archived menolak item baru, tetapi item lama tetap dapat diproses.
- Menghapus Pocket tidak menghapus transaksi aktual; transaksi menjadi standalone dengan
  Category pengganti sesuai kontrak.

### Pengujian

- Jest: state transition item Pocket di `pocketService`.
- pgTAP regression: `030_pockets_test.sql`, `050_dashboard_test.sql`, `070_integrity_test.sql`.
- Manual: matriks PCK dan TRX terkait Pocket.

### Gate keluar

Alur Pocket end-to-end dan Active Balance konsisten sebelum dan sesudah konversi;
laporan fase disetujui.

### Status implementasi

- Repository Pocket + AppService `pocketService` sudah dibuat; seluruh mutasi memakai RPC `0010_rpc_pockets.sql` dan `rpc_update_pocket_transaction`/`rpc_delete_pocket_transaction`.
- Layar daftar dan detail Pocket sudah mendukung CRUD Pocket, item Income/Expense/Transfer, konfirmasi Income, konversi Planned Expense, ubah/hapus transaksi Pocket, arsip/aktifkan, ringkasan Transfer, dan alokasi Planned Expense.
- Tipe Pocket dikunci setelah pernah ber-item; Pocket arsip menolak item baru tetapi item lama tetap bisa diproses; nominal konversi Expense terkunci di UI dan ditegakkan backend.
- Perbaikan navigasi: `src/app/(app)/pockets/_layout.jsx` menambahkan Stack bersarang di tab Pocket. Sebelumnya rute `pockets/[id]` tidak memiliki tab dan otomatis di-redirect ke Dashboard oleh Expo Router SDK 58 sehingga halaman detail tidak pernah tampil.
- Perbaikan React key: key dialog/form Pocket dibuat unik per komponen (`item-form-*`, `fund-dialog-*`, `transaction-form-*`, `pocket-form-*`) untuk menghilangkan peringatan duplikat key `.$closed` di halaman detail Pocket.
- Perbaikan arsip/aktifkan Pocket: `src/app/(app)/pockets/index.jsx` meneruskan `pocket.id` ke `archivePocket`/`unarchivePocket`. Sebelumnya objek Pocket diteruskan sehingga validasi AppService menolaknya dengan `POCKET_NOT_FOUND` ("Pocket tidak ditemukan") sebelum RPC dipanggil.
- Verifikasi otomatis: lint bersih, 47 tes Jest lolos, 406 tes pgTAP lolos, doctor 20/20, export Android sukses.
- Belum terverifikasi: matriks manual PCK/TRX terkait Pocket di perangkat dan persetujuan pengguna untuk Fase 6.

---

## 6. Fase 6 — Automation & Notification

**Tujuan:** Mengurangi pencatatan berulang dengan occurrence yang diproses saat aplikasi
dibuka, serta kartu notifikasi persisten yang menunggu keputusan pengguna.

### Cakupan

- `automationRepository.js`, `notificationRepository.js`, `automationService.js`,
  `notificationService.js`.
- UI pengaturan Automation pada detail Pocket Item: buat, ubah jadwal/detail, hapus.
- Pemanggilan `rpc_process_due_automations` saat aplikasi aktif/fire base; batas 500
  occurrence per proses.
- Notification screen/cards dari `v_pending_notifications`; persist lintas restart.
- Confirm/reject occurrence:
  - Income: pilih Fund tujuan, peringatan transaksi tidak dapat dihapus;
  - Expense: pilih Active Fund, nominal occurrence dapat disesuaikan, validasi saldo.
- Hapus Automation: template, occurrence, dan notification ikut terhapus; transaksi aktual
  tetap bertahan sebagai transaksi biasa.

### Acceptance criteria

- Seluruh skenario Automation (weekly/every_two_weeks/monthly), including tanggal akhir
  bulan dan perubahan start date, sesuai `docs/testing.md` bagian 7.
- Satu occurrence maksimal satu transaksi; reject tidak menghentikan jadwal berikutnya.
- Notification hanya hilang setelah Confirm/Reject dan tetap ada saat aplikasi ditutup.
- Expense Automation menolak Fund `savings_goal`/archived/saldo kurang.

### Pengujian

- Jest: perhitungan jadwal dan state confirm/reject di `automationService`.
- pgTAP regression: `040_automations_test.sql`, `070_integrity_test.sql`.
- Manual: skenario AUT/NOT dan INT-004 (dua koneksi/klien) di luar pgTAP.

### Gate keluar

Automation dan Notification end-to-end di perangkat/emulator; laporan fase disetujui.

---

## 7. Fase 7 — Finalisasi MVP Lokal

**Tujuan:** Menutup MVP lokal dengan regresi penuh, perbaikan kualitas, dan kesiapan
build tanpa menyentuh production/cloud.

### Cakupan

- Konsistensi error handling, loading/empty state, accessibility label, dan keyboard.
- Ulang verifikasi zona waktu `occurred_at` dan batas agregasi harian lokal.
- Uji konkurensi manual INT-003/INT-004 dengan dua koneksi/klien.
- Regresi penuh: `npx expo lint`, `npm test`, `npx expo-doctor`, `npx supabase test db`,
  `npx expo export --platform android`.
- Jalankan seluruh matriks manual `docs/testing.md`; catat hasilnya.
- Perbarui status dokumen dari Draft menjadi Accepted bila semua kriteria terpenuhi.
- Opsi: siapkan profil EAS development dan environment variables lokal, tanpa build cloud
  sampai disetujui.

### Acceptance criteria

- Semua tes otomatis hijau dan matriks manual tidak memiliki blocker.
- Tidak ada jalur UI yang menulis ke Supabase secara langsung atau mengubah saldo Fund
  di luar RPC.
- Risiko residual terdokumentasi.

### Gate keluar

MVP lokal dinyatakan selesai dan disetujui pengguna.

---

## 8. Fase 8 — Opsional: Cloud & Distribusi

Tidak termasuk MVP lokal. Dilaksanakan hanya setelah Fase 7 disetujui.

- Buat/link proyek Supabase cloud, terapkan migration yang sudah ditinjau, pindahkan env
  dari nilai lokal ke nilai cloud melalui EAS environment variables.
- Bangun development build via EAS, uji Expo Update, lalu produksi build/submit bila
  benar-benar dibutuhkan.
- Pastikan RLS, publishable key, dan konfigurasi email confirmation cloud sesuai perilaku
  lokal.

---

## 9. Risiko lintas fase

| Risiko | Mitigasi |
|---|---|
| Perubahan skema tak sengaja selama implementasi UI | Semua mutasi tetap lewat RPC yang sudah ada; migration baru butuh persetujuan tertulis. |
| UI mengimpor Supabase langsung | Enforce lewat review kode + lint/struktur layer; repository adalah satu-satunya jalur. |
| Tanggal bergeser lintas timezone | Simpan `occurred_at` pukul 12.00 lokal; uji di emulator dengan zona waktu berbeda. |
| Device tidak bisa mengakses `127.0.0.1` | Gunakan IP LAN host di `.env` untuk perangkat fisik; dokumentasikan di README/FASE. |
| Konkurensi nyata tidak tercakup pgTAP | Uji manual dua koneksi/klien pada INT-003/INT-004. |
| Cakupan fase membengkak | Satu fase hanya boleh ditutup setelah gate keluar dan persetujuan pengguna. |

---

## 10. Urutan gate ringkas

```text
Fase 0 ✅ → Fase 1 ✅ → Fase 2 ✅ → Fase 3 ✅ → Fase 4 ✅ → Fase 5 (implementasi ✅, demo manual pending) → Fase 6 → Fase 7 → (Fase 8 opsional)
```

Setiap panah memerlukan persetujuan pengguna sebelum dieksekusi.
