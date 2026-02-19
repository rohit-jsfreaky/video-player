import { useVideoFeed } from '../hooks/useVideoFeed';
import { CategorySection } from '../components/CategorySection';

// ─── Home Page ──────────────────────────────────────────────────────────────
// Displays a scrollable video feed grouped by category.
// Each card navigates to /player/:slug on click (route-based).

const HomePage = () => {
  const { categories, totalCount } = useVideoFeed();

  return (
    <div className="min-h-dvh pb-8">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-(--color-bg-primary)/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-(--color-accent) flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-(--color-text-primary) tracking-tight">
              VideoPlayer
            </h1>
          </div>
          <span className="text-xs text-(--color-text-muted) font-medium">
            {totalCount} videos
          </span>
        </div>
      </header>

      {/* ── Feed Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto pt-6">
        {categories.map((group) => (
          <CategorySection key={group.category.slug} group={group} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
