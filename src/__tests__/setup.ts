// Global test setup — use an in-memory SQLite DB for every test run
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import { vi } from 'vitest';

// Create fresh in-memory DB for tests
const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT,
    image_url TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS careers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS galleries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT,
    created_at INTEGER NOT NULL
  );
`);

// Mock the db module with the in-memory instance
vi.mock('@/db', () => ({ db: testDb }));

// Seed env for auth tests
process.env.ADMIN_EMAIL = 'admin@kaaf.com';
process.env.ADMIN_PASSWORD = 'password123';
process.env.JWT_SECRET = 'test-secret';
