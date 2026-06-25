/**
 * /admin/content-themes —— 内容主题管理
 *
 * 功能：
 *  - 列出所有预设 + 自定义主题
 *  - 实时预览
 *  - 新建自定义主题（粘贴 CSS）
 *  - 编辑 / 删除自定义主题
 *  - 导入 / 导出 JSON
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Copy,
  Eye,
  X,
  Check,
} from 'lucide-react';
import {
  listAllThemes,
  addCustomTheme,
  updateCustomTheme,
  removeCustomTheme,
  setActiveTheme,
  getActiveTheme,
  type ContentTheme,
} from '@/lib/content-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn, formatBytes } from '@/lib/utils';

const SAMPLE_MD = `# 主题预览

这是 **正文** 示例，用于测试排版效果。*斜体* [链接](https://example.com)

## 二级标题

- 列表项 1
- 列表项 2

> 引用块，用于强调。

\`\`\`ts
const x: number = 1;
\`\`\`

| 列 1 | 列 2 |
| ---- | ---- |
| A    | B    |
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSimpleMd(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`)
    .replace(/^#{1,6} (.*$)/gim, (m) => {
      const level = m.match(/^#+/)?.[0].length ?? 1;
      return `<h${level}>${m.replace(/^#+\s/, '')}</h${level}>`;
    })
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/((?:\|[^\n]+\|\n)+)/g, (block) => {
      const rows = block.trim().split('\n');
      if (rows.length < 2) return block;
      const head = rows[0]!.split('|').slice(1, -1).map((c) => c.trim());
      const body = rows.slice(2).map((r) => r.split('|').slice(1, -1).map((c) => c.trim()));
      return (
        '<table><thead><tr>' +
        head.map((h) => `<th>${h}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map((row) => '<tr>' + row.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>'
      );
    })
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .split('\n\n')
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h\d|ul|ol|pre|blockquote|table)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n')
    .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
}

interface EditState {
  open: boolean;
  theme: ContentTheme | null;
  name: string;
  slug: string;
  description: string;
  css: string;
}

const EMPTY_EDIT: EditState = {
  open: false,
  theme: null,
  name: '',
  slug: '',
  description: '',
  css: '',
};

export function AdminContentThemesPage(): React.ReactElement {
  const [themes, setThemes] = useState<ContentTheme[]>(() => listAllThemes());
  const [activeSlug, setActiveSlug] = useState<string>(() => getActiveTheme().slug);
  const [preview, setPreview] = useState<ContentTheme | null>(null);
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);

  // 把 active CSS 注入到文档
  const refresh = (): void => {
    setThemes(listAllThemes());
  };

  const handleNew = (): void => {
    setEdit({
      ...EMPTY_EDIT,
      open: true,
      slug: 'my-theme-' + Date.now().toString(36),
    });
  };

  const handleEdit = (t: ContentTheme): void => {
    setEdit({
      open: true,
      theme: t,
      name: t.name,
      slug: t.slug,
      description: t.description,
      css: t.css,
    });
  };

  const handleSave = (): void => {
    const next: ContentTheme = {
      slug: edit.slug.trim() || 'my-theme',
      name: edit.name.trim() || '未命名主题',
      nameEn: edit.theme?.nameEn ?? edit.slug,
      description: edit.description.trim() || '自定义主题',
      category: edit.theme?.category ?? 'decorative',
      builtin: false,
      preview: edit.theme?.preview ?? { bg: '#ffffff', fg: '#1a1a1a', accent: '#3b82f6' },
      css: edit.css,
    };
    if (edit.theme) {
      updateCustomTheme(next);
      toast.success('已更新', { description: next.name });
    } else {
      addCustomTheme(next);
      toast.success('已添加', { description: next.name });
    }
    setEdit(EMPTY_EDIT);
    refresh();
  };

  const handleDelete = (slug: string): void => {
    if (!confirm(`确定要删除「${slug}」吗？此操作不可恢复。`)) return;
    removeCustomTheme(slug);
    toast.show('已删除', { description: slug });
    refresh();
  };

  const handleUse = (slug: string): void => {
    setActiveTheme(slug);
    setActiveSlug(slug);
    const t = listAllThemes().find((x) => x.slug === slug);
    if (t) {
      toast.show('已切换', { description: `${t.name} 现在是默认主题` });
    }
  };

  const handleExport = (): void => {
    const custom = themes.filter((t) => !t.builtin);
    const blob = new Blob([JSON.stringify(custom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-themes.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.show('已导出', { description: `${custom.length} 个自定义主题 · ${formatBytes(blob.size)}` });
  };

  const handleImport = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (): Promise<void> => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const list = JSON.parse(text) as ContentTheme[];
        if (!Array.isArray(list)) throw new Error('JSON must be an array');
        let added = 0;
        for (const t of list) {
          if (t.slug && t.css && !t.builtin) {
            addCustomTheme(t);
            added++;
          }
        }
        toast.success('已导入', { description: `${added} 个主题` });
        refresh();
      } catch (e) {
        toast.show('导入失败', { variant: 'danger', description: e instanceof Error ? e.message : String(e) });
      }
    };
    input.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">内容主题管理</h1>
          <p className="text-sm text-fg-muted">
            管理文章正文的排版主题（不影响 UI 控件）· 当前 {themes.length} 个主题
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4" /> 导入
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> 导出
          </Button>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4" /> 新建主题
          </Button>
        </div>
      </div>

      {/* 主题列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => {
          const isActive = t.slug === activeSlug;
          return (
            <motion.div
              key={t.slug}
              layout
              className={cn(
                'group relative overflow-hidden rounded-xl border bg-bg-elevated/30',
                isActive ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border',
              )}
            >
              {/* 缩略图 */}
              <button
                onClick={() => setPreview(t)}
                className="block w-full text-left"
                style={{ background: t.preview.bg }}
              >
                <div className="px-3 py-2 text-[10px]" style={{ color: t.preview.fg }}>
                  <div className="mb-1 font-semibold" style={{ color: t.preview.accent }}>
                    {t.name}
                  </div>
                  <div className="space-y-0.5 opacity-70">
                    <div className="h-1 w-3/4 rounded-sm" style={{ background: t.preview.fg }} />
                    <div className="h-1 w-2/3 rounded-sm" style={{ background: t.preview.fg }} />
                    <div className="h-1 w-1/2 rounded-sm" style={{ background: t.preview.fg }} />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-bg/80 px-3 py-1 text-[10px] text-fg-muted">
                  <span>点击预览</span>
                  <Eye className="h-3 w-3" />
                </div>
              </button>

              {/* 信息 + 操作 */}
              <div className="p-3">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-fg">{t.name}</h3>
                  {isActive && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Check className="h-2.5 w-2.5" /> 使用中
                    </span>
                  )}
                  {t.builtin && (
                    <span className="rounded-full bg-bg-subtle px-1.5 py-0.5 text-[10px] text-fg-muted">
                      预设
                    </span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 text-xs text-fg-muted">{t.description}</p>

                <div className="flex items-center gap-1">
                  {!isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleUse(t.slug)} className="flex-1">
                      <Check className="h-3 w-3" /> 套用
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} title="编辑">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(t.css);
                      toast.show('已复制', { description: `${t.name} 的 CSS` });
                    }}
                    title="复制 CSS"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {!t.builtin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(t.slug)}
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3 text-danger" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 预览对话框 */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        {preview && (
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{preview.name}</h2>
                <p className="text-sm text-fg-muted">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="rounded-md p-1 hover:bg-bg-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded-lg bg-bg p-6">
              <article
                key={preview.slug}
                className={`blog-article blog-article--${preview.slug}`}
                dangerouslySetInnerHTML={{ __html: renderSimpleMd(SAMPLE_MD) }}
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>
                关闭
              </Button>
              <Button onClick={() => { handleUse(preview.slug); setPreview(null); }}>
                <Check className="h-3 w-3" /> 套用此主题
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={edit.open} onOpenChange={(o) => !o && setEdit(EMPTY_EDIT)}>
        <div className="max-w-4xl">
          <h2 className="mb-3 text-xl font-bold">
            {edit.theme ? `编辑：${edit.theme.name}` : '新建内容主题'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">名称</label>
              <Input
                value={edit.name}
                onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
                placeholder="我的主题"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">slug</label>
              <Input
                value={edit.slug}
                onChange={(e) => setEdit((s) => ({ ...s, slug: e.target.value }))}
                placeholder="my-theme"
                disabled={!!edit.theme}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">描述</label>
              <Input
                value={edit.description}
                onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
                placeholder="简短描述…"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              CSS · 目标选择器 <code className="font-mono">.blog-article.blog-article--{edit.slug || '...'}</code>
            </label>
            <Textarea
              value={edit.css}
              onChange={(e) => setEdit((s) => ({ ...s, css: e.target.value }))}
              rows={16}
              placeholder={`.blog-article.blog-article--${edit.slug || 'my-theme'} {
  font-family: ...;
  color: ...;
}`}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-fg-subtle">
              💡 提示：参考预设主题的 CSS 写法。支持完整的 CSS 语法。
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-fg-muted">
              实时预览在右侧
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEdit(EMPTY_EDIT)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-3 w-3" /> 保存
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
