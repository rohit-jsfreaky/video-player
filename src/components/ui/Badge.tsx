import { cn } from '@/lib/utils';

// ─── Category Color Map ─────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'social-media-ai': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'ai-income':       { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  'ai-essentials':   { bg: 'bg-blue-500/20',    text: 'text-blue-400' },
};

const DEFAULT_COLOR = { bg: 'bg-white/10', text: 'text-white/70' };

// ─── Badge Component ────────────────────────────────────────────────────────

interface BadgeProps {
  /** The text to display */
  label: string;
  /** Category slug for automatic color mapping */
  categorySlug?: string;
  /** Override size */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

export function Badge({ label, categorySlug, size = 'sm', className }: BadgeProps) {
  const colors = categorySlug
    ? CATEGORY_COLORS[categorySlug] ?? DEFAULT_COLOR
    : DEFAULT_COLOR;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium whitespace-nowrap',
        colors.bg,
        colors.text,
        size === 'sm' && 'px-2 py-0.5 text-[10px] leading-4',
        size === 'md' && 'px-2.5 py-1 text-xs leading-4',
        className,
      )}
    >
      {label}
    </span>
  );
}
