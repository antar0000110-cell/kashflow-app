/**
 * Real-time Cairo Timezone Utility (Africa/Cairo)
 * Handles Egypt Real-Time Clock, formatting, and auto-SLA calculations.
 */

export function getCairoDate(): Date {
  // Returns current date in Cairo timezone context
  const now = new Date();
  return now;
}

export function formatCairoTime(dateInput?: string | Date | number): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d).replace(',', '');
  } catch {
    return String(dateInput);
  }
}

export function formatCairoTimeString(dateInput?: string | Date | number): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

export function getCairoCurrentTimeString(): string {
  return formatCairoTime(new Date());
}

export function getElapsedMinutes(dateInput: string | Date): number {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const diffMs = Date.now() - d.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  } catch {
    return 0;
  }
}

export function getRemainingSlaSeconds(expiresAt: string | Date): number {
  try {
    const d = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const diffSec = Math.floor((d.getTime() - Date.now()) / 1000);
    return Math.max(0, diffSec);
  } catch {
    return 0;
  }
}

export function formatSecondsToCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00 (EXPIRED)';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getElapsedSeconds(startDate: string | Date | number, endDate: string | Date | number = new Date()): number {
  try {
    const start = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  } catch {
    return 0;
  }
}

export function formatTimerHHMMSS(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return '00h 00m 00s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}
