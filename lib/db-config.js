import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function getDatabaseConfig({ migration = false } = {}) {
  const raw = (migration && process.env.MIGRATION_DATABASE_URL) || process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL belum diatur. Lihat README.md.');

  let url;
  try { url = new URL(raw); } catch { throw new Error('DATABASE_URL bukan URL PostgreSQL yang valid.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL harus menggunakan protokol PostgreSQL.');

  const isSupabase = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.pooler.supabase.com');
  if (migration && isSupabase && url.port === '6543' && !process.env.MIGRATION_DATABASE_URL) {
    throw new Error('Atur MIGRATION_DATABASE_URL ke Direct atau Session pooler Supabase untuk migrasi/seed.');
  }
  // pg saat ini memperlakukan require/prefer/verify-ca sebagai verify-full.
  // Gunakan nama mode yang eksplisit agar tidak ada penurunan verifikasi saat pg diperbarui.
  const sslMode = url.searchParams.get('sslmode');
  if (isSupabase && (!sslMode || ['prefer', 'require', 'verify-ca'].includes(sslMode))) {
    url.searchParams.set('sslmode', 'verify-full');
  }
  if (isSupabase && !url.searchParams.has('sslrootcert')) {
    const caPath = fileURLToPath(new URL('../prod-ca-2021.crt', import.meta.url));
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
