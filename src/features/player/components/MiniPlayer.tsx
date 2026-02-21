import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/app/store/playerStore';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { VideoPlayer } from './VideoPlayer';
import { cn } from '@/lib/utils';

const MINI_SOURCE_WIDTH = 320;
const MINI_SOURCE_HEIGHT = 180;
const MINI_SCALE = 0.2; // 320x180 -> 64x36 (w-16 aspect-video)

// Global single-instance player surface.
// This component is always mounted in AppLayout and switches between:
// - Full player shell on /player/:slug
// - Mini-player dock on home/feed
export const MiniPlayer = memo(function MiniPlayer() {
  const {
    state,
    dispatch,
    minimize,
    maximize,
    closePlayer,
    setPlaybackState,
    setPlaybackProgress,
    hasVideo,
  } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentVideo, isMinimized } = state;
  const isPlayerRoute = location.pathname.startsWith('/player/');
  const showFullscreen = Boolean(hasVideo && currentVideo && !isMinimized && isPlayerRoute);
  const showMini = Boolean(hasVideo && currentVideo && isMinimized);

  const player = useVideoPlayer({
    video: currentVideo,
    autoPlay: true,
    initialTime: state.currentTime,
    initialDuration: state.duration,
    initialBuffered: state.buffered,
    initialVolume: state.volume,
    initialMuted: state.isMuted,
    initialIsPlaying: state.playbackState === 'playing' || state.playbackState === 'buffering',
  });

  useEffect(() => {
    if (currentVideo && !isMinimized && !isPlayerRoute) {
      minimize();
    }
  }, [currentVideo, isMinimized, isPlayerRoute, minimize]);

  useEffect(() => {
    if (currentVideo && isMinimized && isPlayerRoute) {
      maximize();
    }
  }, [currentVideo, isMinimized, isPlayerRoute, maximize]);

  // ── Keep store in sync with live player state ─────────────────────────
  useEffect(() => {
    if (!currentVideo) return;
    setPlaybackProgress({
      currentTime: player.state.currentTime,
      duration: player.state.duration,
      buffered: player.state.buffered,
      isBuffering: player.state.isBuffering,
    });
  }, [
    currentVideo,
    player.state.currentTime,
    player.state.duration,
    player.state.buffered,
    player.state.isBuffering,
    setPlaybackProgress,
  ]);

  useEffect(() => {
    if (!currentVideo) return;
    if (player.state.hasEnded) {
      if (state.playbackState !== 'ended') setPlaybackState('ended');
      return;
    }
    if (player.state.isBuffering) {
      if (state.playbackState !== 'buffering') setPlaybackState('buffering');
      return;
    }
    const nextState = player.state.isPlaying ? 'playing' : 'paused';
    if (state.playbackState !== nextState) setPlaybackState(nextState);
  }, [
    currentVideo,
    player.state.hasEnded,
    player.state.isBuffering,
    player.state.isPlaying,
    setPlaybackState,
    state.playbackState,
  ]);

  useEffect(() => {
    if (!currentVideo) return;
    dispatch({ type: 'SET_PIP_SUPPORTED', payload: player.state.canPiP });
    dispatch({ type: 'SET_PIP_ACTIVE', payload: player.state.isPiPActive });
  }, [currentVideo, dispatch, player.state.canPiP, player.state.isPiPActive]);

  useEffect(() => {
    if (Math.abs(state.volume - player.state.volume) > 0.001) {
      dispatch({ type: 'SET_VOLUME', payload: player.state.volume });
    }
    if (state.isMuted !== player.state.isMuted) {
      dispatch({ type: 'SET_MUTED', payload: player.state.isMuted });
    }
  }, [dispatch, player.state.isMuted, player.state.volume, state.isMuted, state.volume]);

  // ── Mini drag state ───────────────────────────────────────────────────
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!showMini) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTime.current = Date.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [showMini]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!showMini || !isDragging) return;
    setDragY(e.clientY - dragStartY.current);
  }, [isDragging, showMini]);

  const handleMaximize = useCallback(() => {
    if (!currentVideo) return;
    setPlaybackProgress({
      currentTime: player.playerRef.current?.currentTime ?? player.state.currentTime,
      duration: player.playerRef.current?.duration || player.state.duration,
      buffered: player.state.buffered,
      isBuffering: false,
    });
    maximize();
    navigate(`/player/${currentVideo.slug}`);
  }, [currentVideo, maximize, navigate, player.playerRef, player.state.buffered, player.state.currentTime, player.state.duration, setPlaybackProgress]);

  const handleMinimize = useCallback(() => {
    if (!currentVideo) return;
    setPlaybackProgress({
      currentTime: player.playerRef.current?.currentTime ?? player.state.currentTime,
      duration: player.playerRef.current?.duration || player.state.duration,
      buffered: player.state.buffered,
      isBuffering: false,
    });
    setPlaybackState('playing');
    minimize();
    navigate('/');
  }, [currentVideo, minimize, navigate, player.playerRef, player.state.buffered, player.state.currentTime, player.state.duration, setPlaybackProgress, setPlaybackState]);

  const handlePointerUp = useCallback(() => {
    if (!showMini || !isDragging) return;
    setIsDragging(false);

    const velocity = dragY / (Date.now() - dragStartTime.current + 1);
    if (dragY < -50 || velocity < -0.5) {
      handleMaximize();
    } else if (dragY > 60 || velocity > 0.5) {
      closePlayer();
    }
    setDragY(0);
  }, [showMini, isDragging, dragY, handleMaximize, closePlayer]);

  if (!currentVideo || (!showFullscreen && !showMini)) {
    return null;
  }

  return (
    <div
      className={cn(
        showMini
          ? 'fixed bottom-0 left-0 right-0 z-50 safe-area-bottom'
          : 'fixed top-0 left-0 right-0 z-20 bg-black',
      )}
      style={
        showMini
          ? {
            transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }
          : undefined
      }
    >
      {showMini && (
        <div className="h-0.5 bg-white/10 w-full">
          <div
            className="h-full bg-(--color-accent) transition-[width] duration-300 ease-linear"
            style={{
              width: `${player.state.duration > 0
                ? Math.max(0, Math.min(100, (player.state.currentTime / player.state.duration) * 100))
                : 0}%`,
            }}
          />
        </div>
      )}

      <div
        className={cn(
          showMini
            ? 'flex items-center gap-3 px-3 py-2 bg-(--color-bg-secondary)/95 backdrop-blur-lg border-t border-white/5 touch-none'
            : 'max-w-5xl mx-auto relative',
        )}
        onPointerDown={showMini ? handlePointerDown : undefined}
        onPointerMove={showMini ? handlePointerMove : undefined}
        onPointerUp={showMini ? handlePointerUp : undefined}
        onPointerCancel={showMini ? handlePointerUp : undefined}
      >
        <div
          className={cn(
            showMini
              ? 'relative w-16 aspect-video rounded-md overflow-hidden shrink-0 cursor-pointer bg-black'
              : 'relative w-full',
          )}
          onClick={showMini ? handleMaximize : undefined}
        >
          <div
            className={cn(showMini && 'origin-top-left')}
            style={
              showMini
                ? {
                  width: `${MINI_SOURCE_WIDTH}px`,
                  height: `${MINI_SOURCE_HEIGHT}px`,
                  transform: `scale(${MINI_SCALE})`,
                  transformOrigin: 'top left',
                }
                : undefined
            }
          >
            <VideoPlayer
              video={currentVideo}
              player={player}
              onDragDown={handleMinimize}
              compact={showMini}
              className={showMini ? 'w-[320px] h-[180px]' : undefined}
            />
          </div>
        </div>

        {showMini && (
          <>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={handleMaximize}>
              <p className="text-sm font-medium text-(--color-text-primary) truncate">
                {currentVideo.title}
              </p>
              <p className="text-[11px] text-(--color-text-muted) truncate">
                {currentVideo.category.name}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                player.actions.togglePlay();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label={player.state.isPlaying ? 'Pause' : 'Play'}
            >
              {player.state.isPlaying ? (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                closePlayer();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close player"
            >
              <svg className="w-4.5 h-4.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
});
