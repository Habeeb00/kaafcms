import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs, galleries } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { deleteFileByUrl } from '@/lib/storage';

export async function GET() {
  try {
    const trashedBlogs = await db.select().from(blogs).where(eq(blogs.isTrashed, true));
    const trashedGalleries = await db.select().from(galleries).where(eq(galleries.isTrashed, true));

    // Combine and mark types
    const items = [
      ...trashedBlogs.map(b => ({ ...b, type: 'blog' })),
      ...trashedGalleries.map(g => ({ ...g, type: 'gallery' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch trash' }, { status: 500 });
  }
}

// RESTORE or PERMANENT DELETE
export async function POST(req: NextRequest) {
  try {
    const { id, type, action } = await req.json();

    if (action === 'restore') {
      if (type === 'blog') {
        await db.update(blogs).set({ isTrashed: false }).where(eq(blogs.id, id));
      } else if (type === 'gallery') {
        await db.update(galleries).set({ isTrashed: false }).where(eq(galleries.id, id));
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (type === 'blog') {
        const blog = await db.select().from(blogs).where(eq(blogs.id, id)).get();
        if (blog) {
          await deleteFileByUrl(blog.imageUrl);
          await deleteFileByUrl(blog.authorImageUrl);
          await db.delete(blogs).where(eq(blogs.id, id));
        }
      } else if (type === 'gallery') {
        const item = await db.select().from(galleries).where(eq(galleries.id, id)).get();
        if (item) {
          await deleteFileByUrl(item.imageUrl);
          await db.delete(galleries).where(eq(galleries.id, id));
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

// EMPTY TRASH
export async function DELETE() {
  try {
    const trashedBlogs = await db.select().from(blogs).where(eq(blogs.isTrashed, true));
    const trashedGalleries = await db.select().from(galleries).where(eq(galleries.isTrashed, true));

    for (const blog of trashedBlogs) {
        await deleteFileByUrl(blog.imageUrl);
        await deleteFileByUrl(blog.authorImageUrl);
        await db.delete(blogs).where(eq(blogs.id, blog.id));
    }

    for (const item of trashedGalleries) {
        await deleteFileByUrl(item.imageUrl);
        await db.delete(galleries).where(eq(galleries.id, item.id));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to empty trash' }, { status: 500 });
  }
}
