-- Jalankan di Supabase SQL Editor sebelum merilis modul Keuangan.
-- Prasyarat: tabel products, product_variants, orders, dan order_items sudah ada.
-- Migrasi expand-only ini aman dijalankan ulang dan tidak menghapus data lama.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0);
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_cost INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost >= 0);

UPDATE public.orders
SET paid_at = created_at
WHERE status = 'paid' AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS orders_paid_at_idx
  ON public.orders (paid_at) WHERE status = 'paid';

CREATE TABLE IF NOT EXISTS public.accounts (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[0-9]{4,10}$'),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.accounts (code, name, type, normal_balance, is_system) VALUES
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

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'order_payment')),
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_source_unique
  ON public.journal_entries (source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS journal_entries_date_idx
  ON public.journal_entries (entry_date, id);

CREATE TABLE IF NOT EXISTS public.journal_lines (
  id BIGSERIAL PRIMARY KEY,
  journal_entry_id BIGINT NOT NULL REFERENCES public.journal_entries(id) ON DELETE RESTRICT,
  account_id BIGINT NOT NULL REFERENCES public.accounts(id),
  description TEXT NOT NULL DEFAULT '',
  debit BIGINT NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit BIGINT NOT NULL DEFAULT 0 CHECK (credit >= 0),
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX IF NOT EXISTS journal_lines_entry_idx
  ON public.journal_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS journal_lines_account_idx
  ON public.journal_lines (account_id);

-- Membentuk jurnal permanen untuk pesanan lama yang sudah dibayar.
INSERT INTO public.journal_entries (entry_date, description, source_type, source_id)
SELECT (o.paid_at AT TIME ZONE 'Asia/Jakarta')::date,
  'Pembayaran pesanan #' || o.id, 'order_payment', o.id
FROM public.orders o
WHERE o.status = 'paid' AND o.paid_at IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.journal_lines (journal_entry_id, account_id, description, debit, credit)
SELECT je.id, a.id, '', amount.debit, amount.credit
FROM public.journal_entries je
JOIN public.orders o
  ON je.source_type = 'order_payment' AND je.source_id = o.id
CROSS JOIN LATERAL (VALUES
  ('1000', o.total::bigint, 0::bigint),
  ('4000', 0::bigint, o.subtotal::bigint),
  ('4100', 0::bigint, GREATEST(o.total - o.subtotal, 0)::bigint),
  ('5000', COALESCE((SELECT SUM(oi.unit_cost::bigint * oi.quantity) FROM public.order_items oi WHERE oi.order_id = o.id), 0), 0::bigint),
  ('1100', 0::bigint, COALESCE((SELECT SUM(oi.unit_cost::bigint * oi.quantity) FROM public.order_items oi WHERE oi.order_id = o.id), 0))
) AS amount(code, debit, credit)
JOIN public.accounts a ON a.code = amount.code
WHERE (amount.debit > 0 OR amount.credit > 0)
  AND NOT EXISTS (
    SELECT 1 FROM public.journal_lines jl WHERE jl.journal_entry_id = je.id
  );

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.accounts, public.journal_entries, public.journal_lines
      FROM anon, authenticated;
  END IF;
END $$;

COMMIT;

-- Rollback aplikasi: deploy versi aplikasi sebelumnya dan biarkan tabel/kolom
-- tambahan tetap ada. Penghapusan skema sengaja tidak diotomatisasi agar jurnal
-- dan data harga modal yang sudah tercatat tidak hilang.
