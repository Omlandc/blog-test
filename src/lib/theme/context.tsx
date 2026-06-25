/**
 * ThemeProvider —— 管理当前主题、应用到 <html data-theme="...">
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeContextValue, ThemeProviderProps } from './types';
import { THEME_LIST, THEME_PRESETS } from './presets';
import type { ThemeMode } from '../types';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_STORAGE_KEY = 'blog-system:theme';

function applyTheme(mode: ThemeMode): void {
  const theme = THEME_PRESETS[mode];
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  for (const [k, v] of Object.entries(theme.variables)) {
    root.style.setProperty(k, v);
  }
  // 平滑过渡：在切换瞬间临时禁用 transition，避免颜色跳变
  root.classList.add('theme-switching');
  window.setTimeout(() => {
    root.classList.remove('theme-switching');
  }, 200);
}

export function ThemeProvider({
  defaultTheme = 'light',
  storageKey = DEFAULT_STORAGE_KEY,
  children,
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && stored in THEME_PRESETS) return stored as ThemeMode;
    } catch {
      // ignore
    }
    return defaultTheme;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // ignore
    }
  }, [theme, storageKey]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      currentTheme: THEME_PRESETS[theme],
      themes: THEME_LIST,
      setTheme,
      resolvedTheme: theme,
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}