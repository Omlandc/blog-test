/**
 * Theme 模块类型定义（公共 API）
 * 主题定义本身在 types.ts 中
 */
import type { Theme, ThemeMode } from '../types';

export type { Theme, ThemeMode, ThemeVariables } from '../types';

/** ThemeProvider 暴露给消费者的 context 值 */
export interface ThemeContextValue {
  /** 当前主题 ID */
  theme: ThemeMode;
  /** 当前完整主题对象 */
  currentTheme: Theme;
  /** 所有可用主题 */
  themes: Theme[];
  /** 切换主题 */
  setTheme: (mode: ThemeMode) => void;
  /** 解析后的主题（占位：当前我们直接把 4 套都设为"显式"主题） */
  resolvedTheme: ThemeMode;
}

export interface ThemeProviderProps {
  /** 初始主题，默认 'light' */
  defaultTheme?: ThemeMode;
  /** localStorage 存储 key */
  storageKey?: string;
  children: React.ReactNode;
}