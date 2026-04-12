import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { blogs } from '@/db/schema';

describe('Blogs DB', () => {
  const testBlog = {
    id: 'blog-test-1',
    title: 'Hello World',
    slug: 'hello-world',
    content: '<p>Test content</p>',
    category: 'Testing',
    imageUrl: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    await db.delete(blogs);
  });

  it('inserts a blog post', async () => {
    await db.insert(blogs).values(testBlog);
    const all = await db.select().from(blogs).all();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Hello World');
  });

  it('selects all blogs', async () => {
    await db.insert(blogs).values(testBlog);
    await db.insert(blogs).values({ ...testBlog, id: 'blog-test-2', slug: 'second-post', title: 'Second Post' });
    const all = await db.select().from(blogs).all();
    expect(all).toHaveLength(2);
  });

  it('deletes a blog post', async () => {
    await db.insert(blogs).values(testBlog);
    const { eq } = await import('drizzle-orm');
    await db.delete(blogs).where(eq(blogs.id, 'blog-test-1'));
    const all = await db.select().from(blogs).all();
    expect(all).toHaveLength(0);
  });

  it('updates a blog post title', async () => {
    await db.insert(blogs).values(testBlog);
    const { eq } = await import('drizzle-orm');
    await db.update(blogs).set({ title: 'Updated Title' }).where(eq(blogs.id, 'blog-test-1'));
    const updated = await db.select().from(blogs).all();
    expect(updated[0].title).toBe('Updated Title');
  });

  it('enforces unique slugs', async () => {
    await db.insert(blogs).values(testBlog);
    await expect(
      db.insert(blogs).values({ ...testBlog, id: 'blog-test-3' }) // same slug
    ).rejects.toThrow();
  });
});
