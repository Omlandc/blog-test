/**
 * MarkdownEditor —— 主编辑器组件
 *
 * 特性：
 *  - 三种模式：split（双栏）/ edit（仅编辑）/ preview（仅预览）
 *  - 工具栏：粗体/斜体/标题/列表/引用/代码/链接/图片/分割线/撤销/重做
 *  - 键盘快捷键：⌘B / ⌘I / ⌘K / ⌘S
 *  - 粘贴图片 → 自动上传并插入
 *  - 拖拽图片到编辑区 → 自动上传并插入
 *  - 自动保存（防抖 1.5s），可通过 autoSave=false 关闭
 *  - 字数统计 + 阅读时长
 *  - 主题跟随（所有颜色用 CSS 变量）
 *  - onChange / onSave 回调
 *
 * Props 详见 MarkdownEditorProps。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Columns2,
  Eye,
  Loader2,
  Pencil,
  Save,
  Check,
  Code2,
  FileUp,
  Sun,
  Moon,
  Copy,
  MessageCircle,
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderSafeMarkdown } from '@/lib/markdown';
import { toast } from '@/components/ui/toast';
import { useImageUploader } from '@/lib/images';
import { MarkdownToolbar, type ToolbarAction } from './MarkdownToolbar';
import { ImageUploadButton } from './ImageUploadButton';
import { useEditorState, type EditorMode, type EditorStats } from './useEditorState';
import { HtmlEditor } from './HtmlEditor';
import { ContentThemePicker } from '@/components/content-themes/ContentThemePicker';
import { useContentThemesSheet, resolveContentTheme } from '@/lib/content-themes';
import { Button } from '@/components/ui/button';
import { useTheme as useUiTheme } from '@/lib/theme';
import { htmlToInlineStyle, copyToClipboard } from '@/lib/content-themes/inline-style';
import { ImageHostingSettingsButton } from '@/components/images/ImageHostingSettings';

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  autoSave?: boolean;
  autoSaveDelay?: number;
  placeholder?: string;
  articleId?: string;
  minHeight?: number;
  showToolbar?: boolean;
  initialMode?: EditorMode;
  className?: string;
  /** 当前格式（默认 markdown，兼容老文章） */
  format?: 'markdown' | 'html';
  /** 格式变化回调 */
  onFormatChange?: (format: 'markdown' | 'html') => void;
  /** 文章正文主题 slug */
  contentTheme?: string;
  /** 内容主题变化回调 */
  onContentThemeChange?: (slug: string) => void;
}

const DEFAULT_PLACEHOLDER = '# 开始写作…\n\n在这里输入 Markdown 文本。\n\n- 支持 **粗体**、*斜体*、`行内代码`\n- 支持 [链接](https://example.com) 与 ![图片](url)\n- 支持 ```代码块```\n';

function SaveIndicator({
  state,
  lastSavedAt,
}: {
  state: ReturnType<typeof useEditorState>['saveState'];
  lastSavedAt: number | null;
}): React.ReactElement {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-fg-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> 保存中…
      </span>
    );
  }
  if (state === 'pending') {
    return <span className="text-fg-muted">编辑中…</span>;
  }
  if (state === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <Check className="h-3 w-3" />
        已保存 · {new Date(lastSavedAt).toLocaleTimeString('zh-CN')}
      </span>
    );
  }
  if (state === 'error') {
    return <span className="text-danger">保存失败</span>;
  }
  return <span className="text-fg-subtle">未启用自动保存</span>;
}

function StatsBadge({ stats }: { stats: EditorStats }): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-muted">
      <span>共 <strong className="text-fg">{stats.totalChars}</strong> 字</span>
      <span>中 <strong className="text-fg">{stats.chineseChars}</strong></span>
      <span>英 <strong className="text-fg">{stats.englishChars}</strong></span>
      <span>行 <strong className="text-fg">{stats.lineCount}</strong></span>
      <span>≈ <strong className="text-fg">{stats.readingMinutes}</strong> 分钟阅读</span>
    </div>
  );
}

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: EditorMode;
  onChange: (m: EditorMode) => void;
}): React.ReactElement {
  const options: { value: EditorMode; label: string; icon: React.ReactNode }[] = [
    { value: 'split', label: '双栏', icon: <Columns2 className="h-3.5 w-3.5" /> },
    { value: 'edit', label: '编辑', icon: <Pencil className="h-3.5 w-3.5" /> },
    { value: 'preview', label: '预览', icon: <Eye className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-subtle/50 p-0.5">
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <motion.button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            whileHover={{ scale: active ? 1 : 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={cn(
              'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors',
              active
                ? 'bg-bg-elevated text-fg shadow-soft'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * 主组件
 */
export function MarkdownEditor(props: MarkdownEditorProps): React.ReactElement {
  const {
    value,
    onChange,
    onSave,
    autoSave = false,
    autoSaveDelay = 1500,
    placeholder = DEFAULT_PLACEHOLDER,
    articleId: _articleId,
    minHeight = 480,
    showToolbar = true,
    initialMode = 'split',
    className,
    format = 'markdown',
    onFormatChange,
    contentTheme,
    onContentThemeChange,
  } = props;

  // 注入所有内容主题的 CSS（编辑器预览用）
  useContentThemesSheet();

  // HTML 模式：直接渲染 HtmlEditor
  if (format === 'html') {
    return (
      <HtmlEditor
        value={value ?? ''}
        onChange={onChange ?? (() => {})}
        onSave={onSave}
        minHeight={minHeight}
        className={className}
        onSwitchToMarkdown={() => onFormatChange?.('markdown')}
      />
    );
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFileIntoEditor = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const onChangeFn = onChange ?? (() => {});
      onChangeFn(text);
      const ext = file.name.toLowerCase().split('.').pop() ?? '';
      if (ext === 'html' || ext === 'htm') {
        onFormatChange?.('html');
      }
    } catch (e) {
      // best-effort
    }
  }, [onChange, onFormatChange]);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void loadFileIntoEditor(f);
    e.target.value = '';
  }, [loadFileIntoEditor]);

  const editor = useEditorState({
    initialValue: value ?? '',
    initialMode,
    autoSave,
    autoSaveDelay,
    onChange,
    onSave,
  });

  // 当外部 value 变化时同步到内部（受控模式）
  const lastExternalValue = useRef<string | undefined>(value);
  useEffect(() => {
    if (value !== undefined && value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      if (value !== editor.content) {
        editor.setContent(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { upload } = useImageUploader();

  /** 工具栏动作分发 */
  const handleAction = useCallback(
    (id: ToolbarAction['id']) => {
      const { replaceSelection, content, textareaRef, undo, redo } = editor;
      const ta = textareaRef.current;
      const start = ta?.selectionStart ?? content.length;
      const end = ta?.selectionEnd ?? content.length;
      const before = content.slice(0, start);
      const selected = content.slice(start, end);
      const after = content.slice(end);

      const wrap = (left: string, right: string, fallback: string): void => {
        const inner = selected || fallback;
        const inserted = `${left}${inner}${right}`;
        replaceSelection(inserted);
      };
      const prefixLines = (prefix: string, fallback: string): void => {
        const lines = (selected || fallback).split('\n');
        const inserted = lines.map((l) => `${prefix}${l}`).join('\n');
        replaceSelection(inserted);
      };

      switch (id) {
        case 'bold':
          wrap('**', '**', '粗体文本');
          break;
        case 'italic':
          wrap('*', '*', '斜体文本');
          break;
        case 'h1':
          prefixLines('# ', '一级标题');
          break;
        case 'h2':
          prefixLines('## ', '二级标题');
          break;
        case 'h3':
          prefixLines('### ', '三级标题');
          break;
        case 'ul':
          prefixLines('- ', '列表项');
          break;
        case 'ol': {
          const lines = (selected || '列表项').split('\n');
          const inserted = lines
            .map((l, i) => `${i + 1}. ${l}`)
            .join('\n');
          replaceSelection(inserted);
          break;
        }
        case 'quote':
          prefixLines('> ', '引用文本');
          break;
        case 'codeblock': {
          const lang = '';
          const code = selected || 'console.log("Hello")';
          replaceSelection(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
          break;
        }
        case 'inlinecode':
          wrap('`', '`', '代码');
          break;
        case 'link': {
          const text = selected || '链接文本';
          const url = window.prompt('请输入链接 URL：', 'https://');
          if (url === null) return;
          replaceSelection(`[${text}](${url || 'https://'})`);
          break;
        }
        case 'image':
          // image 由 ImageUploadButton 处理
          break;
        case 'hr':
          replaceSelection(`\n\n---\n\n`);
          break;
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        default:
          break;
      }

      // 触发 onChange
      void before;
      void after;
    },
    [editor],
  );

  /** 处理图片上传完成 → 插入 Markdown 语法 */
  const handleImageUploaded = useCallback(
    (info: { url: string; alt: string; filename?: string }) => {
      const md = `![${info.alt || 'image'}](${info.url})`;
      editor.insertAtCursor(md);
    },
    [editor],
  );

  /** 粘贴图片 */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const result = await upload(file);
            const alt = file.name.replace(/\.[^.]+$/, '') || 'pasted-image';
            const md = `![${alt}](${result.url})`;
            editor.insertAtCursor(md);
            toast.success('已插入粘贴图片', { description: file.name });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            toast.danger('粘贴图片上传失败', { description: msg });
          }
          return;
        }
      }
    },
    [upload, editor],
  );

  /** 拖拽图片 */
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file) continue;
        if (!file.type.startsWith('image/')) continue;
        e.preventDefault();
        try {
          const result = await upload(file);
          const alt = file.name.replace(/\.[^.]+$/, '') || 'dropped-image';
          const md = `![${alt}](${result.url})`;
          editor.insertAtCursor(md);
          toast.success('已插入拖拽图片', { description: file.name });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          toast.danger('拖拽图片上传失败', { description: msg });
        }
      }
    },
    [upload, editor],
  );

  /** 阻止默认拖拽打开（编辑区内） */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault();
    }
  }, []);

  /** 键盘快捷键 */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        handleAction('bold');
      } else if (key === 'i') {
        e.preventDefault();
        handleAction('italic');
      } else if (key === 'k') {
        e.preventDefault();
        handleAction('link');
      } else if (key === 's') {
        e.preventDefault();
        if (onSave) {
          void editor.save();
        }
      } else if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        editor.redo();
      }
    },
    [handleAction, onSave, editor],
  );

  const renderedHtml = useMemo(
    () => renderSafeMarkdown(editor.content || `*${placeholder}*`),
    [editor.content, placeholder],
  );

  const showEdit = editor.mode === 'split' || editor.mode === 'edit';
  const showPreview = editor.mode === 'split' || editor.mode === 'preview';

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border bg-bg shadow-soft',
        className,
      )}
      data-article-id={_articleId}
      onDragOver={(e) => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); } }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer?.files?.[0];
        if (f) void loadFileIntoEditor(f);
      }}
    >
      {/* 顶部栏：工具栏 + 模式切换 + 自动保存状态 */}
      {showToolbar ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-elevated/60 px-3 py-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-fg-muted hover:bg-bg-subtle hover:text-fg"
            title="导入 .md / .html 文件"
          >
            <FileUp className="h-3 w-3" /> 导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.html,.htm,.txt"
            className="hidden"
            onChange={handleFilePick}
          />
          <ImageHostingSettingsButton />
          {onFormatChange && (
            <button
              type="button"
              onClick={() => onFormatChange('html')}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-fg-muted hover:bg-bg-subtle hover:text-fg"
              title="切换为 HTML 编辑器"
            >
              <Code2 className="h-3 w-3" /> HTML
            </button>
          )}
          {onContentThemeChange && (
            <div className="ml-1 border-l border-border pl-2">
              <ContentThemePicker
                value={contentTheme}
                onChange={onContentThemeChange}
                variant="inline"
                showActive={false}
              />
            </div>
          )}
          <MarkdownToolbar
            onAction={handleAction}
            canUndo={editor.canUndo}
            canRedo={editor.canRedo}
          />
          {/* WeMD-style quick actions: dark mode / copy HTML / copy to WeChat */}
          <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
            <ThemeToggleButton />
            <CopyHtmlButton content={editor.content} themeSlug={resolveContentTheme(contentTheme)} />
            <CopyWeChatButton content={editor.content} themeSlug={resolveContentTheme(contentTheme)} />
            <PreviewCopyHtmlButton content={editor.content} themeSlug={resolveContentTheme(contentTheme)} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SaveIndicator state={editor.saveState} lastSavedAt={editor.lastSavedAt} />
            {onSave ? (
              <motion.button
                type="button"
                title="保存 (⌘S)"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => void editor.save()}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-fg hover:opacity-90"
              >
                <Save className="h-3.5 w-3.5" />
                保存
              </motion.button>
            ) : null}
            <ImageUploadButton onUploaded={handleImageUploaded} label="插入图片" />
            <ModeSwitcher mode={editor.mode} onChange={editor.setMode} />
          </div>
        </div>
      ) : null}

      {/* 编辑 / 预览区域 */}
      <div
        className="relative flex w-full"
        style={{ minHeight }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <AnimatePresence mode="wait" initial={false}>
          {showEdit ? (
            <motion.div
              key="edit-pane"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex flex-col',
                showPreview ? 'w-1/2 border-r border-border' : 'w-full',
              )}
              style={{ minHeight }}
            >
              <textarea
                ref={editor.textareaRef}
                value={editor.content}
                onChange={(e) => editor.updateContent(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className={cn(
                  'h-full w-full flex-1 resize-none bg-bg px-5 py-4 font-mono text-sm leading-relaxed text-fg',
                  'placeholder:text-fg-subtle focus:outline-none',
                )}
                style={{ minHeight }}
              />
            </motion.div>
          ) : null}

          {showPreview ? (
            <motion.div
              key="preview-pane"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'prose-blog overflow-auto px-5 py-4',
                'blog-article blog-article--' + resolveContentTheme(contentTheme),
                showEdit ? 'w-1/2' : 'w-full',
              )}
              style={{ minHeight }}
              // 受信任内容已经过 DOMPurify 过滤（renderSafeMarkdown）
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* 底部状态栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-bg-elevated/60 px-3 py-2 text-xs text-fg-muted">
        <StatsBadge stats={editor.stats} />
        <div className="flex items-center gap-2">
          <span>⌘B 粗体 · ⌘I 斜体 · ⌘K 链接 · ⌘S 保存</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WeMD-style toolbar buttons                                        */
/* ------------------------------------------------------------------ */

function ThemeToggleButton(): React.ReactElement {
  const { theme, setTheme, themes } = useUiTheme();
  const isDark = theme === 'dark' || theme === 'cyberpunk';
  const next = isDark ? 'light' : 'dark';
  const nextLabel = themes.find((t) => t.id === next)?.name ?? next;
  return (
    <button
      type="button"
      onClick={() => setTheme(next as typeof theme)}
      title={`切换主题（当前 ${theme} → ${nextLabel}）`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg-elevated text-fg-muted hover:bg-bg-subtle hover:text-fg"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}

function CopyHtmlButton({ content, themeSlug }: { content: string; themeSlug: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const html = renderSafeMarkdown(content || '');
        const ok = await copyToClipboard(html, { inlineStyle: false });
        if (ok) {
          setCopied(true);
          toast.show('HTML 已复制', { description: 'class 形式 · 适用于支持自定义 CSS 的平台' });
          setTimeout(() => setCopied(false), 1500);
        } else {
          toast.show('复制失败', { variant: 'danger', description: '请检查浏览器剪贴板权限' });
        }
      }}
      title="复制渲染后的 HTML（保留 class 名）"
      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 text-xs text-fg-muted hover:bg-bg-subtle hover:text-fg"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      HTML
    </button>
  );
}

function CopyWeChatButton({ content, themeSlug }: { content: string; themeSlug: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const html = renderSafeMarkdown(content || '');
        const ok = await copyToClipboard(html, { inlineStyle: true, themeSlug });
        if (ok) {
          setCopied(true);
          toast.show('已复制到剪贴板', {
            description: 'inline style 形式 · 直接粘贴到公众号编辑器',
          });
          setTimeout(() => setCopied(false), 1500);
        } else {
          toast.show('复制失败', { variant: 'danger', description: '请检查浏览器剪贴板权限' });
        }
      }}
      title="复制为 inline style（适合公众号粘贴）"
      className="inline-flex h-7 items-center gap-1 rounded-md bg-[#07c160] px-2.5 text-xs font-medium text-white hover:bg-[#06a052]"
    >
      {copied ? <Check className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
      复制到公众号
    </button>
  );
}

/**
 * 「查看复制后 HTML」按钮 —— 弹出模态显示 inline style 转换后的 HTML 源码
 * 用于调试复制效果、对比浏览器自带选区复制
 */
function PreviewCopyHtmlButton({ content, themeSlug }: { content: string; themeSlug: string }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [size, setSize] = useState(0);
  const handleClick = (): void => {
    const raw = renderSafeMarkdown(content || '');
    const inlined = htmlToInlineStyle(raw, themeSlug);
    setHtml(inlined);
    setSize(new Blob([inlined]).size);
    setOpen(true);
  };
  const copyRaw = async (): Promise<void> => {
    const ok = await copyToClipboard(html, { inlineStyle: false });
    if (ok) {
      toast.show('已复制 HTML 源码', { description: '（不含 inline style）' });
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="查看复制到公众号时的实际 HTML（调试用）"
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 text-xs text-fg-muted hover:bg-bg-subtle hover:text-fg"
      >
        <FileSearch className="h-3 w-3" />
        复制 HTML
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-fg">复制到公众号时的 HTML</h3>
                <p className="text-xs text-fg-muted">
                  theme = <code className="rounded bg-bg-subtle px-1">{themeSlug}</code>
                  {' · '}
                  <span className="text-fg-subtle">{(size / 1024).toFixed(1)} KB</span>
                  {' · '}
                  <span className="text-fg-subtle">{(html.match(/style="/g) || []).length} 个 inline style</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyRaw}
                  className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg hover:bg-bg-subtle"
                >
                  复制 HTML
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary px-2 py-1 text-xs text-primary-fg hover:opacity-90"
                >
                  关闭
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-bg-subtle/30 p-4 text-xs leading-relaxed text-fg">
              <code>{html}</code>
            </pre>
            <div className="border-t border-border bg-bg-elevated/50 px-4 py-2 text-xs text-fg-muted">
              💡 对比方法：在右栏「预览」里手动选中文字 → Ctrl+C → 粘贴到任意富文本编辑器（如 Word/Notion）查看效果
            </div>
          </div>
        </div>
      )}
    </>
  );
}
