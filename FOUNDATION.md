# 基础骨架（FOUNDATION）说明

本文档说明 `blog-system` 项目骨架已落地的核心抽象与基础设施层。
它是后续所有功能模块的依赖基础。

## 1. 已实现的核心抽象接口签名

### 1.1 `AuthAdapter`（认证）

文件：`src/lib/auth/types.ts`

```ts
export interface AuthAdapter {
  getCurrentUser(): Promise<AuthUser | null>;
  login(credentials: LoginCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  hasPermission(permission: Permission): Promise<boolean>;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void; // 返回反订阅
}
```

默认实现：`MockAuthAdapter`（`src/lib/auth/mock.ts`）。

- `admin / admin123`：管理员，所有 8 个权限
- `user / user123`：普通用户，仅 `article:read` + `article:create`
- 状态持久化到 `localStorage`，key = `blog-system:auth:current`
- `listMockAccounts()`：UI 展示用，不含密码

React 入口：`AuthProvider` + `useAuth()`（`src/lib/auth/context.tsx`）。

权限枚举（`src/lib/types.ts`）：

```ts
export type Permission =
  | 'article:read'
  | 'article:create'
  | 'article:edit'
  | 'article:delete'
  | 'article:publish'
  | 'admin:access'
  | 'theme:manage'
  | 'user:manage';
```

### 1.2 `StorageAdapter<T>`（通用 CRUD）

文件：`src/lib/storage/types.ts`

```ts
export interface StorageAdapter<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, partial: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  subscribe(cb: (items: T[]) => void): () => void;
}

export interface ArticleStorageAdapter extends StorageAdapter<Article> {
  getBySlug(slug: string): Promise<Article | null>;
  query(params: ArticleQuery): Promise<PageResult<Article>>;
  incrementViews(id: string): Promise<void>;
  clear?(): Promise<void>;
}
```

默认实现：`LocalStorageArticleAdapter`（`src/lib/storage/local.ts`）。

- 数据持久化到 `localStorage`，key = `blog-system:articles`
- 支持分页、按状态/作者/标签/分类/关键字过滤、按 createdAt/updatedAt/views/title 排序
- 首次运行写入 3 篇示例文章（`SEED_ARTICLES`，`src/lib/storage/seed.ts`）

### 1.3 `Theme`（主题）

文件：`src/lib/theme/presets.ts`

```ts
export interface Theme {
  id: ThemeMode;            // 'light' | 'dark' | 'sepia' | 'cyberpunk'
  name: string;
  description: string;
  variables: ThemeVariables; // 20 个 CSS 变量 + 3 个 radius
  preview: { bg; fg; primary; accent }; // 用于色卡
}
```

React 入口：`ThemeProvider` + `useTheme()`（`src/lib/theme/context.tsx`）。

切换机制：

```ts
document.documentElement.setAttribute('data-theme', 'dark');
// 同时批量设置 --color-* CSS 变量
```

### 1.4 Markdown 渲染

文件：`src/lib/markdown/{render,sanitize}.ts`

```ts
renderMarkdownToHtml(md: string): string;        // marked + hljs
sanitizeHtml(html: string): string;              // DOMPurify
renderSafeMarkdown(md: string): string;          // 推荐入口：渲染 + 过滤
markdownToPlainText(md: string): string;        // 提取纯文本
```

支持的语法：GFM 表格、删除线、任务列表、代码块高亮、列表、引用、链接、图片、水平线。

XSS 防御：DOMPurify 白名单 + 黑名单（丢弃 `script/iframe/object/embed/form/link/meta` 等）。

### 1.5 `ImageUploader`（图片上传）

文件：`src/lib/images/{types,mock}.ts`

```ts
export interface ImageUploader {
  upload(file: File, options?: UploadOptions): Promise<UploadedImage>;
  uploadMany(files: File[], options?: UploadOptions): Promise<UploadedImage[]>;
  accepts?: string[];
  maxSize?: number;
}
```

内置实现：

- `MockImageUploader`：转 base64 dataURL，< 2MB 限制，存 `localStorage`
- `HttpImageUploader`：POST multipart/form-data 到外部 endpoint（stub，可扩展）

React 入口：`ImageUploaderProvider` + `useImageUploader()`（`src/lib/images/context.tsx`）。

### 1.6 路由 + 权限守卫

文件：`src/routes.tsx`、`src/components/auth/RequireAuth.tsx`

```tsx
<RequireAuth permission="admin:access">    // 单权限
<RequireAuth permission={['a', 'b']}>      // 任意满足
<RequireAuth requireLogin>                 // 只要登录
```

行为：

- 未登录 → 跳 `/login`，并带上 `from`
- 已登录但权限不足 → 渲染 `ForbiddenPage`（403）
- 加载中 → 渲染 `LoadingPage`

可作为叶子组件或布局组件使用（自动判断渲染 `children` 还是 `<Outlet/>`）。

## 2. 4 套主题色板概览

| 主题 | bg | fg | primary | accent | 风格定位 |
| --- | --- | --- | --- | --- | --- |
| `light` | `#ffffff` | `#0a0a0a` | `#6366f1` | `#a855f7` | 明亮通透的默认主题 |
| `dark` | `#09090b` | `#fafafa` | `#818cf8` | `#c084fc` | 暗夜冷色调高对比 |
| `sepia` | `#f5ecd9` | `#3b2e1f` | `#a0522d` | `#8b6914` | 米黄护眼，长时间阅读 |
| `cyberpunk` | `#0a0014` | `#f9f5ff` | `#00f5ff` | `#ff00d4` | 霓虹赛博朋克 |

每套主题额外定义了 `--color-bg-elevated` / `--color-bg-subtle` / `--color-fg-muted` / `--color-fg-subtle` / `--color-secondary` / `--color-border` / `--color-muted` / `--color-success` / `--color-warning` / `--color-danger` / `--color-code-bg` / `--color-code-fg` / `--color-ring` / `--radius-{sm,md,lg}` 共 20 个 CSS 变量。

## 3. 启动命令

```bash
# 开发
npm install
npm run dev         # http://localhost:5173

# 生产
npm run build       # tsc -b && vite build
npm run preview     # http://localhost:4173

# 质量门
npm run typecheck   # tsc --noEmit
node scripts/verify.mjs   # 运行时验证
```

## 4. 已验证项（自检通过）

- ✅ TypeScript strict 0 错误（`npx tsc --noEmit`）
- ✅ `npm run build` 成功，产物在 `dist/`（约 478KB JS / 26KB CSS）
- ✅ `npm run dev` 启动后 HTTP 200 返回 index.html
- ✅ `npm run preview` 启动后 HTTP 200，JS 资源加载正常
- ✅ Auth：登录/登出/权限检查/角色区分均工作
- ✅ Storage：seed 写入 / 分页 / 过滤 / CRUD 全部工作
- ✅ Markdown：GFM + 代码高亮 + XSS 过滤（`<script>` 被剥离）
- ✅ Theme：4 套主题变量集完整
- ✅ ImageUploader：MIME 校验 + HttpImageUploader stub

## 5. 已知待补充项（留给后续 task）

### 5.1 页面（占位实现）

- `/article/:slug` → 仅显示 slug 文本框，待实现 Markdown 渲染 + 元信息 + 浏览量自增
- `/articles` → 仅显示占位卡片，待实现列表/分页/标签筛选/搜索
- `/admin/articles/new` → 仅占位，待实现完整的 Markdown 编辑器（实时预览、图片上传、自动保存、标签、分类、封面）
- `/admin/articles/:id/edit` → 同上，加载已有数据
- `/admin/articles` → 仅占位，待实现表格 + 状态筛选 + 批量操作
- `/admin` → Dashboard 卡片导航已就绪，可继续完善统计指标

### 5.2 组件

- `<Sidebar>` → 仅 Header 实现，后续 task 实现管理后台侧边栏导航
- `<MediaLibrary>` → 暂未实现，后续 task 统一管理上传图片
- `<CommentSection>` → 暂未实现

### 5.3 适配器

- `HttpAuthAdapter`：当前仅有接口约定，未实现。后续 task 接后端 API 时补全
- `HttpArticleStorageAdapter`：同上
- `HttpImageUploader`：已有 stub 实现，但 endpoint 由调用方传入，未默认配置

### 5.4 其他

- Toast 当前为 Radix Toast + sonner 风格封装，可继续扩展（promise toast、loading toast 等）
- 主题切换动画已通过 Framer Motion 实现，但缺少主题切换时的页面级全局过渡（如 route fade）
- 未实现单元测试（`vitest` / `jest`），仅提供 `scripts/verify.mjs` 作为运行时 sanity check

## 6. 验收清单（与原任务要求逐项对应）

| 要求 | 状态 |
| --- | --- |
| 严格使用指定技术栈 | ✅ |
| 目录结构按规范 | ✅ |
| `types.ts` 含 Article/Author/Theme/Permission 完整定义 | ✅ |
| `AuthAdapter` 接口与 MockAuthAdapter（2 个账号 + localStorage） | ✅ |
| `StorageAdapter<T>` 接口与 LocalStorage 实现（CRUD + 分页 + 过滤） | ✅ |
| 4 套主题（light/dark/sepia/cyberpunk）+ CSS 变量 + ThemeSwitcher | ✅ |
| Markdown（marked + highlight.js）+ DOMPurify | ✅ |
| `ImageUploader` 接口 + Mock + Http stub | ✅ |
| 12+ UI 组件（Button/Input/.../Toast）shadcn 风格 | ✅ |
| 完整路由 + 权限守卫 + 404 | ✅ |
| AppShell + Header + 主题切换 + 用户菜单 | ✅ |
| `index.css` 4 套主题 CSS 变量 + Tailwind darkMode selector | ✅ |
| `npm install` 成功 | ✅（200 包 + 41 dev 包） |
| `npm run build` 0 错误 | ✅ |
| `npm run dev` 可访问 | ✅ |
| LoginPage 可工作（admin/admin123、user/user123） | ✅ |
| 主题切换实时生效 | ✅ |
| 未登录访问 /admin 跳 /login；已登录 user 访问 /admin 显示 403 | ✅ |
| 中文界面 | ✅ |
| 类型完整导出 + 每个 lib/ 子模块 index.ts 桶导出 | ✅ |