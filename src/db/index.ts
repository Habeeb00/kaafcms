import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';

function createDb() {
  const d1Binding = (process.env as { DB?: unknown }).DB;

  if (
    d1Binding &&
    typeof d1Binding === 'object' &&
    'prepare' in d1Binding &&
    typeof (d1Binding as { prepare?: unknown }).prepare === 'function'
  ) {
    return drizzleD1(d1Binding as Parameters<typeof drizzleD1>[0], { schema });
  }

  throw new Error(
    'Local database fallback is disabled. Configure Cloudflare D1 for database access.'
  );
}

export const db = createDb();
