import pkg from 'jsdom';
const { JSDOM, VirtualConsole } = pkg;

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (err) => {
  console.log('[jsdomError]', err.message);
});
virtualConsole.on('error', (...args) => console.log('[error]', ...args));

const dom = new JSDOM(
  '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
  {
    url: 'http://localhost:5173/preview/editor',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole,
  }
);

dom.window.fetch = fetch;

try {
  const response = await fetch('http://localhost:5173/src/main.tsx');
  console.log('main.tsx status:', response.status);
  const js = await response.text();
  console.log('main.tsx length:', js.length);
  dom.window.eval(js);
} catch (e) {
  console.log('main.tsx fetch error:', e.message);
}

await new Promise(resolve => setTimeout(resolve, 8000));

const root = dom.window.document.getElementById('root');
const html = root?.innerHTML || '';
console.log('Root HTML length:', html.length);

const checks = [
  ['MarkdownEditor title', 'MarkdownEditor 预览'],
  ['toolbar', 'toolbar'],
  ['textarea', '<textarea'],
  ['placeholder', '开始写作'],
  ['mode 双栏', '双栏'],
  ['插入图片', '插入图片'],
  ['save button', '保存'],
];
console.log('--- Editor presence checks ---');
for (const [name, needle] of checks) {
  console.log(`  ${html.includes(needle) ? 'OK' : 'MISS'}  ${name}: "${needle}"`);
}

if (html.length > 0) {
  console.log('--- HTML excerpt ---');
  console.log(html.slice(0, 1500));
}
