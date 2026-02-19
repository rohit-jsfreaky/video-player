// ─── Core Video & Category Types ────────────────────────────────────────────

export interface Category {
  slug: string;
  name: string;
  iconUrl: string;
}

export interface Video {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'YOUTUBE';
  thumbnailUrl: string;
  slug: string;
  category: Category;
  /** Duration in seconds (estimated for YouTube videos) */
  duration: number;
}

export interface VideoCategory {
  category: Category;
  contents: Video[];
}

// ─── Raw API / Dataset shapes ───────────────────────────────────────────────

export interface RawContent {
  title: string;
  mediaUrl: string;
  mediaType: 'YOUTUBE';
  thumbnailUrl: string;
  slug: string;
}

export interface RawCategoryGroup {
  category: Category;
  contents: RawContent[];
}

export interface RawDataset {
  categories: RawCategoryGroup[];
}

// ─── Player-related types ───────────────────────────────────────────────────

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering' | 'ended';

export interface PlayerState {
  currentVideo: Video | null;
  isMinimized: boolean;
  isPlaying: boolean;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
}
