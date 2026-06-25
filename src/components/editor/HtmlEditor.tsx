/**
 * HtmlEditor —— 纯 HTML 格式的文章编辑器
 *
 * 设计原则：
 * - 用原生 textarea（避免引入 monaco/codemirror 几十 KB）
 * - 行号 + 字符数 + 自动缩进
 * - 拖拽 .html / .md 文件直接导入
 * - 文件选择器
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  Upload,
  FileUp,
  X,
  FileText,
  FileCode2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn, formatBytes } from '@/lib/utils';

export interface HtmlEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  articleId?: string;
  onSave?: (content: string) => Promise<void>;
  /** 切换为 markdown 编辑器 */
  onSwitchToMarkdown?: () => void;
}

const DEFAULT_HTML_PLACEHOLDER = `<!-- 开始写 HTML 吧 -->
<article>
  <h1>标题</h1>
  <p>在这里写 HTML · 渲染时会自动 sanitize 防 XSS。</p>
  <pre><code class="language-js">const x = 1;</code></pre>
</article>`;

interface FileType {
  ext: string;
  isMarkdown: boolean;
}

function detectFileType(name: string): FileType {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'md' || ext === 'markdown') return { ext, isMarkdown: true };
  if (ext === 'html' || ext === 'htm') return { ext, isMarkdown: false };
  return { ext, isMarkdown: ext === 'md' || ext === 'markdown' };
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = DEFAULT_HTML_PLACEHOLDER,
  minHeight = 500,
  className,
  onSwitchToMarkdown,
}: HtmlEditorProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  const stats = useMemo(() => {
    const lines = value.split('\n').length;
    const chars = value.length;
    return { lines, chars };
  }, [value]);

  /** 加载文件到编辑器 */
  const loadFile = useCallback(
    async (file: File) => {
      const t = detectFileType(file.name);
      try {
        const text = await file.text();
        onChange(text);
        setFilename(file.name);
        toast.show('已加载', {
          description: `${file.name} · ${formatBytes(file.size)} · ${t.isMarkdown ? 'Markdown' : 'HTML'}`,
        });
      } catch (e) {
        toast.show('加载失败', {
          variant: 'danger',
          description: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [onChange],
  );

  /** Tab 键缩进 */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const v = target.value;
      const next = v.substring(0, start) + '  ' + v.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  }, [onChange]);

  /** 全局拖拽（拖到 textarea 任何位置） */
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      void loadFile(files[0]!);
    },
    [loadFile],
  );

  return (
    <div
      className={cn('relative', className)}
      onDragOver={(e) => {
        if (e.dataTransfer?.types.includes('Files')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg-elevated/30 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            <FileCode2 className="h-3 w-3" />
            <span className="font-medium">HTML 模式</span>
          </span>
          {filename && (
            <span className="inline-flex items-center gap-1 text-fg-muted">
              <FileText className="h-3 w-3" /> {filename}
              <button
                onClick={() => {
                  setFilename(null);
                  onChange('');
                }}
                className="ml-1 rounded p-0.5 hover:bg-bg-subtle"
                aria-label="清空"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-fg-muted">
          <span>
            {stats.lines} 行 · {stats.chars} 字符
          </span>
          {onSwitchToMarkdown && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchToMarkdown}
              className="h-6 text-xs"
            >
              <Code2 className="h-3 w-3" /> 切到 Markdown
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 text-xs"
          >
            <FileUp className="h-3 w-3" /> 导入文件
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* 编辑区 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full resize-none bg-bg-elevated/20 p-4 font-mono text-sm leading-6 text-fg focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ minHeight }}
        />
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5"
          >
            <div className="rounded-md bg-bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-md">
              <Upload className="mr-2 inline h-4 w-4" /> 松手导入文件
            </div>
          </motion.div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="border-t border-border bg-bg-elevated/30 px-3 py-1.5 text-xs text-fg-muted">
        拖拽 <code className="rounded bg-bg px-1 py-0.5 font-mono text-[10px]">.html</code> /{' '}
        <code className="rounded bg-bg px-1 py-0.5 font-mono text-[10px]">.md</code> 文件到本区域即可导入 · Tab 缩进
      </div>
    </div>
  );
}
