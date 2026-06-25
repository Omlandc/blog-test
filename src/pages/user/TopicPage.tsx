/**
 * TopicPage —— 主题簇详情页（/topics/:slug）
 *
 * 这是细分内容站的核心页面：
 * - Pillar 页：作为"主题索引"，列出该主题下所有文章 + 子分类
 * - 严格内链结构让搜索引擎和 AI 抓取
 * - 类似维基百科的"主题门户"
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FolderTree, BookOpen, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SeriesNav } from '@/components/series/SeriesNav';
import { getSeriesStore } from '@/lib/series';
import { getArticleStorage } from '@/lib/storage';
import type { Series, Article } from '@/lib/types';
import { formatDate, estimateReadingTime } from '@/lib/utils';
import { setMeta, setJsonLd } from '@/lib/seo';

export function TopicPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [children, setChildren] = useState<Series[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [parent, setParent] = useState<Series | null>(null);

  useEffect(() => {
    if (!slug) return;
    const store = getSeriesStore();
    const found = store.getBySlug(slug);
    if (!found) {
      setSeries(null);
      return;
    }
    setSeries(found);
    setChildren(store.getChildren(found.id));
    if (found.parentId) {
      setParent(store.getById(found.parentId) ?? null);
    } else {
      setParent(null);
    }

    void getArticleStorage().getAll().then((all) => {
      const related = all
        .filter(
          (a) =>
            a.seriesId === found.id && a.status === 'published',
        )
        .sort((a, b) => b.publishedAt?.localeCompare(a.publishedAt ?? '') ?? 0);
      setArticles(related);
    });
  }, [slug]);

  // SEO meta + JSON-LD
  useEffect(() => {
    if (!series) return;
    setMeta({
      title: `${series.name} - ${series.tagline ?? ''}`,
      description: series.description,
      canonicalUrl: `${window.location.origin}/topics/${series.slug}`,
      keywords: series.keywords,
      noai: !series.isPillar, // pillar 允许 AI 抓，子分类可选
      noimageai: false,
      ogType: 'website',
      ogImage: series.cover,
    });
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: series.name,
      description: series.description,
      url: `${window.location.origin}/topics/${series.slug}`,
      hasPart: articles.map((a) => ({
        '@type': 'Article',
        headline: a.title,
        url: `${window.location.origin}/article/${a.slug}`,
        datePublished: a.publishedAt,
      })),
    });
    return () => {
      setMeta({ title: '博客系统' });
    };
  }, [series, articles]);

  if (!series) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-fg">主题不存在</h1>
        <p className="mt-2 text-fg-muted">找不到 slug 为 "{slug}" 的主题</p>
        <Button className="mt-4" asChild>
          <Link to="/topics">浏览全部主题</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article>
          {/* Hero */}
          {series.cover && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img src={series.cover} alt={series.name} className="w-full" />
            </div>
          )}

          <Badge className="mb-3">
            <FolderTree className="mr-1 h-3 w-3" /> 主题簇
          </Badge>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{series.name}</h1>
          {series.tagline && (
            <p className="mt-2 text-lg text-fg-muted">{series.tagline}</p>
          )}
          <div className="prose prose-slate dark:prose-invert mt-4 max-w-none text-fg">
            <p>{series.description}</p>
          </div>

          {/* 子分类 */}
          {children.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-fg">子分类</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {children.map((c) => (
                  <Link key={c.id} to={`/topics/${c.slug}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-fg">{c.name}</h3>
                            {c.tagline && (
                              <p className="mt-0.5 text-xs text-fg-muted">{c.tagline}</p>
                            )}
                          </div>
                          <ArrowLeft className="h-4 w-4 rotate-180 text-fg-muted" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 文章列表 */}
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-fg">
              <BookOpen className="h-5 w-5" />
              {series.name}下的文章（{articles.length}）
            </h2>
            {articles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-fg-muted">
                  该主题下还没有文章
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {articles.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link to={`/article/${a.slug}`}>
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold text-fg hover:text-primary">
                            {a.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
                            {a.excerpt}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
                            <span>
                              <Clock className="mr-0.5 inline h-3 w-3" />
                              {estimateReadingTime(a.content)} 分钟
                            </span>
                            <span>
                              <Eye className="mr-0.5 inline h-3 w-3" />
                              {a.views}
                            </span>
                            <span>{formatDate(a.publishedAt ?? a.updatedAt)}</span>
                            {a.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                {a.difficulty === 'beginner'
                                  ? '入门'
                                  : a.difficulty === 'intermediate'
                                    ? '进阶'
                                    : '高级'}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </article>

        {/* 侧边栏 */}
        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <SeriesNav activeSeriesId={series.id} />
        </aside>
      </div>
    </div>
  );
}

/** Topic 索引页 /topics */
export function TopicsIndexPage(): React.ReactElement {
  const [pillars, setPillars] = useState<Series[]>([]);
  const [childrenByPillar, setChildrenByPillar] = useState<Record<string, Series[]>>({});

  useEffect(() => {
    const store = getSeriesStore();
    const p = store.getPillars();
    setPillars(p);
    const map: Record<string, Series[]> = {};
    p.forEach((pillar) => {
      map[pillar.id] = store.getChildren(pillar.id);
    });
    setChildrenByPillar(map);
  }, []);

  useEffect(() => {
    setMeta({
      title: '全部主题 - 主题簇导航',
      description: '按主题浏览所有文章',
    });
    return () => setMeta({ title: '博客系统' });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-fg sm:text-4xl">全部主题</h1>
      <p className="mb-8 text-fg-muted">
        按主题簇浏览。每个主题是一个"Pillar"，往下细分 Cluster 与具体文章。
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to={`/topics/${pillar.slug}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                {pillar.cover && (
                  <div className="aspect-[4/1] overflow-hidden bg-bg-elevated">
                    <img src={pillar.cover} alt={pillar.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold text-fg">{pillar.name}</h2>
                  {pillar.tagline && (
                    <p className="mt-1 text-sm text-fg-muted">{pillar.tagline}</p>
                  )}
                  {childrenByPillar[pillar.id]?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {childrenByPillar[pillar.id].map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}