/**
 * Links 模块 —— 资源导航
 *
 * 与 SiteConfig.tools 的区别：
 * - tools = 我自己产品的入口（导航到自己）
 * - links = 我推荐的外部资源（导航到别人）
 *
 * 支持：
 * - 7 个固定分类 + 自定义
 * - featured 位
 * - 多语言描述
 * - 点击统计（与 analytics 模块打通）
 * - 静态 bundle 导出（与 SiteConfig 同机制）
 */

export type LinkCategory =
  | 'design'
  | 'dev'
  | 'writing'
  | 'marketing'
  | 'analytics'
  | 'productivity'
  | 'other';

export type LinkPricing = 'free' | 'freemium' | 'paid';

export interface LinkEntry {
  id: string;
  name: string;
  url: string;
  /** emoji 图标 */
  icon?: string;
  /** 描述（主语言，SiteConfig.language 决定） */
  description: string;
  /** 英文描述（i18n 备用） */
  descriptionEn?: string;
  category: LinkCategory;
  tags: string[];
  featured: boolean;
  pricing?: LinkPricing;
  /** 点击次数（前端累计） */
  clicks: number;
  /** 排序权重（同分类内升序） */
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_META: Record<LinkCategory, { label: string; emoji: string; color: string }> = {
  design: { label: '设计', emoji: '🎨', color: 'pink' },
  dev: { label: '开发', emoji: '💻', color: 'blue' },
  writing: { label: '写作', emoji: '✍️', color: 'amber' },
  marketing: { label: '营销', emoji: '📣', color: 'purple' },
  analytics: { label: '分析', emoji: '📊', color: 'emerald' },
  productivity: { label: '效率', emoji: '⚡', color: 'cyan' },
  other: { label: '其他', emoji: '✨', color: 'gray' },
};

export const PRICING_META: Record<LinkPricing, { label: string; emoji: string }> = {
  free: { label: '免费', emoji: '🆓' },
  freemium: { label: '免费增值', emoji: '💎' },
  paid: { label: '付费', emoji: '💰' },
};
