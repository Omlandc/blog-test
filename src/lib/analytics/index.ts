/**
 * Analytics —— 轻量级流量分析
 *
 * 单人站长看的流量看板：来源分布、设备分布、热门文章、转化漏斗。
 * 不接 GA / Mixpanel，存 localStorage 即可。
 */
import type { AnalyticsEvent, AnalyticsSummary, TrafficSource } from '../types';

export type { AnalyticsEvent, AnalyticsSummary, TrafficSource } from '../types';

const EVENTS_KEY = 'blog-system:analytics:events';
const MAX_EVENTS = 5000;

function loadEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnalyticsEvent[];
  } catch {
    return [];
  }
}

function persistEvents(events: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return;
  // 保留最近 MAX_EVENTS 条
  const trimmed =
    events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
}

/** 解析 referrer 推断来源 */
export function inferSource(
  referrer: string,
  utm?: { source?: string; medium?: string },
): { source: TrafficSource; searchEngine?: string; socialPlatform?: string } {
  // UTM 优先
  if (utm?.source) {
    const s = utm.source.toLowerCase();
    if (s.includes('google') || s.includes('bing') || s.includes('yahoo') || s.includes('duck')) {
      return { source: 'organic', searchEngine: s };
    }
    if (s.includes('twitter') || s.includes('facebook') || s.includes('youtube') || s.includes('instagram')) {
      return { source: 'social', socialPlatform: s };
    }
    if (s.includes('email') || s.includes('mailchimp') || s.includes('beehiiv')) {
      return { source: 'email' };
    }
    if (s.includes('cpc') || s.includes('paid') || s.includes('ad')) {
      return { source: 'paid' };
    }
    if (utm.medium === 'referral') return { source: 'referral' };
    return { source: 'referral' };
  }

  if (!referrer || referrer === '') {
    return { source: 'direct' };
  }
  const r = referrer.toLowerCase();
  if (r.includes('google') || r.includes('bing.com') || r.includes('duckduckgo')) {
    const se = r.includes('google')
      ? 'google'
      : r.includes('bing')
        ? 'bing'
        : 'duckduckgo';
    return { source: 'organic', searchEngine: se };
  }
  if (r.includes('chatgpt') || r.includes('perplexity') || r.includes('claude')) {
    return { source: 'ai' };
  }
  if (r.includes('twitter.com') || r.includes('x.com')) {
    return { source: 'social', socialPlatform: 'twitter' };
  }
  if (r.includes('youtube.com')) {
    return { source: 'social', socialPlatform: 'youtube' };
  }
  if (r.includes('facebook.com')) {
    return { source: 'social', socialPlatform: 'facebook' };
  }
  if (r.includes('reddit.com')) {
    return { source: 'social', socialPlatform: 'reddit' };
  }
  if (r.includes('localhost') || r.includes(window.location.hostname)) {
    return { source: 'direct' };
  }
  return { source: 'referral' };
}

/** 检测设备类型 */
export function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(ua)) return 'mobile';
  return 'desktop';
}

/** 粗粒度国家检测（基于 timezone） */
export function detectCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const map: Record<string, string> = {
      'Asia/Shanghai': 'CN',
      'Asia/Beijing': 'CN',
      'Asia/Hong_Kong': 'HK',
      'Asia/Taipei': 'TW',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Toronto': 'CA',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Australia/Sydney': 'AU',
    };
    return map[tz] ?? tz.split('/')[0] ?? 'Unknown';
  } catch {
    return 'Unknown';
  }
}

class AnalyticsStore {
  private events: AnalyticsEvent[] = [];
  private listeners = new Set<(events: AnalyticsEvent[]) => void>();

  constructor() {
    this.events = loadEvents();
  }

  track(input: {
    path: string;
    articleId?: string;
    referrer?: string;
    durationSec?: number;
    subscribed?: boolean;
  }): AnalyticsEvent {
    const utm = (() => {
      try {
        const u = new URL(window.location.href);
        const source = u.searchParams.get('utm_source') ?? undefined;
        const medium = u.searchParams.get('utm_medium') ?? undefined;
        return { source, medium };
      } catch {
        return {};
      }
    })();
    const inferred = inferSource(input.referrer ?? document.referrer, utm);
    const event: AnalyticsEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      path: input.path,
      articleId: input.articleId,
      source: inferred.source,
      searchEngine: inferred.searchEngine,
      socialPlatform: inferred.socialPlatform,
      device: detectDevice(),
      country: detectCountry(),
      durationSec: input.durationSec,
      subscribed: input.subscribed,
      referrer: input.referrer ?? document.referrer,
      timestamp: new Date().toISOString(),
    };
    this.events = [...this.events, event];
    persistEvents(this.events);
    this.emit();
    return event;
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /** 生成汇总 */
  summary(articleTitleMap?: Map<string, string>): AnalyticsSummary {
    const events = this.events;
    if (events.length === 0) {
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        avgDurationSec: 0,
        mobileRate: 0,
        sourceBreakdown: [],
        topArticles: [],
        topCountries: [],
        trend: [],
        subscribers: { total: 0, newThisMonth: 0, conversionRate: 0 },
      };
    }

    const totalViews = events.length;
    const uniqueVisitors = new Set(events.map((e) => e.referrer ?? e.path)).size;
    const durations = events.filter((e) => e.durationSec).map((e) => e.durationSec!);
    const avgDurationSec =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    const mobileCount = events.filter((e) => e.device === 'mobile').length;
    const mobileRate = Math.round((mobileCount / totalViews) * 100);

    // 来源分布
    const sourceMap = new Map<TrafficSource, number>();
    events.forEach((e) => sourceMap.set(e.source, (sourceMap.get(e.source) ?? 0) + 1));
    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        rate: Math.round((count / totalViews) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // 热门文章
    const articleMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.articleId) articleMap.set(e.articleId, (articleMap.get(e.articleId) ?? 0) + 1);
    });
    const topArticles = Array.from(articleMap.entries())
      .map(([articleId, views]) => ({
        articleId,
        title: articleTitleMap?.get(articleId) ?? articleId,
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 热门国家
    const countryMap = new Map<string, number>();
    events.forEach((e) => {
      if (e.country) countryMap.set(e.country, (countryMap.get(e.country) ?? 0) + 1);
    });
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 30 天趋势
    const trend: Array<{ date: string; views: number }> = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const count = events.filter((e) => e.timestamp.slice(0, 10) === date).length;
      trend.push({ date, views: count });
    }

    // 订阅者统计（从 subscribers key 读）
    let subsTotal = 0;
    let subsThisMonth = 0;
    let conversionRate = 0;
    try {
      const subsRaw = window.localStorage.getItem('blog-system:subscribers');
      if (subsRaw) {
        const subs = JSON.parse(subsRaw) as Array<{ status: string; createdAt: string }>;
        subsTotal = subs.filter((s) => s.status === 'active').length;
        const thisMonth = new Date().toISOString().slice(0, 7);
        subsThisMonth = subs.filter(
          (s) => s.status === 'active' && s.createdAt.slice(0, 7) === thisMonth,
        ).length;
      }
      conversionRate = totalViews > 0 ? Math.round((subsTotal / totalViews) * 1000) / 10 : 0;
    } catch {
      // ignore
    }

    return {
      totalViews,
      uniqueVisitors,
      avgDurationSec,
      mobileRate,
      sourceBreakdown,
      topArticles,
      topCountries,
      trend,
      subscribers: {
        total: subsTotal,
        newThisMonth: subsThisMonth,
        conversionRate,
      },
    };
  }

  clear(): void {
    this.events = [];
    persistEvents(this.events);
    this.emit();
  }

  subscribe(cb: (events: AnalyticsEvent[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb(this.getEvents()));
  }
}

let _analytics: AnalyticsStore | null = null;
export function getAnalyticsStore(): AnalyticsStore {
  if (!_analytics) _analytics = new AnalyticsStore();
  return _analytics;
}

/** 便捷的页面访问埋点 */
export function trackPageView(path: string, articleId?: string): void {
  getAnalyticsStore().track({ path, articleId });
}