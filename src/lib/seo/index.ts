/**
 * SEO 工具 —— 动态管理页面 <head>
 *
 * 借鉴细分内容站方法论：
 * - 每个页面有独立 title / description / canonical
 * - 关键词与长尾词明确
 * - AI 爬虫指令（noai / noimageai）可控
 * - Open Graph 社交分享优化
 * - JSON-LD 结构化数据
 */

export interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noai?: boolean;
  noimageai?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const META_IDS = [
  'meta-description',
  'meta-keywords',
  'meta-robots',
  'meta-og-title',
  'meta-og-description',
  'meta-og-type',
  'meta-og-image',
  'meta-og-url',
  'meta-og-site-name',
  'meta-twitter-card',
  'meta-twitter-title',
  'meta-twitter-description',
  'meta-twitter-image',
  'meta-article-author',
  'meta-article-published-time',
  'meta-article-modified-time',
  'link-canonical',
];

function upsertMeta(attrs: Record<string, string>, id?: string): void {
  const selector = id ? `meta#${id}` : `meta[name="${attrs.name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    if (id) el.id = id;
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function upsertLink(rel: string, href: string, id: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link#${id}`);
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    document.head.appendChild(el);
  }
  el.rel = rel;
  el.href = href;
}

function removeJsonLd(): void {
  document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
}

export function setMeta(config: MetaConfig): void {
  // Title
  if (config.title) document.title = config.title;

  // Description
  if (config.description !== undefined) {
    upsertMeta(
      { name: 'description', content: config.description },
      'meta-description',
    );
  }

  // Keywords
  if (config.keywords && config.keywords.length > 0) {
    upsertMeta(
      { name: 'keywords', content: config.keywords.join(', ') },
      'meta-keywords',
    );
  }

  // Robots（含 AI 指令）
  const robotsParts: string[] = ['index', 'follow'];
  if (config.noai) robotsParts.push('noai', 'noimageai');
  if (config.noimageai && !config.noai) robotsParts.push('noimageai');
  upsertMeta({ name: 'robots', content: robotsParts.join(', ') }, 'meta-robots');

  // Canonical
  if (config.canonicalUrl) {
    upsertLink('canonical', config.canonicalUrl, 'link-canonical');
  }

  // Open Graph
  const ogType = config.ogType ?? 'website';
  upsertMeta({ property: 'og:type', content: ogType }, 'meta-og-type');
  upsertMeta({ property: 'og:site_name', content: document.title }, 'meta-og-site-name');
  if (config.title) upsertMeta({ property: 'og:title', content: config.title }, 'meta-og-title');
  if (config.description)
    upsertMeta({ property: 'og:description', content: config.description }, 'meta-og-description');
  if (config.canonicalUrl) upsertMeta({ property: 'og:url', content: config.canonicalUrl }, 'meta-og-url');
  if (config.ogImage) upsertMeta({ property: 'og:image', content: config.ogImage }, 'meta-og-image');

  // Twitter Card
  upsertMeta({ name: 'twitter:card', content: 'summary_large_image' }, 'meta-twitter-card');
  if (config.title)
    upsertMeta({ name: 'twitter:title', content: config.title }, 'meta-twitter-title');
  if (config.description)
    upsertMeta({ name: 'twitter:description', content: config.description }, 'meta-twitter-description');
  if (config.ogImage)
    upsertMeta({ name: 'twitter:image', content: config.ogImage }, 'meta-twitter-image');

  // Article meta
  if (config.author)
    upsertMeta({ property: 'article:author', content: config.author }, 'meta-article-author');
  if (config.publishedTime)
    upsertMeta({ property: 'article:published_time', content: config.publishedTime }, 'meta-article-published-time');
  if (config.modifiedTime)
    upsertMeta({ property: 'article:modified_time', content: config.modifiedTime }, 'meta-article-modified-time');
}

export function setJsonLd(data: object): void {
  removeJsonLd();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seoJsonld = 'true';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export function clearMeta(): void {
  META_IDS.forEach((id) => {
    document.getElementById(id)?.remove();
  });
  removeJsonLd();
}

/** 生成 sitemap.xml */
export function generateSitemap(
  baseUrl: string,
  paths: Array<{ loc: string; lastmod?: string; priority?: number; changefreq?: string }>,
): string {
  const urls = paths
    .map((p) => {
      return `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    ${p.changefreq ? `<changefreq>${p.changefreq}</changefreq>` : ''}
    ${p.priority !== undefined ? `<priority>${p.priority.toFixed(1)}</priority>` : ''}
  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/** 生成 robots.txt（含 AI 爬虫指令） */
export function generateRobotsTxt(
  baseUrl: string,
  options: { allowAI?: boolean; disallowPaths?: string[] } = {},
): string {
  const disallowPaths = options.disallowPaths ?? ['/admin', '/login'];
  const disallowBlocks = disallowPaths.map((p) => `Disallow: ${p}`).join('\n');

  const generalBots = `# 所有爬虫
User-agent: *
${disallowBlocks}
Allow: /
Sitemap: ${baseUrl}/sitemap.xml`;

  let aiBots: string;
  if (options.allowAI === false) {
    // 禁止 AI 爬虫
    aiBots = `
# AI 爬虫（被内容站屏蔽以保护原创）
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Applebot-Extended
Disallow: /`;
  } else {
    aiBots = `
# AI 爬虫（允许，作为 AI 搜索的引用来源）
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /`;
  }

  return `${generalBots}${aiBots}
`;
}