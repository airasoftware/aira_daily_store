import pg from 'pg';
import { getDatabaseConfig } from './db-config.js';

const globalForDb = globalThis;

export function getPool() {
  if (!globalForDb.airaPool) {
    globalForDb.airaPool = new pg.Pool({ ...getDatabaseConfig(), max: 1 });
  }
  return globalForDb.airaPool;
}
