/**
 * PreflightCheck —— 发布前自检清单
 *
 * 检查项（10 条）：
 * - critical: 不通过会让发布"翻车"
 * - warning: 不通过是体验问题
 * - info: 提示性信息
 *
 * 点击「运行检查」→ 全部跑一遍，结果可视化
 * 部分项可一键修复
 */
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Rocket,
  Wand2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { getArticleStorage } from '@/lib/storage';
import { getSeriesStore } from '@/lib/series';
import { getLinkStore } from '@/lib/links';
import { getLeadMagnetStore } from '@/lib/newsletter';
import { useSiteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

type Severity = 'critical' | 'warning' | 'info';
type Status = 'pass' | 'fail' | 'info';

interface CheckResult {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  fixable?: () => Promise<void> | void;
  fixLabel?: string;
  learnMore?: { label: string; href: string };
}

const SUCCESS_MSG: Record<number, string> = {
  0: '✅ 所有检查通过！可以放心发布。',
  1: '⚠️ 有 1 项建议处理，可以发布但建议先看。',
};

function buildSummary(results: CheckResult[]): { pass: number; fail: number; total: number; criticalFail: number } {
  let pass = 0;
  let fail = 0;
  let criticalFail = 0;
  for (const r of results) {
    if (r.status === 'pass') pass++;
    if (r.status === 'fail') {
      fail++;
      if (r.severity === 'critical') criticalFail++;
    }
  }
  return { pass, fail, total: results.length, criticalFail };
}

export function PreflightCheck(): React.ReactElement {
  const { config, mode, setMode } = useSiteConfig();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [devApiAvailable, setDevApiAvailable] = useState(false);

  useEffect(() => {
    void fetch('/__blog/status').then((r) => setDevApiAvailable(r.ok)).catch(() => setDevApiAvailable(false));
  }, []);

  const runChecks = useCallback(async (): Promise<void> => {
    setRunning(true);
    const articles = await getArticleStorage().getAll();
    const published = articles.filter((a) => a.status === 'published');
    const drafts = articles.filter((a) => a.status === 'draft');
    const series = getSeriesStore().getAll();
    const links = getLinkStore().getAll();
    const leadMagnets = getLeadMagnetStore().getAll();

    // 1. 部署模式 = static
    const modeOk = mode === 'static';

    // 2. 至少 1 篇已发布
    const hasPublished = published.length > 0;

    // 3. 草稿文章（提示，不阻塞）
    const hasDrafts = drafts.length > 0;

    // 4. SiteConfig.name
    const hasName = !!config.name?.trim();

    // 5. SiteConfig.language
    const hasLanguage = !!config.language;

    // 6. slug 唯一性
    const slugs = articles.map((a) => a.slug);
    const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);

    // 7. 系列完整性（文章的 seriesId 都对应存在的 series）
    const seriesIds = new Set(series.map((s) => s.id));
    const danglingRefs = articles.filter((a) => a.seriesId && !seriesIds.has(a.seriesId));

    // 8. 资源链接 URL 合法
    const badLinks = links.filter((l) => !/^https?:\/\//.test(l.url));

    // 9. Lead Magnet URL 合法（允许 # 占位）
    const badMagnets = leadMagnets.filter((m) => m.fileUrl && !/^(https?:\/\/|#)/.test(m.fileUrl));

    // 10. dist/ 存在（仅 dev 模式相关）
    let distExists = false;
    if (devApiAvailable) {
      try {
        const r = await fetch('/articles.json', { method: 'HEAD' });
        distExists = r.ok;
      } catch {
        distExists = false;
      }
    }

    const results: CheckResult[] = [
      {
        id: 'mode-static',
        severity: 'critical',
        status: modeOk ? 'pass' : 'fail',
        title: '部署模式 = static（/admin 自动隐藏）',
        description: modeOk
          ? 'static 模式下 /admin 路由被重定向到首页，访问者无法看到后台入口。'
          : '当前是 embedded 模式，访问者打开 /admin 会看到登录页。需要切到 static 才能安全发布。',
        fixable: modeOk ? undefined : () => {
          setMode('static');
          toast.show('已切换', { description: 'SiteConfig.mode = static' });
        },
        fixLabel: '一键切到 static',
        learnMore: { label: '看部署文档', href: '/admin/docs' },
      },
      {
        id: 'has-published',
        severity: 'critical',
        status: hasPublished ? 'pass' : 'fail',
        title: '至少 1 篇已发布文章',
        description: hasPublished
          ? `当前 ${published.length} 篇已发布文章。`
          : '没有已发布的文章 —— 部署后访问者看不到任何内容。',
        learnMore: { label: '去写文章', href: '/admin/articles/new' },
      },
      {
        id: 'name',
        severity: 'warning',
        status: hasName ? 'pass' : 'fail',
        title: '站点名称已填写',
        description: hasName
          ? `"${config.name}" | 会出现在浏览器标题栏、Header、SEO meta 中。`
          : 'SiteConfig.name 为空，会显示默认名"博客系统"。',
        learnMore: { label: '去设置', href: '/admin/site-config' },
      },
      {
        id: 'language',
        severity: 'info',
        status: hasLanguage ? 'pass' : 'info',
        title: '主语言已配置',
        description: hasLanguage
          ? `language = ${config.language}`
          : '未设置语言，默认 zh-CN。',
      },
      {
        id: 'drafts',
        severity: 'info',
        status: drafts.length > 0 ? 'info' : 'pass',
        title: drafts.length > 0 ? `${drafts.length} 篇草稿` : '没有遗留草稿',
        description:
          drafts.length > 0
            ? '草稿不会进入静态 bundle，但本地 dev 模式下能继续编辑。'
            : '所有文章都已发布或归档，干净。',
        learnMore: drafts.length > 0 ? { label: '查看草稿', href: '/admin/articles' } : undefined,
      },
      {
        id: 'unique-slugs',
        severity: 'critical',
        status: dupSlugs.length === 0 ? 'pass' : 'fail',
        title: '文章 slug 唯一',
        description:
          dupSlugs.length === 0
            ? `${slugs.length} 篇文章的 slug 都唯一。`
            : `发现重复 slug：${[...new Set(dupSlugs)].join('、')}。会导致路由冲突。`,
      },
      {
        id: 'series-refs',
        severity: 'warning',
        status: danglingRefs.length === 0 ? 'pass' : 'fail',
        title: '文章系列引用有效',
        description:
          danglingRefs.length === 0
            ? '所有文章的 seriesId 都指向存在的系列。'
            : `${danglingRefs.length} 篇文章引用了不存在的 seriesId: ${danglingRefs.map((a) => a.slug).slice(0, 3).join(', ')}`,
        learnMore: { label: '查看系列', href: '/admin/series' },
      },
      {
        id: 'link-urls',
        severity: 'warning',
        status: badLinks.length === 0 ? 'pass' : 'fail',
        title: '资源链接 URL 合法',
        description:
          badLinks.length === 0
            ? `${links.length} 个资源链接 URL 都以 http(s):// 开头。`
            : `${badLinks.length} links with invalid URL: ${badLinks.map((l) => l.name).slice(0, 3).join(', ')}`,
        learnMore: { label: '查看资源', href: '/admin/resources' },
      },
      {
        id: 'magnet-urls',
        severity: 'info',
        status: badMagnets.length === 0 ? 'pass' : 'fail',
        title: 'Lead Magnet 文件 URL 合法',
        description:
          badMagnets.length === 0
            ? `${leadMagnets.length} 个 Lead Magnet。`
            : `${badMagnets.length} 个 Lead Magnet 文件 URL 不合法。`,
        learnMore: { label: '查看订阅者', href: '/admin/subscribers' },
      },
      {
        id: 'dist-exists',
        severity: 'info',
        status: devApiAvailable ? (distExists ? 'pass' : 'info') : 'info',
        title: 'dist/ 是否已构建',
        description: !devApiAvailable
          ? 'dev 插件未连接 | 此项不适用'
          : distExists
            ? 'dist/data/articles.json 已生成 | 可直接推送'
            : 'dist/ 未构建 | 需要先点保存 + 构建',
      },
    ];

    setResults(results);
    setRunning(false);
    const s = buildSummary(results);
    if (s.criticalFail === 0) {
      toast.show('检查通过', {
        description: `${s.pass}/${s.total} 项通过 | ${s.criticalFail} 个 critical 失败`,
      });
    } else {
      toast.show(`${s.criticalFail} 项 critical 失败`, {
        variant: 'danger',
        description: '修完再发布',
      });
    }
  }, [config, mode, setMode, devApiAvailable]);

  const summary = results ? buildSummary(results) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> 发布前自检
            </CardTitle>
            <CardDescription>
              一键检查 10 项关键指标 | 防止发布后「上线才发现问题」
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <Badge
                variant={summary.criticalFail === 0 ? 'default' : 'danger'}
                className="font-mono"
              >
                {summary.criticalFail === 0
                  ? `Pass ${summary.pass}/${summary.total}`
                  : `Fail ${summary.criticalFail} critical`}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={runChecks}
              disabled={running}
            >
              <RefreshCw className={cn('h-4 w-4', running && 'animate-spin')} />
              {running ? '检查中…' : results ? '重新检查' : '运行检查'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!results ? (
          <div className="rounded-lg border border-dashed border-border bg-bg-subtle/50 p-8 text-center text-fg-muted">
            <Rocket className="mx-auto h-8 w-8 opacity-40" />
            <p className="mt-3 text-sm">点「运行检查」开始 ~</p>
            <p className="mt-1 text-xs text-fg-subtle">
              会检查部署模式、文章数量、slug 唯一性、资源链接等 10 项
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {results.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <CheckRow result={r} />
                </motion.div>
              ))}
            </AnimatePresence>
            {summary && summary.criticalFail === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm"
              >
                <p className="font-medium text-emerald-700 dark:text-emerald-300">
                  {SUCCESS_MSG[summary.fail] ?? `还有 ${summary.fail} 个warning需要处理`}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  下一步：保存到项目 → 构建 → git push
                </p>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CheckRow({ result }: { result: CheckResult }): React.ReactElement {
  const Icon =
    result.status === 'pass' ? CheckCircle2 : result.status === 'fail' ? XCircle : Info;
  const color =
    result.status === 'pass'
      ? 'text-success'
      : result.status === 'fail'
        ? result.severity === 'critical'
          ? 'text-danger'
          : result.severity === 'warning'
            ? 'text-warning'
            : 'text-fg-muted'
        : 'text-fg-muted';

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-3 rounded-md border p-3 text-sm',
        result.status === 'pass' && 'border-success/30 bg-success/5',
        result.status === 'fail' && result.severity === 'critical' && 'border-danger/40 bg-danger/5',
        result.status === 'fail' && result.severity === 'warning' && 'border-warning/40 bg-warning/5',
        result.status === 'info' && 'border-border bg-bg-subtle/40',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-fg">{result.title}</span>
          {result.severity === 'critical' && result.status === 'pass' && (
            <Badge variant="outline" className="border-success/30 text-success text-[10px]">
              critical
            </Badge>
          )}
          {result.severity === 'critical' && result.status === 'fail' && (
            <Badge variant="danger" className="text-[10px]">
              critical
            </Badge>
          )}
          {result.severity === 'warning' && (
            <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
              warning
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-fg-muted">{result.description}</p>
        {(result.fixable || result.learnMore) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {result.fixable && (
              <Button size="sm" variant="outline" onClick={result.fixable}>
                <Wand2 className="h-3 w-3" />
                {result.fixLabel ?? '修复'}
              </Button>
            )}
            {result.learnMore && (
              <Button asChild size="sm" variant="ghost">
                <a href={result.learnMore.href}>
                  {result.learnMore.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
