'use client';

import SongList from '@/components/song-list';
import ChordSheet from '@/components/chord-sheet';
import { Song, Tag } from '@prisma/client';
import { useState, useEffect } from 'react';

interface SongWithTags extends Song {
  tags: Tag[];
}

export default function Home() {
  const [selectedSong, setSelectedSong] = useState<SongWithTags | null>(null);
  const [songs, setSongs] = useState<SongWithTags[]>([]);

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      setSongs(data);
      // If we have a selected song, update it with fresh data
      if (selectedSong) {
        const updatedSelectedSong = data.find((song: { id: number; }) => song.id === selectedSong.id);
        if (updatedSelectedSong) {
          setSelectedSong(updatedSelectedSong);
        }
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSongs();
  }, []);

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

      // Refresh the song list after saving
      await fetchSongs();
    } catch (error) {
      console.error('Error saving song:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
        <SongList
          songs={songs}
          selectedSong={selectedSong}
          onSongSelect={setSelectedSong}
        />
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