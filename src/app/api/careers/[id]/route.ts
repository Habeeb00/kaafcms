import { NextRequest, NextResponse } from 'next/server';
import { deleteCareer, getCareerById, updateCareer } from '@/lib/remote-db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCareerById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, description, requirements, status, location, type, workMode, link } = await req.json();
  await updateCareer(id, { title, description, requirements, status, location, type, workMode, link });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCareer(id);
  return NextResponse.json({ success: true });
}
