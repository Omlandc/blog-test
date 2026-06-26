/**
 * 导出让 Mavis 推送 —— 一键把主仓预览的本地变更打包成
 * pending-pushes.json 格式的 JSON，复制粘贴给我即可。
 *
 * 流程：
 *  1. 用户在主仓预览写文章 / 改配置 → 自动存 localStorage
 *  2. 用户访问 /admin/export-for-mavis
 *  3. 看到本地有变更的数据（vs 默认值 / vs 已推送版本）
 *  4. 选目标子仓 → 生成 JSON → 复制
 *  5. 粘贴给 Mavis → 我帮你 commit + 触发 Action + 验证子仓
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Check,
  Send,
  Database,
  FileJson,
  Trash2,
  AlertCircle,
  Github,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { IS_PUBLIC_ONLY } from '@/lib/build-config';
import { getArticleStorage } from '@/lib/storage';
import { getSeriesStore } from '@/lib/series';
import { loadSiteConfig } from '@/lib/site-config';
import type { Article, Series } from '@/lib/types';

interface Site {
  id: string;
  name: string;
  repo: string;
  branch?: string;
  enabled?: boolean;
  paths?: { articles?: string; site_config?: string };
}

interface PendingAction {
  type: 'article-upsert' | 'article-delete' | 'site-config-update' | 'series-upsert' | 'series-delete';
  payload: any;
}

interface PendingItem {
  id: string;
  site: string;
  createdAt: string;
  createdBy: string;
  actions: PendingAction[];
}

const SITES_YAML_URL = 'https://raw.githubusercontent.com/Omlandc/blog-system/main/sites.yaml';

function parseSitesYaml(text: string): Site[] {
  // 非常宽松的 YAML 解析：只挑 - id: <name> 块
  const sites: Site[] = [];
  const blocks = text.split(/^-\s+/m).slice(1);
  for (const block of blocks) {
    const id = block.match(/^\s*id:\s*['"]?([\w-]+)['"]?/m)?.[1];
    const name = block.match(/name:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim();
    const repo = block.match(/repo:\s*['"]?([\w-/.]+)['"]?/m)?.[1]?.trim();
    const branch = block.match(/branch:\s*['"]?(\w+)['"]?/m)?.[1]?.trim() ?? 'main';
    const enabled = block.match(/enabled:\s*(true|false)/m)?.[1] === 'true';
    const articlesPath = block.match(/articles:\s*['"]?([\w./-]+)['"]?/m)?.[1]?.trim();
    const siteConfigPath = block.match(/site_config:\s*['"]?([\w./-]+)['"]?/m)?.[1]?.trim();
    if (id && repo) {
      sites.push({
        id,
        name: name ?? id,
        repo,
        branch,
        enabled,
        paths: { articles: articlesPath, site_config: siteConfigPath },
      });
    }
  }
  return sites;
}

function getLocalSiteConfig(): Record<string, any> | null {
  // 走 site-config 模块的 API（返 null 当 localStorage 没有时）
  if (typeof window === 'undefined') return null;
  try {
    return loadSiteConfig() as unknown as Record<string, any>;
  } catch {
    return null;
  }
}

function genId(): string {
  return `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ExportForMavisPage(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [siteConfig, setSiteConfig] = useState<Record<string, any> | null>(null);
  const [remoteSiteConfig, setRemoteSiteConfig] = useState<Record<string, any> | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [includeSiteConfig, setIncludeSiteConfig] = useState(false);
  const [createdBy, setCreatedBy] = useState('admin');
  const [copied, setCopied] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const text = await fetch(SITES_YAML_URL).then((r) => r.text());
      const list = parseSitesYaml(text).filter((s) => s.enabled !== false);
      setSites(list);
      if (list.length === 1) setSelectedSite(list[0].id);
    } catch (err) {
      toast.show('加载 sites.yaml 失败', { variant: 'danger', description: String(err) });
    } finally {
      setLoadingSites(false);
    }
  };

  const loadLocal = async () => {
    setLoadingLocal(true);
    try {
      const [arts, sers, cfg] = await Promise.all([
        getArticleStorage().getAll(),
        Promise.resolve(getSeriesStore().getAll()),
        Promise.resolve(getLocalSiteConfig()),
      ]);
      setArticles(arts);
      setSeries(sers);
      setSiteConfig(cfg);
    } catch (err) {
      toast.show('加载本地数据失败', { variant: 'danger', description: String(err) });
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    if (!IS_PUBLIC_ONLY) {
      loadSites();
      loadLocal();
    }
  }, []);

  // 子仓选中后，加载子仓当前的 site-config
  useEffect(() => {
    if (!selectedSite) {
      setRemoteSiteConfig(null);
      return;
    }
    const site = sites.find((s) => s.id === selectedSite);
    if (!site) return;
    const configPath = site.paths?.site_config || 'src/lib/site-config/index.tsx';
    setLoadingRemote(true);
    fetch(
      `https://raw.githubusercontent.com/${site.repo}/${site.branch || 'main'}/${configPath}`,
    )
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (!text) {
          setRemoteSiteConfig(null);
          return;
        }
        // 用正则从 DEFAULT_SITE_CONFIG 里提取 name, tagline, description 等字段
        const extractField = (name: string): string | undefined => {
          const m = text.match(new RegExp(`\\\\b${name}\\\\s*:\\\\s*['"\`]([^'"\`]+)['"\`]`));
          return m?.[1];
        };
        const extractArrayField = (name: string): any[] | undefined => {
          const startRegex = new RegExp(`\\\\b${name}\\\\s*:\\\\s*\\\\[`, 'm');
          const start = text.match(startRegex);
          if (!start) return undefined;
          // 简单提取到匹配的 ]
          const startIdx = (start.index ?? 0) + start[0].length;
          let depth = 1;
          let pos = startIdx;
          while (pos < text.length && depth > 0) {
            if (text[pos] === '[') depth++;
            else if (text[pos] === ']') depth--;
            pos++;
          }
          const arrayStr = text.slice(startIdx, pos - 1);
          try {
            return JSON.parse('[' + arrayStr.split('\\n').join('').replace(/\\\\s*'/g, '"').replace(/'/g, '"').replace(/,\\s*}/g, '}').replace(/(\\w+):/g, '"$1":') + ']');
          } catch {
            return undefined;
          }
        };
        setRemoteSiteConfig({
          name: extractField('name'),
          tagline: extractField('tagline'),
          description: extractField('description'),
          niche: extractField('niche'),
          language: extractField('language'),
          contactEmail: extractField('contactEmail'),
        });
      })
      .catch(() => setRemoteSiteConfig(null))
      .finally(() => setLoadingRemote(false));
  }, [selectedSite, sites]);

  const selectedSiteData = sites.find((s) => s.id === selectedSite);

  const actions: PendingAction[] = useMemo(() => {
    const acts: PendingAction[] = [];
    for (const id of selectedArticles) {
      const art = articles.find((a) => a.id === id);
      if (art) acts.push({ type: 'article-upsert', payload: art });
    }
    if (includeSiteConfig && siteConfig) {
      // 只推与子仓当前状态不同的字段
      const patch: Record<string, any> = {};
      const compareFields = ['name', 'tagline', 'description', 'niche', 'language', 'contactEmail', 'icp', 'allowAI', 'allowAIImages', 'geoTargets', 'social', 'heroTitle', 'heroSubtitle', 'aboutContent'];
      for (const f of compareFields) {
        if (siteConfig[f] === undefined) continue;
        const localVal = JSON.stringify(siteConfig[f]);
        const remoteVal = JSON.stringify(remoteSiteConfig?.[f]);
        if (localVal !== remoteVal) {
          patch[f] = siteConfig[f];
        }
      }
      if (Object.keys(patch).length > 0) {
        acts.push({ type: 'site-config-update', payload: { patch } });
      }
    }
    return acts;
  }, [selectedArticles, articles, includeSiteConfig, siteConfig, remoteSiteConfig]);

  const siteConfigDiff = useMemo(() => {
    if (!siteConfig || !remoteSiteConfig) return [];
    const fields = ['name', 'tagline', 'description', 'niche', 'language', 'contactEmail', 'icp', 'allowAI', 'allowAIImages', 'heroTitle', 'heroSubtitle'];
    return fields
      .filter((f) => siteConfig[f] !== undefined)
      .map((f) => {
        const same = JSON.stringify(siteConfig[f]) === JSON.stringify(remoteSiteConfig[f]);
        return { field: f, local: siteConfig[f], remote: remoteSiteConfig[f], same };
      });
  }, [siteConfig, remoteSiteConfig]);

  const pendingItem: PendingItem | null = useMemo(() => {
    if (!selectedSite || actions.length === 0) return null;
    return {
      id: genId(),
      site: selectedSite,
      createdAt: new Date().toISOString(),
      createdBy,
      actions,
    };
  }, [selectedSite, actions, createdBy]);

  const jsonOutput = pendingItem ? JSON.stringify(pendingItem, null, 2) : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      toast.show('已复制', { description: '粘贴给 Mavis 即可' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show('复制失败', { variant: 'danger', description: '请手动复制' });
    }
  };

  const toggleArticle = (id: string) => {
    const next = new Set(selectedArticles);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedArticles(next);
  };

  const selectAll = () => setSelectedArticles(new Set(articles.map((a) => a.id)));
  const clearAll = () => setSelectedArticles(new Set());

  if (IS_PUBLIC_ONLY) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-warning" />
        <h2 className="text-xl font-semibold">子仓模式不可用</h2>
        <p className="mt-2 text-sm text-fg-muted">此页面只在主仓后台可见</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Send className="h-6 w-6" /> 导出让 Mavis 推送
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          把主仓预览的本地变更打包成 JSON，复制粘贴给 Mavis，<strong>我帮你 commit + 触发 Action + 验证子仓部署</strong>。
        </p>
      </div>

      {/* 步骤 1: 选子仓 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-primary text-primary-fg flex h-6 w-6 items-center justify-center rounded-full text-xs">1</span>
            选目标子仓
          </CardTitle>
          <CardDescription>从 sites.yaml 读出来的所有启用子仓</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="border-input bg-bg rounded-md border px-3 py-2 text-sm flex-1"
              disabled={loadingSites}
            >
              <option value="">-- 选择子仓 --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.repo})
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={loadSites} disabled={loadingSites}>
              {loadingSites ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 步骤 2: 选文章 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-primary text-primary-fg flex h-6 w-6 items-center justify-center rounded-full text-xs">2</span>
            选要推送的文章
          </CardTitle>
          <CardDescription>
            本地 localStorage 里有 {articles.length} 篇文章。
            <button onClick={selectAll} className="ml-2 text-primary hover:underline">全选</button>
            {' · '}
            <button onClick={clearAll} className="text-fg-muted hover:underline">清空</button>
            <Button variant="ghost" size="sm" onClick={loadLocal} disabled={loadingLocal} className="ml-2">
              {loadingLocal ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">还没有文章。先去文章管理写一篇。</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {articles.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    'flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-bg-subtle',
                    selectedArticles.has(a.id) && 'border-primary bg-primary/5',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedArticles.has(a.id)}
                    onChange={() => toggleArticle(a.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{a.title}</span>
                      <span className="text-xs text-fg-muted">/{a.slug}</span>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        a.status === 'published' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
                      )}>
                        {a.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    {a.excerpt && <p className="text-xs text-fg-muted mt-1 line-clamp-1">{a.excerpt}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 步骤 3: 选其他变更 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-primary text-primary-fg flex h-6 w-6 items-center justify-center rounded-full text-xs">3</span>
            选其他变更
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-bg-subtle">
            <input
              type="checkbox"
              checked={includeSiteConfig}
              onChange={(e) => setIncludeSiteConfig(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">站点配置（site-config）</div>
              <p className="text-xs text-fg-muted mt-1">
                把当前 localStorage 里的站点名/描述/主题色等推到子仓
              </p>
              {siteConfig && (
                <p className="text-xs text-fg-muted mt-1">
                  当前: <strong>{siteConfig.name}</strong> · {siteConfig.tagline}
                </p>
              )}

              {/* 改动 diff 预览 */}
              {siteConfigDiff.length > 0 && remoteSiteConfig && (
                <div className="mt-3 space-y-1 text-xs">
                  <p className="font-medium text-fg-muted">变更预览（vs 子仓当前）:</p>
                  {siteConfigDiff.map((d) => (
                    <div
                      key={d.field}
                      className={cn(
                        'rounded px-2 py-1 font-mono',
                        d.same ? 'bg-bg-subtle text-fg-muted' : 'bg-warning/10 text-warning',
                      )}
                    >
                      <strong>{d.field}</strong>:{' '}
                      {d.same ? (
                        <span>相同</span>
                      ) : (
                        <>
                          <span className="line-through opacity-60">{String(d.remote ?? '(空)')}</span>
                          {' → '}
                          <strong>{String(d.local)}</strong>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {loadingRemote && (
                <p className="mt-2 text-xs text-fg-muted">
                  <Loader2 className="inline h-3 w-3 animate-spin" /> 加载子仓当前配置...
                </p>
              )}
              {selectedSite && !loadingRemote && !remoteSiteConfig && (
                <p className="mt-2 text-xs text-fg-muted">
                  未加载到子仓当前配置（文件不存在或路径错误）——所有字段都会被推送
                </p>
              )}
            </div>
          </label>

          <div className="rounded-md border p-3">
            <label className="text-sm font-medium">创建者标识（方便排查）</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="border-input bg-bg mt-2 w-full rounded-md border px-3 py-1.5 text-sm"
              placeholder="admin"
            />
          </div>
        </CardContent>
      </Card>

      {/* 步骤 4: 复制 JSON */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-primary text-primary-fg flex h-6 w-6 items-center justify-center rounded-full text-xs">4</span>
            复制 JSON 给 Mavis
          </CardTitle>
          <CardDescription>
            {pendingItem
              ? `已生成 ${actions.length} 个 action，复制后粘贴给我`
              : '先选子仓和文章（步骤 1-2）'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingItem ? (
            <>
              <pre className="bg-bg-subtle max-h-96 overflow-auto rounded-md border p-3 text-xs">
                {jsonOutput}
              </pre>
              <div className="mt-3 flex gap-2">
                <Button onClick={copyToClipboard} disabled={copied}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制到剪贴板'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([jsonOutput], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pending-${selectedSite}-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <FileJson className="h-4 w-4" />
                  下载 JSON
                </Button>
              </div>
              <div className="mt-4 rounded-md bg-info/10 border border-info/20 p-3 text-xs">
                <p className="font-medium text-info">💡 接下来</p>
                <ol className="mt-1 space-y-1 text-fg-muted list-decimal list-inside">
                  <li>把上面的 JSON 复制粘贴到对话里</li>
                  <li>Mavis 会把这一条追加到 <code>data/pending-pushes.json</code> 并 commit</li>
                  <li>触发 <code>flush-content.yml</code> 推到 <strong>{selectedSiteData?.repo}</strong></li>
                  <li>等子仓自动重建，验证文章出现在子仓网站</li>
                </ol>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-fg-muted">还没有可推送的内容</p>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-xs text-fg-muted">
        <Github className="mr-1 inline h-3 w-3" />
        流程: 主仓预览 (localStorage) → 复制 JSON → Mavis commit →
        GitHub Action → 子仓 public/data/articles.json → 子仓重建
      </div>
    </div>
  );
}

export default ExportForMavisPage;
