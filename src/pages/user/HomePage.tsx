/**
 * 用户端首页 /
 *
 * Hero + 搜索 + 标签云 + 文章卡片网格 + 排序
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Clock,
  Eye,
  TrendingUp,
  Calendar,
  ArrowRight,
  Tag as TagIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getArticleStorage } from '@/lib/storage';
import type { Article } from '@/lib/types';
import { formatDate, cn, estimateReadingTime } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { useAuth } from '@/lib/auth';
import { useSiteConfig } from '@/lib/site-config';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';
import { HomeTools } from '@/components/tools/HomeTools';

type SortKey = 'latest' | 'hot';

export default function HomePage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('latest');
  const { user } = useAuth();
  const { config } = useSiteConfig();
  const { getHomeTools } = useSiteConfig();
  const homeTools = getHomeTools();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getArticleStorage().getAll().then((items) => {
      if (!cancelled) {
        setArticles(items.filter((a) => a.status === 'published'));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((a) => a.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (activeTag && !a.tags.includes(activeTag)) return false;
      if (q) {
        const hay = `${a.title} ${a.excerpt}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, search, activeTag]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'latest') {
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      arr.sort((a, b) => b.views - a.views);
    }
    return arr;
  }, [filtered, sort]);

  const featured = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-bg-elevated to-bg p-8 sm:p-12"
      >
        <div className="absolute right-4 top-4">
          <ThemeSwitcher variant="dropdown" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-fg-muted">
          <Sparkles className="h-3 w-3 text-primary" />
          一套可复用的博客与文章创作系统
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl md:text-5xl">
          {config.heroTitle?.split('，')[0] ?? '写作与阅读'}，<br className="sm:hidden" />
          <span className="text-primary">{config.heroTitle?.split('，')[1] ?? '都可以很美'}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-fg-muted sm:text-lg">
          {config.heroSubtitle ?? '一套可复用的细分内容站框架'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/articles">
              浏览全部文章 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {user ? (
            <Button variant="outline" asChild>
              <Link to="/admin">进入后台</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/login">登录</Link>
            </Button>
          )}
        </div>
      </motion.section>

      {/* 动态工具快键区 */}
      {homeTools.length > 0 && <HomeTools tools={homeTools} />}

      {/* 搜索 + 排序 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <Input
            placeholder="搜索文章..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-0.5">
          <button
            onClick={() => setSort('latest')}
            className={cn(
              'flex items-center gap-1 rounded px-3 py-1 text-xs transition-colors',
              sort === 'latest' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
            )}
          >
            <Calendar className="h-3 w-3" /> 最新
          </button>
          <button
            onClick={() => setSort('hot')}
            className={cn(
              'flex items-center gap-1 rounded px-3 py-1 text-xs transition-colors',
              sort === 'hot' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
            )}
          >
            <TrendingUp className="h-3 w-3" /> 热门
          </button>
        </div>
      </div>

      {/* 标签云 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <TagIcon className="h-4 w-4 text-fg-muted" />
          <button
            onClick={() => setActiveTag('')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              !activeTag
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border text-fg-muted hover:text-fg',
            )}
          >
            全部
          </button>
          {allTags.map(([t, count]) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? '' : t)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                activeTag === t
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border text-fg-muted hover:text-fg',
              )}
            >
              {t} <span className="opacity-60">({count})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border border-border bg-bg-elevated"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <p className="text-fg-muted">没有匹配的文章</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link to={`/article/${featured.slug}`} className="group block">
                <Card className="overflow-hidden transition-shadow hover:shadow-xl">
                  {featured.cover && (
                    <div className="aspect-[3/1] overflow-hidden bg-bg-elevated">
                      <img
                        src={featured.cover}
                        alt={featured.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 sm:p-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge>精选</Badge>
                      {featured.category && (
                        <Badge variant="secondary">{featured.category}</Badge>
                      )}
                      <span className="text-xs text-fg-muted">
                        <Eye className="mr-0.5 inline h-3 w-3" />
                        {featured.views} 次阅读
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-fg transition-colors group-hover:text-primary sm:text-3xl">
                      {featured.title}
                    </h2>
                    <p className="mt-3 line-clamp-2 text-fg-muted">{featured.excerpt}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-fg-muted">
                      <span>
                        <Clock className="mr-1 inline h-3 w-3" />
                        {estimateReadingTime(featured.content)} 分钟
                      </span>
                      <span>{formatDate(featured.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                >
                  <Link to={`/article/${a.slug}`} className="group block h-full">
                    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
                      {a.cover && (
                        <div className="aspect-[16/9] overflow-hidden bg-bg-elevated">
                          <img
                            src={a.cover}
                            alt={a.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardContent className="flex flex-1 flex-col p-5">
                        <div className="mb-2 flex flex-wrap gap-1">
                          {a.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="line-clamp-2 text-lg font-semibold text-fg transition-colors group-hover:text-primary">
                          {a.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 flex-1 text-sm text-fg-muted">
                          {a.excerpt}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs text-fg-muted">
                          <span>
                            <Clock className="mr-1 inline h-3 w-3" />
                            {estimateReadingTime(a.content)} 分钟
                          </span>
                          <span>
                            <Eye className="mr-0.5 inline h-3 w-3" />
                            {a.views}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 邮件订阅 */}
      <section className="mx-auto max-w-2xl">
        <NewsletterForm
          source="homepage"
          title={`订阅${config.name}`}
          subtitle="免费，每周只发干货。可随时退订。"
        />
      </section>
    </div>
  );
}
