import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { Video } from '@/features/videos/types/video';
import { clamp } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the buffered fraction (0–1) from an HTMLVideoElement */
function getBufferedFraction(el: HTMLVideoElement): number {
  if (!el.buffered.length || !el.duration) return 0;
  return el.buffered.end(el.buffered.length - 1) / el.duration;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseVideoPlayerOptions {
  /** The video to play */
  video: Video | null;
  /** Auto-play on mount / video change */
  autoPlay?: boolean;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isReady: boolean;
  isBuffering: boolean;
  hasEnded: boolean;
  controlsVisible: boolean;
}

export interface VideoPlayerActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  seekRelative: (delta: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  showControls: () => void;
  hideControls: () => void;
  toggleControls: () => void;
  // Internal event handlers – standard HTML5 media events for ReactPlayer v3
  _onReady: () => void;
  _onTimeUpdate: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onDurationChange: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onWaiting: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onPlaying: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onEnded: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onPlay: (e: SyntheticEvent<HTMLVideoElement>) => void;
  _onPause: (e: SyntheticEvent<HTMLVideoElement>) => void;
}

export interface UseVideoPlayerReturn {
  playerRef: React.RefObject<HTMLVideoElement | null>;
  state: VideoPlayerState;
  actions: VideoPlayerActions;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVideoPlayer({
  video,
  autoPlay = true,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Use refs for values needed in callbacks to avoid stale closures
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);

  currentTimeRef.current = currentTime;
  durationRef.current = duration;
  isPlayingRef.current = isPlaying;

  // ── Reset on video change ─────────────────────────────────────────────
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsReady(false);
    setIsBuffering(false);
    setHasEnded(false);
    setIsPlaying(autoPlay);
    setControlsVisible(true);
  }, [video?.id, autoPlay]);

  // ── Auto-hide controls timer ──────────────────────────────────────────
  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  }, []);

  const startControlsTimer = useCallback(() => {
    clearControlsTimer();
    controlsTimerRef.current = setTimeout(() => {
      if (isPlayingRef.current) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [clearControlsTimer]);

  useEffect(() => {
    if (controlsVisible && isPlaying) {
      startControlsTimer();
    }
    return clearControlsTimer;
  }, [controlsVisible, isPlaying, startControlsTimer, clearControlsTimer]);

  // ── User actions ──────────────────────────────────────────────────────

  const play = useCallback(() => {
    setIsPlaying(true);
    setHasEnded(false);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) setHasEnded(false);
      return !prev;
    });
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const d = durationRef.current;
    const clamped = clamp(seconds, 0, d || Infinity);
    if (playerRef.current) {
      playerRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
    setHasEnded(false);
  }, []);

  const seekRelative = useCallback((delta: number) => {
    const ct = currentTimeRef.current;
    const d = durationRef.current;
    const target = clamp(ct + delta, 0, d || Infinity);
    if (playerRef.current) {
      playerRef.current.currentTime = target;
    }
    setCurrentTime(target);
    setHasEnded(false);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = clamp(vol, 0, 1);
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    startControlsTimer();
  }, [startControlsTimer]);

  const hideControls = useCallback(() => {
    setControlsVisible(false);
    clearControlsTimer();
  }, [clearControlsTimer]);

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      if (!prev) startControlsTimer();
      return !prev;
    });
  }, [startControlsTimer]);

  // ── HTML5 media event handlers (ReactPlayer v3 / web-component) ───────

  const _onReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const _onTimeUpdate = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    setCurrentTime(el.currentTime);
    setBuffered(getBufferedFraction(el));
  }, []);

  const _onDurationChange = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d)) setDuration(d);
  }, []);

  const _onWaiting = useCallback(() => setIsBuffering(true), []);

  const _onPlaying = useCallback(() => setIsBuffering(false), []);

  const _onEnded = useCallback(() => {
    setHasEnded(true);
    setIsPlaying(false);
  }, []);

  const _onPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const _onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // ── Return ────────────────────────────────────────────────────────────

  const state: VideoPlayerState = {
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    isReady,
    isBuffering,
    hasEnded,
    controlsVisible,
  };

  const actions: VideoPlayerActions = {
    play,
    pause,
    togglePlay,
    seekTo,
    seekRelative,
    setVolume,
    toggleMute,
    showControls,
    hideControls,
    toggleControls,
    _onReady,
    _onTimeUpdate,
    _onDurationChange,
    _onWaiting,
    _onPlaying,
    _onEnded,
    _onPlay,
    _onPause,
  };

  return { playerRef, state, actions };
}
