/**
 * Static bundle —— 静态内容包加载
 *
 * 在 `static` 部署模式下，文章/站点配置/工具入口全部从
 * 构建时打包的 /data/articles.json 读取，运行时不再走 localStorage。
 *
 * 配套脚本：`scripts/export-static.mjs`
 *   - 把 localStorage 里的所有内容导出为 public/data/articles.json
 *   - 然后正常 `npm run build` 即可得到纯静态站点
 */
import type { StaticBundle, ToolEntry, SiteConfig, Article, Series, LeadMagnet } from '../types';

const BUNDLE_URL = '/data/articles.json';
let cachedBundle: StaticBundle | null = null;

/** 加载打包数据（一次性） */
export async function loadStaticBundle(): Promise<StaticBundle | null> {
  if (cachedBundle) return cachedBundle;
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(BUNDLE_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    cachedBundle = (await res.json()) as StaticBundle;
    return cachedBundle;
  } catch {
    return null;
  }
}

/** 是否存在静态包（同步探测） */
export function hasStaticBundle(): boolean {
  return cachedBundle !== null;
}

/** 同步读取已缓存的 bundle（若未加载返回 null） */
export function getStaticBundle(): StaticBundle | null {
  return cachedBundle;
}

/** 构造 SiteConfig 覆盖（用于 SiteConfigProvider 注入） */
export function getSiteConfigFromBundle(bundle: StaticBundle): SiteConfig {
  return bundle.siteConfig;
}

export function getToolsFromBundle(bundle: StaticBundle): ToolEntry[] {
  return bundle.tools;
}

export function getArticlesFromBundle(bundle: StaticBundle): Article[] {
  return bundle.articles;
}

export function getSeriesFromBundle(bundle: StaticBundle): Series[] {
  return bundle.series;
}

export function getLeadMagnetsFromBundle(bundle: StaticBundle): LeadMagnet[] {
  return bundle.leadMagnets;
}

export function getLinksFromBundle(bundle: StaticBundle): Array<Record<string, unknown>> {
  return bundle.links ?? [];
}