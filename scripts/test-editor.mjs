import pkg from 'jsdom';
import { readFileSync } from 'fs';

const { JSDOM, VirtualConsole } = pkg;

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<title>Editor Test</title>
</head>
<body>
<div id="root"></div>
</body>
</html>`;

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => {
  console.log('[jsdomError]', err.message);
});

const dom = new JSDOM(html, {
  url: 'http://localhost:4173/preview/editor',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
  virtualConsole,
});

dom.window.fetch = fetch;

const js = readFileSync('/workspace/blog-system/dist/assets/index-Cm5Wq_pV.js', 'utf-8');
dom.window.eval(js);

await new Promise(resolve => setTimeout(resolve, 6000));

const root = dom.window.document.getElementById('root');
const fullHtml = root?.innerHTML || '';
console.log('URL:', dom.window.location.href);
console.log('Pathname:', dom.window.location.pathname);
console.log('Total HTML length:', fullHtml.length);
console.log('---');

// Look for editor-specific content
const checks = [
  ['MarkdownEditor title', 'MarkdownEditor 预览'],
  ['toolbar role', 'role="toolbar"'],
  ['toolbar aria-label', 'Markdown 工具栏'],
  ['textarea', '<textarea'],
  ['placeholder', '开始写作'],
  ['mode 双栏', '双栏'],
  ['mode 编辑', '编辑'],
  ['mode 预览', '预览'],
  ['插入图片', '插入图片'],
  ['save button', '保存 (⌘S)'],
  ['字数统计', '字'],
  ['shortcut hint', '⌘B'],
  ['app shell header', '博客系统'],
  ['preview route name', 'preview'],
];
for (const [name, needle] of checks) {
  console.log(`  ${fullHtml.includes(needle) ? '✓' : '✗'}  ${name}: "${needle}"`);
}

console.log('\\n--- HTML containing toolbar ---');
const toolbarMatch = fullHtml.match(/role="toolbar"[^>]*>[\s\S]{0,200}/);
console.log(toolbarMatch ? toolbarMatch[0].slice(0, 200) : '(none)');
