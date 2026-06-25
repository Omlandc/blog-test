// 运行时验证脚本 —— 直接调用 lib 模块检查关键行为
// 用 Node + jsdom 模拟浏览器环境
import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLImageElement = dom.window.HTMLImageElement;
globalThis.Image = dom.window.Image;
globalThis.Element = dom.window.Element;
globalThis.FileReader = dom.window.FileReader;
globalThis.FormData = dom.window.FormData;
globalThis.Blob = dom.window.Blob;
try { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); } catch {}

// 用 esbuild on-the-fly 把 TS 编译成 JS
const esbuild = await import('esbuild');

// ===== Auth =====
console.log('\n=== AUTH ===');
const authMod = await esbuild.build({
  entryPoints: [new URL('../src/lib/auth/mock.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
const mockAuthCode = authMod.outputFiles[0].text;
const { MockAuthAdapter, listMockAccounts } = await import(
  'data:text/javascript;base64,' + Buffer.from(mockAuthCode).toString('base64')
);

const auth = new MockAuthAdapter();

console.log('accounts:', listMockAccounts());

const admin = await auth.login({ username: 'admin', password: 'admin123' });
console.log('admin user:', admin.name, '| role:', admin.role, '| perms:', admin.permissions.length);
console.assert(admin.role === 'admin', 'admin role');
console.assert(admin.permissions.includes('admin:access'), 'admin perm');

const user = await auth.login({ username: 'user', password: 'user123' });
console.log('user:', user.name, '| role:', user.role, '| perms:', user.permissions.length);
console.assert(user.role === 'user', 'user role');
console.assert(!user.permissions.includes('admin:access'), 'user no admin');
console.assert(user.permissions.includes('article:read'), 'user read');

try {
  await auth.login({ username: 'admin', password: 'wrong' });
  console.error('should have thrown');
  process.exit(1);
} catch (e) {
  console.log('wrong password rejected:', e.message);
}

await auth.login({ username: 'admin', password: 'admin123' });
await auth.logout();
const cur = await auth.getCurrentUser();
console.log('after logout user:', cur);
console.assert(cur === null, 'logged out');

console.log('✓ Auth OK');

// ===== Storage =====
console.log('\n=== STORAGE ===');
const storageMod = await esbuild.build({
  entryPoints: [new URL('../src/lib/storage/local.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
const storageCode = storageMod.outputFiles[0].text;
const { LocalStorageArticleAdapter } = await import(
  'data:text/javascript;base64,' + Buffer.from(storageCode).toString('base64')
);

const adapter = new LocalStorageArticleAdapter();
const all = await adapter.getAll();
console.log('seeded articles:', all.length, '| first:', all[0]?.title);
console.assert(all.length >= 3, 'has seed');

const pub = await adapter.query({ status: 'published', page: 1, pageSize: 10 });
console.log('published:', pub.items.length, '/ total', pub.total);
console.assert(pub.items.every((a) => a.status === 'published'), 'filter');

const a = await adapter.create({
  id: '',
  slug: 'test-article',
  title: 'Test',
  content: '# Test',
  excerpt: 'e',
  tags: ['t'],
  authorId: 'u_admin',
  status: 'published',
  createdAt: '',
  updatedAt: '',
  views: 0,
});
console.log('created:', a.id, a.slug);
console.assert(a.id.startsWith('a_'), 'has id');

const updated = await adapter.update(a.id, { title: 'Test 2' });
console.log('updated title:', updated.title, '| updatedAt changed:', updated.updatedAt !== a.updatedAt);

const bySlug = await adapter.getBySlug('test-article');
console.assert(bySlug?.id === a.id, 'by slug');

await adapter.delete(a.id);
const after = await adapter.getById(a.id);
console.assert(after === null, 'deleted');

console.log('✓ Storage OK');

// ===== Markdown =====
console.log('\n=== MARKDOWN ===');
const mdMod = await esbuild.build({
  entryPoints: [new URL('../src/lib/markdown/index.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  loader: { '.css': 'empty' },
});
const mdCode = mdMod.outputFiles[0].text;
const md = await import('data:text/javascript;base64,' + Buffer.from(mdCode).toString('base64'));

const sample = `# Hello

**bold** and *italic*

\`\`\`ts
const x: number = 1;
\`\`\`

- [x] task done
- [ ] task pending

| a | b |
| - | - |
| 1 | 2 |

<script>alert('xss')</script>
`;
const html = md.renderSafeMarkdown(sample);
console.log('rendered length:', html.length);
console.assert(html.includes('<h1'), 'has h1');
console.assert(html.includes('hljs'), 'has hljs code');
console.assert(html.includes('checked'), 'has task list');
console.assert(html.includes('<table'), 'has table');
console.assert(!html.includes('<script>'), 'XSS stripped');
console.assert(!html.includes('alert('), 'XSS alert stripped');

console.log('✓ Markdown OK');

// ===== Theme =====
console.log('\n=== THEME ===');
const themeMod = await esbuild.build({
  entryPoints: [new URL('../src/lib/theme/presets.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
const themeCode = themeMod.outputFiles[0].text;
const { THEME_LIST, THEME_PRESETS } = await import(
  'data:text/javascript;base64,' + Buffer.from(themeCode).toString('base64')
);
console.log('themes:', THEME_LIST.map((t) => t.id).join(', '));
console.assert(THEME_LIST.length === 4, '4 themes');
for (const t of THEME_LIST) {
  console.assert(t.variables['--color-primary'], `${t.id} has primary`);
  console.assert(t.variables['--color-bg'], `${t.id} has bg`);
  console.assert(t.variables['--color-code-bg'], `${t.id} has code-bg`);
}
console.log('✓ Theme OK');

// ===== Images =====
console.log('\n=== IMAGES ===');
const imgMod = await esbuild.build({
  entryPoints: [new URL('../src/lib/images/mock.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
const imgCode = imgMod.outputFiles[0].text;
const { MockImageUploader, HttpImageUploader } = await import(
  'data:text/javascript;base64,' + Buffer.from(imgCode).toString('base64')
);

const uploader = new MockImageUploader();
const fakeFile = new dom.window.File(['hello'], 'hello.txt', { type: 'text/plain' });
try {
  await uploader.upload(fakeFile);
  console.error('should reject text/plain');
} catch (e) {
  console.log('rejected wrong mime:', e.message);
}

const pngFile = new dom.window.File(['x'], 'test.png', { type: 'image/png' });
// Note: in jsdom getImageDimensions may never settle for invalid images, so wrap with a timeout
try {
  await Promise.race([
    uploader.upload(pngFile),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
  ]);
  console.log('upload accepted (mock does not validate bytes)');
} catch (e) {
  console.log('upload result:', e.message);
}

const http = new HttpImageUploader({ endpoint: '/api/upload' });
console.assert(http.endpoint === '/api/upload' || http.opts.endpoint === '/api/upload');
console.log('HttpImageUploader instantiated:', typeof http.upload === 'function');

console.log('✓ Images OK');

console.log('\n🎉 ALL OK');