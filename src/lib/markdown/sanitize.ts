/**
 * XSS 过滤 —— 用 DOMPurify 清洗渲染好的 HTML
 * 允许的标签以"博客渲染"为前提设计，丢弃 <script>/<iframe>/事件属性等危险内容
 */
import DOMPurify from 'dompurify';
import { renderMarkdownToHtml } from './render';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'div', 'br', 'hr',
  'strong', 'em', 'b', 'i', 'u', 's', 'del', 'mark', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'input', // 任务列表
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'id',
  'data-language',
  'checked', 'disabled', 'type', // task list
];

const FORBID_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'link', 'meta'];

/** 清洗 HTML 字符串 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}

/** Markdown → 安全 HTML（推荐入口） */
export function renderSafeMarkdown(md: string): string {
  const html = renderMarkdownToHtml(md);
  return sanitizeHtml(html);
}