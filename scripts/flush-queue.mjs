#!/usr/bin/env node
/**
 * flush-queue.mjs —— 把主仓 data/pending-pushes.json 里的内容变更推送到对应子仓
 *
 * 用法：
 *   node scripts/flush-queue.mjs                 # 推所有 pending
 *   node scripts/flush-queue.mjs --site blog-test # 只推某个站点
 *   node scripts/flush-queue.mjs --dry-run        # 模拟，不真推
 *
 * 凭据：
 *   GITHUB_TOKEN env 或 GH_TOKEN env
 *
 * 工作流：
 *   1. 读 sites.yaml 解析子仓列表
 *   2. 读 data/pending-pushes.json 拿 pending 项
 *   3. 每个 pending 项：
 *      - 按 site 找子仓
 *      - 用 GitHub Contents API 写文件
 *      - 写成功 → status=done, movedAt=now
 *      - 写失败 → attempts+=1, 超过 3 次移到 failed
 *   4. 移动 done → data/history/{YYYY-MM-DD}.json
 *   5. 写回 data/pending-pushes.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO = 'Omlandc/blog-system';

if (!TOKEN) {
  console.error('❌ Missing GITHUB_TOKEN / GH_TOKEN env var');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  CLI args                                                            */
/* ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const siteFilter = (() => {
  const i = args.indexOf('--site');
  return i !== -1 ? args[i + 1] : null;
})();

/* ------------------------------------------------------------------ */
/*  Load sites.yaml + queue                                             */
/* ------------------------------------------------------------------ */
function parseYamlSimple(text) {
  // 极简 YAML 解析（只支持 sites.yaml 的扁平结构）
  const lines = text.split('\n');
  const sites = [];
  let current = null;
  let inDefaults = false;
  let defaultsObj = {};
  for (const line of lines) {
    if (line.startsWith('sites:')) continue;
    if (line.startsWith('defaults:')) {
      inDefaults = true;
      continue;
    }
    if (!inDefaults && line.match(/^\s*-\s+id:/)) {
      if (current) sites.push(current);
      current = { id: line.match(/id:\s*['"]?([^'"\s]+)/)?.[1] };
    } else if (!inDefaults && current && line.match(/^\s{4}\w/)) {
      const m = line.match(/^\s{4}(\w+):\s*(['"]?)([^'"#]+)\2/);
      if (m) current[m[1]] = m[3].trim();
    } else if (inDefaults && line.match(/^\s{2}\w/)) {
      const m = line.match(/^\s{2}(\w+):\s*(['"]?)([^'"#]+)\2/);
      if (m) defaultsObj[m[1]] = m[3].trim();
    }
  }
  if (current) sites.push(current);
  return { sites, defaults: defaultsObj };
}

const sitesYaml = readFileSync(resolve(ROOT, 'sites.yaml'), 'utf8');
const { sites } = parseYamlSimple(sitesYaml);
const queueFile = resolve(ROOT, 'data/pending-pushes.json');
const queueData = JSON.parse(readFileSync(queueFile, 'utf8'));

console.log(`📋 Found ${sites.length} sites, ${queueData.queue.length} pending pushes${dryRun ? ' (DRY RUN)' : ''}`);

/* ------------------------------------------------------------------ */
/*  GitHub API helpers                                                  */
/* ------------------------------------------------------------------ */
async function ghFetch(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

async function getFileSha(owner, repo, path, branch) {
  try {
    const data = await ghFetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    );
    return data.sha;
  } catch (err) {
    if (String(err.message).includes('404')) return null;
    throw err;
  }
}

async function writeFile(owner, repo, path, content, message, branch, sha) {
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;
  return ghFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ */
/*  Process queue                                                       */
/* ------------------------------------------------------------------ */

/**
 * 在 DEFAULT_SITE_CONFIG 源文件里 patch 指定字段
 * 不重写整个文件，保留 React Context 逻辑、tools、hook 等等
 *
 * 支持的类型：string, number, boolean, array (替换整个数组), object (替换整个对象)
 * 例：patchDefaultSiteConfig(src, { name: '新名', niche: 'tech' })
 */
function patchDefaultSiteConfig(source, patch) {
  let content = source;
  let changed = 0;
  const appliedFields = [];
  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    // 转义 value 为源码表示
    let valueStr;
    if (typeof value === 'string') {
      valueStr = `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      valueStr = String(value);
    } else {
      // array / object - 用 JSON（要求中不能有 function / undefined）
      valueStr = JSON.stringify(value);
    }

    let newContent;
    if (typeof value === 'object' && value !== null) {
      // 数组或对象：定位到 field 后的第一个 [ 或 {，然后找到匹配的 ] 或 }（多行）
      const startRegex = new RegExp(`(\\b${field}\\s*:\\s*)(\\[|\\{)`, 'm');
      const startMatch = content.match(startRegex);
      if (!startMatch) continue;
      // openChar 在 startMatch.index + startMatch[1].length
      const openCharPos = startMatch.index + startMatch[1].length;
      const openChar = startMatch[2];
      const closeChar = openChar === '[' ? ']' : '}';
      // 从 openCharPos + 1 开始扫描，找匹配的 closeChar
      let depth = 1;
      let pos = openCharPos + 1;
      let inString = null;
      let escaped = false;
      while (pos < content.length && depth > 0) {
        const ch = content[pos];
        if (escaped) { escaped = false; pos++; continue; }
        if (ch === '\\') { escaped = true; pos++; continue; }
        if (inString) {
          if (ch === inString) inString = null;
        } else {
          if (ch === '"' || ch === "'" || ch === '`') inString = ch;
          else if (ch === openChar) depth++;
          else if (ch === closeChar) depth--;
        }
        pos++;
      }
      if (depth !== 0) continue; // 没找到匹配的 close
      // openCharPos .. pos 是要替换的范围（含 openChar 和 closeChar）
      const before = content.slice(0, openCharPos);
      const after = content.slice(pos);
      // 检查 pos 后面是否有逗号，紧接换行
      const tailMatch = after.match(/^(\s*,\s*)/);
      const tail = tailMatch ? tailMatch[0] : '';
      newContent = before + valueStr + tail + after.slice(tail.length);
    } else {
      // 标量：field: 后面到逗号/换行
      const fieldRegex = new RegExp(
        `(\\b${field}\\s*:\\s*)([\\s\\S]*?)(,?\\s*\\n)`,
        'm'
      );
      const match = content.match(fieldRegex);
      if (!match) continue;
      newContent = content.replace(
        fieldRegex,
        `${match[1]}${valueStr}${match[3]}`,
      );
    }

    if (newContent !== content) {
      content = newContent;
      changed++;
      appliedFields.push(field);
    }
  }
  return { content, changed, appliedFields };
}

const MAX_ATTEMPTS = 3;
const results = { success: 0, failed: 0, skipped: 0 };

const updatedQueue = [];
for (const item of queueData.queue) {
  if (item.status === 'done') {
    queueData.history.push({ ...item, movedAt: new Date().toISOString() });
    continue;
  }

  // site filter
  if (siteFilter && item.site !== siteFilter) {
    updatedQueue.push(item);
    results.skipped++;
    continue;
  }

  const site = sites.find((s) => s.id === item.site);
  if (!site || site.enabled !== 'true') {
    console.log(`⚠️  Site ${item.site} not found or disabled, skipping ${item.id}`);
    updatedQueue.push({ ...item, lastError: 'site not found or disabled' });
    continue;
  }

  console.log(`\n🚀 Pushing ${item.id} → ${site.repo} (${item.actions.length} actions)`);

  if (dryRun) {
    console.log(`   [DRY RUN] would push:`, item.actions.map((a) => a.type).join(', '));
    updatedQueue.push(item);
    results.skipped++;
    continue;
  }

  try {
    // 按 actions 逐个应用
    for (const action of item.actions) {
      const [owner, repo] = site.repo.split('/');

      if (action.type === 'article-upsert') {
        // 把单篇文章写到子仓的 articles.json
        const articlesPath = site.paths?.articles || 'public/data/articles.json';
        const currentSha = await getFileSha(owner, repo, articlesPath, site.branch);
        let articles = [];
        if (currentSha) {
          const file = await ghFetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${articlesPath}?ref=${site.branch}`,
          );
          articles = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        }
        // upsert
        const idx = articles.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) articles[idx] = action.payload;
        else articles.push(action.payload);

        const newContent = JSON.stringify(articles, null, 2);
        await writeFile(
          owner, repo, articlesPath, newContent,
          `[blog-test] ${action.payload.title || action.payload.id} (via blog-system)`,
          site.branch, currentSha,
        );
        console.log(`   ✅ ${action.type} ${action.payload.id}`);
      } else if (action.type === 'article-delete') {
        const articlesPath = site.paths?.articles || 'public/data/articles.json';
        const currentSha = await getFileSha(owner, repo, articlesPath, site.branch);
        if (!currentSha) continue;
        const file = await ghFetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${articlesPath}?ref=${site.branch}`,
        );
        let articles = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
        articles = articles.filter((a) => a.id !== action.payload.id);
        await writeFile(
          owner, repo, articlesPath, JSON.stringify(articles, null, 2),
          `[blog-test] delete article ${action.payload.id} (via blog-system)`,
          site.branch, currentSha,
        );
        console.log(`   ✅ ${action.type} ${action.payload.id}`);
      } else if (action.type === 'site-config-update') {
        // 推送 site-config 到子仓
        // payload 结构：{patch: {name?, tagline?, description?, ...}}
        // 只在 DEFAULT_SITE_CONFIG 里改 payload.patch 里指定的字段，不重写整个文件
        const configPath = site.paths?.site_config || 'src/lib/site-config/index.tsx';
        const currentSha = await getFileSha(owner, repo, configPath, site.branch);
        if (!currentSha) {
          console.log(`   ⚠️ ${configPath} 不存在，跳过 site-config-update`);
          continue;
        }
        const file = await ghFetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${configPath}?ref=${site.branch}`,
        );
        let content = Buffer.from(file.content, 'base64').toString('utf8');

        const patch = action.payload?.patch || {};
        const patched = patchDefaultSiteConfig(content, patch);
        if (patched.changed === 0) {
          console.log(`   ℹ️ site-config 无变更，跳过`);
          continue;
        }
        await writeFile(
          owner, repo, configPath, patched.content,
          `[blog-system] update site-config: ${Object.keys(patch).join(', ')} (via blog-system)`,
          site.branch, currentSha,
        );
        console.log(`   ✅ site-config-update (${patched.changed} fields: ${Object.keys(patch).join(', ')})`);
      }
    }

    queueData.history.push({
      ...item,
      status: 'done',
      movedAt: new Date().toISOString(),
    });
    results.success++;
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
    const attempts = (item.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      queueData.history.push({
        ...item,
        status: 'failed',
        attempts,
        lastError: err.message,
        movedAt: new Date().toISOString(),
      });
      results.failed++;
    } else {
      updatedQueue.push({
        ...item,
        attempts,
        lastError: err.message,
        lastAttemptAt: new Date().toISOString(),
      });
      results.failed++;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Persist                                                             */
/* ------------------------------------------------------------------ */
queueData.queue = updatedQueue;

// Move done history to dated files
if (!existsSync(resolve(ROOT, 'data/history'))) {
  mkdirSync(resolve(ROOT, 'data/history'), { recursive: true });
}
const today = new Date().toISOString().slice(0, 10);
const historyFile = resolve(ROOT, `data/history/${today}.json`);
let existingHistory = [];
if (existsSync(historyFile)) {
  existingHistory = JSON.parse(readFileSync(historyFile, 'utf8'));
}
const newHistory = queueData.history.filter((h) => h.movedAt && h.movedAt.startsWith(today));
existingHistory.push(...newHistory);
writeFileSync(historyFile, JSON.stringify(existingHistory, null, 2));
queueData.history = queueData.history.filter((h) => !h.movedAt || !h.movedAt.startsWith(today));

writeFileSync(queueFile, JSON.stringify(queueData, null, 2));

console.log(`\n📊 Results: ✅ ${results.success} success, ❌ ${results.failed} failed, ⏭ ${results.skipped} skipped`);
console.log(`📁 History saved to data/history/${today}.json`);