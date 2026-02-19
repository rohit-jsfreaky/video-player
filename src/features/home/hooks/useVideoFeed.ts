import { useMemo } from 'react';
import { getVideosByCategory } from '@/features/videos/api/videoService';
import type { VideoCategory } from '@/features/videos/types/video';

// ─── useVideoFeed ───────────────────────────────────────────────────────────
// Provides the grouped video data for the home feed.
// Memoized so the grouping computation doesn't re-run on every render.

interface UseVideoFeedReturn {
  /** Videos grouped by category, ready for rendering */
  categories: VideoCategory[];
  /** Total number of videos across all categories */
  totalCount: number;
  /** Whether data is available */
  isEmpty: boolean;
}

export function useVideoFeed(): UseVideoFeedReturn {
  const categories = useMemo(() => getVideosByCategory(), []);

  const totalCount = useMemo(
    () => categories.reduce((sum, cat) => sum + cat.contents.length, 0),
    [categories],
  );

  return {
    categories,
    totalCount,
    isEmpty: totalCount === 0,
  };
}
