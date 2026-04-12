import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    // Simple query to check connectivity
    await db.select({ val: blogs.id }).from(blogs).limit(1);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DB Test Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
