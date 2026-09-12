# Bloxboxd

Bloxboxd adalah platform pelacakan, pencatatan (logging), ulasan, dan penemuan pengalaman Roblox yang terinspirasi dari arsitektur media logging Letterboxd. Platform ini menghubungkan pemain dengan data resmi dari API Roblox secara langsung dan menyimpan interaksi komunitas ke dalam database cloud terdistribusi Turso LibSQL.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur dan Teknologi](#arsitektur-dan-teknologi)
- [Kinerja dan Standar Keamanan](#kinerja-dan-standar-keamanan)
- [Prasyarat Sistem](#prasyarat-sistem)
- [Instalasi dan Menjalankan Lokal](#instalasi-dan-menjalankan-lokal)
- [Panduan Deployment ke Vercel](#panduan-deployment-ke-vercel)
  - [Metode 1: Deploy Melalui Vercel CLI](#metode-1-deploy-melalui-vercel-cli)
  - [Metode 2: Deploy Melalui Integrasi GitHub](#metode-2-deploy-melalui-integrasi-github)
- [Konfigurasi Variabel Lingkungan](#konfigurasi-variabel-lingkungan)
- [Skema Basis Data](#skema-basis-data)
- [Lisensi](#lisensi)

---

## Fitur Utama

### 1. Multi-Genre Champion Spotlight Slideshow
Banner utama pada katalog menampilkan pengalaman nomor satu terbaik dari setiap kategori genre resmi di platform Roblox (Horror, Action / Fighting, Adventure / RPG, Social / Roleplay, Shooter / FPS, Obby / Parkour, Simulator / Tycoon, Tower Defense, serta Platform Trending).
- Perputaran Otomatis: Berganti setiap 6 detik secara berurutan.
- Jeda Pintar (Smart Pause): Rotasi otomatis dijeda ketika pengguna mengarahkan kursor mouse (hover) atau menyentuh layar pada perangkat seluler.
- Indikator Visual: Dilengkapi dengan bilah kemajuan (progress bar) hitung mundur dan kontrol navigasi manual (tombol panah, pemilih dot, dan toggle play/pause).
- Independen dari Filter: Banner tidak terpengaruh oleh penyaringan genre katalog di bagian bawah, sehingga tetap menyajikan ikhtisar lintas genre secara utuh.

### 2. Sinkronisasi Data Real-Time Roblox API
Semua data statistik pengalaman diambil langsung dari API resmi Roblox:
- Jumlah pemain online yang sedang aktif secara langsung.
- Penghitungan rating berbasis persentase upvote dan downvote resmi.
- Total kunjungan dan jumlah favorit.
- Deep link langsung ke place resmi di situs web Roblox.

### 3. Katalog dan Pencarian Adaptif
- Filter Genre: Penyaringan akurat berdasarkan genre utama, tag konten, dan analisis semantik deskripsi game.
- Pengurutan Cerdas: Berdasarkan pemain terbanyak (popularitas), rating tertinggi, total kunjungan, tahun rilis, dan urutan alfabet.
- Pencarian Omni-Search: Pencarian teks langsung yang terintegrasi dengan penemuan resmi Roblox serta dukungan pencarian via Universe ID dan Place ID.
- Infinite Scroll: Pemuatan data berkelanjutan dengan konsumsi memori browser yang minimal.

### 4. Logging, Diary, dan Rak Koleksi (Shelves)
Pengguna dapat mencatat pengalaman bermain mereka seperti pada Letterboxd:
- Status Rak: Played (Pernah Dimainkan), Playing (Sedang Dimainkan), Backlog (Daftar Tunggu), dan Dropped (Berhenti).
- Rating Skala 5 Bintang: Penilaian presisi kelipatan 0.5 bintang (0.5 hingga 5.0).
- Ulasan dan Peringatan Spoiler: Penulisan ulasan terperinci dengan penanda spoiler teks.
- Buku Harian (Diary): Rekam jejak kronologis aktivitas bermain berdasarkan tanggal log.

### 5. Komunitas dan Kurasi
- Feed Ulasan Komunitas: Ulasan publik dari seluruh pengguna dengan fitur like dan komentar diskusi bertingkat.
- Custom Curated Lists: Pembuatan daftar koleksi kustom oleh pengguna (misal: "Top Survival Games 2026") yang dapat dibagikan dan disukai oleh anggota komunitas lain.
- Profil Pengguna: Statistik jumlah log, game favorit, ulasan terpopuler, dan sistem pertemanan (Follow).

### 6. Sistem Akun dan Keamanan PIN
- Login Cepat: Otentikasi berbasis Username atau User ID Roblox yang dilengkapi dengan PIN keamanan 4 digit.
- Rate Limiting: Proteksi sliding window anti brute-force pada verifikasi PIN (maksimal 5 kali percobaan gagal per 15 menit).

---

## Arsitektur dan Teknologi

Platform Bloxboxd dibangun menggunakan arsitektur full-stack modern yang dapat dijalankan sebagai server mandiri maupun sebagai fungsi serverless di cloud:

### Frontend
- React 19: Pustaka antarmuka pengguna berbasis komponen dengan pemanfaatan concurrent transitions.
- Vite 6: Bundler generasi terbaru dengan Hot Module Replacement (HMR) berkecepatan tinggi.
- Tailwind CSS 4: Framework utilitas CSS untuk tata letak responsif dan desain dark mode.
- Lucide React: Kumpulan ikon antarmuka bersih dan konsisten.
- Motion: Pustaka animasi transisi halus.

### Backend
- Node.js dan Express.js: Server RESTful API untuk menangani agregasi data Roblox, operasi database, dan sanitasi permintaan.
- Vercel Serverless Function: Adaptasi server Express melalui handler serverless (`api/index.ts`) untuk komputasi nirserver.

### Database
- Turso Database (LibSQL Cloud): Basis data relasional SQLite terdistribusi dengan latensi rendah melalui koneksi aman HTTP dan WebSocket.
- 16 Indeks B-Tree Strategis: Pengindeksan pada kolom-kolom relasi utama (`universe_id`, `genre`, `user_id`, `created_at`, `likes_count`) untuk memastikan performa query tinggi dalam skala data besar.

---

## Kinerja dan Standar Keamanan

Implementasi kode Bloxboxd mematuhi praktik rekayasa perangkat lunak standar industri:

1. **Dynamic Code-Splitting**: Modul non-kritis (`GameDetailView`, `ProfileView`, `CommunityView`, `ListsView`, modal dialog) dipisahkan menggunakan `React.lazy` dan `<Suspense>` untuk mereduksi ukuran bundle awal hingga di bawah 120 kB gzip.
2. **Optimasi Core Web Vitals**:
   - Largest Contentful Paint (LCP): Aset gambar prioritas tinggi pada viewport pertama dimuat dengan `loading="eager"` dan atribut JSX `fetchPriority="high"`.
   - Cumulative Layout Shift (CLS): Seluruh pembungkus kartu gambar mengunci rasio aspek (`aspect-square`) untuk mencegah pergeseran tata letak (skor CLS = 0).
   - Interaction to Next Paint (INP): Interaksi pemilihan genre dan filter dibungkus dalam `startTransition` React 19 agar eksekusi UI tidak memblokir input pengguna.
3. **Hardened HTTP Security Headers**: Dilengkapi middleware Express yang menerapkan header Content Security Policy (CSP), X-Frame-Options: SAMEORIGIN (proteksi Clickjacking), X-Content-Type-Options: nosniff, dan Referrer-Policy.
4. **Sanitasi Input dan Anti-XSS**: Pembersihan karakter berbahaya `<` dan `>` serta pembatasan panjang payload pada semua input form ulasan, komentar, dan profil.
5. **Mitigasi Reverse Tabnabbing**: Semua tautan eksternal ke situs web pihak ketiga menggunakan atribut `target="_blank"` dan `rel="noopener noreferrer"`.
6. **Otorisasi Data Zero-Trust**: Validasi kepemilikan record pada operasi mutasi basis data untuk mencegah kerentanan Broken Object Level Authorization (BOLA/IDOR).

---

## Prasyarat Sistem

Sebelum menjalankan project secara lokal, pastikan perangkat Anda telah terpasang:
- Node.js versi 18.0.0 atau lebih baru (direkomendasikan Node.js 20 LTS atau 22 LTS).
- Package manager `npm` (bawaan Node.js) atau `bun`.
- Koneksi internet aktif untuk sinkronisasi live API Roblox dan Turso Cloud.

---

## Instalasi dan Menjalankan Lokal

1. Kloning repositori ini ke komputer Anda:
   ```bash
   git clone https://github.com/Mriskiali/bloxboxd.git
   cd bloxboxd
   ```

2. Pasang semua dependensi project:
   ```bash
   npm install
   ```

3. Siapkan file konfigurasi lingkungan:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan kredensial Turso Database Anda:
   ```env
   TURSO_DATABASE_URL="database url anda"
   TURSO_AUTH_TOKEN="token-autentikasi-turso-anda"
   ```
   *Catatan: Jika variabel dibiarkan kosong, sistem secara otomatis beralih menggunakan basis data lokal SQLite (`bloxboxd.db`).*

4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```

5. Buka peramban (browser) dan akses alamat:
   ```
   http://localhost:3000
   ```

---

## Panduan Deployment ke Vercel

Project ini sudah dilengkapi konfigurasi berkas `vercel.json` dan handler serverless `api/index.ts`, sehingga dapat langsung dideploy ke platform Vercel tanpa konfigurasi tambahan pada codebase.

### Metode 1: Deploy Melalui Vercel CLI

Metode tercepat tanpa perlu menghubungkan repository terlebih dahulu:

1. Buka terminal di direktori utama project:
   ```bash
   npx vercel
   ```

2. Ikuti petunjuk interaktif pada terminal:
   - "Set up and deploy?" ketik `y` lalu tekan Enter.
   - Pilih scope akun Vercel Anda.
   - "Link to existing project?" ketik `n`.
   - Beri nama project, misalnya `bloxboxd`.
   - "In which directory is your code located?" tekan Enter (`./`).
   - "Want to modify these settings?" ketik `n`.

3. Daftarkan variabel lingkungan basis data ke Vercel:
   ```bash
   npx vercel env add TURSO_DATABASE_URL production
   ```
   *(Ketik atau tempel URL database Turso Anda)*

   ```bash
   npx vercel env add TURSO_AUTH_TOKEN production
   ```
   *(Ketik atau tempel token rahasia Turso Anda)*

4. Luncurkan ke lingkungan production:
   ```bash
   npx vercel --prod
   ```

---

### Metode 2: Deploy Melalui Integrasi GitHub

Metode standar untuk pembaruan berkelanjutan (Continuous Deployment):

1. Pastikan seluruh perubahan kode telah dicommit dan diunggah ke repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: setup bloxboxd production deployment"
   git branch -M main
   git remote add origin https://github.com/username-anda/bloxboxd.git
   git push -u origin main
   ```

2. Buka dashboard Vercel di [https://vercel.com](https://vercel.com) dan login dengan akun Anda.
3. Klik tombol **Add New...** pada pojok kanan atas, lalu pilih **Project**.
4. Pilih repository `bloxboxd` dari daftar repository GitHub Anda dan klik **Import**.
5. Pada bagian **Build and Output Settings**, pastikan pengaturan sebagai berikut:
   - Framework Preset: `Vite`
   - Build Command: `vite build`
   - Output Directory: `dist`
6. Buka bagian **Environment Variables** dan tambahkan 2 variabel rahasia berikut:
   - `TURSO_DATABASE_URL` diisi dengan URL database Turso Anda.
   - `TURSO_AUTH_TOKEN` diisi dengan auth token Turso Anda.
7. Klik tombol **Deploy**.
8. Tunggu hingga proses build selesai. Vercel akan menerbitkan domain publik (contoh: `https://bloxboxd.vercel.app`).

---

## Konfigurasi Variabel Lingkungan

| Nama Variabel | Wajib | Deskripsi |
| :--- | :--- | :--- |
| `TURSO_DATABASE_URL` | Ya (Production) | URL endpoint basis data Turso LibSQL Cloud. |
| `TURSO_AUTH_TOKEN` | Ya (Production) | Token otentikasi JWT yang diterbitkan oleh Turso CLI atau dashboard Turso. |
| `PORT` | Tidak | Port listening untuk server lokal (nilai default: `3000`). Pada Vercel, port dikelola otomatis oleh runtime serverless. |

---

## Skema Basis Data

Basis data Bloxboxd dikelola melalui LibSQL Client dengan skema relasional berikut:

- `games`: Informasi metadata pengalaman (ID Universe, Place ID, nama, deskripsi, genre, tag, pencipta, rating agregat, jumlah pemain, dan URL ikon).
- `game_logs`: Entri pencatatan pengguna untuk setiap game (status rak koleksi, rating pribadi, ulasan, penanda spoiler, dan tanggal aktivitas).
- `reviews`: Ulasan game yang dipublikasikan ke feed komunitas publik beserta jumlah apresiasi (likes).
- `review_likes`: Relasi penanda like antara akun pengguna dan ulasan tertentu.
- `review_comments`: Balasan atau komentar diskusi bertingkat pada ulasan game.
- `custom_lists`: Koleksi daftar kurasi yang dibuat oleh pengguna beserta visibilitas publik/privat.
- `list_items`: Pemetaan game yang terdaftar di dalam custom list.
- `list_likes`: Apresiasi suka pengguna terhadap daftar kurasi tertentu.
- `user_profiles`: Profil pengguna (bio, username, URL avatar, PIN terenkripsi, tanggal bergabung).
- `follows`: Relasi pertemanan antar pengguna (Follower dan Following).

Seluruh tabel kunci dilengkapi dengan indeks B-Tree untuk memastikan waktu eksekusi query tetap stabil di bawah 15 milidetik pada data berskala ratusan ribu baris.

---

## Lisensi

Project ini dilisensikan di bawah lisensi MIT. Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini untuk keperluan pembelajaran maupun pengembangan lebih lanjut.
