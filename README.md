# 博客与文章创作系统

> 一套**可复用**的、生产级的博客与文章创作系统。基于 React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion 打造。Markdown 编辑 + 渲染、4 套主题、可插拔鉴权与存储、图床抽象、后台/前台两种模式开箱即用。

## ✨ 核心特性

- 📝 **专业 Markdown 编辑器**：双栏实时预览、工具栏、撤销重做、图片上传（粘贴/拖拽/选择）、字数统计、自动保存
- 🎨 **多主题切换**：内置 light / dark / sepia / cyberpunk 四套精美主题，CSS 变量驱动，实时切换
- 🔐 **可插拔鉴权**：基于 `Permission` 枚举的 RBAC，支持 Mock / JWT / OAuth 自定义适配器
- 💾 **可插拔存储**：`StorageAdapter<T>` 接口，可切换 LocalStorage / IndexedDB / REST API
- 🖼️ **图床抽象**：`ImageUploader` 接口，可对接七牛 / 阿里 OSS / 自建服务
- 🛡️ **细粒度权限**：8 个权限枚举 + `<RequireAuth permission="...">` 守卫
- 📱 **响应式 + 暗色模式**：移动端 Sidebar 抽屉化，4 套主题都有明显视觉差异
- 🎬 **精致动画**：Framer Motion 贯穿全站，页面切换、卡片入场、模态框都有细腻反馈
- 🧩 **可独立复用**：`src/lib/*` 模块可被其他系统直接 import，类型完整

## 🚀 快速开始

```bash
# 安装
npm install

# 开发
npm run dev          # 启动 Vite，浏览器访问 http://localhost:5173

# 类型检查
npm run typecheck

# 生产构建
npm run build        # 输出到 dist/

# 预览构建产物
npm run preview      # 启动 preview server，默认端口 4173
```

## 🔑 演示账号

| 用户名 | 密码 | 角色 | 权限 |
| --- | --- | --- | --- |
| `admin` | `admin123` | admin | 8 个全部权限 |
| `user` | `user123` | user | 仅 `article:read` + `article:create` |

**演示场景**：
- 用 `admin` 登录可访问 `/admin/*` 完整后台
- 用 `user` 登录访问 `/admin` 会被拒绝（403 页面）
- 登录后到 `/admin/settings` 可一键切换演示账号

## 🗂 项目结构

```
blog-system/
├── src/
│   ├── lib/                       # ⭐ 可被外部系统复用的纯库代码
│   │   ├── types.ts               # 全部领域类型：Article, Author, Theme, Permission
│   │   ├── utils.ts               # cn / slugify / formatDate / estimateReadingTime
│   │   ├── auth/                  # 鉴权抽象
│   │   │   ├── types.ts           # AuthAdapter / User / Permission 接口
│   │   │   ├── context.tsx        # AuthProvider + useAuth hook
│   │   │   ├── mock.ts            # MockAuthAdapter（内置 admin / user 账号）
│   │   │   └── index.ts
│   │   ├── storage/               # 存储抽象
│   │   │   ├── types.ts           # StorageAdapter<T> 接口
│   │   │   ├── local.ts           # LocalStorageArticleAdapter 默认实现
│   │   │   ├── seed.ts            # 8 篇示例文章 + 3 个作者
│   │   │   └── index.ts
│   │   ├── theme/                 # 主题系统
│   │   │   ├── types.ts
│   │   │   ├── presets.ts         # 4 套主题：light / dark / sepia / cyberpunk
│   │   │   ├── context.tsx        # ThemeProvider + useTheme
│   │   │   └── index.ts
│   │   ├── markdown/              # Markdown 渲染
│   │   │   ├── render.ts          # marked + highlight.js + 自定义渲染器
│   │   │   ├── sanitize.ts        # DOMPurify XSS 过滤
│   │   │   └── index.ts
│   │   └── images/                # 图床抽象
│   │       ├── types.ts           # ImageUploader 接口
│   │       ├── mock.ts            # MockImageUploader（base64 dataURL）
│   │       ├── context.tsx        # ImageUploaderProvider + useImageUploader
│   │       └── index.ts
│   ├── components/                # React 组件
│   │   ├── ui/                    # shadcn 风格基础组件（Button, Card, Dialog, ...）
│   │   ├── layout/                # AppShell / Header
│   │   ├── editor/                # MarkdownEditor（编辑器）
│   │   ├── viewer/                # ArticleViewer（渲染器）
│   │   ├── theme/                 # ThemeSwitcher
│   │   ├── auth/                  # RequireAuth 守卫
│   │   └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── StatusPage.tsx         # 403 / 404 / Loading
│   │   ├── admin/                 # 后台页面（需 admin:access）
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminArticlesPage.tsx
│   │   │   ├── ArticleEditorPage.tsx
│   │   │   └── AdminSettingsPage.tsx
│   │   └── user/                  # 用户端页面
│   │       ├── HomePage.tsx
│   │       └── ArticleListPage.tsx
│   ├── routes.tsx                 # 路由 + 权限守卫
│   ├── App.tsx                    # Provider 树 + ErrorBoundary
│   ├── main.tsx                   # 入口
│   └── index.css                  # Tailwind + CSS 变量
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md                       # 本文件
```

## 🧩 核心抽象使用示例

### 1. 鉴权（Auth）

```ts
import { AuthAdapter, MockAuthAdapter } from '@/lib/auth';

const auth: AuthAdapter = new MockAuthAdapter();
const user = await auth.login({ username: 'admin', password: 'admin123' });
const canPublish = await auth.hasPermission('article:publish');
```

**接入真实后端**：实现 `AuthAdapter` 接口即可：

```ts
class JwtAuthAdapter implements AuthAdapter {
  async login({ username, password }) {
    const res = await fetch('/api/login', { method: 'POST', body: ... });
    return res.json(); // 返回 AuthUser
  }
  // ...
}
```

### 2. 存储（Storage）

```ts
import { getArticleStorage } from '@/lib/storage';

const storage = getArticleStorage();
const articles = await storage.getAll();
const article = await storage.getById('a_welcome');
await storage.update(id, { title: '新标题' });

// 订阅数据变化
const unsubscribe = storage.subscribe((items) => {
  console.log('数据变了', items);
});
```

### 3. 主题（Theme）

```tsx
import { useTheme } from '@/lib/theme';

function MyComponent() {
  const { theme, setTheme, themes, resolvedTheme } = useTheme();
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
      {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}
```

### 4. Markdown 渲染

```tsx
import { ArticleViewer } from '@/components/viewer';

<ArticleViewer content={article.content} showToc showProgress />
```

### 5. Markdown 编辑

```tsx
import { MarkdownEditor } from '@/components/editor';

<MarkdownEditor
  value={article.content}
  onChange={(c) => setContent(c)}
  onSave={async (c) => { await storage.update(id, { content: c }); }}
  articleId={article.id}
  autoSave
/>
```

### 6. 图片上传

```tsx
import { useImageUploader } from '@/lib/images';

const { upload, uploading } = useImageUploader();
const handleFile = async (file: File) => {
  const { url } = await upload(file);
  // 插入 ![](url) 到 Markdown
};
```

## 🛣 路由结构

| 路径 | 组件 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/` | HomePage | 公开 | 用户端首页（精选 + 文章网格） |
| `/articles` | ArticleListPage | 公开 | 文章列表（搜索/筛选/分页） |
| `/article/:slug` | ArticleDetailPage | 公开 | 文章详情（ArticleViewer） |
| `/login` | LoginPage | 公开 | 登录页 |
| `/admin` | AdminDashboardPage | `admin:access` | 后台仪表盘 |
| `/admin/articles` | AdminArticlesPage | `admin:access` | 文章管理（表格/卡片、筛选、批量） |
| `/admin/articles/new` | ArticleNewPage | `admin:access` | 新建文章（MarkdownEditor） |
| `/admin/articles/:id/edit` | ArticleEditPage | `admin:access` | 编辑文章 |
| `/admin/settings` | AdminSettingsPage | `admin:access` | 主题管理 + 演示账号 |
| `/403` | ForbiddenPage | 公开 | 403 页面 |
| `*` | NotFoundPage | 公开 | 404 页面 |

## 🧪 主题清单

| ID | 名称 | 描述 |
| --- | --- | --- |
| `light` | Light | 明亮通透的默认主题 |
| `dark` | Dark | 夜间模式 |
| `sepia` | Sepia | 护眼米色，长时间阅读友好 |
| `cyberpunk` | Cyberpunk | 赛博朋克霓虹风 |

主题切换通过 `<html data-theme="...">` 实时切换，无刷新。

## 🔌 二次开发指南

### 新增主题

在 `src/lib/theme/presets.ts` 添加：

```ts
{
  id: 'mytheme',
  name: '我的主题',
  description: '...',
  variables: {
    '--color-bg': '...',
    '--color-fg': '...',
    // ...
  },
  preview: { bg: '...', fg: '...', primary: '...', accent: '...' },
}
```

并在 `src/index.css` 添加对应的 `:root[data-theme="mytheme"]` CSS 变量。

### 接入真实鉴权

1. 实现 `AuthAdapter` 接口（参考 `MockAuthAdapter`）
2. 在 `App.tsx` 替换 `<AuthProvider>` 的 `adapter` prop
3. 如需修改权限枚举，编辑 `src/lib/types.ts` 的 `Permission` 类型

### 接入真实存储

1. 实现 `ArticleStorageAdapter` 接口（参考 `LocalStorageArticleAdapter`）
2. 在 `src/lib/storage/index.ts` 的 `getArticleStorage()` 返回新实现
3. 业务代码无需改动

### 接入真实图床

1. 继承 `HttpImageUploader` 或实现 `ImageUploader` 接口
2. 在 `App.tsx` 替换 `<ImageUploaderProvider>` 的 `uploader` prop
3. MarkdownEditor 的图片按钮会自动调用新实现

## 📦 浏览器兼容

- Chrome / Edge / Firefox / Safari 最近 2 个大版本
- 不支持 IE

## 📄 License

MIT
