/**
 * 管理后台 /admin/articles —— 文章列表管理
 *
 * 功能：表格/卡片视图切换、状态/标签/分类筛选、关键词搜索、
 *       排序、批量操作、单条编辑/删除/预览、分页。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ChevronUp,
  ChevronDown,
  FileText,
  Eye,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { getArticleStorage } from '@/lib/storage';
import type { Article } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';

type SortKey = 'createdAt' | 'updatedAt' | 'views' | 'title';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 10;

export default function AdminArticlesPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>(
    'all',
  );
  const [tagFilter, setTagFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState<number>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [bulkDelete, setBulkDelete] = useState<boolean>(false);

  const load = useCallback(() => {
    setLoading(true);
    const storage = getArticleStorage();
    void storage.getAll().then((items) => {
      setArticles(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = getArticleStorage().subscribe(() => load());
    return () => {
      unsubscribe();
    };
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (tagFilter && !a.tags.includes(tagFilter)) return false;
      if (q) {
        const hay = `${a.title} ${a.excerpt} ${a.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, search, statusFilter, tagFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      switch (sortKey) {
        case 'title':
          av = a.title;
          bv = b.title;
          break;
        case 'views':
          av = a.views;
          bv = b.views;
          break;
        case 'createdAt':
          av = a.createdAt;
          bv = b.createdAt;
          break;
        case 'updatedAt':
        default:
          av = a.updatedAt;
          bv = b.updatedAt;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, tagFilter]);

  const toggleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }): React.ReactElement | null => {
    if (sortKey !== k) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ChevronDown className="inline h-3 w-3" />
    );
  };

  const toggleSelectAll = (): void => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string): void => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    await getArticleStorage().delete(deleteTarget.id);
    setDeleteTarget(null);
    toast.show('已删除', { description: deleteTarget.title });
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(deleteTarget.id);
      return n;
    });
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selected.size === 0) return;
    const storage = getArticleStorage();
    await Promise.all(Array.from(selected).map((id) => storage.delete(id)));
    toast.show('已批量删除', { description: `${selected.size} 篇文章` });
    setSelected(new Set());
    setBulkDelete(false);
  };

  const handleBulkPublish = async (): Promise<void> => {
    if (selected.size === 0) return;
    const storage = getArticleStorage();
    await Promise.all(
      Array.from(selected).map((id) => storage.update(id, { status: 'published' })),
    );
    toast.show('已批量发布', { description: `${selected.size} 篇文章` });
    setSelected(new Set());
  };

  const stats = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((a) => a.status === 'published').length,
      drafts: articles.filter((a) => a.status === 'draft').length,
      views: articles.reduce((sum, a) => sum + a.views, 0),
    }),
    [articles],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">文章管理</h1>
          <p className="text-sm text-fg-muted">
            共 {stats.total} 篇 · 已发布 {stats.published} · 草稿 {stats.drafts}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-bg-elevated p-0.5">
            <button
              onClick={() => setView('table')}
              className={cn(
                'rounded p-1.5 transition-colors',
                view === 'table' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
              )}
              aria-label="表格视图"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('cards')}
              className={cn(
                'rounded p-1.5 transition-colors',
                view === 'cards' ? 'bg-primary text-primary-fg' : 'text-fg-muted',
              )}
              aria-label="卡片视图"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button asChild>
            <Link to="/admin/articles/new">
              <Plus className="h-4 w-4" /> 新建文章
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <Input
                placeholder="搜索标题、内容、摘要..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-elevated p-2">
              {(['all', 'published', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-colors',
                    statusFilter === s
                      ? 'bg-primary text-primary-fg'
                      : 'text-fg-muted hover:text-fg hover:bg-bg-subtle',
                  )}
                >
                  {s === 'all' ? '全部' : s === 'published' ? '已发布' : '草稿'}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-elevated p-2">
                <Filter className="ml-1 h-3 w-3 text-fg-muted" />
                <button
                  onClick={() => setTagFilter('')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-colors',
                    !tagFilter ? 'bg-primary text-primary-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-subtle',
                  )}
                >
                  全部标签
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTagFilter(t)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      tagFilter === t
                        ? 'bg-primary text-primary-fg'
                        : 'text-fg-muted hover:text-fg hover:bg-bg-subtle',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-2"
        >
          <span className="text-sm text-fg">已选中 {selected.size} 篇</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkPublish}>
              批量发布
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkDelete(true)}
              className="text-danger"
            >
              <Trash2 className="h-4 w-4" /> 批量删除
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              取消
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-bg-elevated"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-fg-muted" />
            <p className="text-fg-muted">没有匹配的文章</p>
            <Button className="mt-4" asChild>
              <Link to="/admin/articles/new">写第一篇</Link>
            </Button>
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-bg-elevated text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === paged.length && paged.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('title')}>
                      标题 <SortIcon k="title" />
                    </th>
                    <th className="px-4 py-3">标签</th>
                    <th className="px-4 py-3">格式</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('views')}>
                      浏览 <SortIcon k="views" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3"
                      onClick={() => toggleSort('updatedAt')}
                    >
                      更新时间 <SortIcon k="updatedAt" />
                    </th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paged.map((a, idx) => (
                      <motion.tr
                        key={a.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.02 } }}
                        exit={{ opacity: 0 }}
                        className="border-b border-border last:border-0 hover:bg-bg-elevated"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(a.id)}
                            onChange={() => toggleSelectOne(a.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/articles/${a.id}/edit`}
                            className="font-medium text-fg hover:text-primary"
                          >
                            {a.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {a.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              a.format === 'html'
                                ? 'inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning'
                                : 'inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary'
                            }
                            title={a.format === 'html' ? 'HTML 格式' : 'Markdown 格式'}
                          >
                            {a.format === 'html' ? 'HTML' : 'MD'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={a.status === 'published' ? 'default' : 'outline'}
                          >
                            {a.status === 'published' ? '已发布' : '草稿'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-muted">
                          <Eye className="mr-1 inline h-3 w-3" />
                          {a.views}
                        </td>
                        <td className="px-4 py-3 text-fg-muted">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {formatDate(a.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {a.status === 'published' && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={`/article/${a.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admin/articles/${a.id}/edit`}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(a)}
                              className="text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {paged.map((a, idx) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.03 } }}
                exit={{ opacity: 0 }}
              >
                <Card className="overflow-hidden">
                  {a.cover && (
                    <div className="aspect-[5/2] overflow-hidden bg-bg-elevated">
                      <img
                        src={a.cover}
                        alt={a.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant={a.status === 'published' ? 'default' : 'outline'}
                      >
                        {a.status === 'published' ? '已发布' : '草稿'}
                      </Badge>
                      <span className="text-xs text-fg-muted">
                        <Eye className="mr-0.5 inline h-3 w-3" />
                        {a.views}
                      </span>
                    </div>
                    <Link
                      to={`/admin/articles/${a.id}/edit`}
                      className="mb-1 line-clamp-2 text-base font-semibold text-fg hover:text-primary"
                    >
                      {a.title}
                    </Link>
                    <p className="line-clamp-2 text-sm text-fg-muted">{a.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
                      <span>{formatDate(a.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/articles/${a.id}/edit`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(a)}
                          className="text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
            第 {page} / {totalPages} 页 · 共 {sorted.length} 篇
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

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文章</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteTarget?.title}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDelete} onOpenChange={setBulkDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量删除</DialogTitle>
            <DialogDescription>
              确定要删除选中的 {selected.size} 篇文章吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBulkDelete(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              全部删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
