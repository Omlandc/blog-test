/**
 * 管理后台 Dashboard /admin
 *
 * 统计卡片（动画数字）+ 最近文章 + 快速入口
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  FileEdit,
  Eye,
  Plus,
  Settings,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getArticleStorage } from '@/lib/storage';
import type { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

function AnimatedNumber({ value }: { value: number }): React.ReactElement {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);
  return <motion.span>{rounded}</motion.span>;
}

export default function AdminDashboardPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    void getArticleStorage().getAll().then(setArticles);
  }, []);

  const stats = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((a) => a.status === 'published').length,
      drafts: articles.filter((a) => a.status === 'draft').length,
      views: articles.reduce((sum, a) => sum + a.views, 0),
    }),
    [articles],
  );

  const recent = useMemo(
    () =>
      [...articles]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [articles],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">
          仪表盘{user ? ` · ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          欢迎回来。这是你的博客内容概览。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: '总文章数',
            value: stats.total,
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: '已发布',
            value: stats.published,
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: '草稿',
            value: stats.drafts,
            icon: FileEdit,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          {
            label: '总浏览量',
            value: stats.views,
            icon: Eye,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-fg-muted">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold text-fg">
                      <AnimatedNumber value={s.value} />
                    </p>
                  </div>
                  <div className={cn(s.bg, 'rounded-lg p-2')}>
                    <s.icon className={cn(s.color, 'h-5 w-5')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 快速入口 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/admin/articles/new"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">写新文章</p>
              <p className="mt-1 text-sm text-fg-muted">用 Markdown 创作</p>
            </div>
            <Plus className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/articles"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">管理文章</p>
              <p className="mt-1 text-sm text-fg-muted">列表 · 筛选 · 批量</p>
            </div>
            <ArrowRight className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/settings"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">主题与账号</p>
              <p className="mt-1 text-sm text-fg-muted">外观 · 切换演示用户</p>
            </div>
            <Settings className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/series"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">主题簇管理</p>
              <p className="mt-1 text-sm text-fg-muted">Pillar · Cluster</p>
            </div>
            <FileText className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/analytics"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">流量分析</p>
              <p className="mt-1 text-sm text-fg-muted">来源 · 转化 · 热门</p>
            </div>
            <Settings className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/subscribers"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">订阅者</p>
              <p className="mt-1 text-sm text-fg-muted">邮件列表 · 私域兑底</p>
            </div>
            <Users className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/site-config"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">站点身份与定位</p>
              <p className="mt-1 text-sm text-fg-muted">复用到任何细分主题</p>
            </div>
            <Settings className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
        <Link
          to="/admin/docs"
          className="group rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-fg">系统文档</p>
              <p className="mt-1 text-sm text-fg-muted">使用说明 · 运营 · SEO · 更新日志</p>
            </div>
            <FileText className="h-5 w-5 text-fg-muted transition-colors group-hover:text-primary" />
          </div>
        </Link>
      </div>

      {/* 最近文章 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>最近文章</CardTitle>
            <CardDescription>按更新时间倒序</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/articles">
              查看全部 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-fg-muted">还没有文章</div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-bg-elevated"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/articles/${a.id}/edit`}
                      className="block truncate text-sm font-medium text-fg hover:text-primary"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                      <span>{formatDate(a.updatedAt)}</span>
                      <Badge
                        variant={a.status === 'published' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {a.status === 'published' ? '已发布' : '草稿'}
                      </Badge>
                      <span>
                        <TrendingUp className="mr-0.5 inline h-3 w-3" />
                        {a.views}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(' ');
}
