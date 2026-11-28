<img width="1920" height="480" alt="Cover" src="https://placehold.co/1920x480?text=Udin%27s" />

# Udin's — Personal Finance Tracking

Udin's adalah aplikasi mobile berbasis Expo SDK 58 dan React Native untuk membantu user mencatat, mengelola, dan memantau keuangan pribadi. Aplikasi ini saya bangun dengan Supabase sebagai backend & database beserta function RPC untuk mengatur logic utama aplikasi di level database. Fitur utama aplikasi ini mencakup Fund, Transaksi, Pocket, Automation, Notifikasi, dan Dashboard ringkasan keuangan.

<div align="center">
  <img width="720" alt="Tampilan aplikasi" src="https://placehold.co/720x400?text=App+Screenshot" />
</div>

## Key Features
- <b> Fund Management </b> : Kelola uang tunai, rekening, dan tabungan sebagai Active Fund atau Savings/Goal Fund, lengkap dengan Opening Balance, arsip, dan aktifkan kembali.
- <b> Transaction & History </b> : Catat Income, Expense, dan Transfer dengan filter jenis serta periode; saldo Fund diperbarui otomatis dan tidak pernah boleh negatif.
- <b> Pocket & Planned Expense </b> : Kelompokkan aktivitas keuangan per tujuan tanpa mengubah saldo Fund; Planned Expense baru memengaruhi Active Balance saat dialokasikan.
- <b> Automation & Notification </b> : Jadwal pemasukan dan pengeluaran berulang diproses saat aplikasi dibuka, dengan kartu notifikasi persisten yang dapat dikonfirmasi atau ditolak.
- <b> Dashboard Insight </b> : Ringkasan Active Balance, daftar Active Fund, grafik Expense tujuh hari terakhir, sapaan sesuai jam, dan nama tampilan pengguna.

## Workflow Aplikasi
Aplikasi saya bangun dengan beberapa layer dengan tujuan untuk menjaga konsistensi aplikasi dalam mengatur logic aplikasi. Adapun layer aplikasi ini sebagai berikut:
- Presentation : Layar Expo Router sebagai UI hanya menampilkan data dan menerima input; Layer ini hanya fokus di UI dan tidak melakukan fungsi apapun.
- AppServices : Seluruh use case dan validasi bisnis berada di layer ini, termasuk satu jalur mutasi transaksi untuk Income, Expense, dan Transfer.
- Repository : Layer ini menjadi data management utama yang memanggil database supabase baik untuk query maupun pemanggilan RPC.
- Database RPC : PostgreSQL menegakkan Row Level Security, constraint integritas, dan atomicity mutasi melalui function yang sudah ditentukan sebelumnya.
- Lokal & Jadwal : Tanggal kalender disimpan pukul 12.00 waktu perangkat agar tidak bergeser lintas timezone; Fitur Automation diproses saat aplikasi dibuka oleh user dan aplikasi dirancang tidak memiliki mode offline.

## Installation 
Pastikan anda memiliki Node.js dan npm terinstal di mesin pengembangan. Untuk menjalankan backend lokal dan pengujian database, siapkan pula [Docker](https://docs.docker.com/get-started/get-docker/) dan Supabase CLI. Bila ingin membuat APK, siapkan akun [Expo](https://expo.dev/) yang sudah terhubung dengan proyek ini melalui EAS.

1. Verify tools
   ```bash
   node --version && npm --version
   npx expo --version
   npx supabase --version
   ```
2. Fork repository

   Silahkan fork (garpu) repository dengan klik fork di kanan atas page ini
3. Clone repository
   ```bash
   git clone https://github.com/makmalluddin/my-finance-mobile.git
   ```
4. Install dependencies
   ```bash
   cd my-finance-mobile
   npm install
   ```
5. Create .env file
   ```bash
   cp .env.example .env
   ```
   Di dalam file .env isi dengan kredensial Supabase yang dipakai untuk development
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key # opsional, fallback untuk proyek lama
   ```
   Untuk perangkat fisik, gunakan IP LAN host yang dapat diakses HP; `127.0.0.1` hanya berlaku untuk emulator. Nilai production URL dan publishable key disimpan di EAS environment `production`, bukan di file `.env` lokal.
6. Run local Supabase (opsional untuk development)
   ```bash
   npx supabase start
   npx supabase db reset # terapkan ulang seluruh migration
   ```
7. Start development server
   ```bash
   npx expo start --android --clear
   ```
8. Verify
   ```bash
   npx expo lint
   npm test
   npx expo-doctor
   npx supabase test db
   npx expo export --platform android
   ```
9. Build internal APK

   Profil `preview` menghasilkan APK untuk distribusi internal yang bisa diinstall langsung di Android
   ```bash
   npx eas-cli@latest build --platform android --profile preview --non-interactive
   ```
   Setiap kali nama, ikon, atau konfigurasi native berubah, naikkan `android.versionCode` di `app.json` agar APK baru terpasang sebagai update, bukan ditolak karena versionCode sama atau lebih rendah.

## Appreciate For Resource
Ucapan terimakasih kepada tools dan pihak yang mendukung pengembangan aplikasi ini
- [Expo](https://expo.dev/) 
- [Supabase](https://supabase.com/) 
- [React Native](https://reactnative.dev/)
- [Figma Make](https://www.figma.com/make/)
- [Opencode] (https://opencode.ai/)