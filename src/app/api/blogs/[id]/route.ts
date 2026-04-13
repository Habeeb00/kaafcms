import { NextRequest, NextResponse } from 'next/server';
import { deleteFileByUrl } from '@/lib/storage';
import { deleteBlog, getBlogById, updateBlog } from '@/lib/remote-db';

// GET single blog
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(blog);
}

// PUT update blog
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, slug, content, category, imageUrl, author, authorImageUrl, readTime, likes } = body;
  
  await updateBlog(id, { title, slug, content, category, imageUrl, author, authorImageUrl, readTime, likes });

  return NextResponse.json({ success: true });
}

// DELETE blog (Permanent Delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Get image URLs before deletion
  const blog = await getBlogById(id);
  if (blog) {
    if (blog.imageUrl) await deleteFileByUrl(blog.imageUrl);
    if (blog.authorImageUrl) await deleteFileByUrl(blog.authorImageUrl);
  }

  await deleteBlog(id);
  
  return NextResponse.json({ success: true });
}
