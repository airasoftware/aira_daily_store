import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const client = new pg.Client(getDatabaseConfig());
try {
  await client.connect();
  const result = await client.query(`SELECT current_database() AS database,
    to_regclass('public.products') IS NOT NULL AS products,
    to_regclass('public.orders') IS NOT NULL AS orders,
    to_regclass('public.order_items') IS NOT NULL AS order_items,
    to_regclass('public.variant_options') IS NOT NULL AS variant_options,
    to_regclass('public.product_variants') IS NOT NULL AS product_variants`);
  const state = result.rows[0];
  console.log(`Koneksi berhasil: ${state.database}`);
  console.log(`Tabel: products=${state.products}, orders=${state.orders}, order_items=${state.order_items}, variant_options=${state.variant_options}, product_variants=${state.product_variants}`);
  if (!state.products || !state.orders || !state.order_items || !state.variant_options || !state.product_variants) process.exitCode = 1;
} catch (error) {
  console.error('Koneksi database gagal:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
