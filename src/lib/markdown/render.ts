/**
 * Markdown 渲染（轻量版，仅给编辑器预览用）
 *
 * - marked：解析 Markdown → HTML（启用 GFM）
 * - 代码块用 <pre><code class="language-xxx"> 包裹，不做高亮（高亮由 viewer 端的 rehype-highlight 处理）
 * - XSS 过滤在 sanitize.ts 里
 */
import { marked, type MarkedOptions } from 'marked';

const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = (lang ?? '').trim().split(/\s+/)[0] ?? '';
  const escaped = escapeHtml(text);
  return `<pre class="hljs-pre"><code class="hljs language-${escapeAttr(language)}" data-language="${escapeAttr(language)}">${escaped}</code></pre>`;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

marked.use({
  gfm: true,
  breaks: false,
  renderer,
} satisfies MarkedOptions);

export interface RenderOptions {
  allowHtmlInCode?: boolean;
}

/** Markdown → HTML（仅渲染，不做 XSS 过滤） */
export function renderMarkdownToHtml(md: string, _opts: RenderOptions = {}): string {
  const html = marked.parse(md, { async: false }) as string;
  return html;
}

/** 提取纯文本摘要（用于 SEO/excerpt） */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
