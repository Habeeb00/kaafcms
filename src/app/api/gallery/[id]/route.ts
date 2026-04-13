import { NextRequest, NextResponse } from 'next/server';
import { deleteFileByUrl } from '@/lib/storage';
import { deleteGallery, getGalleryById, updateGallery } from '@/lib/remote-db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Get the image URL before deleting the record
  const item = await getGalleryById(id);
  if (item?.imageUrl) {
    await deleteFileByUrl(item.imageUrl);
  }

  await deleteGallery(id);
  
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, imageUrl, category } = await req.json();
  await updateGallery(id, { title, imageUrl, category });
  return NextResponse.json({ success: true });
}
