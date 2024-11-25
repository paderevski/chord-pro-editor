
// app/api/songs/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { auth } from '@clerk/nextjs';

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const  userId  = "development";
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const song = await prisma.song.findUnique({
      where: { id: parseInt(params.id) },
      include: { tags: true },
    });

    if (!song || song.userId !== userId) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json(song);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const  userId  = "development";
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, artist, key, content, tags } = await req.json();

    const song = await prisma.song.update({
      where: { id: parseInt(params.id) },
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

    return NextResponse.json(song);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const  userId  = "development";
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.song.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}