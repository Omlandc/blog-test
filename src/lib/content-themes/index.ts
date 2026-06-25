/**
 * ContentThemes —— 文章正文主题注册中心
 *
 * 区别于 lib/theme/（UI 控件主题）：
 *  - UI 主题作用在 header/button/background（整个页面壳）
 *  - 内容主题作用在文章正文 h1/h2/p/code/blockquote/table 等
 *
 * 灵感来自 WeMD (tenngoxars/WeMD) 的 15+ 套 #wemd CSS
 *
 * 驱动方式（关键设计）：
 *  - 所有主题的 CSS 编译进一个 <style id="blog-content-themes-sheet">
 *  - 选择器形如 ".blog-article.blog-article--{slug} h1 { ... }"（原样保留）
 *  - 切换主题 = 改组件的 className（不是 html class）
 *  - ArticleViewer / Gallery 自己根据 effectiveTheme 算 className
 *  - effectiveTheme = article.contentTheme ?? siteDefaultTheme
 *
 * 这样每篇文章可以独立指定主题，site default 只影响没指定主题的文章
 */
import { useEffect, useState, useCallback } from 'react';
import { PRESET_CONTENT_THEMES, type ContentTheme } from './presets';

export type { ContentTheme };
export { PRESET_CONTENT_THEMES };

const STORAGE_KEY = 'blog-system:content-themes';
const ACTIVE_KEY = 'blog-system:active-content-theme';
const STYLE_ID = 'blog-content-themes-sheet';

/* ------------------------------------------------------------------ */
/*  自定义主题（用户从 /admin/content-themes 加的）                     */
/* ------------------------------------------------------------------ */
function readCustom(): ContentTheme[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContentTheme[]) : [];
  } catch {
    return [];
  }
}

function writeCustom(list: ContentTheme[]): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export function listAllThemes(): ContentTheme[] {
  return [...PRESET_CONTENT_THEMES, ...readCustom()];
}

export function getTheme(slug: string): ContentTheme | undefined {
  return listAllThemes().find((t) => t.slug === slug);
}

export function getActiveSlug(): string {
  if (typeof localStorage === 'undefined') return 'default';
  return localStorage.getItem(ACTIVE_KEY) || 'default';
}

export function getActiveTheme(): ContentTheme {
  return getTheme(getActiveSlug()) ?? PRESET_CONTENT_THEMES[0]!;
}

export function setActiveTheme(slug: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACTIVE_KEY, slug);
  }
}

export function addCustomTheme(theme: ContentTheme): void {
  if (theme.builtin) return;
  const list = readCustom().filter((t) => t.slug !== theme.slug);
  list.push(theme);
  writeCustom(list);
}

export function removeCustomTheme(slug: string): void {
  const list = readCustom().filter((t) => t.slug !== slug);
  writeCustom(list);
}

export function updateCustomTheme(theme: ContentTheme): void {
  if (theme.builtin) return;
  const list = readCustom().map((t) => (t.slug === theme.slug ? theme : t));
  writeCustom(list);
}

/* ------------------------------------------------------------------ */
/*  CSS 编译：把所有主题的 CSS 原样塞进 sheet                          */
/*  选择器形如 ".blog-article.blog-article--{slug} h1" 已自带作用域    */
/* ------------------------------------------------------------------ */
function buildAllCSS(): string {
  return listAllThemes().map((t) => t.css).join('\n');
}

let mounted = 0;
let cssInjected = false;

function injectSheet(): void {
  if (typeof document === 'undefined') return;
  if (cssInjected) return;
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.appendChild(document.createTextNode(buildAllCSS()));
  document.head.appendChild(style);
  cssInjected = true;
}

function ejectSheet(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
  cssInjected = false;
}

/* ------------------------------------------------------------------ */
/*  useContentThemesSheet —— 组件调一次，把 sheet 注入 <head>           */
/* ------------------------------------------------------------------ */
export function useContentThemesSheet(): void {
  useEffect(() => {
    mounted++;
    injectSheet();
    return () => {
      mounted--;
      if (mounted <= 0) {
        ejectSheet();
        mounted = 0;
      }
    };
  }, []);
}

/* ------------------------------------------------------------------ */
/*  useContentTheme —— 主题选择状态 hook（用于画廊 / 管理后台）         */
/* ------------------------------------------------------------------ */
export function useContentTheme(): {
  active: ContentTheme;
  set: (slug: string) => void;
  all: ContentTheme[];
} {
  // sheet 注入（多次调用是幂等的）
  useContentThemesSheet();

  const [active, setActive] = useState<ContentTheme>(() => getActiveTheme());
  const [all, setAll] = useState<ContentTheme[]>(() => listAllThemes());

  const set = useCallback((slug: string): void => {
    const next = getTheme(slug);
    if (next) {
      setActiveTheme(slug);
      setActive(next);
      setAll(listAllThemes());
    }
  }, []);

  return { active, set, all };
}

/* ------------------------------------------------------------------ */
/*  getEffectiveThemeSlug —— 文章用的最终主题（个人设置 > 全站默认）   */
/* ------------------------------------------------------------------ */
export function getEffectiveThemeSlug(articleSlug?: string): string {
  return articleSlug ?? getActiveSlug();
}

/* ------------------------------------------------------------------ */
/*  getSiteDefaultTheme —— 读 site config 的 defaultContentTheme     */
/*  走 site-config 模块的 API，不再直接读 localStorage               */
/* ------------------------------------------------------------------ */
import { loadSiteConfig } from '@/lib/site-config';

export function getSiteDefaultTheme(): string {
  if (typeof window === 'undefined') return 'default';
  return loadSiteConfig().defaultContentTheme ?? 'default';
}

/* ------------------------------------------------------------------ */
/*  resolveContentTheme —— 三级回退                                   */
/*    article.contentTheme → site default → 'default'                 */
/* ------------------------------------------------------------------ */
export function resolveContentTheme(articleTheme?: string): string {
  if (articleTheme && getTheme(articleTheme)) return articleTheme;
  const site = getSiteDefaultTheme();
  if (site && getTheme(site)) return site;
  return 'default';
}
