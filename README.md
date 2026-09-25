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

Saat memakai `npm run dev`, indikator **Rendering** berasal dari Next.js dan halaman pertama kali dikompilasi ketika dibuka. Halaman dinamis juga menunggu data Supabase pada tiap navigasi. Indikator tersebut tidak muncul pada server produksi (`npm run build` lalu `npm run start`). Aplikasi menampilkan status memuat selama menunggu; ringkasan admin dan koleksi beranda sudah menggabungkan permintaan data untuk mengurangi waktu tunggu.

Jika URL Direct (`db.<PROJECT_REF>.supabase.co:5432`) menghasilkan `ENOTFOUND` atau `No route to host` pada jaringan IPv4, salin URL **Session pooler** dari menu Connect ke `MIGRATION_DATABASE_URL`. Gunakan URL pooler juga untuk `DATABASE_URL` pada lingkungan tersebut. Host pooler setiap proyek harus disalin dari dashboard, bukan ditebak dari region.

Checkout menyimpan pesanan dengan status `pending` dan mengurangi stok secara atomik. Gambar produk menggunakan URL Unsplash dari starter scraping yang diberikan; koneksi internet diperlukan untuk menampilkannya.

### Konfirmasi WhatsApp dan email

Setelah transaksi checkout berhasil, server mengirim konfirmasi email ke alamat yang diisi pelanggan dan konfirmasi WhatsApp **hanya jika pelanggan mencentang persetujuan WhatsApp**. Pilihan ini disimpan pada pesanan. Nomor WhatsApp harus nomor Indonesia (`08...`, `62...`, atau `+62...`). Pesanan tetap tersimpan bila salah satu layanan pesan gagal; halaman sukses menunjukkan status masing-masing kanal. Status `terkirim` berarti penyedia menerima permintaan, bukan bukti pesan telah dibaca atau masuk ke inbox. Jangan tekan “Buat pesanan” lagi untuk mencoba ulang pesan, karena itu akan membuat pesanan baru.

Nomor pesanan yang terlihat pelanggan dan admin berbentuk `ORD-YYYYMMDD-000000`, misalnya `ORD-20260924-000043`. Tanggal mengikuti zona `Asia/Jakarta`, sedangkan bagian terakhir berasal dari ID pesanan unik di database (minimal enam digit). ID asli tetap dipakai untuk relasi dan operasi internal; pesanan lama juga memperoleh nomor tampilan saat dibaca tanpa migrasi data.

- Jalankan `npm run db:migrate`. Kredensial yang disimpan lewat admin dienkripsi dengan kunci yang diturunkan dari `ADMIN_SESSION_SECRET`; pertahankan nilai secret itu saat deploy ulang. Jika secret dirotasi, token dan App Password yang tersimpan harus diisi ulang di admin.
- Buka **Admin → Pengaturan**. Nomor WhatsApp pengirim awal `6285111412046` dan email pengirim awal `it.airasolutions@gmail.com` dapat diubah di sana. Token dan App Password disimpan terenkripsi di PostgreSQL; form tidak pernah menampilkan nilainya kembali. Kosongkan kolom rahasia saat menyimpan bila tidak ingin menggantinya.
- **Email:** Aktifkan Verifikasi 2 Langkah pada akun Gmail pengirim, buat [Google App Password](https://support.google.com/accounts/answer/2461835), lalu isi di admin. Aplikasi memakai SMTP Gmail; alamat email dan App Password harus berasal dari akun yang sama. Jangan isi dengan password login Google biasa.
- Email pesanan memakai subjek `Invoice INV-YYYYMMDD-NOMOR | Pesanan Aira Daily diterima`, ringkasan barang dan alamat dalam isi HTML serta teks biasa, dan lampiran PDF invoice. Invoice menampilkan subtotal produk; ongkir, tagihan akhir, dan cara pembayaran tetap menunggu konfirmasi. PDF bukan bukti pembayaran.
- Tombol **Kirim pratinjau email & invoice** di halaman pengaturan mengirim satu contoh email berikut PDF bertanda contoh ke alamat pengirim tanpa membuat pesanan. Respons berhasil berarti server SMTP Gmail menerima pesan; periksa kotak masuk atau Spam untuk memastikan pesan tiba.
- **WhatsApp:** Daftarkan nomor pengirim pada [Meta WhatsApp Business Platform](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api). Isi Phone Number ID yang sesuai dengan nomor itu, access token dengan izin `whatsapp_business_messaging`, dan versi Graph API aktif di admin. Mengubah teks nomor tanpa mengubah Phone Number ID ke milik nomor baru tidak akan mengubah nomor pengirim sebenarnya.
- Buat dan tunggu persetujuan template WhatsApp kategori **utility**, nama `aira_order_received`, bahasa **Indonesian (`id`)**, dengan body: `Halo {{1}}, pesanan Aira Daily {{2}} sudah kami terima. Subtotal produk: {{3}}. Biaya pengiriman dan pembayaran akan kami konfirmasi kemudian. Terima kasih!` Parameter berurutan: nama pelanggan, nomor pesanan (`ORD-...`), subtotal. Template diperlukan untuk menghubungi pelanggan dari checkout. Jika template lama sudah disetujui dengan tanda `#` sebelum `{{2}}`, teks pesan akan menampilkan `#ORD-...`; sesuaikan template di Meta bila ingin tanpa tanda tersebut.

Variabel lama `GMAIL_APP_PASSWORD`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, dan `WHATSAPP_API_VERSION` masih dibaca sebagai fallback sampai nilainya diatur dari admin. Semua rahasia harus tetap di server tanpa prefix `NEXT_PUBLIC_`. WhatsApp Cloud API dapat mengenakan biaya per template; Gmail gratis untuk volume kecil dengan batas pengiriman Google. Uji dengan satu pesanan nyata ke nomor dan email yang dikuasai, lalu periksa kedua pesan serta log jika status gagal. Tanpa konfigurasi, checkout tetap membuat pesanan tetapi kedua status konfirmasi tampil “belum terkirim”.

## Panel admin

1. Jalankan `npm run admin:hash`, masukkan password admin minimal 12 karakter, lalu salin nilai `ADMIN_PASSWORD_HASH` yang dihasilkan ke `.env`.
2. Isi `ADMIN_EMAIL` dan `ADMIN_SESSION_SECRET` di `.env`. Gunakan secret acak minimal 32 karakter. Contoh pembuatannya: `openssl rand -hex 32`.
3. Jalankan ulang server, kemudian buka `/admin/login`.

Admin dapat menambah dan mengedit produk, mengatur stok, memilih produk untuk Best Seller atau New Arrival, serta mengarsipkan produk. Produk yang diarsipkan tersembunyi dari toko tetapi riwayat pesanan tetap tersimpan. Admin dapat menandai pesanan menunggu sebagai dibayar atau membatalkannya. Pembatalan mengembalikan stok; pesanan yang sudah dibayar tidak dapat dibatalkan melalui panel ini. Halaman **Pengaturan** mengelola pengirim notifikasi checkout.

Untuk produk dengan varian, tambahkan pilihan warna dan ukuran di **Master varian** (`/admin/variants`). Di editor produk, aktifkan pilihan varian lalu isi kombinasi warna–ukuran, harga jual, dan stok tiap kombinasi. Katalog menampilkan harga kombinasi termurah dan jumlah stok aktif; pelanggan memilih kombinasi di halaman detail. Harga dan stok selalu diperiksa kembali di server saat checkout. Jalankan `npm run db:migrate` pada database tujuan sebelum menjalankan versi aplikasi ini.

Jika migrasi dilakukan melalui Supabase SQL Editor, gunakan [`db/20260925_product_variants_supabase.sql`](db/20260925_product_variants_supabase.sql). Skrip ini khusus perubahan varian dan aman dijalankan ulang pada skema Aira Daily Store yang sudah memiliki tabel `products` serta `order_items`.

Belum ada pembayaran online, ongkir otomatis, login pelanggan, atau pengaturan beberapa akun admin.
