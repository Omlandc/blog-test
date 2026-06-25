/**
 * Storage 模块类型定义
 * 抽象存储适配器接口，可注入 LocalStorage / IndexedDB / HTTP 后端
 */
import type { Article, ArticleQuery, PageResult } from '../types';

/** 通用 CRUD 接口 */
export interface StorageAdapter<T extends { id: string }> {
  /** 列出全部 */
  getAll(): Promise<T[]>;
  /** 按 ID 查询 */
  getById(id: string): Promise<T | null>;
  /** 创建 */
  create(item: T): Promise<T>;
  /** 局部更新 */
  update(id: string, partial: Partial<T>): Promise<T>;
  /** 删除 */
  delete(id: string): Promise<void>;
  /** 订阅变更 */
  subscribe(cb: (items: T[]) => void): () => void;
}

/** 文章存储适配器 —— 在 StorageAdapter 基础上扩展查询能力 */
export interface ArticleStorageAdapter extends StorageAdapter<Article> {
  /** 根据 slug 查询 */
  getBySlug(slug: string): Promise<Article | null>;
  /** 支持分页和过滤的列表查询 */
  query(params: ArticleQuery): Promise<PageResult<Article>>;
  /** 增加浏览次数（原子操作） */
  incrementViews(id: string): Promise<void>;
  /** 同步一批（用于静态包种子） */
  replaceAll(items: Article[]): void;
  /** 清空（仅供调试） */
  clear?(): Promise<void>;
}