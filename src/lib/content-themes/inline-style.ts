/**
 * CSS-to-Inline-Style 转换器（用于「复制到公众号」等场景）
 *
 * 公众号编辑器会**剥离 <style> 标签**和大部分 class
 * 所以要把 class 形式的主题样式转成 inline style 才能在公众号生效
 *
 * 实现：iframe 沙箱 + getComputedStyle
 *  - 写入主题 CSS，让浏览器解析
 *  - 对每个元素 + ::before/::after/::marker 伪元素调 getComputedStyle
 *  - 提取实际生效的样式（与 article 默认值不同的部分）转成 inline style
 *  - ::before/::after 的 content 转成真实子元素
 *  - ::marker 的 color/font 转成 list-style 简写
 */
import { getTheme } from './index';

/* 不输出的属性（浏览器内部 / 视觉无关 / 计算值 / 噪音） */
const SKIP_PROPS = new Set([
  // 布局位置类（公众号不会继承）
  'position', 'top', 'left', 'right', 'bottom', 'z-index', 'inset',
  'contain', 'contain-intrinsic-size', 'contain-intrinsic-width', 'contain-intrinsic-height',
  // 计算出的尺寸 / 原点（不是样式）
  'block-size', 'inline-size', 'width', 'height',
  'min-width', 'min-height', 'max-width', 'max-height',
  'perspective-origin', 'transform-origin',
  // 浏览器内部 / 特定平台
  '-webkit-tap-highlight-color', '-webkit-appearance', 'appearance',
  '-webkit-text-fill-color', '-webkit-text-stroke-color', '-webkit-text-stroke-width',
  'cursor', 'pointer-events', 'user-select', 'touch-action',
  // 文字渲染优化（公众号没用）
  'text-rendering', 'font-smoothing', '-webkit-font-smoothing',
  // 动画（公众号支持有限，太多反而卡）
  'transition', 'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay',
  'animation', 'animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay',
  'will-change',
  // 性能 / 输出控制
  'content',  // 仅伪元素上有意义
  // 变量（已经被解析成最终值）
  '--*',
  // 浏览器默认 / 不需要输出
  'unicode-bidi', 'direction', 'writing-mode',
  'font-variant-ligatures', 'font-variant-caps', 'font-variant-numeric',
  'font-kerning', 'font-optical-sizing', 'font-feature-settings',
  'text-orientation',
  'scroll-margin-top', 'scroll-margin-right', 'scroll-margin-bottom', 'scroll-margin-left',
  'scroll-padding-top', 'scroll-padding-right', 'scroll-padding-bottom', 'scroll-padding-left',
  'orphans', 'widows',
  'image-orientation', 'image-rendering',
  'tab-size',
  'text-combine-upright',
  'text-emphasis-style', 'text-emphasis-color', 'text-emphasis-position',
  // 表格默认
  'caption-side', 'empty-cells', 'table-layout',
  // ruby / 边角
  'ruby-position', 'ruby-align',
  // 默认没必要输出
  'white-space-collapse', 'text-wrap',
]);

/* 标题元素不输出 line-height（让它们继承 article 的 1.85）*/
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/* 数值属性不加 px（unitless） */
const UNITLESS_PROPS = new Set([
  'line-height',
  'opacity',
  'flex',
  'flex-grow',
  'flex-shrink',
  'z-index',
  'font-weight',
  'font-stretch',
  'zoom',
  'orphans',
  'widows',
  'order',
  'tab-size',
  'columns',
  'column-count',
  'aspect-ratio',
]);

function formatValue(prop: string, value: string): string {
  if (!value) return value;
  if (value === 'auto' || value === 'none' || value === 'normal' || value === 'initial' || value === 'inherit') {
    return value;
  }
  if (value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('#')) {
    return value;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    if (UNITLESS_PROPS.has(prop)) return value;
    if (parseFloat(value) === 0) return '0';
    return `${value}px`;
  }
  return value;
}

function formatLineHeight(lineHeight: string, fontSize: string): string {
  const lh = parseFloat(lineHeight);
  const fs = parseFloat(fontSize);
  if (isNaN(lh) || isNaN(fs) || fs === 0) return lineHeight;
  if (/^-?\d+(\.\d+)?$/.test(lineHeight)) return lineHeight;
  const ratio = lh / fs;
  return parseFloat(ratio.toFixed(2)).toString();
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/* 计算伪元素 content 字符串的真实文本 */
function stripContentQuotes(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  // "abc" 或 'abc'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  // attr(href) / counter() / url() 等
  return '';
}

/**
 * 把 computed style 对象转成 inline style 字符串
 * 优化：
 *  1. 跳过 block-size/height/width 等计算出的尺寸（不是样式）
 *  2. 跳过 0 值的 padding/margin（与默认值相同）
 *  3. 标题不输出 line-height（继承 article 即可）
 *  4. line-height 同比率输出（避免和目标平台默认复合）
 */
function styleObjToString(
  style: CSSStyleDeclaration,
  defaults: CSSStyleDeclaration,
  tagName = '',
): string {
  const parts: string[] = [];
  const fontSize = style.getPropertyValue('font-size');
  const articleLineHeightMultiplier = getLineHeightMultiplier(defaults);
  for (let i = 0; i < style.length; i++) {
    const prop = style.item(i);
    if (!prop) continue;
    if (SKIP_PROPS.has(prop) || prop.startsWith('--')) continue;
    const value = style.getPropertyValue(prop);
    if (!value) continue;
    // 跳过 0 值的 padding/margin/border-width
    if (value === '0px') {
      if (prop.startsWith('padding-') || prop.startsWith('margin-') || prop.startsWith('border-')) {
        continue;
      }
    }
    // 与默认值比较
    const defaultValue = defaults.getPropertyValue(prop);
    if (value === defaultValue) continue;
    // 标题不输出 line-height（继承 article）
    if (prop === 'line-height' && HEADING_TAGS.has(tagName)) {
      continue;
    }
    let formatted: string;
    if (prop === 'line-height') {
      formatted = formatLineHeight(value, fontSize);
      if (formatted === 'normal') continue;
      // 同比率比较：避免重复输出同倍率
      const multiplier = getLineHeightMultiplier(style);
      if (multiplier !== null && articleLineHeightMultiplier !== null && Math.abs(multiplier - articleLineHeightMultiplier) < 0.01) {
        continue;  // 与 article 相同，不输出
      }
    } else {
      formatted = formatValue(prop, value);
    }
    parts.push(`${camelToKebab(prop)}: ${formatted}`);
  }
  return parts.join('; ');
}

/**
 * 获取 line-height 的倍率（值 / font-size）
 */
function getLineHeightMultiplier(style: CSSStyleDeclaration): number | null {
  const lhStr = style.getPropertyValue('line-height');
  const fsStr = style.getPropertyValue('font-size');
  const lh = parseFloat(lhStr);
  const fs = parseFloat(fsStr);
  if (isNaN(lh) || isNaN(fs) || fs === 0) return null;
  if (/^-?\d+(\.\d+)?$/.test(lhStr)) return lh;  // 已是倍率
  return lh / fs;
}

/**
 * 给元素注入 inline style，保留已有
 */
function applyInlineStyle(el: Element, inline: string): void {
  if (!inline) return;
  const existing = el.getAttribute('style') || '';
  el.setAttribute('style', existing ? `${existing}; ${inline}` : inline);
}

/**
 * 把伪元素 ::before/::after 的内容转为真实子元素并插入
 */
function materializePseudo(
  el: Element,
  pseudo: '::before' | '::after',
  doc: Document,
  win: Window,
  defaults: CSSStyleDeclaration,
): void {
  const style = win.getComputedStyle(el, pseudo);
  const content = style.getPropertyValue('content');
  if (!content || content === 'none' || content === 'normal') return;

  const text = stripContentQuotes(content);
  const inline = styleObjToString(style, defaults);
  if (!text && !inline) return;

  const span = doc.createElement('span');
  span.setAttribute('data-pseudo', pseudo.replace('::', ''));
  if (inline) span.setAttribute('style', inline);
  if (text) span.textContent = text;
  else span.innerHTML = '&nbsp;';

  if (pseudo === '::before') {
    el.insertBefore(span, el.firstChild);
  } else {
    el.appendChild(span);
  }
}

/**
 * 处理列表项的 ::marker 颜色
 * 策略：把 ::marker 的颜色注入到 li 的 list-style 简写里
 *      然后用 ::marker 选择器（CSS 文本），但 WeChat 不支持
 *      简化方案：让 li 的 color 直接跟 marker color（默认 marker 会跟着 li color）
 */
function applyMarkerStyle(
  el: Element,
  win: Window,
  defaults: CSSStyleDeclaration,
): void {
  const tag = el.tagName.toLowerCase();
  if (tag !== 'li') return;
  const marker = win.getComputedStyle(el, '::marker');
  const color = marker.getPropertyValue('color');
  const defaultColor = defaults.getPropertyValue('color');
  if (!color || color === defaultColor) return;
  // WeChat 默认 marker 颜色会跟着 li 的 color，所以把 li color 设成 marker color
  // （会产生 marker 和文本同色的问题，但至少不会被吃掉）
  // 用 :where(li) 的 color 并配合子选择器，把文本色恢复成 article 默认
  // 简化：直接 set color 为 marker color，文本色会被 marker 颜色覆盖（可接受）
  const existing = el.getAttribute('style') || '';
  const newStyle = existing ? `${existing}; color: ${color}` : `color: ${color}`;
  el.setAttribute('style', newStyle);
}

/**
 * 主入口：把 HTML 字符串 + theme slug 转成 inline-styled HTML
 */
export function htmlToInlineStyle(html: string, themeSlug: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return html;
  const theme = getTheme(themeSlug);
  if (!theme) return html;

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:absolute;left:-9999px;top:-9999px;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return html;

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${theme.css}</style></head><body><article class="blog-article blog-article--${themeSlug}">${html}</article></body></html>`);
    doc.close();

    const article = doc.querySelector('.blog-article') as HTMLElement | null;
    if (!article) return html;

    const articleStyle = win.getComputedStyle(article);
    const bodyStyle = win.getComputedStyle(doc.body);

    // 1. 处理所有元素的 inline style
    const allElements = article.querySelectorAll('*');
    for (const el of Array.from(allElements)) {
      const computed = win.getComputedStyle(el);
      const inline = styleObjToString(computed, articleStyle, el.tagName.toLowerCase());
      applyInlineStyle(el, inline);
    }

    // 2. 处理 ::marker（li 颜色）
    for (const el of Array.from(allElements)) {
      applyMarkerStyle(el, win, articleStyle);
    }

    // 3. 处理 ::before / ::after 伪元素
    for (const el of Array.from(allElements)) {
      materializePseudo(el, '::before', doc, win, articleStyle);
      materializePseudo(el, '::after', doc, win, articleStyle);
    }

    // 4. article 自身
    const articleInline = styleObjToString(articleStyle, bodyStyle, 'article');
    applyInlineStyle(article, articleInline);

    return article.outerHTML;
  } finally {
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch { /* noop */ }
    }, 100);
  }
}

/**
 * 复制 HTML 到剪贴板
 */
export async function copyToClipboard(
  html: string,
  options: { inlineStyle?: boolean; themeSlug?: string } = {},
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    let finalHtml = html;
    const plainText = html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (options.inlineStyle && options.themeSlug) {
      finalHtml = htmlToInlineStyle(html, options.themeSlug);
    }

    if (typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({
        'text/html': new Blob([finalHtml], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
    return true;
  } catch {
    return false;
  }
}
