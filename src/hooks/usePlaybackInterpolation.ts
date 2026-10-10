// frontend/src/hooks/usePlaybackInterpolation.ts

import { useState, useEffect, useRef } from 'react';
import { MediaStatePayload } from '../types/protocol';
import { calculateInterpolatedPosition } from '../utils/lrcParser';

export function usePlaybackInterpolation(mediaState: MediaStatePayload): number {
  const [currentMs, setCurrentMs] = useState<number>(mediaState.positionMs || 0);

  const lastPosRef = useRef<number>(mediaState.positionMs || 0);
  const lastTimeRef = useRef<number>(Date.now());
  const isPlayingRef = useRef<boolean>(mediaState.isPlaying);
  const speedRef = useRef<number>(mediaState.playbackSpeed || 1.0);
  const durationRef = useRef<number>(mediaState.durationMs || 180000);

  // Sync state whenever mediaState payload updates from server or simulator
  useEffect(() => {
    lastPosRef.current = mediaState.positionMs || 0;
    lastTimeRef.current = Date.now();
    isPlayingRef.current = mediaState.isPlaying;
    speedRef.current = mediaState.playbackSpeed || 1.0;
    durationRef.current = mediaState.durationMs || 180000;
    setCurrentMs(mediaState.positionMs || 0);
  }, [
    mediaState.positionMs,
    mediaState.isPlaying,
    mediaState.playbackSpeed,
    mediaState.durationMs,
    mediaState.track,
  ]);

  // Interpolation timer loop (approx 50ms interval ~ 20fps for optimal battery & smooth text)
  useEffect(() => {
    if (!mediaState.isPlaying) {
      setCurrentMs(mediaState.positionMs || 0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const interpolated = calculateInterpolatedPosition(
        lastPosRef.current,
        lastTimeRef.current,
        now,
        isPlayingRef.current,
        speedRef.current,
        durationRef.current
      );
      setCurrentMs(Math.floor(interpolated));
    }, 50);

    return () => clearInterval(interval);
  }, [mediaState.isPlaying]);

  return currentMs;
}
