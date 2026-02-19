// ─── Class Name Utility ─────────────────────────────────────────────────────

/**
 * Merge CSS class names, filtering out falsy values.
 * Lightweight alternative to `clsx` / `classnames`.
 *
 * Usage: cn('base', isActive && 'active', isHidden && 'hidden')
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Time Formatting ────────────────────────────────────────────────────────

/**
 * Format seconds into MM:SS or H:MM:SS string.
 * e.g. 125 → "2:05", 3661 → "1:01:01"
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const paddedS = s.toString().padStart(2, '0');

  if (h > 0) {
    const paddedM = m.toString().padStart(2, '0');
    return `${h}:${paddedM}:${paddedS}`;
  }

  return `${m}:${paddedS}`;
}

// ─── YouTube Helpers ────────────────────────────────────────────────────────

/**
 * Extract the YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/v/
 */
export function getYoutubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Build a YouTube watch URL from a video ID.
 */
export function buildYoutubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get YouTube thumbnail URL at the specified quality.
 */
export function getYoutubeThumbnail(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault',
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// ─── Percentage / Progress ──────────────────────────────────────────────────

/**
 * Calculate percentage, clamped between 0 and 100.
 */
export function calcPercent(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
}

// ─── Debounce ───────────────────────────────────────────────────────────────

/**
 * Simple debounce utility.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ─── Clamp ──────────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
