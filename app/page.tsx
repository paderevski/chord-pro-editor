'use client';

import SongList from '@/components/song-list';
import ChordSheet from '@/components/chord-sheet';
import { Song, Tag } from '@prisma/client';
import { useState } from 'react';

interface SongWithTags extends Song {
  tags: Tag[];
}

export default function Home() {
  const [selectedSong, setSelectedSong] = useState<SongWithTags | null>(null);

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
        <SongList
          onSongSelect={(song: SongWithTags | null) => setSelectedSong(song)}
          selectedSong={selectedSong}
        />
      </div>

      <div className="flex-1">
        <ChordSheet
          initialContent={selectedSong?.content}
          songKey={selectedSong?.key}
        />
      </div>
    </div>
  );
}