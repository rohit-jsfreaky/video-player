import type { ReactNode } from 'react';
import { PlayerProvider } from '@/app/store/playerStore';

// ─── Root Provider Stack ────────────────────────────────────────────────────
// Composes all application-level providers in the correct nesting order.
// Add new providers here as needed (e.g. ThemeProvider, QueryClientProvider).

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  );
}
