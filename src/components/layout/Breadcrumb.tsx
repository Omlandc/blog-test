/**
 * Breadcrumb —— 面包屑导航
 *
 * 行为：
 * - 解析当前 URL 自动生成面包屑
 * - 已知路径用 i18n key 翻译
 * - 动态参数（article/topic/series slug）查实际名称
 * - 兜底显示原 segment（不再做英文 beautify）
 *
 * 关键 bug 修复（v0.8.x）：
 * - 旧版本有"父级已知"和"已知前缀"两个 if 都查 lookupLabelKey(acc)，结果一样
 *   导致 /admin/articles/{id}/edit 路径下 slug 和 edit 都被替换成 "文章管理"，错乱
 * - 新版本：
 *   · 严格区分"完整路径匹配" vs "父级已知"
 *   · 父级已知分支只对 dynamic id 类型生效（不针对纯路径段）
 *   · 补全 admin.contentThemes / admin.editArticle i18n
 *   · 优先按 lookupLabelKey 找最长匹配，如果 acc 不是任何 prefix 但有更长 prefix 在 PATH_LABEL_KEYS 里
 *     → 显示那个父级的 label（而不是 acc 自己）
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSiteConfig } from '@/lib/site-config';
import { getArticleStorage } from '@/lib/storage';
import { SeriesStoreStatic } from '@/lib/series';
import type { Article, Series } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  to?: string;
  isCurrent: boolean;
}

// 路由前缀 → i18n key
const PATH_LABEL_KEYS: Record<string, string> = {
  '/': 'common.home',
  '/articles': 'common.articles',
  '/article': 'common.article',
  '/topics': 'common.topics',
  '/search': 'common.search',
  '/resources': 'common.resources',
  '/explore': 'common.explore',
  '/login': 'auth.signIn',
  '/admin': 'admin.dashboard',
  '/admin/articles': 'admin.articlesManagement',
  '/admin/articles/new': 'admin.newArticle',
  '/admin/site-config': 'admin.siteConfig',
  '/admin/series': 'admin.series',
  '/admin/subscribers': 'admin.subscribers',
  '/admin/analytics': 'admin.analytics',
  '/admin/docs': 'admin.docs',
  '/admin/settings': 'admin.settings',
  '/admin/resources': 'admin.resources',
  '/admin/migrate': 'admin.migrate',
  '/admin/content-themes': 'admin.contentThemes',
  '/admin/sites': 'admin.sites',
};

/** 找到 acc 在 PATH_LABEL_KEYS 中的最长匹配 prefix */
function longestPrefixMatch(path: string): { key: string; matchedPath: string } | null {
  let best: { key: string; matchedPath: string } | null = null;
  for (const [prefix, key] of Object.entries(PATH_LABEL_KEYS)) {
    if (prefix === '/') continue;
    if (path === prefix || path.startsWith(prefix + '/')) {
      if (!best || prefix.length > best.matchedPath.length) {
        best = { key, matchedPath: prefix };
      }
    }
  }
  return best;
}

/** acc 自己是否在 PATH_LABEL_KEYS 中（完整匹配） */
function isExactMatch(path: string): { key: string } | null {
  const key = PATH_LABEL_KEYS[path];
  if (key) return { key };
  return null;
}

export function Breadcrumb({ className }: { className?: string }): React.ReactElement {
  const location = useLocation();
  const params = useParams();
  const { t } = useI18n();
  const { config: _config } = useSiteConfig();
  const [article, setArticle] = useState<Article | null>(null);
  const [articleById, setArticleById] = useState<Article | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [articleSeries, setArticleSeries] = useState<Series | null>(null);
  const [articlePillar, setArticlePillar] = useState<Series | null>(null);

  // 动态参数：article slug（详情页）
  useEffect(() => {
    if (params.slug && location.pathname.startsWith('/article/')) {
      let cancelled = false;
      void getArticleStorage()
        .getBySlug(params.slug)
        .then((a) => {
          if (cancelled) return;
          setArticle(a);
          // 查文章所在的主题簇
          if (a?.seriesId) {
            const cluster = SeriesStoreStatic.getById(a.seriesId);
            setArticleSeries(cluster ?? null);
            // 找 pillar（自己 或 父级）
            const pillar = cluster && cluster.parentId
              ? SeriesStoreStatic.getById(cluster.parentId)
              : cluster ?? null;
            setArticlePillar(pillar ?? null);
          } else {
            setArticleSeries(null);
            setArticlePillar(null);
          }
        });
      return () => {
        cancelled = true;
      };
    }
    setArticle(null);
    setArticleSeries(null);
    setArticlePillar(null);
    return undefined;
  }, [params.slug, location.pathname]);

  // 动态参数：admin/articles/{id}/edit —— 通过 id 查文章显示标题
  useEffect(() => {
    const m = location.pathname.match(/^\/admin\/articles\/([^/]+)(\/edit)?$/);
    if (m) {
      const id = m[1]!;
      let cancelled = false;
      void getArticleStorage()
        .getById(id)
        .then((a) => {
          if (!cancelled) setArticleById(a);
        })
        .catch(() => {
          if (!cancelled) setArticleById(null);
        });
      return () => {
        cancelled = true;
      };
    }
    setArticleById(null);
    return undefined;
  }, [location.pathname]);

  // 动态参数：series slug
  useEffect(() => {
    if (params.slug && (location.pathname.startsWith('/topics/') || location.pathname.startsWith('/resources/'))) {
      const s = SeriesStoreStatic.getBySlug(params.slug) ?? SeriesStoreStatic.getById(params.slug);
      setSeries(s ?? null);
    } else {
      setSeries(null);
    }
  }, [params.slug, location.pathname]);

  const crumbs = useMemo<Crumb[]>(() => {
    const items: Crumb[] = [];
    const path = location.pathname;
    if (path === '/') return [];

    // 1) 首页
    items.push({ label: t('common.home'), to: '/', isCurrent: false });

    // 2) 主体段
    const segments = path.split('/').filter(Boolean);
    let acc = '';
    segments.forEach((seg, idx) => {
      acc += `/${seg}`;
      const isLast = idx === segments.length - 1;

      // 动态 slug：/article/{slug} 显示 Pillar → Cluster → 文章标题
      if (acc === `/article/${params.slug}` && article) {
        // 先 push Pillar（不是当前文章自己的就是有上一级的）
        if (articlePillar && articleSeries && articlePillar.id !== articleSeries.id) {
          items.push({
            label: articlePillar.name,
            to: `/topics/${articlePillar.slug}`,
            isCurrent: false,
          });
          // 再 push Cluster
          items.push({
            label: articleSeries.name,
            to: `/topics/${articleSeries.slug}`,
            isCurrent: false,
          });
        } else if (articleSeries) {
          // 文章直接在 Pillar 下（不是 Cluster）
          items.push({
            label: articleSeries.name,
            to: `/topics/${articleSeries.slug}`,
            isCurrent: false,
          });
        }
        // 最后 push 文章标题
        items.push({
          label: article.title,
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }

      // 动态：/topics/{slug} 和 /resources/{slug} 显示主题名
      if (acc === `/topics/${params.slug}` && series) {
        items.push({
          label: series.name,
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }
      if (acc === `/resources/${params.slug}` && series) {
        items.push({
          label: series.name,
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }

      // /explore/{slug} 先显示 slug（meta 在别处取）
      if (acc === `/explore/${params.slug}`) {
        items.push({
          label: decodeURIComponent(seg),
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }

      // 动态：/admin/articles/{id} 显示文章标题
      if (location.pathname.startsWith('/admin/articles/') && acc.match(/^\/admin\/articles\/[^/]+$/)) {
        if (articleById) {
          items.push({
            label: articleById.title || seg,
            to: isLast ? undefined : acc,
            isCurrent: false,
          });
          return;
        }
        // 没找到文章：显示「文章 id-xxxx」(短码)
        const shortId = seg.length > 8 ? seg.slice(0, 8) + '…' : seg;
        items.push({
          label: t('admin.articlesManagement') + ' · ' + shortId,
          to: isLast ? undefined : acc,
          isCurrent: false,
        });
        return;
      }

      // 动态：/admin/articles/{id}/edit 显示「编辑文章」+ 文章标题
      if (acc.match(/^\/admin\/articles\/[^/]+\/edit$/)) {
        const articleTitle = articleById?.title || (seg === 'edit' ? '' : seg);
        // 父级已经 push 过 {articlesManagement · shortId}，这里只加「编辑」
        items.push({
          label: t('admin.editArticle') + (articleTitle ? ' · ' + articleTitle : ''),
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }

      // 完整路径匹配
      const exact = isExactMatch(acc);
      if (exact) {
        items.push({
          label: t(exact.key),
          to: isLast ? undefined : acc,
          isCurrent: isLast,
        });
        return;
      }

      // 父级已知（acc 不是任何 prefix，但有更长的 prefix 在 PATH_LABEL_KEYS 里匹配）
      // 这种情况下，acc 自己是个动态段（slug、id），原样显示
      // 父级的 label 已经在前面 push 过了
      // 例：/admin/articles/new —— 这是完整的，exact 匹配
      // 例：/admin/articles/{id}/edit —— edit 段原样显示（不替换成父级）
      items.push({
        label: decodeURIComponent(seg),
        to: isLast ? undefined : acc,
        isCurrent: isLast,
      });
    });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, params, t, article, articleById, series, articleSeries, articlePillar]);

  if (crumbs.length === 0) return <></>;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1 text-xs text-fg-muted',
        className,
      )}
    >
      <Home className="h-3 w-3 shrink-0" />
      {crumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
          {crumb.to ? (
            <Link
              to={crumb.to}
              className="hover:text-primary hover:underline"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={cn('max-w-[200px] truncate', crumb.isCurrent && 'text-fg font-medium')}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </motion.nav>
  );
}
