# Memori Proyek Aira Daily Store

**Terakhir diperbarui:** 24 September 2026
**Status:** aplikasi dan panel admin selesai sebagai prototipe; skema dan data contoh sudah ada di proyek Supabase pengguna, tetapi alur aplikasi penuh belum diuji.
**Repo:** `/Users/yukiwicaksono/Devs/aira_daily_store`

## Ringkasan pekerjaan

- Toko Next.js App Router dengan beranda, katalog (pencarian, kategori, urutan harga), detail produk, keranjang browser, dan checkout.
- Checkout menyimpan `orders` dan `order_items` di PostgreSQL serta mengurangi stok dalam satu transaksi. Harga dihitung ulang di server.
- Panel `/admin/login` dengan akun tunggal dari environment, password scrypt, cookie sesi bertanda tangan, dan pemeriksaan asal permintaan untuk mutasi.
- Panel `/admin` menyediakan ringkasan, CRUD produk (arsip alih-alih hapus permanen), stok, serta status pesanan. Pembatalan pesanan `pending` mengembalikan stok satu kali.
- Koneksi Supabase tetap melalui `pg` di server Next.js. `DATABASE_URL` untuk runtime; `MIGRATION_DATABASE_URL` untuk migrasi dan seed. Pool dibatasi satu koneksi per instance. URL Supabase memakai `sslmode=verify-full` dan sertifikat `prod-ca-2021.crt` dari dashboard secara otomatis, sehingga TLS memverifikasi CA serta hostname tanpa warning `pg-connection-string`.
- `.env` dan `.env.example` memiliki `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Bila keduanya terisi, beranda/katalog/detail produk membaca lewat Supabase JS/Data API; bila kosong, katalog memakai `pg` lokal. Checkout dan admin tetap memakai `pg` untuk transaksi dan akses administratif. Konfigurasi yang hanya terisi satu variabel menghasilkan error yang jelas.
- `db:migrate` hanya membuat/memperbarui skema; `db:seed` secara opsional memasukkan 12 produk dan 3 pesanan demo dengan 4 item pesanan. Seed aman diulang, menjaga stok pesanan aktif, dan tidak menimpa data yang sudah ada. RLS produk mengizinkan role anon/authenticated membaca produk aktif saja. Tabel `orders` dan `order_items` tetap tertutup dari Data API publik.
- Panduan setup ada di [README.md](README.md). Aset dari `/Users/yukiwicaksono/Devs/kaija-nextjs-asset` berupa starter kode; gambar produk saat ini memakai URL Unsplash remote.

## Bukti terakhir

- `npm run build` berhasil setelah persiapan Supabase.
- Setelah pengaturan SSL, parser `pg-connection-string` membaca kedua URL dari `.env` dengan `sslmode=verify-full` tanpa warning; `npm run test:catalog` (3 tes) dan `npm run build` berhasil. Ini belum membuktikan koneksi ke Supabase.
- `db:ping` menguji koneksi dengan `SELECT 1` tanpa mengubah data dan hanya menampilkan kode kegagalan, bukan URL atau password.
- Pemeriksaan jaringan pada host kerja (23 September 2026): IPv4 publik berfungsi; antarmuka hanya memiliki IPv6 loopback/link-local, tanpa alamat IPv6 global. Akses Direct Supabase IPv6 tidak dapat dirutekan dari jaringan saat ini. Kondisi ini dapat berubah jika jaringan/VPN berubah.
- `npm run test:catalog` memverifikasi URL/key dari environment dipakai oleh SDK untuk permintaan katalog dan detail. Pada PostgreSQL uji dengan role `anon`/`authenticated`, migrasi memberi `anon` SELECT produk saja (tanpa INSERT atau SELECT pesanan); role tersebut melihat 11 produk aktif dari 12 total setelah satu diarsipkan. Migrasi ulang tidak menggandakan policy. Jalur katalog `pg` lokal tetap membaca 11 produk aktif.
- Setelah nilai `NEXT_PUBLIC_` diisi atau diubah, build produksi harus dijalankan ulang agar bundle Next.js memakai nilai terbaru.
- Pada PostgreSQL uji lokal yang terpisah: `db:migrate` membuat tabel dan RLS dengan **0 produk**; `db:check` berhasil; `db:seed` menghasilkan **12 produk**; migrasi ulang mempertahankan 12 produk.
- Uji sebelumnya: halaman toko, katalog, detail, dan admin berhasil dimuat. API admin menolak akses tanpa sesi; tambah/edit/arsip produk berhasil; produk arsip hilang dari toko. Checkout menolak stok berlebih. Pembatalan pesanan mengembalikan stok dan pembatalan ulang ditolak; status `paid` tersimpan.
- Database uji lokal berada di `/private/tmp/aira-pg-test` (port 55432) dan **servernya sudah dihentikan**. Ini bukan database aplikasi permanen.
- `.env` kini memiliki Project URL, publishable key, `DATABASE_URL`, dan `MIGRATION_DATABASE_URL` yang terisi. Kedua URL database mengarah ke Session pooler port 5432 pada proyek Supabase yang sama. Perintah `db:*` membaca `.env` secara langsung. Jangan mencatat kredensial di file ini.
- Pada 23 September 2026, `npm run db:ping -- --migration` berhasil setelah CA Supabase dimuat. `npm run db:migrate` berhasil pada proyek Supabase pengguna. `npm run db:check` menampilkan `products=true`, `orders=true`, `order_items=true` serta koneksi ke database `postgres`; proses pemeriksaan tersebut tidak segera keluar dan dihentikan manual setelah hasil tampil. `npm run db:ping` untuk runtime juga menampilkan koneksi berhasil tetapi tidak segera keluar. Perlu menelusuri penutupan koneksi Session pooler jika berulang.
- `npm run build` berhasil setelah konfigurasi CA; parser `pg` menunjukkan CA termuat serta verifikasi TLS aktif untuk kedua URL.
- Pada proyek Supabase pengguna, `npm run db:seed` menambahkan 12 produk, 3 pesanan demo (`pending`, `paid`, `cancelled`), dan 4 item pesanan. Pemeriksaan sesudahnya: 12/3/4 baris, 0 item tanpa relasi, 0 pesanan dengan total salah. Menjalankan `db:seed` ulang menambahkan 0 baris.
- Pada 24 September 2026, halaman `/admin` di Next.js dev sempat gagal karena `fileURLToPath(new URL(...))` pada `lib/db-config.js` menerima objek URL dari bundler yang tidak cocok. Path sertifikat sekarang ditentukan dari root proses. Halaman admin kembali memuat ringkasan toko; `npm run build` lulus dan parser `pg` tetap memuat CA dengan verifikasi TLS aktif.
- Pada 24 September 2026, investigasi jeda **Rendering** di dev: Next.js mengompilasi route saat dibuka dan seluruh halaman katalog/admin dirender dinamis. Pengukuran baca data sebelum perubahan: dua query katalog beranda sekitar 1,5 detik pada koneksi baru; tiga query ringkasan admin dengan pool satu koneksi sekitar 3,5 detik. Ringkasan admin sekarang satu query (pengukuran koneksi baru sekitar 2,5 detik), beranda mengambil dua kelompok produk lewat satu permintaan, dan loading boundary memberi umpan balik saat navigasi. `npm run build`, 3 tes katalog, serta halaman beranda dan ringkasan admin di browser lulus. Waktu tersisa terutama bergantung pada koneksi Supabase dan mode dev; belum ada pengukuran produksi.
- Tampilan loading toko dan admin kini memakai spinner CSS di tengah area konten, teks status, dan penghormatan pada preferensi gerakan berkurang. Build berhasil; tampilan loading keduanya diperiksa secara visual saat navigasi di browser.
- Area loading toko sekarang memenuhi tinggi viewport yang tersisa di bawah ticker/header (desktop dan mobile), sehingga footer baru terlihat setelah pengguna scroll. Screenshot saat navigasi ke katalog membuktikan spinner tetap di tengah dan footer tidak tampak di layar awal; build berhasil.
- Pada 24 September 2026, ikon yang relevan dari file Figma Community “36 Ecommerce icons” diunduh sebagai SVG lokal ke `public/icons/`. Komponen `FigmaIcon` memakai ukuran asli aset dalam bingkai 24 px. Ikon diterapkan pada navigasi toko dan ponsel, pencarian katalog, keranjang serta tombol tambah keranjang, menu admin, dan aksi edit produk. Build berhasil; halaman produk dan daftar produk admin diperiksa secara visual di browser. Aset SVG tambahan (bintang, truk, panah) tersedia untuk kebutuhan tampilan berikutnya.

## Yang masih perlu dikerjakan

1. [x] Isi `MIGRATION_DATABASE_URL` dan `DATABASE_URL` dengan Session pooler; Project URL dan publishable key sudah terisi. Jangan taruh password database pada variabel `NEXT_PUBLIC_`.
2. [x] Jalankan `npm run db:migrate`, periksa tabel, lalu isi semua tabel dengan data contoh atas permintaan pengguna.
3. [ ] Telusuri proses `db:check` dan `db:ping` runtime yang tidak segera keluar setelah query berhasil pada Session pooler.
4. [ ] Siapkan `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (`npm run admin:hash`), dan `ADMIN_SESSION_SECRET`; coba login admin pada lingkungan tujuan.
5. [ ] Isi produk dan gambar asli melalui panel admin. Saat ini gambar contoh bergantung pada URL remote.
6. [ ] Uji alur beli dan pembatalan stok pada lingkungan Supabase, lalu tentukan kebutuhan pembayaran, ongkir, dan notifikasi sebelum peluncuran.
7. [ ] Pilih platform deployment dan pasang environment rahasia di sana; periksa koneksi pooler dan batas koneksi sesuai platform.

## Cara memantau progres

Perbarui tanggal, bukti, dan checklist di file ini setelah setiap tahap selesai. Untuk pemeriksaan cepat gunakan `npm run build` dan `npm run db:check`. Pada 24 September 2026, `npm run test:catalog` (3 tes) dan `npm run build` berhasil sebelum commit aplikasi.
