/**
 * Post-build script: 生成 sitemap.xml 和 robots.txt
 *
 * 因为这些是静态文件，浏览器期待 XML/text 内容类型，
 * 但 SPA 路由返回的是 HTML。预生成静态文件更可靠。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');

const BASE_URL = process.env.SITE_URL || 'https://4sdcs9j3vmzf.space.minimaxi.com';

const SITE_CONFIG = {
  allowAI: false,
};

const PATHS = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/articles', changefreq: 'daily', priority: '0.9' },
  { loc: '/topics', changefreq: 'weekly', priority: '0.9' },
  // 资源导航（每个分类独立着陆页）
  { loc: '/resources', changefreq: 'weekly', priority: '0.9' },
  // 交互专栏
  { loc: '/explore', changefreq: 'weekly', priority: '0.8' },
  { loc: '/explore/theme-system-showcase', changefreq: 'monthly', priority: '0.7' },
  { loc: '/resources/design', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/dev', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/writing', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/marketing', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/analytics', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/productivity', changefreq: 'weekly', priority: '0.7' },
  { loc: '/resources/other', changefreq: 'weekly', priority: '0.5' },
  // Pillar
  { loc: '/topics/tech', changefreq: 'weekly', priority: '0.9' },
  { loc: '/topics/content-site-growth', changefreq: 'weekly', priority: '0.9' },
  { loc: '/topics/design', changefreq: 'weekly', priority: '0.9' },
  // Cluster
  { loc: '/topics/auth-architecture', changefreq: 'weekly', priority: '0.7' },
  { loc: '/topics/storage-design', changefreq: 'weekly', priority: '0.7' },
  { loc: '/topics/seo', changefreq: 'weekly', priority: '0.7' },
  { loc: '/topics/monetization', changefreq: 'weekly', priority: '0.7' },
  // 文章
  { loc: '/article/welcome-to-the-blog', changefreq: 'monthly', priority: '1.0' },
  { loc: '/article/markdown-rendering-guide', changefreq: 'monthly', priority: '0.8' },
  { loc: '/article/theme-system-overview', changefreq: 'monthly', priority: '0.7' },
  { loc: '/article/auth-architecture-pluggable', changefreq: 'monthly', priority: '0.8' },
  { loc: '/article/design-philosophy-medium-style', changefreq: 'monthly', priority: '0.6' },
  { loc: '/article/deploy-and-cdn-practices', changefreq: 'monthly', priority: '0.6' },
  { loc: '/article/morning-routine-productivity', changefreq: 'monthly', priority: '0.5' },
  { loc: '/article/storage-adapter-design', changefreq: 'monthly', priority: '0.6' },
  { loc: '/article/topic-cluster-pillar-guide', changefreq: 'monthly', priority: '0.9' },
  { loc: '/article/newsletter-from-day-one', changefreq: 'monthly', priority: '0.8' },
  { loc: '/article/ai-search-optimization', changefreq: 'monthly', priority: '0.9' },
  { loc: '/article/three-tier-monetization', changefreq: 'monthly', priority: '0.8' },
];

// 生成 sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PATHS.map((p) => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    ${p.changefreq ? `<changefreq>${p.changefreq}</changefreq>` : ''}
    ${p.priority ? `<priority>${p.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

// 生成 robots.txt
const robotsTxt = `# 所有爬虫
User-agent: *
Disallow: /admin
Disallow: /login
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
${SITE_CONFIG.allowAI === false
  ? `
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

User-agent: Applebot-Extended
Disallow: /`
  : `
# AI 爬虫（允许，作为 AI 搜索引用来源）
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /`}
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8');
fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`✓ Generated sitemap.xml with ${PATHS.length} URLs`);
console.log(`✓ Generated robots.txt (allowAI=${SITE_CONFIG.allowAI})`);