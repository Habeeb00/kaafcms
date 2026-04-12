import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogs } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const testId = uuidv4();
    await db.insert(blogs).values({
      id: testId,
      title: 'TEST_SYNC',
      slug: `test-sync-${Date.now()}`,
      content: '<p>This is a temporary record to verify Cloudflare D1 synchronization between Admin and Frontend.</p>',
      category: 'Diagnostic',
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sync Test Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
