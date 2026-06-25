/**
 * TableOfContents —— 文章目录（基于 h1/h2/h3，scroll spy）
 *
 * 解析传入的 markdown（解析 # / ## / ###）生成目录项，
 * 或直接接收外部 headings 数组。监听 scroll 高亮当前可见项。
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TocItem {
  /** DOM id */
  id: string;
  /** 显示文本 */
  text: string;
  /** 层级（1-3） */
  level: 1 | 2 | 3;
}

export interface TableOfContentsProps {
  /** markdown 源（自动从中抽取标题） */
  markdown?: string;
  /** 直接传入已解析的标题列表（与 markdown 二选一，优先级高） */
  headings?: TocItem[];
  /** 是否显示（移动端折叠） */
  collapsibleOnMobile?: boolean;
  /** 滚动监听偏移量（与 sticky 头部高度对齐） */
  scrollOffset?: number;
  className?: string;
}

/** 从 markdown 抽取 # ## ### 标题并自动生成 id */
export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = md.split('\n');
  let inFence = false;
  const counter = new Map<string, number>();
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const levelRaw = m[1]?.length ?? 0;
    if (levelRaw < 1 || levelRaw > 3) continue;
    const text = (m[2] ?? '').trim();
    if (!text) continue;
    const slug = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
      .replace(/--+/g, '-');
    const count = counter.get(slug) ?? 0;
    counter.set(slug, count + 1);
    const id = count === 0 ? slug : `${slug}-${count}`;
    items.push({ id, text, level: levelRaw as 1 | 2 | 3 });
  }
  return items;
}

export function TableOfContents({
  markdown,
  headings,
  collapsibleOnMobile = true,
  scrollOffset = 80,
  className,
}: TableOfContentsProps): React.ReactElement | null {
  const items = useMemo<TocItem[]>(() => {
    if (headings && headings.length > 0) return headings;
    if (markdown) return extractToc(markdown);
    return [];
  }, [headings, markdown]);

  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${scrollOffset + 10}px 0px -60% 0px`,
        threshold: [0, 1],
      },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items, scrollOffset]);

  if (items.length === 0) return null;

  const handleClick = (id: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* 桌面端：右侧悬浮 */}
      <nav
        aria-label="文章目录"
        className={cn(
          'hidden lg:block',
          'sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto',
          'w-64 shrink-0',
          className,
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
          <BookText className="h-3.5 w-3.5" />
          目录
        </div>
        <ul className="space-y-1 border-l border-border text-sm">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    'block w-full truncate border-l-2 py-1 pr-2 text-left transition-all',
                    item.level === 2 ? 'pl-5' : item.level === 3 ? 'pl-8' : 'pl-3',
                    active
                      ? '-ml-px border-primary font-medium text-primary'
                      : '-ml-px border-transparent text-fg-muted hover:text-fg',
                  )}
                  title={item.text}
                >
                  {item.text}
                  {active ? (
                    <motion.span
                      layoutId="toc-active-bar"
                      className="absolute"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 移动端：顶部抽屉 */}
      {collapsibleOnMobile ? (
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="mb-2 inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
            aria-expanded={mobileOpen}
          >
            <BookText className="h-3.5 w-3.5" />
            目录 ({items.length})
          </button>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-md border border-border bg-bg-elevated"
            >
              <ul className="max-h-64 overflow-auto p-2 text-sm">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(item.id)}
                      className={cn(
                        'block w-full truncate rounded px-2 py-1 text-left',
                        item.level === 2 ? 'pl-4' : item.level === 3 ? 'pl-6' : 'pl-2',
                        item.id === activeId
                          ? 'bg-primary/10 text-primary'
                          : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                      )}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}