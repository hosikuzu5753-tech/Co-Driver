// frontend/src/types/lyrics.ts

export interface LyricLine {
  id?: string;
  timeMs: number;
  text: string;
}

export interface LrcTags {
  ti?: string;
  ar?: string;
  al?: string;
  by?: string;
  offset?: string;
  length?: string;
  [key: string]: string | undefined;
}

export interface ParsedLrc {
  lines: LyricLine[];
  tags: LrcTags;
}

export type LyricsStatus =
  | 'idle'
  | 'loading'
  | 'synced'
  | 'plain'
  | 'not_found'
  | 'error';

export interface LyricsFetchResult {
  status: LyricsStatus;
  syncedLyrics?: string;
  plainLyrics?: string;
  source?: 'cache' | 'network' | 'mock';
  error?: string;
}
