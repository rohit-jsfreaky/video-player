import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Auto-Play Countdown ────────────────────────────────────────────────────
// Shows a circular countdown timer when a video ends.
// Auto-triggers navigation to the next video after the countdown.

interface AutoPlayCountdownProps {
  /** Seconds to count down */
  seconds?: number;
  /** Fires when countdown completes */
  onComplete: () => void;
  /** Fires when user cancels */
  onCancel: () => void;
  /** The title of the next video */
  nextTitle?: string;
  className?: string;
}

export function AutoPlayCountdown({
  seconds = 5,
  onComplete,
  onCancel,
  nextTitle,
  className,
}: AutoPlayCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);
  const hasCompletedRef = useRef(false);

  // Keep callbacks in refs so the timer interval never resets
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Reset countdown whenever configured duration changes
  useEffect(() => {
    setRemaining(seconds);
    hasCompletedRef.current = false;
    console.log('[autoplay-countdown] reset', { seconds });
  }, [seconds]);

  // Countdown timer — only depends on `remaining`, never on callback identity
  useEffect(() => {
    if (remaining <= 0) {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      console.log('[autoplay-countdown] complete');
      onCompleteRef.current();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  // SVG ring animation
  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (remaining / seconds);

  return (
    <div className={cn(
      'flex flex-col items-center gap-3 p-4',
      className,
    )}>
      {/* Countdown ring */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2.5"
          />
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="text-lg font-bold text-white tabular-nums">{remaining}</span>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs text-(--color-text-muted)">Up next</p>
        {nextTitle && (
          <p className="text-sm font-medium text-(--color-text-primary) mt-1 line-clamp-1 max-w-[200px]">
            {nextTitle}
          </p>
        )}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="px-4 py-1.5 text-xs font-medium rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
