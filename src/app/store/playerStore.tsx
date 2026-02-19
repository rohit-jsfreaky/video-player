import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { PlaybackState, Video } from '@/features/videos/types/video';

// ─── State Shape ────────────────────────────────────────────────────────────

interface PlayerStoreState {
  /** Currently loaded video (null = nothing playing) */
  currentVideo: Video | null;
  /** Whether the player is minimized to the mini-player dock */
  isMinimized: boolean;
  /** Playback state machine */
  playbackState: PlaybackState;
  /** Volume level 0–1 */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
}

const INITIAL_STATE: PlayerStoreState = {
  currentVideo: null,
  isMinimized: false,
  playbackState: 'idle',
  volume: 1,
  isMuted: false,
};

// ─── Actions ────────────────────────────────────────────────────────────────

type PlayerAction =
  | { type: 'PLAY_VIDEO'; payload: Video }
  | { type: 'SET_PLAYBACK_STATE'; payload: PlaybackState }
  | { type: 'MINIMIZE' }
  | { type: 'MAXIMIZE' }
  | { type: 'CLOSE_PLAYER' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: number };

// ─── Reducer ────────────────────────────────────────────────────────────────

function playerReducer(state: PlayerStoreState, action: PlayerAction): PlayerStoreState {
  switch (action.type) {
    case 'PLAY_VIDEO':
      return {
        ...state,
        currentVideo: action.payload,
        isMinimized: false,
        playbackState: 'playing',
      };

    case 'SET_PLAYBACK_STATE':
      return {
        ...state,
        playbackState: action.payload,
      };

    case 'MINIMIZE':
      return {
        ...state,
        isMinimized: true,
      };

    case 'MAXIMIZE':
      return {
        ...state,
        isMinimized: false,
      };

    case 'CLOSE_PLAYER':
      return {
        ...INITIAL_STATE,
        volume: state.volume,
        isMuted: state.isMuted,
      };

    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
      };

    case 'SET_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
        isMuted: action.payload === 0,
      };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface PlayerContextValue {
  state: PlayerStoreState;
  dispatch: Dispatch<PlayerAction>;
  /** Convenience: start playing a video (full-screen) */
  playVideo: (video: Video) => void;
  /** Convenience: minimize to dock */
  minimize: () => void;
  /** Convenience: restore from mini-player */
  maximize: () => void;
  /** Convenience: close player entirely */
  closePlayer: () => void;
  /** Convenience: toggle play/pause */
  togglePlayback: () => void;
  /** Whether any video is actively loaded */
  hasVideo: boolean;
  /** Whether playback is in a playing state */
  isPlaying: boolean;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_STATE);

  const playVideo = useCallback(
    (video: Video) => dispatch({ type: 'PLAY_VIDEO', payload: video }),
    [],
  );

  const minimize = useCallback(() => dispatch({ type: 'MINIMIZE' }), []);
  const maximize = useCallback(() => dispatch({ type: 'MAXIMIZE' }), []);
  const closePlayer = useCallback(() => dispatch({ type: 'CLOSE_PLAYER' }), []);

  const togglePlayback = useCallback(() => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: state.playbackState === 'playing' ? 'paused' : 'playing',
    });
  }, [state.playbackState]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      dispatch,
      playVideo,
      minimize,
      maximize,
      closePlayer,
      togglePlayback,
      hasVideo: state.currentVideo !== null,
      isPlaying: state.playbackState === 'playing',
    }),
    [state, playVideo, minimize, maximize, closePlayer, togglePlayback],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within <PlayerProvider>');
  }
  return ctx;
}

// ─── Selector hooks (for reducing re-renders in leaf components) ────────────

export function useCurrentVideo() {
  return usePlayer().state.currentVideo;
}

export function useIsMinimized() {
  return usePlayer().state.isMinimized;
}

export function usePlaybackState() {
  return usePlayer().state.playbackState;
}
