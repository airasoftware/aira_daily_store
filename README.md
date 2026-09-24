# Aira Daily Store

Progres dan langkah lanjutan dicatat di [PROJECT_MEMORY.md](PROJECT_MEMORY.md).

Toko perlengkapan outdoor anak dengan Next.js App Router dan PostgreSQL, terinspirasi dari tampilan Kaija Indonesia. Katalog, stok, dan pesanan disimpan di database; keranjang disimpan di browser.

## Menjalankan dengan Supabase

1. Buat proyek Supabase, lalu salin connection string dari tombol **Connect** pada dashboard proyek.
2. Isi file `.env` yang sudah disiapkan: tempel **Project URL** ke `NEXT_PUBLIC_SUPABASE_URL` dan **Publishable key** ke `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Tempel URL **Transaction pooler** ke `DATABASE_URL` dan URL **Direct connection** atau **Session pooler** ke `MIGRATION_DATABASE_URL`. Jika Next.js berjalan sebagai server yang terus hidup, `DATABASE_URL` juga boleh memakai Direct atau Session pooler. Next.js dan perintah `db:*` membaca `.env`; jangan buat `.env.local` dengan nilai database lain karena Next.js akan mendahulukannya.
3. Ganti placeholder password pada URL dengan password database proyek. Karakter khusus seperti `@`, `#`, `?`, dan `&` harus di-percent-encode. Gunakan `?sslmode=verify-full` pada URL Supabase; kode juga menambahkannya jika terlewat. Sertifikat root `prod-ca-2021.crt` dari **Database Settings → SSL Configuration** harus tersedia di root proyek. Kode menambahkan `sslrootcert` secara otomatis. Jika memakai nama atau lokasi sertifikat lain, tambahkan `sslrootcert` ke URL koneksi sendiri.
4. Jalankan `npm install`, `npm run db:migrate`, lalu `npm run db:check`.
   Untuk menguji koneksi tanpa mengubah database, jalankan `npm run db:ping` (`DATABASE_URL`) atau `npm run db:ping -- --migration` (`MIGRATION_DATABASE_URL`). Perintah ini hanya menjalankan `SELECT 1`.
5. Jalankan `npm run dev`, lalu buka `http://localhost:3000`. Tambahkan produk dari panel admin, atau jalankan `npm run db:seed` **hanya jika memang ingin** memasukkan 12 produk dan 3 pesanan demo (4 item pesanan). Seed aman diulang dan tidak menimpa produk atau pesanan yang sudah ada. Pesanan demo ditandai jelas sebagai data contoh; pesanan `pending` dan `paid` mengurangi stok, sedangkan pesanan `cancelled` tidak.

Isi keempat variabel sebelum menjalankan build produksi; Next.js memasukkan nilai `NEXT_PUBLIC_` ke bundle saat build. Setelah mengubah nilai tersebut, jalankan `npm run build` lagi sebelum `npm run start` atau deployment.

Contoh bentuk URL (salin host dan username yang sebenarnya dari dashboard):

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres?sslmode=verify-full
MIGRATION_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=verify-full
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Saat kedua variabel `NEXT_PUBLIC_` terisi, beranda, katalog, dan detail produk membaca tabel `products` melalui Supabase JS/Data API. Migrasi memberi role `anon` dan `authenticated` izin **SELECT produk aktif saja**; tabel pesanan tidak diberi izin Data API. Jika kedua variabel masih kosong, katalog memakai koneksi PostgreSQL server seperti sebelumnya untuk pengembangan lokal. Jika hanya satu variabel terisi, aplikasi menampilkan kesalahan konfigurasi.

Checkout dan panel admin tetap memakai koneksi PostgreSQL melalui `pg` di server Next.js, sehingga **`DATABASE_URL` tetap diperlukan** untuk aplikasi lengkap. Transaksi pengurangan/pengembalian stok dan pembuatan pesanan berlangsung di server. Prefix `NEXT_PUBLIC_` berarti nilainya dapat terlihat di browser: jangan pernah menaruh password database atau secret key di sana. Koneksi `pg` dibatasi satu per instance agar sesuai dengan pooler serverless. Query aplikasi tidak memakai named prepared statements, sehingga kompatibel dengan Transaction pooler.

`db:migrate` aman dijalankan ulang dan tidak mengisi atau menghapus produk. Tabel dibuat dengan RLS aktif; policy hanya mengizinkan baca produk aktif melalui Data API. Akses pesanan tetap melalui server Next.js. Setelah URL dan key Supabase diisi, jalankan migrasi sebelum membuka toko. Jika perlu kembali ke PostgreSQL lokal, kosongkan kedua variabel `NEXT_PUBLIC_`, ganti URL database ke lokal, lalu jalankan `db:migrate` lagi. Data di database Supabase tidak diubah oleh pergantian URL tersebut.

Untuk PostgreSQL lokal, buat database `aira_daily_store`, gunakan URL lokal pada `.env`, lalu jalankan langkah migrasi yang sama. `npm run db:setup` tetap tersedia sebagai alias `db:migrate`.

Jika URL Direct (`db.<PROJECT_REF>.supabase.co:5432`) menghasilkan `ENOTFOUND` atau `No route to host` pada jaringan IPv4, salin URL **Session pooler** dari menu Connect ke `MIGRATION_DATABASE_URL`. Gunakan URL pooler juga untuk `DATABASE_URL` pada lingkungan tersebut. Host pooler setiap proyek harus disalin dari dashboard, bukan ditebak dari region.

Checkout menyimpan pesanan dengan status `pending` dan mengurangi stok secara atomik. Gambar produk menggunakan URL Unsplash dari starter scraping yang diberikan; koneksi internet diperlukan untuk menampilkannya.

## Panel admin

1. Jalankan `npm run admin:hash`, masukkan password admin minimal 12 karakter, lalu salin nilai `ADMIN_PASSWORD_HASH` yang dihasilkan ke `.env`.
2. Isi `ADMIN_EMAIL` dan `ADMIN_SESSION_SECRET` di `.env`. Gunakan secret acak minimal 32 karakter. Contoh pembuatannya: `openssl rand -hex 32`.
3. Jalankan ulang server, kemudian buka `/admin/login`.

Admin dapat menambah dan mengedit produk, mengatur stok, memilih produk untuk Best Seller atau New Arrival, serta mengarsipkan produk. Produk yang diarsipkan tersembunyi dari toko tetapi riwayat pesanan tetap tersimpan. Admin dapat menandai pesanan menunggu sebagai dibayar atau membatalkannya. Pembatalan mengembalikan stok; pesanan yang sudah dibayar tidak dapat dibatalkan melalui panel ini.

Belum ada pembayaran online, ongkir otomatis, login pelanggan, atau pengaturan beberapa akun admin.
