import { lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatedRoutes } from '@/components/transitions/AnimatedRoutes';

// ─── Lazy-loaded page components ────────────────────────────────────────────

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const PlayerPage = lazy(() => import('@/features/player/pages/PlayerPage'));

// ─── Animated Route Tree ────────────────────────────────────────────────────
// Wrapped in AnimatedRoutes to enable CSS-based enter/exit transitions
// when navigating between the home feed and the player page.

export function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatedRoutes locationKey={location.pathname}>
      <Routes location={location}>
        <Route index element={<HomePage />} />
        <Route path="player/:slug" element={<PlayerPage />} />
      </Routes>
    </AnimatedRoutes>
  );
}
