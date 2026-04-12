import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { careers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const all = await db.select().from(careers).orderBy(desc(careers.createdAt));
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch careers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, requirements, status, location, type, workMode, link } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }
    const newCareer = { 
      id: uuidv4(), 
      title, 
      description, 
      requirements: requirements || null, 
      status: status || 'open', 
      location: location || null,
      type: type || null,
      workMode: workMode || null,
      link: link || null,
      createdAt: new Date() 
    };
    await db.insert(careers).values(newCareer);
    return NextResponse.json(newCareer, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create career' }, { status: 500 });
  }
}
