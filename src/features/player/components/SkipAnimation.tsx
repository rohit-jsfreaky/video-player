import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Skip Animation Overlay ─────────────────────────────────────────────────
// Shows a ripple + arrow animation when user taps ±10s skip buttons.
// Double-tap left/right side also triggers it.

interface SkipAnimationProps {
  direction: 'forward' | 'backward' | null;
  /** Incremented to retrigger animation for the same direction */
  triggerKey: number;
}

export function SkipAnimation({ direction, triggerKey }: SkipAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (direction && triggerKey > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [direction, triggerKey]);

  if (!visible || !direction) return null;

  const isForward = direction === 'forward';

  return (
    <div
      className={cn(
        'absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center',
        isForward ? 'right-0 w-1/3' : 'left-0 w-1/3',
      )}
    >
      {/* Ripple */}
      <div className={cn(
        'absolute w-20 h-20 rounded-full bg-white/10',
        'animate-skip-ripple',
      )} />

      {/* Arrow + text */}
      <div className="flex flex-col items-center gap-1 animate-fade-in">
        <svg
          className={cn('w-8 h-8 text-white', !isForward && 'scale-x-[-1]')}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="sans-serif">10</text>
        </svg>
        <span className="text-xs font-semibold text-white/90">
          {isForward ? '+10s' : '-10s'}
        </span>
      </div>
    </div>
  );
}
