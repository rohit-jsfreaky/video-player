import type { Category, Video, VideoCategory } from '../types/video';
import { ALL_VIDEOS, CATEGORIES, VIDEO_CATEGORIES } from '../data/videos';

// ─── Query Functions ────────────────────────────────────────────────────────

/** Get all videos across every category */
export function getAllVideos(): Video[] {
  return ALL_VIDEOS;
}

/** Get all available categories */
export function getCategories(): Category[] {
  return CATEGORIES;
}

/** Get videos grouped by category (ready for the home feed) */
export function getVideosByCategory(): VideoCategory[] {
  return VIDEO_CATEGORIES;
}

/** Get all videos belonging to a specific category slug */
export function getVideosByCategorySlug(slug: string): Video[] {
  return ALL_VIDEOS.filter((v) => v.category.slug === slug);
}

/** Find a single video by its slug (YouTube video ID) */
export function getVideoBySlug(slug: string): Video | undefined {
  return ALL_VIDEOS.find((v) => v.slug === slug);
}

/** Find a single video by its internal ID */
export function getVideoById(id: string): Video | undefined {
  return ALL_VIDEOS.find((v) => v.id === id);
}

/**
 * Get related videos — same category, excluding the current video.
 * Useful for the in-player video list.
 */
export function getRelatedVideos(video: Video): Video[] {
  return ALL_VIDEOS.filter(
    (v) => v.category.slug === video.category.slug && v.id !== video.id,
  );
}

/**
 * Get the next video in the same category (for auto-play).
 * Returns the first video in the category if current is last.
 */
export function getNextVideo(video: Video): Video | undefined {
  const categoryVideos = getVideosByCategorySlug(video.category.slug);
  const currentIndex = categoryVideos.findIndex((v) => v.id === video.id);

  if (currentIndex === -1) return categoryVideos[0];

  const nextIndex = (currentIndex + 1) % categoryVideos.length;
  return categoryVideos[nextIndex];
}

/** Get a category by its slug */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Total video count */
export function getVideoCount(): number {
  return ALL_VIDEOS.length;
}
