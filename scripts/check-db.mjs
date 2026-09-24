import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const client = new pg.Client(getDatabaseConfig());
try {
  await client.connect();
  const result = await client.query(`SELECT current_database() AS database,
    to_regclass('public.products') IS NOT NULL AS products,
    to_regclass('public.orders') IS NOT NULL AS orders,
    to_regclass('public.order_items') IS NOT NULL AS order_items`);
  const state = result.rows[0];
  console.log(`Koneksi berhasil: ${state.database}`);
  console.log(`Tabel: products=${state.products}, orders=${state.orders}, order_items=${state.order_items}`);
  if (!state.products || !state.orders || !state.order_items) process.exitCode = 1;
} catch (error) {
  console.error('Koneksi database gagal:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
