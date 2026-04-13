import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSyncTestBlog } from '@/lib/remote-db';

export async function POST() {
  try {
    const testId = uuidv4();
    await createSyncTestBlog(testId, `test-sync-${Date.now()}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sync Test Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
