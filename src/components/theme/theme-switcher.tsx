/**
 * ThemeSwitcher —— 主题切换器
 * - 默认下拉式
 * - 可选 grid 网格模式
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ThemeSwitcherProps {
  /** 'dropdown' | 'grid' */
  variant?: 'dropdown' | 'grid';
  className?: string;
}

export function ThemeSwitcher({
  variant = 'dropdown',
  className,
}: ThemeSwitcherProps): React.ReactElement {
  const { theme, themes, setTheme, currentTheme } = useTheme();

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
        {themes.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            selected={theme === t.id}
            onSelect={() => setTheme(t.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>主题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => setTheme(t.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full border border-border"
                style={{ background: t.preview.primary }}
                aria-hidden
              />
              <span>{t.name}</span>
            </div>
            {theme === t.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: import('@/lib/types').Theme;
  selected: boolean;
  onSelect: () => void;
}): React.ReactElement {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex flex-col items-start gap-2 rounded-lg border bg-bg-elevated p-3 text-left shadow-soft transition-colors',
        selected ? 'border-primary ring-2 ring-ring' : 'border-border hover:border-primary/50',
      )}
    >
      <div
        className="h-12 w-full rounded-md border border-border"
        style={{ background: theme.preview.bg }}
      >
        <div className="flex h-full items-center justify-around p-1">
          <span
            className="h-2 w-6 rounded-full"
            style={{ background: theme.preview.primary }}
          />
          <span
            className="h-2 w-6 rounded-full"
            style={{ background: theme.preview.accent }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: theme.preview.fg }}
          />
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div>
          <div className="text-sm font-medium text-fg">{theme.name}</div>
          <div className="text-xs text-fg-muted">{theme.description}</div>
        </div>
        {selected ? <Check className="h-4 w-4 text-primary" /> : null}
      </div>
    </motion.button>
  );
}

/** 主题切换浮层（带 AnimatePresence 切换动画） */
export function ThemePanel({ className }: { className?: string }): React.ReactElement {
  const { theme } = useTheme();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className={className}
      />
    </AnimatePresence>
  );
}