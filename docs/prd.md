# Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Description

Personal Finance Tracking adalah aplikasi mobile untuk membantu pengguna mencatat dan mengelola pemasukan, pengeluaran, serta perpindahan uang antar-Fund. Aplikasi juga menyediakan Pocket untuk mengelompokkan rencana atau aktivitas keuangan, termasuk pengelolaan pemasukan dan pengeluaran berulang melalui Automation. Dashboard menyajikan ringkasan Active Balance, daftar Active Fund, dan aktivitas pengeluaran aktual.

### 1.2 Product Goals

1. Membantu pengguna mencatat aktivitas keuangan secara konsisten.
2. Memberikan gambaran dana yang tersedia untuk digunakan melalui Active Balance.
3. Memisahkan saldo aktual pada Fund dari alokasi pengeluaran yang masih direncanakan.
4. Memudahkan pengguna mengelompokkan aktivitas keuangan berdasarkan tujuan melalui Pocket.
5. Mengurangi pencatatan berulang untuk pemasukan dan pengeluaran rutin melalui Automation.

### 1.3 MVP Scope

Dokumen ini mendefinisikan kebutuhan MVP Stage 1. Fitur yang tidak tercantum sebagai bagian dari ruang lingkup berikut tidak dianggap sebagai kebutuhan MVP.

## 2. User Roles

### 2.1 Individual User

Aplikasi ditujukan untuk satu pengguna individu yang mengelola keuangan pribadinya sendiri.

Pengguna dapat:
- Mengelola Fund dan klasifikasinya.
- Mencatat dan mengelola Income, Expense, dan Transfer.
- Membuat serta mengelola Pocket dan Pocket Item.
- Mengatur Automation untuk Income dan Expense Pocket Item.
- Meninjau ringkasan keuangan dan riwayat transaksi.

Tidak ada peran administrator atau multi-user collaboration dalam ruang lingkup MVP.

## 3. MVP Feature Scope

### 3.1 Fund Management

Fund merepresentasikan sumber atau tempat penyimpanan uang yang benar-benar dimiliki pengguna, misalnya uang tunai, rekening bank, atau tabungan.

Fitur:
- Membuat Fund.
- Menentukan Opening Balance ketika Fund dibuat.
- Melihat saldo Fund.
- Mengubah informasi Fund.
- Mengklasifikasikan Fund sebagai Active atau Savings/Goal.
- Mengubah klasifikasi Fund kapan saja.
- Mengarsipkan dan mengaktifkan kembali Fund.
- Menghapus Fund jika memenuhi ketentuan penghapusan.

Aturan produk:
1. Opening Balance hanya ditentukan saat Fund dibuat.
2. Opening Balance bukan Income dan tidak dihitung dalam laporan Income.
3. Opening Balance tidak dapat diubah setelah Fund dibuat.
4. Saldo Fund dihitung dari Opening Balance, Income, Expense, dan dampak Transfer.
5. Fund dengan transaksi tidak dapat dihapus; pengguna harus mengarsipkannya jika memenuhi syarat.
6. Fund dengan saldo tersisa tidak dapat diarsipkan.
7. Fund yang diarsipkan tidak dapat digunakan untuk transaksi baru dan dapat diaktifkan kembali.
8. Fund tidak dapat dihapus atau diarsipkan selama masih direferensikan oleh Pocket Item.
9. Penghapusan Fund yang diperbolehkan juga menghapus Opening Balance yang melekat pada Fund tersebut.
10. Perubahan klasifikasi Active atau Savings/Goal tidak mengubah saldo aktual Fund, tetapi memengaruhi Active Balance.
11. Savings/Goal Fund tidak dihitung dalam Active Balance.

### 3.2 Transaction Management

Aplikasi menyediakan tiga jenis transaksi:

| Jenis | Dampak terhadap Fund |
|---|---|
| Income | Menambah saldo Fund tujuan |
| Expense | Mengurangi saldo Fund sumber |
| Transfer | Mengurangi saldo Fund sumber dan menambah saldo Fund tujuan |

Fitur:
- Membuat Income, Expense, dan Transfer.
- Mengubah transaksi yang sudah tercatat sesuai aturan.
- Menghapus transaksi yang keliru atau tidak pernah terjadi.
- Melihat Transaction History.
- Memfilter riwayat berdasarkan tanggal/periode dan jenis transaksi.

Aturan produk:
1. Nominal transaksi harus lebih besar dari nol.
2. Tanggal transaksi secara default menggunakan tanggal hari ini dan dapat diubah pengguna.
3. Expense dan Transfer ditolak jika saldo Fund sumber tidak mencukupi.
4. Saldo Fund tidak boleh menjadi negatif.
5. Fund sumber dan tujuan pada Transfer harus berbeda.
6. Transfer tidak dihitung sebagai Income maupun Expense.
7. Income dan Expense tanpa Pocket wajib memiliki Category.
8. Transfer tanpa Pocket tidak menggunakan Category.
9. Transaksi yang terhubung dengan Pocket tidak menggunakan Category.
10. Satu transaksi hanya dapat terhubung dengan paling banyak satu Pocket.
11. Penghapusan transaksi membalik dampak keuangan transaksi tersebut terhadap Fund.
12. Penghapusan transaksi merupakan koreksi atas transaksi yang keliru atau tidak pernah terjadi, bukan cara untuk mencatat penarikan uang. Penarikan uang harus dicatat sebagai transaksi baru.
13. Income Transaction yang dibuat dari Income Automation dapat diedit sesuai aturan pengeditan transaksi Income biasa, tetapi tidak dapat dihapus oleh pengguna. Larangan penghapusan berlaku selama transaksi masih terhubung dengan Automation asalnya; jika Pocket atau Automation asalnya dihapus, transaksi tersebut menjadi transaksi biasa tanpa Pocket dan dapat dihapus sesuai aturan transaksi biasa.
14. Sebelum pengguna mengonfirmasi Income Automation, aplikasi harus menampilkan peringatan bahwa Income Transaction yang terbentuk akan tercatat permanen dan tidak dapat dihapus oleh pengguna.
15. Pengguna dapat mengubah nominal, tanggal, Fund, dan Category (hanya untuk transaksi tanpa Pocket). Jenis transaksi tidak dapat diubah. Perubahan divalidasi dengan aturan yang sama seperti pembuatan transaksi.
16. Nominal Expense Transaction hasil konversi Planned Expense tidak dapat diubah agar tetap sama dengan nominal item. Field lain tetap dapat diubah sesuai aturan.
17. Perubahan nominal pada Income Transaction dari Income Pocket tanpa Automation, atau pada Transfer Transaction dari Transfer Pocket, memperbarui nominal Pocket Item terkait. Perubahan nominal pada Income Transaction hasil Automation hanya berlaku pada transaksi tersebut dan tidak mengubah template.
18. Transaksi yang masih terhubung dengan Pocket diubah atau dihapus melalui halaman Pocket, bukan melalui Transaction History.
19. Penghapusan transaksi yang berasal dari Pocket menerapkan siklus item: Income Pocket tanpa Automation kembali ke pending; Expense hasil konversi kembali ke planned dan alokasinya kembali dihitung; Transfer menghapus Pocket Item terkait. Expense Transaction hasil Automation yang dihapus juga menghapus occurrence terkait dan tidak mengubah template periode berikutnya.
20. Pengubahan atau penghapusan transaksi ditolak jika hasilnya membuat saldo Fund mana pun menjadi negatif.
21. Expense hanya dapat menggunakan Fund dengan klasifikasi Active yang tidak diarsipkan. Aturan ini berlaku saat pembuatan Expense, pengubahan Expense, konversi Planned Expense, dan konfirmasi Expense Automation. Transfer tidak terkena batasan ini.

### 3.3 Category Management

Category pada MVP menggunakan kategori yang telah ditentukan sistem dan tidak menyediakan pengelolaan kategori kustom.

| Jenis transaksi | Category |
|---|---|
| Income | Salary, Freelance, Bonus, Other Income |
| Expense | Food, Transportation, Bills, Shopping, Entertainment, Other |

Category hanya digunakan untuk Income dan Expense yang tidak terhubung dengan Pocket.

### 3.4 Pocket Management

Pocket adalah wadah pengelompokan aktivitas atau rencana keuangan. Pocket bukan tempat penyimpanan uang dan tidak memiliki saldo Fund sendiri.

Fitur:
- Membuat Pocket dengan tipe Income, Expense, atau Transfer.
- Menambahkan Pocket Item.
- Mengelola Pocket Item sesuai tipe Pocket.
- Mengarsipkan dan mengaktifkan kembali Pocket.
- Menghapus Pocket.

Aturan produk:
1. Pocket dibuat dalam keadaan kosong.
2. Membuat Pocket tidak mengalokasikan uang, tidak mengubah saldo Fund, dan tidak mengubah Active Balance.
3. Tipe Pocket ditentukan saat pembuatan.
4. Tipe Pocket hanya dapat diubah selama Pocket belum pernah memiliki item.
5. Setelah Pocket pernah memiliki item, tipenya tidak dapat diubah, meskipun semua item kemudian dihapus atau dikonversi.
6. Satu Pocket Item hanya dapat terhubung ke satu Pocket.
7. Hanya template Automation yang menyimpan referensi Fund default (Fund tujuan untuk Income, Fund sumber untuk Expense). Item lain tidak menyimpan referensi Fund: Fund dipilih saat konfirmasi atau konversi, dan Transfer menyimpan Fund sumber dan tujuan pada transaksinya.
8. Pocket dapat diarsipkan dan diaktifkan kembali.
9. Penghapusan Pocket bersifat permanen.
10. Menghapus Pocket tidak menghapus atau membalik transaksi aktual yang telah terjadi. Transaksi tersebut tetap tersedia di Transaction History sebagai transaksi tanpa Pocket. Income yang terlepas dari Pocket diberi Category Other Income dan Expense diberi Category Other agar memenuhi aturan Category untuk transaksi tanpa Pocket; Transfer tetap tanpa Category.
11. Menghapus Pocket menghapus Pocket Item yang terkait. Planned Expense Item yang belum dikonversi ikut dihapus sehingga alokasinya dilepaskan.
12. Fund yang masih direferensikan oleh Pocket Item tidak dapat dihapus atau diarsipkan. Referensi ini berasal dari Fund default pada template Automation.
13. Pocket yang diarsipkan menolak penambahan item baru, tetapi item yang sudah ada tetap dapat dikonfirmasi, dikonversi, diubah, atau dihapus sesuai aturan tipenya.

#### 3.4.1 Income Pocket

Income Pocket digunakan untuk mengelompokkan pemasukan yang diharapkan.

Aturan produk:
1. Membuat Income Pocket Item tidak menambah saldo Fund.
2. Item yang belum dikonfirmasi belum menjadi Income Transaction.
3. Pengguna memilih Fund tujuan ketika pemasukan dikonfirmasi.
4. Setelah konfirmasi berhasil, aplikasi mencatat Income Transaction dan menambah saldo Fund tujuan.
5. Income Pocket Item dapat menerima pemasukan ke Fund yang berbeda.
6. Tanpa Automation, item berubah dari pending menjadi confirmed setelah transaksi berhasil dicatat.
7. Income Pocket Item dengan Automation berfungsi sebagai template yang dapat digunakan kembali. Setiap jadwal berulang memiliki occurrence tersendiri dan dapat menghasilkan Income Transaction tersendiri.
8. Pengguna tidak dapat menghapus Income Transaction yang dibuat dari Automation.
9. Income Pocket Item berstatus pending dapat dihapus tanpa dampak pada saldo Fund. Item confirmed tidak dapat dihapus langsung; pengguna menghapus Income Transaction-nya melalui halaman Pocket sehingga item kembali pending.
10. Pada Income Automation, nominal occurrence sama dengan nominal template dan tidak dapat diubah saat konfirmasi. Transaksi yang terbentuk dapat diedit setelahnya sesuai aturan 3.2.

#### 3.4.2 Expense Pocket

Expense Pocket digunakan untuk merencanakan pengeluaran dan mengalokasikan sebagian Active Balance.

Aturan produk:
1. Menambahkan Planned Expense Item mengurangi Active Balance sebesar nominal item, tetapi tidak mengubah saldo Fund.
2. Planned Expense tidak dihitung sebagai Expense aktual dan tidak dimasukkan ke grafik pengeluaran.
3. Ketika pengeluaran benar-benar terjadi, pengguna mengonversi item menjadi Expense Transaction.
4. Saat konversi, pengguna memilih Fund sumber Active yang tidak diarsipkan dan nominal transaksi menggunakan nominal item yang sama.
5. Konversi hanya berhasil jika Fund sumber berklasifikasi Active dan saldo Fund sumber mencukupi.
6. Setelah konversi berhasil, item berstatus converted dan Expense Transaction tercatat.
7. Item yang sudah dikonversi tidak dapat diedit atau dikonversi kembali.
8. Pengguna dapat mengubah Planned Expense Item sebelum konversi.
9. Menghapus Planned Expense Item melepaskan alokasi dan tidak mengubah saldo Fund.
10. Saat Pocket dihapus, Planned Expense Item yang belum dikonversi dihapus dan alokasinya dilepaskan. Expense Transaction yang telah terjadi tetap tersimpan.
11. Expense Automation termasuk dalam MVP.
12. Nominal Expense Automation dapat disesuaikan pengguna pada saat konfirmasi occurrence. Perubahan tersebut berlaku untuk transaksi pada occurrence itu dan tidak otomatis mengubah nominal template untuk periode berikutnya.
13. Template Expense Automation tidak dihitung sebagai Planned Expense dan tidak mengurangi Active Balance.
14. Menghapus Expense Transaction hasil konversi mengembalikan item ke planned; alokasinya kembali dihitung dan saldo Fund sumber dipulihkan.

#### 3.4.3 Transfer Pocket

Transfer Pocket digunakan untuk mengelompokkan aktivitas perpindahan uang antar-Fund, termasuk perpindahan menuju atau dari Fund Savings/Goal.

Aturan produk:
1. Menambahkan Transfer Pocket Item langsung membuat Transfer Transaction aktual.
2. Transfer memengaruhi saldo Fund sumber dan Fund tujuan.
3. Transfer tidak mengubah total saldo seluruh Fund.
4. Transfer dari Active Fund ke Savings/Goal Fund mengurangi Active Balance karena saldo pada Savings/Goal Fund tidak dihitung dalam Active Balance.
5. Transfer dari Savings/Goal Fund ke Active Fund meningkatkan Active Balance.
6. Transfer Pocket tidak menggunakan proses konfirmasi Automation.
7. Ringkasan incoming, outgoing, dan net transfer merupakan ringkasan aktivitas perpindahan uang, bukan pemasukan atau pengeluaran baru.
8. Incoming berarti uang masuk ke Fund tujuan; outgoing berarti uang keluar dari Fund sumber, dilihat dari perspektif aktivitas Transfer Pocket.
9. Jika pengguna menghapus Transfer Transaction yang berasal dari Transfer Pocket, Pocket Item terkait ikut dihapus. Item tidak dikembalikan menjadi pending.
10. Penghapusan Transfer Transaction membalik dampak transaksi terhadap kedua Fund. Pocket Item Transfer lain tidak terpengaruh.
11. Pocket tetap dianggap pernah memiliki item meskipun item Transfer dihapus.

### 3.5 Automation

Automation membantu pengguna mengelola Income dan Expense berulang pada Pocket Item. Automation tidak berlaku untuk Transfer Pocket.

Fitur:
- Mengatur jadwal berulang untuk Income Pocket Item.
- Mengatur jadwal berulang untuk Expense Pocket Item.
- Mengonfirmasi atau menolak occurrence yang jatuh tempo.
- Mengubah jadwal dan detail template Automation.
- Menghapus Automation dari layar Pocket.

Aturan produk:
1. Automation bersifat opsional dan dikonfigurasi per Pocket Item. Automation dipilih ketika Pocket Item dibuat; item yang dibuat dengan Automation langsung berstatus template. Automation tidak dapat ditambahkan ke Pocket Item yang sudah ada.
2. Frekuensi yang didukung adalah weekly, every two weeks, dan monthly.
3. Untuk jadwal monthly yang tanggalnya tidak tersedia pada suatu bulan, occurrence dijadwalkan pada hari terakhir bulan tersebut.
4. Jadwal monthly mengacu pada start date Automation.
5. Jika start date diubah, jadwal berikutnya dihitung ulang berdasarkan start date yang baru.
6. Automation menggunakan zona waktu lokal perangkat yang disimpan ketika Automation dibuat. Zona waktu tersebut tetap digunakan sampai pengguna mengubahnya secara manual.
7. Ketika jadwal jatuh tempo, aplikasi membuat occurrence dan Notification untuk meminta keputusan pengguna.
8. Jika aplikasi tidak dibuka pada tanggal jadwal, pemeriksaan jadwal dilakukan ketika aplikasi dibuka kembali.
9. Jika beberapa periode terlewat, setiap periode yang masih perlu diproses menghasilkan occurrence dan Notification tersendiri.
10. Setiap occurrence hanya dapat menghasilkan paling banyak satu transaksi aktual.
11. Pengguna dapat mengonfirmasi atau menolak setiap occurrence secara terpisah.
12. Menolak satu occurrence tidak menghentikan jadwal berulang berikutnya.
13. Income Automation: konfirmasi membuat Income Transaction pada Fund tujuan yang dipilih pengguna (default Fund template, dapat diganti) dengan nominal yang sama dengan template. Sebelum konfirmasi, aplikasi menampilkan peringatan bahwa transaksi yang terbentuk tidak dapat dihapus oleh pengguna.
14. Expense Automation: konfirmasi membuat Expense Transaction dari Fund sumber Active yang dipilih pengguna saat konfirmasi (default Fund template, dapat diganti). Konfirmasi ditolak dan occurrence tetap pending jika Fund sumber tidak berklasifikasi Active, diarsipkan, atau saldo Fund sumber tidak mencukupi. Pengguna dapat menyesuaikan nominal pada saat konfirmasi; nominal template untuk periode berikutnya tetap menjadi acuan.
15. Menolak occurrence tidak membuat transaksi.
16. Notification ditampilkan sebagai persistent confirmation card. Kartu tetap tersedia ketika pengguna menutup aplikasi tanpa memilih tindakan.
17. Kartu hanya hilang setelah pengguna memilih Confirm atau Reject.
18. Tidak ada aturan kedaluwarsa Notification dan tidak ada pengingat berulang setiap 12 jam.
19. Menghapus Automation menghapus template Pocket Item, seluruh occurrence-nya, dan Notification terkait, tetapi tidak menghapus transaksi aktual yang telah terbentuk. Transaksi tersebut menjadi transaksi tanpa Pocket (Category Other Income untuk Income, Other untuk Expense) dan dapat dikelola sebagai transaksi biasa.
20. Pengguna mengelola dan menghapus Automation melalui layar Pocket, bukan melalui halaman Notifications.

### 3.6 Dashboard

Dashboard menyajikan ringkasan kondisi keuangan pengguna.

Komponen MVP:
- Active Balance.
- Daftar Active Fund beserta saldo masing-masing.
- Grafik pengeluaran untuk tujuh hari kalender terakhir, termasuk hari ini.

Aturan produk:
1. Active Balance adalah jumlah saldo seluruh Active Fund dikurangi total outstanding Expense Pocket allocation.
2. Savings/Goal Fund tidak dihitung dalam Active Balance.
3. Outstanding Expense allocation adalah total Planned Expense Pocket Item yang belum dikonversi. Template Expense Automation tidak dihitung sebagai alokasi.
4. Expense Pocket Item yang sudah dikonversi tidak lagi dihitung sebagai alokasi.
5. Ketika Planned Expense dikonversi menjadi Expense, Active Balance tetap sama sepanjang transaksi berhasil menggunakan nominal yang sama: saldo Fund berkurang dan alokasi dilepaskan.
6. Transfer dari Active Fund ke Savings/Goal Fund mengurangi Active Balance melalui klasifikasi Fund.
7. Grafik pengeluaran hanya menampilkan Expense Transaction aktual.
8. Planned Expense, Income, dan Transfer tidak dimasukkan ke grafik pengeluaran.
9. MVP tidak menampilkan total seluruh Fund atau total aset.
10. MVP tidak menyediakan laporan bulanan atau tahunan.

### 3.7 Transaction History

Fitur:
- Menampilkan transaksi terbaru terlebih dahulu.
- Menampilkan Income, Expense, dan Transfer.
- Menyediakan filter tanggal/periode dan jenis transaksi.
- Menampilkan transaksi yang terhubung dengan Pocket.
- Tetap menampilkan transaksi aktual setelah Pocket dihapus.

Aturan produk:
1. Urutan default adalah transaksi terbaru ke terlama.
2. Filter jenis transaksi mendukung Income, Expense, dan Transfer.
3. Filter tanggal mendukung tanggal, bulan, atau rentang tanggal.
4. MVP tidak menyediakan pencarian teks pada Transaction History.
5. Transaksi yang sebelumnya terhubung dengan Pocket tetap terlihat di History setelah Pocket dihapus, dengan status sebagai transaksi tanpa Pocket.
6. Pengelolaan item yang masih terhubung dengan Pocket dilakukan melalui Pocket terkait. Mengubah dan menghapus transaksi yang masih terhubung dengan Pocket juga dilakukan melalui Pocket terkait.

### 3.8 Currency

MVP hanya mendukung satu mata uang, yaitu Indonesian Rupiah (IDR). Pengguna tidak dapat memilih atau mencatat transaksi dengan mata uang lain.

### 3.9 Authentication (Supporting Capability)

Akses ke aplikasi memerlukan akun pengguna yang diautentikasi melalui Supabase Auth (pembuatan akun dan masuk) agar data keuangan terisolasi per pengguna. Autentikasi adalah prasyarat pendukung, bukan fitur produk tersendiri. MVP tidak menyediakan layar penghapusan akun; penghapusan akun hanya berupa perilaku cascade database yang dilakukan di sisi backend.

Nama tampilan pengguna dapat diedit dari Pengaturan dan ditampilkan pada Dashboard. Akun baru atau nama yang dikosongkan menampilkan `User` sampai pengguna mengubahnya. Nama disimpan sebagai `user_metadata.display_name` di Supabase Auth hanya untuk keperluan tampilan; tidak dipakai sebagai identitas unik atau penentu otorisasi.

## 4. User Interaction Flows

### 4.1 Create Fund

1. Pengguna membuka halaman Fund.
2. Pengguna memilih untuk membuat Fund baru.
3. Pengguna mengisi informasi Fund dan Opening Balance.
4. Pengguna menentukan klasifikasi Fund: Active atau Savings/Goal.
5. Pengguna menyimpan Fund.
6. Fund baru tampil pada daftar Fund dengan saldo awal sesuai Opening Balance.

### 4.2 Change Fund Classification

1. Pengguna membuka detail Fund.
2. Pengguna memilih klasifikasi Active atau Savings/Goal.
3. Pengguna menyimpan perubahan.
4. Saldo aktual Fund tetap sama.
5. Active Balance diperbarui mengikuti klasifikasi terbaru.

### 4.3 Archive or Delete Fund

1. Pengguna memilih Fund.
2. Pengguna memilih Archive atau Delete.
3. Aplikasi memeriksa ketentuan tindakan tersebut.
4. Jika Fund masih direferensikan Pocket Item, tindakan ditolak dan aplikasi menjelaskan bahwa Fund masih terhubung dengan Pocket Item.
5. Jika Fund memiliki transaksi, penghapusan ditolak.
6. Jika Fund masih memiliki saldo, pengarsipan ditolak.
7. Jika seluruh ketentuan terpenuhi, tindakan dijalankan.

### 4.4 Create Income or Expense Transaction

1. Pengguna membuka form transaksi.
2. Pengguna memilih Income atau Expense.
3. Pengguna mengisi nominal, tanggal, Fund, dan Category jika transaksi tidak terhubung dengan Pocket.
4. Pengguna menyimpan transaksi.
5. Aplikasi memeriksa validitas data dan kecukupan saldo untuk Expense.
6. Jika valid, transaksi dicatat dan saldo Fund diperbarui.
7. Jika tidak valid, transaksi tidak dicatat dan pengguna menerima informasi kesalahan.

### 4.5 Create Transfer Transaction

1. Pengguna membuka form Transfer.
2. Pengguna memilih Fund sumber dan Fund tujuan.
3. Pengguna mengisi nominal dan tanggal.
4. Pengguna menyimpan transaksi.
5. Aplikasi memeriksa bahwa kedua Fund berbeda dan saldo Fund sumber mencukupi.
6. Jika valid, saldo Fund sumber berkurang dan saldo Fund tujuan bertambah dengan nominal yang sama.
7. Jika tidak valid, Transfer tidak dicatat.

### 4.6 Create and Convert Expense Pocket Item

1. Pengguna membuat atau membuka Expense Pocket.
2. Pengguna menambahkan Planned Expense Item dan mengisi nominal.
3. Active Balance berkurang sebesar nominal item, sementara saldo Fund tetap.
4. Ketika pengeluaran terjadi, pengguna membuka item dan memilih Convert.
5. Pengguna memilih Fund sumber.
6. Aplikasi memeriksa kecukupan saldo Fund.
7. Jika valid, Expense Transaction dicatat dengan nominal yang sama, item menjadi converted, dan alokasi dilepaskan.
8. Jika tidak valid, konversi ditolak dan item tetap menjadi Planned Expense.

### 4.7 Confirm Income Pocket Item

1. Pengguna membuka Income Pocket.
2. Pengguna memilih item pemasukan yang masih pending.
3. Pengguna memilih Fund tujuan.
4. Pengguna mengonfirmasi pemasukan.
5. Aplikasi mencatat Income Transaction.
6. Setelah transaksi berhasil, saldo Fund bertambah dan item menjadi confirmed.

### 4.8 Process Automation Notification

1. Ketika occurrence jatuh tempo, aplikasi menampilkan persistent confirmation card.
2. Pengguna membuka kartu untuk melihat detail occurrence.
3. Untuk Income, pengguna memilih Fund tujuan dan aplikasi menampilkan peringatan bahwa transaksi yang terbentuk tidak dapat dihapus oleh pengguna.
4. Untuk Expense, pengguna memilih Fund sumber dan dapat menyesuaikan nominal occurrence sebelum konfirmasi.
5. Pengguna memilih Confirm atau Reject.
6. Confirm memproses transaksi terkait; Reject menutup occurrence tanpa membuat transaksi.
7. Setelah tindakan berhasil, Notification terkait tidak lagi ditampilkan.
8. Jika pengguna menutup aplikasi tanpa tindakan, kartu tetap tersedia ketika aplikasi dibuka kembali.

### 4.9 Delete Pocket

1. Pengguna membuka Pocket.
2. Pengguna memilih Delete.
3. Aplikasi meminta konfirmasi penghapusan permanen.
4. Setelah dikonfirmasi, Pocket dan seluruh Pocket Item dihapus.
5. Planned Expense allocation dilepaskan.
6. Transaksi aktual tetap tersimpan dan tampil di Transaction History sebagai transaksi tanpa Pocket. Income diberi Category Other Income dan Expense diberi Category Other; Transfer tetap tanpa Category.

### 4.10 Review Dashboard and Transaction History

1. Pengguna membuka Dashboard untuk melihat Active Balance, Active Fund, dan grafik Expense tujuh hari terakhir.
2. Pengguna membuka Transaction History untuk melihat transaksi terbaru.
3. Pengguna menerapkan filter tanggal/periode atau jenis transaksi bila diperlukan.
4. Pengguna membuka detail transaksi untuk meninjau informasi transaksi.

## 5. Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | Pengguna dapat membuat, melihat, mengubah, mengarsipkan, mengaktifkan kembali, dan menghapus Fund sesuai aturan produk. |
| FR-002 | Pengguna dapat menetapkan Opening Balance hanya ketika membuat Fund. |
| FR-003 | Pengguna dapat mengubah klasifikasi Fund antara Active dan Savings/Goal. |
| FR-004 | Pengguna dapat membuat Income, Expense, dan Transfer. |
| FR-005 | Aplikasi menolak Expense atau Transfer jika saldo Fund sumber tidak mencukupi. |
| FR-006 | Aplikasi menjaga agar saldo Fund tidak menjadi negatif. |
| FR-007 | Pengguna dapat mengubah dan menghapus transaksi sesuai aturan produk. |
| FR-008 | Aplikasi menyediakan Category sistem untuk Income dan Expense tanpa Pocket. |
| FR-009 | Pengguna dapat membuat dan mengelola Pocket bertipe Income, Expense, atau Transfer. |
| FR-010 | Pengguna dapat menambahkan dan mengelola Pocket Item sesuai tipe Pocket. |
| FR-011 | Planned Expense mengurangi Active Balance tanpa mengubah saldo Fund. |
| FR-012 | Pengguna dapat mengonversi Planned Expense menjadi Expense Transaction. |
| FR-013 | Income Pocket Item baru menambah saldo Fund setelah dikonfirmasi dan transaksi berhasil dicatat. |
| FR-014 | Transfer Pocket Item langsung menghasilkan Transfer Transaction aktual. |
| FR-015 | Pengguna dapat mengatur Automation berulang untuk Income dan Expense Pocket Item. |
| FR-016 | Aplikasi membuat dan mempertahankan Notification untuk setiap occurrence yang menunggu keputusan pengguna. |
| FR-017 | Pengguna dapat mengonfirmasi atau menolak occurrence Automation. |
| FR-018 | Aplikasi menyediakan Dashboard dengan Active Balance, Active Fund, dan grafik Expense tujuh hari terakhir. |
| FR-019 | Aplikasi menyediakan Transaction History dengan filter tanggal/periode dan jenis transaksi. |
| FR-020 | Aplikasi mendukung IDR sebagai satu-satunya mata uang MVP. |

## 6. Business Rules

Bagian ini merangkum aturan produk yang harus dipatuhi seluruh fitur. Detail implementasi dan penegakan pada tingkat database dijelaskan pada dokumen lain.

1. **Fund balance:** Opening Balance + Income − Expense + net Transfer.
2. **Active Balance:** total saldo Active Fund − outstanding Expense Pocket allocation.
3. **Savings/Goal:** saldo Savings/Goal Fund tidak dihitung dalam Active Balance.
4. **No negative balance:** Expense dan Transfer tidak boleh membuat saldo Fund sumber negatif.
5. **Pocket is not money storage:** Pocket tidak memiliki saldo dan tidak menyimpan uang.
6. **Planned versus actual Expense:** Planned Expense hanya mengurangi Active Balance; Expense aktual mengurangi saldo Fund.
7. **Income confirmation:** Income Pocket Item baru memengaruhi saldo setelah transaksi berhasil dicatat.
8. **Transfer neutrality:** Transfer tidak mengubah total saldo seluruh Fund.
9. **Pocket deletion:** penghapusan Pocket tidak menghapus atau membalik transaksi aktual.
10. **Automation idempotency:** satu occurrence hanya boleh menghasilkan satu transaksi aktual.
11. **Persistent confirmation:** Notification tetap tersedia sampai pengguna memilih Confirm atau Reject; tidak ada expiry atau pengingat berkala.
12. **Automation Income deletion restriction:** Income Transaction yang dibuat dari Income Automation tidak dapat dihapus oleh pengguna. Larangan berlaku selama transaksi masih terhubung dengan Automation asalnya.
13. **Correction safety:** pengubahan atau penghapusan transaksi tidak boleh membuat saldo Fund mana pun negatif.
14. **Pocket-origin deletion:** penghapusan transaksi yang berasal dari Pocket mengikuti siklus item Pocket (pending, planned, atau penghapusan item Transfer).

## 7. Acceptance Criteria

### 7.1 Fund

| ID | Acceptance Criteria |
|---|---|
| AC-FND-01 | Saat Fund dibuat dengan Opening Balance, saldo awal Fund sama dengan nominal yang dimasukkan. |
| AC-FND-02 | Setelah Fund dibuat, pengguna tidak dapat mengubah Opening Balance. |
| AC-FND-03 | Opening Balance tidak muncul sebagai Income dan tidak menambah nilai Income pada ringkasan atau laporan. |
| AC-FND-04 | Mengubah klasifikasi Fund tidak mengubah saldo aktual Fund. |
| AC-FND-05 | Mengubah Fund dari Active menjadi Savings/Goal mengurangi Active Balance sebesar saldo Fund tersebut, dengan memperhitungkan aturan alokasi Expense. |
| AC-FND-06 | Fund yang memiliki transaksi tidak dapat dihapus. |
| AC-FND-07 | Fund dengan saldo tersisa tidak dapat diarsipkan. |
| AC-FND-08 | Fund yang diarsipkan tidak dapat dipilih untuk transaksi baru dan dapat diaktifkan kembali. |
| AC-FND-09 | Fund yang masih direferensikan oleh Pocket Item tidak dapat dihapus maupun diarsipkan. Aplikasi menjelaskan alasan penolakan kepada pengguna. |
| AC-FND-10 | Fund tanpa transaksi dan tanpa referensi Pocket Item dapat dihapus, termasuk Opening Balance yang melekat padanya. |

### 7.2 Transactions

| ID | Acceptance Criteria |
|---|---|
| AC-TRX-01 | Income yang berhasil dicatat menambah saldo Fund tujuan sebesar nominal transaksi. |
| AC-TRX-02 | Expense yang berhasil dicatat mengurangi saldo Fund sumber sebesar nominal transaksi. |
| AC-TRX-03 | Transfer yang berhasil dicatat mengurangi saldo Fund sumber dan menambah saldo Fund tujuan dengan nominal yang sama. |
| AC-TRX-04 | Transfer tidak mengubah total saldo seluruh Fund. |
| AC-TRX-05 | Expense atau Transfer dengan saldo sumber tidak mencukupi ditolak dan tidak mengubah saldo Fund. |
| AC-TRX-06 | Sistem menolak nominal transaksi nol atau negatif. |
| AC-TRX-07 | Sistem menolak Transfer dengan Fund sumber dan tujuan yang sama. |
| AC-TRX-08 | Income dan Expense tanpa Pocket wajib memiliki Category; Transfer tanpa Pocket tidak menggunakan Category. |
| AC-TRX-09 | Transaksi yang terhubung dengan Pocket tidak menggunakan Category. |
| AC-TRX-10 | Menghapus transaksi biasa membalik dampak transaksi terhadap saldo Fund. |
| AC-TRX-11 | Income Transaction yang berasal dari Income Automation tidak dapat dihapus oleh pengguna. |
| AC-TRX-12 | Transaction History menampilkan transaksi terbaru terlebih dahulu dan menyediakan filter tanggal/periode serta jenis transaksi. |
| AC-TRX-13 | Pengubahan atau penghapusan transaksi yang membuat saldo Fund mana pun negatif ditolak dan tidak mengubah data. |
| AC-TRX-14 | Jenis transaksi tidak dapat diubah; nominal, tanggal, Fund, dan Category (tanpa Pocket) dapat diubah dengan validasi yang sama seperti pembuatan. |
| AC-TRX-15 | Nominal Expense Transaction hasil konversi Planned Expense tidak dapat diubah. |
| AC-TRX-16 | Transaksi yang masih terhubung dengan Pocket hanya dapat diubah atau dihapus melalui halaman Pocket. |
| AC-TRX-17 | Expense hanya dapat dicatat atau diubah menggunakan Fund sumber berklasifikasi Active dan tidak diarsipkan; pelanggaran ditolak tanpa mengubah saldo. |
| AC-TRX-18 | Menghapus Expense Transaction yang berasal dari Automation memulihkan saldo Fund sumber, menghapus occurrence terkait, dan mempertahankan template Automation untuk periode berikutnya. |

### 7.3 Pocket

| ID | Acceptance Criteria |
|---|---|
| AC-PKT-01 | Pocket yang baru dibuat memiliki total item nol dan tidak mengubah saldo Fund maupun Active Balance. |
| AC-PKT-02 | Tipe Pocket dapat diubah selama Pocket belum pernah memiliki item. |
| AC-PKT-03 | Setelah Pocket pernah memiliki item, tipe Pocket tidak dapat diubah meskipun seluruh item sudah dihapus atau dikonversi. |
| AC-PKT-04 | Satu Pocket Item tidak dapat terhubung ke lebih dari satu Pocket. |
| AC-PKT-05 | Menghapus Pocket tidak menghapus transaksi aktual yang sebelumnya terhubung dengannya. |
| AC-PKT-06 | Setelah Pocket dihapus, transaksi aktual terkait tetap tampil di Transaction History sebagai transaksi tanpa Pocket, dengan Category Other Income (Income) atau Other (Expense); Transfer tanpa Category. |
| AC-PKT-07 | Menghapus Pocket menghapus Planned Expense Item dan melepaskan alokasinya tanpa mengubah saldo Fund. |
| AC-PKT-08 | Pocket yang diarsipkan menolak penambahan item baru, tetapi item yang sudah ada tetap dapat dikonfirmasi, dikonversi, diubah, atau dihapus sesuai aturan tipenya. |

### 7.4 Income Pocket

| ID | Acceptance Criteria |
|---|---|
| AC-INC-01 | Income Pocket Item yang belum dikonfirmasi tidak menambah saldo Fund. |
| AC-INC-02 | Konfirmasi Income Pocket Item mencatat Income Transaction dan menambah saldo Fund tujuan setelah transaksi berhasil. |
| AC-INC-03 | Pengguna dapat memilih Fund tujuan ketika mengonfirmasi Income Pocket Item. |
| AC-INC-04 | Income Pocket Item dengan Automation dapat menghasilkan transaksi untuk beberapa occurrence yang berbeda. |
| AC-INC-05 | Pengguna tidak dapat menghapus Income Transaction yang dibuat dari Income Automation. |
| AC-INC-06 | Nominal Income occurrence sama dengan nominal template dan tidak dapat diubah saat konfirmasi. |
| AC-INC-07 | Menghapus Income Transaction dari Income Pocket tanpa Automation mengembalikan item ke pending dan membalik dampak saldo. |
| AC-INC-08 | Income Pocket Item pending dapat dihapus tanpa dampak saldo; item confirmed tidak dapat dihapus langsung. |

### 7.5 Expense Pocket

| ID | Acceptance Criteria |
|---|---|
| AC-EXP-01 | Menambahkan Planned Expense Item mengurangi Active Balance sesuai nominal, tetapi tidak mengubah saldo Fund. |
| AC-EXP-02 | Planned Expense tidak muncul sebagai Expense aktual pada grafik pengeluaran. |
| AC-EXP-03 | Konversi Planned Expense berhasil hanya jika saldo Fund sumber mencukupi. |
| AC-EXP-04 | Konversi mencatat Expense Transaction dengan nominal yang sama dengan nominal Planned Expense Item. |
| AC-EXP-05 | Setelah konversi berhasil, item tidak lagi dihitung sebagai alokasi dan tidak dapat dikonversi atau diedit kembali. |
| AC-EXP-06 | Active Balance tidak berubah akibat konversi yang berhasil dengan nominal yang sama, karena saldo Fund berkurang dan alokasi dilepaskan. |
| AC-EXP-07 | Menghapus Planned Expense Item melepaskan alokasi tanpa mengubah saldo Fund. |
| AC-EXP-08 | Nominal pada occurrence Expense Automation dapat disesuaikan saat konfirmasi tanpa mengubah nominal template untuk periode selanjutnya. |
| AC-EXP-09 | Menghapus Expense Transaction hasil konversi mengembalikan item ke planned, memulihkan saldo Fund sumber, dan alokasi kembali dihitung. |
| AC-EXP-10 | Template Expense Automation tidak dihitung sebagai alokasi dan tidak mengurangi Active Balance. |
| AC-EXP-11 | Konversi Planned Expense hanya berhasil jika Fund sumber berklasifikasi Active dan tidak diarsipkan; selain itu konversi ditolak dan item tetap planned. |

### 7.6 Transfer Pocket

| ID | Acceptance Criteria |
|---|---|
| AC-TFR-01 | Menambahkan Transfer Pocket Item langsung menghasilkan Transfer Transaction aktual. |
| AC-TFR-02 | Transfer dari Active Fund ke Savings/Goal Fund mengurangi Active Balance, tetapi tidak mengubah total saldo seluruh Fund. |
| AC-TFR-03 | Transfer dari Savings/Goal Fund ke Active Fund meningkatkan Active Balance, tetapi tidak mengubah total saldo seluruh Fund. |
| AC-TFR-04 | Menghapus Transfer Transaction yang berasal dari Transfer Pocket juga menghapus Pocket Item terkait dan membalik dampak saldo kedua Fund. |
| AC-TFR-05 | Penghapusan satu item Transfer tidak menghapus item Transfer lainnya dalam Pocket yang sama. |

### 7.7 Automation and Notifications

| ID | Acceptance Criteria |
|---|---|
| AC-AUT-01 | Automation dapat dikonfigurasi untuk Income dan Expense Pocket Item, tetapi tidak untuk Transfer Pocket. |
| AC-AUT-02 | Frekuensi weekly, every two weeks, dan monthly tersedia. |
| AC-AUT-03 | Jadwal monthly yang jatuh pada tanggal yang tidak tersedia menggunakan hari terakhir bulan tersebut. |
| AC-AUT-04 | Mengubah start date Automation menghitung ulang jadwal berdasarkan start date baru. |
| AC-AUT-05 | Setiap occurrence yang jatuh tempo menghasilkan paling banyak satu transaksi aktual. |
| AC-AUT-06 | Jika beberapa periode terlewat ketika aplikasi tidak dibuka, setiap periode yang perlu diproses memiliki occurrence dan Notification tersendiri saat pemeriksaan berikutnya. |
| AC-AUT-07 | Menolak satu occurrence tidak menghentikan occurrence pada periode berikutnya. |
| AC-AUT-08 | Mengonfirmasi Income occurrence menghasilkan Income Transaction pada Fund tujuan yang dipilih, dengan nominal template. |
| AC-AUT-09 | Sebelum Income occurrence dikonfirmasi, aplikasi menampilkan peringatan bahwa transaksi yang terbentuk tidak dapat dihapus oleh pengguna. |
| AC-AUT-10 | Mengonfirmasi Expense occurrence menghasilkan Expense Transaction dari Fund sumber yang dipilih dengan nominal yang dikonfirmasi pengguna; ditolak jika saldo tidak mencukupi. |
| AC-AUT-11 | Menyesuaikan nominal Expense occurrence tidak mengubah nominal template untuk periode berikutnya. |
| AC-AUT-12 | Menolak occurrence tidak menghasilkan transaksi. |
| AC-AUT-13 | Notification tetap tersedia setelah aplikasi ditutup dan dibuka kembali selama pengguna belum memilih Confirm atau Reject. |
| AC-AUT-14 | Notification hanya hilang setelah pengguna memilih Confirm atau Reject dan tindakan berhasil diproses. |
| AC-AUT-15 | Notification tidak kedaluwarsa dan tidak memicu pengingat berulang setiap 12 jam. |
| AC-AUT-16 | Menghapus Automation menghapus template Pocket Item, seluruh occurrence, dan Notification terkait, tetapi mempertahankan transaksi aktual yang telah terbentuk sebagai transaksi tanpa Pocket. |
| AC-AUT-17 | Pengguna dapat mengelola Automation melalui layar Pocket. |
| AC-AUT-18 | Automation dipilih saat Pocket Item dibuat dan tidak dapat ditambahkan ke Pocket Item yang sudah ada. |
| AC-AUT-19 | Konfirmasi Expense occurrence ditolak dan occurrence tetap pending jika Fund sumber tidak berklasifikasi Active atau diarsipkan. |

### 7.8 Dashboard and Transaction History

| ID | Acceptance Criteria |
|---|---|
| AC-DSH-01 | Dashboard menampilkan Active Balance berdasarkan saldo Active Fund dikurangi outstanding Expense allocation. |
| AC-DSH-02 | Dashboard menampilkan daftar Active Fund beserta saldo masing-masing. |
| AC-DSH-03 | Dashboard menampilkan grafik Expense aktual untuk tujuh hari kalender terakhir termasuk hari ini. |
| AC-DSH-04 | Planned Expense, Income, dan Transfer tidak dihitung sebagai Expense pada grafik. |
| AC-DSH-05 | Dashboard MVP tidak menampilkan total seluruh Fund atau total aset. |
| AC-DSH-06 | Transaction History menampilkan Income, Expense, dan Transfer dengan urutan terbaru terlebih dahulu. |
| AC-DSH-07 | Transaction History menyediakan filter tanggal/periode dan jenis transaksi. |
| AC-DSH-08 | Transaction History tidak menyediakan fitur pencarian teks pada MVP. |
| AC-DSH-09 | Transaksi aktual yang Pocket-nya dihapus tetap tersedia di Transaction History sebagai transaksi tanpa Pocket. |

## 8. Non-Functional Requirements

1. **Data consistency:** Informasi saldo Fund, Active Balance, Pocket Item, dan transaksi harus tetap konsisten setelah setiap operasi yang berhasil.
2. **Financial integrity:** Operasi keuangan yang gagal tidak boleh meninggalkan perubahan sebagian yang memengaruhi saldo atau status item.
3. **Usability:** Form dan alur konfirmasi harus menyampaikan informasi yang cukup agar pengguna memahami dampak tindakan keuangannya.
4. **Error feedback:** Ketika tindakan ditolak, aplikasi harus menyampaikan alasan yang dapat dipahami pengguna, khususnya untuk saldo tidak mencukupi dan Fund yang masih direferensikan Pocket Item.
5. **Persistence:** Data transaksi, Fund, Pocket, Automation, occurrence, dan Notification harus tetap tersedia setelah aplikasi ditutup dan dibuka kembali sesuai aturan masing-masing.
6. **Security:** Data keuangan hanya boleh dapat diakses oleh pengguna yang berwenang. Rincian kontrol keamanan dijelaskan pada SDD dan Database Design.
7. **Reliability:** Konfirmasi occurrence Automation tidak boleh menghasilkan transaksi ganda.
8. **Maintainability:** Perilaku fitur harus mengikuti pemisahan tanggung jawab dan rancangan teknis pada SDD.

## 9. Out of Scope

Fitur berikut tidak termasuk MVP Stage 1:
- Multi-currency.
- Laporan bulanan dan tahunan.
- Total seluruh Fund atau total aset pada Dashboard.
- Pencarian teks pada Transaction History.
- Kategori transaksi kustom.
- Automation untuk Transfer Pocket.
- Pengelolaan Automation dari halaman Notifications.
- Pengingat Notification berulang setiap 12 jam.
- Kedaluwarsa otomatis untuk Notification.
- Kolaborasi multi-user atau peran administrator.
- Layar penghapusan akun pada aplikasi.
- Mode offline.
- Fitur reset password.

---

## Document Ownership

PRD ini menjadi sumber utama untuk kebutuhan produk, ruang lingkup MVP, user roles, alur interaksi pengguna, functional requirements, business rules, acceptance criteria, non-functional requirements, dan out-of-scope.

Definisi struktur data dan aturan yang harus ditegakkan pada database berada di `database.md`. Rancangan arsitektur dan tanggung jawab teknis berada di `sdd.md`. Skenario pengujian dengan format input dan expected result berada di `testing.md`. Kontrak RPC, kode error, dan aturan locking backend berada di `backend-contract.md`.
