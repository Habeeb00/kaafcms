import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLocal } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

/**
 * Database connection factory.
 * In Cloudflare Pages/Workers, we use the D1 binding.
 * For local development, we fall back to better-sqlite3.
 */
function createDb() {
  // Check if we are in a Cloudflare environment with D1 binding
  // Note: For Next.js on Pages, the binding is often provided in the global 'process.env' 
  // or via a specific cloudflare request context.
  const d1Binding = (process.env as any).DB;

  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  // Local fallback
  const sqlite = new Database(path.join(process.cwd(), 'local.db'), {
    timeout: 10000, // 10 seconds timeout for locked database
  });
  return drizzleLocal(sqlite, { schema });
}

export const db = createDb();
