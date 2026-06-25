/**
 * ContentThemePicker —— 文章正文主题选择器
 *
 * 三种变体：
 *  - inline：横排（编辑器工具栏）
 *  - grid：分类网格（画廊）
 *  - dropdown：下拉（紧凑场景）
 *
 * 关键：完全受控，由父组件管 active slug
 * 切换 = 调 onChange(slug)，由父组件 setState
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Palette, Plus } from 'lucide-react';
import {
  PRESET_CONTENT_THEMES,
  type ContentTheme,
} from '@/lib/content-themes';
import { cn } from '@/lib/utils';

export interface ContentThemePickerProps {
  /** 当前选中的 slug（受控） */
  value?: string;
  onChange?: (slug: string) => void;
  className?: string;
  variant?: 'inline' | 'grid' | 'dropdown';
  /** 是否在 inline 变体显示"使用中"勾 */
  showActive?: boolean;
}

const CATEGORY_LABEL: Record<ContentTheme['category'], string> = {
  minimal: '极简',
  classic: '经典',
  decorative: '装饰',
  experimental: '实验',
};

function ThemeThumb({
  theme,
  active,
  onClick,
}: {
  theme: ContentTheme;
  active: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-stretch overflow-hidden rounded-lg border-2 text-left transition-all',
        active
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-sm',
      )}
    >
      <div
        className="relative h-16 w-full overflow-hidden"
        style={{ background: theme.preview.bg, color: theme.preview.fg }}
      >
        <div className="absolute inset-2 flex flex-col gap-1">
          <div
            className="h-2 w-3/4 rounded-sm"
            style={{ background: theme.preview.accent, opacity: 0.85 }}
          />
          <div
            className="h-1.5 w-full rounded-sm"
            style={{ background: theme.preview.fg, opacity: 0.4 }}
          />
          <div
            className="h-1.5 w-2/3 rounded-sm"
            style={{ background: theme.preview.fg, opacity: 0.4 }}
          />
        </div>
        {active && (
          <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-fg">
            <Check className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      <div className="bg-bg-elevated px-2 py-1.5">
        <div className="text-xs font-medium text-fg">{theme.name}</div>
        <div className="truncate text-[10px] text-fg-muted">{theme.description}</div>
      </div>
    </button>
  );
}

export function ContentThemePicker({
  value,
  onChange,
  className,
  variant = 'inline',
  showActive = true,
}: ContentThemePickerProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const current = value ?? 'default';

  const handlePick = (slug: string): void => {
    onChange?.(slug);
    setOpen(false);
  };

  if (variant === 'grid') {
    const groups = new Map<ContentTheme['category'], ContentTheme[]>();
    for (const t of PRESET_CONTENT_THEMES) {
      const arr = groups.get(t.category) ?? [];
      arr.push(t);
      groups.set(t.category, arr);
    }
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from(groups.entries()).map(([cat, themes]) => (
          <div key={cat}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {CATEGORY_LABEL[cat]}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {themes.map((t) => (
                <ThemeThumb
                  key={t.slug}
                  theme={t}
                  active={t.slug === current}
                  onClick={() => handlePick(t.slug)}
                />
              ))}
              {cat === 'minimal' && (
                <a
                  href="/admin/content-themes"
                  className="flex h-full min-h-[88px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-fg-muted hover:border-primary hover:text-primary"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">自定义</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    const t = PRESET_CONTENT_THEMES.find((x) => x.slug === current) ?? PRESET_CONTENT_THEMES[0]!;
    return (
      <div className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs hover:bg-bg-subtle"
        >
          <span
            className="inline-block h-3 w-3 rounded-sm border"
            style={{ background: t.preview.bg, borderColor: t.preview.fg }}
          />
          <Palette className="h-3 w-3" />
          <span>{t.name}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-border bg-bg-elevated p-2 shadow-lg"
            >
              <div className="grid grid-cols-3 gap-2">
                {PRESET_CONTENT_THEMES.map((t2) => (
                  <ThemeThumb
                    key={t2.slug}
                    theme={t2}
                    active={t2.slug === current}
                    onClick={() => handlePick(t2.slug)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // inline
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <Palette className="h-3.5 w-3.5 text-fg-muted" />
      {PRESET_CONTENT_THEMES.map((t) => {
        const isActive = t.slug === current;
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => handlePick(t.slug)}
            title={t.description}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-bg-elevated text-fg-muted hover:border-primary/40 hover:text-fg',
            )}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm border"
              style={{ background: t.preview.bg, borderColor: t.preview.fg }}
            />
            {t.name}
            {isActive && showActive && <Check className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}
