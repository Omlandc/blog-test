## v0.8.0 — 2025-06-25

### 新增：HTML 格式文章 + 文件拖拽导入

文章编辑器现在支持两种格式，灵活切换、互不破坏：

#### 数据模型
- `Article.format?: 'markdown' | 'html'`（默认 markdown）
- 老文章自动 fallback 到 markdown（迁移 v0.3→v0.4 帮老数据补齐）
- 后台存储、详情页渲染、列表筛选全部带格式透传

#### 新组件 `HtmlEditor`（src/components/editor/HtmlEditor.tsx）
- 原生 `<textarea>` + 等宽字体（避免引入 monaco 几十 KB）
- 行号、字符数、Tab 缩进
- 文件选择器（接受 `.html` `.htm` `.md` `.markdown` `.txt`）
- 拖拽 `.md`/`.html` 文件到编辑区直接导入
- 工具栏显示当前加载文件名 + 清除按钮
- 「切到 Markdown」按钮

#### `MarkdownEditor` 增强
- 新增 `format` / `onFormatChange` props
- `format='html'` 时整体切换到 `HtmlEditor`
- 工具栏新增「导入」按钮
- 工具栏新增「HTML」一键切换按钮
- 整个编辑区支持拖拽文件（`onDrop` 全局监听）

#### `ArticleViewer` 增强
- 新增 `format` prop
- `format='html'` 时走 `HtmlContent` 路径：
  - `DOMPurify.sanitize`（拒绝 script/iframe/onerror 等）
  - 挂载后 `hljs.highlightElement` 应用代码高亮
  - `<table>` 自动包 `overflow-x-auto` 容器
  - `dangerouslySetInnerHTML` 注入（已 sanitize）

#### UI 集成
- `AdminArticlesPage` 表格新增「格式」列（MD / HTML 徽章）
- `ArticleEditorPage`：
  - 新建/编辑都加 `format` 状态
  - 切格式时 toast 提示
  - 持久化到 storage
- `ArticleListPage` 渲染时透传 `format`

#### 演示数据
- seed.ts 新增 1 篇 HTML 格式示例文章（slug: `sample-html-article`）
  - 包含表格 / 代码块 / blockquote
  - 用于演示 HTML 模式渲染

#### i18n
- 新增 `editor.*` 翻译键 14 个

#### Bundle 影响
- index.js 204K（+3K）
- editor 入口增加导入按钮，工具栏自适应

# 更新日志（CHANGELOG）

## v0.2.0 — 2025-03-15

### 新增：细分内容站方法论（基于中餐食谱站案例研究）

借鉴百万月访问量的细分内容站打法，把方法论沉淀为系统能力：

#### 核心架构
- **`lib/site-config`** — 站点身份与定位抽象层
  - 任意细分主题（recipe / tech / travel / parenting / finance / education / design / lifestyle / other）
  - 多语言支持、目标国家权重、AI 爬虫策略
  - 实时反映到全站（Hero / SEO meta / 主题色 / ICP）

- **`lib/series`** — 主题簇（Pillar → Cluster → Article）三级金字塔
  - 每个 Pillar 提升 sitemap 优先级
  - 自动生成 /topics 与 /topics/:slug Pillar 页
  - 内链结构层层传递权重

- **`lib/newsletter`** — 邮件订阅与 Lead Magnet
  - 自动 UTM 解析
  - 4 个订阅触发位置（首页 / 文章末尾 / 退出弹窗 / 引导磁铁）
  - CSV 导出
  - 3 个预置 Lead Magnet

- **`lib/analytics`** — 轻量级流量分析
  - 7 类流量来源（含 AI 搜索）
  - 设备分布、国家推断（timezone）
  - 30 天趋势、热门文章 Top 10
  - 订阅转化漏斗

- **`lib/monetization`** — 三段式变现支撑
  - 广告位（header / sidebar / in-article / footer）
  - 联盟链接 + 点击追踪
  - 收入记录

- **`lib/seo`** — 自动化 SEO 工具
  - 动态 `<head>` 注入（title / description / canonical / OG）
  - JSON-LD 结构化数据（Article / CollectionPage）
  - sitemap.xml 与 robots.txt 构建时生成
  - AI 爬虫指令（noai / noimageai）可控

#### 新增页面
- `/topics` — 主题簇索引
- `/topics/:slug` — 主题详情页（Pillar / Cluster）
- `/admin/site-config` — 站点身份与定位
- `/admin/series` — 主题簇管理
- `/admin/subscribers` — 订阅者管理
- `/admin/analytics` — 流量分析看板

#### 数据模型扩展
- `Article`：新增 `seo`（焦点关键词、长尾词、canonical、noai/noimageai、sitemapPriority）、`cta`（leadmagnet/affiliate/newsletter/product）、`seriesId`、`difficulty`、`prepTime/cookTime/yield`、`publishedAt`、`likes`
- `Permission` 从 8 个扩展到 12 个（新增 `series:manage` / `site:configure` / `analytics:view` / `subscribers:manage` / `monetization:manage`）

#### 工具
- `scripts/post-build.mjs` — 构建后自动生成 `sitemap.xml`（22 URL）+ `robots.txt`（默认屏蔽 AI 爬虫）

---

## v0.1.0 — 2025-02-15

### 基础骨架

#### 核心抽象层
- **`lib/auth`** — `AuthAdapter` 接口 + `MockAuthAdapter`（admin/admin123、user/user123 两个内置账号）
- **`lib/storage`** — `StorageAdapter<T>` 接口 + `LocalStorageArticleAdapter` 默认实现
- **`lib/theme`** — 4 套主题预设（light / dark / sepia / cyberpunk），CSS 变量驱动，实时切换
- **`lib/markdown`** — marked + highlight.js + DOMPurify + 自定义渲染器
- **`lib/images`** — `ImageUploader` 接口 + `MockImageUploader`（base64）+ `HttpImageUploader` stub

#### UI 组件
- shadcn 风格基础组件：Button / Input / Textarea / Card / Dialog / Select / Badge / Switch / DropdownMenu / Tabs / Label / Toast
- **MarkdownEditor** — 双栏/编辑/预览、工具栏、撤销重做、图片上传、自动保存、字数统计、快捷键（⌘B/I/K/S/Z）
- **ArticleViewer** — TOC scroll spy、阅读进度条、代码块复制按钮、Lightbox、XSS 过滤
- **RequireAuth** — 路由守卫
- **ErrorBoundary**

#### 页面
- 用户端：首页、文章列表、文章详情、登录
- 后台：仪表盘、文章管理（表格/卡片 + 筛选 + 批量 + 分页）、文章编辑、系统设置

#### 演示数据
- 3 个作者（admin / editor / user）
- 8 篇示例文章
## v0.3.0 — 2025-03-15

### 新增：面包屑导航 + 中英双语支持

#### 面包屑（Breadcrumb）
- 新增 `src/components/layout/Breadcrumb.tsx`
- 解析 `useLocation()` 自动生成面包屑
- 支持动态参数（`/article/:slug`、`/topics/:slug`）
- 集成在 `AppShell`，全站统一展示
- 移动端友好：长标题 truncate，桌面端可点击跳转
- Framer Motion 入场动画

#### 中英双语 i18n
- 新增 `src/lib/i18n/index.tsx`（约 120 条翻译 key）
  - `useI18n()` hook 提供 `t(key, params?)`、`locale`、`setLocale`、`detected`
  - `I18nProvider` 包裹在 App 顶层
- **自动检测浏览器语言**：`navigator.language` 命中 `en-*` → en-US，其他 → zh-CN
- **三层优先级**：用户手动选择 (localStorage) > SiteConfig.language > 浏览器默认
- 新增 `src/components/i18n/LanguageSwitcher.tsx` —— "中 / EN" 紧凑切换器，挂在 Header
- 已接入的 UI：AppShell 面包屑 / Header 导航 / 登录按钮 / 用户菜单
- 翻译覆盖：common / nav / auth / article / topic / admin / sub / theme / docs
- 文档：https://${site}/admin/docs → docs.tab.usage 已记录使用方法

#### 部署
- 部署：v9 → https://i8x9gq8d3aau.space.minimaxi.com
- GitHub：commit `6b466de`

## v0.3.0 — 2025-03-15

### 新增：多模式部署架构 + 工具集成入口

#### 部署模式
- `SiteConfig.mode: 'embedded' | 'static'`
- `static` 模式下 `/admin/*` 路由自动重定向到 `/`
- App 启动时 fetch `/data/articles.json` 静态包，成功则覆盖 SiteConfig / 工具入口 / 文章存储
- `/admin/site-config` 新增「部署模式」+「静态 Bundle 导出」区块
- `scripts/export-static.mjs` 把 admin 导出的 bundle 写入 `public/data/articles.json`
- 新增 npm scripts: `build:static` / `export:static`

#### 工具集成（多项目互推矩阵）
- `SiteConfig.tools: ToolEntry[]` — id / name / icon / url / position / target / order / badge
- Header 自动渲染 topnav/both 类型的工具链接
- HomePage Hero 下方新增 `<HomeTools>` 配套工具卡片区
- `/tools/:id` 通用路由：内部跳转 / 外部 URL / 占位 三种处理
- `/admin/site-config`「工具集成」区块可增删改 + 切换位置 + 加徽章
- 默认注册一个 `MVP 助手` demo entry

#### 文档
- `/admin/docs` 新增「部署方案」Tab（5 个 Tab 之一）
  - 模式 A：内容生产+宣传（Vercel / Netlify）
  - 模式 B：纯内容站（GitHub Pages / 零后端）—— 含 GitHub Actions deploy.yml 完整示例
  - 模式 C：内容 + 工具搭配（多项目互推矩阵）
  - 主机选择决策树（GitHub Pages / Vercel / Netlify / Cloudflare Pages 对比）
- `CHANGELOG.md` 更新

#### 类型扩展（types.ts）
- `DeploymentMode` · `ToolEntry` · `StaticBundle`

#### 部署
- 当前部署：https://4daflsnkv9wy.space.minimaxi.com
- GitHub：`a1042b1`

## v0.4.0 — 2025-03-15

### 优化：图片策略 + 备份恢复 + Bundle 拆分 + 真搜索

#### 1. 图片策略（解决 localStorage 溢出）
- 新增 `RemoteUrlImageUploader` —— 粘贴/输入 URL，零存储，GitHub Pages 友好
- 新增 `CompressedImageUploader` —— canvas 客户端压缩（WebP/85% 质量/1600px 宽边上限）
- `recommendStrategy()` 自动建议策略
- `ImageUploadButton` 重写为双模式 UI
  - < 1MB 自动压缩
  - 1-5MB 提示改 URL
  - > 5MB 拒绝（必须用 URL）
- 默认上传器：`CompressedImageUploader`

#### 2. 备份恢复（避免数据丢失）
- `/admin/site-config` 新增「导入 Bundle」按钮（覆盖 localStorage，含安全确认）
- 新增「导出为 Markdown」按钮：每篇生成 YAML frontmatter + .md 内容

#### 3. Bundle 拆分
- Vite `manualChunks`：5 个 vendor 块
- 所有 admin 页面路由级 lazy load
- 编辑器页（最重）独立 chunk
- 去掉 `lib/markdown/render.ts` 中多余的 highlight.js
- **首屏 bundle 从 720KB → 201KB gzip（-72%）**

#### 4. 真搜索 `/search`
- 全文索引：title + excerpt + content
- 多词 AND 查询 + 相关度打分
- 过滤：主题簇 / 标签 / 难度
- 排序：相关度 / 最新 / 热门
- 命中片段高亮（`<mark>`）
- URL 同步搜索参数（可分享链接）
- Header 加搜索图标入口

#### 类型扩展
- `UploadedImage.source: 'local' | 'compressed' | 'remote' | 'http'`

#### 部署
- v12 → https://buv3545bgali.space.minimaxi.com
- GitHub：`f4ef5bb`

## v0.5.0 — 2025-03-15

### 新增：资源导航 /resources

#### 模块
- `lib/links/` —— 独立的资源导航数据模块
  - `types.ts`：LinkEntry / LinkCategory (7 类) / LinkPricing / CATEGORY_META / PRICING_META
  - `seed.ts`：15 个 demo 链接覆盖 6 个分类
  - `index.tsx`：LinkStore + useLinks() hook + 静态便捷方法
    - CRUD + replaceAll + incrementClicks + subscribe
    - 按 featured 优先 + order 排序

#### 用户页面
- `/resources` —— 资源导航总览
  - Hero + 分类统计
  - 精选区（featured 4 大卡）
  - 搜索 + 分类筛选条
  - 卡片网格（3 列，hover 微动画）
  - 「推荐你喜欢的工具」邮件 CTA
- `/resources/:category` —— 单分类独立着陆页
  - 每个分类独立 JSON-LD `CollectionPage`
  - 自动 404 跳回 `/resources`

#### 后台 `/admin/resources`
- 卡片网格列表（按分类筛选）
- 完整编辑表单
- 一键切换 featured
- 导出 / 导入 JSON
- 删除带二次确认

#### 与现有系统集成
- **静态 bundle**：`StaticBundle.links[]` 字段全链路打通（admin → bundle → GitHub Pages）
- **Sitemap**：+8 个 URL（主 + 7 分类），优先级 0.5-0.9
- **SEO**：每个分类页独立 `CollectionPage` JSON-LD
- **Analytics**：`trackPageView('/resources/:cat')`
- **Header**：顶部导航新增「资源」入口
- **i18n**：`common.resources` 翻译键（中 / 英）

#### 部署
- v13 → https://jfpranp3n1l5.space.minimaxi.com
- GitHub：`c85c77d`

## v0.6.0 — 2025-03-15

### 新增：交互式专栏系统（Explorables）v1

#### 新模块
- `src/lib/explorables/` —— 交互式专栏注册表
  - `types.ts`：`ExplorableMeta` + `ExplorableModule` + 6 个 category
  - `registry.tsx`：`listExplorables` / `getExplorableMeta` / `useExplorable` hook
  - `seed.ts`：当前注册 1 篇 demo

#### 第一篇专栏：主题切换演示 `theme-system-showcase`
- `src/components/explorables/ThemeShowcase.tsx`
- 5 个互动模块：
  1. 主题选择（4 套主题卡片，点击切换）
  2. CSS 变量实时数值（带复制到剪贴板）
  3. 组件变体展示（Button × 5 变体 / Badge × 4 / Input / Card）
  4. 并排对比模式（左右两主题同步演示）
  5. 「它怎么工作的」简短技术说明
- 与现有 `ThemeSwitcher` 双向同步：演示里选的主题也会持久化到 localStorage

#### 用户页面
- `/explore` —— 交互专栏索引（卡片网格 + 分类/难度/时长/版本号）
- `/explore/:slug` —— 详情页
  - 头部元信息
  - 简介卡片
  - 互动组件区（虚线框标识「互动区」）
  - 相关阅读 + JSON-LD `LearningResource`

#### 与现有系统集成
- Header：顶部导航新增「探索」入口
- i18n：`common.explore` 中英双语
- Sitemap：30 → 32 URLs（+`/explore` + `/explore/theme-system-showcase`）

#### 维护模型
- **Git-driven**：加一篇 = 在 `seed.ts` 注册 + 在 `components/explorables/` 写组件
- **组件代码不进 admin**：避免 admin 误编辑破坏交互
- meta 字段可在 v2 接入 admin 元数据管理

#### 部署
- v15 → https://g497eu1o8v5m.space.minimaxi.com
- GitHub：`3554e80`
