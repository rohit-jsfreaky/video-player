import { useNavigate } from 'react-router-dom';
import type { Video } from '@/features/videos/types/video';
import { Badge } from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';

// ─── Video Card ─────────────────────────────────────────────────────────────
// Displays a single video in the home feed grid.
// Clicking navigates to /player/:slug (route-based).

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/player/${video.slug}`);
  };

  return (
    <article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="
        group cursor-pointer rounded-xl
        bg-(--color-bg-secondary)
        overflow-hidden
        transition-all duration-200 ease-out
        hover:bg-(--color-bg-elevated)
        hover:ring-1 hover:ring-white/10
        active:scale-[0.97] active:opacity-90
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
      "
    >
      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          decoding="async"
          className="
            w-full h-full object-cover
            transition-transform duration-300 ease-out
            group-hover:scale-105
          "
        />

        {/* Duration overlay */}
        <span className="
          absolute bottom-2 right-2
          px-1.5 py-0.5
          text-[11px] font-medium leading-4
          bg-black/80 text-white
          rounded
          backdrop-blur-sm
        ">
          {formatDuration(video.duration)}
        </span>

        {/* Hover play icon overlay */}
        <div className="
          absolute inset-0
          flex items-center justify-center
          bg-black/0 group-hover:bg-black/20
          transition-all duration-200
        ">
          <div className="
            w-12 h-12 rounded-full
            bg-white/90
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            scale-75 group-hover:scale-100
            transition-all duration-200
          ">
            <svg
              className="w-5 h-5 text-black ml-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Info Section ───────────────────────────────────────────────── */}
      <div className="p-3">
        <h3 className="
          text-sm font-medium leading-5
          text-(--color-text-primary)
          line-clamp-2
        ">
          {video.title}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Badge
            label={video.category.name}
            categorySlug={video.category.slug}
          />
          <span className="text-[11px] text-(--color-text-muted)">
            {formatDuration(video.duration)}
          </span>
        </div>
      </div>
    </article>
  );
}
