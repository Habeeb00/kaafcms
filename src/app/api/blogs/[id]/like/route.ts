import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST increment like count
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if blog exists
    const blog = await db.select().from(blogs).where(eq(blogs.id, id)).get();
    if (!blog) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    // Increment likes using SQL expression
    await db.update(blogs)
      .set({
        likes: sql`${blogs.likes} + 1`
      })
      .where(eq(blogs.id, id));

    const updatedBlog = await db.select().from(blogs).where(eq(blogs.id, id)).get();
    
    return NextResponse.json({ 
      success: true, 
      likes: updatedBlog?.likes 
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to increment likes' }, { status: 500, headers: corsHeaders });
  }
}
