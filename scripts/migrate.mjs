#!/usr/bin/env node
/**
 * migrate.mjs —— CLI 版本的数据迁移工具
 *
 * 用法：
 *   node scripts/migrate.mjs --input old-bundle.json --output migrated.json
 *   node scripts/migrate.mjs --input old-bundle.json --write-project   # 写到 public/data/articles.json
 *   node scripts/migrate.mjs --input old-bundle.json --target=0.7.0    # 迁移到指定版本（默认最新）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const input = args.find((a) => a.startsWith('--input='))?.split('=')[1];
const output = args.find((a) => a.startsWith('--output='))?.split('=')[1];
const writeProject = args.includes('--write-project');
const target = args.find((a) => a.startsWith('--target='))?.split('=')[1] ?? '0.7.0';

if (!input) {
  console.error('用法: node scripts/migrate.mjs --input <old.json> [--output <new.json>] [--write-project] [--target=0.7.0]');
  process.exit(1);
}

if (!existsSync(input)) {
  console.error(`文件不存在: ${input}`);
  process.exit(2);
}

const raw = readFileSync(input, 'utf-8');
const bundle = JSON.parse(raw);

// 复刻 lib/migration 的逻辑（不在 CLI 重复 import TS，直接 inline）
const VERSION_ORDER = ['0.1.0', '0.2.0', '0.3.0', '0.4.0', '0.5.0', '0.6.0', '0.7.0'];
function compareVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

const fromVersion = bundle.version ?? '0.0.0';
console.log(`\n  From: v${fromVersion}`);
console.log(`  To:   v${target}`);

if (compareVersion(fromVersion, target) >= 0) {
  console.log('  已经是最新版本，不需要迁移');
  if (output) writeFileSync(output, JSON.stringify(bundle, null, 2));
  process.exit(0);
}

// 简化版迁移（只做"补默认"和"添加空字段"，不丢数据）
const changes = [];

function ensure(obj, path, def, reason) {
  if (obj[path] === undefined) {
    obj[path] = def;
    changes.push({ path, type: 'fill', reason });
  }
}

// v0.1 → v0.2：补全 Article 基础字段
if (compareVersion(fromVersion, '0.2.0') < 0) {
  for (const a of bundle.articles ?? []) {
    ensure(a, 'authorId', 'u_admin', '新增 authorId 字段');
    ensure(a, 'createdAt', new Date().toISOString(), '新增 createdAt 字段');
    ensure(a, 'updatedAt', a.createdAt ?? new Date().toISOString(), '新增 updatedAt 字段');
    ensure(a, 'tags', [], '新增 tags 字段');
    ensure(a, 'views', 0, '新增 views 字段');
    ensure(a, 'likes', 0, '新增 likes 字段');
  }
}

// v0.2 → v0.3：site-config / series / newsletter / seo
if (compareVersion(fromVersion, '0.3.0') < 0) {
  ensure(bundle, 'siteConfig', {
    name: '博客系统',
    tagline: '一套可复用的细分内容站框架',
    niche: 'tech',
    language: 'zh-CN',
    defaultAuthorId: 'u_admin',
    geoTargets: [{ country: 'CN', weight: 1.0 }],
    allowAI: false,
    allowAIImages: false,
  }, '新增 SiteConfig 字段');
  ensure(bundle, 'series', [], '新增 series 数组');
  ensure(bundle, 'leadMagnets', [], '新增 leadMagnets 数组');
  ensure(bundle, 'tools', [], '新增 tools 数组');
  for (const a of bundle.articles ?? []) {
    ensure(a, 'seo', { noai: true, noimageai: true, sitemapPriority: 0.5 }, '新增 seo 字段');
    ensure(a, 'cta', null, '新增 cta 字段');
    ensure(a, 'difficulty', 'beginner', '新增 difficulty 字段');
  }
}

// v0.3 → v0.4：coverImage
if (compareVersion(fromVersion, '0.4.0') < 0) {
  for (const a of bundle.articles ?? []) {
    ensure(a, 'coverImage', null, '新增 coverImage 字段');
  }
}

// v0.4 → v0.5：links
if (compareVersion(fromVersion, '0.5.0') < 0) {
  ensure(bundle, 'links', [], '新增 links 资源导航');
}

// v0.5 → v0.6 / v0.7：纯版本号
bundle.version = target;
bundle.generatedAt = new Date().toISOString();

// 输出报告
console.log(`\n  Changes: ${changes.length}`);
for (const c of changes) {
  console.log(`    [${c.type}] ${c.path}: ${c.reason}`);
}

// 写入
if (output) {
  writeFileSync(output, JSON.stringify(bundle, null, 2));
  console.log(`\n  ✓ Wrote ${output}`);
}

if (writeProject) {
  const target_path = join(ROOT, 'public', 'data', 'articles.json');
  mkdirSync(dirname(target_path), { recursive: true });
  writeFileSync(target_path, JSON.stringify(bundle, null, 2));
  console.log(`  ✓ Wrote ${target_path}`);
  console.log(`  - ${(bundle.articles ?? []).length} articles`);
  console.log(`  - ${(bundle.series ?? []).length} series`);
  console.log(`  - ${(bundle.leadMagnets ?? []).length} lead magnets`);
  console.log(`  - ${(bundle.links ?? []).length} resource links`);
  console.log(`  - ${(bundle.tools ?? []).length} tools`);
  console.log(`\n  Next: git add public/data/articles.json && git push`);
}
