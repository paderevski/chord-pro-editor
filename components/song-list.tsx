import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Tag } from 'lucide-react';
import { Song, Tag as PrismaTag } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SongWithTags extends Song {
  tags: PrismaTag[];
}

interface SongListProps {
  onSongSelect: (song: SongWithTags) => void;
  selectedSong: SongWithTags | null;
}

export default function SongList({ onSongSelect, selectedSong }: SongListProps) {
  const [songs, setSongs] = useState<SongWithTags[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<SongWithTags[]>([]);

  useEffect(() => {
    fetchSongs();
  }, []);

  useEffect(() => {
    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSongs(filtered);
  }, [searchTerm, songs]);

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data: SongWithTags[] = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  const handleDeleteSong = async (id: number) => {
    try {
      await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      setSongs(songs.filter(song => song.id !== id));
    } catch (error) {
      console.error('Failed to delete song:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header section remains the same */}

      {/* Scrollable song list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                selectedSong?.id === song.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => onSongSelect(song)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{song.title}</h3>
                  {song.artist && (
                    <p className="text-sm text-gray-600">{song.artist}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {song.key}
                </Badge>
              </div>

              {song.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {song.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}