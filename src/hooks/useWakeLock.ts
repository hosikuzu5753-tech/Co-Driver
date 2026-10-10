// src/hooks/useWakeLock.ts

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  error: Error | null;
  requestLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sentinelRef = useRef<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const requestLock = useCallback(async () => {
    if (!isSupported) return;
    if (sentinelRef.current && !sentinelRef.current.released) return;

    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsLocked(true);
      setError(null);

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        sentinelRef.current = null;
      });
    } catch (err: any) {
      setError(err);
      setIsLocked(false);
    }
  }, [isSupported]);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err: any) {
        setError(err);
      } finally {
        sentinelRef.current = null;
        setIsLocked(false);
      }
    }
  }, []);

  // Auto request on mount and re-request on tab visibility change
  useEffect(() => {
    requestLock();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (!sentinelRef.current || sentinelRef.current.released) {
          await requestLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  return {
    isSupported,
    isLocked,
    error,
    requestLock,
    releaseLock,
  };
}
