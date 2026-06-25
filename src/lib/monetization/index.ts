/**
 * Monetization —— 变现配置
 *
 * "广告打底，私域兜底，产品封顶" 的三段式变现支撑。
 */
import type {
  AdSlot,
  AffiliateLink,
  RevenueRecord,
  AdPlacement,
} from '../types';

export type { AdSlot, AffiliateLink, RevenueRecord, AdPlacement } from '../types';

const ADS_KEY = 'blog-system:ad-slots';
const AFFILIATES_KEY = 'blog-system:affiliate-links';
const REVENUE_KEY = 'blog-system:revenue';

export const DEFAULT_AD_SLOTS: AdSlot[] = [
  {
    id: 'ad_header',
    placement: 'header',
    network: 'custom',
    slotId: '',
    customHtml: '',
    enabled: false,
  },
  {
    id: 'ad_in_article',
    placement: 'in-article-mid',
    network: 'custom',
    slotId: '',
    customHtml: '',
    enabled: false,
  },
  {
    id: 'ad_sidebar',
    placement: 'sidebar',
    network: 'custom',
    slotId: '',
    customHtml: '',
    enabled: false,
  },
  {
    id: 'ad_footer',
    placement: 'footer',
    network: 'custom',
    slotId: '',
    customHtml: '',
    enabled: false,
  },
];

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persist<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/* ============================================================
 * Ad Slots
 * ============================================================ */

class AdSlotStore {
  private items: AdSlot[] = [];
  private listeners = new Set<(items: AdSlot[]) => void>();

  constructor() {
    this.items = load(ADS_KEY, DEFAULT_AD_SLOTS);
  }

  getAll(): AdSlot[] {
    return [...this.items];
  }

  getEnabled(): AdSlot[] {
    return this.items.filter((s) => s.enabled);
  }

  getByPlacement(placement: AdPlacement): AdSlot | undefined {
    return this.items.find((s) => s.placement === placement && s.enabled);
  }

  update(id: string, partial: Partial<AdSlot>): AdSlot | undefined {
    const idx = this.items.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    const updated = { ...this.items[idx], ...partial };
    this.items = [...this.items.slice(0, idx), updated, ...this.items.slice(idx + 1)];
    persist(ADS_KEY, this.items);
    this.emit();
    return updated;
  }

  subscribe(cb: (items: AdSlot[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _ads: AdSlotStore | null = null;
export function getAdSlotStore(): AdSlotStore {
  if (!_ads) _ads = new AdSlotStore();
  return _ads;
}

/* ============================================================
 * Affiliate Links
 * ============================================================ */

class AffiliateStore {
  private items: AffiliateLink[] = [];
  private listeners = new Set<(items: AffiliateLink[]) => void>();

  constructor() {
    this.items = load(AFFILIATES_KEY, []);
  }

  getAll(): AffiliateLink[] {
    return [...this.items];
  }

  getForArticle(articleId: string): AffiliateLink[] {
    return this.items.filter((l) => l.articleId === articleId);
  }

  create(input: Omit<AffiliateLink, 'id' | 'createdAt' | 'clicks'>): AffiliateLink {
    const link: AffiliateLink = {
      ...input,
      id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    this.items = [link, ...this.items];
    persist(AFFILIATES_KEY, this.items);
    this.emit();
    return link;
  }

  incrementClicks(id: string): void {
    const idx = this.items.findIndex((l) => l.id === id);
    if (idx < 0) return;
    this.items[idx] = { ...this.items[idx], clicks: (this.items[idx].clicks ?? 0) + 1 };
    persist(AFFILIATES_KEY, this.items);
    this.emit();
  }

  delete(id: string): void {
    this.items = this.items.filter((l) => l.id !== id);
    persist(AFFILIATES_KEY, this.items);
    this.emit();
  }

  subscribe(cb: (items: AffiliateLink[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _aff: AffiliateStore | null = null;
export function getAffiliateStore(): AffiliateStore {
  if (!_aff) _aff = new AffiliateStore();
  return _aff;
}

/* ============================================================
 * Revenue Records
 * ============================================================ */

class RevenueStore {
  private items: RevenueRecord[] = [];
  private listeners = new Set<(items: RevenueRecord[]) => void>();

  constructor() {
    this.items = load(REVENUE_KEY, []);
  }

  getAll(): RevenueRecord[] {
    return [...this.items];
  }

  add(record: Omit<RevenueRecord, 'id'>): RevenueRecord {
    const r: RevenueRecord = {
      ...record,
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    this.items = [r, ...this.items];
    persist(REVENUE_KEY, this.items);
    this.emit();
    return r;
  }

  delete(id: string): void {
    this.items = this.items.filter((r) => r.id !== id);
    persist(REVENUE_KEY, this.items);
    this.emit();
  }

  /** 月度汇总 */
  monthlySummary(yearMonth: string): {
    totalCents: number;
    bySource: Record<string, number>;
  } {
    const monthItems = this.items.filter((r) => r.date.startsWith(yearMonth));
    const totalCents = monthItems.reduce((sum, r) => sum + r.amountCents, 0);
    const bySource: Record<string, number> = {};
    monthItems.forEach((r) => {
      bySource[r.source] = (bySource[r.source] ?? 0) + r.amountCents;
    });
    return { totalCents, bySource };
  }

  subscribe(cb: (items: RevenueRecord[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _rev: RevenueStore | null = null;
export function getRevenueStore(): RevenueStore {
  if (!_rev) _rev = new RevenueStore();
  return _rev;
}