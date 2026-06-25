/**
 * /explore/:slug —— 单个交互式专栏详情页
 */
import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Tag as TagIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useExplorable, CATEGORY_META } from '@/lib/explorables';
import { setJsonLd } from '@/lib/seo';
import { trackPageView } from '@/lib/analytics';
import { formatDate } from '@/lib/utils';

export default function ExploreDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { meta, Component, loading } = useExplorable(slug ?? '');

  useEffect(() => {
    if (meta) {
      document.title = `${meta.title} · 探索`;
      trackPageView(`/explore/${meta.slug}`, `探索: ${meta.title}`);
      setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: meta.title,
        description: meta.description,
        learningResourceType: 'Interactive Demo',
        timeRequired: `PT${meta.estimatedMinutes}M`,
        version: meta.version,
      });
    }
  }, [meta]);

  if (!slug) return <Navigate to="/explore" replace />;
  if (!meta) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-fg">专栏未找到</h1>
        <p className="mt-2 text-fg-muted">
          slug: <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">{slug}</code>
        </p>
        <Button asChild className="mt-4">
          <Link to="/explore">
            <ArrowLeft className="h-4 w-4" /> 返回探索
          </Link>
        </Button>
      </div>
    );
  }
  const cat = CATEGORY_META[meta.category];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-12">
      {/* 返回 */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/explore">
          <ArrowLeft className="h-4 w-4" /> 返回探索
        </Link>
      </Button>

      {/* 头部 */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <Badge variant="secondary">
            {cat.emoji} {cat.label}
          </Badge>
          <Badge
            variant="outline"
            className={
              meta.difficulty === 'beginner'
                ? 'border-emerald-500/40 text-emerald-500'
                : meta.difficulty === 'intermediate'
                  ? 'border-amber-500/40 text-amber-500'
                  : 'border-rose-500/40 text-rose-500'
            }
          >
            {meta.difficulty === 'beginner'
              ? '入门'
              : meta.difficulty === 'intermediate'
                ? '进阶'
                : '高级'}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {meta.estimatedMinutes} 分钟
          </span>
          <span>v{meta.version}</span>
          <span>·</span>
          <span>更新于 {formatDate(meta.updatedAt)}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {meta.title}
        </h1>
        <p className="text-lg text-fg-muted">{meta.subtitle}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {meta.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-xs">
              <TagIcon className="mr-0.5 h-2.5 w-2.5" />
              {t}
            </Badge>
          ))}
        </div>
      </motion.section>

      {/* 简介 */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-fg">{meta.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* 互动组件 */}
      <div className="rounded-lg border-2 border-dashed border-border bg-bg-elevated/40 p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          互动区
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-fg-muted">加载组件…</span>
          </div>
        ) : Component ? (
          <Component />
        ) : (
          <p className="py-12 text-center text-fg-muted">组件加载失败</p>
        )}
      </div>

      {/* 相关阅读 */}
      {meta.related && meta.related.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-sm font-semibold text-fg">相关阅读</p>
            <div className="flex flex-wrap gap-2">
              {meta.related.map((r) => (
                <Link key={r} to={`/${r}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-fg"
                  >
                    {r}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 元信息 */}
      <p className="text-center text-xs text-fg-subtle">
        作者：{meta.author} · 内容版本 v{meta.version}
      </p>
    </div>
  );
}
