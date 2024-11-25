// app/api/songs/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { auth } from '@clerk/nextjs';

const prisma = new PrismaClient();


export async function GET() {
  console.log('GET /api/songs - Request received');

  try {
    // Remove auth check and use a dummy userId
    const userId = "development";

    console.log('Attempting to fetch songs');
    const songs = await prisma.song.findMany({
      where: { userId },
      include: { tags: true },
      orderBy: { updatedAt: 'desc' },
    });
    console.log('Successfully fetched songs:', songs);

    return NextResponse.json(songs);

  } catch (error) {
    console.error('Detailed error in /api/songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = "development";  // Use dummy userId

    const { title, artist, key, content, tags } = await req.json();

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        key,
        content,
        userId,
        tags: {
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
    console.error('Error creating song:', error);
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
  }
}
