/**
 * AuthProvider —— 把任意 AuthAdapter 注入到 React 树中
 * 通过 useAuth() 获取当前会话、登录、登出、权限检查
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthContextValue, AuthProviderProps } from './types';
import type { AuthUser, LoginCredentials, Permission } from '../types';
import { MockAuthAdapter } from './mock';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  adapter,
  children,
}: AuthProviderProps): React.ReactElement {
  // useMemo 保证适配器实例稳定
  const authAdapter = useMemo(() => adapter ?? new MockAuthAdapter(), [adapter]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await authAdapter.getCurrentUser();
      if (!cancelled) {
        setUser(current);
        setLoading(false);
      }
    })();

    const unsubscribe = authAdapter.onAuthChange((u) => {
      if (!cancelled) setUser(u);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authAdapter]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (credentials: LoginCredentials) => {
        const u = await authAdapter.login(credentials);
        setUser(u);
        return u;
      },
      logout: async () => {
        await authAdapter.logout();
        setUser(null);
      },
      hasPermission: (permission: Permission) => {
        if (!user) return false;
        return user.permissions.includes(permission);
      },
      hasAnyPermission: (permissions: Permission[]) => {
        if (!user) return false;
        return permissions.some((p) => user.permissions.includes(p));
      },
      hasAllPermissions: (permissions: Permission[]) => {
        if (!user) return false;
        return permissions.every((p) => user.permissions.includes(p));
      },
    }),
    [user, loading, authAdapter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 消费 AuthContext */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

/** 仅消费当前用户，loading 时返回 null */
export function useCurrentUser(): AuthUser | null {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user;
}

/** 仅消费权限检查函数 */
export function usePermission(): AuthContextValue['hasPermission'] {
  const { hasPermission } = useAuth();
  return hasPermission;
}