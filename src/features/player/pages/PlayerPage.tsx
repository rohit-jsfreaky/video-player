import { useParams } from 'react-router-dom';

const PlayerPage = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
        Player
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Now playing: <span className="text-white font-medium">{slug}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Full player will be implemented in Phase 4.
      </p>
    </div>
  );
};

export default PlayerPage;
