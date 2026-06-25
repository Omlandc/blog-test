/**
 * i18n —— 中英双语支持
 *
 * 策略：
 * - 自动检测浏览器语言（navigator.language）
 * - 用户可在设置中手动覆盖
 * - 选择持久化到 localStorage
 * - 未翻译的 key 优雅降级（返回 key 本身或 zh-CN 翻译）
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Locale = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'blog-system:locale';
const SITE_CONFIG_KEY = 'blog-system:site-config';

/** 检测浏览器语言 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'zh-CN';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('en')) return 'en-US';
  return 'zh-CN';
}

/** 翻译表：扁平 key → 多语言 */
const translations: Record<string, Record<Locale, string>> = {
  // ── 通用 ──
  'common.home': { 'zh-CN': '首页', 'en-US': 'Home' },
  'common.articles': { 'zh-CN': '文章', 'en-US': 'Articles' },
  'common.article': { 'zh-CN': '文章', 'en-US': 'Article' },
  'common.topics': { 'zh-CN': '主题', 'en-US': 'Topics' },
  'common.search': { 'zh-CN': '搜索', 'en-US': 'Search' },
  'common.resources': { 'zh-CN': '资源', 'en-US': 'Resources' },
  'common.explore': { 'zh-CN': '探索', 'en-US': 'Explore' },
  'common.loading': { 'zh-CN': '加载中…', 'en-US': 'Loading…' },
  'common.cancel': { 'zh-CN': '取消', 'en-US': 'Cancel' },
  'common.confirm': { 'zh-CN': '确认', 'en-US': 'Confirm' },
  'common.save': { 'zh-CN': '保存', 'en-US': 'Save' },
  'common.delete': { 'zh-CN': '删除', 'en-US': 'Delete' },
  'common.edit': { 'zh-CN': '编辑', 'en-US': 'Edit' },
  'common.create': { 'zh-CN': '创建', 'en-US': 'Create' },
  'common.update': { 'zh-CN': '更新', 'en-US': 'Update' },
  'common.submit': { 'zh-CN': '提交', 'en-US': 'Submit' },
  'common.back': { 'zh-CN': '返回', 'en-US': 'Back' },
  'common.next': { 'zh-CN': '下一页', 'en-US': 'Next' },
  'common.prev': { 'zh-CN': '上一页', 'en-US': 'Previous' },
  'common.more': { 'zh-CN': '更多', 'en-US': 'More' },
  'common.viewAll': { 'zh-CN': '查看全部', 'en-US': 'View all' },
  'common.empty': { 'zh-CN': '暂无数据', 'en-US': 'No data' },
  'common.you': { 'zh-CN': '你', 'en-US': 'You' },

  // ── 导航 ──
  'nav.login': { 'zh-CN': '登录', 'en-US': 'Sign in' },
  'nav.logout': { 'zh-CN': '退出登录', 'en-US': 'Sign out' },
  'nav.profile': { 'zh-CN': '个人中心', 'en-US': 'Profile' },
  'nav.admin': { 'zh-CN': '管理后台', 'en-US': 'Admin' },
  'nav.settings': { 'zh-CN': '设置', 'en-US': 'Settings' },
  'nav.subscribers': { 'zh-CN': '订阅者', 'en-US': 'Subscribers' },
  'nav.analytics': { 'zh-CN': '流量分析', 'en-US': 'Analytics' },
  'nav.themes': { 'zh-CN': '主题', 'en-US': 'Themes' },

  // ── 首页 ──
  'home.tagline': {
    'zh-CN': '一套可复用的细分内容站框架',
    'en-US': 'A reusable framework for niche content sites',
  },
  'home.featured': { 'zh-CN': '精选', 'en-US': 'Featured' },
  'home.latest': { 'zh-CN': '最新', 'en-US': 'Latest' },
  'home.hottest': { 'zh-CN': '热门', 'en-US': 'Hottest' },
  'home.minRead': { 'zh-CN': '分钟', 'en-US': 'min read' },
  'home.views': { 'zh-CN': '次阅读', 'en-US': 'views' },
  'home.heroTitle': { 'zh-CN': '写作与阅读', 'en-US': 'Write & Read' },
  'home.heroSubtitle': {
    'zh-CN': '基于 React 18 + TypeScript + Vite 的开箱即用博客系统',
    'en-US': 'Production-ready blog system on React 18 + TypeScript + Vite',
  },
  'home.heroTag': {
    'zh-CN': '一套可复用的细分内容站框架',
    'en-US': 'A reusable framework for niche content sites',
  },
  'home.exploreAll': { 'zh-CN': '浏览全部文章', 'en-US': 'Explore all articles' },
  'home.enterAdmin': { 'zh-CN': '进入后台', 'en-US': 'Open admin' },

  // ── 编辑器 ──
  'editor.format': { 'zh-CN': '格式', 'en-US': 'Format' },
  'editor.markdown': { 'zh-CN': 'Markdown', 'en-US': 'Markdown' },
  'editor.html': { 'zh-CN': 'HTML', 'en-US': 'HTML' },
  'editor.importFile': { 'zh-CN': '导入文件', 'en-US': 'Import file' },
  'editor.importFileTip': { 'zh-CN': '拖拽 .md / .html 文件到本区域即可导入', 'en-US': 'Drag .md / .html files here to import' },
  'editor.switchToHtml': { 'zh-CN': '切到 HTML 编辑器', 'en-US': 'Switch to HTML editor' },
  'editor.switchToMd': { 'zh-CN': '切到 Markdown 编辑器', 'en-US': 'Switch to Markdown editor' },
  'editor.loaded': { 'zh-CN': '已加载', 'en-US': 'Loaded' },
  'editor.loadFailed': { 'zh-CN': '加载失败', 'en-US': 'Load failed' },
  'editor.formatSwitched': { 'zh-CN': '已切换为 HTML 编辑器', 'en-US': 'Switched to HTML editor' },
  'editor.formatMd': { 'zh-CN': '使用 HTML 语法，渲染时会自动 sanitize', 'en-US': 'HTML syntax auto-sanitize on render' },
  'editor.formatMdBack': { 'zh-CN': '使用 Markdown 语法', 'en-US': 'Markdown syntax' },
  'editor.dragHint': { 'zh-CN': '拖拽文件到此处', 'en-US': 'Drag file here' },
  'editor.supportedFiles': { 'zh-CN': '支持 .md .html .txt', 'en-US': 'Supports .md .html .txt' },

  // ── 文章 ──
  'article.allArticles': { 'zh-CN': '所有文章', 'en-US': 'All articles' },
  'article.empty': { 'zh-CN': '没有匹配的文章', 'en-US': 'No matching articles' },
  'article.notFound': { 'zh-CN': '文章不存在', 'en-US': 'Article not found' },
  'article.minRead': { 'zh-CN': '约 {n} 分钟阅读', 'en-US': '{n} min read' },
  'article.views': { 'zh-CN': '{n} 次阅读', 'en-US': '{n} views' },
  'article.publishedAt': { 'zh-CN': '发布于', 'en-US': 'Published' },
  'article.updatedAt': { 'zh-CN': '更新于', 'en-US': 'Updated' },
  'article.related': { 'zh-CN': '相关文章', 'en-US': 'Related articles' },
  'article.share': { 'zh-CN': '分享', 'en-US': 'Share' },
  'article.shareSuccess': { 'zh-CN': '已复制链接', 'en-US': 'Link copied' },
  'article.shareFail': { 'zh-CN': '复制失败', 'en-US': 'Copy failed' },
  'article.tags': { 'zh-CN': '标签', 'en-US': 'Tags' },
  'article.category': { 'zh-CN': '分类', 'en-US': 'Category' },
  'article.difficulty.beginner': { 'zh-CN': '入门', 'en-US': 'Beginner' },
  'article.difficulty.intermediate': { 'zh-CN': '进阶', 'en-US': 'Intermediate' },
  'article.difficulty.advanced': { 'zh-CN': '高级', 'en-US': 'Advanced' },
  'article.backToList': { 'zh-CN': '返回文章列表', 'en-US': 'Back to articles' },

  // ── 主题簇 ──
  'topic.allTopics': { 'zh-CN': '全部主题', 'en-US': 'All topics' },
  'topic.notFound': { 'zh-CN': '主题不存在', 'en-US': 'Topic not found' },
  'topic.description': {
    'zh-CN': '按主题浏览所有文章',
    'en-US': 'Browse all articles by topic',
  },
  'topic.subTopics': { 'zh-CN': '子分类', 'en-US': 'Sub-topics' },
  'topic.articles': { 'zh-CN': '{name} 下的文章', 'en-US': 'Articles in {name}' },
  'topic.articlesEmpty': { 'zh-CN': '该主题下还没有文章', 'en-US': 'No articles in this topic' },

  // ── 鉴权 ──
  'auth.signIn': { 'zh-CN': '登录', 'en-US': 'Sign in' },
  'auth.signOut': { 'zh-CN': '退出', 'en-US': 'Sign out' },
  'auth.username': { 'zh-CN': '用户名', 'en-US': 'Username' },
  'auth.password': { 'zh-CN': '密码', 'en-US': 'Password' },
  'auth.signInButton': { 'zh-CN': '登 录', 'en-US': 'Sign in' },
  'auth.signingIn': { 'zh-CN': '登录中…', 'en-US': 'Signing in…' },
  'auth.signInSuccess': { 'zh-CN': '登录成功', 'en-US': 'Signed in' },
  'auth.signInFail': { 'zh-CN': '登录失败', 'en-US': 'Sign in failed' },
  'auth.demoAccounts': {
    'zh-CN': '演示账号',
    'en-US': 'Demo accounts',
  },
  'auth.demoAdmin': { 'zh-CN': '管理员', 'en-US': 'Admin' },
  'auth.demoUser': { 'zh-CN': '普通用户', 'en-US': 'User' },
  'auth.needLogin': {
    'zh-CN': '请先登录后再访问该页面',
    'en-US': 'Please sign in to access this page',
  },
  'auth.noPermission': {
    'zh-CN': '当前账号没有访问该页面的权限',
    'en-US': 'Your account does not have permission for this page',
  },
  'auth.goLogin': { 'zh-CN': '去登录', 'en-US': 'Sign in' },
  'auth.backHome': { 'zh-CN': '返回首页', 'en-US': 'Back to home' },
  'auth.errorTitle': { 'zh-CN': '无权访问', 'en-US': 'Forbidden' },
  'auth.notFoundTitle': { 'zh-CN': '页面不存在', 'en-US': 'Not found' },
  'auth.notFoundDesc': {
    'zh-CN': '你访问的页面已被移动或不存在',
    'en-US': 'The page you are looking for has been moved or does not exist',
  },
  'auth.errorPageTitle': { 'zh-CN': '页面出错了', 'en-US': 'Something went wrong' },
  'auth.errorPageDesc': {
    'zh-CN': '发生了一个未知错误',
    'en-US': 'An unknown error occurred',
  },
  'auth.retry': { 'zh-CN': '重试', 'en-US': 'Retry' },

  // ── 后台 ──
  'admin.dashboard': { 'zh-CN': '仪表盘', 'en-US': 'Dashboard' },
  'admin.dashboardWelcome': { 'zh-CN': '欢迎回来。这是你的博客内容概览。', 'en-US': 'Welcome back. Here\'s your content overview.' },
  'admin.dashboardWelcomeWith': { 'zh-CN': '欢迎回来 · {name}', 'en-US': 'Welcome back, {name}' },
  'admin.stat.total': { 'zh-CN': '总文章数', 'en-US': 'Total articles' },
  'admin.stat.published': { 'zh-CN': '已发布', 'en-US': 'Published' },
  'admin.stat.drafts': { 'zh-CN': '草稿', 'en-US': 'Drafts' },
  'admin.stat.totalViews': { 'zh-CN': '总浏览量', 'en-US': 'Total views' },
  'admin.quickActions': { 'zh-CN': '快速入口', 'en-US': 'Quick actions' },
  'admin.recentArticles': { 'zh-CN': '最近文章', 'en-US': 'Recent articles' },
  'admin.recentByUpdate': { 'zh-CN': '按更新时间倒序', 'en-US': 'Sorted by updated time' },
  'admin.articlesManagement': { 'zh-CN': '文章管理', 'en-US': 'Articles' },
  'admin.allArticlesDesc': { 'zh-CN': '所有文章的列表、筛选与批量操作', 'en-US': 'List, filter and bulk operations' },
  'admin.newArticle': { 'zh-CN': '新建文章', 'en-US': 'New article' },
  'admin.tableView': { 'zh-CN': '表格视图', 'en-US': 'Table view' },
  'admin.cardView': { 'zh-CN': '卡片视图', 'en-US': 'Card view' },
  'admin.searchArticles': { 'zh-CN': '搜索标题、内容、摘要...', 'en-US': 'Search title, content, excerpt...' },
  'admin.all': { 'zh-CN': '全部', 'en-US': 'All' },
  'admin.status': { 'zh-CN': '状态', 'en-US': 'Status' },
  'admin.tags': { 'zh-CN': '标签', 'en-US': 'Tags' },
  'admin.allTags': { 'zh-CN': '全部标签', 'en-US': 'All tags' },
  'admin.title': { 'zh-CN': '标题', 'en-US': 'Title' },
  'admin.views': { 'zh-CN': '浏览', 'en-US': 'Views' },
  'admin.updateTime': { 'zh-CN': '更新时间', 'en-US': 'Updated' },
  'admin.actions': { 'zh-CN': '操作', 'en-US': 'Actions' },
  'admin.selected': { 'zh-CN': '已选中 {n} 篇', 'en-US': '{n} selected' },
  'admin.bulkPublish': { 'zh-CN': '批量发布', 'en-US': 'Bulk publish' },
  'admin.bulkDelete': { 'zh-CN': '批量删除', 'en-US': 'Bulk delete' },
  'admin.confirmDelete': { 'zh-CN': '确定要删除「{title}」吗？此操作不可恢复。', 'en-US': 'Delete "{title}"? This cannot be undone.' },
  'admin.confirmBulkDelete': { 'zh-CN': '确定要删除选中的 {n} 篇文章吗？此操作不可恢复。', 'en-US': 'Delete {n} selected articles? This cannot be undone.' },
  'admin.deleteSuccess': { 'zh-CN': '已删除', 'en-US': 'Deleted' },
  'admin.bulkDeleteSuccess': { 'zh-CN': '已批量删除 {n} 篇文章', 'en-US': 'Deleted {n} articles' },
  'admin.bulkPublishSuccess': { 'zh-CN': '已批量发布 {n} 篇文章', 'en-US': 'Published {n} articles' },
  'admin.deleteArticle': { 'zh-CN': '删除文章', 'en-US': 'Delete article' },
  'admin.deleteAll': { 'zh-CN': '全部删除', 'en-US': 'Delete all' },
  'admin.pageOf': { 'zh-CN': '第 {page} / {total} 页 · 共 {count} 篇', 'en-US': 'Page {page} / {total} · {count} articles' },
  'admin.series': { 'zh-CN': '主题簇管理', 'en-US': 'Topic clusters' },
  'admin.sites': { 'zh-CN': '多站点管理', 'en-US': 'Multi-site' },
  'admin.siteConfig': { 'zh-CN': '站点身份与定位', 'en-US': 'Site identity' },
  'admin.docs': { 'zh-CN': '系统文档', 'en-US': 'Documentation' },
  'admin.migrate': { 'zh-CN': '数据迁移', 'en-US': 'Migration' },
  'admin.contentThemes': { 'zh-CN': '内容主题', 'en-US': 'Content themes' },
  'admin.editArticle': { 'zh-CN': '编辑文章', 'en-US': 'Edit article' },
  'admin.subscribers': { 'zh-CN': '订阅者', 'en-US': 'Subscribers' },
  'admin.analytics': { 'zh-CN': '流量分析', 'en-US': 'Analytics' },
  'admin.writeArticle': { 'zh-CN': '写新文章', 'en-US': 'Write article' },
  'admin.manageArticles': { 'zh-CN': '管理文章', 'en-US': 'Manage articles' },
  'admin.themesAndAccount': { 'zh-CN': '主题与账号', 'en-US': 'Themes & account' },
  'admin.themesAndAccountDesc': { 'zh-CN': '外观 · 切换演示用户', 'en-US': 'Appearance · Switch demo account' },
  'admin.topicClusters': { 'zh-CN': '主题簇管理', 'en-US': 'Topic clusters' },
  'admin.topicClustersDesc': { 'zh-CN': 'Pillar · Cluster', 'en-US': 'Pillar · Cluster' },
  'admin.traffic': { 'zh-CN': '流量分析', 'en-US': 'Analytics' },
  'admin.trafficDesc': { 'zh-CN': '来源 · 转化 · 热门', 'en-US': 'Source · Conversion · Top' },
  'admin.subscribersDesc': { 'zh-CN': '邮件列表 · 私域兜底', 'en-US': 'Email list · Private domain' },
  'admin.siteIdentity': { 'zh-CN': '站点身份与定位', 'en-US': 'Site identity' },
  'admin.siteIdentityDesc': { 'zh-CN': '复用到任何细分主题', 'en-US': 'Reusable for any niche' },
  'admin.systemDocs': { 'zh-CN': '系统文档', 'en-US': 'Documentation' },
  'admin.systemDocsDesc': { 'zh-CN': '使用说明 · 运营 · SEO · 更新日志', 'en-US': 'Usage · Ops · SEO · Changelog' },
  'admin.page': { 'zh-CN': '第 {page} / {total} 页', 'en-US': 'Page {page} / {total}' },

  // ── 订阅 ──
  'sub.subscribe': { 'zh-CN': '订阅', 'en-US': 'Subscribe' },
  'sub.subscribing': { 'zh-CN': '订阅中...', 'en-US': 'Subscribing...' },
  'sub.subscribeSuccess': { 'zh-CN': '订阅成功！', 'en-US': 'Subscribed!' },
  'sub.subscribeHint': { 'zh-CN': '我们会在每周精选里见到你', 'en-US': 'You will see you in the weekly digest' },
  'sub.emailPlaceholder': { 'zh-CN': 'your@email.com', 'en-US': 'your@email.com' },
  'sub.namePlaceholder': { 'zh-CN': '昵称（可选）', 'en-US': 'Name (optional)' },
  'sub.invalidEmail': { 'zh-CN': '请输入有效邮箱', 'en-US': 'Please enter a valid email' },
  'sub.privacyNote': { 'zh-CN': '免费订阅，可随时退订。我们承诺不发垃圾邮件。', 'en-US': 'Free, unsubscribe anytime. We never spam.' },
  'sub.email': { 'zh-CN': '邮件', 'en-US': 'Email' },

  // ── 主题 ──
  'theme.light': { 'zh-CN': '明亮', 'en-US': 'Light' },
  'theme.dark': { 'zh-CN': '暗黑', 'en-US': 'Dark' },
  'theme.sepia': { 'zh-CN': '护眼', 'en-US': 'Sepia' },
  'theme.cyberpunk': { 'zh-CN': '赛博', 'en-US': 'Cyberpunk' },

  // ── 文档 ──
  'docs.title': { 'zh-CN': '系统文档中心', 'en-US': 'Documentation Center' },
  'docs.subtitle': { 'zh-CN': '仅管理员可见 · 系统使用说明 / 运营思路 / SEO 思路 / 更新日志', 'en-US': 'Admin only · Usage / Operations / SEO / Changelog' },
  'docs.tab.usage': { 'zh-CN': '使用说明', 'en-US': 'Usage' },
  'docs.tab.operations': { 'zh-CN': '运营思路', 'en-US': 'Operations' },
  'docs.tab.seo': { 'zh-CN': 'SEO 思路', 'en-US': 'SEO' },
  'docs.tab.changelog': { 'zh-CN': '更新日志', 'en-US': 'Changelog' },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** 自动检测的浏览器语言（不可写） */
  detected: Locale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** 加载 locale（localStorage 优先，其次 SiteConfig，其次浏览器） */
function loadLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN';
  // 1) 用户手动设置
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'en-US') return stored;
  // 2) SiteConfig 设置
  try {
    const cfg = window.localStorage.getItem(SITE_CONFIG_KEY);
    if (cfg) {
      const lang = JSON.parse(cfg).language;
      if (lang === 'zh-CN' || lang === 'en-US') return lang;
    }
  } catch {
    // ignore
  }
  // 3) 浏览器语言
  return detectBrowserLocale();
}

function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? loadLocale());
  const detected = useMemo(() => detectBrowserLocale(), []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const entry = translations[key];
      let str: string;
      if (!entry) {
        // 未翻译：返回 key 或 zh-CN 翻译
        str = translations[key]?.['zh-CN'] ?? key;
      } else {
        str = entry[locale] ?? entry['zh-CN'] ?? key;
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return str;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, detected }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback: 提供基础 t 函数（不抛错）
    const detected = detectBrowserLocale();
    return {
      locale: detected,
      detected,
      setLocale: () => undefined,
      t: (key: string, params?: Record<string, string | number>) => {
        const entry = translations[key];
        let str = entry?.[detected] ?? entry?.['zh-CN'] ?? key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
          });
        }
        return str;
      },
    };
  }
  return ctx;
}

/** 单独使用翻译（用于非组件上下文） */
export function translate(key: string, locale: Locale = 'zh-CN'): string {
  return translations[key]?.[locale] ?? translations[key]?.['zh-CN'] ?? key;
}