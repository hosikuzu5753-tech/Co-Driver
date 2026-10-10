// frontend/src/utils/lrcParser.ts

import { LyricLine, ParsedLrc, LrcTags } from '../types/lyrics';

/**
 * Parse an LRC-formatted string into structured LyricLine array and metadata tags.
 * Supports standard [mm:ss.xx] and high-precision [mm:ss.xxx], multiple timestamps per line,
 * and metadata tags ([ti:], [ar:], [al:], [offset:]).
 */
export function parseLrc(lrcText?: string | null): ParsedLrc {
  if (typeof lrcText !== 'string' || !lrcText) {
    return { lines: [], tags: {} };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const tagRegex = /^\[([a-zA-Z]+):(.*)\]$/;

  const tags: LrcTags = {};
  const tempLines: LyricLine[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check metadata tags e.g. [ti:Song Title]
    const tagMatch = trimmed.match(tagRegex);
    if (tagMatch) {
      const key = tagMatch[1].toLowerCase();
      const value = tagMatch[2].trim();
      tags[key] = value;
      continue;
    }

    // Check timestamps
    let match: RegExpExecArray | null;
    const matches: number[] = [];
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        if (match[3].length === 1) {
          ms = parseInt(match[3], 10) * 100;
        } else if (match[3].length === 2) {
          ms = parseInt(match[3], 10) * 10;
        } else {
          ms = parseInt(match[3].slice(0, 3), 10);
        }
      }
      const timeMs = min * 60 * 1000 + sec * 1000 + ms;
      matches.push(timeMs);
    }

    if (matches.length > 0) {
      timeRegex.lastIndex = 0;
      const text = trimmed.replace(timeRegex, '').trim();
      for (let i = 0; i < matches.length; i++) {
        tempLines.push({
          id: `line-${tempLines.length}-${matches[i]}`,
          timeMs: matches[i],
          text,
        });
      }
    }
  }

  // Handle offset tag [offset:+/-ms]
  const offsetMs = tags.offset ? parseInt(tags.offset, 10) || 0 : 0;
  if (offsetMs !== 0) {
    for (let i = 0; i < tempLines.length; i++) {
      tempLines[i].timeMs = Math.max(0, tempLines[i].timeMs + offsetMs);
    }
  }

  // Sort chronologically ascending
  tempLines.sort((a, b) => a.timeMs - b.timeMs);

  return {
    lines: tempLines,
    tags,
  };
}

/**
 * Binary search to find active lyric index from playback time in O(log N).
 * Returns -1 if playback is before the first lyric line.
 * If playback is after the last lyric, returns the last line index.
 */
export function findActiveLyricIndex(lines: LyricLine[], currentMs: number): number {
  if (!lines || lines.length === 0) return -1;
  if (currentMs < lines[0].timeMs) return -1;
  if (currentMs >= lines[lines.length - 1].timeMs) return lines.length - 1;

  let low = 0;
  let high = lines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].timeMs <= currentMs) {
      result = mid; // Candidate line, check if a later line also qualifies
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/**
 * Dead-reckoning position interpolator.
 * Smoothly advances playback position locally between remote WebSocket updates.
 */
export function calculateInterpolatedPosition(
  lastPositionMs: number,
  lastUpdatedTimestamp: number,
  currentTimestamp: number,
  isPlaying: boolean,
  playbackSpeed: number = 1.0,
  durationMs: number = Infinity
): number {
  if (!isPlaying) return lastPositionMs;
  const delta = Math.max(0, currentTimestamp - lastUpdatedTimestamp);
  const interpolated = lastPositionMs + delta * playbackSpeed;
  return Math.min(interpolated, durationMs);
}
