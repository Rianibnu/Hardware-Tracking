# Hardware Tracking (Monitoring Inventaris)

Aplikasi Monitoring Inventaris dan Hardware Tracking yang dibangun menggunakan **Laravel 11**, **React**, **Inertia.js**, dan **Tailwind CSS**. Sistem ini memudahkan manajemen aset, pelaporan kerusakan (ticketing), serta pelacakan hardware secara komprehensif.

## 🚀 Fitur Utama

- **Manajemen Aset:** Pencatatan dan pelacakan detail hardware, status (Tersedia, Digunakan, Maintenance, Rusak, Dibuang), lokasi, dan kategori.
- **Sistem Tiket (Helpdesk):** Pelaporan kendala teknis (maintenance, perbaikan vendor) beserta tracking status pengerjaannya.
- **Pencarian Global (Global Search):** Cari aset, tiket, kategori, atau lokasi dengan cepat dari mana saja (mendukung shortcut `Ctrl/Cmd + K`).
- **Notifikasi Real-time:** Pemberitahuan instan untuk tiket baru dan update status menggunakan **Laravel Reverb**.
- **Integrasi QR Code:** Label aset yang dapat di-scan langsung untuk melihat detail barang.
- **Manajemen Role:** Pembagian akses antara Admin, Teknisi, dan Pengguna Umum.
- **UI Modern & Responsif:** Dibangun menggunakan komponen UI terkini (Shadcn UI) dan *toast notifications* (Sonner).

## 🛠️ Tech Stack

- **Backend:** Laravel 11, PHP 8.2+
- **Frontend:** React 18, Inertia.js, Tailwind CSS v4
- **UI Components:** Shadcn UI, Radix UI, Lucide Icons
- **Real-time WebSockets:** Laravel Reverb & Laravel Echo
- **Database:** MySQL / PostgreSQL / SQLite

## ⚙️ Persyaratan Sistem

- PHP >= 8.2
- Composer
- Node.js (>= 18) & NPM
- Database Server (MySQL/MariaDB/PostgreSQL)

## 📦 Instalasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal (development):

1. **Clone Repository**
   ```bash
   git clone https://github.com/Rianibnu/Hardware-Tracking.git
   cd Hardware-Tracking/Tracking
   ```

2. **Install Dependencies PHP**
   ```bash
   composer install
   ```

3. **Install Dependencies Node/JavaScript**
   ```bash
   npm install
   ```

4. **Konfigurasi Environment**
   Duplikat file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Atur koneksi database Anda di file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database_anda
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

6. **Migrasi Database & Seeding (Opsional jika ingin data dummy)**
   ```bash
   php artisan migrate --seed
   ```

7. **Link Storage**
   ```bash
   php artisan storage:link
   ```

## 🚀 Menjalankan Aplikasi

Aplikasi ini membutuhkan beberapa proses yang harus berjalan secara bersamaan agar fitur Real-time (WebSockets) dan Queue berfungsi dengan baik.

Buka beberapa terminal tab dan jalankan perintah-perintah berikut:

**Terminal 1: Jalankan Web Server Laravel**
```bash
php artisan serve
```

**Terminal 2: Jalankan Vite Build Server (React/Frontend)**
```bash
npm run dev
```

**Terminal 3: Jalankan Queue Worker (Untuk proses di latar belakang)**
```bash
php artisan queue:work
```

**Terminal 4: Jalankan Reverb Server (Untuk Notifikasi Real-time)**
```bash
php artisan reverb:start
```

Setelah semua berjalan, akses aplikasi melalui browser di: `http://localhost:8000`

## 📝 Lisensi

Aplikasi ini bersifat *open-source* dengan lisensi [MIT license](https://opensource.org/licenses/MIT).
