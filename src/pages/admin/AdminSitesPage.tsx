/**
 * /admin/sites —— 多站点管理
 *
 * 显示 sites.yaml 注册的子仓状态、推送队列、最近推送历史。
 *
 * 这是 v0.9 的最小版，主要做"看"，编辑/CRUD 用 sites.yaml + git。
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Github,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Site {
  id: string;
  name: string;
  description?: string;
  repo: string;
  branch: string;
  enabled: boolean;
  url: string;
  base_path: string;
  paths?: { articles?: string; site_config?: string };
  look?: string;
  sync_articles?: boolean;
  sync_site_config?: boolean;
  sync_base_code?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PendingItem {
  id: string;
  site: string;
  createdAt: string;
  createdBy?: string;
  actions: Array<{ type: string; payload?: { id?: string; title?: string } }>;
  status: string;
  attempts?: number;
  lastError?: string;
}

interface QueueData {
  schemaVersion: number;
  queue: PendingItem[];
  history: PendingItem[];
}

const SITES_YAML = `/sites.yaml`;

export function AdminSitesPage(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([]);
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);

  const loadAll = async (): Promise<void> => {
    setLoading(true);
    try {
      // 读 sites.yaml（用 raw.githubusercontent）
      const sitesText = await fetch(
        'https://raw.githubusercontent.com/Omlandc/blog-system/main/sites.yaml',
      ).then((r) => r.text());
      setSites(parseSitesYaml(sitesText));
      // 读 pending-pushes.json
      const qd = await fetch(
        'https://raw.githubusercontent.com/Omlandc/blog-system/main/data/pending-pushes.json',
      ).then((r) => r.json());
      setQueue(qd);
    } catch (err) {
      toast.show('加载失败', { variant: 'danger', description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const pendingCount = queue?.queue.length ?? 0;
  const failedCount = queue?.queue.filter((q) => (q.attempts ?? 0) >= 3).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-fg">
            <Layers className="h-6 w-6 text-primary" />
            多站点管理
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            主仓为总控台 · 通过 GitHub API 推送内容到各子仓
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadAll()}>
            <RefreshCw className="h-3 w-3" /> 刷新
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFlushing(true);
              toast.show('已请求 flush', {
                description: 'GitHub Action 每 10 分钟自动跑 · 也可手动 trigger',
              });
              setTimeout(() => setFlushing(false), 1500);
            }}
            disabled={flushing}
          >
            {flushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
            触发推送
          </Button>
        </div>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="子仓数量" value={sites.filter((s) => s.enabled).length} icon={Globe} />
        <StatCard label="待推送" value={pendingCount} icon={Clock} accent={pendingCount > 0 ? 'warning' : 'success'} />
        <StatCard label="推送失败" value={failedCount} icon={XCircle} accent={failedCount > 0 ? 'danger' : 'success'} />
      </div>

      {/* 站点列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> 已注册站点
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-fg-muted">
              <Loader2 className="h-5 w-5 animate-spin" /> 加载中…
            </div>
          ) : sites.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">还没有注册站点</p>
          ) : (
            <div className="space-y-3">
              {sites.map((s) => (
                <SiteCard key={s.id} site={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 推送队列 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> 推送队列
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!queue || queue.queue.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-subtle">队列为空</p>
          ) : (
            <div className="space-y-2">
              {queue.queue.map((q) => (
                <QueueRow key={q.id} item={q} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 历史 */}
      {queue && queue.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" /> 最近推送（{queue.history.length}）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {queue.history.slice(-15).reverse().map((h) => (
                <QueueRow key={h.id} item={h} compact />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 架构说明 */}
      <Card className="border-dashed">
        <CardContent className="p-5 text-xs text-fg-muted">
          <p className="mb-2 font-medium text-fg">💡 工作原理</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>主仓 = <strong>总控台</strong>（blog-system）</li>
            <li>子仓 = 各站点的 GitHub Pages 部署（Omlandc/blog-test 等）</li>
            <li>内容编辑 → 写入主仓 <code>data/pending-pushes.json</code> 队列</li>
            <li>GitHub Action <code>flush-content.yml</code> 每 10 分钟自动跑 + 监听队列文件变化立即触发</li>
            <li>手动 trigger：Actions 页面 → Flush Content Queue → Run workflow</li>
            <li>新加站点：编辑 <code>sites.yaml</code> + push 到主仓</li>
            <li>CRUD 站点：未来加 UI（当前用 YAML）</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SiteCard({ site }: { site: Site }): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start justify-between rounded-lg border p-4 transition-colors',
        site.enabled ? 'border-border bg-bg-elevated/40' : 'border-border bg-bg-subtle/30 opacity-60',
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-fg">{site.name}</h3>
          <Badge variant="outline" className="text-xs">{site.id}</Badge>
          {site.look && <Badge variant="secondary" className="text-xs">{site.look}</Badge>}
          {!site.enabled && <Badge variant="warning" className="text-xs">已禁用</Badge>}
        </div>
        {site.description && <p className="mt-0.5 text-xs text-fg-muted">{site.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-fg-subtle">
          <a
            href={`https://github.com/${site.repo}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 hover:text-primary"
          >
            <Github className="h-3 w-3" /> {site.repo}
          </a>
          <span>· {site.branch}</span>
          <span>· base: <code>{site.base_path}</code></span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {site.url && (
          <a
            href={site.url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            访问站点 <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <div className="flex flex-wrap gap-1 text-[10px]">
          {site.sync_articles && <Badge variant="outline" className="text-[10px]">articles</Badge>}
          {site.sync_site_config && <Badge variant="outline" className="text-[10px]">site-config</Badge>}
          {site.sync_base_code && <Badge variant="outline" className="text-[10px]">base-code</Badge>}
        </div>
      </div>
    </motion.div>
  );
}

function QueueRow({
  item,
  compact = false,
}: {
  item: PendingItem;
  compact?: boolean;
}): React.ReactElement {
  const isFailed = item.status === 'failed' || (item.attempts ?? 0) >= 3;
  const isDone = item.status === 'done';
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
        isFailed
          ? 'border-danger/30 bg-danger/5 text-danger'
          : isDone
          ? 'border-success/30 bg-success/5 text-success'
          : 'border-border bg-bg-subtle/30',
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        {isFailed ? (
          <XCircle className="h-3 w-3 shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="h-3 w-3 shrink-0" />
        ) : (
          <Clock className="h-3 w-3 shrink-0 animate-pulse" />
        )}
        <span className="font-mono text-[10px]">{item.id.slice(0, 8)}</span>
        <Badge variant="outline" className="text-[10px]">{item.site}</Badge>
        <span className="truncate text-fg">
          {item.actions
            .map((a) => `${a.type}${a.payload?.title ? `: ${a.payload.title}` : ''}${a.payload?.id ? ` (${a.payload.id.slice(0, 8)})` : ''}`)
            .join(', ')}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[10px] text-fg-subtle">
        {item.attempts ? <span>尝试 {item.attempts}</span> : null}
        {item.createdBy && <span>by {item.createdBy}</span>}
        <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'neutral',
}: {
  label: string;
  value: number;
  icon: typeof Globe;
  accent?: 'neutral' | 'success' | 'warning' | 'danger';
}): React.ReactElement {
  const colorMap = {
    neutral: 'text-fg',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('rounded-md bg-bg-elevated p-2', colorMap[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-fg-muted">{label}</div>
          <div className={cn('text-xl font-bold', colorMap[accent])}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  简单 YAML 解析（sites.yaml 的扁平结构）                             */
/* ------------------------------------------------------------------ */
function parseSitesYaml(text: string): Site[] {
  const sites: Site[] = [];
  let current: Record<string, unknown> | null = null;
  let inPaths = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (line.match(/^\s*-\s+id:/)) {
      if (current) sites.push(current as unknown as Site);
      const id = line.match(/id:\s*['"]?([^'"\s]+)/)?.[1] ?? '';
      current = { id, enabled: true, paths: {} };
      inPaths = false;
    } else if (line.match(/^\s{2}paths:/)) {
      inPaths = true;
      if (current && !current.paths) current.paths = {};
    } else if (current && line.match(/^\s{4}\w/)) {
      const m = line.match(/^\s{4}(\w+):\s*(.*)$/);
      if (m) {
        if (inPaths) {
          (current.paths as Record<string, string>)[m[1]!] = m[2]!.replace(/['"]/g, '').trim();
        } else {
          let v: unknown = m[2]!.replace(/['"]/g, '').trim();
          if (v === 'true') v = true;
          else if (v === 'false') v = false;
          current[m[1]!] = v;
        }
      }
    }
  }
  if (current) sites.push(current as unknown as Site);
  return sites;
}