import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { deleteFileByUrl } from '@/lib/storage';

// GET single blog
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blog = await db.select().from(blogs).where(eq(blogs.id, id)).get();
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(blog);
}

// PUT update blog
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, slug, content, category, imageUrl, author, authorImageUrl, readTime, likes } = body;
  
  await db.update(blogs)
    .set({ title, slug, content, category, imageUrl, author, authorImageUrl, readTime, likes })
    .where(eq(blogs.id, id));

  return NextResponse.json({ success: true });
}

// DELETE blog (Permanent Delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Get image URLs before deletion
  const blog = await db.select().from(blogs).where(eq(blogs.id, id)).get();
  if (blog) {
    if (blog.imageUrl) await deleteFileByUrl(blog.imageUrl);
    if (blog.authorImageUrl) await deleteFileByUrl(blog.authorImageUrl);
  }

  // 2. Delete from DB
  await db.delete(blogs)
    .where(eq(blogs.id, id));
  
  return NextResponse.json({ success: true });
}
