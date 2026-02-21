import { useCallback, useRef, type PointerEvent } from 'react';
import { cn, formatDuration, calcPercent } from '@/lib/utils';

// ─── SeekBar Component ──────────────────────────────────────────────────────
// A touch/mouse-draggable progress bar showing:
//   - Buffered region (white/10)
//   - Played region (accent red)
//   - Drag handle (white circle)
// Supports pointer events for unified touch+mouse.

interface SeekBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function SeekBar({ currentTime, duration, buffered, onSeek, className }: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const playedPercent = calcPercent(currentTime, duration);
  const bufferedPercent = calcPercent(buffered * duration, duration);

  // ── Convert pointer position to time ──────────────────────────────────
  const getTimeFromPointer = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || !duration) return 0;

      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return fraction * duration;
    },
    [duration],
  );

  // ── Pointer handlers ──────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      onSeek(getTimeFromPointer(e.clientX));
    },
    [getTimeFromPointer, onSeek],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      onSeek(getTimeFromPointer(e.clientX));
    },
    [getTimeFromPointer, onSeek],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* ── Time labels ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-medium text-white/80 tabular-nums">
          {formatDuration(currentTime)}
        </span>
        <span className="text-[11px] font-medium text-white/50 tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      {/* ── Track ───────────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer touch-none group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Seek bar"
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/15 group-hover:h-1.5 transition-all duration-150" />

        {/* Buffered region */}
        <div
          className="absolute left-0 h-1 rounded-full bg-white/25 group-hover:h-1.5 transition-all duration-150"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Played region */}
        <div
          className="absolute left-0 h-1 rounded-full bg-(--color-accent) group-hover:h-1.5 transition-all duration-150"
          style={{ width: `${playedPercent}%` }}
        />

        {/* Drag handle */}
        <div
          className="
            absolute top-1/2 -translate-y-1/2
            w-3.5 h-3.5 rounded-full bg-white
            shadow-md shadow-black/30
            scale-0 group-hover:scale-100
            transition-transform duration-150
            pointer-events-none
          "
          style={{ left: `calc(${playedPercent}% - 7px)` }}
        />
      </div>
    </div>
  );
}
