import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createCareer, listCareers } from '@/lib/remote-db';

export async function GET() {
  try {
    const all = await listCareers();
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
    const newCareer = await createCareer({ 
      id: uuidv4(), 
      title, 
      description, 
      requirements: requirements || null, 
      status: status || 'open', 
      location: location || null,
      type: type || null,
      workMode: workMode || null,
      link: link || null,
    });
    return NextResponse.json(newCareer, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create career' }, { status: 500 });
  }
}
