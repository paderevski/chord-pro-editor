import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Tag } from 'lucide-react';
import { Song, Tag as PrismaTag } from '@prisma/client';
import { useState, useEffect } from 'react';
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
  songs: SongWithTags[];
  selectedSong: SongWithTags | null;
  onSongSelect: (song: SongWithTags) => void;
}

export default function SongList({ songs, selectedSong, onSongSelect }: SongListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<SongWithTags[]>(songs);

  // Update filtered songs when songs or search term changes
  useEffect(() => {
    const filtered = songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSongs(filtered);
  }, [searchTerm, songs]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h1 className="text-xl font-bold mb-4">My Songs</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10 w-full"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Song</DialogTitle>
              </DialogHeader>
              {/* Add new song form here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

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