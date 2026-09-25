-- Jalankan pada Supabase SQL Editor setelah migrasi varian produk.
-- Aman dijalankan ulang. Bucket product-images dibuat melalui aplikasi
-- saat admin pertama kali mengunggah gambar (memerlukan SUPABASE_SECRET_KEY).

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS image_url TEXT;
