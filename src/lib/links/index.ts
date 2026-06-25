/**
 * Links Store —— 资源导航的 CRUD + 持久化
 *
 * 数据存 localStorage（与 Article/Series/LeadMagnet 同模式），
 * 可被静态 bundle 覆盖（与 SiteConfig 同机制）。
 */
import { useEffect, useState } from 'react';
import type { LinkEntry, LinkCategory } from './types';
import { CATEGORY_META } from './types';
import { SEED_LINKS } from './seed';

export type { LinkEntry, LinkCategory, LinkPricing } from './types';
export { CATEGORY_META, PRICING_META } from './types';
export { SEED_LINKS } from './seed';

const STORAGE_KEY = 'blog-system:links';

function load(): LinkEntry[] {
  if (typeof window === 'undefined') return SEED_LINKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LINKS;
    const parsed = JSON.parse(raw) as LinkEntry[];
    if (!Array.isArray(parsed)) return SEED_LINKS;
    return parsed.length > 0 ? parsed : SEED_LINKS;
  } catch {
    return SEED_LINKS;
  }
}

function persist(items: LinkEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

class LinkStore {
  private items: LinkEntry[] = [];
  private listeners = new Set<(items: LinkEntry[]) => void>();

  constructor() {
    this.items = load();
  }

  getAll(): LinkEntry[] {
    return [...this.items].sort((a, b) => {
      // featured 优先，再按 order
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.order - b.order;
    });
  }

  getByCategory(cat: LinkCategory): LinkEntry[] {
    return this.getAll().filter((l) => l.category === cat);
  }

  getFeatured(): LinkEntry[] {
    return this.getAll().filter((l) => l.featured).slice(0, 6);
  }

  getById(id: string): LinkEntry | undefined {
    return this.items.find((l) => l.id === id);
  }

  create(item: Omit<LinkEntry, 'id' | 'createdAt' | 'updatedAt' | 'clicks'>): LinkEntry {
    const newItem: LinkEntry = {
      ...item,
      id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items = [...this.items, newItem];
    persist(this.items);
    this.emit();
    return newItem;
  }

  update(id: string, partial: Partial<LinkEntry>): LinkEntry | undefined {
    const idx = this.items.findIndex((l) => l.id === id);
    if (idx < 0) return undefined;
    const updated: LinkEntry = {
      ...this.items[idx],
      ...partial,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.items = [...this.items.slice(0, idx), updated, ...this.items.slice(idx + 1)];
    persist(this.items);
    this.emit();
    return updated;
  }

  delete(id: string): void {
    this.items = this.items.filter((l) => l.id !== id);
    persist(this.items);
    this.emit();
  }

  /** 点击 +1（前端累计） */
  incrementClicks(id: string): void {
    this.update(id, { clicks: (this.getById(id)?.clicks ?? 0) + 1 });
  }

  /** 全量替换（用于 bundle 导入） */
  replaceAll(items: LinkEntry[]): void {
    this.items = items;
    persist(this.items);
    this.emit();
  }

  subscribe(cb: (items: LinkEntry[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _store: LinkStore | null = null;
export function getLinkStore(): LinkStore {
  if (!_store) _store = new LinkStore();
  return _store;
}

/** 静态便捷方法（与 SeriesStoreStatic 同风格） */
export const LinkStoreStatic = {
  list: () => getLinkStore().getAll(),
  byCategory: (cat: LinkCategory) => getLinkStore().getByCategory(cat),
  featured: () => getLinkStore().getFeatured(),
  getById: (id: string) => getLinkStore().getById(id),
  click: (id: string) => getLinkStore().incrementClicks(id),
};

/** React Hook —— 订阅 link store 变更 */
export function useLinks(): {
  links: LinkEntry[];
  featured: LinkEntry[];
  byCategory: (cat: LinkCategory) => LinkEntry[];
  create: (item: Omit<LinkEntry, 'id' | 'createdAt' | 'updatedAt' | 'clicks'>) => LinkEntry;
  update: (id: string, partial: Partial<LinkEntry>) => LinkEntry | undefined;
  remove: (id: string) => void;
  click: (id: string) => void;
} {
  const [links, setLinks] = useState<LinkEntry[]>(() => LinkStoreStatic.list());
  useEffect(() => {
    return getLinkStore().subscribe(setLinks);
  }, []);
  return {
    links,
    featured: links.filter((l) => l.featured).slice(0, 6),
    byCategory: (cat: LinkCategory) => links.filter((l) => l.category === cat),
    create: (item) => getLinkStore().create(item),
    update: (id, partial) => getLinkStore().update(id, partial),
    remove: (id) => getLinkStore().delete(id),
    click: (id) => getLinkStore().incrementClicks(id),
  };
}
