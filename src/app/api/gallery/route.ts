import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createGallery, listGalleries } from '@/lib/remote-db';

export async function GET() {
  try {
    const all = await listGalleries();
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
    const item = await createGallery({ id: uuidv4(), title, imageUrl, category: category || null });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to add gallery item' }, { status: 500 });
  }
}
