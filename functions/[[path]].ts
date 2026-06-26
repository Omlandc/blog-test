/**
 * Cloudflare Pages Function（底层是 Worker，处理所有路径）
 *
 * 作用：
 * 1) 把 /blog-test/* 重写到 /* （子仓 base path 是 /blog-test/，CF Pages 部署到根域名）
 * 2) SPA fallback：所有 404 资源路径都 fallback 到 /index.html
 *
 * 修：之前 ASSETS.fetch 资源不存在时 throw，导致 Cloudflare 返回 522。
 * 现在加 status 404 检查 + try-catch，资源不存在直接 fallback。
 *
 * 资源文件 /data/* /assets/* / 静态资源 直接走 ASSETS，
 * 找不到的话 fallback 到 index.html（前端 SPA fallback）
 */
interface Env {
  ASSETS: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  let path = url.pathname;

  // 1) 去掉 /blog-test/ 前缀（Vite base 适配）
  if (path === '/blog-test') {
    path = '/';
  } else if (path.startsWith('/blog-test/')) {
    path = '/' + path.slice('/blog-test/'.length);
  }

  const targetUrl = new URL(path + url.search, url.origin);

  // 2) 取资源（带 try-catch 兜底）
  let response: Response;
  try {
    response = await context.env.ASSETS.fetch(targetUrl);
  } catch {
    // ASSETS 服务 throw（Cloudflare 偶尔会这样）→ SPA fallback
    return context.env.ASSETS.fetch(new URL('/index.html', url.origin));
  }

  // 3) 资源不存在 → SPA fallback（关键：避免 Cloudflare 返回 522）
  if (response.status === 404) {
    return context.env.ASSETS.fetch(new URL('/index.html', url.origin));
  }

  return response;
};