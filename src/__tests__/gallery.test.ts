import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { galleries } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Gallery DB', () => {
  const item = {
    id: 'gallery-1',
    title: 'Fleet Photo',
    imageUrl: 'https://example.com/fleet.jpg',
    category: 'Fleet',
    createdAt: new Date(),
  };

  beforeEach(async () => { await db.delete(galleries); });

  it('inserts a gallery item', async () => {
    await db.insert(galleries).values(item);
    const all = await db.select().from(galleries).all();
    expect(all).toHaveLength(1);
    expect(all[0].imageUrl).toBe('https://example.com/fleet.jpg');
  });

  it('updates gallery item title', async () => {
    await db.insert(galleries).values(item);
    await db.update(galleries).set({ title: 'Updated Fleet' }).where(eq(galleries.id, 'gallery-1'));
    const updated = await db.select().from(galleries).all();
    expect(updated[0].title).toBe('Updated Fleet');
  });

  it('deletes a gallery item', async () => {
    await db.insert(galleries).values(item);
    await db.delete(galleries).where(eq(galleries.id, 'gallery-1'));
    const all = await db.select().from(galleries).all();
    expect(all).toHaveLength(0);
  });
});
