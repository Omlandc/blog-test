/**
 * useEditorState —— MarkdownEditor 的状态管理 hook
 *
 * 负责：
 *  - 内容与光标/选区
 *  - 历史栈（撤销/重做，限制 50 步）
 *  - 模式切换（split / edit / preview）
 *  - 自动保存（防抖可配）
 *  - 字数统计（中英文字符分别计算）
 *  - 阅读时长预估
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { estimateReadingTime } from '@/lib/utils';

export type EditorMode = 'split' | 'edit' | 'preview';

export interface EditorStats {
  totalChars: number;
  chineseChars: number;
  englishChars: number;
  digitChars: number;
  spaceChars: number;
  lineCount: number;
  readingMinutes: number;
}

export interface UseEditorStateOptions {
  initialValue?: string;
  initialMode?: EditorMode;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
}

export interface UseEditorStateResult {
  /** 当前内容 */
  content: string;
  /** 设置内容（不入历史栈） */
  setContent: (next: string) => void;
  /** 设置内容并推入历史栈 */
  updateContent: (next: string) => void;
  /** 当前显示模式 */
  mode: EditorMode;
  setMode: (m: EditorMode) => void;
  /** 历史栈状态 */
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  /** 替换选区文本，返回新的 content 和下一次光标位置 */
  replaceSelection: (replacement: string) => void;
  /** 在当前光标位置插入文本 */
  insertAtCursor: (text: string) => void;
  /** 自动保存状态 */
  saveState: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  /** 手动触发保存 */
  save: () => Promise<void>;
  /** 统计信息 */
  stats: EditorStats;
  /** textarea ref（由消费方绑定到 <textarea>） */
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const HISTORY_LIMIT = 50;

/** 计算字符统计：中英文 / 数字 / 空格分别计数 */
export function computeStats(content: string): EditorStats {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const englishChars = (content.match(/[A-Za-z]/g) ?? []).length;
  const digitChars = (content.match(/[0-9]/g) ?? []).length;
  const spaceChars = (content.match(/\s/g) ?? []).length;
  const lineCount = content.length === 0 ? 0 : content.split('\n').length;
  const totalChars = content.length;
  const readingMinutes = estimateReadingTime(content);
  return {
    totalChars,
    chineseChars,
    englishChars,
    digitChars,
    spaceChars,
    lineCount,
    readingMinutes,
  };
}

export function useEditorState(opts: UseEditorStateOptions): UseEditorStateResult {
  const {
    initialValue = '',
    initialMode = 'split',
    autoSave = false,
    autoSaveDelay = 1500,
    onChange,
    onSave,
  } = opts;

  const [content, setContentState] = useState<string>(initialValue);
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [saveState, setSaveState] = useState<UseEditorStateResult['saveState']>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // 历史栈
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const [, forceTick] = useState(0);
  const bumpHistory = () => forceTick((n) => (n + 1) % 1_000_000);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pushHistory = useCallback((prev: string, next: string) => {
    if (prev === next) return;
    past.current.push(prev);
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
  }, []);

  const setContent = useCallback(
    (next: string) => {
      setContentState((prev) => {
        if (prev !== next) pushHistory(prev, next);
        return next;
      });
    },
    [pushHistory],
  );

  const updateContent = useCallback(
    (next: string) => {
      setContentState((prev) => {
        if (prev !== next) {
          pushHistory(prev, next);
          onChange?.(next);
        }
        return next;
      });
    },
    [onChange, pushHistory],
  );

  // 自动保存
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef<string>(initialValue);
  latestContent.current = content;

  const performSave = useCallback(async () => {
    if (!onSave) {
      setSaveState('idle');
      return;
    }
    setSaveState('saving');
    try {
      await onSave(latestContent.current);
      setSaveState('saved');
      setLastSavedAt(Date.now());
    } catch (err) {
      console.error('[MarkdownEditor] auto-save failed:', err);
      setSaveState('error');
    }
  }, [onSave]);

  // 触发自动保存
  useEffect(() => {
    if (!autoSave || !onSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveState('pending');
    autoSaveTimer.current = setTimeout(() => {
      void performSave();
    }, autoSaveDelay);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [content, autoSave, autoSaveDelay, onSave, performSave]);

  const save = useCallback(async () => {
    if (!onSave) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await performSave();
  }, [onSave, performSave]);

  // 撤销 / 重做
  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  const undo = useCallback(() => {
    setContentState((current) => {
      const prev = past.current.pop();
      if (prev === undefined) return current;
      future.current.push(current);
      onChange?.(prev);
      return prev;
    });
    bumpHistory();
  }, [onChange]);

  const redo = useCallback(() => {
    setContentState((current) => {
      const next = future.current.pop();
      if (next === undefined) return current;
      past.current.push(current);
      onChange?.(next);
      return next;
    });
    bumpHistory();
  }, [onChange]);

  // 替换选区
  const replaceSelection = useCallback((replacement: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      // fallback：追加到末尾
      setContentState((prev) => {
        const next = prev + replacement;
        pushHistory(prev, next);
        onChange?.(next);
        return next;
      });
      return;
    }
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = before + replacement + after;
    setContentState((prev) => {
      if (prev !== next) {
        pushHistory(prev, next);
        onChange?.(next);
      }
      return next;
    });
    // 恢复光标到插入文本末尾
    requestAnimationFrame(() => {
      const pos = start + replacement.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }, [content, onChange, pushHistory]);

  const insertAtCursor = useCallback((text: string) => {
    replaceSelection(text);
  }, [replaceSelection]);

  const stats = useMemo(() => computeStats(content), [content]);

  return {
    content,
    setContent,
    updateContent,
    mode,
    setMode,
    canUndo,
    canRedo,
    undo,
    redo,
    replaceSelection,
    insertAtCursor,
    saveState,
    lastSavedAt,
    save,
    stats,
    textareaRef,
  };
}