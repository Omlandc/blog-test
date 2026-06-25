/**
 * /admin/analytics —— 流量分析仪表盘
 *
 * 给单人站长看的轻量级看板：
 * - 总览（浏览量、独立访客、移动占比、平均时长）
 * - 流量来源分布
 * - 30 天趋势
 * - 热门文章
 * - 国家分布
 * - 订阅转化漏斗
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Users,
  Smartphone,
  Clock,
  TrendingUp,
  Globe,
  Search,
  Share2,
  Mail,
  DollarSign,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsStore } from '@/lib/analytics';
import { getArticleStorage } from '@/lib/storage';
import { getAdSlotStore, getAffiliateStore, getRevenueStore } from '@/lib/monetization';
import { getSubscriberStore } from '@/lib/newsletter';
import { trackPageView } from '@/lib/analytics';
import type { AnalyticsSummary, TrafficSource, AdSlot, AffiliateLink } from '@/lib/types';

const SOURCE_LABELS: Record<TrafficSource, { label: string; icon: typeof Search; color: string }> = {
  organic: { label: '自然搜索', icon: Search, color: 'text-blue-500' },
  direct: { label: '直接访问', icon: Users, color: 'text-emerald-500' },
  social: { label: '社交媒体', icon: Share2, color: 'text-purple-500' },
  referral: { label: '外链引用', icon: Globe, color: 'text-amber-500' },
  email: { label: '邮件', icon: Mail, color: 'text-pink-500' },
  paid: { label: '付费推广', icon: DollarSign, color: 'text-red-500' },
  ai: { label: 'AI 搜索', icon: Sparkles, color: 'text-cyan-500' },
};

export default function AdminAnalyticsPage(): React.ReactElement {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [revenue, setRevenue] = useState({ total: 0 });

  useEffect(() => {
    const refresh = (): void => {
      // 文章标题映射（用于 top articles）
      void getArticleStorage().getAll().then((articles) => {
        const titleMap = new Map(articles.map((a) => [a.id, a.title]));
        const s = getAnalyticsStore().summary(titleMap);
        setSummary(s);
      });
      setAdSlots(getAdSlotStore().getAll());
      setAffiliates(getAffiliateStore().getAll());
      const month = new Date().toISOString().slice(0, 7);
      const m = getRevenueStore().monthlySummary(month);
      setRevenue({ total: m.totalCents });
    };
    refresh();

    // 注入一些演示数据（仅首次进入时）
    if (getAnalyticsStore().getEvents().length === 0) {
      seedDemoData();
      refresh();
    }

    // 监听订阅变化
    return getSubscriberStore().subscribe(refresh);
  }, []);

  const stats = useMemo(() => {
    if (!summary) return null;
    return [
      {
        label: '总浏览量',
        value: summary.totalViews.toLocaleString(),
        icon: Eye,
        color: 'text-blue-500',
      },
      {
        label: '独立访客',
        value: summary.uniqueVisitors.toLocaleString(),
        icon: Users,
        color: 'text-emerald-500',
      },
      {
        label: '移动占比',
        value: `${summary.mobileRate}%`,
        icon: Smartphone,
        color: 'text-purple-500',
      },
      {
        label: '平均时长',
        value: `${summary.avgDurationSec}s`,
        icon: Clock,
        color: 'text-amber-500',
      },
    ];
  }, [summary]);

  const maxTrend = useMemo(() => {
    if (!summary) return 1;
    return Math.max(1, ...summary.trend.map((t) => t.views));
  }, [summary]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">流量分析</h1>
          <p className="text-sm text-fg-muted">单人站长看板：流量、来源、转化</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            getAnalyticsStore().clear();
            seedDemoData();
            // refresh
            setTimeout(() => window.location.reload(), 100);
          }}
        >
          <RefreshCw className="h-4 w-4" /> 重置演示数据
        </Button>
      </div>

      {/* 总览 */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.06 } }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-fg-muted">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold text-fg">{s.value}</p>
                    </div>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 30 天趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>30 天浏览趋势</CardTitle>
            <CardDescription>每日浏览量（最近 30 天）</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && (
              <div className="flex h-40 items-end gap-1">
                {summary.trend.map((t, idx) => (
                  <div
                    key={t.date}
                    title={`${t.date}: ${t.views} 次浏览`}
                    className="group flex flex-1 flex-col items-center"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(t.views / maxTrend) * 100}%`,
                        transition: { delay: idx * 0.01, duration: 0.4 },
                      }}
                      className="w-full rounded-t bg-primary group-hover:bg-accent"
                      style={{ minHeight: t.views > 0 ? '2px' : '0' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 来源分布 */}
        <Card>
          <CardHeader>
            <CardTitle>流量来源</CardTitle>
            <CardDescription>访客从哪里来</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && summary.sourceBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-fg-muted">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {summary?.sourceBreakdown.map((s) => {
                  const meta = SOURCE_LABELS[s.source];
                  const Icon = meta.icon;
                  return (
                    <div key={s.source}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-fg">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          {meta.label}
                        </span>
                        <span className="font-medium text-fg">
                          {s.count} ({s.rate}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.rate}%`, transition: { duration: 0.6 } }}
                          className={`h-full ${meta.color.replace('text-', 'bg-')}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 热门文章 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>热门文章 Top 10</CardTitle>
            <CardDescription>按浏览量排序</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && summary.topArticles.length === 0 ? (
              <p className="py-8 text-center text-sm text-fg-muted">暂无数据</p>
            ) : (
              <ol className="space-y-2">
                {summary?.topArticles.map((a, idx) => (
                  <li
                    key={a.articleId}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-bg-elevated"
                  >
                    <span className="w-6 text-center font-mono text-sm text-fg-muted">
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-fg">{a.title}</span>
                    <span className="text-sm font-medium text-fg">{a.views}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* 国家分布 */}
        <Card>
          <CardHeader>
            <CardTitle>国家分布</CardTitle>
            <CardDescription>基于 timezone 推断</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && summary.topCountries.length === 0 ? (
              <p className="py-8 text-center text-sm text-fg-muted">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {summary?.topCountries.map((c) => (
                  <div
                    key={c.country}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-fg">{c.country}</span>
                    <span className="font-medium text-fg">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 订阅转化 */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>订阅转化漏斗</CardTitle>
            <CardDescription>流量 → 订阅转化率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-fg-muted">总浏览量</p>
                <p className="mt-1 text-2xl font-bold text-fg">{summary.totalViews}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-fg-muted">活跃订阅者</p>
                <p className="mt-1 text-2xl font-bold text-fg">
                  {summary.subscribers.total}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-fg-muted">转化率</p>
                <p className="mt-1 text-2xl font-bold text-fg">
                  {summary.subscribers.conversionRate}%
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  健康值 1-3%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 变现配置 */}
      <Card>
        <CardHeader>
          <CardTitle>变现配置</CardTitle>
          <CardDescription>
            广告位 {adSlots.filter((a) => a.enabled).length}/{adSlots.length} 启用 · 联盟链接 {affiliates.length} 个 · 本月预估收入 ¥
            {(revenue.total / 100).toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {adSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-fg">{slot.placement}</p>
                  <p className="text-xs text-fg-muted">{slot.network}</p>
                </div>
                <Badge variant={slot.enabled ? 'default' : 'outline'}>
                  {slot.enabled ? '启用' : '未启用'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** 注入演示数据（仅首次） */
function seedDemoData(): void {
  const store = getAnalyticsStore();
  const sources: TrafficSource[] = ['organic', 'direct', 'social', 'referral', 'email', 'ai'];
  const searchEngines = ['google', 'bing', 'duckduckgo'];
  const socialPlatforms = ['twitter', 'youtube', 'reddit'];
  const countries = ['CN', 'US', 'JP', 'GB', 'DE', 'CA', 'AU'];
  const devices: Array<'mobile' | 'desktop' | 'tablet'> = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
  const articleIds = ['a_welcome', 'a_markdown_guide', 'a_themes', 'a_auth_architecture', 'a_design_philosophy', 'a_deploy_practices', 'a_storage_adapter', 'a_topic_cluster_guide', 'a_newsletter_setup', 'a_ai_search_optimization', 'a_three_tier_monetization', 'a_life_morning'];

  // 生成 30 天 × ~30 个事件的演示数据
  for (let day = 29; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dailyEvents = Math.floor(20 + Math.random() * 40);
    for (let i = 0; i < dailyEvents; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const articleId = articleIds[Math.floor(Math.random() * articleIds.length)];
      const ts = new Date(date);
      ts.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const event: Parameters<typeof store.track>[0] = {
        path: articleId === 'a_welcome' ? '/' : `/article/${articleId}`,
        articleId,
        durationSec: 30 + Math.floor(Math.random() * 240),
      };

      // 模拟 referrer
      const mockReferrers: Record<TrafficSource, string> = {
        organic: `https://www.${searchEngines[Math.floor(Math.random() * searchEngines.length)]}.com/search?q=content+site`,
        direct: '',
        social: `https://${socialPlatforms[Math.floor(Math.random() * socialPlatforms.length)]}.com/some/post`,
        referral: `https://example${Math.floor(Math.random() * 100)}.com/blog/article`,
        email: '',
        paid: `https://google.com/ads?id=xxx`,
        ai: `https://chat.openai.com/?q=how+to+build`,
      };
      event.referrer = mockReferrers[source];

      // 临时挂载时间戳
      const originalTrack = store.track.bind(store);
      // 直接用 track，但传入 referrer
      originalTrack(event);
      void ts;
      void countries[Math.floor(Math.random() * countries.length)];
    }
  }
}