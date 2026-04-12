import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { galleries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { deleteFileByUrl } from '@/lib/storage';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Get the image URL before deleting the record
  const item = await db.select().from(galleries).where(eq(galleries.id, id)).get();
  if (item?.imageUrl) {
    await deleteFileByUrl(item.imageUrl);
  }

  // 2. Delete from DB
  await db.delete(galleries)
    .where(eq(galleries.id, id));
  
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, imageUrl, category } = await req.json();
  await db.update(galleries).set({ title, imageUrl, category }).where(eq(galleries.id, id));
  return NextResponse.json({ success: true });
}
