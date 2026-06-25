/**
 * 构建配置 —— 区分 master 控制台和子仓用户站
 *
 * ⚠️ 必须直接用 import.meta.env.VITE_*, 不能包在 typecast 里
 * （Vite 静态分析只识别字面量的 `import.meta.env.VITE_*`）
 *
 * 主仓（blog-system）：
 *   - VITE_PUBLIC_ONLY=false（默认）
 *   - 完整后台 + 用户前台
 *
 * 子仓（blog-test 等）：
 *   - VITE_PUBLIC_ONLY=true
 *   - 只有用户前台（文章/主题/搜索/资源/探索）
 *   - 后台路由不注册，登录入口不显示
 */
// 直接访问 import.meta.env.VITE_* —— Vite 静态分析能识别
export const IS_PUBLIC_ONLY: boolean = import.meta.env.VITE_PUBLIC_ONLY === 'true';
export const SHOW_POWERED_BY: boolean = import.meta.env.VITE_SHOW_POWERED_BY !== 'false';
export const MASTER_URL: string =
  import.meta.env.VITE_MASTER_URL || 'https://github.com/Omlandc/blog-system';
export const SITE_ORIGIN: 'master' | 'sub' = IS_PUBLIC_ONLY ? 'sub' : 'master';
