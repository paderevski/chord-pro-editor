import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

// Include types directly in the file
interface ChordLyricPairProps {
  chord?: string;
  lyrics?: string;
  isBarline?: boolean;
}

interface LineMetadata {
  type: 'metadata';
  key: string;
  value: string;
}

interface SectionStart {
  type: 'section_start';
  section: string;
}

interface SectionEnd {
  type: 'section_end';
}

interface LinePairs {
  type: 'line';
  pairs: ChordLyricPairProps[];
}

type ParsedLine = LineMetadata | SectionStart | SectionEnd | LinePairs;

interface PrintPreviewProps {
  rawContent: string;
  parseLine: (line: string) => ParsedLine;
}

export const PrintButton: React.FC<PrintPreviewProps> = ({ rawContent, parseLine }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const lines = rawContent.split('\n').map(parseLine);
    let content: React.ReactNode[] = [];
    let currentSection: string | null = null;
    let currentSectionContent: React.ReactNode[] = [];
    let title = '';
    let songKey = '';

    const addCurrentSection = () => {
      if (currentSection && currentSectionContent.length > 0) {
        content.push(
          `<div class="${currentSection === 'chorus' ? 'border-l-2 border-blue-600 pl-4' : ''} mb-4">
            ${currentSectionContent.join('')}
          </div>`
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
          `<div class="text-sm font-bold mb-1 ${line.section === 'chorus' ? 'text-blue-600' : 'text-gray-600'}">
            ${line.section.charAt(0).toUpperCase() + line.section.slice(1)}:
          </div>`
        );
      }
      else if (line.type === 'section_end') {
        addCurrentSection();
        currentSection = null;
      }
      else if (line.type === 'line') {
        const pairsHtml = line.pairs.map(pair => {
          if (pair.isBarline) {
            return `
              <span class="inline-block mx-1 w-[1px] bg-gray-300">
                <span class="h-4">&#x200B;</span>
                <span class="h-4">&#x200B;</span>
              </span>
            `;
          }

          const width = Math.max(pair.chord?.length || 0, pair.lyrics?.length || 0);
          return `
            <span class="inline-flex flex-col" style="min-width: ${width/4}ch">
              <span class="text-blue-600 font-bold text-sm leading-none">${pair.chord || '\u00A0'}</span>
              <span class="text-sm leading-none">${pair.lyrics || '\u00A0'}</span>
            </span>
          `;
        }).join('');

        currentSectionContent.push(`<div class="mb-2 flex flex-wrap gap-0">${pairsHtml}</div>`);
      }
    });

    addCurrentSection();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Chord Sheet'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              margin: 0.5in;
              size: portrait;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
            body {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              line-height: 1.2;
              max-width: 7in;
              margin: 0 auto;
              padding: 0.5in 0;
            }
          </style>
        </head>
        <body>
          <div>
            ${title ? `<h1 class="text-2xl font-bold text-center mb-2">${title}</h1>` : ''}
            ${songKey ? `<div class="text-center mb-4 text-gray-600">Key: ${songKey}</div>` : ''}
            <div class="space-y-4">
              ${content.join('')}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <Button onClick={handlePrint} className="flex items-center gap-2">
      <Printer className="w-4 h-4" />
      Print
    </Button>
  );
};

export default PrintButton;