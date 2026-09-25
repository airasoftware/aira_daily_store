CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price >= price),
  image_url TEXT NOT NULL,
  badge TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS variant_options (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('color', 'size')),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  color_id BIGINT NOT NULL REFERENCES variant_options(id),
  size_id BIGINT NOT NULL REFERENCES variant_options(id),
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (product_id, color_id, size_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0)
);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT REFERENCES product_variants(id);

CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  whatsapp_sender TEXT NOT NULL DEFAULT '6285111412046',
  whatsapp_phone_number_id TEXT NOT NULL DEFAULT '',
  whatsapp_api_version TEXT NOT NULL DEFAULT '',
  whatsapp_access_token_ciphertext TEXT NOT NULL DEFAULT '',
  sender_email TEXT NOT NULL DEFAULT 'it.airasolutions@gmail.com',
  gmail_app_password_ciphertext TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO notification_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Toko boleh membaca produk aktif lewat Supabase Data API. Checkout dan admin
-- tetap memakai koneksi PostgreSQL server, sehingga tabel pesanan tetap privat.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Role anon/authenticated hanya ada pada proyek Supabase. Lewati blok ini
-- pada PostgreSQL lokal agar skema tetap dapat diuji tanpa Supabase CLI.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    REVOKE ALL ON TABLE public.products FROM anon, authenticated;
    REVOKE ALL ON TABLE public.orders, public.order_items FROM anon, authenticated;
    REVOKE ALL ON TABLE public.notification_settings FROM anon, authenticated;
    REVOKE ALL ON TABLE public.variant_options, public.product_variants FROM anon, authenticated;
    GRANT SELECT ON TABLE public.products TO anon, authenticated;
    GRANT SELECT ON TABLE public.variant_options, public.product_variants TO anon, authenticated;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'products'
        AND policyname = 'public_read_active_products'
    ) THEN
      CREATE POLICY public_read_active_products ON public.products
        FOR SELECT TO anon, authenticated USING (is_active = TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_variants' AND policyname = 'public_read_active_variants') THEN
      CREATE POLICY public_read_active_variants ON public.product_variants FOR SELECT TO anon, authenticated
        USING (is_active = TRUE AND EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND is_active = TRUE));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_options' AND policyname = 'public_read_variant_options') THEN
      CREATE POLICY public_read_variant_options ON public.variant_options FOR SELECT TO anon, authenticated USING (TRUE);
    END IF;
  END IF;
END $$;
