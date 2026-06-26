/**
 * Cloudflare Pages Function（底层是 Worker，处理所有路径）
 *
 * 双重作用：
 * 1) 把 /blog-test/* 重写到 /* （子仓 base path 是 /blog-test/，但 CF Pages 部署到根域名）
 * 2) SPA fallback：所有非资源路径都返回 /index.html（React Router 需要）
 *
 * 兼容：
 * - Cloudflare Pages（基于 Worker）
 * - 合并后的 Workers/Pages（同一个底层）
 *
 * 资源文件（带扩展名）+ /data/* 直接走 ASSETS 不重写
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

  // 2) 直接资源：扩展名 /data/* /assets/* 直接读 ASSETS
  const hasExt = /\.[a-z0-9]{1,8}$/i.test(path);
  const isAsset = path.startsWith('/assets/') || path.startsWith('/data/');
  if (hasExt || isAsset) {
    return context.env.ASSETS.fetch(new URL(path + url.search, url.origin));
  }

  // 3) SPA fallback：所有非资源路径都返回 index.html
  const indexResponse = await context.env.ASSETS.fetch(
    new URL('/index.html' + url.search, url.origin),
  );
  // 透传状态码（index.html 是 200，所以 fallback 后也是 200）
  return new Response(indexResponse.body, {
    status: 200,
    headers: indexResponse.headers,
  });
};