import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/app/store/playerStore';
import ReactPlayer from 'react-player';
import { cn } from '@/lib/utils';

// ─── Mini Player ────────────────────────────────────────────────────────────
// A draggable, minimized player dock at the bottom of the screen.
// Features:
//   - Displays thumbnail + title + play/pause + close
//   - Drag up to maximize → navigates to /player/:slug
//   - Drag down to dismiss → closes player
//   - Continues playback while browsing home feed

export const MiniPlayer = memo(function MiniPlayer() {
  const { state, maximize, closePlayer, togglePlayback, isPlaying, hasVideo } = usePlayer();
  const navigate = useNavigate();
  const { currentVideo, isMinimized } = state;

  // ── Drag state ────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);

  // ── Progress tracking for mini player ─────────────────────────────────
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.duration) {
      setProgress((el.currentTime / el.duration) * 100);
    }
  }, []);

  // Reset progress when video changes
  useEffect(() => {
    setProgress(0);
  }, [currentVideo?.id]);

  // ── Drag handlers ─────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTime.current = Date.now();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY.current;
    setDragY(delta);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const velocity = dragY / (Date.now() - dragStartTime.current + 1);

    if (dragY < -50 || velocity < -0.5) {
      // Dragged up → maximize
      maximize();
      if (currentVideo) {
        navigate(`/player/${currentVideo.slug}`);
      }
    } else if (dragY > 60 || velocity > 0.5) {
      // Dragged down → close
      closePlayer();
    }
    setDragY(0);
  }, [isDragging, dragY, maximize, closePlayer, navigate, currentVideo]);

  const handleMaximize = useCallback(() => {
    maximize();
    if (currentVideo) {
      navigate(`/player/${currentVideo.slug}`);
    }
  }, [maximize, navigate, currentVideo]);

  // Don't render if no video or not minimized
  if (!hasVideo || !isMinimized || !currentVideo) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'safe-area-bottom',
      )}
      style={{
        transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Progress bar at top */}
      <div className="h-[2px] bg-white/10 w-full">
        <div
          className="h-full bg-(--color-accent) transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mini player body */}
      <div
        className="flex items-center gap-3 px-3 py-2 bg-(--color-bg-secondary)/95 backdrop-blur-lg border-t border-white/5 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Thumbnail / Mini video */}
        <div
          className="relative w-16 aspect-video rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={handleMaximize}
        >
          {/* Hidden tiny ReactPlayer for continued playback */}
          <div className="absolute inset-0 pointer-events-none">
            <ReactPlayer
              src={currentVideo.mediaUrl}
              playing={isPlaying}
              muted={state.isMuted}
              volume={state.volume}
              width="100%"
              height="100%"
              controls={false}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              config={{
                youtube: {
                  rel: 0,
                  iv_load_policy: 3,
                  disablekb: 1,
                  enablejsapi: 1,
                },
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
          </div>
          {/* Fallback thumbnail overlay for visual */}
          <img
            src={currentVideo.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleMaximize}>
          <p className="text-sm font-medium text-(--color-text-primary) truncate">
            {currentVideo.title}
          </p>
          <p className="text-[11px] text-(--color-text-muted) truncate">
            {currentVideo.category.name}
          </p>
        </div>

        {/* Play / Pause */}
        <button
          onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); closePlayer(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Close player"
        >
          <svg className="w-4.5 h-4.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});
