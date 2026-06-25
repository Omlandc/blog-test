/**
 * Series —— 主题簇 / Pillar
 *
 * 借鉴细分内容站的核心架构：
 *   Pillar（顶级主题）→ Cluster（子分类）→ Article
 * 三级金字塔，权重层层传递。
 */
import type { Series } from '../types';

export type { Series } from '../types';

const STORAGE_KEY = 'blog-system:series';

/** 默认演示数据 —— 一个 3 级金字塔 */
export const SEED_SERIES: Series[] = [
  // ─── Pillar 1：技术 ───
  {
    id: 's_tech',
    slug: 'tech',
    name: '技术架构',
    tagline: '把代码做成系统，把系统做成产品',
    description:
      '从单个组件到完整架构：TypeScript 设计模式、可插拔适配器、内容站全套搭建。每一篇都是实战经验的沉淀。',
    cover:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="800" height="200" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif" font-weight="bold" dominant-baseline="middle">技术架构</text></svg>',
      ),
    order: 1,
    keywords: ['架构', 'TypeScript', '系统设计', '可插拔'],
    isPillar: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 's_auth_arch',
    slug: 'auth-architecture',
    name: '鉴权架构',
    tagline: '从 Mock 到 OAuth，权限设计全攻略',
    description:
      '可插拔鉴权设计的方方面面：接口抽象、Mock 实现、JWT、OAuth、RBAC 权限模型。',
    parentId: 's_tech',
    order: 1,
    keywords: ['鉴权', 'JWT', 'OAuth', 'RBAC'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 's_storage_design',
    slug: 'storage-design',
    name: '存储设计',
    tagline: '数据如何在不同场景下自由流动',
    description: 'Storage Adapter 模式、LocalStorage / IndexedDB / REST API 的取舍。',
    parentId: 's_tech',
    order: 2,
    keywords: ['存储', 'IndexedDB', 'REST', '适配器'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  // ─── Pillar 2：内容站运营 ───
  {
    id: 's_growth',
    slug: 'content-site-growth',
    name: '内容站运营',
    tagline: '一个人也能月入百万的内容站方法论',
    description:
      '从选题、SEO、内链结构到私域变现——完整可复用的内容站方法论。覆盖技术、教程、生活方式等任何细分。',
    cover:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="800" height="200" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif" font-weight="bold" dominant-baseline="middle">内容站运营</text></svg>',
      ),
    order: 2,
    keywords: ['内容站', 'SEO', '私域', '变现'],
    isPillar: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 's_seo',
    slug: 'seo',
    name: 'SEO 与发现',
    tagline: '让搜索引擎和 AI 都把你当答案',
    description:
      'Google 自然搜索 + AI 搜索（ChatGPT / Perplexity / Google AI Overview）的双引擎优化。',
    parentId: 's_growth',
    order: 1,
    keywords: ['SEO', 'AI 搜索', '长尾词', '内链'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 's_monetization',
    slug: 'monetization',
    name: '变现与私域',
    tagline: '广告打底，私域兜底，产品封顶',
    description: '展示广告、邮件订阅、电子书、付费课程——三段式变现的实操。',
    parentId: 's_growth',
    order: 2,
    keywords: ['变现', '广告', '邮件列表', '电子书'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  // ─── Pillar 3：设计 ───
  {
    id: 's_design',
    slug: 'design',
    name: '设计与体验',
    tagline: '克制、精致、有节奏',
    description: 'UI / UX / 排版 / 暗色模式细节 / 主题系统设计。',
    cover:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="800" height="200" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif" font-weight="bold" dominant-baseline="middle">设计与体验</text></svg>',
      ),
    order: 3,
    keywords: ['设计', 'UX', '排版', '主题'],
    isPillar: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

/** 加载主题簇（首次运行写入种子） */
export function loadSeries(): Series[] {
  if (typeof window === 'undefined') return SEED_SERIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SERIES));
      return SEED_SERIES;
    }
    return JSON.parse(raw) as Series[];
  } catch {
    return SEED_SERIES;
  }
}

function persistSeries(items: Series[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** 简易全局 Series 存储（订阅模式） */
class SeriesStore {
  private items: Series[] = [];
  private listeners = new Set<(items: Series[]) => void>();

  constructor() {
    this.items = loadSeries();
  }

  getAll(): Series[] {
    return [...this.items];
  }

  getById(id: string): Series | undefined {
    return this.items.find((s) => s.id === id);
  }

  getBySlug(slug: string): Series | undefined {
    return this.items.find((s) => s.slug === slug);
  }

  /** 顶层 Pillar（parentId 为空） */
  getPillars(): Series[] {
    return this.items
      .filter((s) => !s.parentId && s.isPillar !== false)
      .sort((a, b) => a.order - b.order);
  }

  /** 某 Pillar 的子 Series */
  getChildren(parentId: string): Series[] {
    return this.items
      .filter((s) => s.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  create(item: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Series {
    const now = new Date().toISOString();
    const newItem: Series = {
      ...item,
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [...this.items, newItem];
    persistSeries(this.items);
    this.emit();
    return newItem;
  }

  update(id: string, partial: Partial<Series>): Series | undefined {
    const idx = this.items.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    const updated: Series = {
      ...this.items[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.items = [...this.items.slice(0, idx), updated, ...this.items.slice(idx + 1)];
    persistSeries(this.items);
    this.emit();
    return updated;
  }

  delete(id: string): void {
    this.items = this.items.filter((s) => s.id !== id && s.parentId !== id);
    persistSeries(this.items);
    this.emit();
  }

  subscribe(cb: (items: Series[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _store: SeriesStore | null = null;
export function getSeriesStore(): SeriesStore {
  if (!_store) _store = new SeriesStore();
  return _store;
}

/** 静态便捷方法 */
export const SeriesStoreStatic = {
  list: (): Series[] => getSeriesStore().getAll(),
  getById: (id: string): Series | undefined => getSeriesStore().getAll().find((s) => s.id === id),
  getBySlug: (slug: string): Series | undefined => getSeriesStore().getAll().find((s) => s.slug === slug),
};