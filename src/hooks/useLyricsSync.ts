// frontend/src/hooks/useLyricsSync.ts

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LyricLine } from '../types/lyrics';
import { findActiveLyricIndex } from '../utils/lrcParser';

interface UseLyricsSyncProps {
  lines: LyricLine[];
  currentMs: number;
}

export function useLyricsSync({ lines, currentMs }: UseLyricsSyncProps) {
  const activeIndex = useMemo(() => findActiveLyricIndex(lines, currentMs), [lines, currentMs]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll active line to center
  const scrollToActive = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      const lineEl = lineRefs.current[index];

      if (!container || !lineEl) return;

      const lineCenter = lineEl.offsetTop + lineEl.clientHeight / 2;
      const targetScrollTop = Math.max(0, lineCenter - container.clientHeight / 2);

      container.scrollTo({
        top: targetScrollTop,
        behavior,
      });
    },
    []
  );

  // Manual scroll detection: pause auto-centering for 4000ms
  const handleInteraction = useCallback(() => {
    isInteractingRef.current = true;
    setIsUserInteracting(true);

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      setIsUserInteracting(false);
      // Auto-resume scroll to currently active line
      if (activeIndex >= 0) {
        scrollToActive(activeIndex, 'smooth');
      }
    }, 4000);
  }, [activeIndex, scrollToActive]);

  // Resume sync manually (tap resume button)
  const resumeSync = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isInteractingRef.current = false;
    setIsUserInteracting(false);

    if (activeIndex >= 0) {
      scrollToActive(activeIndex, 'smooth');
    }
  }, [activeIndex, scrollToActive]);

  // Auto-scroll on activeIndex change if user is not manually interacting
  useEffect(() => {
    if (!isInteractingRef.current && activeIndex >= 0) {
      scrollToActive(activeIndex, 'smooth');
    }
  }, [activeIndex, scrollToActive]);

  // Attach touch & wheel listeners to lyrics scroll container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const events = ['touchstart', 'touchmove', 'wheel', 'pointerdown'];
    events.forEach((ev) => {
      container.addEventListener(ev, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach((ev) => {
        container.removeEventListener(ev, handleInteraction);
      });
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, [handleInteraction]);

  return {
    activeIndex,
    isUserInteracting,
    resumeSync,
    containerRef,
    lineRefs,
    scrollToActive,
  };
}
