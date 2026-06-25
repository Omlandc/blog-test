/**
 * 文章列表 /articles + 文章详情 /article/:slug
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Eye,
  Clock,
  Calendar,
  FileText,
  Share2,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArticleViewer } from '@/components/viewer';
import { resolveContentTheme } from '@/lib/content-themes';
import { getArticleStorage } from '@/lib/storage';
import type { Article } from '@/lib/types';
import { timeAgo, formatDate, cn, estimateReadingTime } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';
import { setMeta } from '@/lib/seo';
import { useSiteConfig } from '@/lib/site-config';

type SortKey = 'latest' | 'hot';

export default function ArticleListPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 12;

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
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeTag, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">所有文章</h1>
          <p className="text-sm text-fg-muted">共 {sorted.length} 篇</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> 返回首页
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <Input
            placeholder="搜索标题或摘要..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-0.5">
          <button
            onClick={() => setSort('latest')}
            className={cn(
              'flex items-center gap-1 rounded px-3 py-1 text-xs',
              sort === 'latest' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
            )}
          >
            <Calendar className="h-3 w-3" /> 最新
          </button>
          <button
            onClick={() => setSort('hot')}
            className={cn(
              'flex items-center gap-1 rounded px-3 py-1 text-xs',
              sort === 'hot' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
            )}
          >
            <Eye className="h-3 w-3" /> 热门
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTag('')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              !activeTag
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border text-fg-muted',
            )}
          >
            全部
          </button>
          {allTags.map(([t]) => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? '' : t)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                activeTag === t
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border text-fg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl border border-border bg-bg-elevated"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-fg-muted" />
            <p className="text-fg-muted">没有匹配的文章</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
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
                      <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-fg-muted">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Article Detail ───────────────────────────────────────

export function ArticleDetailPage(): React.ReactElement {
  const { slug } = useParams();
  const { config } = useSiteConfig();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  useEffect(() => {
    if (!slug) {
      setError('缺少文章 slug');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const storage = getArticleStorage();
    void storage
      .getBySlug(slug)
      .then(async (a) => {
        if (cancelled) return;
        if (!a) {
          setError('文章不存在');
        } else {
          setArticle(a);
          // 浏览量自增
          void storage.incrementViews(a.id).catch(() => undefined);
          // 相关文章（同标签最多 3 篇）
          const all = await storage.getAll();
          if (!cancelled) {
            setRelated(
              all
                .filter(
                  (x) =>
                    x.id !== a.id &&
                    x.status === 'published' &&
                    x.tags.some((t) => a.tags.includes(t)),
                )
                .slice(0, 3),
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.show('已复制链接', { description: '可以分享给朋友了' });
    } catch {
      toast.show('复制失败', { description: '请手动复制地址栏链接', variant: 'danger' });
    }
  }, [article, toast]);

  // SEO：动态设置 title（必须在所有 early return 之前）
  useEffect(() => {
    if (article) {
      document.title = `${article.seo?.title ?? article.title} - ${config.name}`;
      setMeta({
        title: `${article.seo?.title ?? article.title} - ${config.name}`,
        description: article.seo?.description ?? article.excerpt,
        keywords: article.seo?.keywords ?? article.tags,
        canonicalUrl: article.seo?.canonicalUrl ?? `${window.location.origin}/article/${article.slug}`,
        ogType: 'article',
        ogImage: article.seo?.ogImage ?? article.cover,
        noai: article.seo?.noai,
        noimageai: article.seo?.noimageai,
        author: article.authorId,
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
      });
    }
    return () => {
      document.title = config.name;
      setMeta({ title: config.name, description: config.description });
    };
  }, [article, config]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-fg-muted">加载中…</div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/articles">
              <ArrowLeft className="h-4 w-4" /> 返回文章列表
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-12 text-center text-danger">
          {error || '文章不存在'}
        </div>
      </div>
    );
  }

  const minutes = estimateReadingTime(article.content);

  return (
    <div className="pb-16">
      {/* SEO: Article schema (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            image: article.cover,
            datePublished: article.publishedAt ?? article.createdAt,
            dateModified: article.updatedAt,
            author: { '@type': 'Person', name: article.authorId },
            keywords: article.seo?.keywords?.join(', '),
          }),
        }}
      />

      {/* 文章头部 */}
      <header className="mx-auto max-w-3xl px-4 pt-8 pb-4">
        <div className="mb-3">
          <Button variant="ghost" asChild className="px-0 hover:bg-transparent">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Link>
          </Button>
        </div>
        {article.category ? (
          <Badge className="mb-3">{article.category}</Badge>
        ) : null}
        <h1 className="mb-3 text-3xl font-bold leading-tight text-fg md:text-4xl">
          {article.title}
        </h1>
        <div className="mb-3 flex items-center gap-2 text-sm text-fg-muted">
          <UserIcon className="h-3 w-3" />
          <span>{article.authorId}</span>
          <span>·</span>
          <span>更新于 {formatDate(article.updatedAt)}</span>
          <span>· {timeAgo(article.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
          <span>
            <Clock className="mr-1 inline h-3 w-3" />
            约 {minutes} 分钟阅读
          </span>
          <span>
            <Eye className="mr-1 inline h-3 w-3" />
            {article.views} 次阅读
          </span>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-7 px-2">
            <Share2 className="mr-1 h-3 w-3" /> 分享
          </Button>
        </div>
        {article.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                #{t}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      {/* ArticleViewer 主体 */}
      <ArticleViewer
        content={article.content}
        format={article.format}
        contentTheme={resolveContentTheme(article.contentTheme)}
        showToc
        showProgress
      />

      {/* 相关文章 */}
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-3xl px-4">
          <h2 className="mb-4 text-lg font-semibold text-fg">相关文章</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((a) => (
              <Link key={a.id} to={`/article/${a.slug}`} className="group">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <h3 className="line-clamp-2 text-sm font-medium text-fg transition-colors group-hover:text-primary">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs text-fg-muted">{formatDate(a.updatedAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 邮件订阅 + CTA */}
      <section className="mx-auto mt-12 max-w-3xl px-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* CTA 钩子 */}
          {article.cta && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <Badge className="mb-2">
                {article.cta.type === 'leadmagnet'
                  ? '免费下载'
                  : article.cta.type === 'affiliate'
                    ? '推荐'
                    : article.cta.type === 'newsletter'
                      ? '订阅'
                      : '推荐'}
              </Badge>
              <h3 className="text-lg font-semibold text-fg">{article.cta.label}</h3>
              {article.cta.description && (
                <p className="mt-1 text-sm text-fg-muted">{article.cta.description}</p>
              )}
              <a
                href={article.cta.url ?? '#'}
                target={article.cta.type === 'affiliate' ? '_blank' : undefined}
                rel={article.cta.type === 'affiliate' ? 'noopener noreferrer' : undefined}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {article.cta.type === 'affiliate' ? '查看推荐' : '立即获取'} →
              </a>
            </div>
          )}

          {/* Newsletter */}
          <NewsletterForm
            source="article"
            articleId={article.id}
            title="订阅每周精选"
            subtitle="免费，每周只发干货"
          />
        </div>
      </section>
    </div>
  );
}
