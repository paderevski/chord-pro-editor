"use client";

import { ParsedLine, ChordLyricPairProps } from './types';
import PrintButton from './print-preview';
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
// const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// const KEYS_MAJOR = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// const KEYS_MINOR = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];

// const SHARP_KEYS = ['D', 'E', 'G', 'A', 'B', 'C#m', 'Em', 'F#m', 'G#m', 'Bm', 'Am'];
// const FLAT_KEYS = ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cm', 'Dm', 'Ebm', 'Fm', 'Gm','Bbm'];

const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Type for note values (0-11 representing the chromatic scale)
type NoteValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// Map both sharp and flat notation to the same numeric value
const NOTES: { [key: string]: NoteValue } = {
  'C': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11
} as const;

// Reverse mapping to get note names from values
// We'll prefer sharps by default, but can be configured
const NOTE_NAMES: { [key in NoteValue]: string } = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B'
};

// Optional: Flat notation preference
const FLAT_NOTE_NAMES: { [key in NoteValue]: string } = {
  0: 'C',
  1: 'Db',
  2: 'D',
  3: 'Eb',
  4: 'E',
  5: 'F',
  6: 'Gb',
  7: 'G',
  8: 'Ab',
  9: 'A',
  10: 'Bb',
  11: 'B'
};

// Keys that traditionally use flats
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

// Function to get note name, respecting flat/sharp preference
const getNoteNameFromValue = (value: NoteValue, preferFlats = false): string => {
	console.log('getNoteNameFromValue: ' + value + ', preferFlats: ' + preferFlats);
  return preferFlats ? FLAT_NOTE_NAMES[value] : NOTE_NAMES[value];
};

const parseLine = (line: string): ParsedLine => {
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

  const pairs: ChordLyricPairProps[] = [];
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

// Components
const ChordLyricPair: React.FC<{ chord?: string; lyrics?: string; isBarline?: boolean }> = ({ chord, lyrics, isBarline }) => {
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
    <div className="inline-block align-top" style={{ minWidth: `${width/4		}ch` }}>
      <div className="text-blue-600 font-bold h-6 overflow-visible whitespace-pre">
        {chord || '\u00A0'}
      </div>
      <div className="whitespace-pre">
        {lyrics || '\u00A0'}
      </div>
    </div>
  );
};

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
	const [isTransposing, setIsTransposing] = useState(false);

  useEffect(() => {
    setOriginalInput(input);
  }, []);

  const renderContent = () => {
    const lines = input.split('\n').map(parseLine);
    const content: React.JSX.Element[] = [];
    let currentSection: string | null | undefined = null;
    let currentSectionContent: React.JSX.Element[] = [];
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
      else if (line.pairs && line.type === 'line') {
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

		// Update the handleTranspose function
	const handleTranspose = () => {
		const fromIndex = KEYS.indexOf(fromKey);
		const toIndex = KEYS.indexOf(toKey);
		if (fromIndex === -1 || toIndex === -1) return;

		setIsTransposing(true); // Set flag before changing input
		const semitones = (toIndex - fromIndex + 12) % 12;
		const newInput = input.split('\n').map(line => {
			if (line.toLowerCase().startsWith('{key:')) {
				return `{key: ${toKey}}`;
			}
			return transposeLine(line, semitones, toKey);
		}).join('\n');

		setInput(newInput);
		setIsTransposing(false); // Reset flag after change
	};

	const transposeLine = (line: string, semitones: number, toKey?: string) => {
		// Determine whether to use flats based on the target key
		const preferFlats = toKey ? FLAT_KEYS.has(toKey) : false;
		console.log('toKey: ' + toKey + ' preferFlats: ' + preferFlats + ' ' + FLAT_KEYS);

		return line.replace(/(\s?|^)\[([A-G][#b]?m?.*?(?:\/[A-G][#b]?)?)\]/g, (match, space, chord) => {
			// Split chord into main chord and bass note if it exists
			const [mainChord, bassNote] = chord.split('/');

			// Extract the root note and quality from the main chord
			const [, rootNote = '', quality = ''] = mainChord.match(/^([A-G][#b]?)(.*)$/) || [];

			if (!rootNote || !(rootNote in NOTES)) return match;

			// Transpose the root note using the new system
			const rootValue = NOTES[rootNote];
			const newRootValue = ((rootValue + semitones) % 12) as NoteValue;
			const newRoot = getNoteNameFromValue(newRootValue, preferFlats);

			// If there's a bass note, transpose it too
			let transposedBass = '';
			if (bassNote && bassNote in NOTES) {
				const bassValue = NOTES[bassNote];
				const newBassValue = ((bassValue + semitones) % 12) as NoteValue;
				transposedBass = '/' + getNoteNameFromValue(newBassValue, preferFlats);
			} else if (bassNote) {
				transposedBass = '/' + bassNote; // Keep original if not recognized
			}

			// Reconstruct the chord
			return `${space}[${newRoot}${quality}${transposedBass}]`;
		});
	};


	// Update the textarea onChange handler
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setInput(newValue);

		// Only update originalInput if this is a user edit (not a transposition)
		if (!isTransposing) {
			setOriginalInput(newValue);
		}
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

					<PrintButton rawContent={input} parseLine={parseLine} />
					</div>
      </div>

      <div className="flex-grow flex">
        <div className="w-1/2 border-r p-4 flex flex-col">
					<Textarea
						value={input}
						onChange={handleInputChange}
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
