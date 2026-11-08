# 🍽️ SERVORA — Restaurant Order, Cashier, Kitchen & Inventory Management System

> **Sistem Manajemen Pesanan, Kasir, Dapur (KDS), dan Stok Bahan Baku Restoran Terintegrasi Real-Time berbasis Jaringan Wi-Fi Lokal (On-Premise / Rp 0 Biaya Hosting).**

---

## 📌 Sekilas Tentang Servora

**Servora** adalah aplikasi POS (*Point of Sale*) dan KDS (*Kitchen Display System*) terpadu yang dirancang khusus untuk operasional restoran mandiri (UMKM). Sistem ini berjalan di jaringan lokal restoran (*Local Area Network / Wi-Fi*), sehingga **resilien terhadap gangguan internet luar**, berlatensi sangat rendah, dan tanpa biaya langganan bulanan (*Rp 0 Cloud Hosting*).

Sistem ini menerapkan harga **nett** (sudah termasuk pajak PB1 dan biaya layanan), pelacakan kuota porsi menu, manajemen bahan mentah dapur, pemisahan stasiun masak, serta alarm notifikasi otomatis untuk pesanan terjadwal (*Pre-Order*).

---

## 🚀 Fitur Unggulan

### 1. Waiter & Cashier POS (Lantai Restoran)
* **Single-Screen POS:** Katalog menu dengan filter stasiun (*Semua, Indonesian Food, Western Food, Beverages*) dan pencarian instan.
* **Pelacakan Porsi Real-Time:** Sisa kuota porsi berkurang otomatis saat dipesan dan langsung bertanda *Habis (Sold Out)* jika stok 0.
* **Dine-in & Takeaway:** Pemilihan meja makan dengan visual status keterisian (*Tersedia / Terisi*).
* **Catatan Khusus per Menu:** Dukungan instruksi khusus pelanggan (misal: *level pedas, tanpa acar, es dipisah*).
* **Pre-Order Terjadwal:** Fitur pesanan di masa mendatang dengan kewajiban Down Payment (DP) 50%, kalkulasi otomatis sisa tagihan, dan notifikasi alarm H-10 menit.
* **Kasir & Pelunasan:** Pembayaran tunai/QRIS/transfer, kalkulator kembalian uang otomatis, dan tab monitoring riwayat 3 hari aktif.

### 2. Kitchen Display System / KDS (Layar Dapur)
* **Tema Gelap Deep Espresso (`bg-brand-950`):** Kontras tinggi, nyaman di mata koki, dan tombol sentuh besar (*56px*) ramah tablet dapur.
* **Kanban 3 Kolom Alur Masak:** Kolom *Menunggu Masak* (Amber), *Sedang Dimasak* (Sky Blue), dan *Siap Saji* (Emerald).
* **Sinkronisasi Instan (WebSocket):** Tiket masuk otomatis secara real-time via Laravel Reverb tanpa perlu refresh layar.
* **Suara Lonceng Dapur:** Ditenagai *Web Audio API* sintetis tanpa ketergantungan file MP3 eksternal.
* **Drawer Cepat Stok Menu & Bahan Baku:** Koki dapat mengubah status menu *Tersedia / Habis*, menambah/mengurangi porsi, atau mencatat mutasi bahan mentah (Daging Sapi, Ayam, Tortilla, Susu, dll.) langsung dari stasiun dapurnya.

### 3. Pembagian 3 Stasiun Kerja (Category Routing)
Pesanan pelanggan multi-kategori secara otomatis dipartisi ke stasiun koki yang relevan:
1. **Indonesian Food Station** (Nasi Goreng, Ayam Bakar, Soto Betawi, Mie Jawa)
2. **Western Food Station** (Beef Burger, Spaghetti Carbonara, Chicken Steak, French Fries)
3. **Beverages Station** (Kopi Susu Aren, Espresso Tonic, Matcha Latte, Lemon Tea, Air Mineral)

### 4. Manajemen Bahan Mentah (Raw Ingredients & Mutasi)
* Pemantauan persediaan bahan mentah dapur (Daging Sapi, Kulit Tortilla, Beras, Biji Kopi, dsb.).
* Pencatatan riwayat mutasi stok (*Masuk / Keluar / Koreksi Opname*) lengkap dengan nama staf penanggung jawab dan alasan.
* Peringatan dini (*Low Stock Alert*) otomatis ketika sisa bahan menyentuh batas minimum.

### 5. Admin & Manager Dashboard
* **Ringkasan KPI:** Omset pendapatan hari ini, jumlah transaksi lunas, serta pengukur beban kerja 3 stasiun dapur.
* **CRUD Master Data:** Manajemen menu makanan/minuman, meja makan, dan penugasan kategori koki.
* **Laporan Penjualan & Ekspor CSV:** Analisis omset per periode fleksibel, diagram distribusi penjualan per stasiun (Recharts), Top 5 menu terlaris, dan tombol **Export Laporan CSV (Excel)** dengan encoding UTF-8 BOM.

### 6. Script Peluncur 1-Klik (`start-servora.bat`)
* Otomatis mendeteksi IP Wi-Fi lokal server PC (`192.168.x.x`).
* Menampilkan URL akses untuk tablet kasir & dapur di jaringan yang sama (`http://<IP>:5173`).
* Menjalankan seluruh proses pendukung (API, Reverb, Queue Worker, Scheduler, Frontend) secara bersamaan.

---

## 🛠️ Tech Stack

* **Backend:** PHP 8.2+, Laravel 12, Laravel Sanctum, Laravel Reverb (WebSocket)
* **Frontend:** React 19, Vite, Tailwind CSS v3 (Warm Bistro Palette), Lucide React, Recharts
* **Database:** MySQL / MariaDB (XAMPP)
* **Realtime Protocol:** WebSocket over Reverb (Port 8080)
* **Audio Engine:** Web Audio API (Synthesizer Chime & Triple-Beep Alarm)

---

## 📂 Struktur Direktori

```text
SERVORA/
├── backend/                  # Laravel 12 REST API + Reverb WebSocket
│   ├── app/
│   │   ├── Actions/          # Business logic terisolasi (CreateOrder, RecordPayment, dll.)
│   │   ├── Console/Commands/ # Pre-Order dispatcher scheduler
│   │   ├── Enums/            # 9 PHP Enums (OrderStatus, PaymentStatus, dll.)
│   │   ├── Events/           # Reverb Broadcast Events
│   │   ├── Http/Controllers/ # REST API Controllers (Order, Kitchen, Report, dll.)
│   │   └── Models/           # 11 Eloquent Models
│   ├── database/             # Migrasi & Seeder data awal
│   └── routes/               # API, channels (WebSocket auth), console routes
│
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── api/              # Axios client dengan dynamic host resolution
│   │   ├── components/       # UI Reusable (Modal, Drawer, Badge, Banner Alarm)
│   │   ├── context/          # Auth, Echo (Reverb), Sound (Web Audio) Contexts
│   │   ├── features/
│   │   │   ├── auth/         # Login Page dengan tombol quick-login
│   │   │   ├── waiter/       # POS, Keranjang, Modal Bayar/DP, Pesanan Aktif
│   │   │   ├── kitchen/      # KDS 3-Kolom Kanban, Drawer Stok & Bahan
│   │   │   └── admin/        # Dashboard KPI, Master Data, Mutasi Stok, Laporan CSV
│   │   └── utils/            # Format Rupiah & tanggal/jam lokal
│   └── tailwind.config.js    # Palet warna Warm Bistro (brand-50 s.d. brand-950)
│
├── docs/                     # Dokumentasi PRD & Desain UI/UX
├── start-servora.bat         # Launcher 1-klik untuk Windows Server
└── README.md
```

---

## 💻 Panduan Instalasi & Menjalankan

### Prasyarat:
1. **XAMPP** (PHP 8.2+ dan MySQL / MariaDB aktif)
2. **Node.js** (v18 atau lebih baru)
3. **Composer**

### 1. Clone Repository
```bash
git clone https://github.com/username/servora.git
cd servora
```

### 2. Setup Backend
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Pastikan MySQL di XAMPP sudah berjalan, lalu buat database bernama `servora` di phpMyAdmin, kemudian jalankan migrasi beserta data awal:
```bash
php artisan migrate --seed
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run build
```

### 4. Menjalankan Aplikasi
Anda cukup menjalankan file peluncur otomatis dari root folder:
```bash
start-servora.bat
```
Atau jika ingin menjalankan manual per terminal:
- **Terminal 1 (Backend API):** `cd backend && php artisan serve --host=0.0.0.0 --port=8000`
- **Terminal 2 (WebSocket Reverb):** `cd backend && php artisan reverb:start --host=0.0.0.0 --port=8080`
- **Terminal 3 (Queue Worker):** `cd backend && php artisan queue:work`
- **Terminal 4 (Frontend POS & KDS):** `cd frontend && npm run dev -- --host 0.0.0.0 --port 5173`

Akses di browser PC: `http://localhost:5173`  
Akses dari HP / Tablet di Wi-Fi yang sama: `http://<IP_KOMPUTER_SERVER>:5173`

---

## 🔑 Akun Demo Pengujian

Semua akun menggunakan password bawaan: `password`

| Username | Peran / Stasiun | Hak Akses |
| :--- | :--- | :--- |
| `admin` | **Manager / Admin** | Akses penuh dashboard, menu, meja, staf, stok bahan, laporan omset, dan switcher mode |
| `waiter` | **Waiter & Kasir** | Pembuatan pesanan Dine-in / Takeaway / Pre-Order, pelunasan kasir & cetak bukti |
| `koki_indo` | **Koki Masakan Indonesia** | Layar antrean tiket Indonesian Food & drawer stok bahan baku terkait |
| `koki_western` | **Koki Masakan Barat** | Layar antrean tiket Western Food & drawer stok bahan baku terkait |
| `barista` | **Barista Minuman** | Layar antrean tiket Beverages / Minuman & drawer stok bahan baku minuman |

*(Halaman Login juga menyediakan tombol cepat Quick-Login untuk mempermudah pergantian role saat demo/pengujian).*

---

## 📄 Lisensi

Dikembangkan untuk kebutuhan operasional UMKM kuliner dengan lisensi open source [MIT](LICENSE).
