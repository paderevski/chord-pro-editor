import React from 'react';
import { ParsedLine, ChordLyricPairProps } from './types';

interface PrintPreviewProps {
  rawContent: string;
  parseLine: (line: string) => ParsedLine;
}

const PrintableChordLyricPair: React.FC<ChordLyricPairProps> = ({ chord, lyrics, isBarline }) => {
  if (isBarline) {
    return (
      <div className="inline-block align-top mx-1 print:mx-0.5 w-[1px] bg-gray-300">
        <div className="h-5">&#x200B;</div>
        <div className="h-5">&#x200B;</div>
      </div>
    );
  }

  const width = Math.max(chord?.length || 0, lyrics?.length || 0);

  return (
    <div className="inline-block align-top" style={{ minWidth: `${width}ch` }}>
      <div className="h-5 text-blue-600 font-bold overflow-visible whitespace-pre print:text-sm">
        {chord || '\u00A0'}
      </div>
      <div className="whitespace-pre print:text-sm">
        {lyrics || '\u00A0'}
      </div>
    </div>
  );
};

const PrintPreview: React.FC<PrintPreviewProps> = ({ rawContent, parseLine }) => {
  if (!rawContent || typeof rawContent !== 'string') {
    return <div className="p-8 font-mono">No content to display</div>;
  }

  const lines = rawContent.split('\n').map(parseLine);
  const content: React.ReactNode[] = [];
  let currentSection: string | null = null;
  let currentSectionContent: React.ReactNode[] = [];
  let key = 0;
  let title = '';
  let songKey = '';

  const addCurrentSection = () => {
    if (currentSection && currentSectionContent.length > 0) {
      content.push(
        <div
          key={key++}
          className={`mb-6 ${currentSection === 'chorus' ? 'pl-4 border-l-2 border-blue-600' : ''}`}
        >
          {currentSectionContent}
        </div>
      );
      currentSectionContent = [];
    }
  };

  lines.forEach((line) => {
    if (line.type === 'metadata') {
      if (line.key === 'title') {
        title = line.value;
      } else if (line.key === 'key') {
        songKey = line.value;
      }
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
            <PrintableChordLyricPair key={pairIndex} {...pair} />
          ))}
        </div>
      );
    }
  });

  addCurrentSection();

  return (
    <div className="p-8 font-mono max-w-4xl mx-auto">
      {title && (
        <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
      )}
      {songKey && (
        <div className="text-center mb-6 text-gray-600">Key: {songKey}</div>
      )}
      <div className="columns-2 gap-8 print:columns-2 print:gap-6">
        {content}
      </div>
    </div>
  );
};

export default PrintPreview;
