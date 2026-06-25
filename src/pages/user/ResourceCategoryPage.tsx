/**
 * /resources/:category —— 单分类资源导航
 *
 * 用途：每个分类作为独立着陆页收录到 sitemap（SEO 增益）。
 */
import { useMemo, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { LinkCard } from '@/components/links/LinkCard';
import { LinkStoreStatic, CATEGORY_META } from '@/lib/links';
import type { LinkCategory, LinkEntry } from '@/lib/links';
import { setJsonLd } from '@/lib/seo';
import { trackPageView } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

export default function ResourceCategoryPage(): React.ReactElement {
  const { category } = useParams<{ category: string }>();
  const cat = (category as LinkCategory) ?? null;
  const valid = cat && (Object.keys(CATEGORY_META) as LinkCategory[]).includes(cat);

  const items = useMemo(() => {
    if (!valid || !cat) return [];
    return LinkStoreStatic.byCategory(cat);
  }, [valid, cat]);

  const meta = valid && cat ? CATEGORY_META[cat] : null;

  useEffect(() => {
    if (valid && meta && cat) {
      document.title = `${meta.label}工具导航 · 资源推荐`;
      trackPageView(`/resources/${cat}`, `${meta.label}工具`);
      setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${meta.label}工具导航`,
        description: `我推荐的所有${meta.label}类工具`,
        hasPart: items.slice(0, 10).map((l) => ({
          '@type': 'WebSite',
          name: l.name,
          url: l.url,
          description: l.description,
        })),
      });
    }
  }, [valid, meta, cat, items]);

  if (!valid || !cat || !meta) {
    return <Navigate to="/resources" replace />;
  }

  const handleClick = (link: LinkEntry): void => {
    LinkStoreStatic.click(link.id);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm">
        <Link to="/resources">
          <ArrowLeft className="h-4 w-4" /> 返回资源导航
        </Link>
      </Button>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-fg-muted">
          <span className="text-base">{meta.emoji}</span>
          {meta.label} · {items.length} 个工具
        </div>
        <h1 className="text-3xl font-bold text-fg sm:text-4xl">
          {meta.label}工具导航
        </h1>
        <p className="max-w-2xl text-fg-muted">
          我用过的所有{meta.label}类工具，按使用频率排序。点击会在新窗口打开，本地累计点击次数。
        </p>
      </motion.section>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-elevated/40 p-12 text-center text-fg-muted">
          这个分类下还没有收录任何工具。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((link) => (
            <LinkCard key={link.id} link={link} onClick={handleClick} />
          ))}
        </div>
      )}

      <div className="text-xs text-fg-subtle">
        <p>
          点击资源即表示你了解我们将打开新窗口，并会在本地累计一次点击用于排序与统计。
        </p>
      </div>
    </div>
  );
}
