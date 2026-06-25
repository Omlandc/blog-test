/**
 * /admin/subscribers —— 订阅者管理
 *
 * 展示邮件订阅列表、来源分布、转化漏斗；支持 CSV 导出。
 * 借鉴细分内容站的"私域兜底"理念。
 */
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Mail, TrendingUp, UserPlus, Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getSubscriberStore } from '@/lib/newsletter';
import type { Subscriber, SubscriberSource } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const SOURCE_LABELS: Record<SubscriberSource, string> = {
  homepage: '首页',
  article: '文章页',
  'exit-intent': '退出弹窗',
  leadmagnet: '引导磁铁',
  admin: '后台导入',
  import: 'CSV 导入',
};

export default function AdminSubscribersPage(): React.ReactElement {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SubscriberSource | ''>('');

  useEffect(() => {
    const store = getSubscriberStore();
    setSubs(store.getAll());
    return store.subscribe(setSubs);
  }, []);

  const stats = useMemo(() => {
    const active = subs.filter((s) => s.status === 'active');
    const sources = new Map<SubscriberSource, number>();
    active.forEach((s) => sources.set(s.source, (sources.get(s.source) ?? 0) + 1));
    const thisMonth = new Date().toISOString().slice(0, 7);
    const newThisMonth = active.filter((s) => s.createdAt.startsWith(thisMonth)).length;
    return { total: active.length, newThisMonth, sources };
  }, [subs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subs.filter((s) => {
      if (sourceFilter && s.source !== sourceFilter) return false;
      if (q && !`${s.email} ${s.name ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [subs, search, sourceFilter]);

  const exportCsv = (): void => {
    const csv = getSubscriberStore().exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">订阅者管理</h1>
          <p className="text-sm text-fg-muted">
            你的"私域"——谷歌算法波动时的护城河
          </p>
        </div>
        <Button onClick={exportCsv}>
          <Download className="h-4 w-4" /> 导出 CSV
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-fg-muted">总订阅者</p>
                <p className="mt-1 text-3xl font-bold text-fg">{stats.total}</p>
              </div>
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-fg-muted">本月新增</p>
                <p className="mt-1 text-3xl font-bold text-fg">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-fg-muted">来源分布</p>
                <div className="mt-2 space-y-1">
                  {Array.from(stats.sources.entries()).map(([s, n]) => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <span className="text-fg-muted">
                        {SOURCE_LABELS[s as SubscriberSource] ?? s}
                      </span>
                      <span className="font-medium text-fg">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <Input
                placeholder="搜索邮箱或昵称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-0.5">
              <button
                onClick={() => setSourceFilter('')}
                className={`rounded px-3 py-1 text-xs ${!sourceFilter ? 'bg-primary text-primary-fg' : 'text-fg-muted'}`}
              >
                全部
              </button>
              {(Object.keys(SOURCE_LABELS) as SubscriberSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`rounded px-3 py-1 text-xs ${sourceFilter === s ? 'bg-primary text-primary-fg' : 'text-fg-muted'}`}
                >
                  {SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无订阅者</CardTitle>
            <CardDescription>把 Newsletter 嵌入文章末尾，开始积累私域</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto mb-3 h-12 w-12 text-fg-muted" />
            <p className="text-fg-muted">还没有人订阅</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-bg-elevated text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="px-4 py-3">邮箱</th>
                    <th className="px-4 py-3">昵称</th>
                    <th className="px-4 py-3">来源</th>
                    <th className="px-4 py-3">标签</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">订阅时间</th>
                    <th className="px-4 py-3">UTM</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: idx * 0.02 } }}
                      className="border-b border-border last:border-0 hover:bg-bg-elevated"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-fg">{s.email}</td>
                      <td className="px-4 py-3 text-fg-muted">{s.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(s.tags ?? []).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'active' ? 'default' : 'outline'}>
                          {s.status === 'active' ? '活跃' : '已退订'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-fg-muted">
                        {[s.utmSource, s.utmMedium, s.utmCampaign].filter(Boolean).join(' / ') || '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}