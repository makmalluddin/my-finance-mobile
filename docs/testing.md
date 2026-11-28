# TESTING DOCUMENT
## Personal Finance Tracking Application

**Document Version:** 0.4  
**Document Status:** Accepted — matriks Fase 7A, Fase 7B, nama pengguna, dan sapaan Dashboard terverifikasi  
**Last Updated:** 28 November 2026  
**Platform:** Android (MVP)

---

# 1. Purpose

Dokumen ini berisi skenario pengujian untuk memastikan fitur aplikasi berjalan sesuai kebutuhan dan aturan yang telah ditetapkan.

Dokumen ini hanya memuat kondisi/input pengujian dan hasil yang diharapkan. Definisi fitur dan alur pengguna mengacu pada `prd.md`, struktur data mengacu pada `database.md`, sedangkan rancangan teknis mengacu pada `sdd.md`.

# 2. Authentication and User Access

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| AUTH-001 | Pengguna berhasil masuk | Kredensial valid | Pengguna berhasil masuk dan dapat mengakses data miliknya |
| AUTH-002 | Pengguna gagal masuk | Kredensial tidak valid | Akses ditolak dan pesan kesalahan ditampilkan |
| AUTH-003 | Pengguna mengakses data milik pengguna lain | Request menggunakan data yang bukan miliknya | Akses ditolak |
| AUTH-004 | Akun pengguna dihapus melalui backend | Akun dihapus di sisi backend/Supabase Auth (tidak ada layar penghapusan akun pada MVP) | Seluruh data milik pengguna ikut terhapus sesuai aturan cascade |

# 3. Fund Management

## 3.1 Fund Creation and Information

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| FUND-001 | Membuat Fund tanpa Opening Balance | Nama Fund valid, Opening Balance 0 | Fund berhasil dibuat dengan saldo awal 0 |
| FUND-002 | Membuat Fund dengan Opening Balance | Nama Fund valid, Opening Balance lebih dari 0 | Fund berhasil dibuat dan saldo sesuai Opening Balance |
| FUND-003 | Membuat Fund dengan nama kosong | Nama Fund kosong | Fund tidak dibuat dan validasi ditampilkan |
| FUND-004 | Mengubah informasi Fund | Nama atau klasifikasi Fund diubah dengan data valid | Informasi Fund berhasil diperbarui |
| FUND-005 | Mengubah klasifikasi Active menjadi Savings/Goal | Fund berstatus Active | Klasifikasi berubah dan Active Balance dihitung ulang |
| FUND-006 | Mengubah klasifikasi Savings/Goal menjadi Active | Fund berstatus Savings/Goal | Klasifikasi berubah dan Active Balance dihitung ulang |
| FUND-007 | Mengubah Opening Balance setelah Fund dibuat | Fund sudah tersimpan | Perubahan Opening Balance ditolak |

## 3.2 Fund Balance

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| FUND-008 | Menghitung saldo Fund dari Opening Balance | Opening Balance 1.000.000 dan belum ada transaksi | Saldo Fund 1.000.000 |
| FUND-009 | Menghitung saldo setelah Income | Saldo awal 1.000.000 dan Income 500.000 | Saldo Fund 1.500.000 |
| FUND-010 | Menghitung saldo setelah Expense | Saldo awal 1.000.000 dan Expense 200.000 | Saldo Fund 800.000 |
| FUND-011 | Menghitung saldo setelah Transfer masuk | Saldo awal 1.000.000 dan Transfer masuk 300.000 | Saldo Fund 1.300.000 |
| FUND-012 | Menghitung saldo setelah Transfer keluar | Saldo awal 1.000.000 dan Transfer keluar 300.000 | Saldo Fund 700.000 |
| FUND-013 | Menghitung saldo setelah beberapa transaksi | Opening Balance 1.000.000, Income 500.000, Expense 200.000, Transfer net masuk 100.000 | Saldo Fund 1.400.000 |

## 3.3 Fund Archive and Deletion

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| FUND-014 | Mengarsipkan Fund dengan saldo 0 dan tanpa referensi Pocket Item | Fund tidak memiliki saldo dan tidak direferensikan Pocket Item | Fund berhasil diarsipkan |
| FUND-015 | Mengarsipkan Fund dengan saldo tersisa | Saldo Fund lebih dari 0 | Pengarsipan ditolak |
| FUND-016 | Mengarsipkan Fund yang direferensikan Pocket Item | Fund menjadi Fund default pada template Automation Pocket Item | Pengarsipan ditolak dan alasan ditampilkan |
| FUND-017 | Menggunakan Fund archived untuk transaksi baru | Fund berstatus archived | Transaksi ditolak |
| FUND-018 | Mengaktifkan kembali Fund archived | Fund archived | Fund berhasil diaktifkan kembali |
| FUND-019 | Menghapus Fund tanpa transaksi dan tanpa referensi Pocket Item | Fund tidak memiliki transaksi dan tidak direferensikan Pocket Item | Fund berhasil dihapus |
| FUND-020 | Menghapus Fund yang memiliki transaksi | Fund memiliki minimal satu transaksi | Penghapusan ditolak |
| FUND-021 | Menghapus Fund yang direferensikan Pocket Item | Fund menjadi Fund default pada template Automation Pocket Item | Penghapusan ditolak dan alasan ditampilkan |

# 4. Transaction Management

## 4.1 Transaction Creation

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| TRX-001 | Membuat Income valid | Amount lebih dari 0, Fund tujuan aktif, Category valid jika diperlukan | Income berhasil dicatat dan saldo Fund tujuan bertambah |
| TRX-002 | Membuat Expense valid | Amount lebih dari 0, Fund sumber berklasifikasi Active dan tidak diarsipkan, saldo mencukupi, Category valid jika diperlukan | Expense berhasil dicatat dan saldo Fund sumber berkurang |
| TRX-003 | Membuat Transfer valid | Amount lebih dari 0, dua Fund tidak diarsipkan dan berbeda, saldo sumber mencukupi | Transfer berhasil dicatat; saldo sumber berkurang dan saldo tujuan bertambah |
| TRX-004 | Membuat transaksi dengan amount 0 | Amount 0 | Transaksi ditolak |
| TRX-005 | Membuat transaksi dengan amount negatif | Amount kurang dari 0 | Transaksi ditolak |
| TRX-006 | Membuat Expense melebihi saldo | Amount lebih besar dari saldo Fund sumber | Transaksi ditolak dan saldo tidak berubah |
| TRX-007 | Membuat Transfer melebihi saldo sumber | Amount lebih besar dari saldo Fund sumber | Transfer ditolak dan kedua saldo tidak berubah |
| TRX-008 | Membuat Transfer dengan Fund sumber dan tujuan sama | ID Fund sumber sama dengan ID Fund tujuan | Transfer ditolak |
| TRX-009 | Membuat transaksi menggunakan Fund archived | Fund sumber atau tujuan berstatus archived | Transaksi ditolak |
| TRX-010 | Membuat Income tanpa Category dan tanpa Pocket | Category tidak dipilih | Transaksi ditolak |
| TRX-011 | Membuat Expense tanpa Category dan tanpa Pocket | Category tidak dipilih | Transaksi ditolak |
| TRX-012 | Membuat Transfer tanpa Category dan tanpa Pocket | Category tidak dipilih | Transfer dapat dicatat jika data lainnya valid |
| TRX-013 | Membuat transaksi dengan Pocket dan Category sekaligus | Pocket dan Category sama-sama dipilih | Transaksi ditolak |
| TRX-014 | Membuat transaksi dengan tanggal yang diubah | Tanggal transaksi valid dan bukan tanggal hari ini | Transaksi tercatat menggunakan tanggal yang dipilih |
| TRX-015 | Membuat transaksi tanpa mengubah tanggal | Tanggal tidak diubah oleh pengguna | Tanggal transaksi menggunakan tanggal saat ini |
| TRX-042 | Membuat Expense dari Savings/Goal Fund | Fund sumber berklasifikasi `savings_goal` | Transaksi ditolak dengan alasan Fund sumber harus Active Fund; saldo tidak berubah |

## 4.2 Transaction Update

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| TRX-016 | Mengubah nominal Income | Nominal baru lebih dari 0 | Transaksi diperbarui dan saldo Fund mencerminkan nominal terbaru |
| TRX-017 | Mengubah nominal Expense | Nominal baru valid dan saldo mencukupi | Transaksi diperbarui dan saldo Fund konsisten |
| TRX-018 | Mengubah Fund pada transaksi | Fund tujuan atau sumber diganti dengan Fund valid yang tidak diarsipkan; untuk Expense, Fund sumber baru wajib berklasifikasi Active | Transaksi diperbarui dan dampak saldo pada Fund terkait konsisten |
| TRX-019 | Mengubah Transfer | Fund sumber, tujuan, atau nominal diubah dengan data valid | Transaksi diperbarui dan kedua saldo konsisten |
| TRX-020 | Mengubah transaksi sehingga saldo tidak mencukupi | Perubahan menyebabkan saldo Fund sumber tidak mencukupi | Perubahan ditolak dan data transaksi serta saldo tetap seperti semula |
| TRX-021 | Mengubah transaksi dengan amount 0 atau negatif | Amount tidak valid | Perubahan ditolak |
| TRX-022 | Mengubah transaksi Pocket melalui Transaction History | Transaksi masih terhubung dengan Pocket | Perubahan melalui Transaction History ditolak |
| TRX-023 | Mengubah transaksi Pocket melalui halaman Pocket | Nominal (kecuali Expense hasil konversi), tanggal, atau Fund diubah dengan data valid | Transaksi diperbarui melalui Transaction Service; nominal Pocket Item Income tanpa Automation atau Transfer ikut diperbarui |
| TRX-024 | Mengubah Income hasil Automation | Nominal, tanggal, atau Fund tujuan diubah dengan data valid | Transaksi berhasil diperbarui, saldo Fund mencerminkan perubahan terbaru, dan identitas asal Automation tetap dipertahankan |
| TRX-043 | Mengubah Fund sumber Expense menjadi Savings/Goal Fund | Fund sumber baru berklasifikasi `savings_goal` | Perubahan ditolak; transaksi dan saldo tetap seperti semula |

## 4.3 Transaction Deletion

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| TRX-025 | Menghapus Income biasa | Income bukan hasil Automation | Transaksi dihapus dan saldo Fund tujuan berkurang sesuai nominal transaksi |
| TRX-026 | Menghapus Expense biasa | Expense dapat dihapus | Transaksi dihapus dan dampak pengurangan saldo dibatalkan |
| TRX-027 | Menghapus Transfer biasa | Transfer dapat dihapus | Transaksi dihapus dan dampak pada kedua Fund dibatalkan |
| TRX-028 | Menghapus transaksi Pocket melalui Transaction History | Transaksi masih terhubung dengan Pocket | Penghapusan melalui Transaction History ditolak |
| TRX-029 | Menghapus transaksi Pocket melalui halaman Pocket | Transaksi dapat dihapus menurut aturan produknya | Transaksi dihapus melalui Transaction Service, dampak saldo dibatalkan, dan status item mengikuti siklus Pocket Item (lihat TRX-033 dan TRX-034) |
| TRX-030 | Menghapus Income hasil Automation | Transaksi berasal dari Income Automation | Penghapusan ditolak |
| TRX-031 | Menghapus Transfer Pocket | Transfer terhubung dengan Transfer Pocket | Transaksi dan Pocket Item terkait dihapus; dampak saldo kedua Fund dibatalkan |
| TRX-032 | Menghapus transaksi yang tidak ditemukan | ID transaksi tidak valid atau tidak ditemukan | Penghapusan ditolak dan data lain tidak berubah |
| TRX-033 | Menghapus Income Pocket tanpa Automation yang sudah dikonfirmasi melalui halaman Pocket | Item berstatus confirmed | Transaksi dihapus, saldo Fund tujuan dikurangi, dan item kembali pending |
| TRX-034 | Menghapus Expense hasil konversi melalui halaman Pocket | Item berstatus converted | Transaksi dihapus, saldo Fund sumber dipulihkan, item kembali planned, dan alokasi kembali dihitung |
| TRX-035 | Mengubah jenis transaksi | Pengguna mencoba mengganti Income menjadi Expense atau sebaliknya | Perubahan ditolak |
| TRX-036 | Mengubah nominal Expense hasil konversi | Nominal diubah menjadi nilai berbeda dari nominal item | Perubahan ditolak; nominal tetap sama dengan item |
| TRX-037 | Menghapus Income yang membuat saldo negatif | Dana Income sudah terpakai sehingga pembalikan membuat saldo Fund tujuan negatif | Penghapusan ditolak; transaksi dan saldo tetap |
| TRX-038 | Mengurangi nominal atau mengganti Fund pada Income yang membuat saldo negatif | Perubahan membuat saldo Fund mana pun negatif | Perubahan ditolak; transaksi dan saldo tetap |
| TRX-039 | Menghapus Transfer yang membuat saldo Fund tujuan negatif | Dana Transfer sudah terpakai pada Fund tujuan | Penghapusan ditolak; kedua saldo tetap |
| TRX-040 | Mengubah nominal transaksi dari Income Pocket tanpa Automation atau Transfer Pocket | Nominal baru valid | Transaksi diperbarui dan nominal Pocket Item terkait ikut diperbarui |
| TRX-041 | Menghapus Income hasil Automation setelah Pocket dihapus | Transaksi sudah menjadi transaksi biasa tanpa Pocket | Penghapusan mengikuti aturan transaksi biasa dan dapat dilakukan |
| TRX-044 | Menghapus Expense hasil Automation | Transaksi berasal dari occurrence Expense Automation yang sudah confirmed | Transaksi dihapus, saldo Fund sumber dipulihkan, occurrence terkait ikut dihapus, dan item template tetap tersedia untuk periode berikutnya |

# 5. Category

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| CAT-001 | Mengambil Category Income | Meminta daftar Category Income | Daftar Category Income sistem ditampilkan |
| CAT-002 | Mengambil Category Expense | Meminta daftar Category Expense | Daftar Category Expense sistem ditampilkan |
| CAT-003 | Memilih Category yang sesuai | Category sesuai tipe transaksi | Transaksi dapat diproses jika syarat lain terpenuhi |
| CAT-004 | Memilih Category yang tidak sesuai | Category tidak sesuai tipe transaksi | Transaksi ditolak |
| CAT-005 | Menggunakan Category pada transaksi Pocket | Pocket dipilih bersama Category | Transaksi ditolak |

# 6. Pocket Management

## 6.1 Pocket Creation and Information

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-001 | Membuat Income Pocket | Nama valid, tipe Income | Pocket berhasil dibuat tanpa perubahan saldo Fund |
| PCK-002 | Membuat Expense Pocket | Nama valid, tipe Expense | Pocket berhasil dibuat tanpa perubahan saldo Fund |
| PCK-003 | Membuat Transfer Pocket | Nama valid, tipe Transfer | Pocket berhasil dibuat tanpa perubahan saldo Fund |
| PCK-004 | Membuat Pocket dengan deskripsi | Nama dan deskripsi valid | Pocket tersimpan dengan deskripsi |
| PCK-005 | Membuat Pocket tanpa deskripsi | Nama valid, deskripsi kosong | Pocket berhasil dibuat |
| PCK-006 | Membuat Pocket dengan nama kosong | Nama kosong | Pocket tidak dibuat |
| PCK-007 | Mengubah tipe Pocket sebelum memiliki item | Pocket belum pernah memiliki item | Tipe Pocket dapat diubah |
| PCK-008 | Mengubah tipe Pocket setelah pernah memiliki item | Pocket pernah memiliki item | Perubahan tipe ditolak, termasuk jika item sebelumnya telah dihapus |
| PCK-009 | Mengarsipkan Pocket | Pocket aktif | Pocket berhasil diarsipkan dan riwayat tetap tersedia |
| PCK-010 | Menambahkan item ke Pocket archived | Pocket berstatus archived | Penambahan item ditolak |
| PCK-011 | Mengaktifkan kembali Pocket archived | Pocket archived | Pocket berhasil diaktifkan kembali |
| PCK-040 | Mengelola item pada Pocket archived | Pocket archived memiliki item Income pending, Expense planned, atau Transfer | Item yang sudah ada tetap dapat dikonfirmasi, dikonversi, diubah, atau dihapus; penambahan item baru tetap ditolak |

## 6.2 Income Pocket

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-012 | Menambahkan Income Item tanpa Automation | Nama dan amount valid | Item berstatus pending; belum ada Income Transaction dan saldo Fund tidak berubah |
| PCK-013 | Mengonfirmasi Income Item pending | Item pending; pengguna memilih Fund tujuan yang tidak diarsipkan | Income Transaction tercatat, saldo Fund tujuan bertambah, dan item berstatus confirmed |
| PCK-014 | Menambahkan Expense ke Income Pocket | Tipe transaksi Expense | Penambahan ditolak |
| PCK-015 | Mengonfirmasi beberapa Income Item ke Fund berbeda | Setiap item pending dikonfirmasi dengan Fund tujuan yang berbeda | Setiap Income Transaction tercatat pada Fund tujuan yang dipilih masing-masing |

## 6.3 Expense Pocket

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-016 | Menambahkan Planned Expense Item | Amount valid | Item berstatus planned; saldo Fund tidak berubah dan Active Balance berkurang sebesar alokasi |
| PCK-017 | Menambahkan beberapa Planned Expense Item | Beberapa item dengan nominal valid | Total alokasi dihitung dari seluruh item planned |
| PCK-018 | Mengubah Planned Expense Item | Item masih planned dan nominal baru valid | Nominal item diperbarui dan alokasi dihitung ulang |
| PCK-019 | Menghapus Planned Expense Item | Item berstatus planned | Item dihapus dan alokasi dilepaskan; saldo Fund tidak berubah |
| PCK-020 | Mengonversi Planned Expense menjadi transaksi aktual | Amount sama dengan nominal item dan saldo Fund sumber mencukupi | Expense Transaction tercatat, item menjadi converted, saldo Fund berkurang, dan alokasi dilepaskan |
| PCK-021 | Mengonversi Planned Expense dengan saldo tidak mencukupi | Saldo Fund sumber kurang dari nominal | Konversi ditolak; item tetap planned dan saldo tidak berubah |
| PCK-022 | Mengubah nominal saat konversi Expense biasa | Nominal konversi berbeda dari nominal item | Konversi ditolak; nominal transaksi harus sama dengan item |
| PCK-023 | Mengonversi item yang sudah converted | Item berstatus converted | Konversi kedua ditolak |
| PCK-024 | Mengubah item Expense setelah converted | Item berstatus converted | Perubahan item ditolak |
| PCK-025 | Menghitung Active Balance setelah konversi | Active Balance sebelum konversi sudah memperhitungkan alokasi planned | Active Balance tetap sama setelah konversi berhasil, selama tidak ada perubahan lain |
| PCK-039 | Mengonversi Planned Expense dari Savings/Goal Fund | Fund sumber berklasifikasi `savings_goal` | Konversi ditolak; item tetap planned dan saldo Fund tidak berubah |

## 6.4 Transfer Pocket

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-026 | Menambahkan Transfer Item | Fund sumber dan tujuan tidak diarsipkan dan berbeda, saldo mencukupi | Transfer tercatat dan kedua saldo berubah sesuai arah transfer |
| PCK-027 | Menambahkan Transfer dengan saldo tidak mencukupi | Saldo Fund sumber kurang dari nominal | Transfer ditolak dan kedua saldo tidak berubah |
| PCK-028 | Menampilkan incoming Transfer | Dana masuk ke Fund tujuan dalam Pocket | Nominal masuk dihitung sebagai incoming |
| PCK-029 | Menampilkan outgoing Transfer | Dana keluar dari Fund sumber dalam Pocket | Nominal keluar dihitung sebagai outgoing |
| PCK-030 | Menghitung net Transfer | Terdapat incoming dan outgoing | Net Transfer ditampilkan berdasarkan selisih incoming dan outgoing |
| PCK-031 | Menghapus Transfer Item | Item memiliki transaksi Transfer yang dapat dihapus | Transaksi dan item terkait dihapus; dampak saldo kedua Fund dibatalkan |
| PCK-032 | Menghapus satu Transfer Item dari beberapa item | Pocket memiliki beberapa Transfer Item | Hanya item dan transaksi yang dipilih yang dihapus |

## 6.5 Pocket Deletion

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-033 | Menghapus Pocket tanpa transaksi aktual | Pocket hanya memiliki item yang belum menjadi transaksi aktual atau kosong | Pocket dan item terkait dihapus; alokasi planned dilepaskan |
| PCK-034 | Menghapus Pocket dengan transaksi aktual | Pocket memiliki transaksi aktual | Pocket dan Pocket Item dihapus; transaksi aktual tetap ada sebagai transaksi standalone dengan Category Other Income (Income) atau Other (Expense), Transfer tanpa Category, dan saldo tidak berubah |
| PCK-035 | Menghapus Pocket dengan Expense planned | Pocket memiliki Planned Expense Item | Planned Expense Item dihapus dan alokasi dilepaskan |
| PCK-036 | Melihat transaksi setelah Pocket dihapus | Transaksi aktual sebelumnya terhubung ke Pocket | Transaksi tetap terlihat di Transaction History tanpa hubungan Pocket |

## 6.6 Pocket Item Deletion

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| PCK-037 | Menghapus Income Item pending | Item berstatus pending | Item dihapus dan saldo Fund tidak berubah |
| PCK-038 | Menghapus Income Item confirmed secara langsung | Item berstatus confirmed | Penghapusan ditolak; pengguna harus menghapus transaksinya melalui halaman Pocket |

# 7. Automation

## 7.1 Automation Configuration and Scheduling

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| AUTO-001 | Membuat Income Automation | Pocket Item Income baru dengan Automation dan jadwal valid | Automation dibuat bersamaan dengan item yang langsung berstatus template |
| AUTO-002 | Membuat Expense Automation | Pocket Item Expense baru dengan Automation dan jadwal valid | Automation dibuat bersamaan dengan item yang langsung berstatus template |
| AUTO-003 | Membuat Automation untuk Transfer Pocket | Tipe Pocket Transfer | Pembuatan Automation ditolak |
| AUTO-004 | Menjalankan jadwal mingguan | Jadwal weekly mencapai waktu eksekusi | Satu occurrence dibuat untuk periode tersebut |
| AUTO-005 | Menjalankan jadwal dua mingguan | Jadwal every two weeks mencapai waktu eksekusi | Satu occurrence dibuat untuk periode tersebut |
| AUTO-006 | Menjalankan jadwal bulanan pada tanggal tersedia | Tanggal jadwal tersedia pada bulan tersebut | Occurrence dibuat pada tanggal jadwal |
| AUTO-007 | Menjalankan jadwal bulanan pada tanggal yang tidak tersedia | Jadwal tanggal 31 pada bulan yang hanya memiliki 30 hari | Occurrence dibuat pada hari terakhir bulan tersebut |
| AUTO-008 | Mengubah tanggal mulai Automation | Tanggal mulai baru valid | Jadwal berikutnya dihitung berdasarkan tanggal mulai baru |
| AUTO-009 | Mempertahankan timezone Automation | Timezone perangkat berubah tanpa perubahan manual pada Automation | Jadwal tetap menggunakan timezone yang tersimpan |
| AUTO-010 | Memeriksa jadwal ketika aplikasi dibuka | Ada jadwal yang telah jatuh tempo | Sistem membuat occurrence yang belum terbentuk |
| AUTO-011 | Memproses beberapa periode yang terlewat | Aplikasi tidak dibuka selama beberapa periode jadwal | Satu occurrence dan satu Notification dibuat untuk setiap periode yang terlewat |
| AUTO-012 | Menjalankan pemeriksaan jadwal berulang | Periode yang sama sudah memiliki occurrence | Occurrence duplikat tidak dibuat |

## 7.2 Income Automation Confirmation

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| AUTO-013 | Mengonfirmasi Income Automation | Occurrence pending dan pengguna memilih Confirm | Satu Income Transaction tercatat dan saldo Fund tujuan bertambah |
| AUTO-014 | Menolak Income Automation | Occurrence pending dan pengguna memilih Reject | Tidak ada Income Transaction yang dibuat |
| AUTO-015 | Menutup aplikasi sebelum konfirmasi | Notification masih pending | Kartu konfirmasi tetap tersedia ketika aplikasi dibuka kembali |
| AUTO-016 | Mengonfirmasi Income Automation berulang kali | Confirm dikirim lebih dari satu kali untuk occurrence sama | Hanya satu Income Transaction yang tercatat |
| AUTO-017 | Menghapus Income hasil Automation | Transaksi berasal dari Income Automation | Penghapusan ditolak |
| AUTO-018 | Menampilkan peringatan sebelum konfirmasi Income | Pengguna membuka kartu Income Automation | Peringatan bahwa transaksi setelah dikonfirmasi tidak dapat dihapus ditampilkan |

## 7.3 Expense Automation Confirmation

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| AUTO-019 | Mengonfirmasi Expense Automation | Occurrence pending, nominal template valid, saldo mencukupi | Satu Expense Transaction tercatat dan saldo Fund sumber berkurang |
| AUTO-020 | Mengubah nominal pada konfirmasi Expense | Nominal occurrence diubah menjadi nilai valid | Transaksi menggunakan nominal yang dikonfirmasi; nominal template tidak berubah |
| AUTO-021 | Menolak Expense Automation | Occurrence pending dan pengguna memilih Reject | Tidak ada Expense Transaction yang dibuat |
| AUTO-022 | Mengonfirmasi Expense dengan saldo tidak mencukupi | Saldo Fund sumber kurang dari nominal konfirmasi | Transaksi ditolak, saldo tidak berubah, dan occurrence tetap pending |
| AUTO-023 | Mengonfirmasi Expense Automation berulang kali | Confirm dikirim lebih dari satu kali untuk occurrence sama | Hanya satu Expense Transaction yang tercatat |
| AUTO-035 | Mengonfirmasi Expense occurrence dengan Savings/Goal Fund | Pengguna memilih Fund `savings_goal` sebagai Fund sumber | Konfirmasi ditolak, occurrence tetap pending, dan tidak ada transaksi dibuat |
| AUTO-036 | Mengonfirmasi Expense occurrence dengan Fund archived | Pengguna memilih Fund yang diarsipkan | Konfirmasi ditolak, occurrence tetap pending, dan tidak ada transaksi dibuat |

## 7.4 Notification and Automation Deletion

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| AUTO-024 | Menampilkan Notification pending | Occurrence belum dikonfirmasi atau ditolak | Kartu Notification ditampilkan |
| AUTO-025 | Menutup aplikasi dengan Notification pending | Pengguna belum memilih Confirm atau Reject | Notification tetap tersimpan tanpa expiry otomatis |
| AUTO-026 | Menyelesaikan konfirmasi | Occurrence berhasil dikonfirmasi | Notification terkait dihapus |
| AUTO-027 | Menolak occurrence | Pengguna memilih Reject | Notification terkait dihapus dan tidak ada transaksi dibuat |
| AUTO-028 | Menghapus Automation dengan occurrence pending | Automation memiliki occurrence dan Notification pending | Item template, occurrence, dan Notification dihapus |
| AUTO-029 | Menghapus Automation yang pernah menghasilkan transaksi | Automation memiliki transaksi aktual sebelumnya | Transaksi aktual tetap dipertahankan sebagai transaksi tanpa Pocket dengan Category Other Income atau Other |
| AUTO-030 | Menghapus occurrence yang memiliki transaksi aktual | Occurrence sudah menghasilkan transaksi | Transaksi aktual tetap ada dan tidak ikut terhapus |
| AUTO-031 | Menambahkan Automation pada Pocket Item yang sudah ada | Item Income atau Expense tanpa Automation sudah tersimpan | Penambahan ditolak; Automation hanya dapat dipilih saat item dibuat |
| AUTO-032 | Mengubah nominal pada konfirmasi Income Automation | Pengguna mencoba mengubah nominal occurrence Income | Perubahan ditolak; transaksi menggunakan nominal template |
| AUTO-033 | Mengganti Fund default pada konfirmasi | Pengguna memilih Fund aktif selain Fund default template | Transaksi (Income atau Expense) tercatat pada Fund yang dipilih saat konfirmasi |
| AUTO-034 | Menghapus Automation menghapus item template | Automation dengan item template | Item template ikut dihapus dan tidak pernah dihitung sebagai alokasi; Active Balance tidak berubah |

# 8. Dashboard and Financial Summary

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| DASH-001 | Menghitung Active Balance | Terdapat Active Fund dan Savings/Goal Fund | Hanya saldo Active Fund yang dihitung sebelum pengurangan alokasi |
| DASH-002 | Mengurangi Active Balance dengan Expense allocation | Terdapat Expense Pocket Item berstatus planned | Active Balance berkurang sebesar total alokasi planned |
| DASH-003 | Tidak menghitung template Automation sebagai allocation | Terdapat Expense Automation template | Template tidak mengurangi Active Balance |
| DASH-004 | Memperbarui Active Balance setelah Expense dikonversi | Planned Expense berhasil menjadi Expense aktual | Active Balance tetap sama jika tidak ada perubahan lain |
| DASH-005 | Memperbarui Active Balance setelah Transfer Active ke Savings/Goal | Transfer berhasil dari Active Fund ke Savings/Goal Fund | Active Balance berkurang sesuai nominal Transfer |
| DASH-006 | Memperbarui Active Balance setelah Transfer Savings/Goal ke Active | Transfer berhasil dari Savings/Goal Fund ke Active Fund | Active Balance bertambah sesuai nominal Transfer |
| DASH-007 | Menampilkan grafik Expense tujuh hari | Terdapat Expense aktual dalam tujuh hari kalender terakhir termasuk hari ini | Grafik menampilkan total Expense per hari |
| DASH-008 | Mengecualikan Income dari grafik Expense | Terdapat Income dalam periode grafik | Income tidak masuk perhitungan grafik Expense |
| DASH-009 | Mengecualikan Transfer dari grafik Expense | Terdapat Transfer dalam periode grafik | Transfer tidak masuk perhitungan grafik Expense |
| DASH-010 | Mengecualikan Planned Expense dari grafik Expense | Terdapat Planned Expense yang belum dikonversi | Planned Expense tidak masuk perhitungan grafik |
| DASH-011 | Memperbarui Dashboard setelah transaksi berubah | Transaksi dibuat, diubah, atau dihapus | Data Dashboard mencerminkan kondisi terbaru |
| DASH-012 | Menghitung saldo seluruh Fund tanpa menghitung Pocket sebagai aset | Fund dan Pocket memiliki transaksi terkait | Saldo hanya berasal dari Fund; Pocket tidak dihitung sebagai aset tambahan |
| DASH-013 | Mengelompokkan grafik berdasarkan tanggal lokal | Expense tercatat pada tanggal lokal tertentu di zona waktu perangkat | Expense masuk ke bucket hari yang sesuai dan tanggal transaksi tidak bergeser setelah aplikasi dibuka ulang |

# 9. Transaction History

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| HIST-001 | Menampilkan seluruh transaksi | Pengguna membuka Transaction History | Transaksi pengguna ditampilkan |
| HIST-002 | Mengurutkan transaksi | Terdapat beberapa transaksi dengan tanggal berbeda | Transaksi terbaru ditampilkan lebih dahulu |
| HIST-003 | Memfilter berdasarkan tipe Income | Filter Income dipilih | Hanya Income yang ditampilkan |
| HIST-004 | Memfilter berdasarkan tipe Expense | Filter Expense dipilih | Hanya Expense yang ditampilkan |
| HIST-005 | Memfilter berdasarkan tipe Transfer | Filter Transfer dipilih | Hanya Transfer yang ditampilkan |
| HIST-006 | Memfilter berdasarkan bulan atau rentang tanggal | Pengguna memilih periode valid | Hanya transaksi dalam periode tersebut yang ditampilkan |
| HIST-007 | Menampilkan transaksi yang terhubung dengan Pocket | Terdapat transaksi Pocket | Transaksi tetap tampil dengan informasi Pocket selama Pocket masih ada |
| HIST-008 | Menampilkan transaksi setelah Pocket dihapus | Pocket telah dihapus, transaksi aktual dipertahankan | Transaksi tampil sebagai transaksi standalone dengan Category pengganti (Other Income atau Other; Transfer tanpa Category) |
| HIST-009 | Membuka detail transaksi | Pengguna memilih salah satu transaksi | Detail transaksi yang dipilih ditampilkan |

# 10. Reliability and Data Integrity

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| INT-001 | Kegagalan operasi saat membuat Expense | Backend gagal sebelum operasi selesai | Tidak ada transaksi parsial dan saldo tidak berubah sebagian |
| INT-002 | Kegagalan operasi saat membuat Transfer | Salah satu bagian operasi gagal | Seluruh operasi dibatalkan; kedua saldo tetap konsisten |
| INT-003 | Dua Expense berjalan bersamaan | Dua request menggunakan Fund yang sama dan total nominal melebihi saldo | Tidak ada saldo negatif; hanya operasi yang memenuhi saldo yang berhasil |
| INT-004 | Dua konfirmasi pada occurrence yang sama | Dua request Confirm berjalan bersamaan | Maksimal satu transaksi aktual dibuat |
| INT-005 | Request dikirim ulang setelah timeout | Request transaksi yang sama dikirim ulang | Sistem tidak menghasilkan pencatatan ganda untuk operasi yang dilindungi idempotency |
| INT-006 | Akses data tanpa otorisasi | Request tidak memiliki sesi valid | Akses ditolak |
| INT-007 | Mengakses ID data pengguna lain | Request memakai ID milik pengguna lain | Akses ditolak |
| INT-008 | Menghapus Pocket yang memiliki transaksi aktual | Pocket dan transaksi aktual terkait dihapus sesuai aturan | Transaksi aktual tetap ada dan saldo Fund tidak berubah akibat penghapusan Pocket |
| INT-009 | Menghapus Automation dengan transaksi yang telah dibuat | Automation dan occurrence terkait dihapus | Transaksi aktual tetap dipertahankan |
| INT-010 | Menjaga konsistensi setelah perubahan transaksi | Transaksi diedit atau dihapus | Perhitungan saldo Fund dan Dashboard mencerminkan data transaksi terbaru |

# 11. Fase 7A — UI, Tema & Navigasi

Skenario berikut menguji hasil Fase 7A dan Amandemen 7A (UI-only). Notifikasi diakses dari tombol
lonceng di Dashboard, bukan dari tab.

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| UI-001 | Membuka Notifikasi dari Dashboard | Pengguna menekan tombol lonceng di header kanan Dashboard | Halaman Notifikasi terbuka dan tab bar tidak ditampilkan |
| UI-002 | Badge Notifikasi | Terdapat occurrence pending; kemudian semua notifikasi selesai | Angka badge sesuai jumlah notifikasi pending dan badge hilang bila tidak ada notifikasi |
| UI-003 | Kembali dari Notifikasi | Pengguna menekan tombol back di halaman Notifikasi | Kembali ke Dashboard |
| UI-004 | Navigasi tab | Pengguna membuka aplikasi | Hanya lima tab: Dashboard, Transaksi, Pocket, Fund, Pengaturan; tidak ada slot kosong |
| UI-005 | Dialog Notifikasi | Notifikasi pending tersedia; pengguna memilih Tolak atau Konfirmasi | Dialog tetap berfungsi seperti sebelum Fase 7A |
| UI-006 | Konsistensi visual | Pengguna meninjau seluruh layar setelah perubahan tema | Radius, jarak, dan tipografi mengikuti token; tidak ada warna baru |

# 12. Fase 7B — Adopsi Mockup & Improvement Akun

Skenario berikut menguji hasil Fase 7B (UI-only) dan improvement pasca-adopsi: nama pengguna
serta sapaan Dashboard yang mengikuti jam perangkat.

## 12.1 Adopsi mockup

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| UI-101 | Dashboard | Pengguna membuka Dashboard | Header, Active Balance, Active Fund, dan grafik Expense tujuh hari sesuai mockup |
| UI-102 | Transaksi | Pengguna membuka halaman Transaksi | Daftar dan form transaksi mengikuti mockup; tombol aksi tetap tersedia |
| UI-103 | Pocket | Pengguna membuka daftar Pocket | Kartu Pocket, status, dan ringkasan mengikuti mockup |
| UI-104 | Detail Pocket | Pengguna membuka Detail Pocket | Daftar item, aksi, dan informasinya mengikuti mockup |
| UI-105 | Fund | Pengguna membuka halaman Fund | Daftar Active dan Savings/Goal Fund mengikuti mockup |
| UI-106 | Notifikasi | Pengguna menekan tombol lonceng di Dashboard | Halaman Notifikasi terbuka, tab bar tidak ditampilkan, dan dialog Tolak/Konfirmasi tetap berfungsi |
| UI-107 | Pengaturan | Pengguna membuka Pengaturan | Kartu Akun, Kategori Sistem, dan Aplikasi mengikuti mockup |
| UI-108 | Sign In | Pengguna membuka halaman masuk | Form dan tipografi mengikuti mockup |
| UI-109 | Sign Up | Pengguna membuka halaman daftar | Form dan tipografi mengikuti mockup |
| UI-110 | Halaman tidak ditemukan | Pengguna membuka rute yang tidak ada | Tampilan 404 mengikuti mockup dan ada jalan kembali |
| UI-111 | Tab bar dan aksi baris | Pengguna meninjau navigasi dan baris Transaksi/Item Pocket | Lima tab dengan pill aktif hijau dan label kecil; tombol elipsis 44×44 membuka modal Ubah/Hapus |
| UI-112 | Konsistensi komponen | Pengguna meninjau seluruh layar | Palet hijau, kartu flat, field form 45 px, dan token spasi/tipografi dipakai konsisten |

## 12.2 Nama pengguna

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| NAME-001 | Akun tanpa nama | Akun baru atau `display_name` kosong | Pengaturan dan Dashboard menampilkan `User` |
| NAME-002 | Mengubah nama | Nama valid dimasukkan lewat tombol “Ubah nama” lalu disimpan | Nama tersimpan dan langsung tampil di Pengaturan serta Dashboard tanpa reload |
| NAME-003 | Persistensi setelah restart | Aplikasi ditutup lalu dibuka kembali | Nama yang tersimpan tetap tampil |
| NAME-004 | Persistensi setelah masuk ulang | Pengguna sign out lalu sign in | Nama yang tersimpan tetap tampil |
| NAME-005 | Mengosongkan nama | Nama dihapus lalu disimpan | Pengaturan dan Dashboard kembali menampilkan `User` |
| NAME-006 | Validasi nama | Nama lebih dari 50 karakter atau hanya spasi | Spasi dipangkas, nama panjang ditolak dengan pesan validasi |
| NAME-007 | Isolasi antar akun | Nama diubah pada satu akun, lalu akun lain dibuka | Nama akun lain tidak berubah |

## 12.3 Sapaan Dashboard

| ID | Test Scenario | Input / Condition | Expected Result |
|---|---|---|---|
| GREET-001 | Sapaan pagi | Jam perangkat 05.00–11.59 | Dashboard menampilkan `Good morning` |
| GREET-002 | Sapaan siang | Jam perangkat 12.00–17.59 | Dashboard menampilkan `Good afternoon` |
| GREET-003 | Sapaan malam | Jam perangkat 18.00–04.59 | Dashboard menampilkan `Good evening` |
| GREET-004 | Pembaruan sapaan | Jam berganti lalu pengguna kembali ke Dashboard | Sapaan mengikuti jam terbaru setelah layar difokuskan |

GREET-001–GREET-003 diverifikasi dengan unit test batas jam; GREET-004 diverifikasi manual.

---

**Document Status:** Accepted; UI-001–UI-006, UI-101–UI-112, NAME-001–NAME-007, dan GREET-001–GREET-004 sudah diverifikasi manual dan/atau otomatis.  
Seluruh skenario di atas merupakan acuan pengujian berdasarkan keputusan produk dan desain teknis yang telah didokumentasikan. Skenario yang memerlukan aturan yang belum diputuskan harus menunggu keputusan pada dokumen sumber sebelum dijadikan kriteria lulus/gagal final.
