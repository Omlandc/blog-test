/**
 * /resources —— 资源导航总览
 *
 * 页面结构：
 * 1. Hero + 简介
 * 2. 精选（featured）大卡片
 * 3. 分类筛选条
 * 4. 全部链接网格（按当前分类筛选）
 * 5. CTA：推荐你喜欢的工具
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Star,
  Sparkles,
  Search,
  X,
  Tag as TagIcon,
  Mail,
} from 'lucide-react';
import { LinkCard } from '@/components/links/LinkCard';
import { CategoryBar } from '@/components/links/CategoryBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LinkStoreStatic, CATEGORY_META } from '@/lib/links';
import type { LinkCategory, LinkEntry } from '@/lib/links';
import { setJsonLd } from '@/lib/seo';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export default function ResourcesPage(): React.ReactElement {
  const [allLinks] = useState(() => LinkStoreStatic.list());
  const [activeCat, setActiveCat] = useState<LinkCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c: Record<LinkCategory, number> = {
      design: 0, dev: 0, writing: 0, marketing: 0,
      analytics: 0, productivity: 0, other: 0,
    };
    allLinks.forEach((l) => {
      c[l.category] = (c[l.category] ?? 0) + 1;
    });
    return c;
  }, [allLinks]);

  const filtered = useMemo(() => {
    let list = activeCat === 'all' ? allLinks : allLinks.filter((l) => l.category === activeCat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allLinks, activeCat, search]);

  const featured = useMemo(() => allLinks.filter((l) => l.featured).slice(0, 4), [allLinks]);

  useEffect(() => {
    document.title = `资源导航 · ${allLinks.length} 个精选工具`;
    trackPageView('/resources', '资源导航');
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '资源导航',
      description: '我用过且真心推荐的细分领域工具与网站',
      hasPart: featured.map((l) => ({
        '@type': 'WebSite',
        name: l.name,
        url: l.url,
        description: l.description,
      })),
    });
  }, [allLinks.length, featured]);

  const handleClick = (link: LinkEntry): void => {
    LinkStoreStatic.click(link.id);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-bg-elevated via-bg to-bg-subtle p-8 sm:p-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-fg-muted">
          <Compass className="h-3 w-3 text-primary" />
          我用过且真心推荐的
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          资源导航
        </h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          {allLinks.length} 个工具 · {Object.values(counts).filter((c) => c > 0).length} 个分类 ·
          点击会打开新窗口，本地累计你的点击次数
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-fg-muted">
          {(Object.keys(CATEGORY_META) as LinkCategory[]).filter((c) => counts[c] > 0).map((c) => (
            <span key={c} className="rounded-md border border-border bg-bg-elevated px-2 py-1">
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label} · {counts[c]}
            </span>
          ))}
        </div>
      </motion.section>

      {/* 精选 */}
      {featured.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            精选推荐
            <span className="text-xs font-normal text-fg-muted">
              长期自用，真心推荐
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onClick={handleClick}
                variant="featured"
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* 筛选 */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Sparkles className="h-4 w-4 text-primary" />
            全部资源
          </div>
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <Input
              placeholder="搜索资源..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-fg-muted hover:bg-bg-subtle hover:text-fg"
                aria-label="清空"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <CategoryBar
          active={activeCat}
          counts={counts}
          total={allLinks.length}
          onChange={setActiveCat}
        />
      </div>

      {/* 网格 */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-fg-muted">
            <TagIcon className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-4">没有匹配的资源</p>
            {(activeCat !== 'all' || search) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveCat('all');
                  setSearch('');
                }}
              >
                清空筛选
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((link) => (
            <LinkCard key={link.id} link={link} onClick={handleClick} />
          ))}
        </div>
      )}

      {/* CTA：推荐你喜欢的 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center"
      >
        <Mail className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-3 text-lg font-semibold text-fg">
          有一个你特别喜欢的工具？
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          邮件告诉我，我试用后会收录到这里。
        </p>
        <Button asChild className="mt-4">
          <a href="mailto:hello@example.com?subject=推荐工具收录">
            发邮件推荐
          </a>
        </Button>
      </motion.section>
    </div>
  );
}
