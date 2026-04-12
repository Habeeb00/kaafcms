import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { careers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.select().from(careers).where(eq(careers.id, id)).get();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, description, requirements, status, location, type, workMode, link } = await req.json();
  await db.update(careers).set({ title, description, requirements, status, location, type, workMode, link }).where(eq(careers.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(careers).where(eq(careers.id, id));
  return NextResponse.json({ success: true });
}
