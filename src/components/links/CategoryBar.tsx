/**
 * CategoryBar —— 分类标签条
 */
import { CATEGORY_META } from '@/lib/links';
import type { LinkCategory } from '@/lib/links';
import { cn } from '@/lib/utils';

interface Props {
  active: LinkCategory | 'all';
  counts: Record<LinkCategory, number>;
  total: number;
  onChange: (cat: LinkCategory | 'all') => void;
}

export function CategoryBar({ active, counts, total, onChange }: Props): React.ReactElement {
  const cats = Object.keys(CATEGORY_META) as LinkCategory[];
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'rounded-full border px-4 py-1.5 text-sm transition-all',
          active === 'all'
            ? 'border-primary bg-primary text-primary-fg shadow-sm'
            : 'border-border bg-bg-elevated text-fg-muted hover:text-fg',
        )}
      >
        全部 <span className="ml-1 opacity-60">({total})</span>
      </button>
      {cats.map((c) => {
        const m = CATEGORY_META[c];
        const count = counts[c] ?? 0;
        if (count === 0) return null;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-all',
              active === c
                ? 'border-primary bg-primary text-primary-fg shadow-sm'
                : 'border-border bg-bg-elevated text-fg-muted hover:text-fg',
            )}
          >
            <span className="mr-1">{m.emoji}</span>
            {m.label} <span className="ml-0.5 opacity-60">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
