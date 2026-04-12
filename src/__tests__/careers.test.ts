import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { careers } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Careers DB', () => {
  const testCareer = {
    id: 'career-1',
    title: 'Logistics Coordinator',
    description: 'Manage shipments and deliveries',
    requirements: '2+ years experience',
    status: 'open' as const,
    createdAt: new Date(),
  };

  beforeEach(async () => { await db.delete(careers); });

  it('inserts a career listing', async () => {
    await db.insert(careers).values(testCareer);
    const all = await db.select().from(careers).all();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Logistics Coordinator');
    expect(all[0].status).toBe('open');
  });

  it('toggles career status to closed', async () => {
    await db.insert(careers).values(testCareer);
    await db.update(careers).set({ status: 'closed' }).where(eq(careers.id, 'career-1'));
    const updated = await db.select().from(careers).all();
    expect(updated[0].status).toBe('closed');
  });

  it('deletes a career listing', async () => {
    await db.insert(careers).values(testCareer);
    await db.delete(careers).where(eq(careers.id, 'career-1'));
    const all = await db.select().from(careers).all();
    expect(all).toHaveLength(0);
  });

  it('returns only open careers when filtered', async () => {
    await db.insert(careers).values(testCareer);
    await db.insert(careers).values({ ...testCareer, id: 'career-2', title: 'Driver', status: 'closed' });
    const open = await db.select().from(careers).where(eq(careers.status, 'open')).all();
    expect(open).toHaveLength(1);
    expect(open[0].title).toBe('Logistics Coordinator');
  });
});
