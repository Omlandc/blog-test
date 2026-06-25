import pkg from 'jsdom';
import { readFileSync } from 'fs';
const { JSDOM, VirtualConsole } = pkg;

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="UTF-8"><title>Admin Test</title></head>
<body><div id="root"></div></body>
</html>`;

const virtualConsole = new VirtualConsole();
const errors = [];
virtualConsole.on('jsdomError', (err) => errors.push('[jsdomError] ' + err.message.slice(0, 200)));
virtualConsole.on('error', (...args) => errors.push('[error] ' + args.map(a => String(a).slice(0, 200)).join(' ')));

const dom = new JSDOM(html, {
  url: 'http://localhost:4173/admin/articles/new',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
  virtualConsole,
});

dom.window.fetch = fetch;

const js = readFileSync('/workspace/blog-system/dist/assets/index-Bg5_xOFq.js', 'utf-8');
dom.window.eval(js);
await new Promise(resolve => setTimeout(resolve, 5000));

const root = dom.window.document.getElementById('root');
const fullHtml = root?.innerHTML || '';
console.log('Admin articles/new HTML length:', fullHtml.length);
console.log('\\nErrors:', errors.length);
errors.slice(0, 3).forEach(e => console.log('  -', e));
console.log('\\nHas MarkdownEditor? ', fullHtml.includes('工具栏') || fullHtml.includes('双栏'));

// Check for editor features
const editorChecks = [
  ['toolbar', '工具栏'],
  ['textarea', '<textarea'],
  ['placeholder', '开始'],
  ['mode 双栏', '双栏'],
];
for (const [name, needle] of editorChecks) {
  console.log(`  ${fullHtml.includes(needle) ? 'OK' : 'MISS'}  ${name}: "${needle}"`);
}
console.log('\\nFirst 1500 chars:');
console.log(fullHtml.slice(0, 1500));
