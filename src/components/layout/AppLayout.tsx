import { Suspense } from 'react';
import { usePlayer } from '@/app/store/playerStore';
import { AppRoutes } from '@/app/router';
import { MiniPlayer } from '@/features/player/components/MiniPlayer';
import { cn } from '@/lib/utils';

// ─── Loading Fallback ───────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="text-sm text-(--color-text-muted)">Loading...</span>
      </div>
    </div>
  );
}

// ─── App Layout ─────────────────────────────────────────────────────────────
// Root layout wrapper.
// Handles:
//   - Suspense boundary for lazy-loaded pages
//   - Bottom padding when mini-player is visible
//   - Slot for the mini-player dock (Phase 6)

export function AppLayout() {
  const { hasVideo, state } = usePlayer();
  const showMiniPlayerSpace = hasVideo && state.isMinimized;

  return (
    <div className="relative flex flex-col min-h-dvh bg-(--color-bg-primary)">
      {/* ── Main scrollable content ────────────────────────────────────── */}
      <main
        className={cn(
          'flex-1',
          showMiniPlayerSpace && 'pb-[calc(var(--mini-player-height)+var(--safe-area-bottom)+8px)]',
        )}
      >
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </main>

      {/* ── Mini-player dock ──────────────────────────────────────────── */}
      <MiniPlayer />
    </div>
  );
}
