import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const migration = process.argv.includes('--migration');
const label = migration ? 'MIGRATION_DATABASE_URL' : 'DATABASE_URL';
const client = new pg.Client(getDatabaseConfig({ migration }));

try {
  await client.connect();
  await client.query('SELECT 1');
  console.log(`${label}: koneksi berhasil.`);
} catch (error) {
  console.error(`${label}: koneksi gagal (${error.code || error.name}).`);
  process.exitCode = 1;
} finally {
  try { await client.end(); } catch { /* Koneksi mungkin belum terbentuk. */ }
}
