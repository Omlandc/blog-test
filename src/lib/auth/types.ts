/**
 * Auth 模块类型定义
 * 外部系统可通过 `import type { AuthAdapter } from '@/lib/auth'` 复用
 */
import type { AuthUser, LoginCredentials, Permission } from '../types';

/** 抽象认证适配器接口 —— 任何实现都可注入 */
export interface AuthAdapter {
  /** 获取当前登录用户（可能为 null） */
  getCurrentUser(): Promise<AuthUser | null>;

  /** 登录 */
  login(credentials: LoginCredentials): Promise<AuthUser>;

  /** 登出 */
  logout(): Promise<void>;

  /** 检查当前用户是否拥有指定权限 */
  hasPermission(permission: Permission): Promise<boolean>;

  /** 订阅认证状态变化（返回反订阅函数） */
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
}

/** AuthProvider 暴露给消费者的 context 值 */
export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** 同步权限检查（基于已加载的 user，避免每次都 await） */
  hasPermission: (permission: Permission) => boolean;
  /** 是否有任意一个权限 */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** 是否有全部权限 */
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

/** AuthProvider props */
export interface AuthProviderProps {
  /** 自定义适配器，默认为 MockAuthAdapter */
  adapter?: AuthAdapter;
  children: React.ReactNode;
}