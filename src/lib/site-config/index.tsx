/**
 * SiteConfig —— 站点身份与定位
 *
 * 让系统可以被复用到任何细分主题站（不仅是博客/食谱）。
 * 通过 React Context + localStorage 提供全局可访问、可实时修改。
 *
 * 包含：
 * - 基础身份（name / tagline / language / niche / ...）
 * - 部署模式（embedded | static）
 * - 工具集成（topnav / home）
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DeploymentMode, SiteConfig, ToolEntry } from '../types';

export type { SiteConfig } from '../types';

const STORAGE_KEY = 'blog-system:site-config';
const TOOLS_STORAGE_KEY = 'blog-system:tools';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  name: '博客系统',
  tagline: '一套可复用的细分内容站框架',
  description: '基于 React 18 + TypeScript + Vite 的开源博客与文章创作系统。',
  niche: 'tech',
  language: 'zh-CN',
  logoMark: '✍',
  defaultAuthorId: 'u_admin',
  geoTargets: [
    { country: 'CN', weight: 1.0 },
    { country: 'US', weight: 0.6 },
    { country: 'JP', weight: 0.4 },
  ],
  contactEmail: 'hello@example.com',
  social: {
    twitter: 'https://twitter.com/example',
    github: 'https://github.com/example',
  },
  heroTitle: '写作与阅读',
  heroSubtitle: '基于 React 18 + TypeScript + Vite 的开箱即用博客系统',
  aboutContent:
    '我们致力于打造一套可被任何细分主题复用的内容站框架。从结构化内容（pillar + cluster + article）到 SEO 自动化、私域兜底、变现钩子，全部开箱即用。',
  allowAI: false,
  allowAIImages: false,
  icp: '',
};

export const DEFAULT_TOOLS: ToolEntry[] = [
  {
    id: 'tool-mvp-helper',
    name: 'MVP 助手',
    icon: '🛠',
    description: '想法 → 可上线原型',
    url: '/tools/mvp',
    position: 'topnav',
    target: '_self',
    order: 1,
    badge: 'New',
  },
];

/** 加载站点配置（localStorage） */
export function loadSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

/**
 * 外部模块只读语言时调这个，不用自己去读 localStorage
 * 避免跨模块 localStorage 访问（重构 storage adapter 时会坏）
 */
export function getSiteLanguage(): string {
  return loadSiteConfig().language;
}

/** 外部模块只读站点名时调这个 */
export function getSiteName(): string {
  return loadSiteConfig().name;
}

/** 保存站点配置 */
export function saveSiteConfig(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  document.documentElement.lang = config.language;
  document.title = config.name;
}

export function loadTools(): ToolEntry[] {
  if (typeof window === 'undefined') return DEFAULT_TOOLS;
  try {
    const raw = window.localStorage.getItem(TOOLS_STORAGE_KEY);
    if (!raw) return DEFAULT_TOOLS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TOOLS;
  } catch {
    return DEFAULT_TOOLS;
  }
}

export function saveTools(tools: ToolEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
}

interface SiteConfigContextValue {
  config: SiteConfig;
  update: (partial: Partial<SiteConfig>) => void;
  reset: () => void;
  /** 当前部署模式（embedded / static） */
  mode: DeploymentMode;
  setMode: (mode: DeploymentMode) => void;
  /** 工具入口 */
  tools: ToolEntry[];
  setTools: (tools: ToolEntry[]) => void;
  addTool: (tool: ToolEntry) => void;
  removeTool: (id: string) => void;
  updateTool: (id: string, patch: Partial<ToolEntry>) => void;
  /** 工具查询：按位置 */
  getTopNavTools: () => ToolEntry[];
  getHomeTools: () => ToolEntry[];
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({
  children,
  initialConfig,
  initialMode,
  initialTools,
}: {
  children: ReactNode;
  initialConfig?: SiteConfig;
  initialMode?: DeploymentMode;
  initialTools?: ToolEntry[];
}): React.ReactElement {
  const [config, setConfig] = useState<SiteConfig>(
    () => initialConfig ?? loadSiteConfig(),
  );
  const [mode, setModeState] = useState<DeploymentMode>(
    () => initialMode ?? ((typeof window !== 'undefined' && (window.localStorage.getItem('blog-system:mode') as DeploymentMode)) || 'embedded'),
  );
  const [tools, setToolsState] = useState<ToolEntry[]>(
    () => initialTools ?? loadTools(),
  );

  useEffect(() => {
    saveSiteConfig(config);
  }, [config]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blog-system:mode', mode);
    }
  }, [mode]);

  useEffect(() => {
    saveTools(tools);
  }, [tools]);

  const update = useCallback((partial: Partial<SiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_SITE_CONFIG);
  }, []);

  const setMode = useCallback((m: DeploymentMode) => {
    setModeState(m);
  }, []);

  const setTools = useCallback((t: ToolEntry[]) => {
    setToolsState(t);
  }, []);

  const addTool = useCallback((tool: ToolEntry) => {
    setToolsState((prev) => [...prev, tool]);
  }, []);

  const removeTool = useCallback((id: string) => {
    setToolsState((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTool = useCallback((id: string, patch: Partial<ToolEntry>) => {
    setToolsState((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const getTopNavTools = useCallback(
    () =>
      tools
        .filter((t) => t.position === 'topnav' || t.position === 'both')
        .sort((a, b) => a.order - b.order),
    [tools],
  );

  const getHomeTools = useCallback(
    () =>
      tools
        .filter((t) => t.position === 'home' || t.position === 'both')
        .sort((a, b) => a.order - b.order),
    [tools],
  );

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        update,
        reset,
        mode,
        setMode,
        tools,
        setTools,
        addTool,
        removeTool,
        updateTool,
        getTopNavTools,
        getHomeTools,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfigContextValue {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return ctx;
}