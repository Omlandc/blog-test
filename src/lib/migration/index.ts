/**
 * 数据迁移层 —— 版本感知的 schema 升级
 *
 * 每一对相邻版本之间有一个 migration 函数，纯转换 + 描述改动。
 * runMigrations() 从入口版本出发，按链执行到目标版本。
 *
 * 设计原则：
 * - 永远不丢字段（删了的改成 _legacy_* 命名空间保留）
 * - 每个改动都生成 ChangeLog，可视化给用户
 * - 纯函数，易测试
 * - 不依赖 React，可在 CLI 复用
 */
import type { Article, SiteConfig, Series, LeadMagnet } from '../types';

export type ChangeType = 'add' | 'modify' | 'rename' | 'deprecate' | 'remove' | 'fill';

export interface FieldChange {
  path: string;          // e.g. 'articles.*.source' / 'siteConfig.tools'
  type: ChangeType;
  reason: string;
  defaultValue?: unknown;
  oldPath?: string;      // for rename
  newPath?: string;      // for rename
}

export interface MigrationResult {
  bundle: Record<string, unknown>;
  changes: FieldChange[];
  fromVersion: string;
  toVersion: string;
  warnings: string[];
}

export interface Bundle {
  version: string;
  generatedAt?: string;
  articles?: unknown[];
  series?: unknown[];
  leadMagnets?: unknown[];
  links?: unknown[];
  siteConfig?: unknown;
  tools?: unknown[];
  [key: string]: unknown;
}

/* ============================================================
 * 迁移器（顺序：v0.1 → v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7）
 * ============================================================ */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/* v0.1 → v0.2: 增加 authorId/seriesId/tags/createdAt 等基础字段 */
function migrate_0_1_to_0_2(b: Bundle): MigrationResult {
  const changes: FieldChange[] = [];
  const articles = asArray<Record<string, unknown>>(b.articles);
  const fixed = articles.map((a) => {
    const out = { ...a };
    if (!out.authorId) {
      out.authorId = 'u_admin';
      changes.push({ path: `articles.${out.id}.authorId`, type: 'fill', defaultValue: 'u_admin', reason: '新增必填字段' });
    }
    if (!out.createdAt) {
      out.createdAt = new Date().toISOString();
      changes.push({ path: `articles.${out.id}.createdAt`, type: 'fill', defaultValue: 'now', reason: '新增必填字段' });
    }
    if (!out.updatedAt) {
      out.updatedAt = out.createdAt;
      changes.push({ path: `articles.${out.id}.updatedAt`, type: 'fill', reason: '默认 = createdAt' });
    }
    if (!out.tags) {
      out.tags = [];
      changes.push({ path: `articles.${out.id}.tags`, type: 'fill', defaultValue: [], reason: '新增字段' });
    }
    if (out.views === undefined) {
      out.views = 0;
      changes.push({ path: `articles.${out.id}.views`, type: 'fill', defaultValue: 0, reason: '新增字段' });
    }
    if (out.likes === undefined) {
      out.likes = 0;
      changes.push({ path: `articles.${out.id}.likes`, type: 'fill', defaultValue: 0, reason: '新增字段' });
    }
    return out;
  });
  return {
    bundle: { ...b, version: '0.2.0', articles: fixed },
    changes,
    fromVersion: '0.1.0',
    toVersion: '0.2.0',
    warnings: [],
  };
}

/* v0.2 → v0.3: 新增 site-config / series / newsletter / analytics / monetization / seo */
function migrate_0_2_to_0_3(b: Bundle): MigrationResult {
  const changes: FieldChange[] = [];

  if (!b.siteConfig) {
    b.siteConfig = {
      name: '博客系统',
      tagline: '一套可复用的细分内容站框架',
      niche: 'tech',
      language: 'zh-CN',
      defaultAuthorId: 'u_admin',
      geoTargets: [{ country: 'CN', weight: 1.0 }],
      allowAI: false,
      allowAIImages: false,
    };
    changes.push({ path: 'siteConfig', type: 'add', reason: '新增站点身份与定位' });
  }
  if (!b.series) {
    b.series = [];
    changes.push({ path: 'series', type: 'add', defaultValue: [], reason: '新增主题簇' });
  }
  if (!b.leadMagnets) {
    b.leadMagnets = [];
    changes.push({ path: 'leadMagnets', type: 'add', defaultValue: [], reason: '新增邮件订阅' });
  }
  if (!b.tools) {
    b.tools = [];
    changes.push({ path: 'tools', type: 'add', defaultValue: [], reason: '新增工具集成' });
  }
  // Article 加 seo/cta/seriesId/difficulty 等
  const articles = asArray<Record<string, unknown>>(b.articles);
  const fixed = articles.map((a) => {
    const out = { ...a };
    if (!out.seo) {
      out.seo = { noai: true, noimageai: true, sitemapPriority: 0.5 };
      changes.push({ path: `articles.${out.id}.seo`, type: 'add', reason: '新增 SEO 字段' });
    }
    if (!out.cta) {
      out.cta = null;
      changes.push({ path: `articles.${out.id}.cta`, type: 'add', reason: '新增 CTA 字段' });
    }
    if (out.difficulty === undefined) {
      out.difficulty = 'beginner';
      changes.push({ path: `articles.${out.id}.difficulty`, type: 'fill', defaultValue: 'beginner', reason: '新增字段' });
    }
    return out;
  });
  return {
    bundle: { ...b, version: '0.3.0', articles: fixed },
    changes,
    fromVersion: '0.2.0',
    toVersion: '0.3.0',
    warnings: [],
  };
}

/* v0.3 → v0.4: 引入图片 source 字段、bundle 增加 articles/series/links 字段 */
function migrate_0_3_to_0_4(b: Bundle): MigrationResult {
  const changes: FieldChange[] = [];
  const articles = asArray<Record<string, unknown>>(b.articles);
  const fixed = articles.map((a) => {
    const out = { ...a };
    if (!out.coverImage) {
      out.coverImage = null;
      changes.push({ path: `articles.${out.id}.coverImage`, type: 'add', reason: '可选封面图' });
    }
    if (!out.format) {
      out.format = 'markdown';
      changes.push({ path: `articles.${out.id}.format`, type: 'fill', defaultValue: 'markdown', reason: '新增 format 字段，默认 markdown' });
    }
    if (!out.contentTheme) {
      out.contentTheme = 'default';
      changes.push({ path: `articles.${out.id}.contentTheme`, type: 'fill', defaultValue: 'default', reason: '新增 contentTheme 字段，默认 default' });
    }
    return out;
  });
  return {
    bundle: { ...b, version: '0.4.0', articles: fixed },
    changes,
    fromVersion: '0.3.0',
    toVersion: '0.4.0',
    warnings: [],
  };
}

/* v0.4 → v0.5: 引入 lib/links */
function migrate_0_4_to_0_5(b: Bundle): MigrationResult {
  const changes: FieldChange[] = [];
  if (!b.links) {
    b.links = [];
    changes.push({ path: 'links', type: 'add', defaultValue: [], reason: '新增资源导航' });
  }
  return {
    bundle: { ...b, version: '0.5.0' },
    changes,
    fromVersion: '0.4.0',
    toVersion: '0.5.0',
    warnings: [],
  };
}

/* v0.5 → v0.6: 引入 explorables 字段 */
function migrate_0_5_to_0_6(b: Bundle): MigrationResult {
  return {
    bundle: { ...b, version: '0.6.0' },
    changes: [],
    fromVersion: '0.5.0',
    toVersion: '0.6.0',
    warnings: [],
  };
}

/* v0.6 → v0.7: 引入发布工作流 + Look 套装 + 全站默认正文主题 */
function migrate_0_6_to_0_7(b: Bundle): MigrationResult {
  const changes: FieldChange[] = [];
  const fixed = { ...b };
  // SiteConfig 上加 look 和 defaultContentTheme
  if (b.siteConfig && typeof b.siteConfig === 'object') {
    const sc = { ...(b.siteConfig as Record<string, unknown>) };
    if (!sc.look) {
      sc.look = 'classic-light';
      changes.push({ path: 'siteConfig.look', type: 'add', defaultValue: 'classic-light', reason: '新增 Look 套装字段' });
    }
    if (!sc.defaultContentTheme) {
      sc.defaultContentTheme = 'default';
      changes.push({ path: 'siteConfig.defaultContentTheme', type: 'add', defaultValue: 'default', reason: '新增全站默认正文主题字段' });
    }
    fixed.siteConfig = sc;
  }
  return {
    bundle: { ...fixed, version: '0.7.0' },
    changes,
    fromVersion: '0.6.0',
    toVersion: '0.7.0',
    warnings: [],
  };
}

const MIGRATIONS: Array<(b: Bundle) => MigrationResult> = [
  migrate_0_1_to_0_2,
  migrate_0_2_to_0_3,
  migrate_0_3_to_0_4,
  migrate_0_4_to_0_5,
  migrate_0_5_to_0_6,
  migrate_0_6_to_0_7,
];

const VERSION_ORDER = ['0.1.0', '0.2.0', '0.3.0', '0.4.0', '0.5.0', '0.6.0', '0.7.0'];
const LATEST = VERSION_ORDER[VERSION_ORDER.length - 1]!;

function compareVersion(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

/** 推断 bundle 的版本 */
export function detectVersion(b: unknown): string {
  if (isObject(b) && typeof b.version === 'string') return b.version;
  // 无 version 字段的视为极早版本（v0.1 之前）
  return '0.0.0';
}

/** 是否需要迁移 */
export function needsMigration(bundle: unknown): boolean {
  const v = detectVersion(bundle);
  return compareVersion(v, LATEST) < 0;
}

/** 从 raw bundle 出发，跑完所有迁移 */
export function runMigrations(input: unknown, target: string = LATEST): MigrationResult {
  const bundle: Bundle = isObject(input) ? { ...input, version: typeof input.version === 'string' ? input.version : '0.0.0' } : { version: '0.0.0' };
  const fromVersion = detectVersion(bundle);
  if (compareVersion(fromVersion, target) >= 0) {
    return {
      bundle: bundle as Record<string, unknown>,
      changes: [],
      fromVersion,
      toVersion: target,
      warnings: ['已经是最新或更新版本，不需要迁移'],
    };
  }

  // 找到从 fromVersion 到 target 的 migration 链
  const allChanges: FieldChange[] = [];
  const allWarnings: string[] = [];
  let current = fromVersion;

  // 如果 fromVersion 不在列表里，从最接近的可用迁移开始
  let startIdx = VERSION_ORDER.findIndex((v) => compareVersion(current, v) < 0);
  if (startIdx === -1) startIdx = 0;

  for (let i = startIdx; i < MIGRATIONS.length; i++) {
    const migrator = MIGRATIONS[i]!;
    const next = VERSION_ORDER[i + 1];
    if (!next || compareVersion(next, target) > 0) break;
    const result = migrator(bundle);
    allChanges.push(...result.changes);
    allWarnings.push(...result.warnings);
    current = next;
  }

  bundle.version = current;
  bundle.generatedAt = new Date().toISOString();

  return {
    bundle: bundle as Record<string, unknown>,
    changes: allChanges,
    fromVersion,
    toVersion: current,
    warnings: allWarnings,
  };
}

/* ============================================================
 * 探测：扫描 localStorage 看有几个数据源
 * ============================================================ */

const STORAGE_KEYS = [
  'blog-system:articles',
  'blog-system:site-config',
  'blog-system:mode',
  'blog-system:tools',
  'blog-system:links',
  'blog-system:subscribers',
  'blog-system:lead-magnets',
  'blog-system:images',
  'blog-system:locale',
  'blog-system:theme',
];

export interface SourceDetection {
  key: string;
  exists: boolean;
  bytes: number;
  itemCount: number;
  inferredVersion: string;
}

export function detectLocalStorage(): SourceDetection[] {
  if (typeof window === 'undefined') return [];
  const result: SourceDetection[] = [];
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      result.push({ key, exists: false, bytes: 0, itemCount: 0, inferredVersion: '—' });
      continue;
    }
    let itemCount = 0;
    let inferredVersion = '—';
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        itemCount = parsed.length;
        if (itemCount > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          // 推断版本：看有没有某些字段
          const first = parsed[0] as Record<string, unknown>;
          if (first.seo !== undefined) inferredVersion = '≥ v0.3.0';
          else if (first.authorId !== undefined) inferredVersion = '≥ v0.2.0';
          else inferredVersion = 'v0.1.x';
        }
      } else if (isObject(parsed)) {
        if ('version' in parsed) {
          inferredVersion = String(parsed.version);
        } else if ('name' in parsed) {
          inferredVersion = 'site-config (any)';
        } else {
          itemCount = Object.keys(parsed).length;
        }
      }
    } catch {
      inferredVersion = 'parse error';
    }
    result.push({
      key,
      exists: true,
      bytes: raw.length,
      itemCount,
      inferredVersion,
    });
  }
  return result;
}

export const CURRENT_VERSION = LATEST;
export const ALL_VERSIONS = VERSION_ORDER;
