export interface ChordLyricPairProps {
  chord?: string;
  lyrics?: string;
  isBarline?: boolean;
}

export interface LineMetadata {
  type: 'metadata';
  key: string;
  value: string;
}

export interface SectionStart {
  type: 'section_start';
  section: string;
}

export interface SectionEnd {
  type: 'section_end';
}

export interface LinePairs {
  type: 'line';
  pairs: ChordLyricPairProps[];
}

export type ParsedLine = LineMetadata | SectionStart | SectionEnd | LinePairs;
