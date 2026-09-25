-- Jalankan di Supabase SQL Editor pada proyek Aira Daily Store.
-- Prasyarat: tabel public.products dan public.order_items sudah ada.
-- Aman dijalankan ulang; tidak menghapus atau mengubah data produk/pesanan lama.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.variant_options (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('color', 'size')),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  color_id BIGINT NOT NULL REFERENCES public.variant_options(id),
  size_id BIGINT NOT NULL REFERENCES public.variant_options(id),
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (product_id, color_id, size_id)
);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id BIGINT REFERENCES public.product_variants(id);

-- Katalog publik hanya boleh membaca kombinasi aktif milik produk aktif.
-- Checkout dan CMS admin tetap memakai koneksi PostgreSQL server.
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.variant_options, public.product_variants FROM anon, authenticated;
GRANT SELECT ON TABLE public.variant_options, public.product_variants TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'variant_options'
      AND policyname = 'public_read_variant_options'
  ) THEN
    CREATE POLICY public_read_variant_options ON public.variant_options
      FOR SELECT TO anon, authenticated USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_variants'
      AND policyname = 'public_read_active_variants'
  ) THEN
    CREATE POLICY public_read_active_variants ON public.product_variants
      FOR SELECT TO anon, authenticated
      USING (
        is_active = TRUE AND EXISTS (
          SELECT 1 FROM public.products
          WHERE id = product_id AND is_active = TRUE
        )
      );
  END IF;
END $$;

COMMIT;
