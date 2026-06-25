/**
 * /admin/resources —— 资源导航管理
 *
 * 功能：
 * - 列表 / 编辑 / 删除 / 新增
 * - 一键切换 featured
 * - 拖动排序（同分类内）
 * - 导入/导出 JSON（与其他模块一致）
 * - 一键跳转原站
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Star,
  ExternalLink,
  Save,
  X,
  Download,
  Upload,
  RotateCcw,
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
import { useLinks, CATEGORY_META, PRICING_META } from '@/lib/links';
import type { LinkEntry, LinkCategory, LinkPricing } from '@/lib/links';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const CATS: LinkCategory[] = ['design', 'dev', 'writing', 'marketing', 'analytics', 'productivity', 'other'];
const PRICINGS: LinkPricing[] = ['free', 'freemium', 'paid'];

export default function AdminResourcesPage(): React.ReactElement {
  const { links, create, update, remove } = useLinks();
  const [editing, setEditing] = useState<LinkEntry | null>(null);
  const [filter, setFilter] = useState<LinkCategory | 'all'>('all');

  const filtered = links.filter((l) => filter === 'all' || l.category === filter);

  const handleSave = (item: LinkEntry): void => {
    if (item.id && links.some((l) => l.id === item.id)) {
      update(item.id, item);
      toast.show('已保存', { description: item.name });
    } else {
      const { id: _id, createdAt: _ca, updatedAt: _ua, clicks: _cl, ...rest } = item;
      void _id;
      void _ca;
      void _ua;
      void _cl;
      const created = create(rest);
      toast.show('已添加', { description: created.name });
    }
    setEditing(null);
  };

  const handleDelete = (id: string, name: string): void => {
    if (!window.confirm(`确定删除「${name}」？此操作不可恢复。`)) return;
    remove(id);
    toast.show('已删除', { description: name });
  };

  const handleNew = (): void => {
    setEditing({
      id: '',
      name: '',
      url: 'https://',
      icon: '🔗',
      description: '',
      category: 'other',
      tags: [],
      featured: false,
      pricing: 'free',
      clicks: 0,
      order: links.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const exportJson = (): void => {
    const blob = new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `links-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show('已下载', { description: `${links.length} 个链接` });
  };

  const importJson = async (file: File): Promise<void> => {
    try {
      const arr = JSON.parse(await file.text());
      if (!Array.isArray(arr)) throw new Error('不是数组');
      // 走批量 update / create
      for (const item of arr as LinkEntry[]) {
        if (item.id && links.some((l) => l.id === item.id)) {
          update(item.id, item);
        } else {
          const { id: _id, createdAt: _ca, updatedAt: _ua, clicks: _cl, ...rest } = item;
          void _id;
          void _ca;
          void _ua;
          void _cl;
          create(rest);
        }
      }
      toast.show('已导入', { description: `${arr.length} 个链接已合并` });
    } catch (e) {
      toast.show('导入失败', { variant: 'danger', description: String(e) });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">资源导航管理</h1>
          <p className="text-sm text-fg-muted">
            管理 /resources 页面上展示的外部工具与网站链接
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJson}>
            <Download className="h-4 w-4" /> 导出 JSON
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4" /> 导入 JSON
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importJson(f);
                    e.target.value = '';
                  }}
                />
              </span>
            </Button>
          </label>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" /> 新增链接
          </Button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
          全部 ({links.length})
        </FilterPill>
        {CATS.filter((c) => links.some((l) => l.category === c)).map((c) => (
          <FilterPill
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
          >
            {CATEGORY_META[c].emoji} {CATEGORY_META[c].label} ({links.filter((l) => l.category === c).length})
          </FilterPill>
        ))}
      </div>

      {/* 编辑表单 */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? '编辑链接' : '新增链接'}</CardTitle>
            <CardDescription>
              填写好后点保存。链接会出现在 /resources 与对应分类页。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditForm
              item={editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* 列表 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((link) => (
          <motion.div
            key={link.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-subtle text-2xl">
                    {link.icon || '🔗'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-fg">{link.name}</h3>
                      {link.featured && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fg-muted hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">
                      {link.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_META[link.category].emoji} {CATEGORY_META[link.category].label}
                      </Badge>
                      {link.pricing && (
                        <Badge variant="outline" className="text-xs">
                          {PRICING_META[link.pricing].emoji} {PRICING_META[link.pricing].label}
                        </Badge>
                      )}
                      <span className="text-xs text-fg-subtle">· {link.clicks} 次点击</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(link)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update(link.id, { featured: !link.featured })}
                    title={link.featured ? '取消精选' : '设为精选'}
                  >
                    <Star className={cn('h-3.5 w-3.5', link.featured && 'fill-amber-400 text-amber-400')} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(link.id, link.name)}
                    className="ml-auto text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && !editing && (
        <Card>
          <CardContent className="p-12 text-center text-fg-muted">
            <p>该分类下还没有链接。点「新增链接」开始。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterPill({
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
          : 'border-border bg-bg-elevated text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: LinkEntry;
  onSave: (item: LinkEntry) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [draft, setDraft] = useState<LinkEntry>(item);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim() || !draft.url.trim()) {
          toast.show('请填写名称和 URL', { variant: 'warning' });
          return;
        }
        onSave(draft);
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-muted">名称 *</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Figma"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-muted">URL *</label>
          <Input
            value={draft.url}
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            placeholder="https://figma.com"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-muted">图标（emoji）</label>
          <Input
            value={draft.icon ?? ''}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            placeholder="🎨"
            maxLength={4}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-muted">分类</label>
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as LinkCategory })}
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-muted">价格</label>
          <select
            value={draft.pricing ?? 'free'}
            onChange={(e) => setDraft({ ...draft, pricing: e.target.value as LinkPricing })}
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
          >
            {PRICINGS.map((p) => (
              <option key={p} value={p}>
                {PRICING_META[p].emoji} {PRICING_META[p].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-fg-muted">描述</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="一句话讲清楚它解决什么问题"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-fg-muted">
          标签（逗号分隔）
        </label>
        <Input
          value={draft.tags.join(', ')}
          onChange={(e) =>
            setDraft({
              ...draft,
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
          placeholder="UI, 原型, 协作"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
            className="rounded"
          />
          设为精选（在 /resources 顶部展示）
        </label>
        <div className="flex items-center gap-2 text-sm text-fg">
          <label className="text-xs text-fg-muted">排序权重</label>
          <Input
            type="number"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
            className="w-20"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" /> 取消
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4" /> 保存
        </Button>
      </div>
    </form>
  );
}
