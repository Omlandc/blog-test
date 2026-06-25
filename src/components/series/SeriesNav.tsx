/**
 * SeriesNav —— 主题簇导航
 *
 * 展示 Pillar 与其下属 Cluster。
 * 是"主题簇架构"在 UI 层的体现。
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderTree, ChevronRight } from 'lucide-react';
import { getSeriesStore } from '@/lib/series';
import type { Series } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  /** 当前高亮的 Series ID */
  activeSeriesId?: string;
  className?: string;
}

export function SeriesNav({ activeSeriesId, className }: Props): React.ReactElement {
  const [pillars, setPillars] = useState<Series[]>([]);
  const [children, setChildren] = useState<Record<string, Series[]>>({});

  useEffect(() => {
    const store = getSeriesStore();
    const refresh = (): void => {
      setPillars(store.getPillars());
      const map: Record<string, Series[]> = {};
      pillars.forEach((p) => {
        map[p.id] = store.getChildren(p.id);
      });
      setChildren(map);
    };
    refresh();
    const unsub = store.subscribe(refresh);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className={cn('space-y-4', className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
        <FolderTree className="h-4 w-4" />
        主题导航
      </div>
      {pillars.map((pillar, idx) => (
        <motion.div
          key={pillar.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            'rounded-lg border p-3',
            activeSeriesId === pillar.id
              ? 'border-primary bg-primary/5'
              : 'border-border',
          )}
        >
          <Link
            to={`/topics/${pillar.slug}`}
            className="block font-medium text-fg hover:text-primary"
          >
            {pillar.name}
          </Link>
          {pillar.tagline && (
            <p className="mt-0.5 text-xs text-fg-muted">{pillar.tagline}</p>
          )}
          {children[pillar.id] && children[pillar.id].length > 0 && (
            <ul className="mt-2 space-y-1 border-l-2 border-border pl-3">
              {children[pillar.id].map((child) => (
                <li key={child.id}>
                  <Link
                    to={`/topics/${child.slug}`}
                    className={cn(
                      'flex items-center gap-1 text-xs hover:text-primary',
                      activeSeriesId === child.id ? 'text-primary' : 'text-fg-muted',
                    )}
                  >
                    <ChevronRight className="h-3 w-3" />
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      ))}
    </nav>
  );
}