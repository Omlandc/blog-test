/**
 * ScrollToTop —— 路由切换时自动滚动到顶部
 *
 * 解决的问题：
 *  - React Router 默认不滚动到顶部
 *  - 浏览器自动 scroll restoration 会恢复上次滚动位置
 *    → 用户点了一篇文章滑到中间，再点别的文章，浏览器把滚动位置恢复到「中间」
 *  - URL 带 #hash 时滚到锚点，而不是顶部
 *
 * 策略：
 *  - 禁用浏览器自动 scroll restoration
 *  - 路由 pathname 变化时强制滚动到顶部（hash 变化除外）
 *  - hash 变化时滚到锚点（保留锚点定位）
 *  - 同一页面只滚一次（防止 React StrictMode 双调用）
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop(): null {
  const location = useLocation();
  const lastPathname = useRef<string>('');

  // 一次性禁用浏览器自动 scroll restoration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // 同一 pathname 不重滚（避免每次 setState 都触发）
    if (lastPathname.current === location.pathname) return;
    lastPathname.current = location.pathname;

    // hash 锚点定位（如 /article/foo#section-2）→ 滚到锚点
    if (location.hash) {
      // 等下一帧 DOM 渲染完
      setTimeout(() => {
        const el = document.getElementById(location.hash.slice(1));
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
      }, 50);
      return;
    }

    // 普通路由切换 → 滚到顶部
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.hash]);

  return null;
}