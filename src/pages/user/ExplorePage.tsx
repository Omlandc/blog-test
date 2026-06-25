/**
 * /explore —— 交互式专栏索引
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Clock,
  ArrowRight,
  Compass,
  Tag as TagIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  listExplorables,
  CATEGORY_META,
} from '@/lib/explorables';
import type { ExplorableMeta } from '@/lib/explorables';
import { useSiteConfig } from '@/lib/site-config';
import { setJsonLd } from '@/lib/seo';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import { cn, formatDate } from '@/lib/utils';

export default function ExplorePage(): React.ReactElement {
  const all = listExplorables();
  const { config } = useSiteConfig();

  useEffect(() => {
    document.title = `探索 · 交互式专栏 · ${config.name}`;
    trackPageView('/explore', '探索');
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '探索',
      description: '交互式专栏 · 不只是读，还能玩',
      hasPart: all.map((e) => ({
        '@type': 'Course',
        name: e.title,
        description: e.description,
      })),
    });
  }, [all.length, config.name]);

  const categories = Array.from(new Set(all.map((e) => e.category)));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-fg-muted">
          <Sparkles className="h-3 w-3 text-primary" />
          探索性内容 · 不只是读
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          探索
        </h1>
        <p className="max-w-2xl text-fg-muted">
          这些内容不是普通文章。每个专栏是一段可玩的代码 / 可点可拖的 demo——
          用普通文字讲不清楚的概念，用交互就一目了然。
        </p>
      </motion.section>

      {/* 分类标签 */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map((c) => (
            <Badge key={c} variant="secondary">
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </Badge>
          ))}
        </div>
      )}

      {/* 专栏列表 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {all.map((meta, i) => (
          <ExplorableCard key={meta.slug} meta={meta} index={i} />
        ))}
      </div>

      {all.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-fg-muted">
            <Compass className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-4 text-sm">还没有任何专栏。</p>
            <p className="mt-1 text-xs text-fg-subtle">
              它们通过{' '}
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
                src/lib/explorables/seed.ts
              </code>{' '}
              注册。git push 后自动出现在这里。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExplorableCard({
  meta,
  index,
}: {
  meta: ExplorableMeta;
  index: number;
}): React.ReactElement {
  const cat = CATEGORY_META[meta.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/explore/${meta.slug}`} className="group block">
        <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <Badge variant="secondary">
                {cat.emoji} {cat.label}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {meta.estimatedMinutes} 分钟
              </span>
              <span>v{meta.version}</span>
            </div>
            <CardTitle className="mt-2 text-lg">{meta.title}</CardTitle>
            <p className="text-xs text-fg-muted">{meta.subtitle}</p>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-sm text-fg-muted">{meta.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {meta.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  <TagIcon className="mr-0.5 h-2.5 w-2.5" /> {t}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-fg-subtle">
                更新于 {formatDate(meta.updatedAt)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-primary"
                asChild
              >
                <span>
                  开始探索 <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
