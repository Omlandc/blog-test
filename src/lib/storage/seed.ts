/**
 * 演示数据 —— 首次运行时预置示例文章、作者
 *
 * 体现"细分内容站"方法论：
 * - 每个文章属于一个 Series（pillar → cluster → article）
 * - 每个文章有 SEO 字段（焦点关键词、长尾词、noai 指令）
 * - 每个文章有 CTA（lead magnet / affiliate / newsletter）
 * - 标签 + 分类 + 系列 三层定位
 */
import type { Article, Author } from '../types';

export const SEED_AUTHORS: Author[] = [
  {
    id: 'u_admin',
    name: '管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: '系统管理员，热爱分享技术与设计。',
    role: 'admin',
    social: {
      twitter: 'https://twitter.com/example',
      github: 'https://github.com/example',
    },
  },
  {
    id: 'u_editor',
    name: '编辑小林',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
    bio: '前端工程师，沉迷 React 与 TypeScript。',
    role: 'editor',
    social: {
      github: 'https://github.com/example',
      website: 'https://example.com',
    },
  },
  {
    id: 'u_user',
    name: '用户小张',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    bio: '普通用户，喜欢读文章偶尔评论。',
    role: 'user',
  },
];

const svgCover = (text: string, c1: string, c2: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="320" fill="url(#g)"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif" font-weight="bold" dominant-baseline="middle">${text}</text></svg>`,
  );

export const SEED_ARTICLES: Article[] = [
  {
    id: 'a_welcome',
    slug: 'welcome-to-the-blog',
    title: '欢迎来到这个全新的博客系统',
    seriesId: 's_tech',
    content: `# 欢迎来到这个全新的博客系统

这是一套**为细分内容站量身定制**的可复用框架。它不仅是一个博客，更是一套覆盖"选题 → 创作 → SEO → 私域 → 变现"全链路的方法论。

## 核心理念

- **结构化内容**：Pillar（支柱）→ Cluster（子分类）→ Article（文章），三级金字塔
- **SEO 自动化**：每篇文章都有焦点关键词、长尾词、canonical、AI 爬虫指令
- **私域兜底**：邮件订阅、Lead Magnet（引导磁铁）从第一天就位
- **可视化运营**：单人站长也能看清流量、来源、转化

## 演示账号

| 用户名 | 密码 | 角色 |
| --- | --- | --- |
| \`admin\` | \`admin123\` | 完整后台 |
| \`user\` | \`user123\` | 前台用户 |

> 这是一段引用文字，用来展示主题中的 \`fg-muted\` 文本与左边框的视觉。
`,
    excerpt:
      '一套为细分内容站量身定制的可复用框架：结构化内容、SEO 自动化、私域兜底、可视化运营。',
    cover: svgCover('Welcome', '#6366f1', '#a855f7'),
    tags: ['公告', '介绍'],
    category: '公告',
    difficulty: 'beginner',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-12T10:30:00.000Z',
    publishedAt: '2025-01-12T10:30:00.000Z',
    views: 1280,
    likes: 64,
    seo: {
      title: '细分内容站框架：可复用的博客与创作系统',
      description:
        '一套为细分内容站量身定制的可复用框架，含结构化内容、SEO 自动化、私域兜底、可视化运营。',
      focusKeyword: '细分内容站',
      keywords: ['细分内容站', '博客系统', '内容站框架', 'Pillar Page'],
      noai: true,
      noimageai: true,
      sitemapPriority: 1.0,
    },
    cta: {
      type: 'leadmagnet',
      label: '下载《细分内容站 SEO 自检表》',
      description: '90 个检查项，覆盖技术 / 内容 / 外链',
      url: '#subscribe',
      prominent: true,
    },
  },
  {
    id: 'a_markdown_guide',
    slug: 'markdown-rendering-guide',
    title: 'Markdown 渲染能力完全指南',
    seriesId: 's_tech',
    content: `# Markdown 渲染能力完全指南

本博客的渲染管线使用 **marked** + **highlight.js** + **DOMPurify**。

## 表格

| 特性 | 支持 | 说明 |
| --- | --- | --- |
| GFM 表格 | ✅ | 通过 marked gfm 选项 |
| 代码高亮 | ✅ | highlight.js |
| 删除线 | ✅ | GFM |
| 任务列表 | ✅ | GFM |

## 代码块

\`\`\`tsx
import { Button } from '@/components/ui/button';

export function Hello() {
  return <Button>你好</Button>;
}
\`\`\`

## 列表与任务列表

- 普通项
- 另一个普通项

- [x] 已完成
- [ ] 未完成
- [x] 又一个已完成

## 删除线与强调

~~错误~~ 的写法，**正确** 的写法。
`,
    excerpt:
      '本文详解博客系统的 Markdown 渲染管线：表格、代码高亮、删除线、任务列表、懒加载图片等。',
    cover: svgCover('Markdown', '#0ea5e9', '#06b6d4'),
    tags: ['Markdown', '教程'],
    category: '教程',
    difficulty: 'intermediate',
    authorId: 'u_editor',
    status: 'published',
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-18T11:00:00.000Z',
    publishedAt: '2025-01-18T11:00:00.000Z',
    views: 856,
    likes: 42,
    seo: {
      focusKeyword: 'Markdown 渲染',
      keywords: ['Markdown', 'marked', 'highlight.js', '代码高亮'],
      sitemapPriority: 0.8,
    },
  },
  {
    id: 'a_themes',
    slug: 'theme-system-overview',
    title: '主题系统设计概览',
    seriesId: 's_design',
    content: `# 主题系统设计概览

我们设计了 **4 套主题**，全部使用 CSS 变量驱动，可以实时切换且不闪烁。

## 主题清单

1. **light**：明亮通透的默认主题
2. **dark**：夜间模式
3. **sepia**：护眼米色，长时间阅读友好
4. **cyberpunk**：赛博朋克霓虹风格

## 切换机制

\`\`\`ts
document.documentElement.setAttribute('data-theme', 'dark');
\`\`\`
`,
    excerpt: '4 套主题全部基于 CSS 变量驱动，可实时切换且不闪烁。',
    cover: svgCover('Themes', '#f59e0b', '#ef4444'),
    tags: ['设计', '主题', 'CSS'],
    category: '设计',
    difficulty: 'beginner',
    authorId: 'u_editor',
    status: 'published',
    createdAt: '2025-01-20T14:00:00.000Z',
    updatedAt: '2025-01-22T09:00:00.000Z',
    publishedAt: '2025-01-22T09:00:00.000Z',
    views: 542,
    likes: 28,
    seo: {
      focusKeyword: 'CSS 变量主题',
      keywords: ['主题系统', 'CSS 变量', '暗色模式'],
      sitemapPriority: 0.7,
    },
  },
  {
    id: 'a_auth_architecture',
    slug: 'auth-architecture-pluggable',
    title: '可插拔鉴权架构：从 Mock 到生产',
    seriesId: 's_auth_arch',
    content: `# 可插拔鉴权架构：从 Mock 到生产

为了让博客系统能被不同业务复用，我们把鉴权设计为可插拔的。

## 接口设计

\`\`\`ts
export interface AuthAdapter {
  getCurrentUser(): Promise<AuthUser | null>;
  login(credentials: LoginCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  hasPermission(permission: Permission): Promise<boolean>;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
}
\`\`\`

## 默认实现：Mock

内置两个测试账号：\`admin / admin123\` 和 \`user / user123\`。

## 接入真实后端

只需要实现 \`AuthAdapter\` 接口，例如对接 JWT：

\`\`\`ts
export class JwtAuthAdapter implements AuthAdapter {
  async login({ username, password }) {
    const res = await fetch('/api/login', { method: 'POST', body: ... });
    return res.json();
  }
}
\`\`\`

## 权限粒度

系统定义了 12 个权限：article:read/create/edit/delete/publish、admin:access、theme:manage、user:manage、series:manage、site:configure、analytics:view、subscribers:manage、monetization:manage。
`,
    excerpt:
      '从 Mock 鉴权到 JWT/OAuth 真实后端，本系统都支持。本文讲解如何替换鉴权适配器。',
    cover: svgCover('Auth', '#8b5cf6', '#ec4899'),
    tags: ['架构', '鉴权', 'TypeScript'],
    category: '技术',
    difficulty: 'intermediate',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-02-01T10:00:00.000Z',
    publishedAt: '2025-02-01T10:00:00.000Z',
    views: 432,
    likes: 21,
    seo: {
      focusKeyword: '可插拔鉴权',
      keywords: ['鉴权', 'JWT', 'OAuth', 'AuthAdapter'],
      sitemapPriority: 0.8,
    },
  },
  {
    id: 'a_design_philosophy',
    slug: 'design-philosophy-medium-style',
    title: '设计哲学：Medium 风格的克制与精致',
    seriesId: 's_design',
    content: `# 设计哲学：Medium 风格的克制与精致

我们参考了 **Medium**、**Notion**、**Vercel Blog** 的设计语言，追求克制的精致感。

## 核心原则

1. **内容优先**：排版服务于阅读
2. **颜色克制**：主题色只在 CTA、链接、关键数据点出现
3. **动画轻盈**：Framer Motion 用于过渡
4. **暗色模式细节**：背景用 hsl 而非纯黑

> 排版细节是设计的灵魂。
`,
    excerpt: '我们参考 Medium、Notion 的设计语言，追求克制的精致感。',
    cover: svgCover('Design', '#10b981', '#06b6d4'),
    tags: ['设计', 'UX', '排版'],
    category: '设计',
    difficulty: 'beginner',
    authorId: 'u_editor',
    status: 'published',
    createdAt: '2025-02-10T15:00:00.000Z',
    updatedAt: '2025-02-10T15:00:00.000Z',
    publishedAt: '2025-02-10T15:00:00.000Z',
    views: 318,
    likes: 19,
    seo: {
      focusKeyword: 'Medium 风格设计',
      keywords: ['设计哲学', 'Medium 风格', '排版'],
      sitemapPriority: 0.6,
    },
  },
  {
    id: 'a_deploy_practices',
    slug: 'deploy-and-cdn-practices',
    title: '部署与 CDN 最佳实践',
    seriesId: 's_tech',
    content: `# 部署与 CDN 最佳实践

本文记录我们把博客系统部署到生产环境时采用的策略。

## 构建产物

\`\`\`bash
npm run build
# → dist/index.html (0.5 KB)
# → dist/assets/index-*.css (25 KB → gzip 6 KB)
# → dist/assets/index-*.js (478 KB → gzip 156 KB)
\`\`\`

## 部署目标

Vercel / Netlify / 阿里云 OSS + CDN 都可以。

## SPA 路由处理

\`vercel.json\` 设置 \`"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]\`。

## CDN 缓存策略

- HTML：不缓存或短缓存（5 分钟）
- JS/CSS：\`max-age=31536000, immutable\`（带 hash 文件名）
- 图片：\`max-age=2592000\`（30 天）
`,
    excerpt: 'Vercel / Netlify / 阿里云 OSS 都可部署。包含 SPA 路由 fallback 与 CDN 缓存策略。',
    cover: svgCover('Deploy', '#ec4899', '#f43f5e'),
    tags: ['部署', 'CDN', '性能'],
    category: '技术',
    difficulty: 'intermediate',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-02-15T11:00:00.000Z',
    updatedAt: '2025-02-15T11:00:00.000Z',
    publishedAt: '2025-02-15T11:00:00.000Z',
    views: 267,
    likes: 14,
    seo: {
      focusKeyword: 'CDN 缓存策略',
      keywords: ['部署', 'CDN', 'Vercel', 'Nginx'],
      sitemapPriority: 0.6,
    },
  },
  {
    id: 'a_life_morning',
    slug: 'morning-routine-productivity',
    title: '我的晨间三十分钟：工程师的精力管理',
    seriesId: undefined,
    content: `# 我的晨间三十分钟：工程师的精力管理

写代码这件事，**状态比时长重要**。

## 6:30 起床

不要设闹钟到 7:00。提前 30 分钟，世界会很不一样。

## 6:35-6:50 散步

不带手机。在小区里走 15 分钟。看看树叶、听鸟叫、想昨晚没想清楚的算法。

## 6:50-7:00 写日记

只写三件事：昨天做得最好的一件事、今天最重要的三件事、一个让今天变得不一样的承诺。

> 习惯不是自律，是**减摩擦**。
`,
    excerpt: '6:30 起床、散步 15 分钟、写日记 10 分钟、7:00 进入工作状态。',
    cover: svgCover('Life', '#fbbf24', '#f97316'),
    tags: ['生活', '效率', '习惯'],
    category: '生活',
    difficulty: 'beginner',
    authorId: 'u_user',
    status: 'published',
    createdAt: '2025-02-20T07:00:00.000Z',
    updatedAt: '2025-02-20T07:00:00.000Z',
    publishedAt: '2025-02-20T07:00:00.000Z',
    views: 198,
    likes: 12,
    seo: {
      focusKeyword: '晨间习惯',
      keywords: ['晨间习惯', '精力管理', '效率'],
      sitemapPriority: 0.5,
    },
  },
  {
    id: 'a_storage_adapter',
    slug: 'storage-adapter-design',
    title: '存储抽象：让数据自由流动',
    seriesId: 's_storage_design',
    content: `# 存储抽象：让数据自由流动

博客系统需要持久化文章数据。我们设计了 \`StorageAdapter<T>\` 接口，让数据可以存储在 LocalStorage、IndexedDB、甚至远程 REST API。

## 接口定义

\`\`\`ts
export interface StorageAdapter<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id'>): Promise<T>;
  update(id: string, partial: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  subscribe(cb: (items: T[]) => void): () => void;
}
\`\`\`

## 三个实现

### LocalStorage（默认）

适合演示和本地开发。

### IndexedDB（规划中）

适合大量文章（> 1000 篇）。

### REST API（示例）

\`\`\`ts
export class ApiStorageAdapter implements StorageAdapter<Article> {
  async getAll() {
    const res = await fetch('/api/articles');
    return res.json();
  }
}
\`\`\`

## 切换方式

通过 Context Provider 注入，业务组件零改动。
`,
    excerpt:
      '从 LocalStorage 到 IndexedDB 再到 REST API，StorageAdapter 让数据存储可插拔。',
    cover: svgCover('Storage', '#3b82f6', '#8b5cf6'),
    tags: ['架构', 'TypeScript', '存储'],
    category: '技术',
    difficulty: 'intermediate',
    authorId: 'u_editor',
    status: 'published',
    createdAt: '2025-02-25T13:00:00.000Z',
    updatedAt: '2025-02-25T13:00:00.000Z',
    publishedAt: '2025-02-25T13:00:00.000Z',
    views: 145,
    likes: 9,
    seo: {
      focusKeyword: 'Storage Adapter',
      keywords: ['存储抽象', 'StorageAdapter', '适配器模式'],
      sitemapPriority: 0.6,
    },
  },
  // ─── 新增：内容站运营系列 ───
  {
    id: 'a_topic_cluster_guide',
    slug: 'topic-cluster-pillar-guide',
    title: '主题簇架构：让搜索引擎和 AI 都把你当答案',
    seriesId: 's_seo',
    content: `# 主题簇架构：让搜索引擎和 AI 都把你当答案

很多站长写了几百篇文章，谷歌还是不收录、没排名，AI 搜索也不提你。问题不在文章数量，而在**没有结构**。

## 什么是主题簇（Topic Cluster）

主题簇 = 1 个 Pillar（支柱页）+ N 个 Cluster（子分类）+ M 个 Article（具体文章）的三层结构。

\`\`\`
Pillar（"中餐食谱"）
├── Cluster 1（"川菜入门"）
│   ├── Article 1（"麻婆豆腐怎么做"）
│   ├── Article 2（"回锅肉用什么肉"）
│   └── ...
├── Cluster 2（"面食"）
│   ├── Article 1（"手擀面和面比例"）
│   └── ...
\`\`\`

## 为什么有效

1. **权重层层传递**：Pillar 拿到的高权重，通过内链流向 Cluster，再流向 Article
2. **语义关联**：围绕一个主题的所有文章互相强化，告诉搜索引擎"这个站是这方面的专家"
3. **AI 搜索友好**：ChatGPT / Perplexity 倾向引用结构化、有内链网络的来源

## 实操步骤

1. 用工具（如 Ahrefs / 5118）挖出 100-500 个长尾关键词
2. 按主题分成 5-10 个 Cluster
3. 每个 Cluster 写一篇 Pillar + 10-30 篇文章
4. 严格内链：每篇文章链到 Pillar 和 2-3 篇同 Cluster 的文章
`,
    excerpt:
      'Pillar → Cluster → Article 三级金字塔，让搜索引擎和 AI 搜索都把你当答案。',
    cover: svgCover('Cluster', '#14b8a6', '#06b6d4'),
    tags: ['SEO', '主题簇', 'Pillar'],
    category: '运营',
    difficulty: 'intermediate',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-03-01T09:00:00.000Z',
    updatedAt: '2025-03-01T09:00:00.000Z',
    publishedAt: '2025-03-01T09:00:00.000Z',
    views: 1247,
    likes: 89,
    seo: {
      title: '主题簇架构指南：Pillar + Cluster + Article',
      description:
        'Pillar → Cluster → Article 三级金字塔，让搜索引擎和 AI 搜索都把你当答案。',
      focusKeyword: '主题簇架构',
      keywords: ['主题簇', 'Pillar Page', 'Topic Cluster', '内链策略', 'SEO 架构'],
      canonicalUrl: 'https://example.com/article/topic-cluster-pillar-guide',
      noai: false,
      sitemapPriority: 0.9,
    },
    cta: {
      type: 'leadmagnet',
      label: '下载主题簇搭建模板',
      description: '可复用的 Pillar → Cluster → Article 模板，附 30 个细分领域案例',
      url: '#subscribe',
      prominent: true,
    },
  },
  {
    id: 'a_newsletter_setup',
    slug: 'newsletter-from-day-one',
    title: '邮件订阅：内容站的护城河',
    seriesId: 's_monetization',
    content: `# 邮件订阅：内容站的护城河

> "谷歌流量是租来的，邮件列表才是自己的。"

## 为什么必须第一天就做

很多站长的错误：等到流量起来了再考虑邮件订阅。结果流量真起来时，发现根本没时间补这个短板，等算法更新把流量打下来再后悔。

## 三步搭建邮件订阅系统

### 1. 准备 Lead Magnet（引导磁铁）

一份对读者有实际价值的免费资源：

- 一本电子书（如《XX 5 个秘诀》）
- 一个清单 / 模板
- 一份行业报告
- 一段教学视频

### 2. 触发订阅的 4 个时机

1. **首页底部** —— 进入就订阅
2. **每篇文章末尾** —— 阅读完最可能订阅
3. **弹窗（exit intent）** —— 用户准备离开时
4. **特定动作后** —— 例如查阅 3 篇文章后

### 3. 持续提供价值

每周一封邮件，提供：

- 1 篇本周新文章
- 1 个小技巧 / 工具
- 1 个读者问答

## 推荐工具

- **ConvertKit**：最友好的创作者工具
- **Mailchimp**：通用方案，免费额度大
- **Substack**：内置订阅 + 付费墙
`,
    excerpt: '邮件订阅是内容站的护城河，从第一天就该搭建。本文讲三步实现。',
    cover: svgCover('Newsletter', '#f97316', '#ec4899'),
    tags: ['邮件订阅', '私域', '变现'],
    category: '运营',
    difficulty: 'beginner',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-03-05T11:00:00.000Z',
    updatedAt: '2025-03-05T11:00:00.000Z',
    publishedAt: '2025-03-05T11:00:00.000Z',
    views: 832,
    likes: 67,
    seo: {
      focusKeyword: '邮件订阅',
      keywords: ['邮件订阅', '邮件列表', '私域', 'Lead Magnet'],
      sitemapPriority: 0.8,
    },
    cta: {
      type: 'newsletter',
      label: '订阅本周精选',
      description: '免费，每周一封，只发干货',
      url: '#subscribe',
      prominent: true,
    },
  },
  {
    id: 'a_ai_search_optimization',
    slug: 'ai-search-optimization',
    title: 'AI 搜索优化：让 ChatGPT / Perplexity 引用你的内容',
    seriesId: 's_seo',
    content: `# AI 搜索优化：让 ChatGPT / Perplexity 引用你的内容

ChatGPT 每周活跃用户 2 亿、Perplexity 高速增长、Google AI Overview 已经覆盖一半搜索结果。**AI 搜索是新流量入口**。

## AI 搜索的引用偏好

AI 搜索倾向引用满足以下特征的内容：

1. **结构化**：用 H1/H2/H3 清晰分章节
2. **数据具体**：精确数字、案例、来源
3. **原创观点**：非共识但有理有据的判断
4. **权威信号**：作者简介、专业领域、外链

## 实操清单

- [ ] 每篇文章有清晰的标题 + H2 小标题层级
- [ ] 关键数据用列表或表格呈现
- [ ] 作者有详细的 bio 页面
- [ ] 引用其他来源时加超链接
- [ ] FAQ 区块：直接回答常见问题（AI 容易抓取）
- [ ] 提交到 Bing IndexNow（ChatGPT 用 Bing）

## 关于 noai / noimageai

\`robots.txt\` 和 \`<meta name="robots" content="noai">\` 可以阻止 AI 爬虫。

权衡：

- **允许**：获得 AI 引用流量
- **禁止**：保护原创内容，但失去 AI 搜索曝光

建议：先观察 3 个月，看 AI 引用带来的流量 vs 原创保护的价值，再决定。
`,
    excerpt: 'AI 搜索是新流量入口。本文讲如何让 ChatGPT、Perplexity、Google AI 引用你的内容。',
    cover: svgCover('AI Search', '#06b6d4', '#3b82f6'),
    tags: ['AI 搜索', 'SEO', 'ChatGPT'],
    category: '运营',
    difficulty: 'intermediate',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-03-10T14:00:00.000Z',
    updatedAt: '2025-03-10T14:00:00.000Z',
    publishedAt: '2025-03-10T14:00:00.000Z',
    views: 645,
    likes: 53,
    seo: {
      focusKeyword: 'AI 搜索优化',
      keywords: ['AI 搜索', 'GEO', 'ChatGPT', 'Perplexity', 'Generative Engine Optimization'],
      sitemapPriority: 0.9,
    },
  },
  {
    id: 'a_three_tier_monetization',
    slug: 'three-tier-monetization',
    title: '三段式变现：广告打底，私域兜底，产品封顶',
    seriesId: 's_monetization',
    content: `# 三段式变现：广告打底，私域兜底，产品封顶

健康的变现结构应该是三层叠加：

## 第一层：展示广告（吃饭的）

千次浏览收入（CPM）：

- 美国 / 英国 / 澳洲：高价值市场 $12-$30 / 千次
- 东南亚：$1-$5 / 千次
- 中国大陆：$2-$8 / 千次

推荐策略：

- 流量 < 10 万：用 Google AdSense
- 流量 10 万-50 万：申请 Ezoic
- 流量 > 50 万：申请 Mediavine
- 流量 > 100 万：Mediavine / Raptive

## 第二层：私域（保命的）

邮件列表 + 自有社群。算法更新时，唯一能直接联系用户的方式。

- 把每篇文章末尾放订阅框
- 每 1k 篇文章浏览 → 10-30 个新订阅者是健康水平
- 1 万订阅者 ≈ 月入 $500-$5000（推荐产品时）

## 第三层：产品（封顶的）

- 出书：把多年内容沉淀为纸质/电子书
- 付费课程：把深度方法论包装为系列课
- 付费社群：高端 1v1 答疑 / 圈子准入
- 自有产品：调味品、工具、实物等

> 不要一上来就卖产品，先用免费内容建立信任，再用广告和订阅沉淀用户，最后推产品。
`,
    excerpt: '展示广告 + 邮件订阅 + 自有产品，三段式变现的完整策略与节点。',
    cover: svgCover('Money', '#22c55e', '#16a34a'),
    tags: ['变现', '广告', '订阅'],
    category: '运营',
    difficulty: 'intermediate',
    authorId: 'u_admin',
    status: 'published',
    createdAt: '2025-03-15T10:00:00.000Z',
    updatedAt: '2025-03-15T10:00:00.000Z',
    publishedAt: '2025-03-15T10:00:00.000Z',
    views: 489,
    likes: 41,
    seo: {
      focusKeyword: '内容站变现',
      keywords: ['变现', '广告', 'AdSense', 'Mediavine', '订阅'],
      sitemapPriority: 0.8,
    },
    cta: {
      type: 'affiliate',
      label: '推荐：ConvertKit 邮件营销',
      description: '创作者最友好的邮件工具，30 天免费试用',
      url: 'https://convertkit.com',
      prominent: false,
    },
  },
  {
    id: 'sample-html-article',
    slug: 'sample-html-article',
    title: 'HTML 格式文章示例：可注入的丰富内容',
    format: 'html',
    contentTheme: 'cyberpunk',
    excerpt: '演示如何用 HTML 格式写文章，支持更丰富的结构和样式。',
    cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200',
    tags: ['HTML', '示例', '教程'],
    category: '教程',
    seriesId: undefined,
    authorId: 'default-admin',
    status: 'published',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    views: 0,
    likes: 0,
    content: `<article>
  <h1>HTML 格式文章示例</h1>
  <p>这是一篇用 <strong>HTML</strong> 格式写的文章，可以包含更丰富的结构。</p>

  <h2>为什么需要 HTML 模式？</h2>
  <p>Markdown 简单，但有些场景它表达不了：</p>
  <ul>
    <li>复杂的表格布局</li>
    <li>自定义的 div / section 容器</li>
    <li>嵌入第三方组件的 div 容器</li>
  </ul>

  <h2>安全说明</h2>
  <p>所有 HTML 在渲染时都会过 <code>DOMPurify</code> 过滤：</p>
  <pre><code class="language-html">&lt;script&gt;alert(1)&lt;/script&gt;  // 会被剥离
&lt;img src=x onerror="..."&gt;   // onerror 会被过滤
</code></pre>

  <h2>代码高亮</h2>
  <p>HTML 模式也支持代码高亮（hljs）：</p>
  <pre><code class="language-ts">interface Article {
  id: string;
  title: string;
  format?: 'markdown' | 'html';
}</code></pre>

  <h2>表格</h2>
  <table>
    <thead><tr><th>特性</th><th>Markdown</th><th>HTML</th></tr></thead>
    <tbody>
      <tr><td>上手成本</td><td>低</td><td>中</td></tr>
      <tr><td>表达力</td><td>中</td><td>高</td></tr>
      <tr><td>安全性</td><td>高</td><td>中（要 sanitize）</td></tr>
    </tbody>
  </table>

  <blockquote>HTML 模式适合从外部导入 .html 文件，或者需要更复杂结构的场景。</blockquote>
</article>`,
  },
  {
    id: 'luxury-showcase',
    slug: 'luxury-showcase',
    title: '轻奢金主题示范：复古商务排版',
    format: 'markdown',
    contentTheme: 'luxury',
    excerpt: '衬线 + 复古金 + 大留白，杂志和商务场景。',
    cover: 'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=1200',
    tags: ['轻奢金', '主题', '示例'],
    category: '设计',
    seriesId: undefined,
    authorId: 'default-admin',
    status: 'published',
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
    views: 0,
    likes: 0,
    content: `# 轻奢金主题演示

这是一篇用 **轻奢金（Luxury Gold）** 主题渲染的文章，特点是宋体 + 复古金色边框 + 大量留白。

## 适用范围

- 高端品牌介绍
- 商务报告
- 杂志专栏
- 婚礼 / 活动

## 段落示例

这是一段正文。轻奢金主题用宋体（Songti SC）渲染，文字间距宽松，整体气质优雅。

> "风格是拒绝的产物。" —— Coco Chanel

## 列表

- 工艺 · 手工细节
- 材质 · 优质选材
- 设计 · 永恒经典

## 表格

| 维度 | 标准 | 旗舰 |
| ---- | ---- | ---- |
| 工艺 | 优质 | 顶级 |
| 材质 | 真皮 | 鳄鱼皮 |
| 价格 | ¥3000 | ¥30000 |

---

> 进入画廊 → /explore/content-themes 切其他主题
`,
  },
  {
    id: 'bauhaus-showcase',
    slug: 'bauhaus-showcase',
    title: '包豪斯主题示范：几何 + 原色',
    format: 'markdown',
    contentTheme: 'bauhaus',
    excerpt: '现代主义设计，红黄蓝原色 + 几何块面。',
    cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    tags: ['包豪斯', '主题', '示例'],
    category: '设计',
    seriesId: undefined,
    authorId: 'default-admin',
    status: 'published',
    createdAt: '2025-01-04T00:00:00Z',
    updatedAt: '2025-01-04T00:00:00Z',
    views: 0,
    likes: 0,
    content: `# 包豪斯主题演示

这是一篇用 **包豪斯（Bauhaus）** 主题渲染的文章，特点是几何块面 + 红黄蓝原色 + Futura 字体。

## 包豪斯三原色

红色、黄色、蓝色 —— 减到极致，回归本质。

## 代码

\`\`\`typescript
// Bauhaus design principles
const colors = {
  red: '#d40000',
  yellow: '#ffd500',
  blue: '#0050b5',
};

function compose(form: string, color: keyof typeof colors): Shape {
  return new Shape(form, colors[color]);
}
\`\`\`

## 引用

> "Form follows function." —— Louis Sullivan
> 形式追随功能。

> 进入画廊 → /explore/content-themes 切其他主题
`,
  },
  {
    id: 'cyberpunk-showcase',
    slug: 'cyberpunk-showcase',
    title: '赛博朋克排版示范',
    format: 'markdown',
    contentTheme: 'cyberpunk',
    excerpt: '使用赛博朋克主题渲染的示例文章，看代码块、表、引用如何变霓虹。',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200',
    tags: ['赛博朋克', '主题', '示例'],
    category: '设计',
    seriesId: undefined,
    authorId: 'default-admin',
    status: 'published',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    views: 0,
    likes: 0,
    content: `# 赛博朋克主题演示

这是一篇用 **赛博朋克** 主题渲染的文章，看代码块、引用、表格如何变成霓虹风格。

## 代码示例

\`\`\`typescript
// 霓虹终端风格
interface Hacker {
  alias: string;
  level: number;
  affiliations: string[];
}

const neo: Hacker = {
  alias: 'Neo',
  level: 99,
  affiliations: ['Zion', 'Matrix'],
};
\`\`\`

## 引用

> "欢迎来到真实的荒漠。" —— 《黑客帝国》

## 表格

| 等级 | 代号 | 状态 |
| ---- | ---- | ---- |
| 99   | Neo  | 觉醒 |
| 88   | Morpheus | 引导者 |
| 50   | Trinity | 战士 |

## 列表

- 红色药丸
- 蓝色药丸
- 或者——第三种选择

> 进入画廊 → /explore/content-themes 切其他主题
`,
  },
]