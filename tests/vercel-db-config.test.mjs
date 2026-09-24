import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { getDatabaseConfig } from '../lib/db-config.js';

const names = ['DATABASE_URL', 'MIGRATION_DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING'];
const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
for (const name of names) delete process.env[name];
after(() => {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

test('koneksi eksplisit tetap menang atas integrasi Vercel', () => {
  process.env.DATABASE_URL = 'postgresql://local:test@localhost:5432/store';
  process.env.POSTGRES_PRISMA_URL = 'postgresql://vercel:test@localhost:6543/store';
  assert.equal(new URL(getDatabaseConfig().connectionString).username, 'local');
});

test('runtime menerima URL Prisma dari integrasi tanpa parameter khusus Prisma', () => {
  delete process.env.DATABASE_URL;
  process.env.POSTGRES_PRISMA_URL = 'postgresql://vercel:test@aws-0-example.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
  const url = new URL(getDatabaseConfig().connectionString);
  assert.equal(url.port, '6543');
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
  assert.equal(url.searchParams.has('pgbouncer'), false);
  assert.equal(url.searchParams.has('connection_limit'), false);
  assert.ok(url.searchParams.get('sslrootcert')?.endsWith('prod-ca-2021.crt'));
});

test('migrasi memakai URL non-pooling dari integrasi', () => {
  process.env.POSTGRES_URL_NON_POOLING = 'postgresql://vercel:test@aws-0-example.pooler.supabase.com:5432/postgres';
  assert.equal(new URL(getDatabaseConfig({ migration: true }).connectionString).port, '5432');
});
