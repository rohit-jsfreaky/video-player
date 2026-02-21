import { useCallback, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Video } from '@/features/videos/types/video';
import { formatDuration, cn } from '@/lib/utils';

// ─── In-Player Video List Panel ─────────────────────────────────────────────
// A slide-up overlay panel showing all videos in the same category.
// - Swipe-up (drag handle) or tap the button to expand
// - Currently playing video is highlighted
// - Tap a video to switch playback

interface VideoListPanelProps {
  videos: Video[];
  currentVideo: Video;
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: Video) => void;
}

export function VideoListPanel({
  videos,
  currentVideo,
  isOpen,
  onClose,
  onSelectVideo,
}: VideoListPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  // Scroll to the currently playing video when panel opens
  useEffect(() => {
    if (isOpen) {
      const el = document.getElementById(`vl-${currentVideo.id}`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isOpen, currentVideo.id]);

  // ── Drag-to-dismiss ─────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    if (dragOffset > 120) {
      onClose();
    }
    setDragOffset(0);
  }, [dragOffset, onClose]);

  const navigate = useNavigate();

  const handleSelect = useCallback(
    (video: Video) => {
      onSelectVideo(video);
      navigate(`/player/${video.slug}`, { replace: true });
      onClose();
    },
    [onSelectVideo, navigate, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative mt-auto max-h-[70dvh] flex flex-col rounded-t-2xl bg-(--color-bg-secondary) animate-slide-up"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-semibold text-(--color-text-primary)">
              Up Next
            </h3>
            <p className="text-xs text-(--color-text-muted) mt-0.5">
              {currentVideo.category.name} · {videos.length + 1} videos
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Close list"
          >
            <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video list */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-2">
          {videos.map((video, index) => {
            const isCurrent = video.id === currentVideo.id;
            return (
              <button
                key={video.id}
                id={`vl-${video.id}`}
                onClick={() => !isCurrent && handleSelect(video)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isCurrent
                    ? 'bg-(--color-accent)/10'
                    : 'hover:bg-white/5 active:bg-white/10',
                )}
              >
                {/* Index / Now playing indicator */}
                <span className={cn(
                  'w-6 text-center text-xs font-medium flex-shrink-0',
                  isCurrent ? 'text-(--color-accent)' : 'text-(--color-text-muted)',
                )}>
                  {isCurrent ? (
                    <span className="inline-flex gap-0.5">
                      <span className="w-0.5 h-3 bg-(--color-accent) rounded-full animate-pulse" />
                      <span className="w-0.5 h-3 bg-(--color-accent) rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="w-0.5 h-3 bg-(--color-accent) rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </span>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Thumbnail */}
                <div className="relative w-24 flex-shrink-0 aspect-video rounded-md overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className={cn(
                      'w-full h-full object-cover',
                      isCurrent && 'opacity-70',
                    )}
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 text-[9px] font-medium bg-black/80 text-white rounded">
                    {formatDuration(video.duration)}
                  </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium line-clamp-2 leading-snug',
                    isCurrent ? 'text-(--color-accent)' : 'text-(--color-text-primary)',
                  )}>
                    {video.title}
                  </p>
                  {isCurrent && (
                    <p className="text-[11px] text-(--color-accent)/70 mt-0.5">Now playing</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
