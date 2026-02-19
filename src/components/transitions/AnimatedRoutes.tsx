import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// ─── Route Transition Wrapper ───────────────────────────────────────────────
// Provides CSS-driven enter/exit animations when the route key changes.
// Uses a two-phase approach:
//   1. New route enters (fade+slide in) while old route exits (fade out)
//   2. Old route is removed from the DOM after exit animation completes

interface AnimatedRoutesProps {
  children: ReactNode;
  /** The key that triggers a transition (typically location.pathname) */
  locationKey: string;
}

type Phase = 'idle' | 'entering' | 'exiting';

export function AnimatedRoutes({ children, locationKey }: AnimatedRoutesProps) {
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [displayedKey, setDisplayedKey] = useState(locationKey);
  const [phase, setPhase] = useState<Phase>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTransitionEnd = useCallback(() => {
    if (phase === 'exiting') {
      // Exit finished — swap in the new content
      setDisplayedChildren(children);
      setDisplayedKey(locationKey);
      setPhase('entering');
    } else if (phase === 'entering') {
      setPhase('idle');
    }
  }, [phase, children, locationKey]);

  useEffect(() => {
    if (locationKey !== displayedKey && phase === 'idle') {
      // Route changed — kick off exit animation
      setPhase('exiting');
    }
  }, [locationKey, displayedKey, phase]);

  // If we're in entering phase but children reference is stale, update immediately
  useEffect(() => {
    if (phase === 'entering') {
      // Force a tiny delay so the enter animation class gets applied after DOM swap
      const id = requestAnimationFrame(() => {
        // The entering animation will play via CSS
      });
      return () => cancelAnimationFrame(id);
    }
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'page-transition',
        phase === 'exiting' && 'page-exit',
        phase === 'entering' && 'page-enter',
        phase === 'idle' && 'page-idle',
      )}
      onAnimationEnd={handleTransitionEnd}
    >
      {displayedChildren}
    </div>
  );
}
