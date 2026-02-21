import { cn } from '@/lib/utils';
import { SeekBar } from './SeekBar';
import type { VideoPlayerState, VideoPlayerActions } from '../hooks/useVideoPlayer';

// ─── Icons ──────────────────────────────────────────────────────────────────

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SkipIcon({ className, direction }: { className?: string; direction: 'forward' | 'backward' }) {
  const isForward = direction === 'forward';
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {isForward ? (
        <>
          <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="sans-serif">10</text>
        </>
      ) : (
        <>
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="sans-serif">10</text>
        </>
      )}
    </svg>
  );
}

function VolumeIcon({ className, muted }: { className?: string; muted: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {muted ? (
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
      ) : (
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      )}
    </svg>
  );
}

function PiPIcon({ className, active }: { className?: string; active: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="14" rx="2.5" />
      {active ? (
        <path d="M13 10h6v4h-6z" fill="currentColor" stroke="none" />
      ) : (
        <path d="M14 9.5h5v4h-5z" />
      )}
    </svg>
  );
}

// ─── Player Controls ────────────────────────────────────────────────────────

interface PlayerControlsProps {
  state: VideoPlayerState;
  actions: VideoPlayerActions;
  className?: string;
}

export function PlayerControls({ state, actions, className }: PlayerControlsProps) {
  const { isPlaying, currentTime, duration, buffered, isMuted, controlsVisible, isBuffering, canPiP, isPiPActive } = state;
  const { togglePlay, seekRelative, seekTo, toggleMute, togglePiP } = actions;

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col transition-opacity duration-200 pointer-events-none',
        controlsVisible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {/* ── Gradient overlay ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-end gap-2 p-3">
        {canPiP && (
          <button
            onClick={() => { void togglePiP(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors pointer-events-auto"
            aria-label={isPiPActive ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
          >
            <PiPIcon className="w-4.5 h-4.5 text-white" active={isPiPActive} />
          </button>
        )}
        <button
          onClick={toggleMute}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors pointer-events-auto"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <VolumeIcon className="w-5 h-5 text-white" muted={isMuted} />
        </button>
      </div>

      {/* ── Center playback controls ────────────────────────────────────── */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center gap-12 pointer-events-none"
      >
        {/* Skip backward */}
        <button
          onClick={() => seekRelative(-10)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 active:scale-90 transition-all pointer-events-auto"
          aria-label="Skip back 10 seconds"
        >
          <SkipIcon className="w-7 h-7 text-white" direction="backward" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-16 h-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 active:scale-90 transition-all pointer-events-auto"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isBuffering ? (
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="w-8 h-8 text-white" />
          ) : (
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => seekRelative(10)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 active:scale-90 transition-all pointer-events-auto"
          aria-label="Skip forward 10 seconds"
        >
          <SkipIcon className="w-7 h-7 text-white" direction="forward" />
        </button>
      </div>

      {/* ── Bottom seek bar ─────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pb-4 pointer-events-none">
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          onSeek={seekTo}
          className="pointer-events-auto"
        />
      </div>
    </div>
  );
}
