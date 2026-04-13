import { NextResponse } from 'next/server';
import { pingDatabase } from '@/lib/remote-db';

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DB Test Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
