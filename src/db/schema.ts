import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(), // To store bcrypt/argon2 hashes natively, or just use simple salt
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const blogs = sqliteTable('blogs', {
  id: text('id').primaryKey(), // UUID
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(), // HTML string from TipTap
  category: text('category'),
  imageUrl: text('image_url'),
  author: text('author'),
  authorImageUrl: text('author_image_url'),
  readTime: text('read_time'),
  likes: integer('likes').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const careers = sqliteTable('careers', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  status: text('status').default('open').notNull(),
  location: text('location'),
  type: text('type'),
  workMode: text('work_mode'),
  link: text('link'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const galleries = sqliteTable('galleries', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
