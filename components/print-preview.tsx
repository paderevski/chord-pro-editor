import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

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
		let artist = '';
		let key = 0;

    const addCurrentSection = () => {
      if (currentSection && currentSectionContent.length > 0) {
				if (currentSection==='chorus') {
					content.push(`
						<div key=${key++} class='break-inside-avoid-column'>
							<div key=aa${key++} class='border-b text-sm font-bold mb-2 text-gray-600'>Chorus</div>
							<div key=bb${key++} class='pl-2 border-l border-gray-200'>
								${currentSectionContent.join('')}
							</div>
					</div>`
					)
				} else {
					content.push(
						`<div key=${key++} class='break-inside-avoid-column'>
							${currentSectionContent.join('')}
						</div>`
					);
				};
        currentSectionContent = [];
      }
    };

    lines.forEach((line) => {
      if (line.type === 'metadata') {
        if (line.key === 'title') {
          title = line.value;
        } else if (line.key === 'key') {
          songKey = line.value;
				} else if (line.key === 'artist') {
					artist = line.value;
				} else {
					addCurrentSection();
					content.push(
						`<div key=cc${key++} class="border-b border-gray-200 text-xs font-bold mb-1 text-gray-600">${line.value}</div>`
					);
				}
      }
      else if (line.type === 'section_start') {
        addCurrentSection();
        currentSection = line.section;
				if (line.section !== 'chorus') {
					currentSectionContent.push(
						`<div class="border-b text-xs font-bold mb-1 ${line.section === 'chorus' ? 'text-blue-600' : 'text-gray-600'}">
							${line.section.charAt(0).toUpperCase() + line.section.slice(1)}
						</div>`
					);
				}
      }
      else if (line.type === 'section_end') {
        addCurrentSection();
        currentSection = null;
      }
      else if (line.type === 'line') {
        const pairsHtml = line.pairs.map(pair => {
          if (pair.isBarline) {
            return `
              <span class="inline-block w-[1px] bg-gray-600">
                <span class="h-4">&#x200B;</span>
                <span class="h-4">&#x200B;</span>
              </span>
            `;
          }
					if (pair.lyrics) {
						pair.lyrics = pair.lyrics.replaceAll('~', '\u2003')
					}
          return `
            <span class="inline-block align-baseline">
              <span class="block text-blue-600 font-bold text-xs" style="margin-bottom: -0.5em; height: 1.5em">
                ${pair.chord || ''}
              </span>
              <span class="block text-xs">
                ${pair.lyrics || '\u00A0'}
              </span>
            </span>
          `;
        }).join('');

        currentSectionContent.push(`<div>${pairsHtml}</div>`);
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
              margin: 0.25in;
              size: portrait;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
							/* Add these rules for sections */
							.break-inside-avoid-column {
								column-break-inside: avoid;
							}
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.0;
              max-width: 8.5in;
              margin: 0.5in;
              padding: 0.15in 0.5in;
            }
          </style>
        </head>
        <body>
          <div>
            ${title ? `<h1 class="text-2xl font-bold text-center mb-2">${title}</h1>` : ''}
						${artist ? `<h2 class="text-1xl font-bold text-center mb-2">${artist}</h2>` : ''}
            ${songKey ? `<div class="text-center mb-4 text-gray-600">Key: ${songKey}</div>` : ''}
            <div class="space-y-4 columns-2" >
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