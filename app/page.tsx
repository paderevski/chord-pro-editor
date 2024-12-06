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

	const handleSaveSong = async (content: string, key: string) => {
		if (!selectedSong) return;

		try {
			const response = await fetch(`/api/songs/${selectedSong.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: selectedSong.title,
					artist: selectedSong.artist,
					key,
					content,
					tags: selectedSong.tags.map(tag => tag.name)
				}),
			});

			if (!response.ok) throw new Error('Failed to save song');
			const updatedSong = await response.json();
			setSelectedSong(updatedSong);
		} catch (error) {
			console.error('Error saving song:', error);
			throw error;
		}
	};

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
        <SongList onSongSelect={setSelectedSong} selectedSong={selectedSong} />
      </div>

      <div className="flex-1">
        <ChordSheet
          initialContent={selectedSong?.content}
          songKey={selectedSong?.key}
          selectedSongId={selectedSong?.id}
          onSave={handleSaveSong}
        />
      </div>
    </div>
  );
}