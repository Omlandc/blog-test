/**
 * /admin/series —— 主题簇管理（Pillar + Cluster）
 *
 * 借鉴细分内容站的核心架构：
 * Pillar（支柱页）→ Cluster（子分类）→ Article（具体文章）
 * 管理这两个层级的元数据（名称、描述、长尾关键词、是否 Pillar）
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  FolderTree,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { getSeriesStore } from '@/lib/series';
import type { Series } from '@/lib/types';

interface FormState {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  parentId: string;
  order: number;
  keywords: string;
  isPillar: boolean;
}

const EMPTY_FORM: FormState = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  parentId: '',
  order: 0,
  keywords: '',
  isPillar: false,
};

export default function AdminSeriesPage(): React.ReactElement {
  const [items, setItems] = useState<Series[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Series | null>(null);
  useEffect(() => {
    const store = getSeriesStore();
    setItems(store.getAll());
    return store.subscribe(setItems);
  }, []);

  const pillars = useMemo(() => items.filter((s) => !s.parentId), [items]);
  const childrenByParent = useMemo(() => {
    const map: Record<string, Series[]> = {};
    items.forEach((s) => {
      if (s.parentId) {
        if (!map[s.parentId]) map[s.parentId] = [];
        map[s.parentId].push(s);
      }
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [items]);

  const openCreate = (parentId: string = ''): void => {
    setForm({ ...EMPTY_FORM, parentId });
    setDialogOpen(true);
  };

  const openEdit = (s: Series): void => {
    setForm({
      id: s.id,
      slug: s.slug,
      name: s.name,
      tagline: s.tagline ?? '',
      description: s.description,
      parentId: s.parentId ?? '',
      order: s.order,
      keywords: (s.keywords ?? []).join(', '),
      isPillar: s.isPillar ?? false,
    });
    setDialogOpen(true);
  };

  const handleSave = (): void => {
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name || !slug) {
      toast.show('错误', { description: '名称和 slug 不能为空' });
      return;
    }
    const payload: Omit<Series, 'id' | 'createdAt' | 'updatedAt'> = {
      slug,
      name,
      tagline: form.tagline.trim() || undefined,
      description: form.description.trim(),
      parentId: form.parentId || undefined,
      order: form.order,
      keywords: form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      isPillar: !form.parentId ? form.isPillar : false,
    };
    const store = getSeriesStore();
    if (form.id) {
      store.update(form.id, payload);
      toast.show('已更新', { description: name });
    } else {
      store.create(payload);
      toast.show('已创建', { description: name });
    }
    setDialogOpen(false);
  };

  const handleDelete = (): void => {
    if (!deleteTarget) return;
    getSeriesStore().delete(deleteTarget.id);
    toast.show('已删除', { description: deleteTarget.name });
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">主题簇管理</h1>
          <p className="text-sm text-fg-muted">
            Pillar → Cluster → Article 三级架构，让搜索引擎和 AI 都把你当答案
          </p>
        </div>
        <Button onClick={() => openCreate('')}>
          <Plus className="h-4 w-4" /> 新建 Pillar
        </Button>
      </div>

      {/* Pillar 列表 */}
      {pillars.map((pillar) => (
        <Card key={pillar.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge>
                    <FolderTree className="mr-1 h-3 w-3" /> Pillar
                  </Badge>
                  <CardTitle>{pillar.name}</CardTitle>
                  {pillar.isPillar && (
                    <Badge variant="secondary">isPillar</Badge>
                  )}
                </div>
                {pillar.tagline && (
                  <CardDescription className="mt-1">{pillar.tagline}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/topics/${pillar.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(pillar)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(pillar)}
                  className="text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-fg-muted">{pillar.description}</p>
            {pillar.keywords && pillar.keywords.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {pillar.keywords.map((k) => (
                  <Badge key={k} variant="outline" className="text-xs">
                    {k}
                  </Badge>
                ))}
              </div>
            )}

            {/* 子分类 */}
            {childrenByParent[pillar.id] && childrenByParent[pillar.id].length > 0 && (
              <div className="mt-4 space-y-2 border-l-2 border-border pl-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-fg-muted">
                    子分类 ({childrenByParent[pillar.id].length})
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openCreate(pillar.id)}
                  >
                    <Plus className="h-3 w-5" />
                  </Button>
                </div>
                {childrenByParent[pillar.id].map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 rounded-md border border-border p-2"
                  >
                    <ChevronRight className="h-4 w-4 text-fg-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{c.name}</p>
                      {c.tagline && (
                        <p className="truncate text-xs text-fg-muted">{c.tagline}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/topics/${c.slug}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(c)}
                      className="text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? '编辑主题' : '新建主题'}</DialogTitle>
            <DialogDescription>
              主题是 SEO 架构的核心。每个主题作为一个 Pillar 或 Cluster。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">名称 *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="技术架构"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">
                  Slug *
                </label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="tech"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">副标题</label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="把代码做成系统，把系统做成产品"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">
                长描述（用于 pillar page SEO）
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="从单个组件到完整架构..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">
                长尾关键词（逗号分隔）
              </label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="架构, TypeScript, 系统设计, 可插拔"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">
                  父主题（空 = Pillar）
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
                >
                  <option value="">(无 - 作为 Pillar)</option>
                  {pillars
                    .filter((p) => p.id !== form.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">
                  排序
                </label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            {!form.parentId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPillar}
                  onChange={(e) => setForm({ ...form, isPillar: e.target.checked })}
                  className="rounded"
                />
                <span className="text-fg">作为 Pillar（Sitemap 优先级提升）</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>{form.id ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除主题</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteTarget?.name}」吗？子主题会被一并删除。
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
    </div>
  );
}