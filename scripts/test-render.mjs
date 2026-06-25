import pkg from 'jsdom';
import { readFileSync } from 'fs';
const { JSDOM, VirtualConsole } = pkg;

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<title>Article Test</title>
</head>
<body>
<div id="root"></div>
</body>
</html>`;

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => console.log('[jsdomError]', err.message));
virtualConsole.on('error', (...args) => console.log('[error]', ...args));

const dom = new JSDOM(html, {
  url: 'http://localhost:4173/article/welcome-to-the-blog',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
  virtualConsole,
});

dom.window.fetch = fetch;

const js = readFileSync('/workspace/blog-system/dist/assets/index-Bg5_xOFq.js', 'utf-8');
console.log('JS bundle length:', js.length);
dom.window.eval(js);
await new Promise(resolve => setTimeout(resolve, 5000));

const root = dom.window.document.getElementById('root');
const fullHtml = root?.innerHTML || '';
console.log('Total HTML length:', fullHtml.length);

// ArticleViewer checks
const checks = [
  ['article title', '欢迎来到博客'],
  ['hljs class', 'hljs'],
  ['language- tag', 'language-'],
  ['article-image class', 'article-image'],
  ['reading progress', 'reading-progress'],
  ['article-heading', 'article-heading'],
  ['toc', '目录'],
  ['hljs language-ts', 'language-ts'],
  ['hljs keyword', 'hljs-keyword'],
];
console.log('--- ArticleViewer checks ---');
for (const [name, needle] of checks) {
  console.log(`  ${fullHtml.includes(needle) ? 'OK' : 'MISS'}  ${name}: "${needle}"`);
}

console.log('\\n--- HTML excerpt (3000 chars) ---');
console.log(fullHtml.slice(0, 3000));
