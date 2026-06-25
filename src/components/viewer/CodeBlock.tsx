/**
 * CodeBlock —— 客户端代码块（含复制按钮）
 *
 * 注意：ArticleViewer 渲染的是 marked 输出的 HTML，<pre><code> 已带 hljs 高亮。
 * 这个组件作为参考实现（高阶包装），既可独立使用，
 * 也可在 ArticleViewer 中通过 dangerouslySetInnerHTML 渲染后注入复制按钮。
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** 是否显示语言标签 */
  showLanguage?: boolean;
}

export function CodeBlock({
  code,
  language,
  className,
  showLanguage = true,
}: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('已复制到剪贴板', {
        description: language ? `${language} · ${code.length} 字符` : `${code.length} 字符`,
      });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback：使用临时 textarea
      const ta = document.createElement('textarea');
      ta.value = code;
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
  };

  return (
    <div
      className={cn(
        'group relative my-4 overflow-hidden rounded-md border border-border bg-code-bg',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-code-bg/80 px-3 py-1.5 text-xs">
        {showLanguage ? (
          <span className="font-mono uppercase tracking-wider text-fg-muted">
            {language || 'text'}
          </span>
        ) : (
          <span />
        )}
        <motion.button
          type="button"
          onClick={() => void handleCopy()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-label={copied ? '已复制' : '复制代码'}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors',
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
        <code className={language ? `language-${language}` : ''}>{code}</code>
      </pre>
    </div>
  );
}