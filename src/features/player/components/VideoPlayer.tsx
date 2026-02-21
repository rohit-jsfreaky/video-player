import { memo, useCallback, useRef, useState } from 'react';
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
  className?: string;
}

export const VideoPlayer = memo(function VideoPlayer({ video, player, className }: VideoPlayerProps) {
  const { playerRef, state, actions } = player;

  // ── Double-tap to skip ──────────────────────────────────────────────
  const lastTapTime = useRef(0);
  const lastTapSide = useRef<'left' | 'right' | null>(null);
  const [skipDir, setSkipDir] = useState<'forward' | 'backward' | null>(null);
  const [skipKey, setSkipKey] = useState(0);

  const handleDoubleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();

    if (now - lastTapTime.current < 300 && lastTapSide.current === side) {
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
    } else {
      lastTapTime.current = now;
      lastTapSide.current = side;
    }
  }, [actions]);

  return (
    <div
      className={cn(
        'relative bg-black overflow-hidden',
        'aspect-video w-full',
        className,
      )}
      onClick={handleDoubleTap}
    >
      {/* ── ReactPlayer ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <ReactPlayer
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

      {/* ── Skip Animation Overlay ───────────────────────────────────────── */}
      <SkipAnimation direction={skipDir} triggerKey={skipKey} />

      {/* ── Custom Controls Overlay ──────────────────────────────────────── */}
      <PlayerControls state={state} actions={actions} />
    </div>
  );
});
