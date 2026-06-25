/**
 * 路由权限守卫
 * - 作为叶子组件：<RequireAuth permission="..."><Page/></RequireAuth>
 * - 作为布局组件：父路由 element 用 <RequireAuth permission="..." />，
 *   内部自动渲染 <Outlet/>，子路由可以嵌套
 *
 * 行为：
 * - 未登录访问受保护页面 → 跳 /login（带上 from）
 * - 已登录但权限不足 → 显示 ForbiddenPage
 * - 加载中 → 显示 LoadingPage
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Permission } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { ForbiddenPage, LoadingPage } from '@/pages/StatusPage';

export interface RequireAuthProps {
  permission?: Permission | Permission[];
  /** 为 true 时只要登录即可；不传或 false 表示必须有 permission */
  requireLogin?: boolean;
  children?: React.ReactNode;
}

export function RequireAuth({
  permission,
  requireLogin = false,
  children,
}: RequireAuthProps): React.ReactElement {
  const { user, loading, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingPage message="身份验证中…" />;

  // 未登录：跳登录
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 仅要求登录
  if (requireLogin || permission == null) {
    return children != null ? <>{children}</> : <Outlet />;
  }

  // 单权限
  if (typeof permission === 'string') {
    if (!hasPermission(permission)) return <ForbiddenPage />;
    return children != null ? <>{children}</> : <Outlet />;
  }

  // 多权限（任意满足）
  if (Array.isArray(permission)) {
    if (!hasAnyPermission(permission)) return <ForbiddenPage />;
  }

  return children != null ? <>{children}</> : <Outlet />;
}