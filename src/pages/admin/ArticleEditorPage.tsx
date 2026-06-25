/**
 * 文章编辑页 —— 新建 + 编辑共用
 *
 * 集成 MarkdownEditor：
 *  - 新建模式：value=空，articleId 不存在
 *  - 编辑模式：从 LocalStorageArticleAdapter 加载已有文章
 *  - 自动保存：1.5s 防抖
 *  - 工具栏顶部可切换"双栏/编辑/预览"模式
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Send, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { MarkdownEditor, ArticleSettingsDialog } from '@/components/editor';
import { useAuth } from '@/lib/auth';
import { useSiteConfig } from '@/lib/site-config';
import type { Article, Series } from '@/lib/types';
import { getArticleStorage } from '@/lib/storage';

export function ArticleNewPage(): React.ReactElement {
  const { user } = useAuth();
  const { config: siteConfig } = useSiteConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<Article>(() => ({
    id: '',
    slug: 'untitled',
    title: '未命名文章',
    content: '',
    format: 'markdown',
    contentTheme: siteConfig.defaultContentTheme ?? 'default',
    excerpt: '',
    tags: [],
    category: '',
    authorId: user?.id ?? 'anonymous',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
  }));

  const handleChange = useCallback((content: string) => {
    setDraft((d) => ({ ...d, content }));
  }, []);

  const handleFormatChange = useCallback((format: 'markdown' | 'html') => {
    setDraft((d) => ({ ...d, format }));
    toast.show('已切换为 ' + (format === 'html' ? 'HTML' : 'Markdown') + ' 编辑器', {
      description: format === 'html' ? '使用 HTML 语法，渲染时会自动 sanitize' : '使用 Markdown 语法',
    });
  }, []);

  const handleContentThemeChange = useCallback((contentTheme: string) => {
    setDraft((d) => ({ ...d, contentTheme }));
  }, []);

  const handleSave = useCallback(async (content: string): Promise<void> => {
    const storage = getArticleStorage();
    const title = content.split('\n').find((l) => l.startsWith('# '))?.slice(2).trim() || '未命名文章';
    if (!draft.id) {
      const created = await storage.create({
        ...draft,
        title,
        content,
        excerpt: content.slice(0, 160),
        status: 'draft',
      });
      setDraft(created);
      toast.success('草稿已创建', { description: created.title });
    } else {
      await storage.update(draft.id, {
        title,
        content,
        excerpt: content.slice(0, 160),
        contentTheme: draft.contentTheme,
      });
      toast.success('已保存');
    }
  }, [draft]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-1 px-0 hover:bg-transparent">
            <Link to="/admin/articles">
              <ArrowLeft className="h-4 w-4" /> 返回文章列表
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-fg">新建文章</h1>
          <p className="text-sm text-fg-muted">使用 Markdown 创作 · 自动保存草稿</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> 设置
          </Button>
          <Button variant="outline" onClick={() => handleSave(draft.content)} className="gap-2">
            <Save className="h-4 w-4" />
            保存草稿
          </Button>
          <Button
            onClick={async () => {
              await handleSave(draft.content);
              if (draft.id) {
                await getArticleStorage().update(draft.id, { status: 'published', publishedAt: new Date().toISOString() });
                setDraft((d) => ({ ...d, status: 'published', publishedAt: new Date().toISOString() }));
                toast.success('已发布！', { description: '文章现在对所有访问者可见' });
              }
            }}
            className="gap-2 bg-success text-white hover:bg-success/90"
          >
            <Send className="h-4 w-4" />
            发布
          </Button>
        </div>
      </div>
      <MarkdownEditor
        value={draft.content}
        onChange={handleChange}
        onSave={handleSave}
        autoSave
        autoSaveDelay={1500}
        placeholder="# 标题\n\n开始你的创作…"
        articleId={draft.id || 'new'}
        minHeight={560}
        initialMode="split"
        format={draft.format}
        onFormatChange={handleFormatChange}
        contentTheme={draft.contentTheme}
        onContentThemeChange={handleContentThemeChange}
      />
      <ArticleSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        article={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        seriesList={[]}
      />
    </div>
  );
}

export function ArticleEditPage(): React.ReactElement {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  useEffect(() => {
    if (!id) {
      setError('缺少文章 ID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getArticleStorage()
      .getById(id)
      .then((a) => {
        if (cancelled) return;
        if (!a) setError('文章不存在');
        else setArticle(a);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 加载系列列表（按需从 storage 拿）
  useEffect(() => {
    // 动态调用，避免不存在的 API 报错
    try {
      const storage = getArticleStorage() as unknown as { listSeries?: () => Promise<Series[]> };
      if (typeof storage.listSeries === 'function') {
        void storage
          .listSeries()
          .then((list) => {
            if (Array.isArray(list)) setSeriesList(list);
          })
          .catch(() => {
            /* ignore */
          });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleSave = useCallback(async (content: string): Promise<void> => {
    if (!article) return;
    const storage = getArticleStorage();
    const title = content.split('\n').find((l) => l.startsWith('# '))?.slice(2).trim() || article.title;
    const updated = await storage.update(article.id, {
      title,
      content,
      excerpt: content.slice(0, 160),
      contentTheme: article.contentTheme,
      cover: article.cover,
      slug: article.slug,
      tags: article.tags,
      category: article.category,
      seriesId: article.seriesId,
    });
    setArticle(updated);
  }, [article]);

  const handleChange = useCallback((content: string) => {
    setArticle((a) => (a ? { ...a, content } : a));
  }, []);

  const handleFormatChange = useCallback((format: 'markdown' | 'html') => {
    setArticle((a) => (a ? { ...a, format } : a));
    toast.show('已切换为 ' + (format === 'html' ? 'HTML' : 'Markdown') + ' 编辑器', {
      description: format === 'html' ? '使用 HTML 语法，渲染时会自动 sanitize' : '使用 Markdown 语法',
    });
  }, []);

  const handleContentThemeChange = useCallback((contentTheme: string) => {
    setArticle((a) => (a ? { ...a, contentTheme } : a));
  }, []);

  const initialMode = useMemo<'split' | 'edit' | 'preview'>(() => 'split', []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-fg-muted">加载中…</div>
    );
  }
  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-6 text-center text-danger">
          {error || '文章不存在'}
        </div>
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/admin/articles">
              <ArrowLeft className="h-4 w-4" /> 返回列表
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-1 px-0 hover:bg-transparent">
            <Link to="/admin/articles">
              <ArrowLeft className="h-4 w-4" /> 返回文章列表
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-fg">编辑文章</h1>
            {article.status === 'published' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                <Eye className="h-3 w-3" /> 已发布
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                <EyeOff className="h-3 w-3" /> 草稿
              </span>
            )}
          </div>
          <p className="text-sm text-fg-muted">{article.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5" /> 设置
          </Button>
          <Button variant="outline" onClick={() => handleSave(article.content)} className="gap-2">
            <Save className="h-4 w-4" />
            保存
          </Button>
          {article.status === 'published' ? (
            <Button
              variant="outline"
              onClick={async () => {
                const updated = await getArticleStorage().update(article.id, { status: 'draft' });
                setArticle(updated);
                toast.show('已取消发布', { description: '文章已转为草稿状态' });
              }}
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              取消发布
            </Button>
          ) : (
            <Button
              onClick={async () => {
                await handleSave(article.content);
                const updated = await getArticleStorage().update(article.id, { status: 'published', publishedAt: new Date().toISOString() });
                setArticle(updated);
                toast.success('已发布！', { description: '文章现在对所有访问者可见' });
              }}
              className="gap-2 bg-success text-white hover:bg-success/90"
            >
              <Send className="h-4 w-4" />
              发布
            </Button>
          )}
        </div>
      </div>
      <MarkdownEditor
        value={article.content}
        onChange={handleChange}
        onSave={handleSave}
        autoSave
        autoSaveDelay={1500}
        placeholder="# 标题\n\n开始你的创作…"
        articleId={article.id}
        minHeight={560}
        initialMode={initialMode}
        format={article.format ?? 'markdown'}
        onFormatChange={handleFormatChange}
        contentTheme={article.contentTheme ?? 'default'}
        onContentThemeChange={handleContentThemeChange}
      />
      <ArticleSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        article={article}
        onChange={(patch) => setArticle((a) => (a ? { ...a, ...patch } : a))}
        seriesList={seriesList}
      />
    </div>
  );
}