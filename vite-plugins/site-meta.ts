/**
 * Vite plugin: site-meta
 *
 * 构建时把 index.html 里的 <%= SITE_NAME %> / <%= SITE_DESC %> 替换为
 * site-config 的默认值。这样子仓可以有自己的站点名 / 描述。
 *
 * 模板占位符：
 *   <%= SITE_NAME %>
 *   <%= SITE_DESC %>
 *
 * 从 src/lib/site-config/index.tsx 读 DEFAULT_SITE_CONFIG（构建时 import）。
 */
import type { Plugin } from 'vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function siteMetaPlugin(): Plugin {
  return {
    name: 'blog-system:site-meta',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string): string {
        const configPath = resolve(process.cwd(), 'src/lib/site-config/index.tsx');
        if (!existsSync(configPath)) return html;
        let cfg: { name?: string; description?: string } = {};
        try {
          const text = readFileSync(configPath, 'utf8');
          // 用正则粗略提取 DEFAULT_SITE_CONFIG 的 name 和 description
          const nameMatch = text.match(/DEFAULT_SITE_CONFIG[\s\S]*?name:\s*['"`]([^'"`]+)['"`]/);
          const descMatch = text.match(/description:\s*['"`]([^'"`]+)['"`]/);
          if (nameMatch) cfg.name = nameMatch[1];
          if (descMatch) cfg.description = descMatch[1];
        } catch {
          return html;
        }
        const name = cfg.name ?? '博客系统';
        const desc = cfg.description ?? '一个生产级的博客与文章创作系统';
        return html.replace(/<%=\s*SITE_NAME\s*%>/g, name).replace(/<%=\s*SITE_DESC\s*%>/g, desc);
      },
    },
  };
}