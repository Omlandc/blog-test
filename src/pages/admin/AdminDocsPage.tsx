/**
 * /admin/docs —— 内部文档中心（仅管理员可见）
 *
 * 包含：
 * 1. 系统使用说明（快速上手 + 关键工作流）
 * 2. 运营思路（细分内容站方法论：选题 / 主题簇 / 私域 / 节奏）
 * 3. SEO 思路（技术 SEO / 内容 SEO / AI 搜索 / 速度 / 外链）
 * 4. 更新日志（CHANGELOG）
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Search,
  History,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Layers,
  Mail,
  DollarSign,
  Smartphone,
  Globe,
  Zap,
  Link2,
  Bot,
  AlertTriangle,
  Rocket,
  Eye,
  Clock,
  FileText,
  Shield,
  Server,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Section = 'usage' | 'operations' | 'seo' | 'deployment' | 'changelog';

export default function AdminDocsPage(): React.ReactElement {
  const [section, setSection] = useState<Section>('usage');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-fg">
          <BookOpen className="h-6 w-6" />
          系统文档中心
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          仅管理员可见 · 系统使用说明 / 运营思路 / SEO 思路 / 更新日志
        </p>
      </div>

      <Tabs value={section} onValueChange={(v) => setSection(v as Section)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="usage">
            <FileText className="mr-1.5 h-3.5 w-3.5" /> 使用说明
          </TabsTrigger>
          <TabsTrigger value="operations">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> 运营思路
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="mr-1.5 h-3.5 w-3.5" /> SEO 思路
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="mr-1.5 h-3.5 w-3.5" /> 部署方案
          </TabsTrigger>
          <TabsTrigger value="changelog">
            <History className="mr-1.5 h-3.5 w-3.5" /> 更新日志
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-6">
          <UsageSection />
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <OperationsSection />
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <SeoSection />
        </TabsContent>

        <TabsContent value="deployment" className="mt-6">
          <DeploymentSection />
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          <ChangelogSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================
 * 1. 使用说明
 * ============================================================ */

function UsageSection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>本地→发布的完整闭环（4 步）</CardTitle>
          <CardDescription>
            从「克隆仓库」到「GitHub Pages 线上」只要这 4 步 · 全程在本地浏览器
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <Step n={1} title="启动本地服务">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs">
                npm install && npm run dev
              </code>
              ，浏览器打开{' '}
              <a className="text-primary underline" href="http://localhost:5173" target="_blank">
                http://localhost:5173
              </a>
              。
            </Step>
            <Step n={2} title="登录后台，编辑内容">
              <Badge>admin / admin123</Badge> 登录，访问{' '}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs">
                /admin
              </code>
              。所有改动自动保存到 localStorage。
            </Step>
            <Step n={3} title="发布前自检 + 保存到项目">
              进{' '}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs">
                /admin/site-config
              </code>
              ：<br />a) 滚到底部「发布前自检」→ 点「运行检查」→ 修掉所有 critical 项<br />
              b) dev 插件的绿色横幅会同时出现 → 点「保存到项目 public/data/」<br />
              c) 接着点「重新构建 dist/」
            </Step>
            <Step n={4} title="手动 git push 部署">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs">
                git add . && git commit -m 'update content' && git push
              </code>
              <br />
              <span className="text-fg-muted text-xs">
                （推送后 GitHub Pages 几分钟后自动部署完毕）
              </span>
            </Step>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>发布工作流详解（v0.7+）</CardTitle>
          <CardDescription>
            dev 插件路径：admin 里点按钮 · 项目里直接落盘 · 零手工挪文件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
            <strong className="text-emerald-700 dark:text-emerald-300">推荐 · dev 插件路径</strong>
            <p className="mt-1 text-fg-muted">
              本地 <code className="text-fg">npm run dev</code> 启动后，admin 后台会探测 Vite 插件
              <code className="text-fg">/__blog/save-bundle</code> 端点，连上后会出现绿色横幅。
            </p>
          </div>
          <ol className="ml-4 list-decimal space-y-1.5 text-fg-muted">
            <li>
              <strong className="text-fg">PreflightCheck 自检</strong> · critical 项一键修复
              <ul className="ml-4 list-disc">
                <li>部署模式 = static（防 /admin 暴露）</li>
                <li>至少 1 篇已发布文章</li>
                <li>slug 唯一性 / 系列引用 / 链接 URL 合法</li>
              </ul>
            </li>
            <li>
              <strong className="text-fg">保存到项目 public/data/</strong> · 一键
              <code className="ml-1">articles.json</code> 落到项目
            </li>
            <li>
              <strong className="text-fg">重新构建 dist/</strong> · 一键跑
              <code className="ml-1">npm run build</code>，实时显示状态
            </li>
            <li>
              <strong className="text-fg">手动 push</strong> ·
              <code className="ml-1">git add . && git commit && git push</code>
            </li>
          </ol>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-fg-muted">
            <strong className="text-amber-600 dark:text-amber-400">Fallback · 手工路径</strong>
            <p className="mt-1">
              如果不在本地（部署版访问）· 仍可点「下载静态 Bundle」拿到 JSON · 手动
              <code className="text-fg">node scripts/export-static.mjs --input=articles.json</code>
              · 然后 build · push。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>后台导航速查</CardTitle>
          <CardDescription>9 个后台页面 + 3 个用户端页面 + 2 个部署页</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Shortcut path="/admin" desc="仪表盘 · 总览统计 + 快速入口" />
          <Shortcut path="/admin/articles" desc="文章管理 · 表格/卡片 + 筛选 + 批量" />
          <Shortcut path="/admin/articles/new" desc="写新文章 · MarkdownEditor" />
          <Shortcut path="/admin/series" desc="主题簇管理 · Pillar / Cluster 体系" />
          <Shortcut path="/admin/site-config" desc="站点身份 · 部署模式 · 工具 · 发布清单" />
          <Shortcut path="/admin/subscribers" desc="订阅者 · 私域名单 · CSV 导出" />
          <Shortcut path="/admin/analytics" desc="流量分析 · 来源 · 热门 · 转化" />
          <Shortcut path="/admin/resources" desc="资源导航 · 外部工具目录" />
          <Shortcut path="/admin/settings" desc="主题外观 · 演示账号切换" />
          <Shortcut path="/admin/docs" desc="使用文档 · 运营 · SEO · 部署 · changelog（当前页）" />
          <hr className="border-border" />
          <Shortcut path="/explore" desc="交互式专栏（git-driven，新内容需提交代码）" />
          <Shortcut path="/resources" desc="资源导航页 · 用户可见的外部工具" />
          <Shortcut path="/search" desc="全站搜索 · 标题/摘要/正文全文索引" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              演示账号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-fg-muted">
                <tr>
                  <th className="text-left">账号</th>
                  <th className="text-left">密码</th>
                  <th className="text-left">权限</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                <tr>
                  <td className="font-mono">admin</td>
                  <td className="font-mono">admin123</td>
                  <td>12 个权限全部</td>
                </tr>
                <tr>
                  <td className="font-mono">user</td>
                  <td className="font-mono">user123</td>
                  <td>仅 article:read + article:create</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-fg-muted">
              在 <code>/admin/settings</code> 可一键切换演示账号，演示权限差异。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              模块结构
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <Module name="lib/auth" desc="鉴权抽象，可换 Mock/JWT/OAuth" />
              <Module name="lib/storage" desc="存储抽象，可换 LocalStorage/IndexedDB/REST" />
              <Module name="lib/theme" desc="主题系统，4 套 CSS 变量主题" />
              <Module name="lib/markdown" desc="Markdown 渲染 + XSS 过滤" />
              <Module name="lib/images" desc="图床抽象：Mock / 压缩 / HTTP / RemoteUrl" />
              <Module name="lib/i18n" desc="i18n 系统（中英双语 + 自动检测浏览器语言）" />
              <Module name="lib/site-config" desc="站点身份 · 部署模式 · 工具集成" />
              <Module name="lib/series" desc="主题簇 Pillar → Cluster → Article" />
              <Module name="lib/links" desc="资源导航（外部工具目录）" />
              <Module name="lib/newsletter" desc="邮件订阅 + Lead Magnet" />
              <Module name="lib/analytics" desc="流量分析（单人站长看板）" />
              <Module name="lib/monetization" desc="三段式变现支撑" />
              <Module name="lib/seo" desc="SEO 自动化（sitemap/robots/JSON-LD）" />
              <Module name="lib/explorables" desc="交互式专栏（git-driven 注册表）" />
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>核心工作流</CardTitle>
          <CardDescription>运营一个细分内容站的完整闭环</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Workflow
              icon={Target}
              title="1. 定位"
              desc="/admin/site-config 设定赛道、语言、目标国家"
            />
            <Workflow
              icon={Layers}
              title="2. 搭骨架"
              desc="/admin/series 建 Pillar + Cluster 体系"
            />
            <Workflow
              icon={FileText}
              title="3. 写内容"
              desc="/admin/articles/new 用 MarkdownEditor 创作"
            />
            <Workflow
              icon={TrendingUp}
              title="4. 看效果"
              desc="/admin/analytics 看流量，迭代"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常用操作速查</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Shortcut path="/admin/site-config" desc="切换细分主题、改 Hero 文案、AI 爬虫策略" />
          <Shortcut path="/admin/series" desc="管理 Pillar 与 Cluster，编辑长尾关键词" />
          <Shortcut path="/admin/articles" desc="文章管理（表格/卡片视图 + 筛选 + 批量）" />
          <Shortcut path="/admin/articles/new" desc="写新文章（MarkdownEditor）" />
          <Shortcut path="/admin/subscribers" desc="查看订阅者、导出 CSV、删除" />
          <Shortcut path="/admin/analytics" desc="流量看板（来源/趋势/转化）" />
          <Shortcut path="/admin/settings" desc="主题外观 + 演示账号切换" />
          <Shortcut path="/sitemap.xml" desc="站点地图（搜索引擎用）" />
          <Shortcut path="/robots.txt" desc="爬虫指令（含 AI 爬虫屏蔽）" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 2. 运营思路（细分内容站方法论）
 * ============================================================ */

function OperationsSection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            核心心法
          </CardTitle>
          <CardDescription>
            借鉴月访问百万的细分内容站打法，沉淀为方法论
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Principle
              title="身份优势"
              desc="找你有身份优势、对手又弱的细分赛道。你的中国人身份 + 真会做菜 = 在英文世界是稀缺的"
            />
            <Principle
              title="种树思维"
              desc="食谱类内容 100 年不过期，流量是种出来的，不是冲出来的。前 1 年趋近于 0，一年后才有量"
            />
            <Principle
              title="发动机 vs 放大器"
              desc="SEO 是 70% 发动机；社交是 4% 放大器。主次别搞反"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10 步冷启动法</CardTitle>
          <CardDescription>从零到月入百万的真实步骤</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <OperationStep
              n={1}
              title="定一个比大盘更窄的口子"
              detail="不要做'中餐'，只做'川菜'或'面食'。越窄越容易建立权威"
            />
            <OperationStep
              n={2}
              title="挖长尾词"
              detail="用工具（Ahrefs / 5118 / Semrush）挖出有人搜、竞争又弱的词。前期 100-500 个长尾词足够"
            />
            <OperationStep
              n={3}
              title="搭骨架（Pillar + Cluster）"
              detail="先建 5-10 个 Cluster + 1-3 个 Pillar 页骨架，文章先链到骨架，再互相链"
            />
            <OperationStep
              n={4}
              title="每天写透一篇文章"
              detail="宁可慢，每篇都往死里写。一篇深度文顶得过 50 篇水文"
            />
            <OperationStep
              n={5}
              title="第一天就做私域钩子"
              detail="Lead Magnet + 邮件订阅。别等流量起来了才后悔"
            />
            <OperationStep
              n={6}
              title="流量起来再上广告"
              detail="初期挂 AdSense。10 万浏览申请 Ezoic。100 万申请 Mediavine。收入翻几倍"
            />
            <OperationStep
              n={7}
              title="YouTube / Pinterest 做放大器"
              detail="但网站始终是发动机。社交加起来才 4%"
            />
            <OperationStep
              n={8}
              title="熬过前一年的零反馈期"
              detail="前一两年趋近于 0，之后才爆发。急不得。这一关筛掉 90% 的人"
            />
            <OperationStep
              n={9}
              title="三段式变现"
              detail="广告打底 → 邮件订阅兜底 → 付费产品封顶"
            />
            <OperationStep
              n={10}
              title="持续迭代"
              detail="看 /admin/analytics 找到增长点，调整选题与结构"
            />
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            主题簇架构（Topic Cluster）
          </CardTitle>
          <CardDescription>
            Pillar → Cluster → Article 三级金字塔，权重层层传递
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-elevated p-4 font-mono text-xs">
            <pre>{`Pillar（支柱页：搜索 "中餐食谱"）
├── Cluster（子分类：搜索 "川菜"）
│   ├── Article（"麻婆豆腐怎么做"）
│   ├── Article（"回锅肉用什么肉"）
│   └── Article（"鱼香肉丝正宗做法"）
├── Cluster（"面食"）
│   ├── Article（"手擀面和面比例"）
│   └── ...
└── Cluster（"甜品"）`}</pre>
          </div>
          <ul className="space-y-2 text-sm">
            <CheckBullet text="Pillar 用 /admin/series 建，填好长尾关键词、tagline、description" />
            <CheckBullet text="每篇文章选一个主 Series（在文章编辑页 seriesId 字段）" />
            <CheckBullet text="每篇文章内部互链：同 Series 内 2-3 篇 + Pillar 页 1 次" />
            <CheckBullet text="Pillar 的 sitemapPriority 设为 0.9-1.0，提升搜索权重" />
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-pink-500" />
              私域兜底
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>"谷歌流量是租来的，邮件列表才是自己的。"</strong>
            </p>
            <p className="text-fg-muted">
              算法更新把流量打下来时，手里有一群愿意读你的真实粉丝，这是你的基本盘。
            </p>
            <ul className="mt-3 space-y-1">
              <CheckBullet text="首页底部放订阅表单（已自动渲染）" />
              <CheckBullet text="每篇文章末尾放订阅卡（已自动渲染）" />
              <CheckBullet text="至少 1 个 Lead Magnet（在 /admin/subscribers 录入）" />
              <CheckBullet text="1k 篇文章浏览 → 10-30 个新订阅者 = 健康" />
              <CheckBullet text="1 万订阅者 ≈ 月入 $500-$5000（推荐产品时）" />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              三段式变现
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <MonetizeTier
                tier="1"
                title="广告打底"
                range="$12-$30 / 千次浏览"
                detail="高价值市场（美/英/澳）广告 CPC 甩东南亚好几倍"
              />
              <MonetizeTier
                tier="2"
                title="私域兜底"
                range="稳定基本盘"
                detail="邮件列表 + 社群，算法波动时唯一能直接联系用户的方式"
              />
              <MonetizeTier
                tier="3"
                title="产品封顶"
                range="收入天花板"
                detail="电子书、付费课程、自有产品。多年信任一次性兑现"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-500" />
            内容节奏建议
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <RhythmItem phase="冷启动期（1-6 月）" cadence="每周 2-3 篇" tip="质量 > 数量，每篇必须解决一个具体问题" />
          <RhythmItem phase="成长期（6-18 月）" cadence="每周 3-5 篇" tip="开始扩 Cluster 覆盖，加入更多长尾词" />
          <RhythmItem phase="成熟期（18 月+）" cadence="每周 1-2 篇更新 + 持续优化旧文" tip="根据 /admin/analytics 找到高 ROI 选题" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>风险清单</CardTitle>
          <CardDescription>单人站长必须意识到的几个坑</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Risk
            icon={AlertTriangle}
            color="text-amber-500"
            title="过度依赖谷歌"
            detail="70% 流量来自单一渠道 = 单一故障点。解决方案：私域兜底 + 多平台分发"
          />
          <Risk
            icon={AlertTriangle}
            color="text-red-500"
            title="外链掺灰帽"
            detail="买来的外链在 2026 风险越来越大。只靠真实内容赢来的外链才是护城河"
          />
          <Risk
            icon={AlertTriangle}
            color="text-purple-500"
            title="AI 搜索冲击"
            detail="ChatGPT / Perplexity 抢走点击率。解决方案：FAQ 区块 + 结构化数据 + 焦点段落"
          />
          <Risk
            icon={AlertTriangle}
            color="text-fg-muted"
            title="极度依赖个人"
            detail="拍照、写文、回复全靠一个人。解决方案：流程化 + 模板化 + 雇助理"
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 3. SEO 思路
 * ============================================================ */

function SeoSection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            双引擎时代
          </CardTitle>
          <CardDescription>
            不再只是 Google，还要优化 AI 搜索（ChatGPT / Perplexity / Google AI Overview）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchEngineCard
              name="Google 传统搜索"
              share="~50%"
              detail="关键词密度、TDK、内链、外链、Core Web Vitals"
            />
            <SearchEngineCard
              name="AI 搜索"
              share="~15%（且高速增长）"
              detail="结构化数据、FAQ 区块、可被引用的具体段落"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>技术 SEO 自动检查清单</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <CheckBullet text="✓ /sitemap.xml 自动生成（22 条 URL，已提交格式）" />
            <CheckBullet text="✓ /robots.txt 含 AI 爬虫屏蔽指令" />
            <CheckBullet text="✓ 每篇文章独立 <title> / meta description / canonical" />
            <CheckBullet text="✓ Open Graph + Twitter Card 社交分享优化" />
            <CheckBullet text="✓ JSON-LD 结构化数据（Article / CollectionPage）" />
            <CheckBullet text="✓ AI 爬虫指令（noai / noimageai）每篇文章可独立配置" />
            <CheckBullet text="✓ 4 套主题（CSS 变量）实时切换，无 CLS" />
            <CheckBullet text="✓ 移动端响应式（375px / 768px / 1024px 断点）" />
            <CheckBullet text="✓ ErrorBoundary 防止整站白屏" />
            <CheckBullet text="✓ Lighthouse 性能 ≥ 90（gzipped JS 695KB，仍可优化）" />
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-500" />
            关键词策略
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <KeyStrategy
            tier="大词（百万搜索）"
            example='"中餐"、"React 教程"'
            rule="不直接抢。用于 Pillar 页，自然流量慢慢攒"
          />
          <KeyStrategy
            tier="中词（10万搜索）"
            example='"川菜入门"、"React Hook"'
            rule="Cluster 主页抢这个。1 篇覆盖整个子主题"
          />
          <KeyStrategy
            tier="长尾词（千搜索）"
            example='"麻婆豆腐正宗做法"、"useEffect 依赖"'
            rule="每篇文章抢一个。意图清晰、转化率高、初期最容易拿排名"
          />
          <KeyStrategy
            tier="问题词"
            example='"为什么 React 不更新"'
            rule="FAQ 区块直接回答，AI 搜索最喜欢这种"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              内容 SEO 套路
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CheckBullet text="标题：含主关键词 + 数字 + 痛点（如『5 种 xxx 的正确方法』）" />
            <CheckBullet text="首段：100 字内出现焦点关键词，回答'用户为什么点进来'" />
            <CheckBullet text="H2 小标题：每个小标题本身就是长尾词" />
            <CheckBullet text="段落：3-5 行为宜，避免大段文字" />
            <CheckBullet text="图片：每张图加 alt（含关键词）" />
            <CheckBullet text="表格 / 列表：搜索引擎更易抓取关键信息" />
            <CheckBullet text="FAQ 区块：5-8 个问答，AI 搜索最爱引用" />
            <CheckBullet text="内部链接：每篇文章 3-5 个内部链接（含同 Series）" />
            <CheckBullet text="外链：引用 1-2 个权威来源（如政府/学术网站）" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-500" />
              AI 搜索（GEO）优化
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <CheckBullet text="文章结构清晰：H1/H2/H3 层级完整" />
            <CheckBullet text="关键数据用列表或表格呈现（AI 容易抽取）" />
            <CheckBullet text="作者有 bio 页面 + 详细简介" />
            <CheckBullet text="FAQ 区块用 Q/A 格式，AI 直接抓取" />
            <CheckBullet text="JSON-LD 结构化数据（已自动生成）" />
            <CheckBullet text="原创观点：非共识但有理有据的判断" />
            <CheckBullet text="提交到 Bing IndexNow（ChatGPT 用 Bing 索引）" />
            <CheckBullet text="权衡：开 noai 保护原创 vs 开 allow 获 AI 引用流量" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-500" />
            移动端优先
          </CardTitle>
          <CardDescription>73% 流量来自手机。移动体验是生死线</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <CheckBullet text="字号 ≥ 16px、行距 ≥ 1.6、行宽 ≤ 700px" />
            <CheckBullet text="按钮触控区 ≥ 44×44px" />
            <CheckBullet text="首屏 ≤ 2.5 秒（LCP 指标）" />
            <CheckBullet text="避免弹窗拦截滚动（用底部 toast 而非全屏弹窗）" />
            <CheckBullet text="图片懒加载 + responsive srcset（已实现）" />
            <CheckBullet text="AMP / Instant Articles 可选（PWA 优先）" />
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            速度与 Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SpeedMetric
            name="LCP (Largest Contentful Paint)"
            target="< 2.5 秒"
            current="~2 秒"
            tip="首屏大图用 WebP + preload，JS 按路由拆包"
          />
          <SpeedMetric
            name="FID (First Input Delay)"
            target="< 100 毫秒"
            current="~50 毫秒"
            tip="主线程不阻塞，break up long tasks"
          />
          <SpeedMetric
            name="CLS (Cumulative Layout Shift)"
            target="< 0.1"
            current="~0"
            tip="图片 / 字体 / 动态内容都要占位"
          />
          <SpeedMetric
            name="Bundle size (gzipped)"
            target="< 500 KB"
            current="~695 KB"
            tip="highlight.js 按需加载语言包，可砍 30%"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            外链策略
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <CheckBullet text="优质外链：来自高权威、相关行业的真实引用" />
          <CheckBullet text="避开：购买链接、PBN 私有博客网络、链接农场" />
          <CheckBullet text="自然增长靠：内容质量、客座文章、PR 提及、行业资源收录" />
          <CheckBullet text="监测：Ahrefs / Semrush 跟踪外链增长，disavow 垃圾外链" />
          <CheckBullet text="节奏：每月 5-20 个新外链 = 自然增长；过快 = 灰帽风险" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            国际 SEO
          </CardTitle>
          <CardDescription>目标多国市场时的注意事项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <CheckBullet text="hreflang 标签：每个语言版本互相声明" />
          <CheckBullet text="URL 结构：建议 ccTLD（.cn / .us）或子目录（/cn/ /us/）" />
          <CheckBullet text="本地化：不是翻译，是本地化（文化、货币、单位）" />
          <CheckBullet text="服务器位置：CDN 全球节点，本地访问延迟 < 100ms" />
          <CheckBullet text="Search Console：每个国家版本独立提交" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 4. 部署方案
 * ============================================================ */

function DeploymentSection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            三种部署模式
          </CardTitle>
          <CardDescription>
            系统是一套纯前端 React 应用，localStorage 存储。可以同时作为“内容生产+宣传”与“纯内容站”，也可以搭配其他工具项目一起工作。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <ModeCard
              emoji="🖊"
              title="模式 A：内容生产 + 宣传"
              subtitle="embedded（默认）"
              tech="Vercel / Netlify / 任何静态主机"
              feature="含完整后台（文章管理 / 主题 / 订阅者 / 分析）"
            />
            <ModeCard
              emoji="📦"
              title="模式 B：纯内容站"
              subtitle="static · GitHub Pages 友好"
              tech="GitHub Pages / Cloudflare Pages / CDN"
              feature="/admin 被重定向到首页，内容从 public/data/articles.json 读取，零后端"
              highlight
            />
            <ModeCard
              emoji="🛠"
              title="模式 C：内容 + 工具搭配"
              subtitle="embedded + tools (v0.3+)"
              tech="在模式 A 或 B 基础上注入外部工具入口"
              feature="/admin/site-config 添加工具，出现在顶部导航 / 首页 hero 下方 / 两者都出现 · /tools/:id 通用路由处理内部跳转 / 外部 URL / 占位"
            />
          </div>
        </CardContent>
      </Card>

      {/* 模式 A */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2 text-sm text-primary">A</span>
            模式 A · 内容生产 + 宣传
          </CardTitle>
          <CardDescription>
            “我既是作者、也是自己的运营。”在本系统后台写文章、维护订阅者、看流量。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StepBlock
            n={1}
            title="本地开发"
            code={`git clone https://github.com/Omlandc/blog-system.git
cd blog-system
npm install
npm run dev  # http://localhost:5173`}
          />
          <StepBlock
            n={2}
            title="登录后台"
            desc="admin / admin123。访问 /admin。默认 12 篇示例文章 + 7 个主题簇 + 1 个 Lead Magnet + 15 个资源链接 + 1 个交互专栏，全部从 localStorage 读取。"
          />
          <StepBlock
            n={3}
            title="写内容"
            desc="/admin/articles/new · MarkdownEditor · 工具栏 / 拖拽图片 / 实时预览 / 自动保存"
          />
          <StepBlock
            n={4}
            title="看效果"
            desc="/admin/analytics · 看板含 7 个来源（Google / Bing / Twitter / Pinterest / YouTube / AI 搜索 / 直接访问） + 订阅转化漏斗 + 热门 Top 10"
          />
          <StepBlock
            n={5}
            title="部署"
            desc={
              <>
                <code>npm run build</code> 会输出 <code>dist/</code>，包含 <code>index.html</code> + <code>sitemap.xml</code> + <code>robots.txt</code> + <code>data/articles.json</code>。推到 Vercel / Netlify / Cloudflare Pages 即可。
                <br />
                <span className="text-xs text-fg-muted">
                  推荐在 /admin/site-config 走「PreflightCheck → 保存到项目 → 重新构建」三件套，比手工命令安心。
                </span>
              </>
            }
          />
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-fg-muted">
            <strong className="text-amber-600 dark:text-amber-400">注意事项</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>localStorage 是浏览器本地的，换设备/浏览器会丢。需要换后端时，实现 <code>lib/storage</code> 的 HTTP 适配器。</li>
              <li>在 Vercel 上访问 <code>/admin</code> 不会被 GitHub Pages 一样重定向，后台始终可用。</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 模式 B */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2 text-sm text-primary">B</span>
            模式 B · 纯内容站（GitHub Pages / 零后端）
            <Badge>推荐 · 零成本</Badge>
          </CardTitle>
          <CardDescription>
            适合“我只是写好内容，不需要后台”的场景。/admin 被重定向到首页。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
            <strong className="text-emerald-600 dark:text-emerald-400">核心机制</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-fg-muted">
              <li>系统启动时 fetch <code>/data/articles.json</code>，成功则覆盖 SiteConfig / 工具入口 / 文章存储。</li>
              <li>SiteConfig.mode = <code>static</code> 时，<code>/admin</code> 路由被重定向到 <code>/</code>。</li>
              <li>所有内容都是预渲染的 JSON，不依赖任何后端，可部署到任何 CDN。</li>
            </ul>
          </div>
          <StepBlock
            n={1}
            title="在一台机器上准备内容"
            desc="在 embedded 模式下写完所有文章（可以用本地 dev / Vercel preview / 任何有后台的部署）。"
          />
          <StepBlock
            n={2}
            title="导出静态包"
            desc={
              <>
                进入 <code>/admin/site-config</code>，点击「下载静态 Bundle」。得到一个 <code>blog-system-bundle-YYYY-MM-DD.json</code>。
              </>
            }
          />
          <StepBlock
            n={3}
            title="放入项目 + 生成 public/data"
            code={`# 放入项目根
mv ~/Downloads/blog-system-bundle-*.json articles.json

# 生成 public/data/articles.json
node scripts/export-static.mjs --input=articles.json`}
          />
          <StepBlock
            n={4}
            title="可选：把 SiteConfig 切换为 static 模式"
            desc="在 bundle 的 siteConfig.mode 中设为 'static'（或部署后修改 localStorage）。这样 /admin 被禁用。也可以保留 embedded，让访问者看到后台入口（仅你按需进入）。"
          />
          <StepBlock
            n={5}
            title="构建 + 推 GitHub"
            code={`npm run build  # tsc + vite + post-build(sitemap/robots)
git add public/data/articles.json dist
git commit -m "chore: sync content bundle"
git push  # GitHub Actions 自动部署到 gh-pages 分支`}
          />
          <StepBlock
            n={6}
            title="在 GitHub 仓库启用 Pages"
            desc="Settings → Pages → Source: GitHub Actions / gh-pages 分支。几分钟后就能访问 https://username.github.io/blog-system/"
          />
          <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-xs">
            <strong className="text-blue-600 dark:text-blue-400">GitHub Actions 示例</strong>
            <pre className="mt-2 overflow-x-auto rounded bg-bg-elevated p-2 text-[10px] leading-relaxed">{`# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`}</pre>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-fg-muted">
            <strong className="text-amber-600 dark:text-amber-400">图片策略</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li><strong>推荐</strong>：在 Markdown 里直接用 <code>![alt](https://图床/xxx.png)</code> 外链，零后端部署友好。</li>
              <li><strong>可选</strong>：把图片提交到 <code>public/images/</code> 下，Vite 会原样拷贝进 dist。</li>
              <li><strong>不推荐</strong>：base64 存 localStorage（体积爆炸，仅适合少数小图标）。</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 模式 C */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-full bg-primary/20 px-2 text-sm text-primary">C</span>
            模式 C · 配套其他工具项目
          </CardTitle>
          <CardDescription>
            顶部导航和首页都可以挂其他工具项目（独立部署的另一个服务）的入口。内容站与工具站互不耦合。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <StepBlock
            n={1}
            title="在 /admin/site-config 添加工具"
            code={`名称：MVP 助手
图标：🛠
URL：https://mvp-helper.vercel.app
position: topnav
target: _blank`}
          />
          <StepBlock
            n={2}
            title="效果"
            desc="顶部导航多出一个【🛠 MVP 助手 New】按钮，点开跳到你的 MVP 助手。position = home 时会在首页 Hero 下方出现一个『配套工具』卡片区。"
          />
          <StepBlock
            n={3}
            title="跨项目互推"
            desc="其他工具项目也可以挂上【回到博客】的链接（同样是个 ToolEntry）—— 多项目互推矩阵。bundle 导出后这些关系会被冻进静态包。"
          />
          <div className="rounded-md border border-border bg-bg-subtle p-3 text-xs">
            <strong>设计原则</strong>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-fg-muted">
              <li>内容站是“发动机”（SEO 流量），工具是“放大器”（决价 / 留存）。</li>
              <li>两者独立部署、独立、独立演进，仅靠 ToolEntry 链。</li>
              <li>后期工具站成熟，可以考虑打通账号 / 互通内容（需后端）—— 那时再抽 lib/auth HTTP 适配器。</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            部署主机选择
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <HostCard
              name="GitHub Pages"
              price="免费"
              pros={['零成本', '从 Git 自动部署', '适合纯静态站']}
              cons={['无后端（需用模式 B）', '构建性能有限']}
              bestFor="个人项目 / 试错 / 前期试运营"
            />
            <HostCard
              name="Vercel"
              price="免费层足够"
              pros={['Preview 部署', 'Edge CDN', 'Webhook 触发重建']}
              cons={['Serverless Function 超出免费层会收费']}
              bestFor="产品化项目 / 需要偶发后端（如表单提交）"
            />
            <HostCard
              name="Netlify"
              price="免费层足够"
              pros={['表单 / Functions 内置', 'Split Testing']}
              cons={['资源竞争较多']}
              bestFor="中小项目"
            />
            <HostCard
              name="Cloudflare Pages"
              price="免费"
              pros={['全球 CDN 最快', 'Workers 可选后端']}
              cons={['部署配置稍复杂']}
              bestFor="面向全球 / 速度敏感"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快速决策树</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <pre className="overflow-x-auto rounded-lg border border-border bg-bg-elevated p-4 text-xs leading-relaxed">{`你是?
├── 只是一个静态内容站，不需后台
│   └── 选模式 B + GitHub Pages
├── 需要后台 + 内容量较小（< 100 篇）
│   └── 选模式 A + Vercel / Netlify
├── 有多个工具项目，跨站互推
│   └── 选模式 C（模式 A 或 B + ToolEntry）
└── 准备重度运营，需要后端
    └── 抽象 lib/storage 为 REST 适配器
        （Supabase / PocketBase / 自建）`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 5. 更新日志
 * ============================================================ */

function ChangelogSection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>v0.7.0 — 2025-03-15</CardTitle>
          <Badge>最新</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">一键发布工作流 + 迁移能力 + 移动端修复</p>
          <ChangelogBlock title="一键发布">
            <ul className="ml-4 list-disc space-y-1">
              <li><code>vite-plugins/blog-sync.ts</code> · dev 模式专属的本地端点</li>
              <li>POST <code>/__blog/save-bundle</code> · 写入 public/data/articles.json</li>
              <li>POST <code>/__blog/run-build</code> + GET <code>/__blog/status</code> · 异步构建 + 轮询</li>
              <li>/admin/site-config 新增「发布前自检 PreflightCheck」+ 绿色 dev 插件横幅</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="发布前自检 (PreflightCheck)">
            <ul className="ml-4 list-disc space-y-1">
              <li>10 项检查：部署模式 / 已发布文章 / slug 唯一性 / 系列引用 / 链接 URL / dist/ 状态</li>
              <li>critical / warning / info 三级，critical 一键修复</li>
              <li>通过后绿色横幅提示下一步</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="Bug Fix">
            <ul className="ml-4 list-disc space-y-1">
              <li>Breadcrumb 在中文模式显示英文的问题（修复 PATH_LABEL_KEYS 路径 + i18n 翻译）</li>
              <li>移动端菜单不显示（添加 sm:hidden 汉堡 + Drawer）</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.6.0 — 2025-03-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">交互式专栏系统（Explorables）</p>
          <ChangelogBlock title="新模块">
            <ul className="ml-4 list-disc space-y-1">
              <li><code>src/lib/explorables/</code> · 注册表 + 静态注册 + lazy 加载</li>
              <li>首篇专栏：主题系统演示（5 个互动模块）</li>
              <li>/explore（索引）+ /explore/:slug（详情）</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.5.0 — 2025-03-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">资源导航 /resources</p>
          <ChangelogBlock title="新模块">
            <ul className="ml-4 list-disc space-y-1">
              <li><code>src/lib/links/</code> · 资源导航数据层</li>
              <li>15 个 demo 链接覆盖 6 个分类（设计/开发/写作/营销/分析/效率）</li>
              <li>/resources + /resources/:category 7 个分类页</li>
              <li>/admin/resources 管理（增删改 / 切换 featured / 导入导出 JSON）</li>
              <li>点击累计 clicks + featured 排序 + category 过滤</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.4.0 — 2025-03-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">图片策略升级 + 备份恢复 + bundle 拆分 + 真搜索</p>
          <ChangelogBlock title="图片策略">
            <ul className="ml-4 list-disc space-y-1">
              <li>双模式 UI：<code>&lt;1MB 自动压缩 / 1-5MB 建议 URL / &gt;5MB 拒绝</code></li>
              <li>CompressedImageUploader（canvas + WebP）</li>
              <li>RemoteUrlImageUploader（GitHub Pages 友好）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="备份恢复">
            <ul className="ml-4 list-disc space-y-1">
              <li>/admin/site-config 新增「导入 Bundle」</li>
              <li>「导出为 Markdown」（YAML frontmatter + 正文）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="Bundle 拆分">
            <ul className="ml-4 list-disc space-y-1">
              <li>Vite manualChunks：5 个 vendor 块</li>
              <li>所有 admin 页面路由级 lazy load</li>
              <li>首屏 720KB → 201KB gzip (-72%)</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="真搜索 /search">
            <ul className="ml-4 list-disc space-y-1">
              <li>全文索引：title + excerpt + content</li>
              <li>多词 AND 查询 + 相关度打分</li>
              <li>过滤：主题簇 / 标签 / 难度，排序：相关度 / 最新 / 热门</li>
              <li>命中片段高亮（&lt;mark&gt;）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="中英双语 i18n">
            <ul className="ml-4 list-disc space-y-1">
              <li>useI18n() hook + t(key, params?)</li>
              <li>自动检测 navigator.language</li>
              <li>三层优先级：localStorage &gt; SiteConfig &gt; 浏览器默认</li>
              <li>语言切换器（Header 右上）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="面包屑导航">
            <ul className="ml-4 list-disc space-y-1">
              <li>/components/layout/Breadcrumb.tsx</li>
              <li>AppShell 顶部集成，跨用户端 + 后台</li>
              <li>动态参数自动显示（article 标题 / topic 名称）</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.3.0 — 2025-03-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">多模式部署架构 + 工具集成能力</p>
          <ChangelogBlock title="多部署模式">
            <ul className="ml-4 list-disc space-y-1">
              <li>SiteConfig.mode = <code>embedded | static</code>，控制后台可见性</li>
              <li>static 模式下 <code>/admin</code> 路由被重定向到首页</li>
              <li><code>scripts/export-static.mjs</code> 把 localStorage 导出为 <code>public/data/articles.json</code>，可零后端部署</li>
              <li>App 启动时 fetch <code>/data/articles.json</code>，成功则覆盖 SiteConfig / 工具入口 / 文章存储</li>
              <li>新增 /admin/site-config「部署模式」+「静态 Bundle 导出」区块</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="工具集成">
            <ul className="ml-4 list-disc space-y-1">
              <li>SiteConfig.tools: ToolEntry[] 供顶部导航 / 首页区块 / 两者都出现</li>
              <li>Header 自动渲染 topnav / both 类型的工具链接</li>
              <li>HomePage Hero 下方新增 <code>HomeTools</code> 配套工具区</li>
              <li><code>/tools/:id</code> 通用路由处理内部跳转 / 外部跳转 / 占位</li>
              <li>/admin/site-config「工具集成」区块可增删改调位置与辈章</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="文档">
            <ul className="ml-4 list-disc space-y-1">
              <li>/admin/docs 新增「部署方案」Tab：模式 A/B/C 三套详细方案 + 主机选择决策树</li>
              <li>包含 GitHub Actions 示例 / Vercel / Netlify / Cloudflare Pages 对比</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.2.0 — 2025-03-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">细分内容站方法论（基于中餐食谱站案例研究）</p>
          <ChangelogBlock title="新增模块">
            <ul className="ml-4 list-disc space-y-1">
              <li><code>lib/site-config</code> — 站点身份与定位抽象层</li>
              <li><code>lib/series</code> — 主题簇（Pillar → Cluster → Article）</li>
              <li><code>lib/newsletter</code> — 邮件订阅与 Lead Magnet</li>
              <li><code>lib/analytics</code> — 流量分析（7 类来源 + AI 搜索）</li>
              <li><code>lib/monetization</code> — 三段式变现支撑</li>
              <li><code>lib/seo</code> — 自动化 SEO（meta/sitemap/robots/JSON-LD）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="新增页面">
            <ul className="ml-4 list-disc space-y-1">
              <li>/topics — 主题簇索引</li>
              <li>/topics/:slug — 主题详情页（Pillar / Cluster）</li>
              <li>/admin/site-config — 站点身份与定位</li>
              <li>/admin/series — 主题簇管理</li>
              <li>/admin/subscribers — 订阅者管理 + CSV 导出</li>
              <li>/admin/analytics — 流量分析看板</li>
              <li><strong>/admin/docs</strong> — 内部文档中心（当前页面）</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="数据模型扩展">
            <ul className="ml-4 list-disc space-y-1">
              <li>Article 新增 <code>seo</code>（焦点关键词、长尾词、canonical、noai/noimageai）</li>
              <li>Article 新增 <code>cta</code>（leadmagnet/affiliate/newsletter/product）</li>
              <li>Article 新增 <code>seriesId</code> / <code>difficulty</code> / <code>prepTime</code> 等</li>
              <li>Permission 从 8 个扩展到 12 个</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="工具">
            <ul className="ml-4 list-disc space-y-1">
              <li>scripts/post-build.mjs — 构建后自动生成 sitemap.xml + robots.txt</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>v0.1.0 — 2025-02-15</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">基础骨架与可复用基础设施</p>
          <ChangelogBlock title="核心抽象层">
            <ul className="ml-4 list-disc space-y-1">
              <li><code>lib/auth</code> — 鉴权抽象 + Mock 实现（admin/user 双角色）</li>
              <li><code>lib/storage</code> — 存储抽象 + LocalStorage 默认实现</li>
              <li><code>lib/theme</code> — 4 套主题（light/dark/sepia/cyberpunk）</li>
              <li><code>lib/markdown</code> — marked + highlight.js + DOMPurify</li>
              <li><code>lib/images</code> — 图床抽象 + Mock/Http 实现</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="UI 组件">
            <ul className="ml-4 list-disc space-y-1">
              <li>shadcn 风格基础组件：Button/Input/Card/Dialog/Select/Badge/Switch/Tabs/Toast 等</li>
              <li>MarkdownEditor — 双栏/编辑/预览、工具栏、撤销重做、图片上传、自动保存</li>
              <li>ArticleViewer — TOC、阅读进度、Lightbox、代码高亮</li>
              <li>RequireAuth 守卫</li>
              <li>ErrorBoundary</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="页面">
            <ul className="ml-4 list-disc space-y-1">
              <li>用户端：首页 / 文章列表 / 文章详情 / 登录</li>
              <li>后台：仪表盘 / 文章管理 / 文章编辑 / 系统设置</li>
            </ul>
          </ChangelogBlock>
          <ChangelogBlock title="演示数据">
            <ul className="ml-4 list-disc space-y-1">
              <li>3 个作者（admin / editor / user）</li>
              <li>8 篇示例文章（公告 / 教程 / 设计 / 技术 / 生活）</li>
            </ul>
          </ChangelogBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap（下一步）</CardTitle>
          <CardDescription>近期考虑做的事，优先级会随实际使用反馈调整</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <RoadmapItem status="planned" title="数据迁移工具 /admin/migrate" detail="版本感知迁移：老 localStorage / 老 bundle → 新 schema，diff 预览 + 一键升级" />
          <RoadmapItem status="planned" title="RSS / Atom feed" detail="构建时生成 /rss.xml，给邮件订阅者使用" />
          <RoadmapItem status="planned" title="Tags 独立页 /tag/:slug" detail="标签归档页 · SEO 增益 · 模板系统天然适配" />
          <RoadmapItem status="planned" title="真 analytics（Plausible / Umami）" detail="通过 env 切换 · 保留 mock 作 demo" />
          <RoadmapItem status="planned" title="首次登录安全向导" detail="强制改默认 admin/admin123 密码" />
          <RoadmapItem status="planned" title="v1.0.0 — 稳定版" detail="Lighthouse 95+、完整测试覆盖、商业级文档" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 子组件
 * ============================================================ */

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">
        {n}
      </span>
      <div>
        <p className="font-medium text-fg">{title}</p>
        <p className="text-fg-muted">{children}</p>
      </div>
    </li>
  );
}

function Module({ name, desc }: { name: string; desc: string }): React.ReactElement {
  return (
    <li className="flex items-start gap-2">
      <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-primary">
        {name}
      </code>
      <span className="text-fg-muted">— {desc}</span>
    </li>
  );
}

function Workflow({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Layers;
  title: string;
  desc: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <p className="text-sm font-semibold text-fg">{title}</p>
      <p className="mt-1 text-xs text-fg-muted">{desc}</p>
    </div>
  );
}

function Shortcut({ path, desc }: { path: string; desc: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-2">
      <code className="shrink-0 rounded bg-bg-elevated px-2 py-1 font-mono text-xs text-primary">
        {path}
      </code>
      <span className="text-sm text-fg-muted">— {desc}</span>
    </div>
  );
}

function Principle({ title, desc }: { title: string; desc: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <p className="font-semibold text-fg">{title}</p>
      <p className="mt-1 text-sm text-fg-muted">{desc}</p>
    </div>
  );
}

function OperationStep({
  n,
  title,
  detail,
}: {
  n: number;
  title: string;
  detail: string;
}): React.ReactElement {
  return (
    <li className="flex gap-3 rounded-lg border border-border bg-bg-elevated/50 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg">
        {n}
      </span>
      <div>
        <p className="font-medium text-fg">{title}</p>
        <p className="text-sm text-fg-muted">{detail}</p>
      </div>
    </li>
  );
}

function CheckBullet({ text }: { text: string }): React.ReactElement {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <span className="text-fg-muted">{text}</span>
    </li>
  );
}

function MonetizeTier({
  tier,
  title,
  range,
  detail,
}: {
  tier: string;
  title: string;
  range: string;
  detail: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
            {tier}
          </span>
          <span className="font-medium text-fg">{title}</span>
        </div>
        <span className="text-xs text-emerald-500">{range}</span>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{detail}</p>
    </div>
  );
}

function RhythmItem({
  phase,
  cadence,
  tip,
}: {
  phase: string;
  cadence: string;
  tip: string;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-border bg-bg-elevated/50 p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-fg">{phase}</p>
        <Badge variant="secondary">{cadence}</Badge>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{tip}</p>
    </div>
  );
}

function Risk({
  icon: Icon,
  color,
  title,
  detail,
}: {
  icon: typeof AlertTriangle;
  color: string;
  title: string;
  detail: string;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <p className="font-medium text-fg">{title}</p>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{detail}</p>
    </div>
  );
}

function SearchEngineCard({
  name,
  share,
  detail,
}: {
  name: string;
  share: string;
  detail: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-fg">{name}</p>
        <Badge>{share}</Badge>
      </div>
      <p className="mt-2 text-sm text-fg-muted">{detail}</p>
    </div>
  );
}

function KeyStrategy({
  tier,
  example,
  rule,
}: {
  tier: string;
  example: string;
  rule: string;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-fg">{tier}</p>
        <code className="text-xs text-fg-muted">{example}</code>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{rule}</p>
    </div>
  );
}

function SpeedMetric({
  name,
  target,
  current,
  tip,
}: {
  name: string;
  target: string;
  current: string;
  tip: string;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-fg">{name}</p>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline">目标 {target}</Badge>
          <Badge variant="secondary">当前 {current}</Badge>
        </div>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{tip}</p>
    </div>
  );
}

function ModeCard({
  emoji,
  title,
  subtitle,
  tech,
  feature,
  highlight = false,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  tech: string;
  feature: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 transition-all',
        highlight ? 'border-primary bg-primary/5' : 'border-border bg-bg-elevated',
      )}
    >
      <div className="text-2xl">{emoji}</div>
      <p className="mt-1 font-semibold text-fg">{title}</p>
      <p className="text-xs text-fg-muted">{subtitle}</p>
      <div className="mt-3 space-y-1 text-xs">
        <p><strong className="text-fg">主机：</strong><code className="text-primary">{tech}</code></p>
        <p className="text-fg-muted">{feature}</p>
      </div>
    </div>
  );
}

function StepBlock({
  n,
  title,
  desc,
  code,
}: {
  n: number;
  title: string;
  desc?: React.ReactNode;
  code?: string;
}): React.ReactElement {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-bg-elevated/50 p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{title}</p>
        {desc && <p className="mt-1 text-fg-muted">{desc}</p>}
        {code && (
          <pre className="mt-2 overflow-x-auto rounded bg-bg p-2 text-[11px] leading-relaxed text-fg-muted">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function HostCard({
  name,
  price,
  pros,
  cons,
  bestFor,
}: {
  name: string;
  price: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold text-fg">{name}</p>
        <Badge variant="secondary">{price}</Badge>
      </div>
      <div className="mt-2 space-y-2 text-xs">
        <div>
          <p className="font-medium text-success">✓ 优势</p>
          <ul className="ml-4 list-disc text-fg-muted">
            {pros.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium text-danger">× 缺点</p>
          <ul className="ml-4 list-disc text-fg-muted">
            {cons.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium text-fg">适用：</p>
          <p className="text-fg-muted">{bestFor}</p>
        </div>
      </div>
    </div>
  );
}

function ChangelogBlock({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-fg-muted">{title}</p>
      <div className="mt-1 text-fg-muted">{children}</div>
    </div>
  );
}

function RoadmapItem({
  status,
  title,
  detail,
}: {
  status: 'planned' | 'in-progress' | 'done';
  title: string;
  detail: string;
}): React.ReactElement {
  return (
    <div className="rounded-md border border-border bg-bg-elevated/50 p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-fg">{title}</p>
        <Badge variant={status === 'done' ? 'default' : 'outline'}>
          {status === 'planned' ? '规划中' : status === 'in-progress' ? '进行中' : '已完成'}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{detail}</p>
    </div>
  );
}