/**
 * Storage 模块桶导出
 */
import { LocalStorageArticleAdapter } from './local';
import type { ArticleStorageAdapter } from './types';
import { getStaticBundle, getArticlesFromBundle } from './static-bundle';
import type { Article } from '../types';

export type {
  StorageAdapter,
  ArticleStorageAdapter,
} from './types';
export { LocalStorageArticleAdapter } from './local';
// 修：SEED_ARTICLES 静态 re-export 会让 Vite 把 seed.ts 打入主包
// 改用动态 import 需要的代码自己调
export type { Article, ArticleQuery, PageResult, ArticleStatus } from '../types';
// 提供一个 async helper，让需要 seed 的模块（export-static.mjs / scripts/）动态加载
export async function loadSeedArticles(): Promise<Article[]> {
  const mod = await import('./seed');
  return mod.SEED_ARTICLES;
}
export async function loadSeedAuthors(): Promise<unknown[]> {
  const mod = await import('./seed');
  return mod.SEED_AUTHORS;
}

let _storage: ArticleStorageAdapter | null = null;

/** 获取默认的文章存储（单例懒加载） */
export function getArticleStorage(): ArticleStorageAdapter {
  if (_storage) return _storage;
  _storage = new LocalStorageArticleAdapter();
  // 如果存在静态包，同步 seed
  const bundle = getStaticBundle();
  if (bundle) {
    try {
      const seeded = getArticlesFromBundle(bundle);
      if (seeded.length > 0) {
        _storage.replaceAll(seeded);
      }
    } catch {
      // ignore
    }
  }
  return _storage;
}

/** 读取全部文章（同步） */
export function getAllArticles(): Article[] {
  // 同步读取 - 从 LocalStorage 直接拉
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem('blog-system:articles');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}
