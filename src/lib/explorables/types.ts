/**
 * Explorables —— 交互式专栏
 *
 * 探索性内容（不是普通 Markdown 文章），每个专栏是一段真实的 React 组件。
 *
 * 设计原则：
 * - 元数据（标题/描述/分类）→ 可读，注册用
 * - 组件代码 → git-driven，admin 不编辑（避免误改破坏交互）
 * - "scenario" 数据和 component 解耦，方便复用原语
 */

import type { ComponentType, LazyExoticComponent } from 'react';

export interface ExplorableMeta {
  /** URL slug，唯一 */
  slug: string;
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 描述（SEO meta + 列表页摘要） */
  description: string;
  /** 分类 */
  category: 'design' | 'dev' | 'system' | 'data' | 'ai' | 'other';
  /** 标签 */
  tags: string[];
  /** 难度 */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** 预估演示时长（分钟） */
  estimatedMinutes: number;
  /** 内容版本（语义化） */
  version: string;
  /** 作者署名 */
  author: string;
  /** 发布 / 更新时间 */
  publishedAt: string;
  updatedAt: string;
  /** 可选：相关阅读 */
  related?: string[];
  /** 可选：相关组件 */
  primitive?: string;
}

export interface ExplorableModule {
  meta: ExplorableMeta;
  /** 懒加载的实际交互组件 */
  component: () => Promise<{ default: ComponentType }>;
}

export const CATEGORY_META: Record<ExplorableMeta['category'], { label: string; emoji: string }> = {
  design: { label: '设计', emoji: '🎨' },
  dev: { label: '开发', emoji: '💻' },
  system: { label: '系统', emoji: '⚙️' },
  data: { label: '数据', emoji: '📊' },
  ai: { label: 'AI', emoji: '🤖' },
  other: { label: '其他', emoji: '✨' },
};
