import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// ─── Lazy-loaded page components ────────────────────────────────────────────
// Using lazy imports so page bundles are code-split automatically.

import { lazy } from 'react';

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const PlayerPage = lazy(() => import('@/features/player/pages/PlayerPage'));

// ─── Route Definitions ──────────────────────────────────────────────────────

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'player/:slug',
        element: <PlayerPage />,
      },
    ],
  },
];

// ─── Router Instance ────────────────────────────────────────────────────────

export const router = createBrowserRouter(routes);
