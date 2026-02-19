import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { getVideoBySlug, getRelatedVideos } from '@/features/videos/api/videoService';

// ─── Player Page (Stub — full implementation in Phase 4) ────────────────────
// Route: /player/:slug
// Resolves the video from the URL slug and renders a placeholder.

const PlayerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const video = useMemo(() => (slug ? getVideoBySlug(slug) : undefined), [slug]);
  const relatedCount = useMemo(() => (video ? getRelatedVideos(video).length : 0), [video]);

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 px-4">
        <p className="text-(--color-text-secondary)">Video not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Placeholder for the full video player (Phase 4) */}
      <div className="aspect-video bg-black flex items-center justify-center">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="px-4 pt-4 pb-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-1.5 text-sm text-(--color-text-secondary) hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>

        <h1 className="text-lg font-semibold text-(--color-text-primary) leading-snug">
          {video.title}
        </h1>

        <div className="mt-2 flex items-center gap-3 text-xs text-(--color-text-muted)">
          <span className="px-2 py-0.5 rounded bg-white/10">{video.category.name}</span>
          <span>{relatedCount} related videos</span>
        </div>

        <p className="mt-6 text-sm text-(--color-text-muted)">
          Full player with custom controls will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
};

export default PlayerPage;
