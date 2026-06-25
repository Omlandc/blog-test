/**
 * MarkdownToolbar —— 工具栏
 *
 * 提供粗体/斜体/H1-H3/列表/引用/代码块/链接/图片/分割线/撤销/重做按钮。
 * 每个按钮通过 Framer Motion 加 hover/tap 动画。
 */
import { motion } from 'framer-motion';
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolbarAction {
  /** 命令 id（用于在父组件中分发） */
  id:
    | 'bold'
    | 'italic'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'ul'
    | 'ol'
    | 'quote'
    | 'codeblock'
    | 'inlinecode'
    | 'link'
    | 'image'
    | 'hr'
    | 'undo'
    | 'redo';
  label: string;
  icon: React.ReactNode;
  /** 快捷键展示 */
  shortcut?: string;
}

export interface MarkdownToolbarProps {
  onAction: (id: ToolbarAction['id']) => void;
  onImageClick?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
}

const ACTIONS_LEFT: ToolbarAction[] = [
  { id: 'bold', label: '粗体', icon: <Bold className="h-4 w-4" />, shortcut: '⌘B' },
  { id: 'italic', label: '斜体', icon: <Italic className="h-4 w-4" />, shortcut: '⌘I' },
  { id: 'h1', label: '一级标题', icon: <Heading1 className="h-4 w-4" /> },
  { id: 'h2', label: '二级标题', icon: <Heading2 className="h-4 w-4" /> },
  { id: 'h3', label: '三级标题', icon: <Heading3 className="h-4 w-4" /> },
  { id: 'ul', label: '无序列表', icon: <List className="h-4 w-4" /> },
  { id: 'ol', label: '有序列表', icon: <ListOrdered className="h-4 w-4" /> },
  { id: 'quote', label: '引用', icon: <Quote className="h-4 w-4" /> },
  { id: 'codeblock', label: '代码块', icon: <Code2 className="h-4 w-4" /> },
  { id: 'inlinecode', label: '行内代码', icon: <Code className="h-4 w-4" /> },
  { id: 'link', label: '链接', icon: <LinkIcon className="h-4 w-4" />, shortcut: '⌘K' },
  { id: 'image', label: '图片', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'hr', label: '分割线', icon: <Minus className="h-4 w-4" /> },
];

const ACTIONS_RIGHT: ToolbarAction[] = [
  { id: 'undo', label: '撤销', icon: <Undo2 className="h-4 w-4" />, shortcut: '⌘Z' },
  { id: 'redo', label: '重做', icon: <Redo2 className="h-4 w-4" />, shortcut: '⌘⇧Z' },
];

export function MarkdownToolbar({
  onAction,
  onImageClick,
  canUndo = false,
  canRedo = false,
  disabled = false,
}: MarkdownToolbarProps): React.ReactElement {
  const renderButton = (action: ToolbarAction, opts?: { isImage?: boolean }) => {
    const isHistoryBtn = action.id === 'undo' || action.id === 'redo';
    const isDisabled =
      disabled ||
      (isHistoryBtn && action.id === 'undo' && !canUndo) ||
      (isHistoryBtn && action.id === 'redo' && !canRedo);

    return (
      <motion.button
        key={action.id}
        type="button"
        title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
        aria-label={action.label}
        disabled={isDisabled}
        onClick={() => {
          if (opts?.isImage && onImageClick) {
            onImageClick();
          } else {
            onAction(action.id);
          }
        }}
        whileHover={isDisabled ? undefined : { scale: 1.05 }}
        whileTap={isDisabled ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors',
          'hover:bg-bg-subtle hover:text-fg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        )}
      >
        {action.icon}
      </motion.button>
    );
  };

  return (
    <div
      role="toolbar"
      aria-label="Markdown 工具栏"
      className="flex flex-wrap items-center gap-1 border-b border-border bg-bg-elevated/60 px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-0.5">
        {ACTIONS_LEFT.map((a) => renderButton(a, { isImage: a.id === 'image' }))}
      </div>
      <div className="mx-1 h-6 w-px bg-border" />
      <div className="flex items-center gap-0.5">
        {ACTIONS_RIGHT.map((a) => renderButton(a))}
      </div>
    </div>
  );
}