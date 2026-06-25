/**
 * Vite plugin: blog-sync
 *
 * dev 模式专属，提供本地「导出到项目」端点。
 * 浏览器把 localStorage 数据 POST 过来，插件写到 public/data/articles.json。
 *
 * 端点：
 *   POST /__blog/save-bundle   body: bundle JSON → 写入 public/data/articles.json
 *   POST /__blog/run-build      → 触发 npm run build（异步，轮询状态）
 *   GET  /__blog/status         → 返回上次构建结果
 *
 * 生产构建（vite build）时不挂载，部署到 GitHub Pages 后端点不存在。
 */
import type { Plugin, ViteDevServer } from 'vite';
import { writeFileSync, existsSync, mkdirSync, readFileSync, writeFileSync as writeFileSyncFs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

interface BuildStatus {
  state: 'idle' | 'running' | 'success' | 'error';
  startedAt?: string;
  finishedAt?: string;
  message?: string;
}

export function blogSyncPlugin(): Plugin {
  let server: ViteDevServer | null = null;
  const root = process.cwd();
  const publicDataDir = resolve(root, 'public', 'data');
  const publicDataFile = resolve(publicDataDir, 'articles.json');
  let buildStatus: BuildStatus = { state: 'idle' };

  function ensureDir(): void {
    if (!existsSync(publicDataDir)) {
      mkdirSync(publicDataDir, { recursive: true });
    }
  }

  function saveBundle(bundle: unknown): { ok: true; path: string; size: number } | { ok: false; error: string } {
    try {
      ensureDir();
      // 校验：必须是对象，含 articles 数组
      if (
        typeof bundle !== 'object' ||
        bundle === null ||
        !Array.isArray((bundle as { articles?: unknown }).articles)
      ) {
        return { ok: false, error: 'bundle 格式错误：缺少 articles 数组' };
      }
      // 补字段
      const b = bundle as Record<string, unknown>;
      if (!b.version) b.version = '0.6.0';
      if (!b.generatedAt) b.generatedAt = new Date().toISOString();
      const json = JSON.stringify(b, null, 2);
      writeFileSync(publicDataFile, json, 'utf-8');
      return { ok: true, path: 'public/data/articles.json', size: json.length };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  function runBuild(): void {
    if (buildStatus.state === 'running') return;
    buildStatus = { state: 'running', startedAt: new Date().toISOString() };
    const child = spawn('npm', ['run', 'build'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let out = '';
    let err = '';
    child.stdout?.on('data', (d) => {
      out += d.toString();
    });
    child.stderr?.on('data', (d) => {
      err += d.toString();
    });
    child.on('close', (code) => {
      buildStatus = {
        ...buildStatus,
        state: code === 0 ? 'success' : 'error',
        finishedAt: new Date().toISOString(),
        message: code === 0
          ? `构建成功 · ${out.split('\n').filter(Boolean).slice(-3).join(' / ')}`
          : `构建失败（code ${code}）· ${(err || out).split('\n').filter(Boolean).slice(-5).join(' / ')}`,
      };
    });
    child.on('error', (e) => {
      buildStatus = {
        ...buildStatus,
        state: 'error',
        finishedAt: new Date().toISOString(),
        message: `启动失败：${e.message}`,
      };
    });
  }

  return {
    name: 'blog-system:sync',
    apply: 'serve', // 仅 dev 模式挂载
    configureServer(s) {
      server = s;
      // POST: 保存 bundle 到 public/data/articles.json
      s.middlewares.use('/__blog/save-bundle', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const bundle = JSON.parse(body);
            const result = saveBundle(bundle);
            if (result.ok) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: true,
                path: result.path,
                size: result.size,
                articleCount: Array.isArray((bundle as { articles?: unknown[] }).articles) ? (bundle as { articles: unknown[] }).articles.length : 0,
              }));
            } else {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: result.error }));
            }
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: `JSON 解析失败：${e instanceof Error ? e.message : String(e)}` }));
          }
        });
      });

      // POST: 触发 build
      s.middlewares.use('/__blog/run-build', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        runBuild();
        res.statusCode = 202;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, message: 'build started' }));
      });

      // GET: 当前构建状态
      s.middlewares.use('/__blog/status', (req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(buildStatus));
      });

      console.log('\n  🔌 blog-sync plugin mounted (dev-only):');
      console.log('     POST /__blog/save-bundle   → save bundle to public/data/articles.json');
      console.log('     POST /__blog/run-build      → trigger npm run build');
      console.log('     GET  /__blog/status         → poll build status\n');
    },
  };
}
