CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  compare_at_price INTEGER CHECK (compare_at_price >= price),
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  badge TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0);

CREATE TABLE IF NOT EXISTS variant_options (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('color', 'size')),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  color_id BIGINT REFERENCES variant_options(id),
  size_id BIGINT REFERENCES variant_options(id),
  price INTEGER NOT NULL CHECK (price >= 0),
  cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT product_variants_has_option CHECK (color_id IS NOT NULL OR size_id IS NOT NULL)
);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0);
ALTER TABLE product_variants ALTER COLUMN color_id DROP NOT NULL;
ALTER TABLE product_variants ALTER COLUMN size_id DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_has_option') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_has_option CHECK (color_id IS NOT NULL OR size_id IS NOT NULL);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_option_pair_unique
  ON product_variants (product_id, COALESCE(color_id, 0), COALESCE(size_id, 0));

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
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
UPDATE orders SET paid_at = created_at WHERE status = 'paid' AND paid_at IS NULL;
CREATE INDEX IF NOT EXISTS orders_paid_at_idx ON orders (paid_at) WHERE status = 'paid';

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0)
);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT REFERENCES product_variants(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0);

CREATE TABLE IF NOT EXISTS accounts (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[0-9]{4,10}$'),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO accounts (code, name, type, normal_balance, is_system) VALUES
  ('1000', 'Kas', 'asset', 'debit', TRUE),
  ('1100', 'Persediaan Barang', 'asset', 'debit', TRUE),
  ('2000', 'Utang Usaha', 'liability', 'credit', TRUE),
  ('3000', 'Modal Pemilik', 'equity', 'credit', TRUE),
  ('3100', 'Saldo Laba', 'equity', 'credit', TRUE),
  ('4000', 'Pendapatan Penjualan', 'revenue', 'credit', TRUE),
  ('4100', 'Pendapatan Pengiriman', 'revenue', 'credit', TRUE),
  ('5000', 'Harga Pokok Penjualan', 'expense', 'debit', TRUE),
  ('6000', 'Beban Operasional', 'expense', 'debit', TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'order_payment')),
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_source_unique
  ON journal_entries (source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS journal_entries_date_idx ON journal_entries (entry_date, id);

CREATE TABLE IF NOT EXISTS journal_lines (
  id BIGSERIAL PRIMARY KEY,
  journal_entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
  account_id BIGINT NOT NULL REFERENCES accounts(id),
  description TEXT NOT NULL DEFAULT '',
  debit BIGINT NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit BIGINT NOT NULL DEFAULT 0 CHECK (credit >= 0),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);
CREATE INDEX IF NOT EXISTS journal_lines_entry_idx ON journal_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS journal_lines_account_idx ON journal_lines (account_id);

-- Bentuk jurnal permanen untuk pesanan lama. Pengulangan aman karena sumber unik.
INSERT INTO journal_entries (entry_date, description, source_type, source_id)
SELECT (o.paid_at AT TIME ZONE 'Asia/Jakarta')::date, 'Pembayaran pesanan #' || o.id, 'order_payment', o.id
FROM orders o
WHERE o.status = 'paid' AND o.paid_at IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO journal_lines (journal_entry_id, account_id, description, debit, credit)
SELECT je.id, a.id, '', amount.debit, amount.credit
FROM journal_entries je
JOIN orders o ON je.source_type = 'order_payment' AND je.source_id = o.id
CROSS JOIN LATERAL (VALUES
  ('1000', o.total::bigint, 0::bigint),
  ('4000', 0::bigint, o.subtotal::bigint),
  ('4100', 0::bigint, GREATEST(o.total - o.subtotal, 0)::bigint),
  ('5000', COALESCE((SELECT SUM(oi.unit_cost::bigint * oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0), 0::bigint),
  ('1100', 0::bigint, COALESCE((SELECT SUM(oi.unit_cost::bigint * oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0))
) AS amount(code, debit, credit)
JOIN accounts a ON a.code = amount.code
WHERE (amount.debit > 0 OR amount.credit > 0)
  AND NOT EXISTS (SELECT 1 FROM journal_lines jl WHERE jl.journal_entry_id = je.id);

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
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

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
    REVOKE ALL ON TABLE public.accounts, public.journal_entries, public.journal_lines FROM anon, authenticated;
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
