/**
 * /explore/content-themes —— 内容主题画廊
 *
 * 实时预览每套主题渲染 Markdown 的样子
 * 点击套用 = 写到 localStorage，整站文章用此主题（除非单文章指定 contentTheme）
 */
import { useState } from 'react';
import { Check, Sparkles, RotateCcw } from 'lucide-react';
import {
  listAllThemes,
  setActiveTheme,
  getActiveTheme,
  useContentThemesSheet,
  type ContentTheme,
} from '@/lib/content-themes';
import { ContentThemePicker } from '@/components/content-themes/ContentThemePicker';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const SAMPLE_MD = `# 一级标题

这是一段普通正文。Markdown 渲染时会按主题样式排版。**粗体** *斜体* [链接](https://example.com)。

## 二级标题

- 列表项 1
- 列表项 2
- 列表项 3

> 引用块 —— 用于强调或引用他人内容。

\`\`\`typescript
interface Article {
  id: string;
  title: string;
  contentTheme?: string;
}

const a: Article = { id: '1', title: 'Hi' };
\`\`\`

| 列 1 | 列 2 | 列 3 |
| ---- | ---- | ---- |
| A    | B    | C    |
| D    | E    | F    |
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSampleMd(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`)
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
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

export function ContentThemesGalleryPage(): React.ReactElement {
  // 挂载时把 sheet 注入一次
  useContentThemesSheet();

  const [activeSlug, setActiveSlug] = useState<string>(() => getActiveTheme().slug);
  const all = listAllThemes();
  const active = all.find((t) => t.slug === activeSlug) ?? all[0]!;

  const handlePick = (slug: string): void => {
    setActiveSlug(slug);
    setActiveTheme(slug); // 写 localStorage
    const t = all.find((x) => x.slug === slug);
    if (t) {
      toast.show('已套用', { description: `${t.name} · 全站文章用这个样式` });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">内容主题画廊</span>
        </div>
        <h1 className="text-3xl font-bold text-fg">给你的文章挑一件衣服</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          {all.length} 套排版主题 · 灵感来自 WeMD（公众号 Markdown 编辑器）。
          套用后会作用在所有文章正文上（h1/h2/p/code/blockquote/table 等）。
          想做自己的主题？进{' '}
          <a className="text-primary underline" href="/admin/content-themes">
            管理后台
          </a>{' '}
          添加。
        </p>
      </div>

      {/* 当前选中的预览 */}
      <div className="mb-8 rounded-xl border border-border bg-bg-elevated/30 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-fg-muted">当前主题</div>
            <div className="text-xl font-bold text-fg">{active.name}</div>
            <div className="text-sm text-fg-muted">{active.description}</div>
          </div>
          <div className="text-right text-xs text-fg-subtle">
            <div>
              slug: <code className="font-mono">{active.slug}</code>
            </div>
            <div>category: {active.category}</div>
          </div>
        </div>
        <div className={cn('rounded-lg bg-bg p-6 transition-all')}>
          {/* 关键：className 含 blog-article--{slug} 触发对应主题样式 */}
          <article
            key={activeSlug /* 强制重渲染以让 hljs 等重新跑 */}
            className={`blog-article blog-article--${activeSlug}`}
            dangerouslySetInnerHTML={{ __html: renderSampleMd(SAMPLE_MD) }}
          />
        </div>
      </div>

      {/* 主题网格 */}
      <h2 className="mb-4 text-lg font-semibold text-fg">所有主题</h2>
      <ContentThemePicker value={activeSlug} onChange={handlePick} variant="grid" />

      {/* 重置按钮 */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <div className="text-xs text-fg-muted">
          主题保存到 localStorage，全站所有文章都会使用。
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handlePick('default');
            toast.show('已重置', { description: '回到默认主题' });
          }}
        >
          <RotateCcw className="h-3 w-3" /> 重置为默认
        </Button>
      </div>
    </div>
  );
}
