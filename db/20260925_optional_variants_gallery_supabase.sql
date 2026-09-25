-- Jalankan sebelum merilis kode pilihan varian opsional dan galeri produk.
-- Aman dijalankan ulang, tanpa menghapus data produk atau pesanan.
BEGIN;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.product_variants ALTER COLUMN color_id DROP NOT NULL;
ALTER TABLE public.product_variants ALTER COLUMN size_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_has_option') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_has_option
      CHECK (color_id IS NOT NULL OR size_id IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_option_pair_unique
  ON public.product_variants (product_id, COALESCE(color_id, 0), COALESCE(size_id, 0));

COMMIT;
