/**
 * 共享 sites.yaml 解析器 —— master 仓和 admin 页面共用
 *
 * 为什么不用 js-yaml：
 *  - js-yaml 是 CommonJS，浏览器用要 polyfill
 *  - 我们的 sites.yaml 结构固定（id / repo / branch / paths / sync flags），
 *    手写宽松解析器够用，避免多带 50KB 依赖
 *
 * 注意：本文件被 Node.js (scripts/flush-queue.mjs) 和 Vite (admin page) 共同使用
 *  - Node.js 看的版本：导出 parseSitesYaml（JS 即可，types 用 JSDoc 注释）
 *  - Vite 看的版本：同一份，Vite 编译时会类型检查
 */

/**
 * @typedef {Object} SiteYamlConfig
 * @property {string} id
 * @property {string} [name]
 * @property {string} repo
 * @property {string} [branch]
 * @property {boolean} [enabled]
 * @property {{articles?: string, site_config?: string}} [paths]
 * @property {boolean} [sync_articles]
 * @property {boolean} [sync_site_config]
 * @property {boolean} [sync_base_code]
 */

/**
 * @param {string} v
 * @param {boolean} [fallback]
 * @returns {boolean}
 */
function asBool(v, fallback = false) {
  if (v == null) return fallback;
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * @param {string} v
 * @returns {string}
 */
function unquote(v) {
  v = String(v ?? '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * 解析 sites.yaml 文本，返回 site 列表
 * @param {string} text
 * @returns {SiteYamlConfig[]}
 */
export function parseSitesYaml(text) {
  /** @type {SiteYamlConfig[]} */
  const sites = [];
  // 修：原正则 ^-\s+ 漏了缩进的 `- id:`,导致切分出 0 个 block
  // 加 \s* 允许前导空白
  const blocks = text.split(/^\s*-\s+/m).slice(1);
  for (const block of blocks) {
    const id = block.match(/^\s*id:\s*['"]?([\w-]+)['"]?/m)?.[1];
    if (!id) continue;
    const name = block.match(/name:\s*['"]?([^'"\n]+)['"]?/m)?.[1]?.trim();
    const repo = block.match(/repo:\s*['"]?([\w-/.]+)['"]?/m)?.[1]?.trim();
    const branch = block.match(/branch:\s*['"]?(\w+)['"]?/m)?.[1]?.trim();
    const enabled = asBool(block.match(/enabled:\s*(true|false|yes|no|1|0)/m)?.[1], true);
    const articlesPath = unquote(block.match(/^\s*articles:\s*['"]?([^\n'"]+?)['"]?\s*$/m)?.[1] ?? '');
    const siteConfigPath = unquote(block.match(/^\s*site_config:\s*['"]?([^\n'"]+?)['"]?\s*$/m)?.[1] ?? '');
    if (!repo) continue;
    sites.push({
      id,
      name: name || id,
      repo,
      branch: branch || 'main',
      enabled,
      paths: {
        articles: articlesPath || undefined,
        site_config: siteConfigPath || undefined,
      },
      sync_articles: asBool(block.match(/sync_articles:\s*(true|false)/m)?.[1], true),
      sync_site_config: asBool(block.match(/sync_site_config:\s*(true|false)/m)?.[1], true),
      sync_base_code: asBool(block.match(/sync_base_code:\s*(true|false)/m)?.[1], false),
    });
  }
  return sites;
}
