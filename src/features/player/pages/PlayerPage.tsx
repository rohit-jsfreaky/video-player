import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { getVideoBySlug, getNextVideo, getVideosByCategorySlug } from '@/features/videos/api/videoService';
import { VideoListPanel } from '../components/VideoListPanel';
import { AutoPlayCountdown } from '../components/AutoPlayCountdown';
import { usePlayer } from '@/app/store/playerStore';
import { Badge } from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';
import type { Video } from '@/features/videos/types/video';

// ─── Player Page ────────────────────────────────────────────────────────────
// Route: /player/:slug
// Full-page video player with:
//   - Custom controls + seek bar
//   - In-player video list panel (Phase 5)
//   - Auto-play countdown on video end (Phase 7)
//   - Minimize button to shrink to mini-player (Phase 6)

const PlayerPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    state: playerStoreState,
    playVideo,
    minimize,
    maximize,
  } = usePlayer();

  const video = useMemo(() => (slug ? getVideoBySlug(slug) : undefined), [slug]);
  const categoryVideos = useMemo(
    () => (video ? getVideosByCategorySlug(video.category.slug) : []),
    [video],
  );
  const nextVideo = useMemo(() => (video ? getNextVideo(video) : undefined), [video]);

  // ── Video List Panel state ────────────────────────────────────────────
  const [isListOpen, setIsListOpen] = useState(false);
  const openList = useCallback(() => setIsListOpen(true), []);
  const closeList = useCallback(() => setIsListOpen(false), []);

  // ── Auto-play countdown ───────────────────────────────────────────────
  const [showCountdown, setShowCountdown] = useState(false);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);

  // When video ends, show countdown
  useEffect(() => {
    if (playerStoreState.playbackState === 'ended' && nextVideo && !autoPlayCancelled) {
      setShowCountdown(true);
    }
  }, [playerStoreState.playbackState, nextVideo, autoPlayCancelled]);

  // Reset auto-play cancel flag on video change
  useEffect(() => {
    setAutoPlayCancelled(false);
    setShowCountdown(false);
  }, [video?.id]);

  const handleAutoPlayComplete = useCallback(() => {
    setShowCountdown(false);
    if (nextVideo) {
      playVideo(nextVideo);
      maximize();
      navigate(`/player/${nextVideo.slug}`, { replace: true });
    }
  }, [nextVideo, navigate, playVideo, maximize]);

  const handleAutoPlayCancel = useCallback(() => {
    setShowCountdown(false);
    setAutoPlayCancelled(true);
  }, []);

  // ── Sync global store when video loads ────────────────────────────────
  useEffect(() => {
    if (!video) return;
    if (playerStoreState.currentVideo?.id !== video.id) {
      playVideo(video);
    }
  }, [video, playVideo, playerStoreState.currentVideo?.id]);

  // ── Minimize handler ──────────────────────────────────────────────────
  const handleMinimize = useCallback(() => {
    minimize();
    navigate('/');
  }, [minimize, navigate]);

  const handleSelectVideo = useCallback(
    (selectedVideo: Video) => {
      playVideo(selectedVideo);
      maximize();
    },
    [playVideo, maximize],
  );

  // ── Not found ─────────────────────────────────────────────────────────
  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-(--color-text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <p className="text-(--color-text-secondary) text-sm">Video not found</p>
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
    <div className="min-h-dvh bg-(--color-bg-primary)">
      {/* ── Video Player ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-black">
        <div className="max-w-5xl mx-auto relative">
          <div className="aspect-video w-full" />
        </div>
      </div>

      {/* Auto-play countdown overlay */}
      {showCountdown && nextVideo && (
        <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
          <div className="max-w-5xl mx-auto aspect-video flex items-center justify-center bg-black/80 pointer-events-auto">
            <AutoPlayCountdown
              seconds={5}
              onComplete={handleAutoPlayComplete}
              onCancel={handleAutoPlayCancel}
              nextTitle={nextVideo.title}
            />
          </div>
        </div>
      )}

      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-3">
        <div className="flex items-center gap-2">
          {/* Back */}
          <button
            onClick={() => {
              minimize();
              navigate('/');
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 text-(--color-text-secondary) hover:bg-white/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Home
          </button>

          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 text-(--color-text-secondary) hover:bg-white/10 transition-colors"
            aria-label="Minimize player"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 13H5M12 7l-7 6 7 6" />
            </svg>
            Minimize
          </button>

          <div className="flex-1" />

          {/* Video list toggle */}
          <button
            onClick={openList}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 text-(--color-text-secondary) hover:bg-white/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            {categoryVideos.length} videos
          </button>
        </div>
      </div>

      {/* ── Video Info ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
        {/* Title */}
        <h1 className="text-lg font-semibold text-(--color-text-primary) leading-snug">
          {video.title}
        </h1>

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-3">
          <Badge label={video.category.name} categorySlug={video.category.slug} size="md" />
          <span className="text-xs text-(--color-text-muted)">{formatDuration(video.duration)}</span>
        </div>

        {/* ── Next Up Preview ──────────────────────────────────────────── */}
        {nextVideo && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-(--color-text-secondary) mb-3">Next up</h2>
            <button
              onClick={() => {
                playVideo(nextVideo);
                maximize();
                navigate(`/player/${nextVideo.slug}`, { replace: true });
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-(--color-bg-secondary) hover:bg-(--color-bg-elevated) transition-colors text-left group"
            >
              <div className="relative w-32 flex-shrink-0 aspect-video rounded-lg overflow-hidden">
                <img
                  src={nextVideo.thumbnailUrl}
                  alt={nextVideo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-medium bg-black/80 text-white rounded">
                  {formatDuration(nextVideo.duration)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-(--color-text-primary) line-clamp-2 leading-snug">
                  {nextVideo.title}
                </p>
                <p className="text-[11px] text-(--color-text-muted) mt-1">Auto-play enabled</p>
              </div>
              <svg className="w-5 h-5 text-(--color-text-muted) flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Related Videos ───────────────────────────────────────────── */}
        {categoryVideos.length > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-(--color-text-secondary)">
                More in {video.category.name}
              </h2>
              <button
                onClick={openList}
                className="text-xs text-(--color-accent) font-medium hover:underline"
              >
                See all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {categoryVideos
                .filter((v) => v.id !== video.id)
                .slice(0, 4)
                .map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => {
                      playVideo(rel);
                      maximize();
                      navigate(`/player/${rel.slug}`, { replace: true });
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-(--color-bg-secondary) hover:bg-(--color-bg-elevated) transition-colors text-left group"
                  >
                    <div className="relative w-28 flex-shrink-0 aspect-video rounded-md overflow-hidden">
                      <img
                        src={rel.thumbnailUrl}
                        alt={rel.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-medium bg-black/80 text-white rounded">
                        {formatDuration(rel.duration)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-(--color-text-primary) line-clamp-2 leading-snug">
                        {rel.title}
                      </p>
                      <p className="text-[11px] text-(--color-text-muted) mt-1">
                        {video.category.name}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Video List Panel (Phase 5) ─────────────────────────────────── */}
      <VideoListPanel
        videos={categoryVideos}
        currentVideo={video}
        isOpen={isListOpen}
        onClose={closeList}
        onSelectVideo={handleSelectVideo}
      />
    </div>
  );
};

export default PlayerPage;
