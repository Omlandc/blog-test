/**
 * Newsletter —— 邮件订阅与 Lead Magnet
 *
 * "谷歌流量是租来的，邮件列表才是自己的。"
 * 这是内容站对抗算法波动的护城河。
 */
import type { Subscriber, LeadMagnet, SubscriberSource } from '../types';

export type { Subscriber, LeadMagnet, SubscriberSource } from '../types';

const SUBSCRIBERS_KEY = 'blog-system:subscribers';
const MAGNETS_KEY = 'blog-system:lead-magnets';

export const SEED_LEAD_MAGNETS: LeadMagnet[] = [
  {
    id: 'lm_seo_checklist',
    title: '细分内容站 SEO 自检表',
    subtitle: '90 个检查项，覆盖技术 / 内容 / 外链',
    description:
      '我们把研究 50+ 个细分内容站总结出的 SEO 自检项整理成可勾选的清单，从站点结构、长尾词布局、内链策略到 AI 搜索适配。',
    hook: 'pdf',
    fileUrl: '#',
    keywords: ['SEO', '内容站', '自检'],
    cta: '免费下载 PDF',
    enabled: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'lm_50_recipes',
    title: '中餐海外厨房替代方案 50 例',
    subtitle: '在英国、美国、澳洲也能找到的调料',
    description:
      '我们采访了在 12 个国家生活的中餐厨师，整理出 50 个"在海外也能买到"的调料与食材替代方案。',
    hook: 'ebook',
    fileUrl: '#',
    keywords: ['中餐', '海外', '替代'],
    cta: '免费领取电子书',
    enabled: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'lm_topic_cluster',
    title: '主题簇搭建模板',
    subtitle: '可复用的 Pillar → Cluster → Article 模板',
    description: '从主题调研到内容布局的完整 Notion 模板，附带 30 个细分领域的真实案例。',
    hook: 'template',
    fileUrl: '#',
    keywords: ['主题簇', 'Pillar', '模板'],
    cta: '获取模板',
    enabled: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

function loadArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function persistArray<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

/** 解析 UTM 参数（从 URL） */
export function parseUtm(url: string = window.location.href): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  try {
    const u = new URL(url);
    return {
      utmSource: u.searchParams.get('utm_source') ?? undefined,
      utmMedium: u.searchParams.get('utm_medium') ?? undefined,
      utmCampaign: u.searchParams.get('utm_campaign') ?? undefined,
    };
  } catch {
    return {};
  }
}

class SubscriberStore {
  private items: Subscriber[] = [];
  private listeners = new Set<(items: Subscriber[]) => void>();

  constructor() {
    this.items = loadArray<Subscriber>(SUBSCRIBERS_KEY, []);
  }

  getAll(): Subscriber[] {
    return [...this.items];
  }

  getActive(): Subscriber[] {
    return this.items.filter((s) => s.status === 'active');
  }

  isSubscribed(email: string): boolean {
    return this.items.some(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.status === 'active',
    );
  }

  subscribeEmail(
    input: {
      email: string;
      name?: string;
      source: SubscriberSource;
      sourceArticleId?: string;
      leadMagnetId?: string;
      tags?: string[];
    },
  ): Subscriber {
    const existing = this.items.find(
      (s) => s.email.toLowerCase() === input.email.toLowerCase(),
    );
    const utm = parseUtm();
    const now = new Date().toISOString();

    if (existing) {
      // 已存在则更新状态
      const updated: Subscriber = {
        ...existing,
        status: 'active',
        unsubscribedAt: undefined,
        source: input.source,
        sourceArticleId: input.sourceArticleId ?? existing.sourceArticleId,
        leadMagnets: input.leadMagnetId
          ? Array.from(new Set([...(existing.leadMagnets ?? []), input.leadMagnetId]))
          : existing.leadMagnets,
        tags: Array.from(new Set([...(existing.tags ?? []), ...(input.tags ?? [])])),
        utmSource: utm.utmSource ?? existing.utmSource,
        utmMedium: utm.utmMedium ?? existing.utmMedium,
        utmCampaign: utm.utmCampaign ?? existing.utmCampaign,
      };
      this.items = this.items.map((s) => (s.id === existing.id ? updated : s));
      persistArray(SUBSCRIBERS_KEY, this.items);
      this.emit();
      return updated;
    }

    const newSub: Subscriber = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || undefined,
      source: input.source,
      sourceArticleId: input.sourceArticleId,
      tags: input.tags ?? [],
      leadMagnets: input.leadMagnetId ? [input.leadMagnetId] : undefined,
      status: 'active',
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      createdAt: now,
    };
    this.items = [newSub, ...this.items];
    persistArray(SUBSCRIBERS_KEY, this.items);
    this.emit();
    return newSub;
  }

  unsubscribe(email: string): void {
    const now = new Date().toISOString();
    this.items = this.items.map((s) =>
      s.email.toLowerCase() === email.toLowerCase()
        ? { ...s, status: 'unsubscribed' as const, unsubscribedAt: now }
        : s,
    );
    persistArray(SUBSCRIBERS_KEY, this.items);
    this.emit();
  }

  delete(id: string): void {
    this.items = this.items.filter((s) => s.id !== id);
    persistArray(SUBSCRIBERS_KEY, this.items);
    this.emit();
  }

  /** 导出 CSV */
  exportCsv(): string {
    const header = [
      'email',
      'name',
      'source',
      'tags',
      'status',
      'createdAt',
      'utmSource',
      'utmMedium',
      'utmCampaign',
    ];
    const rows = this.items.map((s) =>
      [
        s.email,
        s.name ?? '',
        s.source,
        (s.tags ?? []).join(';'),
        s.status,
        s.createdAt,
        s.utmSource ?? '',
        s.utmMedium ?? '',
        s.utmCampaign ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  subscribe(cb: (items: Subscriber[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _subs: SubscriberStore | null = null;
export function getSubscriberStore(): SubscriberStore {
  if (!_subs) _subs = new SubscriberStore();
  return _subs;
}

/* ============================================================
 * Lead Magnet Store
 * ============================================================ */

class LeadMagnetStore {
  private items: LeadMagnet[] = [];
  private listeners = new Set<(items: LeadMagnet[]) => void>();

  constructor() {
    this.items = loadArray<LeadMagnet>(MAGNETS_KEY, SEED_LEAD_MAGNETS);
  }

  getAll(): LeadMagnet[] {
    return [...this.items];
  }

  getEnabled(): LeadMagnet[] {
    return this.items.filter((m) => m.enabled);
  }

  getById(id: string): LeadMagnet | undefined {
    return this.items.find((m) => m.id === id);
  }

  create(item: Omit<LeadMagnet, 'id' | 'createdAt'>): LeadMagnet {
    const newItem: LeadMagnet = {
      ...item,
      id: `lm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.items = [...this.items, newItem];
    persistArray(MAGNETS_KEY, this.items);
    this.emit();
    return newItem;
  }

  update(id: string, partial: Partial<LeadMagnet>): LeadMagnet | undefined {
    const idx = this.items.findIndex((m) => m.id === id);
    if (idx < 0) return undefined;
    const updated = { ...this.items[idx], ...partial };
    this.items = [...this.items.slice(0, idx), updated, ...this.items.slice(idx + 1)];
    persistArray(MAGNETS_KEY, this.items);
    this.emit();
    return updated;
  }

  delete(id: string): void {
    this.items = this.items.filter((m) => m.id !== id);
    persistArray(MAGNETS_KEY, this.items);
    this.emit();
  }

  subscribe(cb: (items: LeadMagnet[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getAll()));
  }
}

let _magnets: LeadMagnetStore | null = null;
export function getLeadMagnetStore(): LeadMagnetStore {
  if (!_magnets) _magnets = new LeadMagnetStore();
  return _magnets;
}

/** 验证邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}