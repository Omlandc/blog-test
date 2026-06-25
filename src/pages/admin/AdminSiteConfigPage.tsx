/**
 * /admin/site-config —— 站点身份与定位
 *
 * 让这个系统可以被复用到任何细分主题。
 * 修改后立刻反映到全站（Hero / SEO meta / 主题色 / ICP 等）。
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Globe, FileText, Eye, Wrench, Plus, Trash2, Download, Rocket, FolderOpen, Hammer, ExternalLink, Sparkles, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useSiteConfig, DEFAULT_SITE_CONFIG } from '@/lib/site-config';
import type { SiteConfig, SiteNiche, SupportedLanguage, ToolEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LOOK_PACKS, getLook, type LookPack } from '@/lib/look-packs';
import { PreflightCheck } from '@/components/admin/PreflightCheck';
import { getArticleStorage } from '@/lib/storage';
import { useTheme as useUiTheme } from '@/lib/theme';
import { getSeriesStore } from '@/lib/series';
import { getLeadMagnetStore } from '@/lib/newsletter';
import { getLinkStore } from '@/lib/links';

const NICHES: Array<{ value: SiteNiche; label: string; emoji: string }> = [
  { value: 'recipe', label: '食谱 / 餐饮', emoji: '🍳' },
  { value: 'tech', label: '技术', emoji: '💻' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'parenting', label: '育儿', emoji: '👶' },
  { value: 'finance', label: '理财', emoji: '💰' },
  { value: 'education', label: '教育', emoji: '🎓' },
  { value: 'design', label: '设计', emoji: '🎨' },
  { value: 'lifestyle', label: '生活方式', emoji: '🌿' },
  { value: 'other', label: '其他', emoji: '✨' },
];

const LANGUAGES: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'es-ES', label: 'Español' },
];

export default function AdminSiteConfigPage(): React.ReactElement {
  const _uiTheme = useUiTheme();
  const { config, update, reset, mode, setMode, tools, setTools, addTool, removeTool, updateTool } = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig>(config);
  const [toolDraft, setToolDraft] = useState<Partial<ToolEntry>>({});
  const save = (): void => {
    update(draft);
    toast.show('已保存', { description: '站点身份与定位已更新' });
  };

  const restoreDefaults = (): void => {
    reset();
    setDraft(DEFAULT_SITE_CONFIG);
    toast.show('已重置', { description: '站点配置已恢复为默认值' });
  };

  const handleAddTool = (): void => {
    if (!toolDraft.name || !toolDraft.url) {
      toast.show('请填写名称和 URL', { variant: 'warning' });
      return;
    }
    addTool({
      id: `tool-${Date.now()}`,
      name: toolDraft.name,
      icon: toolDraft.icon ?? '🔧',
      description: toolDraft.description,
      url: toolDraft.url,
      position: toolDraft.position ?? 'topnav',
      target: toolDraft.target ?? '_self',
      order: toolDraft.order ?? tools.length + 1,
      badge: toolDraft.badge,
    });
    setToolDraft({});
    toast.show('已添加', { description: toolDraft.name });
  };

  const exportBundle = async (): Promise<void> => {
    try {
      const articles = await getArticleStorage().getAll();
      const series = getSeriesStore().getAll();
      const leadMagnets = getLeadMagnetStore().getAll();
      const links = getLinkStore().getAll();
      const bundle = {
        version: '0.4.0',
        generatedAt: new Date().toISOString(),
        articles,
        series,
        leadMagnets,
        links,
        siteConfig: config,
        tools,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-system-bundle-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show('已下载', {
        description: `包含 ${articles.length} 篇文章 · 转为静态站后保存到 public/data/articles.json`,
      });
    } catch (e) {
      toast.show('导出失败', { variant: 'danger' });
    }
  };

  const importInputRef = useRef<HTMLInputElement>(null);
  const [devApiAvailable, setDevApiAvailable] = useState(false);
  const [buildStatus, setBuildStatus] = useState<{
    state: 'idle' | 'running' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  // 探测 dev 插件是否可用（POST 到 /__blog/save-bundle 看返回）
  useEffect(() => {
    void fetch('/__blog/status', { method: 'GET' })
      .then((r) => {
        if (r.ok) setDevApiAvailable(true);
      })
      .catch(() => setDevApiAvailable(false));
  }, []);

  /** 一键保存到项目 public/data/articles.json（仅 dev 模式可用） */
  const saveToProject = async (): Promise<void> => {
    try {
      const articles = await getArticleStorage().getAll();
      const series = getSeriesStore().getAll();
      const leadMagnets = getLeadMagnetStore().getAll();
      const links = getLinkStore().getAll();
      const bundle = {
        version: '0.6.0',
        generatedAt: new Date().toISOString(),
        articles,
        series,
        leadMagnets,
        links,
        siteConfig: config,
        tools,
      };
      const res = await fetch('/__blog/save-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.show('已保存到项目', {
          description: `public/data/articles.json · ${data.articleCount} 篇文章 · ${(data.size / 1024).toFixed(1)} KB`,
        });
      } else {
        toast.show('保存失败', { variant: 'danger', description: data.error ?? '未知错误' });
      }
    } catch (e) {
      toast.show('保存失败', { variant: 'danger', description: e instanceof Error ? e.message : String(e) });
    }
  };

  /** 触发 npm run build（dev 插件会异步执行） */
  const triggerBuild = async (): Promise<void> => {
    setBuildStatus({ state: 'running' });
    try {
      await fetch('/__blog/run-build', { method: 'POST' });
      // 轮询状态
      const poll = async (): Promise<void> => {
        const r = await fetch('/__blog/status');
        const s = await r.json();
        setBuildStatus({ state: s.state, message: s.message });
        if (s.state === 'running') setTimeout(poll, 1000);
      };
      setTimeout(poll, 500);
    } catch (e) {
      setBuildStatus({ state: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleImportFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      if (!bundle || typeof bundle !== 'object' || !Array.isArray(bundle.articles)) {
        toast.show('格式错误', { variant: 'danger', description: '文件不是合法的 bundle JSON' });
        return;
      }
      // 确认覆盖
      const ok = window.confirm(
        `将覆盖当前 localStorage 中的内容：
  · ${bundle.articles.length} 篇文章
  · ${(bundle.series ?? []).length} 个主题簇
  · ${(bundle.leadMagnets ?? []).length} 个 Lead Magnet
  · ${(bundle.links ?? []).length} 个资源链接
是否继续？`,
      );
      if (!ok) return;
      const storage = getArticleStorage();
      // 清空后写入
      await storage.clear?.();
      for (const a of bundle.articles as Array<{ id: string; [k: string]: unknown }>) {
        if (!a.id) a.id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await storage.create(a as never);
      }
      if (bundle.siteConfig) update(bundle.siteConfig);
      if (Array.isArray(bundle.tools)) setTools(bundle.tools);
      if (Array.isArray(bundle.links)) {
        getLinkStore().replaceAll(bundle.links);
      }
      setDraft({ ...config, ...(bundle.siteConfig ?? {}) });
      toast.show('已导入', {
        description: `${bundle.articles.length} 篇文章已覆盖 · 请刷新页面查看`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.show('导入失败', { variant: 'danger', description: msg });
    }
  };

  /** 导出为 Markdown 文件夹（每个文章一个 .md + 一个 index.json） */
  const exportMarkdown = async (): Promise<void> => {
    try {
      const articles = await getArticleStorage().getAll();
      const series = getSeriesStore().getAll();
      // 简单 ZIP：手动拼一个 tar-like 的 manifest 文件，描述所有路径，
      // 实际 zip 需要依赖 jszip ── 不引入新依赖，改用“目录 + manifest”方案：
      // 生成一个 markdown-bundle/ 目录下的 N 个 .md + 一个 manifest.json
      // 让用户使用系统的 zip 命令压缩。
      const mdLines: string[] = [];
      for (const a of articles) {
        const frontmatter = [
          '---',
          `id: ${a.id}`,
          `slug: ${a.slug}`,
          `title: ${JSON.stringify(a.title)}`,
          `status: ${a.status}`,
          `tags: [${a.tags.join(', ')}]`,
          a.seriesId ? `series: ${a.seriesId}` : '',
          a.publishedAt ? `publishedAt: ${a.publishedAt}` : '',
          `updatedAt: ${a.updatedAt}`,
          '---',
          '',
        ]
          .filter(Boolean)
          .join('\n');
        mdLines.push(`# FILE: ${a.slug}.md`);
        mdLines.push(frontmatter);
        mdLines.push(a.content);
        mdLines.push('\n');
      }
      const manifest = {
        version: '0.3.0',
        generatedAt: new Date().toISOString(),
        site: config.name,
        articleCount: articles.length,
        seriesCount: series.length,
        instructions: [
          '1. Each article is a separate .md file with YAML frontmatter',
          '2. Use any static site generator (Astro / Hugo / Eleventy / Jekyll) to render',
          '3. Or commit this folder to a Git repo for version control',
          '4. To import back into Blog System: combine all .md files into one bundle JSON',
        ],
      };
      mdLines.push('# === MANIFEST ===');
      mdLines.push('manifest.json:');
      mdLines.push(JSON.stringify(manifest, null, 2));
      const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `markdown-bundle-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show('已导出', { description: `${articles.length} 篇 Markdown · 可提交到 Git 仓库` });
    } catch (e) {
      toast.show('导出失败', { variant: 'danger' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">站点身份与定位</h1>
          <p className="text-sm text-fg-muted">
            让这个系统适配你的细分主题——技术 / 食谱 / 旅行 / 育儿 / 任何方向
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={restoreDefaults}>
            <RotateCcw className="h-4 w-4" /> 恢复默认
          </Button>
          <Button onClick={save}>
            <Save className="h-4 w-4" /> 保存
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <LookPacksCard
          currentLook={draft.look}
          currentDefaultContentTheme={draft.defaultContentTheme ?? 'default'}
          onApply={(look, contentTheme) => {
            const next = { ...draft, look, defaultContentTheme: contentTheme };
            setDraft(next);
            // 立即持久化（不只是 setDraft）+ 立即应用 UI 主题
            const pack = lookDataByContentTheme(look);
            if (pack) {
              _uiTheme.setTheme(pack.uiTheme);
            }
            update(next);
            toast.show('已套用 Look', { description: `${look} · UI 主题 + 正文主题 都已保存并切换` });
          }}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>基础身份</CardTitle>
            <CardDescription>对外展示的站点信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">
                  站点名称 *
                </label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="博客系统"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fg">
                  Logo Mark（emoji 或字符）
                </label>
                <Input
                  value={draft.logoMark ?? ''}
                  onChange={(e) => setDraft({ ...draft, logoMark: e.target.value })}
                  placeholder="✍"
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">
                Tagline（副标题）
              </label>
              <Input
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                placeholder="一套可复用的细分内容站框架"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fg">
                站点描述（SEO meta description）
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>细分定位</CardTitle>
          <CardDescription>选择主要赛道，影响 SEO 重点与变现策略</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-fg">
              主要赛道
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {NICHES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setDraft({ ...draft, niche: n.value })}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs transition-all ${
                    draft.niche === n.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{n.emoji}</span>
                  <span className="text-fg">{n.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-fg">主要语言</label>
            <select
              value={draft.language}
              onChange={(e) =>
                setDraft({ ...draft, language: e.target.value as SupportedLanguage })
              }
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>目标受众</CardTitle>
          <CardDescription>
            国家分布影响广告 CPM、内容侧重点、变现策略
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {draft.geoTargets.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={g.country}
                  onChange={(e) => {
                    const next = [...draft.geoTargets];
                    next[idx] = { ...g, country: e.target.value.toUpperCase().slice(0, 2) };
                    setDraft({ ...draft, geoTargets: next });
                  }}
                  className="w-20"
                  maxLength={2}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={g.weight}
                  onChange={(e) => {
                    const next = [...draft.geoTargets];
                    next[idx] = { ...g, weight: Number(e.target.value) };
                    setDraft({ ...draft, geoTargets: next });
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm text-fg">
                  {(g.weight * 100).toFixed(0)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = draft.geoTargets.filter((_, i) => i !== idx);
                    setDraft({ ...draft, geoTargets: next });
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  geoTargets: [...draft.geoTargets, { country: 'US', weight: 0.5 }],
                })
              }
            >
              + 添加国家
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI 爬虫策略</CardTitle>
          <CardDescription>
            是否允许 ChatGPT / Claude / Perplexity 抓取你的内容（影响 AI 搜索引用）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={!draft.allowAI}
              onChange={(e) => setDraft({ ...draft, allowAI: !e.target.checked })}
              className="rounded"
            />
            <div>
              <p className="font-medium text-fg">禁止 AI 文本爬虫（noai）</p>
              <p className="text-xs text-fg-muted">
                保护原创，但失去 AI 搜索（ChatGPT / Perplexity / Google AI Overview）的引用机会
              </p>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-border p-3">
            <input
              type="checkbox"
              checked={!draft.allowAIImages}
              onChange={(e) =>
                setDraft({ ...draft, allowAIImages: !e.target.checked })
              }
              className="rounded"
            />
            <div>
              <p className="font-medium text-fg">禁止 AI 图片爬虫（noimageai）</p>
              <p className="text-xs text-fg-muted">
                防止图片被 AI 训练集收录
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero 区域文案</CardTitle>
          <CardDescription>首页顶部那段话的标题与副标题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-fg">
              Hero 标题
            </label>
            <Input
              value={draft.heroTitle ?? ''}
              onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })}
              placeholder="写作与阅读"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fg">
              Hero 副标题
            </label>
            <textarea
              value={draft.heroSubtitle ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, heroSubtitle: e.target.value })
              }
              rows={2}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={restoreDefaults}>
          <RotateCcw className="h-4 w-4" /> 恢复默认
        </Button>
        <Button onClick={save}>
          <Save className="h-4 w-4" /> 保存所有修改
        </Button>
      </div>

      {/* 部署模式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" /> 部署模式
          </CardTitle>
          <CardDescription>
            选择本实例的运行方式。修改后立即生效。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                setMode('embedded');
                toast.show('已切换', { description: '完整后台模式（可编辑内容）' });
              }}
              className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'embedded' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🖊</span>
                <span className="font-semibold text-fg">embedded · 完整后台</span>
              </div>
              <p className="text-xs text-fg-muted">
                适合 Vercel / Netlify / 自有服务器。含文章管理、订阅者、流量分析、主题编辑。
              </p>
            </button>
            <button
              onClick={() => {
                setMode('static');
                toast.show('已切换', { description: '静态展示模式（/admin 被隐藏）' });
              }}
              className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'static' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span className="font-semibold text-fg">static · 纯静态站</span>
              </div>
              <p className="text-xs text-fg-muted">
                适合 GitHub Pages / Cloudflare Pages / 任何 CDN。/admin 被重定向到首页，内容从 public/data/articles.json 读取。
              </p>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-bg-subtle p-3 text-xs text-fg-muted">
            <span>当前模式：<span className="font-semibold text-fg">{mode === 'embedded' ? '完整后台' : '纯静态'}</span></span>
            {mode === 'static' && (
              <span>· /admin 已被重定向到 /，需要本地修改 localStorage 中的 blog-system:mode 重新启用。</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 工具入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" /> 工具集成
          </CardTitle>
          <CardDescription>
            把其他项目（如 MVP 助手 / 设计小工具 / 名片生成器）作为入口注入到顶部导航与首页。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg-subtle p-3"
              >
                <span className="text-xl">{tool.icon}</span>
                <Input
                  value={tool.name}
                  onChange={(e) => updateTool(tool.id, { name: e.target.value })}
                  className="w-32"
                />
                <Input
                  value={tool.url}
                  onChange={(e) => updateTool(tool.id, { url: e.target.value })}
                  placeholder="https://... 或 /tools/xxx"
                  className="flex-1 min-w-[200px]"
                />
                <select
                  value={tool.position}
                  onChange={(e) => updateTool(tool.id, { position: e.target.value as ToolEntry['position'] })}
                  className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-fg"
                >
                  <option value="topnav">顶部导航</option>
                  <option value="home">首页区块</option>
                  <option value="both">两个都出现</option>
                </select>
                <Input
                  value={tool.badge ?? ''}
                  onChange={(e) => updateTool(tool.id, { badge: e.target.value })}
                  placeholder="徽章 (New)"
                  className="w-24"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTool(tool.id)}
                  aria-label="删除"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ))}
            {tools.length === 0 && (
              <p className="text-center text-sm text-fg-muted py-4">
                还没有任何工具入口。在下面添加吧。
              </p>
            )}
          </div>
          <div className="rounded-md border border-dashed border-border p-3">
            <p className="mb-2 text-xs font-medium text-fg-muted">+ 添加新工具</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={toolDraft.icon ?? ''}
                onChange={(e) => setToolDraft({ ...toolDraft, icon: e.target.value })}
                placeholder="🛠"
                className="w-16"
                maxLength={4}
              />
              <Input
                value={toolDraft.name ?? ''}
                onChange={(e) => setToolDraft({ ...toolDraft, name: e.target.value })}
                placeholder="工具名"
                className="w-32"
              />
              <Input
                value={toolDraft.url ?? ''}
                onChange={(e) => setToolDraft({ ...toolDraft, url: e.target.value })}
                placeholder="URL · https:// 或 /tools/xxx"
                className="flex-1 min-w-[200px]"
              />
              <select
                value={toolDraft.position ?? 'topnav'}
                onChange={(e) =>
                  setToolDraft({ ...toolDraft, position: e.target.value as ToolEntry['position'] })
                }
                className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-fg"
              >
                <option value="topnav">顶部导航</option>
                <option value="home">首页区块</option>
                <option value="both">两个都出现</option>
              </select>
              <Input
                value={toolDraft.badge ?? ''}
                onChange={(e) => setToolDraft({ ...toolDraft, badge: e.target.value })}
                placeholder="徽章"
                className="w-20"
              />
              <Button onClick={handleAddTool}>
                <Plus className="h-4 w-4" /> 添加
              </Button>
            </div>
            <p className="mt-2 text-xs text-fg-subtle">
              · 同窗口打开站内页面：url 以 <code>/</code> 开头 · 跳到外站：url 以 <code>http</code> 开头<br />
              · 占位待开发：url 以 <code>#</code> 开头（如 <code>#placeholder</code>），会自动渲染一个占位区
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 发布前检查 */}
      <PreflightCheck />

      {/* 静态包导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" /> 静态站导出（GitHub Pages 部署）
          </CardTitle>
          <CardDescription>
            导出当前 localStorage 中的全部内容为 JSON 包，配合 <code className="text-fg">scripts/export-static.mjs</code> 使用，可零后端部署到 GitHub Pages。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border bg-bg-subtle p-3 text-xs space-y-1 text-fg-muted">
            <p>推荐工作流：本地 <code className="text-fg">npm run dev</code> 起服务 · 浏览器编辑 · 点保存 → build → 推送</p>
            <p>有现成 <strong className="text-fg">一键保存到项目</strong> 按钮，dev 模式下生效，部署到 GitHub Pages 后按钮自动隐藏。</p>
          </div>

          {devApiAvailable && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                dev 插件已连接（<code className="font-mono">/__blog/save-bundle</code>）
              </div>
              <p className="text-fg-muted">
                点下方按钮 → 文章数据直接写到 <code className="text-fg">public/data/articles.json</code> · 然后可以一键 build
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={saveToProject} className="bg-emerald-600 hover:bg-emerald-700">
                  <FolderOpen className="h-4 w-4" /> 保存到项目 public/data/
                </Button>
                <Button
                  variant="outline"
                  onClick={triggerBuild}
                  disabled={buildStatus.state === 'running'}
                >
                  <Hammer className="h-4 w-4" />
                  {buildStatus.state === 'running' ? '构建中…' : '重新构建 dist/'}
                </Button>
              </div>
              {buildStatus.message && (
                <div
                  className={cn(
                    'mt-2 rounded p-2 text-xs',
                    buildStatus.state === 'success' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    buildStatus.state === 'error' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    buildStatus.state === 'running' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                  )}
                >
                  {buildStatus.message}
                </div>
              )}
              <div className="mt-2 text-fg-muted">
                <strong className="text-fg">下一步：</strong>
                <code className="ml-1 rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px]">
                  git add dist && git commit -m 'update content' && git push
                </code>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={exportBundle}>
              <Download className="h-4 w-4" /> 下载静态 Bundle
            </Button>
            <Button variant="outline" onClick={exportMarkdown}>
              导出为 Markdown
            </Button>
            <Button
              variant="outline"
              onClick={() => importInputRef.current?.click()}
            >
              导入 Bundle
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/docs" target="_blank" rel="noopener">
                查看部署方案文档
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers for Look Packs                                            */
/* ------------------------------------------------------------------ */
function lookDataByContentTheme(lookSlug: string): LookPack | undefined {
  return LOOK_PACKS.find((l) => l.slug === lookSlug);
}

/* ------------------------------------------------------------------ */
/*  LookPacksCard —— 一键应用 UI + 正文主题                            */
/* ------------------------------------------------------------------ */
function LookPacksCard({
  currentLook,
  currentDefaultContentTheme,
  onApply,
}: {
  currentLook?: string;
  currentDefaultContentTheme: string;
  onApply: (lookSlug: string, contentTheme: string) => void;
}): React.ReactElement {
  const _uiTheme = useUiTheme();
  // Read current ui theme from <html data-theme>
  const [uiTheme, setUiThemeState] = useState<string>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-theme') ?? 'light';
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Look 套装
        </CardTitle>
        <CardDescription>
          一键应用 UI 主题 + 文章正文主题的搭配。当前 UI：{uiTheme} · 当前正文：{currentDefaultContentTheme}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {LOOK_PACKS.map((look) => {
            const isActive = look.slug === currentLook;
            return (
              <button
                key={look.slug}
                type="button"
                onClick={() => onApply(look.slug, look.contentTheme)}
                className={cn(
                  'group relative flex flex-col items-stretch overflow-hidden rounded-lg border-2 text-left transition-all',
                  isActive
                    ? 'border-primary shadow-md ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40 hover:shadow-sm',
                )}
              >
                {/* 双层预览：上半 UI 控件 + 下半 正文 */}
                <div className="flex h-20 w-full">
                  <div
                    className="flex flex-1 flex-col gap-0.5 p-2"
                    style={{ background: look.preview.bg, color: look.preview.fg }}
                  >
                    <div
                      className="h-1.5 w-3/4 rounded-sm"
                      style={{ background: look.preview.accent, opacity: 0.7 }}
                    />
                    <div className="h-1 w-full rounded-sm" style={{ background: look.preview.fg, opacity: 0.4 }} />
                    <div className="h-1 w-2/3 rounded-sm" style={{ background: look.preview.fg, opacity: 0.4 }} />
                    <div
                      className="mt-1 h-3 w-12 self-end rounded-sm"
                      style={{ background: look.preview.accent, opacity: 0.8 }}
                    />
                  </div>
                  <div
                    className="flex flex-1 flex-col gap-0.5 border-l border-white/20 p-2"
                    style={{ background: look.preview.bg, color: look.preview.fg }}
                  >
                    <div className="text-[9px] font-bold" style={{ color: look.preview.accent }}>H1</div>
                    <div className="h-1 w-full rounded-sm" style={{ background: look.preview.fg, opacity: 0.4 }} />
                    <div className="h-1 w-3/4 rounded-sm" style={{ background: look.preview.fg, opacity: 0.4 }} />
                    <div
                      className="mt-0.5 h-2 w-1/2 rounded-sm font-mono text-[8px]"
                      style={{ background: look.preview.accent, color: look.preview.bg, paddingLeft: 2 }}
                    >
                      code
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-fg">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
                <div className="bg-bg-elevated px-2 py-1.5">
                  <div className="text-xs font-medium text-fg">{look.name}</div>
                  <div className="truncate text-[10px] text-fg-muted">{look.scenario}</div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-fg-muted">
          点击任意 Look 卡片 → UI 主题（lib/theme）+ 文章正文主题（lib/content-themes/）会同时切换
        </p>
      </CardContent>
    </Card>
  );
}
