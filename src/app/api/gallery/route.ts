import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { galleries } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const all = await db.select().from(galleries).orderBy(desc(galleries.createdAt));
    return NextResponse.json(all);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, imageUrl, category } = await req.json();
    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and imageUrl are required' }, { status: 400 });
    }
    const item = { id: uuidv4(), title, imageUrl, category: category || null, createdAt: new Date() };
    await db.insert(galleries).values(item);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to add gallery item' }, { status: 500 });
  }
}
