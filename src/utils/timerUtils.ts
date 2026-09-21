/**
 * Real-time Order Count-Up Timer & Duration Formatter Utilities
 * Accurately tracks processing elapsed times in hours, minutes, and seconds.
 */

/**
 * Calculates elapsed seconds between a creation timestamp and current/target time.
 */
export function getElapsedSeconds(startTime: string | number | Date, endTime?: string | number | Date): number {
  if (!startTime) return 0;
  const startMs = typeof startTime === 'number' ? startTime : new Date(startTime).getTime();
  if (isNaN(startMs)) return 0;
  
  const endMs = endTime 
    ? (typeof endTime === 'number' ? endTime : new Date(endTime).getTime())
    : Date.now();

  const diffMs = Math.max(0, endMs - startMs);
  return Math.floor(diffMs / 1000);
}

/**
 * Formats total seconds into standard HH:MM:SS timer format (e.g., 00:04:23 or 01:15:08).
 */
export function formatTimerHHMMSS(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats total seconds into human-readable duration (e.g., "4m 23s" or "1h 15m 08s").
 */
export function formatDurationReadable(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
