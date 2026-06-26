/**
 * 应用路由
 *
 * 用户端：
 * - /             → 首页
 * - /articles     → 文章列表
 * - /article/:slug → 文章详情
 * - /topics       → 主题簇索引
 * - /topics/:slug → 主题详情（Pillar / Cluster 页面）
 * - /login        → 登录
 * - /about        → 关于
 *
 * 后台（需 admin:access + mode=embedded）：
 * - /admin                  → 仪表盘
 * - /admin/articles         → 文章管理
 * - /admin/articles/new     → 新建文章
 * - /admin/articles/:id/edit → 编辑文章
 * - /admin/series           → 主题簇管理
 * - /admin/subscribers      → 订阅者管理
 * - /admin/analytics        → 流量分析
 * - /admin/monetization     → 变现配置
 * - /admin/settings         → 系统设置（主题 + 账号）
 * - /admin/site-config      → 站点身份与定位
 *
 * SEO：
 * - /sitemap.xml
 * - /robots.txt
 * - /403 /404
 *
 * 工具页（外部嵌入）：
 * - /tools/:id  → 通用工具路由（由 tools 注册）
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { LoadingPage, NotFoundPage, ForbiddenPage } from '@/pages/StatusPage';
import { useSiteConfig } from '@/lib/site-config';
import { IS_PUBLIC_ONLY } from '@/lib/build-config';

import HomePage from '@/pages/user/HomePage';
import ArticleListPage, { ArticleDetailPage } from '@/pages/user/ArticleListPage';
import { TopicPage, TopicsIndexPage } from '@/pages/user/TopicPage';
import ResourcesPage from '@/pages/user/ResourcesPage';
import ResourceCategoryPage from '@/pages/user/ResourceCategoryPage';
import ExplorePage from '@/pages/user/ExplorePage';
import ExploreDetailPage from '@/pages/user/ExploreDetailPage';
const SearchPage = lazy(() => import('@/pages/user/SearchPage'));

/* === 子仓模式（必须在所有 lazy() 之前声明） === */
const isPublicOnly = IS_PUBLIC_ONLY;
/* 替代 admin/login 页面的占位组件：路由不会注册，StubComponent 永远不渲染 */
const StubComponent = (): null => null;

/* LoginPage：子仓模式不生成 chunk */
const LoginPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/LoginPage'));
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminArticlesPage from '@/pages/admin/AdminArticlesPage';
import { ArticleNewPage, ArticleEditPage } from '@/pages/admin/ArticleEditorPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminSubscribersPage from '@/pages/admin/AdminSubscribersPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminSeriesPage from '@/pages/admin/AdminSeriesPage';
import AdminSiteConfigPage from '@/pages/admin/AdminSiteConfigPage';
import AdminDocsPage from '@/pages/admin/AdminDocsPage';
import SitemapRoute from '@/routes/sitemap';
import RobotsRoute from '@/routes/robots';
import { ToolRedirect } from '@/pages/ToolRedirect';

const ArticleNewPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/ArticleEditorPage').then((m) => ({ default: m.ArticleNewPage })));
const ArticleEditPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/ArticleEditorPage').then((m) => ({ default: m.ArticleEditPage })));
const AdminArticlesPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminArticlesPage').then((m) => ({ default: m.default })));
const AdminSeriesPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminSeriesPage').then((m) => ({ default: m.default })));
const AdminSubscribersPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminSubscribersPage').then((m) => ({ default: m.default })));
const AdminAnalyticsPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminAnalyticsPage').then((m) => ({ default: m.default })));
const AdminSiteConfigPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminSiteConfigPage').then((m) => ({ default: m.default })));
const AdminDocsPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminDocsPage').then((m) => ({ default: m.default })));
const AdminMigratePageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminMigratePage').then((m) => ({ default: m.default })));
const AdminSitesPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminSitesPage').then((m) => ({ default: m.AdminSitesPage })));
const ExportForMavisPage = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/ExportForMavisPage').then((m) => ({ default: m.ExportForMavisPage })));
const AdminSettingsPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.default })));
const AdminDashboardPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.default })));
const AdminResourcesPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminResourcesPage').then((m) => ({ default: m.default })));
const AdminContentThemesPageLazy = isPublicOnly
  ? StubComponent
  : lazy(() => import('@/pages/admin/AdminContentThemesPage').then((m) => ({ default: m.AdminContentThemesPage })));
const ContentThemesGalleryPageLazy = lazy(() =>
  import('@/pages/user/ContentThemesGalleryPage').then((m) => ({ default: m.ContentThemesGalleryPage })),
);

const isDev = import.meta.env.DEV;

const EditorPreviewPage = isDev
  ? lazy(() => import('@/pages/_preview/EditorPreview'))
  : null;
const ViewerPreviewPage = isDev
  ? lazy(() => import('@/pages/_preview/ViewerPreview'))
  : null;

function wrap(element: React.ReactNode): React.ReactElement {
  return <Suspense fallback={<LoadingPage />}>{element}</Suspense>;
}

/** 后台守卫：static 模式下重定向到首页 */
function AdminGuard(): React.ReactElement {
  const { mode } = useSiteConfig();
  // static 模式 + 子仓模式 都重定向到首页
  // 修复：之前只检查 mode === 'static'，但 mode 默认是 'embedded'，
  // static 部署的站点 mode 不会被设上，admin 路由依然可以访问
  if (mode === 'static' || isPublicOnly) {
    return <Navigate to="/" replace />;
  }
  return (
    <RequireAuth permission="admin:access">
      <Outlet />
    </RequireAuth>
  );
}

const rootChildren: RouteObject[] = [
  { index: true, element: wrap(<HomePage />) },
  { path: 'articles', element: wrap(<ArticleListPage />) },
  { path: 'search', element: wrap(<SearchPage />) },
  { path: 'resources', element: wrap(<ResourcesPage />) },
  { path: 'resources/:category', element: wrap(<ResourceCategoryPage />) },
  { path: 'explore', element: wrap(<ExplorePage />) },
  { path: 'explore/:slug', element: wrap(<ExploreDetailPage />) },
  { path: 'explore/content-themes', element: wrap(<ContentThemesGalleryPageLazy />) },
  { path: 'article/:slug', element: wrap(<ArticleDetailPage />) },
  { path: 'topics', element: wrap(<TopicsIndexPage />) },
  { path: 'topics/:slug', element: wrap(<TopicPage />) },
  { path: 'tools/:id', element: wrap(<ToolRedirect />) },
];

// 子仓模式：不注册 /login 路由（LoginPage 会被 tree-shake 掉）
const authRoutes: RouteObject[] = isPublicOnly
  ? []
  : [
      { path: 'login', element: wrap(<LoginPageLazy />) },
    ];

// 子仓（PUBLIC_ONLY）：不加 admin 路由，加了会 404 浪费 bundle
const adminRoutes: RouteObject[] = isPublicOnly
  ? []
  : [
  {
    path: 'admin',
    element: <AdminGuard />,
    children: [
      { index: true, element: wrap(<AdminDashboardPageLazy />) },
      { path: 'articles', element: wrap(<AdminArticlesPageLazy />) },
      { path: 'articles/new', element: wrap(<ArticleNewPageLazy />) },
      { path: 'articles/:id/edit', element: wrap(<ArticleEditPageLazy />) },
      { path: 'series', element: wrap(<AdminSeriesPageLazy />) },
      { path: 'subscribers', element: wrap(<AdminSubscribersPageLazy />) },
      { path: 'analytics', element: wrap(<AdminAnalyticsPageLazy />) },
      { path: 'site-config', element: wrap(<AdminSiteConfigPageLazy />) },
      { path: 'docs', element: wrap(<AdminDocsPageLazy />) },
      { path: 'migrate', element: wrap(<AdminMigratePageLazy />) },
      { path: 'sites', element: wrap(<AdminSitesPageLazy />) },
      { path: 'export', element: wrap(<ExportForMavisPage />) },
      { path: 'settings', element: wrap(<AdminSettingsPageLazy />) },
      { path: 'resources', element: wrap(<AdminResourcesPageLazy />) },
      { path: 'content-themes', element: wrap(<AdminContentThemesPageLazy />) },
    ],
  },
    ];

const systemRoutes: RouteObject[] = [
  { path: '403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
  { path: 'admin-old', element: <Navigate to="/admin" replace /> },
  { path: 'sitemap.xml', element: <SitemapRoute /> },
  { path: 'robots.txt', element: <RobotsRoute /> },
];

rootChildren.push(...authRoutes, ...adminRoutes, ...systemRoutes);

if (isDev && EditorPreviewPage && ViewerPreviewPage) {
  rootChildren.push(
    { path: 'preview/editor', element: wrap(<EditorPreviewPage />) },
    { path: 'preview/viewer', element: wrap(<ViewerPreviewPage />) },
  );
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: rootChildren,
    },
  ],
  {
    // 修：子仓代码被部署到不同路径下时（GitHub Pages /blog-test/ 或 CF Pages 根域名），
    // basename 必须根据实际访问 URL 动态选择，否则 React Router 不渲染任何东西：
    //   "<Router basename='/blog-test'> is not able to match the URL '/'...the <Router> won't render anything."
    //
    // 逻辑：
    // - 浏览器 URL 以 /blog-test 开头 → 子仓部署在 /blog-test/ → basename = '/blog-test'
    // - 浏览器 URL 是 / → 部署在根域名 → basename = '/'
    // - 全部兼容，不用改 Vite config
    basename: (() => {
      if (typeof window === 'undefined') return '/';
      const p = window.location.pathname;
      // 检测是否在 /blog-test 子路径下部署
      if (p === '/blog-test' || p.startsWith('/blog-test/')) return '/blog-test';
      return '/';
    })(),
  },
);

export function AppRouter(): React.ReactElement {
  return <RouterProvider router={router} />;
}