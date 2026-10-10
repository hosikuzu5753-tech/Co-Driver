// frontend/src/utils/formatTime.ts

/**
 * Format milliseconds into MM:SS format.
 * Returns "00:00" for negative or non-finite inputs.
 */
export function formatTimeMs(ms: number): string {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0 || !isFinite(ms)) {
    return '00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${mm}:${ss}`;
}
