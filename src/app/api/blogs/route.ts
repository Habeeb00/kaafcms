import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createBlog, listBlogs } from '@/lib/remote-db';

// GET all blogs (public)
export async function GET() {
  try {
    const allBlogs = await listBlogs();
    return NextResponse.json(allBlogs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// POST create blog
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, content, category, imageUrl, author, authorImageUrl, readTime } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    const newBlog = await createBlog({
      id: uuidv4(),
      title,
      slug,
      content,
      category: category || null,
      imageUrl: imageUrl || null,
      author: author || null,
      authorImageUrl: authorImageUrl || null,
      readTime: readTime || null,
    });
    return NextResponse.json(newBlog, { status: 201 });
  } catch (e: any) {
    console.error(e);
    if (e.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A blog with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}
