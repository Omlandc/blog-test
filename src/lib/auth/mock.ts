/**
 * Mock 认证适配器 —— 用于演示和测试
 *
 * 内置两个账号：
 *   admin / admin123  → 管理员，拥有所有权限
 *   user  / user123   → 普通用户，只有 article:read + article:create
 *
 * 状态通过 localStorage 持久化（key: blog-system:auth:current）。
 * 切换到真实后端时只需把 MockAuthAdapter 换成 HttpAuthAdapter，
 * 消费者侧无需改动。
 */
import type {
  AuthUser,
  LoginCredentials,
  Permission,
  Role,
} from '../types';
import type { AuthAdapter } from './types';
import { sleep } from '../utils';

export interface MockAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  avatar: string;
  role: Role;
  email: string;
  bio: string;
  permissions: Permission[];
}

/** 角色 → 默认权限映射 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'article:read',
    'article:create',
    'article:edit',
    'article:delete',
    'article:publish',
    'admin:access',
    'theme:manage',
    'user:manage',
  ],
  editor: [
    'article:read',
    'article:create',
    'article:edit',
    'article:publish',
    'admin:access',
  ],
  user: ['article:read', 'article:create'],
};

const STORAGE_KEY = 'blog-system:auth:current';
const ACCOUNTS: MockAccount[] = [
  {
    id: 'u_admin',
    username: 'admin',
    password: 'admin123',
    name: '超级管理员',
    avatar:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#6366f1"/><text x="50%" y="55%" text-anchor="middle" fill="white" font-size="26" font-family="sans-serif" dominant-baseline="middle">A</text></svg>`,
      ),
    role: 'admin',
    email: 'admin@example.com',
    bio: '负责整个博客系统的运维与内容审核。',
    permissions: ROLE_PERMISSIONS.admin,
  },
  {
    id: 'u_user',
    username: 'user',
    password: 'user123',
    name: '普通用户',
    avatar:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#10b981"/><text x="50%" y="55%" text-anchor="middle" fill="white" font-size="26" font-family="sans-serif" dominant-baseline="middle">U</text></svg>`,
      ),
    role: 'user',
    email: 'user@example.com',
    bio: '热爱写作的普通用户。',
    permissions: ROLE_PERMISSIONS.user,
  },
];

function readStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 忽略存储错误
  }
}

function toAuthUser(acc: MockAccount): AuthUser {
  return {
    id: acc.id,
    username: acc.username,
    name: acc.name,
    avatar: acc.avatar,
    bio: acc.bio,
    role: acc.role,
    permissions: acc.permissions,
    email: acc.email,
  };
}

export class MockAuthAdapter implements AuthAdapter {
  private listeners = new Set<(user: AuthUser | null) => void>();

  async getCurrentUser(): Promise<AuthUser | null> {
    await sleep(50); // 模拟异步
    return readStorage();
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    await sleep(300); // 模拟网络延迟
    const acc = ACCOUNTS.find(
      (a) =>
        a.username === credentials.username &&
        a.password === credentials.password,
    );
    if (!acc) {
      throw new Error('用户名或密码错误');
    }
    const user = toAuthUser(acc);
    writeStorage(user);
    this.emit(user);
    return user;
  }

  async logout(): Promise<void> {
    await sleep(100);
    writeStorage(null);
    this.emit(null);
  }

  async hasPermission(permission: Permission): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  onAuthChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    // 立即触发一次
    queueMicrotask(() => cb(readStorage()));
    // 监听跨标签页 storage 事件
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cb(readStorage());
        this.emit(readStorage());
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      this.listeners.delete(cb);
      window.removeEventListener('storage', handler);
    };
  }

  private emit(user: AuthUser | null): void {
    for (const cb of this.listeners) cb(user);
  }
}

/** 列出内置账号（仅 UI 提示用，不含密码） */
export function listMockAccounts(): Array<
  Pick<MockAccount, 'username' | 'name' | 'role'>
> {
  return ACCOUNTS.map(({ username, name, role }) => ({ username, name, role }));
}

/** 列出内置账号（含密码，仅用于演示场景的账号切换器） */
export function listMockAccountsWithCredentials(): MockAccount[] {
  return [...ACCOUNTS];
}