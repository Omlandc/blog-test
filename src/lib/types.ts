/**
 * 核心领域类型定义
 *
 * 涵盖：文章、作者、主题、权限，以及为"细分内容站"模式新增的：
 * - SiteConfig（站点身份与定位）
 * - Series（主题簇 / Pillar）
 * - SEO 字段
 * - Newsletter / Subscriber
 * - Analytics
 * - Monetization / Affiliate
 */
import type { ReactNode } from 'react';

/* ============================================================
 * 用户与权限
 * ============================================================ */

export type Role = 'admin' | 'editor' | 'user';

export type Permission =
  | 'article:read'
  | 'article:create'
  | 'article:edit'
  | 'article:delete'
  | 'article:publish'
  | 'admin:access'
  | 'theme:manage'
  | 'user:manage'
  | 'series:manage'
  | 'site:configure'
  | 'analytics:view'
  | 'subscribers:manage'
  | 'monetization:manage';

export interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  role: Role;
  /** 自我介绍长文（可选，渲染在 /author/:id） */
  bioLong?: string;
  /** 社交链接 */
  social?: {
    twitter?: string;
    youtube?: string;
    instagram?: string;
    github?: string;
    website?: string;
  };
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: Role;
  email: string;
  bio: string;
  permissions: Permission[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  name: string;
}

/* ============================================================
 * 文章与内容建模
 * ============================================================ */

export type ArticleStatus = 'draft' | 'published';
export type ArticleFormat = 'markdown' | 'html';

/** 标签 */
export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

/** 分类（轻量；具体主题簇请用 Series） */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

/** 难度（用于食谱/教程类细分站） */
export type ArticleDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** CTA / 变现钩子 */
export interface ArticleCTA {
  /** 类型 */
  type: 'affiliate' | 'leadmagnet' | 'product' | 'newsletter' | 'external';
  label: string;
  url?: string;
  description?: string;
  /** 是否在文末强制展示 */
  prominent?: boolean;
}

/** SEO 字段（搜索引擎 + AI 搜索发现） */
export interface ArticleSEO {
  /** 自定义 SEO 标题（留空用 title） */
  title?: string;
  /** 自定义 SEO 描述（留空用 excerpt） */
  description?: string;
  /** 焦点关键词（长尾词） */
  focusKeyword?: string;
  /** 关联长尾关键词 */
  keywords?: string[];
  /** Canonical URL */
  canonicalUrl?: string;
  /** OG Image（留空用 cover） */
  ogImage?: string;
  /** 拒绝 AI 文本爬虫（GPTBot / ClaudeBot / PerplexityBot 等） */
  noai?: boolean;
  /** 拒绝 AI 图片爬虫 */
  noimageai?: boolean;
  /** Sitemap 优先级 */
  sitemapPriority?: number;
}

/** 文章 */
export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  /** 内容格式：'markdown'（默认）| 'html' */
  format?: ArticleFormat;
  /** 文章正文的排版主题（默认 'default'） */
  contentTheme?: string;
  excerpt: string;
  cover?: string;
  tags: string[];
  category?: string;
  /** 所属主题簇（pillar，多对一） */
  seriesId?: string;
  /** 文章难度 */
  difficulty?: ArticleDifficulty;
  /** 准备时长（分钟） */
  prepTime?: number;
  /** 制作时长（分钟） */
  cookTime?: number;
  /** 文章产出数（如"出 4 人份"） */
  yield?: string;
  authorId: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  /** 点赞数 */
  likes?: number;
  /** SEO 字段 */
  seo?: ArticleSEO;
  /** CTA（变现钩子） */
  cta?: ArticleCTA;
}

/** 文章查询参数 */
export interface ArticleQuery {
  status?: ArticleStatus;
  authorId?: string;
  tag?: string;
  category?: string;
  seriesId?: string;
  difficulty?: ArticleDifficulty;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'views' | 'likes' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ============================================================
 * 主题簇 (Series / Pillar)
 *
 * 借鉴细分内容站的核心架构：
 *   Pillar（顶级主题）→ Cluster（子分类）→ Article（具体内容）
 * 形成"支柱页 → 分类页 → 文章"的三级金字塔，权重层层传递。
 * ============================================================ */

export interface Series {
  id: string;
  /** URL slug */
  slug: string;
  /** 主题名称（如"川菜入门"、"React 进阶"） */
  name: string;
  /** 副标题 */
  tagline?: string;
  /** 长描述（用于 pillar page SEO） */
  description: string;
  /** 封面图 */
  cover?: string;
  /** 父 Series（实现多级嵌套；不填则是顶级 Pillar） */
  parentId?: string;
  /** 排序权重（数字越大越靠前） */
  order: number;
  /** 关联长尾关键词 */
  keywords?: string[];
  /** 是否作为支柱页（Sitemap priority 提升） */
  isPillar?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
 * 站点身份与定位 (SiteConfig)
 *
 * 让这个系统可以被复用到任何细分主题站。
 * ============================================================ */

export type SiteNiche =
  | 'recipe'
  | 'tech'
  | 'travel'
  | 'parenting'
  | 'finance'
  | 'education'
  | 'design'
  | 'lifestyle'
  | 'other';

export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES';

export interface SiteGeoTarget {
  country: string;
  weight: number;
}

export interface SiteConfig {
  /** 站点名称 */
  name: string;
  /** 站点标语 */
  tagline: string;
  /** 站点描述（SEO meta description） */
  description: string;
  /** 细分赛道 */
  niche: SiteNiche;
  /** 主要服务语言 */
  language: SupportedLanguage;
  /** Logo 文字 / Emoji */
  logoMark?: string;
  /** Favicon URL */
  favicon?: string;
  /** 默认作者（用于作者署名） */
  defaultAuthorId: string;
  /** 目标国家（按权重排序，影响内容侧重点与变现策略） */
  geoTargets: SiteGeoTarget[];
  /** 联系邮箱 */
  contactEmail?: string;
  /** 社交链接 */
  social?: Author['social'];
  /** Hero 区域标题（可定制） */
  heroTitle?: string;
  /** Hero 区域副标题 */
  heroSubtitle?: string;
  /** 关于页内容 */
  aboutContent?: string;
  /** 是否允许 AI 爬虫抓取全文 */
  allowAI?: boolean;
  /** 是否允许 AI 爬虫抓取图片 */
  allowAIImages?: boolean;
  /** 自定义域名 */
  customDomain?: string;
  /** ICP 备案号（中文站点） */
  icp?: string;
  /** 当前 Look 套装（lib/look-packs/） */
  look?: string;
  /** 全站默认的文章正文主题 slug（当 article.contentTheme 未指定时使用） */
  defaultContentTheme?: string;
}

/* ============================================================
 * 邮件订阅 (Newsletter) / 私域
 *
 * "谷歌流量是租来的，邮件列表才是自己的。"
 * ============================================================ */

export type SubscriberSource =
  | 'homepage'
  | 'article'
  | 'exit-intent'
  | 'leadmagnet'
  | 'admin'
  | 'import';

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  /** 来源 */
  source: SubscriberSource;
  /** 来源文章 ID（从文章页订阅时） */
  sourceArticleId?: string;
  /** 标签（用于分组发送） */
  tags: string[];
  /** 已订阅的 Lead Magnet */
  leadMagnets?: string[];
  /** 状态 */
  status: 'active' | 'unsubscribed' | 'bounced';
  /** UTM 来源（如 google / twitter / direct） */
  utmSource?: string;
  /** UTM 媒介 */
  utmMedium?: string;
  /** UTM 活动 */
  utmCampaign?: string;
  createdAt: string;
  unsubscribedAt?: string;
}

/** Lead Magnet 引导磁铁 */
export interface LeadMagnet {
  id: string;
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 描述 */
  description: string;
  /** 封面图 */
  cover?: string;
  /** 钩子类型 */
  hook: 'ebook' | 'checklist' | 'template' | 'video' | 'pdf' | 'audio';
  /** 文件 URL（PDF 等）或着陆页 URL */
  fileUrl?: string;
  /** 关联长尾关键词 */
  keywords?: string[];
  /** 转化目标文案 */
  cta: string;
  /** 是否启用 */
  enabled: boolean;
  createdAt: string;
}

/* ============================================================
 * 流量分析 (Analytics)
 *
 * 给单人站长看的轻量级数据看板。
 * ============================================================ */

export type TrafficSource =
  | 'organic'
  | 'direct'
  | 'social'
  | 'referral'
  | 'email'
  | 'paid'
  | 'ai';

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

/** 单次访问事件 */
export interface AnalyticsEvent {
  id: string;
  /** 页面路径 */
  path: string;
  /** 文章 ID（如果是文章页） */
  articleId?: string;
  /** 流量来源 */
  source: TrafficSource;
  /** 搜索引擎（organic 时填写：google / bing / duckduckgo / ...） */
  searchEngine?: string;
  /** 社交平台（social 时填写：twitter / youtube / ...） */
  socialPlatform?: string;
  /** 国家（粗粒度，从 timezone 推断） */
  country?: string;
  /** 设备类型 */
  device: DeviceType;
  /** 停留时长（秒） */
  durationSec?: number;
  /** 是否触发了邮件订阅 */
  subscribed?: boolean;
  /** 引用页面 */
  referrer?: string;
  /** 时间戳 */
  timestamp: string;
}

/** 聚合统计 */
export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  avgDurationSec: number;
  mobileRate: number;
  sourceBreakdown: Array<{ source: TrafficSource; count: number; rate: number }>;
  topArticles: Array<{ articleId: string; title: string; views: number }>;
  topCountries: Array<{ country: string; count: number }>;
  /** 趋势（最近 30 天） */
  trend: Array<{ date: string; views: number }>;
  /** 订阅转化 */
  subscribers: {
    total: number;
    newThisMonth: number;
    conversionRate: number;
  };
}

/* ============================================================
 * 变现 (Monetization)
 *
 * "广告打底，私域兜底，产品封顶" 的三段式变现。
 * ============================================================ */

export type AdPlacement =
  | 'header'
  | 'sidebar'
  | 'in-article-top'
  | 'in-article-mid'
  | 'in-article-bottom'
  | 'footer';

export interface AdSlot {
  id: string;
  placement: AdPlacement;
  /** 广告网络：google-adsense / mediavine / ezoic / custom */
  network: 'adsense' | 'mediavine' | 'ezoic' | 'custom';
  /** 广告位 ID */
  slotId: string;
  /** 自定义 HTML（network=custom 时使用） */
  customHtml?: string;
  /** 是否启用 */
  enabled: boolean;
}

/** 联盟链接 / CTA 跟踪 */
export interface AffiliateLink {
  id: string;
  /** 链接 URL */
  url: string;
  /** 显示文案 */
  label: string;
  /** 描述 */
  description?: string;
  /** 关联文章 ID */
  articleId?: string;
  /** 关联 Series ID */
  seriesId?: string;
  /** 平台：amazon / 京东 / 淘宝 / 自营 */
  platform?: string;
  /** 点击数（手填或脚本追踪） */
  clicks?: number;
  createdAt: string;
}

/** 收入记录 */
export interface RevenueRecord {
  id: string;
  /** 来源：ads / affiliate / product / sponsored */
  source: 'ads' | 'affiliate' | 'product' | 'sponsored';
  /** 金额（分单位） */
  amountCents: number;
  currency: string;
  /** 关联文章 / 广告位 / 联盟链接 */
  refType: 'article' | 'adslot' | 'affiliate' | 'site';
  refId?: string;
  date: string;
  note?: string;
}

/* ============================================================
 * 主题
 * ============================================================ */

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'cyberpunk';

export interface ThemeVariables {
  '--color-bg': string;
  '--color-bg-elevated': string;
  '--color-bg-subtle': string;
  '--color-fg': string;
  '--color-fg-muted': string;
  '--color-fg-subtle': string;
  '--color-primary': string;
  '--color-primary-fg': string;
  '--color-secondary': string;
  '--color-secondary-fg': string;
  '--color-accent': string;
  '--color-accent-fg': string;
  '--color-border': string;
  '--color-muted': string;
  '--color-success': string;
  '--color-warning': string;
  '--color-danger': string;
  '--color-code-bg': string;
  '--color-code-fg': string;
  '--color-ring': string;
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;
}

export interface Theme {
  id: ThemeMode;
  name: string;
  description: string;
  variables: ThemeVariables;
  preview: {
    bg: string;
    fg: string;
    primary: string;
    accent: string;
  };
}

/* ============================================================
 * 图片上传
 * ============================================================ */

export interface UploadedImage {
  url: string;
  width?: number;
  height?: number;
  filename?: string;
  size?: number;
  mime?: string;
  /** 来源类型（本地压缩 / 远程 URL / HTTP） */
  source?: 'local' | 'compressed' | 'remote' | 'http';
}

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  /** 接受的文件 MIME 数组（alias of allowedTypes） */
  accept?: string[];
}

/* ============================================================
 * 工具类型
 * ============================================================ */

export type ID = string;
export type ChangeCallback<T> = (items: T[]) => void;
export type AsyncResult<T> = Promise<T>;

// re-export ReactNode for downstream
export type { ReactNode };

/* ============================================================
 * 部署模式 & 工具集成
 *
 * 让同一个系统既能作为“内容生产+宣传”独立运营，
 * 也能作为“纯内容展示站”部署到 GitHub Pages，
 * 还能与各种工具系统搭配（顶部导航 / 首页快键）。
 * ============================================================ */

/** 部署模式 */
export type DeploymentMode = 'embedded' | 'static';

/** 工具入口 */
export type ToolPosition = 'topnav' | 'home' | 'both';

export interface ToolEntry {
  id: string;
  name: string;
  /** emoji 或 lucide icon 名 */
  icon: string;
  description?: string;
  /** 跳转地址（可以是外链、站内页、哈希路由） */
  url: string;
  /** 出现在哪里 */
  position: ToolPosition;
  /** 打开方式：同窗口 / 新窗口 */
  target?: '_self' | '_blank';
  /** 排序权重（同位置内按升序） */
  order: number;
  /** 是否为外部工具（同窗口打开其他域） */
  external?: boolean;
  /** 可选徽章文本：'New' / 'Beta' / '推荐' */
  badge?: string;
}

/** 静态资源包（构建时打包） */
export interface StaticBundle {
  version: string;
  generatedAt: string;
  articles: Article[];
  series: Series[];
  leadMagnets: LeadMagnet[];
  links?: Array<Record<string, unknown>>;
  siteConfig: SiteConfig;
  tools: ToolEntry[];
}

// Note: LinkEntry 详细类型在 lib/links/types.ts
