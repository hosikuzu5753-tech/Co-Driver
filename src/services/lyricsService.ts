// frontend/src/services/lyricsService.ts

import { LyricsFetchResult } from '../types/lyrics';

const CACHE_STORAGE_KEY = 'codriver_lyrics_cache_v1';
const MAX_CACHE_ENTRIES = 50;
const LRCLIB_BASE_URL = 'https://lrclib.net/api';

interface CacheEntry {
  result: LyricsFetchResult;
  timestamp: number;
}

export class LyricsService {
  private static memoryCache = new Map<string, LyricsFetchResult>();

  /**
   * Cleans track title by removing annotations like "(feat. ...)", "- Remastered", "[Live]", etc.
   * This drastically improves search hit rates on lyric databases.
   */
  public static cleanTrackTitle(title: string): string {
    if (!title) return '';
    let cleaned = title.trim();

    // Remove "(feat. ...)" or "(ft. ...)"
    cleaned = cleaned.replace(/\s*\((?:feat\.|ft\.|featuring)[^)]*\)/gi, '');

    // Remove " - Remastered ...", " - Remaster", " - 2024 Mix", " - Live at ...", etc.
    cleaned = cleaned.replace(/\s*-\s*(?:\d{4}\s*)?(?:remaster(?:ed)?|deluxe|bonus|live|radio edit|mono|stereo|mix|version).*$/gi, '');

    // Remove "[...Remaster...]", "[Live]", etc. in square brackets
    cleaned = cleaned.replace(/\s*\[[^\]]*(?:remaster|live|deluxe|edition|mix|version)[^\]]*\]/gi, '');

    // Remove trailing "(Live)", "(Mono)", "(Stereo)", "(Remastered)"
    cleaned = cleaned.replace(/\s*\((?:remaster(?:ed)?|deluxe|live|mono|stereo|acoustic|anniversary)[^)]*\)/gi, '');

    return cleaned.trim() || title.trim();
  }

  /**
   * Cleans artist name by extracting primary artist if comma- or feat-separated.
   */
  public static cleanArtist(artist: string): string {
    if (!artist) return '';
    let cleaned = artist.trim();
    // Remove "feat. ..." from artist field
    cleaned = cleaned.replace(/\s*(?:feat\.|ft\.|featuring).*$/gi, '');
    return cleaned.trim() || artist.trim();
  }

  /**
   * Generates a normalized cache key.
   */
  public static getCacheKey(track: string, artist: string): string {
    const cTrack = this.cleanTrackTitle(track).toLowerCase();
    const cArtist = this.cleanArtist(artist).toLowerCase();
    return `${cArtist}___${cTrack}`;
  }

  /**
   * Retrieves lyrics result from in-memory cache or localStorage.
   */
  public static getFromCache(track: string, artist: string): LyricsFetchResult | null {
    const key = this.getCacheKey(track, artist);

    // 1. Check in-memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)!;
    }

    // 2. Check localStorage
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const store: Record<string, CacheEntry> = JSON.parse(raw);
        if (store[key] && store[key].result) {
          const res = { ...store[key].result, source: 'cache' as const };
          this.memoryCache.set(key, res);
          return res;
        }
      }
    } catch {
      // Ignore localStorage read failures
    }

    return null;
  }

  /**
   * Saves lyrics result to in-memory cache and localStorage with LRU eviction.
   */
  public static saveToCache(track: string, artist: string, result: LyricsFetchResult): void {
    const key = this.getCacheKey(track, artist);
    this.memoryCache.set(key, result);

    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      let store: Record<string, CacheEntry> = raw ? JSON.parse(raw) : {};

      // Store entry with timestamp
      store[key] = {
        result: { ...result, source: 'cache' },
        timestamp: Date.now(),
      };

      // LRU Eviction if entries exceed MAX_CACHE_ENTRIES
      const entries = Object.entries(store);
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const pruned = Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES));
        store = pruned;
      }

      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore localStorage write failures (e.g. QuotaExceeded)
    }
  }

  /**
   * Fetches lyrics from LRCLIB API with fallbacks and caching.
   */
  public static async fetchLyrics(
    track: string,
    artist: string,
    album?: string,
    durationMs?: number,
    signal?: AbortSignal
  ): Promise<LyricsFetchResult> {
    if (!track || track === '曲名なし') {
      return { status: 'idle' };
    }

    const cleanTrack = this.cleanTrackTitle(track);
    const cleanArtist = this.cleanArtist(artist);

    // 1. Cache hit
    const cached = this.getFromCache(cleanTrack, cleanArtist);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    // 2. Query LRCLIB /api/get (exact match)
    try {
      const params = new URLSearchParams({
        track_name: cleanTrack,
        artist_name: cleanArtist,
      });
      if (album) params.append('album_name', album);
      if (durationMs && durationMs > 0) {
        params.append('duration', String(Math.round(durationMs / 1000)));
      }

      const exactRes = await fetch(`${LRCLIB_BASE_URL}/get?${params.toString()}`, {
        signal,
        headers: {
          'Accept': 'application/json',
          'Lrclib-Client': 'Co-Driver In-Car Infotainment (https://github.com/kesik/Co-Driver)',
        },
      });

      if (exactRes.ok) {
        const data = await exactRes.json();
        const parsed = this.parseLrclibResponse(data);
        this.saveToCache(cleanTrack, cleanArtist, parsed);
        return { ...parsed, source: 'network' };
      }

      // If 404, fallback to search endpoint
      if (exactRes.status === 404) {
        const searchParams = new URLSearchParams({
          track_name: cleanTrack,
        });
        if (cleanArtist) searchParams.append('artist_name', cleanArtist);

        const searchRes = await fetch(`${LRCLIB_BASE_URL}/search?${searchParams.toString()}`, {
          signal,
          headers: {
            'Accept': 'application/json',
            'Lrclib-Client': 'Co-Driver In-Car Infotainment (https://github.com/kesik/Co-Driver)',
          },
        });

        if (searchRes.ok) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            // Find best candidate: preferred with syncedLyrics
            const best = list.find((item: any) => item.syncedLyrics) || list[0];
            const parsed = this.parseLrclibResponse(best);
            this.saveToCache(cleanTrack, cleanArtist, parsed);
            return { ...parsed, source: 'network' };
          }
        }
      }

      const notFoundResult: LyricsFetchResult = {
        status: 'not_found',
        source: 'network',
      };
      this.saveToCache(cleanTrack, cleanArtist, notFoundResult);
      return notFoundResult;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err; // Let caller handle abort
      }
      return {
        status: 'error',
        error: err.message || 'Lyrics request failed',
        source: 'network',
      };
    }
  }

  /**
   * Helper to map LRCLIB JSON payload to LyricsFetchResult.
   */
  public static parseLrclibResponse(data: any): LyricsFetchResult {
    if (!data) return { status: 'not_found' };

    if (data.syncedLyrics && typeof data.syncedLyrics === 'string' && data.syncedLyrics.trim().length > 0) {
      return {
        status: 'synced',
        syncedLyrics: data.syncedLyrics,
        plainLyrics: data.plainLyrics || undefined,
      };
    }

    if (data.plainLyrics && typeof data.plainLyrics === 'string' && data.plainLyrics.trim().length > 0) {
      return {
        status: 'plain',
        plainLyrics: data.plainLyrics,
      };
    }

    return { status: 'not_found' };
  }

  /**
   * Clears in-memory and localStorage lyrics cache.
   */
  public static clearCache(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
