/**
 * 内置 Explorables —— 注册到这里才出现在 /explore
 *
 * 新增一篇 = 在这里加一条 + 在 components/explorables/ 写组件
 */
import type { ExplorableModule } from './types';

const now = '2025-03-15T00:00:00.000Z';

/** 1. 主题切换演示 —— 用 CSS 变量驱动全站配色 */
export const themeShowcase: ExplorableModule = {
  meta: {
    slug: 'theme-system-showcase',
    title: '主题系统演示',
    subtitle: '4 套主题 · CSS 变量驱动 · 实时切换',
    description:
      '我们的 4 套主题（light / dark / sepia / cyberpunk）由一套 CSS 变量驱动。点下方按钮，看整套 UI 在不同主题下的真实呈现——这是文字讲不清楚的事。',
    category: 'system',
    tags: ['主题', 'CSS 变量', '实时演示'],
    difficulty: 'beginner',
    estimatedMinutes: 3,
    version: '0.1.0',
    author: 'u_admin',
    publishedAt: now,
    updatedAt: now,
    related: ['article/theme-system-overview'],
    primitive: 'ThemeSwitcher',
  },
  component: () => import('@/components/explorables/ThemeShowcase'),
};
