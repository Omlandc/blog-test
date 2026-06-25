/**
 * 站内全文搜索 —— 基于 MiniSearch
 *
 * 特性：
 *  - 纯前端，零服务器
 *  - 中文友好（char-ngram tokenize）
 *  - 模糊匹配（编辑距离）
 *  - 前缀匹配（输入时实时）
 *  - 字段加权（title 3x > excerpt 2x > content 1x > tags 2x）
 *  - 可序列化为 JSON（构建时生成 index.json 部署到 CDN）
 */
import MiniSearch from 'minisearch';
import type { Article } from '../types';

/* ============================================================
 * 1. 中文友好的 tokenize
 * ============================================================ */
/**
 * 把文本切成 token 数组，支持中文（按 char-ngram）、英文（按词）
 * - 英文/数字：按单词切分
 * - 中文：每 2 个相邻字算一个 n-gram（n=2）
 * - 去除停用词（中文标点 + 常见虚词）
 */
const STOP_CHARS = new Set([
  '的', '了', '是', '在', '和', '与', '或', '为', '为', '以', '于', '于',
  ' ', ',', '.', '!', '?', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}',
  '、', '。', '！', '？', '；', '：', '、', '（', '）', '【', '】',
  '《', '》', '…', '—', '·', '/', '\\', '|', '&', '@', '#', '$', '%', '^', '*',
  '+', '-', '=', '<', '>', '~', '`',
]);

function tokenize(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const tokens: string[] = [];
  // 1) 提取英文/数字词
  const wordRegex = /[a-z0-9]+/gi;
  let m: RegExpExecArray | null;
  const wordSpans: Array<[number, number]> = [];
  while ((m = wordRegex.exec(normalized)) !== null) {
    wordSpans.push([m.index, m.index + m[0].length]);
    tokens.push(m[0]);
  }
  // 2) 中文 char-ngram（n=2，覆盖范围 n=1..3 也输出更友好）
  const isCjk = (ch: string): boolean => /[\u4e00-\u9fa5]/.test(ch);
  for (let i = 0; i < normalized.length; i++) {
    if (isCjk(normalized[i]!)) {
      // 单字 token
      if (!STOP_CHARS.has(normalized[i]!)) tokens.push(normalized[i]!);
      // 双字 n-gram
      if (i + 1 < normalized.length && isCjk(normalized[i + 1]!)) {
        tokens.push(normalized.slice(i, i + 2));
      }
      // 三字 n-gram（更精准但体积更大，作为可选）
      if (i + 2 < normalized.length && isCjk(normalized[i + 1]!) && isCjk(normalized[i + 2]!)) {
        tokens.push(normalized.slice(i, i + 3));
      }
    }
  }
  // 3) 去重
  return Array.from(new Set(tokens));
}

/* ============================================================
 * 2. 提取纯文本（去掉 markdown / HTML 标记）
 * ============================================================ */
function stripMarkdown(md: string): string {
  if (!md) return '';
  return md
    // 去掉代码块
    .replace(/```[\s\S]*?```/g, ' ')
    // 去掉行内代码
    .replace(/`[^`]+`/g, ' ')
    // 去掉图片
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    // 链接保留文字
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 标题符号
    .replace(/^#+\s+/gm, '')
    // 列表符号
    .replace(/^[-*+]\s+/gm, '')
    // 引用
    .replace(/^>\s*/gm, '')
    // 粗体/斜体
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // HTML 标签
    .replace(/<[^>]+>/g, ' ')
    // 多个空白
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
 * 3. 索引文档（构建 MiniSearch 用的 record）
 * ============================================================ */
export interface SearchableDoc {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  category: string;
  /** 序列化后的 series 名字 */
  seriesNames: string;
  status: string;
  publishedAt: string;
}

export function buildSearchableDoc(article: Article, seriesNames: string[] = []): SearchableDoc {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt ?? '',
    content: stripMarkdown(article.content ?? '').slice(0, 8000), // 限长避免索引过大
    tags: (article.tags ?? []).join(' '),
    category: article.category ?? '',
    seriesNames: seriesNames.join(' '),
    status: article.status,
    publishedAt: article.publishedAt ?? article.updatedAt ?? '',
  };
}

/* ============================================================
 * 4. 搜索器
 * ============================================================ */
export interface SearchOptions {
  /** 前缀匹配（输入即搜） */
  prefix?: boolean;
  /** 模糊匹配（编辑距离） */
  fuzzy?: number | false;
  /** 结果数量限制 */
  limit?: number;
  /** 字段权重 */
  boost?: Record<string, number>;
}

const DEFAULT_BOOST: Record<string, number> = {
  title: 4,
  excerpt: 2,
  tags: 2.5,
  seriesNames: 1.5,
  category: 1.2,
  content: 1,
};

export class ArticleSearcher {
  private mini: MiniSearch<SearchableDoc>;
  private cached: SearchableDoc[] = [];

  constructor() {
    this.mini = new MiniSearch<SearchableDoc>({
      idField: 'id',
      fields: ['title', 'excerpt', 'content', 'tags', 'category', 'seriesNames'],
      storeFields: ['slug', 'title', 'excerpt', 'tags', 'category', 'status', 'publishedAt', 'seriesNames'],
      tokenize,
      processTerm: (term) => (term.length < 2 ? null : term.toLowerCase()),
      searchOptions: {
        boost: DEFAULT_BOOST,
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'AND',
      },
    });
  }

  /** 批量添加文章 */
  addAll(articles: Article[], seriesMap: Map<string, string[]> = new Map()): void {
    const docs = articles.map((a) => buildSearchableDoc(a, seriesMap.get(a.seriesId ?? '') ?? []));
    this.mini.addAll(docs);
    this.cached = docs;
  }

  add(article: Article, seriesNames: string[] = []): void {
    const doc = buildSearchableDoc(article, seriesNames);
    this.mini.add(doc);
    this.cached.push(doc);
  }

  remove(id: string): void {
    if (this.mini.has(id)) {
      const doc = this.cached.find((d) => d.id === id);
      if (doc) this.mini.remove(doc);
    }
    this.cached = this.cached.filter((d) => d.id !== id);
  }

  /** 主搜索接口 */
  search(query: string, options: SearchOptions = {}): SearchableDoc[] {
    if (!query || !query.trim()) return [];
    const opts = {
      prefix: options.prefix ?? true,
      fuzzy: options.fuzzy ?? 0.2,
      boost: { ...DEFAULT_BOOST, ...(options.boost ?? {}) },
      combineWith: 'AND' as const,
    };
    return this.mini.search(query, opts).slice(0, options.limit ?? 50) as unknown as SearchableDoc[];
  }

  /** 自动补全（只匹配 title 字段，prefix 必须） */
  suggest(query: string, limit = 8): string[] {
    if (!query || !query.trim()) return [];
    return this.mini.autoSuggest(query, { fuzzy: 0.1, prefix: true }).slice(0, limit).map((s) => s.suggestion);
  }

  size(): number {
    return this.cached.length;
  }

  /** 序列化为 JSON（用于 build-time 生成 index.json） */
  toJSON(): unknown {
    return this.mini.toJSON();
  }

  /** 从 JSON 恢复（运行时加载 index.json） */
  static fromJSON(json: unknown): ArticleSearcher {
    const searcher = new ArticleSearcher();
    searcher.mini = MiniSearch.loadJSON<SearchableDoc>(
      typeof json === 'string' ? json : JSON.stringify(json),
      {
        idField: 'id',
        fields: ['title', 'excerpt', 'content', 'tags', 'category', 'seriesNames'],
        storeFields: ['slug', 'title', 'excerpt', 'tags', 'category', 'status', 'publishedAt', 'seriesNames'],
        tokenize,
        processTerm: (term) => (term.length < 2 ? null : term.toLowerCase()),
      },
    );
    return searcher;
  }
}

/* ============================================================
 * 5. 全局单例（懒加载）
 * ============================================================ */
let _searcher: ArticleSearcher | null = null;
let _indexPromise: Promise<ArticleSearcher> | null = null;

async function buildSearcher(): Promise<ArticleSearcher> {
  const s = new ArticleSearcher();
  const { getArticleStorage } = await import('../storage');
  const storage = getArticleStorage();
  const articles = await storage.getAll();
  // 过滤只发布
  const published = articles.filter((a) => a.status === 'published');
  // 加载 series 名称映射
  const { SeriesStoreStatic } = await import('../series');
  const seriesMap = new Map<string, string[]>();
  for (const a of published) {
    if (!a.seriesId) continue;
    const path: string[] = [];
    let cur: { parentId?: string; name: string } | undefined = SeriesStoreStatic.getById(a.seriesId);
    while (cur) {
      path.unshift(cur.name);
      cur = cur.parentId ? SeriesStoreStatic.getById(cur.parentId) : undefined;
    }
    if (path.length > 0) seriesMap.set(a.id, path);
  }
  s.addAll(published, seriesMap);
  return s;
}

export async function getSearcher(): Promise<ArticleSearcher> {
  if (_searcher) return _searcher;
  if (!_indexPromise) {
    _indexPromise = buildSearcher().then((s) => {
      _searcher = s;
      return s;
    });
  }
  return _indexPromise;
}

export function resetSearcher(): void {
  _searcher = null;
  _indexPromise = null;
}