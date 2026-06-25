#!/usr/bin/env node
/**
 * export-static.mjs
 *
 * 把 admin 后台导出的 JSON 包写入 public/data/articles.json，
 * 这样 `static` 部署模式可以零后端运行。
 *
 * 用法：
 *   1) 在 admin 后台 /admin/site-config 点击 "Export to Static Bundle"，
 *      会下载一个 articles.json
 *   2) 把它放到项目根目录
 *   3) 运行：node scripts/export-static.mjs --input=articles.json
 *
 * 或者传 stdin：
 *   cat articles.json | node scripts/export-static.mjs --stdin
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'data');
const OUT_FILE = join(OUT_DIR, 'articles.json');

mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const inputFile = args.find((a) => a.startsWith('--input='))?.split('=')[1];
const useStdin = args.includes('--stdin');

let raw;
if (inputFile && existsSync(inputFile)) {
  raw = readFileSync(inputFile, 'utf-8');
  console.log(`✓ Read input file: ${inputFile}`);
} else if (useStdin) {
  raw = await readStdin();
  console.log('✓ Read from stdin');
} else {
  console.error('Usage:');
  console.error('  node scripts/export-static.mjs --input=articles.json');
  console.error('  cat articles.json | node scripts/export-static.mjs --stdin');
  process.exit(1);
}

let bundle;
try {
  bundle = JSON.parse(raw);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(2);
}

// 校验 + 补字段
if (!bundle.version) bundle.version = '0.4.0';
bundle.generatedAt = bundle.generatedAt || new Date().toISOString();
bundle.articles = bundle.articles || [];
bundle.series = bundle.series || [];
bundle.leadMagnets = bundle.leadMagnets || [];
bundle.links = bundle.links || [];
bundle.tools = bundle.tools || [];
if (!bundle.siteConfig) {
  console.warn('No siteConfig in bundle, using default');
  bundle.siteConfig = {};
}

writeFileSync(OUT_FILE, JSON.stringify(bundle, null, 2));
console.log(`✓ Wrote ${OUT_FILE}`);
console.log(`  - ${bundle.articles.length} articles`);
console.log(`  - ${bundle.series.length} series`);
console.log(`  - ${bundle.leadMagnets.length} lead magnets`);
console.log(`  - ${bundle.links.length} resource links`);
console.log(`  - ${bundle.tools.length} tools`);

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
