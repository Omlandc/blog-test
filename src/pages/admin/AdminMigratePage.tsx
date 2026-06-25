/**
 * /admin/migrate —— 数据迁移工具
 *
 * 流程：
 * 1. 探测：扫 localStorage 关键 key + 检测 public/data/articles.json
 * 2. 推断当前 schema 版本
 * 3. 列出从当前到 v0.7 的所有改动（change log）
 * 4. 一键迁移：合并 localStorage → 写 public/data/articles.json + 备份原文件
 * 5. 显示迁移报告
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  FileSearch,
  ArrowRight,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  History,
  Save,
  Sparkles,
  FileJson,
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
import { toast } from '@/components/ui/toast';
import {
  detectLocalStorage,
  runMigrations,
  needsMigration,
  CURRENT_VERSION,
  ALL_VERSIONS,
  type SourceDetection,
  type MigrationResult,
  type FieldChange,
} from '@/lib/migration';
import { cn } from '@/lib/utils';
import { getArticleStorage } from '@/lib/storage';
import { getSeriesStore } from '@/lib/series';
import { getLinkStore } from '@/lib/links';
import { getLeadMagnetStore } from '@/lib/newsletter';
import { useSiteConfig } from '@/lib/site-config';

export default function AdminMigratePage(): React.ReactElement {
  const [sources, setSources] = useState<SourceDetection[]>([]);
  const [bundle, setBundle] = useState<unknown | null>(null);
  const [bundleFile, setBundleFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { config, tools } = useSiteConfig();

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    setResult(null);
    setSources(detectLocalStorage());

    // 尝试 fetch public/data/articles.json
    try {
      const r = await fetch('/data/articles.json', { cache: 'no-store' });
      if (r.ok) {
        const json = await r.json();
        setBundle(json);
        setBundleFile('public/data/articles.json');
      } else {
        setBundle(null);
        setBundleFile(null);
      }
    } catch {
      setBundle(null);
      setBundleFile(null);
    }
    setLoading(false);
  };

  /** 从 localStorage 组装当前 bundle（用真实 store 取数据） */
  const buildCurrentBundle = (): Record<string, unknown> => {
    const articles = (getArticleStorage() as unknown as { getAll: () => unknown[] }).getAll?.() ?? [];
    const series = (getSeriesStore() as unknown as { getAll: () => unknown[] }).getAll?.() ?? [];
    const links = (getLinkStore() as unknown as { getAll: () => unknown[] }).getAll?.() ?? [];
    const leadMagnets = (getLeadMagnetStore() as unknown as { getAll: () => unknown[] }).getAll?.() ?? [];
    return {
      version: '0.6.0', // 假定 localStorage 是最新结构（开发用）
      generatedAt: new Date().toISOString(),
      articles,
      series,
      leadMagnets,
      links,
      siteConfig: config,
      tools,
    };
  };

  const sourceBundle = bundle ?? (sources.some((s) => s.exists && s.itemCount > 0) ? buildCurrentBundle() : null);
  const version = sourceBundle ? (sourceBundle as { version?: string }).version ?? '0.0.0' : '0.0.0';
  const upgradeAvailable = sourceBundle ? needsMigration(sourceBundle) : false;

  const runAnalysis = (): void => {
    if (!sourceBundle) {
      toast.show('没有可分析的数据', { variant: 'warning' });
      return;
    }
    setRunning(true);
    try {
      const r = runMigrations(sourceBundle, CURRENT_VERSION);
      setResult(r);
      toast.show('分析完成', {
        description: `从 ${r.fromVersion} → ${r.toVersion} · ${r.changes.length} 项改动`,
      });
    } catch (e) {
      toast.show('分析失败', { variant: 'danger', description: e instanceof Error ? e.message : String(e) });
    }
    setRunning(false);
  };

  const downloadResult = (): void => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migrated-${result.toVersion}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show('已下载', { description: `migrated-${result.toVersion}-*.json` });
  };

  const saveToProject = async (): Promise<void> => {
    if (!result) return;
    try {
      const res = await fetch('/__blog/save-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.bundle),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.show('已保存到项目', {
          description: `public/data/articles.json · ${data.articleCount} 篇`,
        });
        await refresh();
      } else {
        toast.show('保存失败', { variant: 'danger', description: data.error ?? '未知错误' });
      }
    } catch (e) {
      toast.show('保存失败', { variant: 'danger', description: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-fg">
          <Database className="h-6 w-6 text-primary" />
          数据迁移
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          把旧版本 localStorage / bundle JSON 升级到当前 schema · 不丢字段
        </p>
      </div>

      {/* 1. 数据源探测 */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSearch className="h-4 w-4" /> 数据源探测
              </CardTitle>
              <CardDescription>
                扫描 localStorage + public/data/articles.json · 推断当前 schema 版本
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> 重新探测
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-fg-muted">扫描中…</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((s) => (
                <div
                  key={s.key}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md border p-2 text-xs',
                    s.exists ? 'border-success/30 bg-success/5' : 'border-border bg-bg-subtle/30',
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {s.exists ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                    )}
                    <code className="truncate font-mono">{s.key}</code>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-fg-muted">
                    {s.exists && (
                      <>
                        <span>{s.itemCount} 项</span>
                        <span>·</span>
                        <span>{(s.bytes / 1024).toFixed(1)} KB</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {s.inferredVersion}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md border p-2 text-xs sm:col-span-2',
                  bundle ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-bg-subtle/30',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileJson className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <code className="truncate font-mono">{bundleFile ?? 'public/data/articles.json'}</code>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-fg-muted">
                  {bundle ? (
                    <>
                      <span>已加载</span>
                      <Badge variant="default" className="font-mono text-[10px]">
                        v{(bundle as { version?: string }).version ?? '?'}
                      </Badge>
                    </>
                  ) : (
                    <span>不存在 · 未部署静态包</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 当前版本 vs 目标 */}
      {sourceBundle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">版本对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-xs text-fg-muted">当前</span>
                <Badge variant="outline" className="mt-1 font-mono">
                  v{version}
                </Badge>
              </div>
              <ArrowRight className="h-4 w-4 text-fg-muted" />
              <div className="flex flex-col items-center">
                <span className="text-xs text-fg-muted">目标</span>
                <Badge variant="default" className="mt-1 font-mono">
                  v{CURRENT_VERSION}
                </Badge>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-1 text-xs text-fg-muted">
                历史：
                {ALL_VERSIONS.map((v) => (
                  <Badge
                    key={v}
                    variant={v === version ? 'default' : v === CURRENT_VERSION ? 'secondary' : 'outline'}
                    className="font-mono text-[10px]"
                  >
                    v{v}
                  </Badge>
                ))}
              </div>
            </div>
            {!upgradeAvailable ? (
              <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4" /> 已经是最新版本，不需要迁移
                </p>
              </div>
            ) : (
              <Button onClick={runAnalysis} disabled={running} className="mt-4">
                <Play className="h-4 w-4" />
                {running ? '分析中…' : '分析改动'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. 改动报告 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    迁移报告 · v{result.fromVersion} → v{result.toVersion}
                  </CardTitle>
                  <CardDescription>
                    {result.changes.length} 项改动 · {result.warnings.length} 个警告
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={downloadResult}>
                    <Download className="h-4 w-4" /> 下载
                  </Button>
                  <Button size="sm" onClick={saveToProject}>
                    <Save className="h-4 w-4" /> 保存到项目
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.warnings.length > 0 && (
                <div className="mb-3 space-y-1">
                  {result.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-300"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
              {result.changes.length === 0 ? (
                <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  ✓ 没有数据改动 · 主要是版本号更新
                </p>
              ) : (
                <div className="space-y-1">
                  {groupByPath(result.changes).map(({ group, items }) => (
                    <div
                      key={group}
                      className="rounded-md border border-border bg-bg-subtle/30 p-2"
                    >
                      <p className="mb-1 text-xs font-semibold text-fg-muted">{group}</p>
                      <div className="space-y-1">
                        {items.map((c, i) => (
                          <ChangeRow key={i} change={c} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">迁移后结构预览</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-xs text-fg-muted">
                {JSON.stringify(
                  {
                    ...result.bundle,
                    articles: `[${Array.isArray(result.bundle.articles) ? (result.bundle.articles as unknown[]).length : 0} items]`,
                    series: `[${Array.isArray(result.bundle.series) ? (result.bundle.series as unknown[]).length : 0} items]`,
                    links: `[${Array.isArray(result.bundle.links) ? (result.bundle.links as unknown[]).length : 0} items]`,
                    leadMagnets: `[${Array.isArray(result.bundle.leadMagnets) ? (result.bundle.leadMagnets as unknown[]).length : 0} items]`,
                    tools: `[${Array.isArray(result.bundle.tools) ? (result.bundle.tools as unknown[]).length : 0} items]`,
                    siteConfig: result.bundle.siteConfig ? '(configured)' : '(missing)',
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 4. 没有数据时 */}
      {!sourceBundle && !loading && (
        <Card>
          <CardContent className="p-12 text-center text-fg-muted">
            <Info className="mx-auto h-10 w-10 opacity-40" />
            <p className="mt-4 text-sm">没有检测到任何数据</p>
            <p className="mt-1 text-xs text-fg-subtle">
              写一篇文章或导出一份 bundle 之后再回来
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChangeRow({ change }: { change: FieldChange }): React.ReactElement {
  const Icon =
    change.type === 'add' || change.type === 'fill'
      ? Plus
      : change.type === 'modify'
        ? Edit3
        : change.type === 'rename'
          ? ArrowRight
          : change.type === 'remove'
            ? Trash2
            : Info;
  const color =
    change.type === 'add' || change.type === 'fill'
      ? 'text-emerald-500'
      : change.type === 'modify'
        ? 'text-blue-500'
        : change.type === 'rename'
          ? 'text-amber-500'
          : change.type === 'remove'
            ? 'text-rose-500'
            : 'text-fg-muted';
  return (
    <div className="flex items-start gap-2 rounded border border-border bg-bg px-2 py-1.5 text-xs">
      <Icon className={cn('mt-0.5 h-3 w-3 shrink-0', color)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px]">
            {change.path}
          </code>
          <Badge variant="outline" className="text-[10px]">
            {change.type}
          </Badge>
          {change.defaultValue !== undefined && (
            <span className="text-fg-subtle">
              default: <code className="font-mono">{JSON.stringify(change.defaultValue)}</code>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-fg-muted">{change.reason}</p>
      </div>
    </div>
  );
}

function groupByPath(changes: FieldChange[]): Array<{ group: string; items: FieldChange[] }> {
  const groups = new Map<string, FieldChange[]>();
  for (const c of changes) {
    const top = c.path.split('.')[0] ?? c.path;
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top)!.push(c);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}

import { Plus, Edit3, Trash2 } from 'lucide-react';
