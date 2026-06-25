/**
 * Auth 模块桶导出
 */
export type {
  AuthAdapter,
  AuthContextValue,
  AuthProviderProps,
} from './types';
export { AuthProvider, useAuth, useCurrentUser, usePermission } from './context';
export { MockAuthAdapter, listMockAccounts } from './mock';
export type { Permission, AuthUser, LoginCredentials, Role } from '../types';