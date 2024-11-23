"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Music theory utilities
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Components
const ChordLyricPair = ({ chord, lyrics, isBarline }) => {
  if (isBarline) {
    return (
      <div className="inline-block align-top mx-1 w-[1px] bg-gray-300">
        <div className="h-6">&#x200B;</div>
        <div className="h-6">&#x200B;</div>
      </div>
    );
  }
  
  const width = Math.max(chord?.length || 0, lyrics?.length || 0);
  
  return (
    <div className="inline-block align-top" style={{ minWidth: `${width}ch` }}>
      <div className="text-blue-600 font-bold h-6 overflow-visible whitespace-pre">
        {chord || '\u00A0'}
      </div>
      <div className="whitespace-pre">
        {lyrics || '\u00A0'}
      </div>
    </div>
  );
};

const PrintPreview = ({ content }) => (
  <div className="bg-white w-[8.5in] min-h-[11in] mx-auto p-[0.5in] shadow-lg">
    <div className="font-mono">{content}</div>
  </div>
);

// Main component
const ChordSheet = () => {
  const [input, setInput] = useState(`{title: I Feel Lucky}
{key: C}
{start_of_verse}
[C]Somewhere | [Am]over the | rainbow |
[F]Way up | [C]high |
[F]Birds fly | [C]over the | rainbow |
[Em]Why then, oh | [Am]why can't | [F]I?[C] |
{end_of_verse}`);
  const [originalInput, setOriginalInput] = useState(input);
  const [fromKey, setFromKey] = useState('C');
  const [toKey, setToKey] = useState('C');

  useEffect(() => {
    setOriginalInput(input);
  }, []);

  // Basic parsing of ChordPro format
  const parseLine = (line) => {
    if (line.startsWith('{') && line.endsWith('}')) {
      const content = line.slice(1, -1);
      const contentLower = content.toLowerCase();
      
      if (contentLower === 'start_of_verse' || contentLower === 'sov') {
        return { type: 'section_start', section: 'verse' };
      }
      if (contentLower === 'start_of_chorus' || contentLower === 'soc') {
        return { type: 'section_start', section: 'chorus' };
      }
      if (contentLower === 'end_of_verse' || contentLower === 'eov' ||
          contentLower === 'end_of_chorus' || contentLower === 'eoc') {
        return { type: 'section_end' };
      }
      
      const colonIndex = content.indexOf(':');
      if (colonIndex !== -1) {
        return {
          type: 'metadata',
          key: content.substring(0, colonIndex).trim().toLowerCase(),
          value: content.substring(colonIndex + 1).trim()
        };
      }
      
      return { type: 'metadata', key: content, value: '' };
    }

    const pairs = [];
    let buffer = '';
    let currentChord = '';
    let inChord = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '|') {
        if (buffer || currentChord) {
          pairs.push({ chord: currentChord, lyrics: buffer });
          currentChord = '';
          buffer = '';
        }
        pairs.push({ isBarline: true });
        continue;
      }
      
      if (char === '[') {
        if (buffer && !currentChord) {
          pairs.push({ chord: '', lyrics: buffer });
          buffer = '';
        }
        else if (buffer && currentChord) {
          pairs.push({ chord: currentChord, lyrics: buffer });
          buffer = '';
        }
        currentChord = '';
        inChord = true;
      } else if (char === ']') {
        inChord = false;
      } else if (inChord) {
        currentChord += char;
      } else {
        buffer += char;
      }
    }

    if (buffer || currentChord) {
      pairs.push({ chord: currentChord, lyrics: buffer });
    }

    return { type: 'line', pairs };
  };

  const renderContent = () => {
    const lines = input.split('\n').map(parseLine);
    const content = [];
    let currentSection = null;
    let currentSectionContent = [];
    let key = 0;

    const addCurrentSection = () => {
      if (currentSection && currentSectionContent.length > 0) {
        content.push(
          <div key={key++} className={currentSection === 'chorus' ? 'pl-4 border-l-2 border-blue-600' : ''}>
            {currentSectionContent}
          </div>
        );
        currentSectionContent = [];
      }
    };

    lines.forEach((line) => {
      if (line.type === 'metadata') {
        addCurrentSection();
        content.push(
          <div key={key++} className="font-bold text-lg mb-2">{line.value}</div>
        );
      }
      else if (line.type === 'section_start') {
        addCurrentSection();
        currentSection = line.section;
        currentSectionContent.push(
          <div key={key++} className={`text-sm font-bold mb-2 ${line.section === 'chorus' ? 'text-blue-600' : 'text-gray-600'}`}>
            {line.section.charAt(0).toUpperCase() + line.section.slice(1)}:
          </div>
        );
      }
      else if (line.type === 'section_end') {
        addCurrentSection();
        currentSection = null;
      }
      else if (line.type === 'line') {
        currentSectionContent.push(
          <div key={key++} className="mb-4">
            {line.pairs.map((pair, pairIndex) => (
              <ChordLyricPair key={pairIndex} {...pair} />
            ))}
          </div>
        );
      }
    });

    addCurrentSection();
    return content;
  };

  const handleTranspose = () => {
    const fromIndex = KEYS.indexOf(fromKey);
    const toIndex = KEYS.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return;
    
    const semitones = (toIndex - fromIndex + 12) % 12;
    const newInput = input.split('\n').map(line => {
      if (line.toLowerCase().startsWith('{key:')) {
        return `{key: ${toKey}}`;
      }
      return transposeLine(line, semitones);
    }).join('\n');
    
    setInput(newInput);
  };

  const transposeLine = (line, semitones) => {
    return line.replace(/\[([A-G][#b]?[^]]*)\]/g, (_, chord) => {
      const note = chord.match(/^[A-G][#b]?/)[0];
      const quality = chord.slice(note.length);
      const noteIndex = NOTES.indexOf(note);
      if (noteIndex === -1) return `[${chord}]`;
      const newNoteIndex = (noteIndex + semitones + 12) % 12;
      return `[${NOTES[newNoteIndex]}${quality}]`;
    });
  };

  const handleRevert = () => {
    setInput(originalInput);
    setFromKey('C');
    setToKey('C');
  };

  const content = renderContent();

  return (
    <div className="h-screen flex flex-col">
      <div className="h-16 border-b bg-gray-50 flex items-center px-4">
        <h1 className="text-xl font-bold">ChordPro Editor</h1>
        <div className="flex-grow flex items-center justify-end space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">From:</span>
              <Select value={fromKey} onValueChange={setFromKey}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">To:</span>
              <Select value={toKey} onValueChange={setToKey}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="secondary"
              onClick={handleTranspose}
              disabled={fromKey === toKey}
            >
              Transpose
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleRevert}
              disabled={input === originalInput}
            >
              Revert
            </Button>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[8.7in] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Print Preview</DialogTitle>
              </DialogHeader>
              <div className="bg-gray-100 p-4">
                <PrintPreview content={content} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex-grow flex">
        <div className="w-1/2 border-r p-4 flex flex-col">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow font-mono resize-none"
            placeholder="Enter ChordPro format text..."
          />
        </div>
        
        <div className="w-1/2 p-4 bg-white overflow-auto">
          <div className="max-w-3xl mx-auto">{content}</div>
        </div>
      </div>
    </div>
  );
};

export default ChordSheet;
