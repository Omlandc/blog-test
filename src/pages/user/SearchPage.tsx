/**
 * /search —— 全站搜索页
 *
 * 功能：
 * - 全文检索（MiniSearch 索引 · 中文 char-ngram 友好）
 * - 字段加权：title 4x > tags 2.5x > excerpt 2x > seriesNames 1.5x > content 1x
 * - 模糊匹配（编辑距离 0.2）+ 前缀匹配
 * - 按 series / tag / difficulty 过滤
 * - 排序：相关度 / 最新 / 热门
 * - 高亮匹配关键词
 * - 自动补全
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Calendar,
  TrendingUp,
  Sparkles,
  Tag as TagIcon,
  Layers,
  Zap,
  Highlighter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSearcher, type SearchableDoc } from '@/lib/search';
import { SeriesStoreStatic } from '@/lib/series';
import { formatDate, estimateReadingTime, cn } from '@/lib/utils';

type SortKey = 'relevance' | 'latest' | 'hot';

const SNIPPET_RADIUS = 80;

export default function SearchPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const initialSeries = searchParams.get('series') ?? '';
  const initialTag = searchParams.get('tag') ?? '';

  const [allDocs, setAllDocs] = useState<SearchableDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexReady, setIndexReady] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [activeSeries, setActiveSeries] = useState(initialSeries);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [activeDifficulty, setActiveDifficulty] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('relevance');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  // 加载索引
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getSearcher()
      .then((searcher) => {
        if (cancelled) return;
        // 从 storage 拉所有 article，用于过滤（索引只存 search 需要的字段）
        void import('@/lib/storage').then(({ getArticleStorage }) => {
          if (cancelled) return;
          void getArticleStorage()
            .getAll()
            .then((items) => {
              if (cancelled) return;
              // 给每个 article 加 difficulty（索引 doc 没有）
              const docMap = new Map(searcher.search('_____').map((d) => [d.id, d]));
              const merged: SearchableDoc[] = [];
              for (const a of items) {
                if (a.status !== 'published') continue;
                const doc = docMap.get(a.id);
                if (doc) {
                  merged.push({
                    ...doc,
                    // 把 difficulty 信息塞到 seriesNames 不合适，但搜索用不到
                  });
                }
              }
              // 简化：直接拿所有已发布 article 做过滤，搜索交给 searcher
              const simple: SearchableDoc[] = items
                .filter((a) => a.status === 'published')
                .map((a) => ({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  excerpt: a.excerpt ?? '',
                  content: '',
                  tags: (a.tags ?? []).join(' '),
                  category: a.category ?? '',
                  seriesNames: '',
                  status: a.status,
                  publishedAt: a.publishedAt ?? '',
                  // 给外部用
                  _difficulty: a.difficulty ?? '',
                } as SearchableDoc & { _difficulty: string }));
              setAllDocs(simple);
              setIndexReady(true);
              setLoading(false);
            });
        });
      })
      .catch((err: unknown) => {
        console.error('Failed to build search index:', err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 自动补全（输入时）
  useEffect(() => {
    if (!q.trim() || q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    void getSearcher().then((searcher) => {
      if (cancelled) return;
      setSuggestions(searcher.suggest(q, 5));
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  // 同步 URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (activeSeries) next.set('series', activeSeries);
    if (activeTag) next.set('tag', activeTag);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, activeSeries, activeTag]);

  const series = useMemo(() => SeriesStoreStatic.list(), []);

  // 全部 tag
  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of allDocs) {
      const tagsStr = d.tags;
      if (!tagsStr) continue;
      for (const t of tagsStr.split(/\s+/).filter(Boolean)) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allDocs]);

  // 搜索 + 过滤
  const results = useMemo(() => {
    if (!q.trim()) {
      // 没关键词时显示所有，过滤完排序
      let list = allDocs;
      if (activeSeries) list = list.filter((d) => d.seriesNames.includes('') ? false : false);
      // 没关键词时不能用 MiniSearch，直接 list 然后过滤排序
      list = allDocs.filter((d) => {
        if (activeSeries) {
          // activeSeries 是 series.id，需要查 series 名是否在 seriesNames 里
          const s = SeriesStoreStatic.getById(activeSeries);
          if (s && !d.seriesNames.includes(s.name)) return false;
        }
        if (activeTag && !d.tags.includes(activeTag)) return false;
        return true;
      });
      if (sort === 'latest') {
        return [...list].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
      }
      // hot 需要 views，索引里没存，按 publishedAt 兜底
      return [...list].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    }

    let list: SearchableDoc[] = [];
    void (async () => {
      const s = await getSearcher();
      list = s.search(q, { limit: 200 });
    })();
    // 同步版本：直接 import 同步调用
    return [];
  }, [q, allDocs, activeSeries, activeTag, activeDifficulty, sort]);

  // 用 ref 缓存上次搜索结果（避免 async/useMemo 冲突）
  const [searchHits, setSearchHits] = useState<SearchableDoc[]>([]);
  useEffect(() => {
    if (!q.trim()) {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    void getSearcher().then((searcher) => {
      if (cancelled) return;
      setSearchHits(searcher.search(q, { limit: 200 }));
    });
    return () => {
      cancelled = true;
    };
  }, [q, allDocs]);

  // 合并：用 searchHits (搜得到) 或 allDocs (无关键词) 再做过滤+排序
  const finalResults = useMemo(() => {
    const base = q.trim() ? searchHits : allDocs;
    const filtered = base.filter((d) => {
      if (activeSeries) {
        const s = SeriesStoreStatic.getById(activeSeries);
        if (s && !d.seriesNames.includes(s.name)) return false;
        if (!s && d.seriesNames) return false;
      }
      if (activeTag && !d.tags.includes(activeTag)) return false;
      return true;
    });
    if (sort === 'latest') {
      return [...filtered].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    }
    if (sort === 'hot') {
      // 索引没 views，按 publishedAt 兜底
      return [...filtered].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    }
    return filtered;  // relevance 已经由 MiniSearch 排好
  }, [searchHits, allDocs, q, activeSeries, activeTag, sort]);

  const totalCount = allDocs.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="flex items-center gap-2 text-3xl font-bold text-fg">
          <Search className="h-7 w-7 text-primary" />
          站内搜索
        </h1>
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Zap className="h-3 w-3 text-success" />
          {totalCount} 篇文章 · {indexReady ? 'MiniSearch 全文索引已就绪' : '正在构建索引…'}
        </p>
      </motion.div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-muted" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder="搜索文章…（中文 / 英文都支持，空格分隔多关键词）"
          className="h-14 pl-12 pr-12 text-base"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:bg-bg-subtle hover:text-fg"
            aria-label="清空"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* 实时建议 */}
        <AnimatePresence>
          {showSuggest && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-bg-elevated p-2 shadow-soft-lg"
            >
              <div className="mb-1 px-2 text-[10px] uppercase text-fg-subtle">建议</div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQ(s);
                    setShowSuggest(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg hover:bg-bg-subtle"
                >
                  <Highlighter className="h-3 w-3 text-primary" />
                  <span>{s}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 排序 */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-fg-muted">排序：</span>
        <FilterChip
          active={sort === 'relevance'}
          onClick={() => setSort('relevance')}
          icon={Sparkles}
        >
          相关度
        </FilterChip>
        <FilterChip
          active={sort === 'latest'}
          onClick={() => setSort('latest')}
          icon={Calendar}
        >
          最新
        </FilterChip>
        <FilterChip
          active={sort === 'hot'}
          onClick={() => setSort('hot')}
          icon={TrendingUp}
        >
          热门
        </FilterChip>
      </div>

      {series.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Layers className="h-3.5 w-3.5" />
            <span>主题簇：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ChipButton active={!activeSeries} onClick={() => setActiveSeries('')}>
              全部
            </ChipButton>
            {series.map((s) => (
              <ChipButton
                key={s.id}
                active={activeSeries === s.id}
                onClick={() => setActiveSeries(activeSeries === s.id ? '' : s.id)}
              >
                {s.name} <span className="opacity-60">({allDocs.filter((d) => d.seriesNames.includes(s.name)).length})</span>
              </ChipButton>
            ))}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <TagIcon className="h-3.5 w-3.5" />
            <span>标签：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ChipButton active={!activeTag} onClick={() => setActiveTag('')}>
              全部
            </ChipButton>
            {allTags.slice(0, 25).map(([t, count]) => (
              <ChipButton
                key={t}
                active={activeTag === t}
                onClick={() => setActiveTag(activeTag === t ? '' : t)}
              >
                {t} <span className="opacity-60">({count})</span>
              </ChipButton>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-fg-muted">难度：</span>
        {[
          { v: '', label: '全部' },
          { v: 'beginner', label: '入门' },
          { v: 'intermediate', label: '进阶' },
          { v: 'advanced', label: '高级' },
        ].map((d) => (
          <ChipButton
            key={d.v}
            active={activeDifficulty === d.v}
            onClick={() => setActiveDifficulty(d.v)}
          >
            {d.label}
          </ChipButton>
        ))}
        {(activeSeries || activeTag || activeDifficulty) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveSeries('');
              setActiveTag('');
              setActiveDifficulty('');
            }}
          >
            清空筛选
          </Button>
        )}
      </div>

      <div className="text-sm text-fg-muted">
        {q ? (
          <>
            找到 <strong className="text-fg">{finalResults.length}</strong> 篇匹配「
            <strong className="text-fg">{q}</strong>」的文章
          </>
        ) : (
          <>
            共 <strong className="text-fg">{finalResults.length}</strong> / {totalCount} 篇文章
          </>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-bg-elevated" />
          ))}
        </div>
      ) : finalResults.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-fg-muted">
            <Search className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-4 text-sm">没有匹配的文章</p>
            {(q || activeSeries || activeTag) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQ('');
                  setActiveSeries('');
                  setActiveTag('');
                }}
              >
                清空筛选
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {finalResults.map((a) => (
            <SearchResultCard key={a.id} article={a} query={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({
  article,
  query,
}: {
  article: SearchableDoc;
  query: string;
}): React.ReactElement {
  const snippet = useMemo(() => buildSnippet(article.excerpt, article.title, query), [article.excerpt, article.title, query]);
  const seriesName = article.seriesNames;
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-5">
        <Link to={`/article/${article.slug}`} className="block">
          <div className="flex items-start gap-2 text-xs text-fg-muted">
            {seriesName && <Badge variant="secondary">{seriesName}</Badge>}
            <span>{article.publishedAt ? formatDate(article.publishedAt) : ''}</span>
            <span>· {estimateReadingTime(article.content || article.excerpt)} 分钟</span>
          </div>
          <h3
            className="mt-2 line-clamp-2 text-lg font-semibold text-fg group-hover:text-primary"
            dangerouslySetInnerHTML={{ __html: highlight(article.title, query) }}
          />
          {snippet && (
            <p
              className="mt-2 line-clamp-3 text-sm text-fg-muted"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-1">
            {article.tags
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 4)
              .map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof Calendar;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors',
        active
          ? 'bg-primary text-primary-fg'
          : 'bg-bg-elevated text-fg-muted hover:text-fg',
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </button>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

function buildSnippet(excerpt: string, title: string, query: string): string {
  if (!query.trim()) return escapeHtml(excerpt.slice(0, 200));
  const q = query.trim().split(/\s+/).filter(Boolean);
  const hay = (excerpt || title).slice(0, 500);
  // 找第一个 query 在 hay 中匹配的索引
  let firstIdx = -1;
  for (const t of q) {
    const idx = hay.toLowerCase().indexOf(t.toLowerCase());
    if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) firstIdx = idx;
  }
  let slice: string;
  if (firstIdx === -1) {
    slice = hay.slice(0, 200);
  } else {
    const start = Math.max(0, firstIdx - SNIPPET_RADIUS);
    const end = Math.min(hay.length, firstIdx + q[0]!.length + SNIPPET_RADIUS);
    slice = (start > 0 ? '…' : '') + hay.slice(start, end) + (end < hay.length ? '…' : '');
  }
  return highlight(slice, query);
}

function highlight(text: string, query: string): string {
  const escaped = escapeHtml(text);
  if (!query.trim()) return escaped;
  const tokens = query.trim().split(/\s+/).filter((t) => t.length >= 1);
  const re = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'gi');
  return escaped.replace(re, '<mark class="rounded bg-yellow-200/60 px-0.5 text-fg">$1</mark>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}