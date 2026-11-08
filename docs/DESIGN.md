# Design System & UI/UX Specification
# Servora — Restaurant Order & Kitchen Management System

| Atribut | Keterangan |
|---|---|
| Nama Produk | Servora |
| Tema Visual | **Warm Artisanal Bistro** (Espresso, Coklat Tua, Coklat Susu, & Krem Hangat) |
| Framework CSS | Tailwind CSS |
| Target Perangkat | Tablet (Landscape/Portrait 768px–1024px) & Desktop (1280px+) |
| Status Dokumen | v1.0 — Acuan UI/UX & Frontend Development |

---

## 1. Filosofi Desain & Arah Visual

Nuansa warna **coklat (espresso, mocha, coklat susu, krem latte)** sangat cocok untuk aplikasi F&B/restoran karena memberikan kesan **hangat, nyaman, bersih, dan menggugah selera**, serta **tidak membuat mata cepat lelah** dibanding warna putih murni (`#FFFFFF`) saat staf menatap layar tablet seharian.

Namun, ada **1 aturan emas UX** saat memakai tema coklat di sistem operasional restoran:
> **Warna coklat digunakan untuk struktur, navigasi, tombol aksi utama, dan latar belakang (surface). Sedangkan warna status pesanan (Menunggu, Diproses, Siap, Batal, Alarm Pre-Order) WAJIB menggunakan warna semantik yang kontras (Kuning Emas, Biru, Hijau, Merah)** agar mata waiter dan staf dapur dapat mengenali status dalam hitungan detik dari jarak jauh.

---

## 2. Palet Warna (Color System)

### 2.1 Palet Utama: Warm Brown & Coklat Susu (`servora` / `brand`)

Gunakan skala warna ini di `tailwind.config.js` sebagai warna utama aplikasi:

| Token Tailwind | Nama Warna | Kode HEX | Penggunaan Utama |
|---|---|---|---|
| `brand-950` | **Deep Espresso** | `#231710` | Teks utama (pengganti hitam pekat), background utama Kitchen Display (dark mode) |
| `brand-900` | **Dark Roast** | `#38251A` | Sidebar navigasi Admin, Header Kitchen, kartu pada mode gelap |
| `brand-800` | **Rich Mocha** | `#543828` | **Primary Button** (tombol "Kirim ke Dapur", "Bayar"), header aktif |
| `brand-700` | **Roasted Cocoa** | `#6F4B36` | Hover state untuk Primary Button, ikon utama, teks sub-judul |
| `brand-600` | **Cinnamon Brown** | `#8A6046` | Border aktif pada input/meja yang dipilih, aksen sekunder |
| `brand-500` | **Milk Chocolate (Coklat Susu)** | `#A67C5B` | Tab kategori aktif, badge tipe kategori, tombol sekunder |
| `brand-400` | **Warm Caramel** | `#C29B7A` | Teks placeholder, ikon non-aktif, aksen dekoratif |
| `brand-300` | **Creamy Latte** | `#DBC1A8` | Border kartu, garis pemisah tabel (`divider`) |
| `brand-200` | **Almond Milk** | `#EAD9C8` | Background tombol sekunder, hover baris tabel, chip filter non-aktif |
| `brand-100` | **Oat Milk** | `#F4ECE1` | **Background utama halaman (App Canvas)** — hangat & nyaman di mata |
| `brand-50` | **Warm Cream** | `#FBF8F4` | **Background kartu produk, panel keranjang, & modal** (pengganti putih `#FFF`) |

### 2.2 Warna Kategori / Station (3 Kategori Tetap)

Agar staf langsung mengenali kategori tanpa harus membaca panjang:

| Kategori / Station | Warna Badge | Background Badge | Text & Border | Ikon |
|---|---|---|---|---|
| **Indonesian Food** | Terracotta / Coklat Kemerahan | `#FDECE6` | `#9A3412` | 🍛 |
| **Western Food** | Warm Amber / Coklat Keemasan | `#FEF3C7` | `#92400E` | 🍔 |
| **Beverages** | Sage / Teh Hijau Hangat | `#E6F4EA` | `#166534` | 🍹 |

### 2.3 Warna Semantik Status Pesanan & Pembayaran

Warna status dirancang agar **kontras tinggi** di atas permukaan krem (`brand-50`) maupun coklat gelap (`brand-950`):

| Status | Makna | Text / Icon HEX | Background HEX | Border HEX |
|---|---|---|---|---|
| **Scheduled (Pre-Order)** | Menunggu waktu reminder | `#6D28D9` (Ungu) | `#F3E8FF` | `#C4B5FD` |
| **Pending (Menunggu)** | Baru masuk, belum dimasak | `#B45309` (Kuning Amber) | `#FEF3C7` | `#FCD34D` |
| **On Progress (Diproses)** | Sedang dimasak di dapur | `#0369A1` (Biru Cerah) | `#E0F2FE` | `#7DD3FC` |
| **Ready (Siap)** | Makanan siap diambil/diantar | `#15803D` (Hijau Segar) | `#DCFCE7` | `#86EFAC` |
| **Served (Tersaji)** | Sudah di meja pelanggan | `#57534E` (Abu Hangat) | `#E7E5E4` | `#D6D3D1` |
| **Cancelled / Alarm PO** | Dibatalkan / Alarm Pre-Order | `#B91C1C` (Merah Tegas) | `#FEE2E2` | `#FCA5A5` |
| **DP Paid (`partially_paid`)** | Baru bayar uang muka PO | `#A16207` (Kuning Tua) | `#FEF9C3` | `#FDE047` |
| **Paid (`paid`)** | Lunas | `#15803D` (Hijau) | `#DCFCE7` | `#86EFAC` |
| **Stok Porsi Menipis** | Sisa porsi $\le 5$ | `#B45309` (Amber) | `#FEF3C7` | `#FCD34D` |
| **Bahan Baku Menipis** | `current_stock <= minimum` | `#B91C1C` (Merah Peringatan) | `#FEE2E2` | `#FCA5A5` |

### 2.4 Cuplikan Konfigurasi `tailwind.config.js`

```javascript
// Konfigurasi warna siap pakai untuk tahap coding
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF8F4',
          100: '#F4ECE1',
          200: '#EAD9C8',
          300: '#DBC1A8',
          400: '#C29B7A',
          500: '#A67C5B', // Coklat Susu
          600: '#8A6046',
          700: '#6F4B36',
          800: '#543828', // Coklat Tua / Primary CTA
          900: '#38251A', // Dark Roast
          950: '#231710', // Deep Espresso
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    }
  }
}
```

---

## 3. Tipografi & Hierarki Teks

- **Font Utama (`sans`):** **Plus Jakarta Sans** atau **Inter** — bersih, modern, angka sangat mudah dibaca untuk harga dan kuantitas.
- **Font Angka/Nomor Order (`mono`):** **JetBrains Mono** atau `tabular-nums` — digunakan pada nomor order (`SRV-20261105-0012`), jam countdown pre-order, dan nominal kasir agar sejajar rapi.

| Elemen | Ukuran (Waiter & Admin) | Ukuran (Kitchen Display) | Ketebalan |
|---|---|---|---|
| Judul Halaman / Nomor Meja Tiket | `24px` (`text-2xl`) | `30px` (`text-3xl`) | `font-bold` (700) |
| Nama Menu di Tiket / Modal | `16px` (`text-base`) | `22px` (`text-xl`) | `font-semibold` (600) |
| Kuantitas Item (`2x`) | `16px` (`text-base`) | `26px` (`text-2xl`) | `font-extrabold` (800) |
| Catatan Khusus (`tidak pedas`) | `14px` (`text-sm`) | `18px` (`text-lg`) | `font-medium` (500) |
| Harga & Total Tagihan | `16px–20px` | *(Tidak ditampilkan)* | `font-bold` (700) |
| Label Badge Status | `12px` (`text-xs`) | `14px` (`text-sm`) | `font-semibold` (600) |

---

## 4. Spesifikasi Komponen UI & Ergonomi Sentuh (Touch Target)

Karena aplikasi dioperasikan menggunakan jari pada layar tablet (seringkali dengan cepat oleh waiter atau tangan basah/berminyak di dapur):

1. **Ukuran Tombol Minimum:**
   - **Waiter & Admin:** tinggi minimal `44px` (`h-11` atau `py-2.5 px-4`), sudut membulat lembut `rounded-xl` (`12px`).
   - **Kitchen Display:** tinggi minimal `56px` (`h-14`), font tegas, seluruh lebar kartu (`w-full`) untuk tombol **"Mulai Masak"** dan **"Siap Disajikan"**.
2. **Kartu Produk (Waiter Menu):**
   - Background `bg-brand-50`, border `border-brand-200`, shadow halus `shadow-sm`.
   - Saat ditekan: efek `active:scale-[0.98]` dan border berubah menjadi `border-brand-600`.
   - Jika produk **Habis (`is_available = false`)**: seluruh kartu diberi `opacity-50 grayscale`, dengan pita/badge merah **"Habis"** di pojok atas dan tidak bisa diklik.
3. **Highlight Catatan Khusus (Special Instructions):**
   - Catatan item (contoh: *"Jangan pedas, es dipisah"*) **WAJIB** tampil di dalam kotak kecil berlatar kuning muda (`bg-amber-100 text-amber-900 border-l-4 border-amber-500 px-2.5 py-1 rounded`) baik di keranjang waiter maupun di layar kitchen.
4. **Indikator Koneksi Wi-Fi Lokal:**
   - Di pojok kanan atas setiap layar terdapat pill kecil:
     - 🟢 **Terhubung (Live)** — WebSocket Reverb aktif.
     - 🟡 **Menyambung...** — sedang reconnect.
     - 🔴 **Mode Cadangan (15 dtk)** — fallback polling aktif.
5. **Badge Stok Porsi Menu (Waiter):**
   - Jika produk memiliki `track_stock = true`, kartu produk menampilkan chip sisa porsi:
     - Sisa porsi > 5: chip krem lembut (`bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-md`, mis. *"Sisa 12 porsi"*).
     - Sisa porsi $\le 5$: chip peringatan amber (`bg-amber-100 text-amber-800 border border-amber-300 font-semibold`, mis. *"Sisa 3 porsi!"*).
     - Sisa porsi = 0: kartu menjadi abu-abu nonaktif dengan badge merah *"Habis"*.
6. **Panel Kontrol Stok Cepat (Kitchen & Admin):**
   - Staf dapur dapat membuka drawer/modal cepat untuk menambah porsi menu (misal saat batch baru selesai dimasak: `+10 porsi`).
   - Kartu bahan baku mentah menampilkan sisa fisik (mis. `Daging Sapi: 4.5 kg`) dengan tombol cepat `[ + Restock ]` dan `[ - Catat Pemakaian ]`. Jika mencapai batas minimum, kartu otomatis bergaris merah dengan label *"⚠️ Stok Menipis"*.

---

## 5. Tata Letak (Layout) per Dashboard

### 5.1 Dashboard Waiter & Kasir (1 Orang Merangkap — Skala UMKM)

Dirancang dengan konsep **Single-Screen POS** pada tablet landscape (`1024x768` atau lebih besar) sehingga waiter tidak perlu berpindah-pindah halaman:

```
+-----------------------------------------------------------------------------------+
| [Logo Servora]  [+ Buat Pesanan]  [Pesanan Aktif (4)]  [Pre-Order (1)]  [Riwayat] |
|                                                       [🟢 Live] [Rina - Waiter v] |
+---------------------------------------------------+-------------------------------+
| FILTER KATEGORI:                                  | KERANJANG PESANAN             |
| [ Semua ] [🍛 Indo Food] [🍔 Western] [🍹 Minuman]| [Dine-in] | [Takeaway]        |
|                                                   | Meja: [ Meja 04 v ] [🕒 PO?]  |
| [🔍 Cari nama menu...                           ] |-------------------------------|
|                                                   | 🍛 INDONESIAN FOOD            |
| +---------------+ +---------------+ +-----------+ | 2x Nasi Goreng Spesial  70.000|
| | [Foto Menu]   | | [Foto Menu]   | | [HABIS]   | |    📝 "1 pedas, 1 sedang"     |
| | Nasi Goreng   | | Mie Goreng    | | Sate Ayam | |    [- 2 +] [Edit Catatan] [🗑]|
| | Rp 35.000     | | Rp 30.000     | | Rp 40.000 | |                               |
| | [ + Tambah ]  | | [ + Tambah ]  | | (Nonaktif)| | 🍹 BEVERAGES                  |
| +---------------+ +---------------+ +-----------+ | 2x Es Kopi Susu Coklat  40.000|
|                                                   |    [- 2 +] [Edit Catatan] [🗑]|
| +---------------+ +---------------+ +-----------+ |-------------------------------|
| | Beef Burger   | | French Fries  | | Es Teh    | | Total (Nett):      Rp 110.000 |
| | Rp 45.000     | | Rp 20.000     | | Rp 10.000 | | [  💵 Bayar Sekarang / DP   ] |
| | [ + Tambah ]  | | [ + Tambah ]  | | [+ Tambah]| | [ 🚀 KIRIM KE DAPUR (4 Item)] |
+---------------------------------------------------+-------------------------------+
```

**Fitur Kunci UI Waiter/Kasir:**
- **Tombol "Kirim ke Dapur" (`bg-brand-800 text-white`):** Langsung mengirim pesanan ke dapur terkait.
- **Tombol "Bayar Sekarang / DP" (`bg-brand-200 text-brand-900`):** Membuka modal pembayaran cepat:
  - Jika pesanan **Pre-Order** dipilih $\rightarrow$ otomatis meminta input **Nominal DP** (misal Rp 50.000) + metode bayar (`Tunai`, `QRIS`, `Kartu`) sebelum pesanan disimpan.
  - Jika pesanan **Takeaway** $\rightarrow$ waiter bisa langsung klik "Lunas & Kirim ke Dapur" dalam 1 alur.
- **Tab "Pesanan Aktif":** Menampilkan kartu semua pesanan yang sedang berjalan.
  - Untuk **Dine-in**: ada tombol **"Tandai Tersaji (Served)"** saat item berstatus Ready, dan tombol **"Terima Pembayaran"** jika masih `unpaid`.
  - Untuk **Takeaway**: begitu semua item **Ready** dan status bayar **Lunas**, kartu otomatis berlabel hijau **"Siap Diambil / Selesai"** (sesuai keputusan Q-08).

---

### 5.2 Dashboard Kitchen Display (Stasiun Dapur)

Untuk area dapur, disarankan menggunakan **Warm Espresso Dark Mode (`bg-brand-950`)** dengan kartu tiket berwarna krem terang (`bg-brand-50`) atau coklat gelap kontras tinggi agar tidak silau namun tulisan sangat jelas terbaca dari jarak 1–2 meter:

```
+-----------------------------------------------------------------------------------+
| 🍳 STASIUN: INDONESIAN FOOD        [Tab: Antrean Aktif (3)] [Tab: Pre-Order (2)]  |
| [🔊 Suara: Aktif] [🍔 Stasiun] [🟢 Live]                              Jam: 09:50 |
+-----------------------------------------------------------------------------------+
| 🚨 ALARM PRE-ORDER: #SRV-0019 (Meja 08 / Ibu Diah) — Jadwal 10:00 (10 mnt lagi!)  |
|                                                       [ 🔥 MULAI MASAK SEKARANG ] |
+-----------------------------------------------------------------------------------+
| KOLOM 1: MENUNGGU (2)        | KOLOM 2: DIPROSES (1)     | KOLOM 3: SIAP (1)      |
|------------------------------|---------------------------|------------------------|
| +--------------------------+ | +-----------------------+ | +--------------------+ |
| | MEJA 04       ⏱ 02:15   | | | TAKEAWAY      ⏱ 08:40| | | MEJA 02    ✅ SIAP | |
| | #SRV-0021  (Ada 2 Dapur) | | | "Bpk Andi"   #SRV-0020| | | #SRV-0018          | |
| |--------------------------| | |-----------------------| | |--------------------| |
| | 2x Nasi Goreng Spesial   | | | 1x Ayam Bakar Madu    | | | 2x Soto Betawi     | |
| | ⚠️ "1 pedas, 1 sedang"   | | |                       | | |                    | |
| |                    [Mulai]| | |                 [Siap]| | | Menunggu diambil   | |
| |--------------------------| | |-----------------------| | | waiter...          | |
| | [ 🔥 MULAI SEMUA (1)   ] | | | [ ✅ SIAP SEMUA (1) ] | | +--------------------+ |
| +--------------------------+ | +-----------------------+ |                        |
+-----------------------------------------------------------------------------------+
```

**Fitur Kunci UI Kitchen:**
- **Banner Alarm Pre-Order H-10 Menit:** Muncul tepat di bagian atas layar dengan warna merah/oranye berkedip + bunyi alarm saat jam menunjukkan 10 menit sebelum jadwal PO (contoh: jam `09:50` untuk PO jam `10:00`).
- **Tombol Cepat Ketersediaan Menu & Porsi:** Drawer/panel samping sederhana tempat koki bisa menekan toggle `Habis / Tersedia` atau mengupdate sisa porsi menu di kategorinya.
- **Drawer Bahan Baku Dapur:** Koki dapat melihat sisa bahan mentah stasiunnya (mis. Daging Sapi, Tortilla) dan mencatat pemakaian atau stok masuk secara cepat tanpa meninggalkan antrean.

---

### 5.3 Dashboard Admin / Manager

Menggunakan layout klasik **Sidebar Kiri (`bg-brand-900 text-brand-50`) + Area Konten Utama (`bg-brand-100`)**:

1. **Menu Navigasi Sidebar:**
   - 📊 **Ringkasan Hari Ini** (KPI kartu coklat susu & krem, grafik beban 3 stasiun dapur, ringkasan omzet).
   - 📋 **Pantau Pesanan** (Tabel semua pesanan aktif + riwayat 3 hari terakhir).
   - 🍽️ **Menu & Kategori** (Kelola 3 kategori & daftar produk + upload foto + toggle tersedia).
   - 📦 **Stok & Bahan Baku** (Monitoring sisa porsi menu, inventaris bahan mentah per stasiun, peringatan stok menipis, dan riwayat mutasi/opname bahan).
   - 🪑 **Daftar Meja** (Kelola nomor meja Dine-in).
   - 👥 **Kelola Staf** (Kelola akun Admin, Waiter/Kasir, dan Kitchen beserta penugasan kategorinya).
   - 📈 **Laporan Penjualan & Export CSV** (Filter harian/mingguan/bulanan, rincian uang masuk dari DP & Pelunasan, grafik Recharts bernuansa coklat hangat `#543828`, `#A67C5B`, `#D97706`, serta tombol **"📥 Export ke CSV"**).

---

## 6. Komponen Modal Pembayaran & DP (Waiter/Kasir)

Karena Waiter merangkap Kasir dan menangani DP Pre-Order (keputusan Q-02 & Q-03), berikut spesifikasi tampilan Modal Pembayaran:

| Mode Pesanan | Tampilan Modal Pembayaran |
|---|---|
| **Pesanan Reguler (Bayar Lunas)** | Menampilkan Total Tagihan Nett $\rightarrow$ Pilihan Metode (`Tunai`, `QRIS`, `Debit/Kredit`) $\rightarrow$ Tombol Cepat Nominal Uang Tunai (`Uang Pas`, `Rp 50.000`, `Rp 100.000`) $\rightarrow$ Kalkulasi Otomatis **Kembalian** $\rightarrow$ Tombol **"Simpan & Lunas"**. |
| **Pre-Order Baru (Input DP)** | Menampilkan Total Tagihan $\rightarrow$ Input **Nominal DP** (dengan tombol cepat `DP 50%` atau ketik nominal bebas) $\rightarrow$ Info **Sisa Kurang Bayar** yang otomatis dihitung $\rightarrow$ Pilihan Metode Bayar $\rightarrow$ Tombol **"Simpan DP & Jadwalkan Pre-Order"**. |
| **Pelunasan Pre-Order (`partially_paid`)** | Menampilkan Total Tagihan, Nominal DP yang sudah masuk, dan **Sisa Tagihan yang Harus Dibayar** $\rightarrow$ Pilihan Metode Bayar $\rightarrow$ Tombol **"Lunasi Sisa Tagihan"**. |

---

## 7. Checklist Implementasi Frontend (React + Tailwind)

1. [ ] Setup font `Plus Jakarta Sans` & `JetBrains Mono` di `index.html`.
2. [ ] Masukkan palet warna `brand-50` s.d. `brand-950` ke dalam konfigurasi Tailwind.
3. [ ] Buat komponen dasar reusable dengan tema coklat:
   - `Button` (varian: `primary` coklat tua, `secondary` coklat susu muda, `success` hijau, `danger` merah).
   - `StatusBadge` (otomatis memilih warna berdasarkan status item/order/payment).
   - `CategoryBadge` (Indo, Western, Minuman).
4. [ ] Pastikan seluruh halaman memiliki kontras teks minimal WCAG AA (teks `brand-950` di atas `brand-50`/`brand-100`, atau teks `brand-50` di atas `brand-800`/`brand-900`).

