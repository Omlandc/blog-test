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
export { SEED_ARTICLES } from './seed';
export type {
  Article,
  ArticleQuery,
  PageResult,
  ArticleStatus,
} from '../types';

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
