import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const song = await prisma.song.findUnique({
      where: { id: parseInt(id) },
      include: { tags: true },
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    console.error('Failed to fetch song:', error);
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
	console.log("PUT request:");
  const { id } = await params;
  try {
    const { title, artist, key, content, tags } = await req.json();
		console.log(title, artist, key, content, tags);
    const song = await prisma.song.update({
      where: { id: parseInt(id) },
      data: {
        title,
        artist,
        key,
        content,
        tags: {
          set: [], // Remove existing tags
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: { tags: true },
    });
		console.log("\nResult:", song);
    return NextResponse.json(song);
  } catch (error) {
    console.error('Failed to update song:', error);
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    await prisma.song.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete song:', error);
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}