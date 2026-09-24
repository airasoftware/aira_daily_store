import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function getDatabaseConfig({ migration = false } = {}) {
  const sources = migration
    ? ['MIGRATION_DATABASE_URL', 'POSTGRES_URL_NON_POOLING', 'DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL']
    : ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL'];
  const source = sources.find(name => process.env[name]);
  if (!source) throw new Error(`Koneksi PostgreSQL belum diatur. Isi ${sources.join(' atau ')}. Lihat README.md.`);
  const raw = process.env[source];

  let url;
  try { url = new URL(raw); } catch { throw new Error(`${source} bukan URL PostgreSQL yang valid.`); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error(`${source} harus menggunakan protokol PostgreSQL.`);

  if (source === 'POSTGRES_PRISMA_URL') {
    url.searchParams.delete('pgbouncer');
    url.searchParams.delete('connection_limit');
  }

  const isSupabase = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.pooler.supabase.com');
  if (migration && isSupabase && url.port === '6543') {
    throw new Error('Atur MIGRATION_DATABASE_URL atau POSTGRES_URL_NON_POOLING ke Direct atau Session pooler Supabase untuk migrasi/seed.');
  }
  // pg saat ini memperlakukan require/prefer/verify-ca sebagai verify-full.
  // Gunakan nama mode yang eksplisit agar tidak ada penurunan verifikasi saat pg diperbarui.
  const sslMode = url.searchParams.get('sslmode');
  if (isSupabase && (!sslMode || ['prefer', 'require', 'verify-ca'].includes(sslMode))) {
    url.searchParams.set('sslmode', 'verify-full');
  }
  if (isSupabase && !url.searchParams.has('sslrootcert')) {
    const caPath = resolve(process.cwd(), 'prod-ca-2021.crt');
    if (!existsSync(caPath)) {
      throw new Error('Sertifikat CA Supabase prod-ca-2021.crt tidak ditemukan di root proyek. Unduh dari Database Settings > SSL Configuration.');
    }
    url.searchParams.set('sslrootcert', caPath);
  }

  return {
    connectionString: url.toString(),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000
  };
}
