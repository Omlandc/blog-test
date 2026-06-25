/**
 * ArticleViewer —— 文章渲染器（基于 react-markdown）
 *
 * 特性：
 *  - react-markdown + remark-gfm + rehype-raw + rehype-highlight + rehype-sanitize
 *  - DOMPurify 用于 URL 协议过滤（防 javascript:/data: 等）
 *  - 自动为 h1/h2/h3 生成 id（与 TOC 对齐）
 *  - 代码块右上角"复制"按钮（点击复制 + toast 提示）
 *  - 图片懒加载 + 点击打开 Lightbox
 *  - 优雅排版（CSS 变量主题）
 *
 * Props 详见 ArticleViewerProps。
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { Copy, Check, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, slugify } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { ReadingProgress } from './ReadingProgress';
import { useContentThemesSheet, resolveContentTheme } from '@/lib/content-themes';
import { TableOfContents } from './TableOfContents';
import { Lightbox, type LightboxImage } from './Lightbox';
import 'highlight.js/styles/github-dark.css';

export interface ArticleViewerProps {
  content: string;
  showToc?: boolean;
  showProgress?: boolean;
  onImageClick?: (url: string) => void;
  className?: string;
  /** 文章格式：markdown（默认）| html */
  format?: 'markdown' | 'html';
  /** 文章正文排版主题 slug（默认 'default'） */
  contentTheme?: string;
  /** 文章正文容器的 className（用于控制最大宽度、对齐等） */
  bodyClassName?: string;
}

/**
 * renderSafeHtml —— format=html 文章的安全渲染
 *  - DOMPurify 过滤
 *  - 保留 <pre><code class="language-xxx"> 用于 hljs 高亮
 *  - 移除 script/iframe 等危险标签
 */
function renderSafeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['__ALL__' as unknown as string],
    ALLOWED_ATTR: ['__ALL__' as unknown as string],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  });
}

/**
 * highlightCodeBlocks —— 给 DOM 内的 <pre><code> 应用 hljs 高亮
 *  - 重复调用安全（标记 dataset）
 *  - 给 <table> 包一层 overflow-x-auto 容器
 */
function highlightCodeBlocks(container: HTMLElement): void {
  container.querySelectorAll('pre code').forEach((el) => {
    const node = el as HTMLElement;
    if (node.dataset.highlighted === 'yes') return;
    hljs.highlightElement(node);
  });
  container.querySelectorAll('table').forEach((t) => {
    if (t.parentElement?.classList.contains('overflow-x-auto')) return;
    const wrap = document.createElement('div');
    wrap.className = 'overflow-x-auto my-4';
    t.parentNode?.insertBefore(wrap, t);
    wrap.appendChild(t);
  });
}

/**
 * 使用 DOMPurify 校验 URL：
 *  - 过滤 javascript: / vbscript: / file: 等危险协议
 *  - 过滤 data:（除非是图片）
 *  - 保留 http(s) / mailto / tel / 锚点 / 相对路径
 */
export function sanitizeUrl(input: string, opts: { allowImageData?: boolean } = {}): string {
  if (!input) return '';
  // 先用 DOMPurify 的 URL sanitizer 过滤（DOMPurify 会剥离危险协议）
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  const trimmed = cleaned.trim();
  if (!trimmed) return '';
  // 再次检查协议：javascript: / data: / vbscript: / file:
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }
  if (lower.startsWith('data:')) {
    return opts.allowImageData ? trimmed : '';
  }
  return trimmed;
}

/** slugify 中文 / 英文混合标题 */
function slugifyHeading(text: string): string {
  return slugify(text);
}

/**
 * HtmlContent —— 渲染 format=html 的文章
 *  - DOMPurify sanitize
 *  - 挂载后 hljs 高亮 + 表格 wrap
 */
function HtmlContent({
  html,
  contentTheme,
  bodyClassName,
}: {
  html: string;
  contentTheme: string;
  bodyClassName?: string;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const clean = useMemo(() => renderSafeHtml(html), [html]);
  useEffect(() => {
    if (ref.current) highlightCodeBlocks(ref.current);
  }, [clean]);
  return (
    <div
      ref={ref}
      className={cn(
        'blog-article blog-article--' + contentTheme + ' prose prose-slate max-w-none dark:prose-invert',
        bodyClassName,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** 从子节点提取纯文本（用于生成 heading id） */
function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return '';
}

/** rehype-sanitize 的扩展 schema：保留 data-* 与 className 等用于高亮与样式 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] ?? []),
      'className',
      'id',
      ['dataLanguage'],
      ['dataLanguage'],
      'data-code',
      'data-original',
    ],
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className', 'id'],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'loading',
      'decoding',
      'data-original',
      'className',
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'mark',
    'sub',
    'sup',
    'input', // task list
  ],
};

interface CodeBlockProps extends ComponentPropsWithoutRef<'code'> {
  node?: unknown;
}

function CodeBlockWrapper(props: CodeBlockProps): React.ReactElement {
  const { className, children, ...rest } = props;
  const [copied, setCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLElement>(null);

  // 从 className "language-xxx" 提取语言。有 language-xxx className 即为块级代码
  const langMatch = /language-([\w-]+)/.exec(className ?? '');
  const language = langMatch?.[1] ?? '';
  const isBlock = Boolean(langMatch);

  // 提取代码文本
  const codeText = useMemo<string>(() => {
    if (typeof children === 'string') return children.replace(/\n$/, '');
    if (Array.isArray(children)) {
      return children
        .filter((c): c is string => typeof c === 'string')
        .join('')
        .replace(/\n$/, '');
    }
    return '';
  }, [children]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      toast.success('已复制到剪贴板', {
        description: `${language || 'text'} · ${codeText.length} 字符`,
      });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = codeText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('已复制到剪贴板');
        setTimeout(() => setCopied(false), 1600);
      } catch {
        toast.danger('复制失败，请手动复制');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [codeText, language]);

  // 行内代码：直接渲染 <code>
  if (!isBlock) {
    return (
      <code ref={codeRef} className={cn('font-mono', className)} {...rest}>
        {children}
      </code>
    );
  }

  // 块级代码：包裹复制按钮
  return (
    <div className="group relative my-4 overflow-hidden rounded-md border border-border bg-code-bg">
      <div className="flex items-center justify-between border-b border-border/60 bg-code-bg/80 px-3 py-1.5 text-xs">
        <span className="font-mono uppercase tracking-wider text-fg-muted">
          {language || 'text'}
        </span>
        <motion.button
          type="button"
          onClick={() => void handleCopy()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-label={copied ? '已复制' : '复制代码'}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors',
            'text-fg-muted hover:bg-bg-subtle hover:text-fg',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              已复制
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              复制
            </>
          )}
        </motion.button>
      </div>
      <pre className="hljs-pre m-0 overflow-x-auto p-4 text-sm leading-relaxed">
        <code ref={codeRef} className={className} {...rest}>
          {children}
        </code>
      </pre>
    </div>
  );
}

/** 递归生成 React Markdown 组件映射 */
function useMarkdownComponents(): {
  components: Components;
  lightboxImages: () => LightboxImage[];
} {
  const lightboxImagesRef = useRef<LightboxImage[]>([]);

  const components: Components = useMemo<Components>(() => {
    return {
      h1: ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugifyHeading(text);
        return (
          <h1 id={id} className="article-heading" {...props}>
            {children}
          </h1>
        );
      },
      h2: ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugifyHeading(text);
        return (
          <h2 id={id} className="article-heading" {...props}>
            {children}
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugifyHeading(text);
        return (
          <h3 id={id} className="article-heading" {...props}>
            {children}
          </h3>
        );
      },
      h4: ({ children, ...props }) => {
        const text = extractText(children);
        return (
          <h4 id={slugifyHeading(text)} {...props}>
            {children}
          </h4>
        );
      },
      h5: ({ children, ...props }) => {
        const text = extractText(children);
        return (
          <h5 id={slugifyHeading(text)} {...props}>
            {children}
          </h5>
        );
      },
      h6: ({ children, ...props }) => {
        const text = extractText(children);
        return (
          <h6 id={slugifyHeading(text)} {...props}>
            {children}
          </h6>
        );
      },
      // 代码：行内 vs 块级（通过 className 是否含 language-xxx 区分）
      code: (props) => <CodeBlockWrapper {...(props as CodeBlockProps)} />,
      // pre：默认 react-markdown 会自动把 code 放进 pre，这里不重复渲染（已在 code 内处理）
      pre: ({ children }) => <>{children}</>,
      // 图片：懒加载 + 点击打开 Lightbox（通过回调或收集所有图片）
      img: ({ src, alt, ...props }) => {
        const safeSrc = typeof src === 'string' ? sanitizeUrl(src, { allowImageData: true }) : '';
        if (!safeSrc) return null;
        lightboxImagesRef.current.push({ src: safeSrc, alt: alt ?? '' });
        return (
          <span className="article-image-wrapper my-4 block">
            <img
              src={safeSrc}
              alt={alt ?? ''}
              loading="lazy"
              decoding="async"
              data-original={safeSrc}
              className="article-image mx-auto block max-h-[480px] cursor-zoom-in rounded-md border border-border object-contain"
              {...props}
            />
            {alt ? (
              <span className="mt-2 block text-center text-xs text-fg-muted">{alt}</span>
            ) : null}
          </span>
        );
      },
      // 链接：新窗口打开 + rel=noopener
      a: ({ href, children, ...props }) => {
        const safeHref = typeof href === 'string' ? sanitizeUrl(href) : '';
        const isExternal = /^https?:\/\//i.test(safeHref);
        return (
          <a
            href={safeHref || '#'}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            {...props}
          >
            {children}
          </a>
        );
      },
      // 任务列表：调整样式
      input: ({ type, checked, ...props }) => {
        if (type === 'checkbox') {
          return (
            <input
              type="checkbox"
              checked={checked ?? false}
              readOnly
              disabled
              className="mr-1.5"
              {...props}
            />
          );
        }
        return <input type={type} {...props} />;
      },
    };
  }, []);

  return {
    components,
    lightboxImages: () => lightboxImagesRef.current,
  };
}

export function ArticleViewer({
  content,
  showToc = true,
  showProgress = true,
  onImageClick,
  className,
  format = 'markdown',
  contentTheme,
  bodyClassName,
}: ArticleViewerProps): React.ReactElement {
  // 注入所有内容主题的 CSS（一次性）
  useContentThemesSheet();
  // 三级回退：传入 > site default > 'default'
  const effectiveTheme = resolveContentTheme(contentTheme);
  const articleRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<{ open: boolean; images: LightboxImage[]; index: number }>({
    open: false,
    images: [],
    index: 0,
  });

  // 每次 content 变化时重置 lightbox 收集
  const { components, lightboxImages } = useMarkdownComponents();

  useEffect(() => {
    // 清空 lightbox 图片缓存
    lightboxImages();
  }, [content, lightboxImages]);

  const handleArticleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const img = target.closest('img.article-image') as HTMLImageElement | null;
      if (!img) return;
      e.preventDefault();
      const src = img.getAttribute('data-original') || img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      if (onImageClick) {
        onImageClick(src);
        return;
      }
      // 收集当前 article 内所有图片
      const allImgs = articleRef.current?.querySelectorAll<HTMLImageElement>('img.article-image');
      const images: LightboxImage[] = allImgs
        ? Array.from(allImgs).map((el) => ({
            src: el.getAttribute('data-original') || el.getAttribute('src') || '',
            alt: el.getAttribute('alt') || '',
          }))
        : [{ src, alt }];
      const idx = images.findIndex((i) => i.src === src);
      setLightbox({ open: true, images, index: idx >= 0 ? idx : 0 });
    },
    [onImageClick],
  );

  const closeLightbox = useCallback(() => {
    setLightbox((s) => ({ ...s, open: false }));
  }, []);

  return (
    <div className={cn('relative', className)}>
      {showProgress ? <ReadingProgress /> : null}

      <div className="relative">
        <motion.article
          ref={articleRef}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'mx-auto w-full max-w-3xl px-4 py-8',
            'blog-article blog-article--' + effectiveTheme + ' prose-blog min-w-0',
          )}
          onClick={handleArticleClick}
        >
          {format === 'html' ? (
            <HtmlContent html={content} contentTheme={effectiveTheme} />
          ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeRaw,
              rehypeHighlight,
              [rehypeSanitize, sanitizeSchema],
            ]}
            components={components}
          >
            {content || ''}
          </ReactMarkdown>
          )}
        </motion.article>
      </div>

      {showToc ? (
        <aside className="hidden lg:block fixed right-4 top-32 z-10 w-64 max-h-[calc(100vh-10rem)] overflow-auto rounded-lg border border-border bg-bg-elevated/80 p-4 backdrop-blur-sm">
          <TableOfContents markdown={content} />
        </aside>
      ) : null}

      {showToc ? (
        <div className="mx-auto max-w-3xl px-4 lg:hidden">
          <TableOfContents markdown={content} />
        </div>
      ) : null}

      <Lightbox
        open={lightbox.open}
        images={lightbox.images}
        initialIndex={lightbox.index}
        onClose={closeLightbox}
      />
    </div>
  );
}