import { memo, useCallback, useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import type { Video } from '@/features/videos/types/video';
import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer';
import { PlayerControls } from './PlayerControls';
import { SkipAnimation } from './SkipAnimation';
import { cn } from '@/lib/utils';

// ─── Video Player Component ─────────────────────────────────────────────────
// Renders the ReactPlayer instance with a custom controls overlay.
// All state is managed by the useVideoPlayer hook; this component only wires events.
// Supports double-tap to skip ±10s on left/right halves.

interface VideoPlayerProps {
  video: Video;
  player: UseVideoPlayerReturn;
  onDragDown?: () => void;
  compact?: boolean;
  className?: string;
}

export const VideoPlayer = memo(function VideoPlayer({
  video,
  player,
  onDragDown,
  compact = false,
  className,
}: VideoPlayerProps) {
  const { playerRef, state, actions } = player;

  // ── Double-tap to skip ──────────────────────────────────────────────
  const lastTapTime = useRef(0);
  const lastTapSide = useRef<'left' | 'right' | null>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipDir, setSkipDir] = useState<'forward' | 'backward' | null>(null);
  const [skipKey, setSkipKey] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const suppressTapRef = useRef(false);

  const handleSurfaceClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (compact) return;

    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      return;
    }

    if (!state.controlsVisible) {
      actions.showControls();
      lastTapTime.current = 0;
      lastTapSide.current = null;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();

    if (now - lastTapTime.current < 300 && lastTapSide.current === side) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }

      // Double tap detected
      if (side === 'right') {
        actions.seekRelative(10);
        setSkipDir('forward');
      } else {
        actions.seekRelative(-10);
        setSkipDir('backward');
      }
      setSkipKey((k) => k + 1);
      lastTapTime.current = 0;
      lastTapSide.current = null;
    } else {
      lastTapTime.current = now;
      lastTapSide.current = side;
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        actions.toggleControls();
      }, 300);
    }
  }, [actions, state.controlsVisible, compact]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (compact) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    suppressTapRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [compact]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (compact) return;
    if (!isDragging) return;
    const delta = e.clientY - dragStartYRef.current;
    if (delta > 0) {
      setDragY(delta);
      if (delta > 8) {
        suppressTapRef.current = true;
      }
    } else {
      setDragY(0);
    }
  }, [isDragging, compact]);

  const handlePointerUp = useCallback(() => {
    if (compact) return;
    if (!isDragging) return;

    const velocity = dragY / (Date.now() - dragStartTimeRef.current + 1);
    const shouldMinimize = dragY > 90 || velocity > 0.65;

    setIsDragging(false);
    setDragY(0);

    if (shouldMinimize) {
      onDragDown?.();
    }
  }, [isDragging, dragY, onDragDown, compact]);

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative bg-black overflow-hidden',
        compact ? 'w-full h-full' : 'aspect-video w-full',
        className,
      )}
      style={{
        transform: !compact && dragY > 0 ? `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1200)})` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* ── ReactPlayer ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <ReactPlayer
          key={video.id}
          ref={playerRef}
          src={video.mediaUrl}
          playing={state.isPlaying}
          volume={state.volume}
          muted={state.isMuted}
          width="100%"
          height="100%"
          controls={false}
          playsInline
          onReady={actions._onReady}
          onTimeUpdate={actions._onTimeUpdate}
          onDurationChange={actions._onDurationChange}
          onWaiting={actions._onWaiting}
          onPlaying={actions._onPlaying}
          onEnded={actions._onEnded}
          onPlay={actions._onPlay}
          onPause={actions._onPause}
          onEnterPictureInPicture={actions._onEnterPictureInPicture}
          onLeavePictureInPicture={actions._onLeavePictureInPicture}
          config={{
            youtube: {
              fs: 0,
              rel: 0,
              iv_load_policy: 3,
              disablekb: 1,
              enablejsapi: 1,
            },
          }}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
      </div>

      {/* ── Interaction Layer (captures tap/drag above iframe) ─────────── */}
      {!compact && (
        <div
          className="absolute inset-0 z-[5] touch-none"
          onClick={handleSurfaceClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      )}

      {/* ── Skip Animation Overlay ───────────────────────────────────────── */}
      {!compact && <SkipAnimation direction={skipDir} triggerKey={skipKey} />}

      {/* ── Custom Controls Overlay ──────────────────────────────────────── */}
      {!compact && <PlayerControls state={state} actions={actions} />}
    </div>
  );
});
