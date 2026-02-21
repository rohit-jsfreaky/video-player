import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { getVideoBySlug, getNextVideo, getVideosByCategorySlug } from '@/features/videos/api/videoService';
import { VideoPlayer } from '../components/VideoPlayer';
import { VideoListPanel } from '../components/VideoListPanel';
import { AutoPlayCountdown } from '../components/AutoPlayCountdown';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
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
    dispatch,
    playVideo,
    minimize,
    setPlaybackState,
    setPlaybackProgress,
  } = usePlayer();
  const isSurfaceTransitionRef = useRef(false);

  const video = useMemo(() => (slug ? getVideoBySlug(slug) : undefined), [slug]);
  const categoryVideos = useMemo(
    () => (video ? getVideosByCategorySlug(video.category.slug) : []),
    [video],
  );
  const nextVideo = useMemo(() => (video ? getNextVideo(video) : undefined), [video]);

  const isRestoringCurrentVideoSession = useMemo(
    () => Boolean(video && playerStoreState.currentVideo?.id === video.id),
    [video, playerStoreState.currentVideo?.id],
  );

  const player = useVideoPlayer({
    video: video ?? null,
    autoPlay: true,
    initialTime: isRestoringCurrentVideoSession ? playerStoreState.currentTime : 0,
    initialDuration: isRestoringCurrentVideoSession ? playerStoreState.duration : 0,
    initialBuffered: isRestoringCurrentVideoSession ? playerStoreState.buffered : 0,
    initialVolume: playerStoreState.volume,
    initialMuted: playerStoreState.isMuted,
    initialIsPlaying: isRestoringCurrentVideoSession
      ? playerStoreState.playbackState === 'playing'
      : true,
  });

  // ── Video List Panel state ────────────────────────────────────────────
  const [isListOpen, setIsListOpen] = useState(false);
  const openList = useCallback(() => setIsListOpen(true), []);
  const closeList = useCallback(() => setIsListOpen(false), []);

  // ── Auto-play countdown ───────────────────────────────────────────────
  const [showCountdown, setShowCountdown] = useState(false);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);

  // When video ends, show countdown
  useEffect(() => {
    if (player.state.hasEnded && nextVideo && !autoPlayCancelled) {
      setShowCountdown(true);
    }
  }, [player.state.hasEnded, nextVideo, autoPlayCancelled]);

  // Reset auto-play cancel flag on video change
  useEffect(() => {
    setAutoPlayCancelled(false);
    setShowCountdown(false);
  }, [video?.id]);

  const handleAutoPlayComplete = useCallback(() => {
    setShowCountdown(false);
    if (nextVideo) {
      navigate(`/player/${nextVideo.slug}`, { replace: true });
    }
  }, [nextVideo, navigate]);

  const handleAutoPlayCancel = useCallback(() => {
    setShowCountdown(false);
    setAutoPlayCancelled(true);
  }, []);

  // ── Sync global store when video loads ────────────────────────────────
  useEffect(() => {
    if (video) {
      playVideo(video);
    }
  }, [video, playVideo]);

  // ── Persist playback session so minimize/maximize can resume ──────────
  useEffect(() => {
    setPlaybackProgress({
      currentTime: player.state.currentTime,
      duration: player.state.duration,
      buffered: player.state.buffered,
      isBuffering: player.state.isBuffering,
    });
  }, [
    player.state.currentTime,
    player.state.duration,
    player.state.buffered,
    player.state.isBuffering,
    setPlaybackProgress,
  ]);

  useEffect(() => {
    if (isSurfaceTransitionRef.current && !player.state.isPlaying && !player.state.hasEnded) {
      return;
    }

    if (player.state.hasEnded) {
      setPlaybackState('ended');
      return;
    }
    if (player.state.isBuffering) {
      setPlaybackState('buffering');
      return;
    }
    setPlaybackState(player.state.isPlaying ? 'playing' : 'paused');
  }, [player.state.hasEnded, player.state.isBuffering, player.state.isPlaying, setPlaybackState]);

  useEffect(() => {
    dispatch({ type: 'SET_PIP_SUPPORTED', payload: player.state.canPiP });
    dispatch({ type: 'SET_PIP_ACTIVE', payload: player.state.isPiPActive });
  }, [dispatch, player.state.canPiP, player.state.isPiPActive]);

  useEffect(() => {
    if (playerStoreState.isMuted !== player.state.isMuted) {
      dispatch({ type: 'SET_MUTED', payload: player.state.isMuted });
    }
    if (Math.abs(playerStoreState.volume - player.state.volume) > 0.001) {
      dispatch({ type: 'SET_VOLUME', payload: player.state.volume });
    }
  }, [
    dispatch,
    playerStoreState.isMuted,
    playerStoreState.volume,
    player.state.isMuted,
    player.state.volume,
  ]);

  // ── Minimize handler ──────────────────────────────────────────────────
  const handleMinimize = useCallback(() => {
    isSurfaceTransitionRef.current = true;
    setPlaybackProgress({
      currentTime: player.playerRef.current?.currentTime ?? player.state.currentTime,
      duration: player.playerRef.current?.duration || player.state.duration,
      buffered: player.state.buffered,
      isBuffering: false,
    });
    setPlaybackState('playing');
    minimize();
    navigate('/', { replace: false });
  }, [minimize, navigate, player.playerRef, player.state.currentTime, player.state.duration, player.state.buffered, setPlaybackProgress, setPlaybackState]);

  const handleSelectVideo = useCallback(
    (_video: Video) => {
      // Navigation happens inside VideoListPanel
    },
    [],
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
          <VideoPlayer video={video} player={player} onDragDown={handleMinimize} />

          {/* Auto-play countdown overlay */}
          {showCountdown && nextVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
              <AutoPlayCountdown
                seconds={5}
                onComplete={handleAutoPlayComplete}
                onCancel={handleAutoPlayCancel}
                nextTitle={nextVideo.title}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-3">
        <div className="flex items-center gap-2">
          {/* Back */}
          <button
            onClick={() => navigate('/')}
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
              onClick={() => navigate(`/player/${nextVideo.slug}`, { replace: true })}
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
                    onClick={() => navigate(`/player/${rel.slug}`, { replace: true })}
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
