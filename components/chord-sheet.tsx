"use client";

interface ChordSheetProps {
  initialContent?: string;
  songKey?: string;
  selectedSongId?: number;
  onSave?: (content: string, key: string) => Promise<void>;
}

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
    if (contentLower === 'start_of_bridge' || contentLower === 'sob') {
      return { type: 'section_start', section: 'bridge' };
		}
    if (contentLower === 'start_of_intro' || contentLower === 'soi') {
      return { type: 'section_start', section: 'intro' };
    }
    if (contentLower === 'start_of_outro' || contentLower === 'soo') {
      return { type: 'section_start', section: 'outro' };
    }
		if (contentLower === 'solo' || contentLower === 's') {
      return { type: 'section_start', section: 'solo' };
    }
		if (contentLower === 'bridge' || contentLower === 'b') {
      return { type: 'section_start', section: 'bridge' };
    }
    if (contentLower === 'end_of_verse' || contentLower === 'eov' ||
        contentLower === 'end_of_chorus' || contentLower === 'eoc'  ||
        contentLower === 'end_of_bridge' || contentLower === 'eob' ||
        contentLower === 'end_of_intro' || contentLower === 'eoi' ||
        contentLower === 'end_of_outro' || contentLower === 'eoo' ||
        contentLower === 'end') {
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
      if (buffer.trim() || currentChord) {
        pairs.push({ chord: currentChord, lyrics: buffer.trim() });
        currentChord = '';
        buffer = '';
      }
      pairs.push({ isBarline: true });
      // Skip any whitespace after the barline
      while (i + 1 < line.length && line[i + 1].trim() === '') {
        i++;
      }
      continue;
    }

    // Skip whitespace before barline
    if (char.trim() === '' && i + 1 < line.length && line[i + 1] === '|') {
      continue;
    }

    if (char === '[') {
      if (buffer.trim() && !currentChord) {
        pairs.push({ chord: '', lyrics: buffer.trim() });
        buffer = '';
      }
      else if (buffer.trim() && currentChord) {
        pairs.push({ chord: currentChord, lyrics: buffer.trim() });
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

  if (buffer.trim() || currentChord) {
    pairs.push({ chord: currentChord, lyrics: buffer.trim() });
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
	if (lyrics) {
		lyrics = lyrics.replaceAll('~', '\u2003')
	}
  return (
    <div className="inline-block align-top mx-1" style={{ minWidth: `${width/4		}ch` }}>
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
const ChordSheet = ({ initialContent, songKey, selectedSongId, onSave }: ChordSheetProps) => {
  const [input, setInput] = useState(initialContent || `{title: I Feel Lucky}...`);
  const [originalInput, setOriginalInput] = useState(input);
  const [fromKey, setFromKey] = useState(songKey || 'C');
  const [toKey, setToKey] = useState(songKey || 'C');
  const [isTransposing, setIsTransposing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Add effect to update content when selected song changes
  useEffect(() => {
    if (initialContent !== undefined) {
      setInput(initialContent);
      setOriginalInput(initialContent);
    }
  }, [initialContent]);

  // Add effect to update key when selected song changes
  useEffect(() => {
    if (songKey) {
      setFromKey(songKey);
      setToKey(songKey);
    }
  }, [songKey]);

	// Add debounced auto-save (should fix or remove)
  useEffect(() => {
    if (!selectedSongId || !onSave || isTransposing) return;

    // setSaveStatus('unsaved');
		// console.log("unsaved1");
    const timeoutId = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await onSave(input, toKey);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setSaveStatus('unsaved');
      }
    }, 60000); // Auto-save after 1000 seconds of no changes

    return () => clearTimeout(timeoutId);
  }, [input, toKey, selectedSongId, onSave, isTransposing]);

  // Add save button handler
  const handleManualSave = async () => {
    if (!selectedSongId || !onSave) return;

    try {
      setSaveStatus('saving');
      await onSave(input, toKey);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('unsaved');
    }
  };
  const renderContent = () => {
    const lines = input.split('\n').map(parseLine);
    const content: React.JSX.Element[] = [];
    let currentSection: string | null | undefined = null;
    let currentSectionContent: React.JSX.Element[] = [];
    let key = 0;

    const addCurrentSection = () => {
      if (currentSection && currentSectionContent.length > 0) {
				if (currentSection==='chorus') {
					content.push(
						<div key={key++}>
							<div key={key++} className='text-sm font-bold mb-2 text-gray-600'>Chorus:</div>
							<div key={key++} className='pl-2 mb-4 border-l border-blue-600'>
								{currentSectionContent}
							</div>
					</div>
					)
				} else {
					content.push(
						<div key={key++} className='mb-8'>
							{currentSectionContent}
						</div>
					);
				};
        currentSectionContent = [];
      }
    };

    lines.forEach((line) => {
				if (line.type === 'metadata') {
					addCurrentSection();
					content.push(
						<div key={key++} className="border border-gray-600 text-sm font-bold mb-2">{line.value}</div>
					);
				}
      else if (line.type === 'section_start') {
        addCurrentSection();
        currentSection = line.section;
				if (line.section !== 'chorus') {
					currentSectionContent.push(
						<div key={key++} className={`text-sm font-bold mb-2 ${line.section === 'chorus' ? 'text-blue-600' : 'text-gray-600'}`}>
							{line.section.charAt(0).toUpperCase() + line.section.slice(1)}
						</div>
					);
				}

      }
      else if (line.type === 'section_end') {
        addCurrentSection();
        currentSection = null;
      }
      else if (line.pairs && line.type === 'line') {
        currentSectionContent.push(
          <div key={key++} className="mb">
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

		setSaveStatus('unsaved');
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
					{selectedSongId && (
						<div className="flex items-center gap-2">
							<span className={`text-sm ${
								saveStatus === 'saved' ? 'text-green-600' :
								saveStatus === 'saving' ? 'text-blue-600' :
								'text-orange-600'
							}`}>
								{saveStatus === 'saved' && '✓ All changes saved'}
								{saveStatus === 'saving' && '💾 Saving...'}
								{saveStatus === 'unsaved' && '● Unsaved changes'}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={handleManualSave}
								disabled={saveStatus === 'saving' || !selectedSongId}
							>
								Save
							</Button>
						</div>
					)}
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

			<div className="flex-grow flex overflow-y-auto">
				{/* Left panel with TextArea */}
				<div className="w-1/2 border-r p-4 flex flex-col">
					<Textarea
						value={input}
						onChange={handleInputChange}
						className="flex-grow font-mono resize-none"
						placeholder="Enter ChordPro format text..."
					/>
				</div>

				{/* Right panel with rendered content */}
				<div className="w-1/2 p-4 overflow-y-auto">
					<div className="h-full">
						<div className="max-w-3xl mx-auto">
							{content}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ChordSheet;
