/**
 * 文章设置弹框 —— 编辑器顶部 "⚙️ 设置" 入口
 *
 * 包含：
 *  - 封面图（上传/URL）
 *  - 标题、Slug
 *  - 摘要（excerpt）
 *  - 标签、分类
 *  - 状态（草稿/已发布）
 *  - 所属系列
 *  - 发布时间
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Image as ImageIcon,
  Save,
  Check,
  Loader2,
  Tag,
  FolderTree,
  Calendar,
  Hash,
  Type,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { ImageUploadButton } from './ImageUploadButton';
import { SeriesStoreStatic } from '@/lib/series';
import type { Article, ArticleStatus, Series } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface ArticleSettingsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  article: Article;
  onChange: (patch: Partial<Article>) => void;
  seriesList?: Series[];
}

export function ArticleSettingsDialog({
  open,
  onOpenChange,
  article,
  onChange,
  seriesList = [],
}: ArticleSettingsDialogProps): React.ReactElement {
  const [tagInput, setTagInput] = useState('');

  // 各字段独立 local state，保存时一次性合并
  const [cover, setCover] = useState(article.cover ?? '');
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '');
  const [tags, setTags] = useState<string[]>(article.tags ?? []);
  const [category, setCategory] = useState(article.category ?? '');
  const [seriesId, setSeriesId] = useState(article.seriesId ?? '');
  const [status, setStatus] = useState<ArticleStatus>(article.status);
  const [allSeries, setAllSeries] = useState<Series[]>([]);

  useEffect(() => {
    if (open) {
      setCover(article.cover ?? '');
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt ?? '');
      setTags(article.tags ?? []);
      setCategory(article.category ?? '');
      setSeriesId(article.seriesId ?? '');
      setStatus(article.status);
      setAllSeries(SeriesStoreStatic.list());
    }
  }, [open, article]);

  // 按 Pillar 分组 + 每个 Pillar 下排 Cluster
  const groupedSeries = useMemo(() => {
    const pillars = allSeries.filter((s) => !s.parentId);
    const clusters = allSeries.filter((s) => s.parentId);
    return pillars
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        pillar: p,
        clusters: clusters
          .filter((c) => c.parentId === p.id)
          .sort((a, b) => a.order - b.order),
      }));
  }, [allSeries]);

  const handleAddTag = (): void => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSaveSettings = (): void => {
    onChange({
      cover: cover || undefined,
      title,
      slug: slug.trim() || 'untitled',
      excerpt: excerpt.slice(0, 200),
      tags,
      category: category || undefined,
      seriesId: seriesId || undefined,
      status,
    });
    toast.success('设置已保存', { description: '记得点顶部"保存"按钮持久化到存储' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <div className="flex max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <div>
                <DialogTitle>文章设置</DialogTitle>
                <DialogDescription>封面图、标签、状态等元信息</DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* 封面图 */}
            <Section icon={<ImageIcon className="h-3.5 w-3.5" />} title="封面图" hint="建议 16:9 或 2:1，最少 800×450">
              <div className="flex gap-3">
                <div
                  className={cn(
                    'relative flex h-32 w-56 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-bg-subtle',
                    cover ? 'border-solid' : '',
                  )}
                >
                  {cover ? (
                    <>
                      <img src={cover} alt="封面预览" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCover('')}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        title="移除封面"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-fg-subtle">无封面</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    placeholder="https://... 或粘贴图片 URL"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <ImageUploadButton
                      onUploaded={(img) => setCover(img.url)}
                      label="上传封面"
                    />
                    {cover && (
                      <Button variant="ghost" size="sm" onClick={() => setCover('')}>
                        清除
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-fg-subtle">
                    💡 也可以在编辑器里直接拖入图片 → 复制 URL 粘到这里
                  </p>
                </div>
              </div>
            </Section>

            {/* 标题 + Slug */}
            <Section icon={<Type className="h-3.5 w-3.5" />} title="标题与 Slug">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="文章标题">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="一个吸引人的标题…"
                  />
                </Field>
                <Field label="URL Slug" hint="用于 /article/xxx，留空自动生成">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-article-slug"
                  />
                </Field>
              </div>
            </Section>

            {/* 摘要 */}
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="摘要 (excerpt)" hint="列表/SEO 用，最多 200 字">
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="一句话讲清楚这篇文章讲什么…"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
              />
              <div className="mt-1 text-right text-[11px] text-fg-subtle">{excerpt.length} / 200</div>
            </Section>

            {/* 标签 + 分类 */}
            <Section icon={<Tag className="h-3.5 w-3.5" />} title="标签 & 分类">
              <Field label="标签">
                <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-bg p-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="hover:text-danger"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                        setTags(tags.slice(0, -1));
                      }
                    }}
                    onBlur={handleAddTag}
                    placeholder={tags.length === 0 ? '输入标签，按回车添加' : '+ 标签'}
                    className="min-w-[120px] flex-1 bg-transparent text-xs text-fg placeholder:text-fg-subtle focus:outline-none"
                  />
                </div>
              </Field>
              <Field label="分类">
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="如：技术、随笔、教程…"
                />
              </Field>
            </Section>

            {/* 所属主题簇（Pillar → Cluster） */}
            <Section icon={<Layers className="h-3.5 w-3.5" />} title="所属主题簇" hint="按 Pillar → Cluster 三级架构组织">
              {groupedSeries.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-4 text-center text-xs text-fg-muted">
                  还没有主题簇 · 去 <a href="/admin/series" target="_blank" className="text-primary hover:underline">主题簇管理</a> 创建
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border bg-bg-subtle/40 p-2">
                  {/* 不选选项 */}
                  <button
                    type="button"
                    onClick={() => setSeriesId('')}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      !seriesId ? 'bg-primary/10 text-primary' : 'hover:bg-bg-elevated text-fg-muted',
                    )}
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-fg-subtle" />
                    <span>（不归类到任何主题簇）</span>
                    {!seriesId && <Check className="ml-auto h-3.5 w-3.5" />}
                  </button>
                  {groupedSeries.map(({ pillar, clusters }) => (
                    <div key={pillar.id} className="rounded-md border border-border bg-bg">
                      {/* Pillar */}
                      <button
                        type="button"
                        onClick={() => setSeriesId(pillar.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-t-md px-2 py-1.5 text-left text-sm font-medium transition-colors',
                          seriesId === pillar.id ? 'bg-primary/10 text-primary' : 'hover:bg-bg-elevated text-fg',
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{pillar.name}</span>
                        <span className="text-[10px] text-fg-subtle">Pillar</span>
                        {seriesId === pillar.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {/* Clusters */}
                      {clusters.length > 0 && (
                        <div className="border-t border-border">
                          {clusters.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSeriesId(c.id)}
                              className={cn(
                                'flex w-full items-center gap-2 px-2 py-1.5 pl-7 text-left text-sm transition-colors',
                                seriesId === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-bg-elevated text-fg-muted',
                              )}
                            >
                              <span className="text-fg-subtle">└</span>
                              <span className="flex-1">{c.name}</span>
                              <span className="text-[10px] text-fg-subtle">Cluster</span>
                              {seriesId === c.id && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* 状态 */}
            <Section icon={status === 'published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} title="状态">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    status === 'draft'
                      ? 'border-warning bg-warning/10 ring-2 ring-warning/20'
                      : 'border-border hover:border-warning/40',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <EyeOff className="h-3.5 w-3.5 text-warning" />
                    <span className="text-sm font-medium text-fg">草稿</span>
                    {status === 'draft' && <Check className="ml-auto h-3 w-3 text-warning" />}
                  </div>
                  <p className="text-xs text-fg-muted">仅自己可见，不会出现在公开页面</p>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    status === 'published'
                      ? 'border-success bg-success/10 ring-2 ring-success/20'
                      : 'border-border hover:border-success/40',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-success" />
                    <span className="text-sm font-medium text-fg">已发布</span>
                    {status === 'published' && <Check className="ml-auto h-3 w-3 text-success" />}
                  </div>
                  <p className="text-xs text-fg-muted">公开可见，出现在列表/订阅推送中</p>
                </button>
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-bg-elevated/50 px-5 py-3">
            <p className="text-xs text-fg-muted">⚠️ 设置修改后需点顶部「保存」持久化</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSaveSettings}>
                <Save className="h-3 w-3" /> 应用设置
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {hint && <span className="text-[11px] text-fg-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-fg-muted">{label}</label>
      {children}
    </div>
  );
}
