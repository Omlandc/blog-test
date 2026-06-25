/**
 * Look Packs —— 「套装」机制
 *
 * 用途：
 *  把 UI 主题（lib/theme/）和文章正文主题（lib/content-themes/）打包成一套
 *  用户选一个 Look，整套都换；省得分别挑完还得担心搭配不协调
 *
 * 数据驱动（不是 React Context）：
 *  - LOOK_PACKS 是 const
 *  - getLook / listLooks 纯函数
 *  - SiteConfig.look 存当前选中的 Look slug
 *  - /admin/site-config 提供一键应用
 */
import type { ThemeMode } from '@/lib/types';

export type LookSlug =
  | 'classic-light'
  | 'tech-pro'
  | 'literary'
  | 'magazine-editorial'
  | 'sunset-warmth'
  | 'terminal-hacker'
  | 'aurora-glass'
  | 'bauhaus-bold'
  | 'cyberpunk-neon'
  | 'brutalist-edge';

export interface LookPack {
  slug: LookSlug;
  /** 中文名 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 简短描述 */
  description: string;
  /** 适合什么场景 */
  scenario: string;
  /** UI 控件主题（lib/theme/） */
  uiTheme: ThemeMode;
  /** 文章正文主题（lib/content-themes/） */
  contentTheme: string;
  /** 预览色（用于缩略图） */
  preview: {
    bg: string;
    fg: string;
    accent: string;
  };
  /** 标签 */
  tags: string[];
}

/* ------------------------------------------------------------------ */
/*  10 套精选 Look                                                    */
/* ------------------------------------------------------------------ */
export const LOOK_PACKS: LookPack[] = [
  {
    slug: 'classic-light',
    name: '经典明亮',
    nameEn: 'Classic Light',
    description: '明亮 UI + 简洁排版，通用百搭',
    scenario: '通用博客 / 商业内容 / 个人站',
    uiTheme: 'light',
    contentTheme: 'default',
    preview: { bg: '#ffffff', fg: '#1a1a1a', accent: '#3b82f6' },
    tags: ['明亮', '通用', '清爽'],
  },
  {
    slug: 'tech-pro',
    name: '技术深色',
    nameEn: 'Tech Pro',
    description: '深色 UI + 赛博朋克正文，技术博客首选',
    scenario: '技术博客 / 程序员 / 工程类',
    uiTheme: 'dark',
    contentTheme: 'cyberpunk',
    preview: { bg: '#0a0e1a', fg: '#f0f6fc', accent: '#00f0ff' },
    tags: ['深色', '霓虹', '技术'],
  },
  {
    slug: 'literary',
    name: '文艺阅读',
    nameEn: 'Literary',
    description: '护眼米色 UI + 学术衬线，长文阅读',
    scenario: '散文 / 评论 / 严肃长文',
    uiTheme: 'sepia',
    contentTheme: 'academic',
    preview: { bg: '#f4ecd8', fg: '#5b4636', accent: '#7c1d1d' },
    tags: ['护眼', '衬线', '文学'],
  },
  {
    slug: 'magazine-editorial',
    name: '杂志编辑',
    nameEn: 'Magazine Editorial',
    description: '明亮 UI + 杂志排版，带 drop cap',
    scenario: '品牌内容 / 时尚 / 设计',
    uiTheme: 'light',
    contentTheme: 'magazine',
    preview: { bg: '#f8f5f0', fg: '#1a1a1a', accent: '#c1272d' },
    tags: ['杂志', '编辑', '设计'],
  },
  {
    slug: 'sunset-warmth',
    name: '日落暖色',
    nameEn: 'Sunset Warmth',
    description: '明亮 UI + 日落胶片，温暖氛围',
    scenario: '生活方式 / 美食 / 旅行',
    uiTheme: 'light',
    contentTheme: 'sunset',
    preview: { bg: '#fff5e6', fg: '#4a2818', accent: '#d97706' },
    tags: ['暖色', '生活', '胶片'],
  },
  {
    slug: 'terminal-hacker',
    name: '终端黑客',
    nameEn: 'Terminal Hacker',
    description: '深色 UI + 终端正文，开发者最爱',
    scenario: '开源 / 开发工具 / 极客',
    uiTheme: 'dark',
    contentTheme: 'terminal',
    preview: { bg: '#0c0c0c', fg: '#cccccc', accent: '#00ff41' },
    tags: ['终端', '深色', '极客'],
  },
  {
    slug: 'aurora-glass',
    name: '极光玻璃',
    nameEn: 'Aurora Glass',
    description: '明亮 UI + 极光玻璃，柔和通透',
    scenario: '设计 / 艺术 / 美学',
    uiTheme: 'light',
    contentTheme: 'aurora',
    preview: { bg: '#f0f4ff', fg: '#1e293b', accent: '#a78bfa' },
    tags: ['玻璃', '极光', '柔美'],
  },
  {
    slug: 'bauhaus-bold',
    name: '包豪斯',
    nameEn: 'Bauhaus Bold',
    description: '明亮 UI + 包豪斯几何，红黄蓝原色',
    scenario: '设计 / 建筑 / 现代艺术',
    uiTheme: 'light',
    contentTheme: 'bauhaus',
    preview: { bg: '#f5f1e8', fg: '#1a1a1a', accent: '#d40000' },
    tags: ['几何', '原色', '现代'],
  },
  {
    slug: 'cyberpunk-neon',
    name: '赛博朋克',
    nameEn: 'Cyberpunk Neon',
    description: '深色 UI + 极光玻璃，霓虹混搭',
    scenario: '游戏 / 二次元 / 未来感',
    uiTheme: 'dark',
    contentTheme: 'aurora',
    preview: { bg: '#1a1a2e', fg: '#f0f6fc', accent: '#a78bfa' },
    tags: ['深色', '霓虹', '未来'],
  },
  {
    slug: 'brutalist-edge',
    name: '粗野主义',
    nameEn: 'Brutalist Edge',
    description: '明亮 UI + 粗野风格，反精致',
    scenario: '独立博客 / 表达观点 / 宣言',
    uiTheme: 'light',
    contentTheme: 'brutalism',
    preview: { bg: '#fef9e7', fg: '#1a1a1a', accent: '#ff4081' },
    tags: ['粗野', '硬核', '宣言'],
  },
];

export function getLook(slug: string | undefined | null): LookPack {
  return (
    LOOK_PACKS.find((l) => l.slug === slug) ??
    LOOK_PACKS[0]!
  );
}

export function listLooks(): LookPack[] {
  return LOOK_PACKS;
}

export function isValidLook(slug: string): slug is LookSlug {
  return LOOK_PACKS.some((l) => l.slug === slug);
}
