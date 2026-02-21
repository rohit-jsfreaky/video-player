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

/** Detect whether the current element supports the standard PiP API */
function supportsPiP(el: HTMLVideoElement | null): boolean {
  if (!el || typeof document === 'undefined') return false;
  return (
    typeof (el as HTMLVideoElement & { requestPictureInPicture?: () => Promise<PictureInPictureWindow> }).requestPictureInPicture === 'function'
    && document.pictureInPictureEnabled
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseVideoPlayerOptions {
  /** The video to play */
  video: Video | null;
  /** Auto-play on mount / video change */
  autoPlay?: boolean;
  /** Initial playback time (seconds) when mounting a new player instance */
  initialTime?: number;
  /** Initial duration (seconds), used as a placeholder until metadata loads */
  initialDuration?: number;
  /** Initial buffered fraction (0-1) */
  initialBuffered?: number;
  /** Initial volume */
  initialVolume?: number;
  /** Initial muted flag */
  initialMuted?: boolean;
  /** Initial playback flag */
  initialIsPlaying?: boolean;
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
  canPiP: boolean;
  isPiPActive: boolean;
}

export interface VideoPlayerActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  seekRelative: (delta: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  enterPiP: () => Promise<void>;
  exitPiP: () => Promise<void>;
  togglePiP: () => Promise<void>;
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
  _onEnterPictureInPicture: (e: Event) => void;
  _onLeavePictureInPicture: (e: Event) => void;
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
  initialTime = 0,
  initialDuration = 0,
  initialBuffered = 0,
  initialVolume = 1,
  initialMuted = false,
  initialIsPlaying,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInitialSeekRef = useRef<number | null>(null);
  const initialPlaybackRef = useRef({
    time: initialTime,
    duration: initialDuration,
    buffered: initialBuffered,
    volume: initialVolume,
    muted: initialMuted,
    playing: initialIsPlaying ?? autoPlay,
  });

  const [isPlaying, setIsPlaying] = useState(initialIsPlaying ?? autoPlay);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(initialDuration);
  const [buffered, setBuffered] = useState(initialBuffered);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [canPiP, setCanPiP] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Use refs for values needed in callbacks to avoid stale closures
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const hasEndedRef = useRef(hasEnded);

  useEffect(() => {
    initialPlaybackRef.current = {
      time: initialTime,
      duration: initialDuration,
      buffered: initialBuffered,
      volume: initialVolume,
      muted: initialMuted,
      playing: initialIsPlaying ?? autoPlay,
    };
  }, [initialTime, initialDuration, initialBuffered, initialVolume, initialMuted, initialIsPlaying, autoPlay]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    hasEndedRef.current = hasEnded;
  }, [hasEnded]);

  // ── Reset on video change ─────────────────────────────────────────────
  useEffect(() => {
    const initial = initialPlaybackRef.current;
    setCurrentTime(initial.time);
    setDuration(initial.duration);
    setBuffered(initial.buffered);
    setIsReady(false);
    setIsBuffering(false);
    setHasEnded(false);
    setIsPlaying(initial.playing);
    setVolumeState(initial.volume);
    setIsMuted(initial.muted);
    setControlsVisible(true);
    setCanPiP(false);
    setIsPiPActive(false);
    pendingInitialSeekRef.current = initial.time > 0 ? initial.time : null;
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

  const enterPiP = useCallback(async () => {
    const el = playerRef.current as (HTMLVideoElement & {
      requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
    }) | null;
    if (!el || !supportsPiP(el)) return;
    if (document.pictureInPictureElement) return;

    try {
      await el.requestPictureInPicture?.();
    } catch {
      // Ignore API errors (unsupported provider, user denied, etc)
    }
  }, []);

  const exitPiP = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (!document.pictureInPictureElement) return;
    try {
      await document.exitPictureInPicture();
    } catch {
      // Ignore API errors
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (document.pictureInPictureElement) {
      await exitPiP();
      return;
    }
    await enterPiP();
  }, [enterPiP, exitPiP]);

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
    setCanPiP(supportsPiP(playerRef.current));

    const pendingSeek = pendingInitialSeekRef.current;
    if (pendingSeek !== null && playerRef.current) {
      try {
        playerRef.current.currentTime = pendingSeek;
        setCurrentTime(pendingSeek);
      } catch {
        // Some providers only allow seek after metadata; retry on durationchange.
      }
    }
  }, []);

  const _onTimeUpdate = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const ct = el.currentTime;
    const d = el.duration;
    setCurrentTime(ct);
    setBuffered(getBufferedFraction(el));
    if (pendingInitialSeekRef.current !== null) {
      pendingInitialSeekRef.current = null;
    }
    // Fallback: detect end when currentTime reaches duration
    // (YouTube iframe doesn't always fire onEnded)
    if (d > 0 && Number.isFinite(d) && ct >= d - 0.15 && !hasEndedRef.current) {
      console.log('[useVideoPlayer] timeUpdate near-end fallback', { ct, d });
      setHasEnded(true);
      setIsPlaying(false);
    }
  }, []);

  const _onDurationChange = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d)) {
      setDuration(d);

      const pendingSeek = pendingInitialSeekRef.current;
      if (pendingSeek !== null && playerRef.current) {
        const target = clamp(pendingSeek, 0, d);
        try {
          playerRef.current.currentTime = target;
          setCurrentTime(target);
          pendingInitialSeekRef.current = null;
        } catch {
          // Ignore and let player naturally continue from current time.
        }
      }
    }
  }, []);

  const _onWaiting = useCallback(() => setIsBuffering(true), []);

  const _onPlaying = useCallback(() => setIsBuffering(false), []);

  const _onEnded = useCallback(() => {
    console.log('[useVideoPlayer] _onEnded fired');
    setHasEnded(true);
    setIsPlaying(false);
  }, []);

  const _onPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const _onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const _onEnterPictureInPicture = useCallback(() => {
    setIsPiPActive(true);
  }, []);

  const _onLeavePictureInPicture = useCallback(() => {
    setIsPiPActive(false);
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
    canPiP,
    isPiPActive,
  };

  const actions: VideoPlayerActions = {
    play,
    pause,
    togglePlay,
    seekTo,
    seekRelative,
    setVolume,
    toggleMute,
    enterPiP,
    exitPiP,
    togglePiP,
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
    _onEnterPictureInPicture,
    _onLeavePictureInPicture,
  };

  return { playerRef, state, actions };
}
