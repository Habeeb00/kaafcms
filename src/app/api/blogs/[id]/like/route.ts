import { NextRequest, NextResponse } from 'next/server';
import { getBlogById, incrementBlogLikes } from '@/lib/remote-db';

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
    const blog = await getBlogById(id);
    if (!blog) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const updatedBlog = await incrementBlogLikes(id);
    
    return NextResponse.json({ 
      success: true, 
      likes: updatedBlog?.likes 
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to increment likes' }, { status: 500, headers: corsHeaders });
  }
}
