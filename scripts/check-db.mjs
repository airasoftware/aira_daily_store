import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const migration = process.argv.includes('--migration');
const client = new pg.Client(getDatabaseConfig({ migration }));
try {
  await client.connect();
  const result = await client.query(`SELECT current_database() AS database,
    to_regclass('public.products') IS NOT NULL AS products,
    to_regclass('public.orders') IS NOT NULL AS orders,
    to_regclass('public.order_items') IS NOT NULL AS order_items,
    to_regclass('public.variant_options') IS NOT NULL AS variant_options,
    to_regclass('public.product_variants') IS NOT NULL AS product_variants,
    to_regclass('public.accounts') IS NOT NULL AS accounts,
    to_regclass('public.journal_entries') IS NOT NULL AS journal_entries,
    to_regclass('public.journal_lines') IS NOT NULL AS journal_lines`);
  const state = result.rows[0];
  console.log(`Koneksi berhasil: ${state.database}`);
  console.log(`Tabel: products=${state.products}, orders=${state.orders}, order_items=${state.order_items}, variant_options=${state.variant_options}, product_variants=${state.product_variants}, accounts=${state.accounts}, journal_entries=${state.journal_entries}, journal_lines=${state.journal_lines}`);
  const tablesReady = state.products && state.orders && state.order_items && state.variant_options && state.product_variants && state.accounts && state.journal_entries && state.journal_lines;
  if (!tablesReady) {
    process.exitCode = 1;
  } else {
    const { rows: [finance] } = await client.query(`SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='cost_price') AS product_cost,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='product_variants' AND column_name='cost_price') AS variant_cost,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='paid_at') AS paid_at,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='unit_cost') AS unit_cost,
      (SELECT COUNT(*)::integer FROM accounts WHERE is_system) AS system_accounts,
      (SELECT BOOL_AND(relrowsecurity) FROM pg_class WHERE oid IN ('public.accounts'::regclass, 'public.journal_entries'::regclass, 'public.journal_lines'::regclass)) AS finance_rls,
      (SELECT COUNT(*)::integer FROM (
        SELECT je.id FROM journal_entries je LEFT JOIN journal_lines jl ON jl.journal_entry_id=je.id
        GROUP BY je.id HAVING COUNT(jl.id) < 2 OR COALESCE(SUM(jl.debit),0) <> COALESCE(SUM(jl.credit),0)
      ) invalid) AS invalid_journals,
      (SELECT COUNT(*)::integer FROM orders o LEFT JOIN journal_entries je ON je.source_type='order_payment' AND je.source_id=o.id
        WHERE o.status='paid' AND je.id IS NULL) AS paid_without_journal`);
    console.log(`Keuangan: product_cost=${finance.product_cost}, variant_cost=${finance.variant_cost}, paid_at=${finance.paid_at}, unit_cost=${finance.unit_cost}, system_accounts=${finance.system_accounts}, rls=${finance.finance_rls}, invalid_journals=${finance.invalid_journals}, paid_without_journal=${finance.paid_without_journal}`);
    if (!finance.product_cost || !finance.variant_cost || !finance.paid_at || !finance.unit_cost || finance.system_accounts < 9 || !finance.finance_rls || finance.invalid_journals !== 0 || finance.paid_without_journal !== 0) process.exitCode = 1;
  }
} catch (error) {
  console.error('Koneksi database gagal:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
