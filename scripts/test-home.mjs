import pkg from 'jsdom';
import { readFileSync } from 'fs';
const { JSDOM, VirtualConsole } = pkg;

const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="UTF-8"><title>Test</title></head>
<body><div id="root"></div></body>
</html>`;

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => console.log('[jsdomError]', err.message.slice(0, 200)));
const errors = [];
virtualConsole.on('error', (...args) => errors.push(args.map(a => String(a).slice(0, 200)).join(' ')));

const dom = new JSDOM(html, {
  url: 'http://localhost:4173/',
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
console.log('Home page HTML length:', fullHtml.length);
console.log('First 800 chars:', fullHtml.slice(0, 800));
console.log('\\nErrors count:', errors.length);
errors.slice(0, 3).forEach(e => console.log('  -', e));
