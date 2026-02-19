import type { VideoCategory } from '@/features/videos/types/video';
import { VideoCard } from './VideoCard';

// ─── Category Section ───────────────────────────────────────────────────────
// Renders a category header + grid of video cards for the home feed.

interface CategorySectionProps {
  group: VideoCategory;
}

export function CategorySection({ group }: CategorySectionProps) {
  const { category, contents } = group;

  return (
    <section className="mb-8">
      {/* ── Category Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 px-4">
        <img
          src={category.iconUrl}
          alt=""
          className="w-7 h-7 rounded-lg object-cover"
          loading="lazy"
        />
        <div>
          <h2 className="text-base font-semibold text-(--color-text-primary) leading-tight">
            {category.name}
          </h2>
          <p className="text-[11px] text-(--color-text-muted) mt-0.5">
            {contents.length} videos
          </p>
        </div>
      </div>

      {/* ── Video Grid ─────────────────────────────────────────────────── */}
      <div className="
        grid gap-3 px-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      ">
        {contents.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
