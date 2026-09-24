import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const client = new pg.Client(getDatabaseConfig({ migration: true }));
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Skema database siap. Data produk yang sudah ada tetap dipertahankan.');
} catch (error) {
  try { await client.query('ROLLBACK'); } catch { /* koneksi mungkin belum terbuka */ }
  console.error('Migrasi gagal:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
