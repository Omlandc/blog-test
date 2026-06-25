/**
 * LinkCard —— 单个链接卡片
 */
import { motion } from 'framer-motion';
import { ExternalLink, Star, Tag as TagIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_META, PRICING_META } from '@/lib/links';
import type { LinkEntry } from '@/lib/links';
import { cn } from '@/lib/utils';

export function LinkCard({
  link,
  onClick,
  variant = 'default',
}: {
  link: LinkEntry;
  onClick?: (link: LinkEntry) => void;
  variant?: 'default' | 'featured' | 'compact';
}): React.ReactElement {
  const cat = CATEGORY_META[link.category];
  const pricing = link.pricing ? PRICING_META[link.pricing] : null;

  const handleClick = (): void => {
    onClick?.(link);
    if (typeof window !== 'undefined') {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Card
        onClick={handleClick}
        className={cn(
          'group relative cursor-pointer overflow-hidden transition-all hover:border-primary/40 hover:shadow-md',
          variant === 'featured' && 'border-primary/30 bg-gradient-to-br from-bg-elevated to-bg-subtle',
        )}
      >
        {link.featured && (
          <div className="absolute right-2 top-2">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </div>
        )}
        <CardContent className={cn('p-5', variant === 'compact' && 'p-4')}>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-2xl',
                variant === 'featured' ? 'h-12 w-12' : 'h-10 w-10',
              )}
            >
              {link.icon || '🔗'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn('truncate font-semibold text-fg', variant === 'featured' && 'text-lg')}>
                  {link.name}
                </h3>
                <ExternalLink className="h-3 w-3 shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{link.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {cat.emoji} {cat.label}
                </Badge>
                {pricing && (
                  <Badge variant="outline" className="text-xs">
                    {pricing.emoji} {pricing.label}
                  </Badge>
                )}
                {link.tags.slice(0, 2).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs text-fg-muted">
                    <TagIcon className="mr-0.5 h-2.5 w-2.5" />
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {variant === 'featured' && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-fg-muted">
              <span>已被点过 {link.clicks} 次</span>
              <span className="text-primary">立即访问 →</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
