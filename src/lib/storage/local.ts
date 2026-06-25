/**
 * LocalStorageAdapter —— 默认的文章存储实现
 * - 数据持久化到 window.localStorage
 * - 首次运行写入 SEED_ARTICLES
 * - 支持分页、过滤、排序
 * - 通过事件总线向订阅者推送变更
 */
import type { Article, ArticleQuery, PageResult } from '../types';
import type { ArticleStorageAdapter } from './types';
import { SEED_ARTICLES } from './seed';
import { uid } from '../utils';
import { safeSetItem } from './safe-write';

const STORAGE_KEY = 'blog-system:articles';
const VERSION_KEY = 'blog-system:articles:version';
const CURRENT_VERSION = '1';

type Listener = (items: Article[]) => void;

function readAll(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Article[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: Article[]): void {
  const result = safeSetItem(STORAGE_KEY, JSON.stringify(items));
  if (!result.ok) {
    // 修：之前 try/catch 静默吞错，用户以为保存成功
    // 现在丢出去，让调用方处理（toast + 调出旧值恢复）
    throw new Error(result.message ?? 'localStorage 写入失败');
  }
}

function ensureSeed(): void {
  const v = localStorage.getItem(VERSION_KEY);
  if (v === CURRENT_VERSION) return;
  writeAll(SEED_ARTICLES);
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
}

export class LocalStorageArticleAdapter implements ArticleStorageAdapter {
  private listeners = new Set<Listener>();
  // 写串行化：避免并发 increment/update/delete 读到陈旧快照
  // localStorage 是同步 API + 读-改-写不是原子的
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    ensureSeed();
  }

  /** 把写操作串行化到队列里，保证不会读到陈旧值 */
  private serialize<T>(fn: () => T): Promise<T> {
    const next = this.writeQueue.then(fn);
    // 吃掉链上错误，不污染后续调用
    this.writeQueue = next.catch(() => undefined);
    return next;
  }

  async getAll(): Promise<Article[]> {
    return readAll();
  }

  async getById(id: string): Promise<Article | null> {
    return readAll().find((a) => a.id === id) ?? null;
  }

  async getBySlug(slug: string): Promise<Article | null> {
    return readAll().find((a) => a.slug === slug) ?? null;
  }

  async create(item: Article): Promise<Article> {
    return this.serialize(() => {
      const items = readAll();
      const newItem: Article = {
        ...item,
        id: item.id || uid('a'),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        views: item.views ?? 0,
      };
      items.unshift(newItem);
      writeAll(items);
      this.emit(items);
      return newItem;
    });
  }

  async update(id: string, partial: Partial<Article>): Promise<Article> {
    return this.serialize(() => {
      const items = readAll();
      const idx = items.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error(`Article ${id} not found`);
      const merged: Article = {
        ...items[idx]!,
        ...partial,
        id,
        updatedAt: new Date().toISOString(),
      };
      items[idx] = merged;
      writeAll(items);
      this.emit(items);
      return merged;
    });
  }

  async delete(id: string): Promise<void> {
    return this.serialize(() => {
      const items = readAll().filter((a) => a.id !== id);
      writeAll(items);
      this.emit(items);
    });
  }

  async incrementViews(id: string): Promise<void> {
    return this.serialize(() => {
      const items = readAll();
      const idx = items.findIndex((a) => a.id === id);
      if (idx === -1) return;
      const target = items[idx]!;
      items[idx] = { ...target, views: target.views + 1 };
      writeAll(items);
      this.emit(items);
    });
  }

  async query(params: ArticleQuery): Promise<PageResult<Article>> {
    const all = readAll();
    let filtered = all;

    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params.authorId) {
      filtered = filtered.filter((a) => a.authorId === params.authorId);
    }
    if (params.tag) {
      filtered = filtered.filter((a) => a.tags.includes(params.tag!));
    }
    if (params.category) {
      filtered = filtered.filter((a) => a.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      if (q) {
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q),
        );
      }
    }

    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';
    filtered = [...filtered].sort((a, b) => {
      const av = (a[sortBy] ?? 0) as string | number;
      const bv = (b[sortBy] ?? 0) as string | number;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const pageSize = params.pageSize ?? 10;
    const page = Math.max(1, params.page ?? 1);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    // 跨标签页同步
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) cb(readAll());
    };
    window.addEventListener('storage', handler);
    return () => {
      this.listeners.delete(cb);
      window.removeEventListener('storage', handler);
    };
  }

  async clear(): Promise<void> {
    writeAll([]);
    this.emit([]);
  }

  /** 重置为种子数据 */
  async reset(): Promise<void> {
    writeAll(SEED_ARTICLES);
    this.emit(SEED_ARTICLES);
  }

  /** 同步一批（供静态包种子调用） */
  replaceAll(items: Article[]): void {
    writeAll(items);
    this.emit(items);
  }

  private emit(items: Article[]): void {
    for (const cb of this.listeners) cb(items);
  }
}