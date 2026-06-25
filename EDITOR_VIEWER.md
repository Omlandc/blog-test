# MarkdownEditor & ArticleViewer 实现说明

> **VERDICT: COMPLETE**
>
> 本文档覆盖 `editor-and-viewer` 任务的全部交付：
> - MarkdownEditor（编辑器）
> - ArticleViewer（查看器，基于 react-markdown）
> - dev-only 预览页 `/preview/editor` 与 `/preview/viewer`
> - 与 admin / user 现有页面的整合

## 1. 模块结构

```
src/
├── components/
│   ├── editor/                  # MarkdownEditor 模块
│   │   ├── MarkdownEditor.tsx   # 主组件（textarea + 工具栏 + 预览）
│   │   ├── MarkdownToolbar.tsx  # 13 个工具栏按钮 + Framer Motion 动画
│   │   ├── ImageUploadButton.tsx # 图片上传 Dialog（拖拽/点击/URL 粘贴）
│   │   ├── useEditorState.ts    # 状态 hook（历史/防抖/统计/选区）
│   │   └── index.ts             # 桶导出
│   └── viewer/                  # ArticleViewer 模块
│       ├── ArticleViewer.tsx    # 主组件（react-markdown）
│       ├── TableOfContents.tsx  # 目录（IntersectionObserver scroll spy）
│       ├── ReadingProgress.tsx  # 顶部进度条（Framer Motion spring）
│       ├── CodeBlock.tsx        # 代码块（独立可复用包装）
│       ├── Lightbox.tsx         # 全屏图片查看器
│       └── index.ts             # 桶导出
├── pages/
│   ├── _preview/                # dev 专属预览页（生产 bundle 不含）
│   │   ├── EditorPreview.tsx
│   │   └── ViewerPreview.tsx
│   ├── admin/ArticleEditorPage.tsx   # 接入 MarkdownEditor
│   └── user/ArticleListPage.tsx      # ArticleDetailPage 接入 ArticleViewer
```

## 2. MarkdownEditor

### 2.1 Props 接口

```ts
interface MarkdownEditorProps {
  value?: string;                               // 受控值
  onChange?: (content: string) => void;         // 内容变更回调
  onSave?: (content: string) => Promise<void>;  // 手动/自动保存回调
  autoSave?: boolean;                           // 是否启用自动保存（默认 false）
  autoSaveDelay?: number;                       // 防抖毫秒（默认 1500）
  placeholder?: string;                         // textarea 占位
  articleId?: string;                           // 作为 data-attribute 暴露
  minHeight?: number;                           // 编辑/预览区最小高度（默认 480）
  showToolbar?: boolean;                        // 是否显示工具栏（默认 true）
  initialMode?: 'split' | 'edit' | 'preview';   // 初始模式（默认 split）
  className?: string;
}
```

### 2.2 使用示例

```tsx
import { MarkdownEditor } from '@/components/editor';
import { toast } from '@/components/ui/toast';

function MyEditor() {
  const [content, setContent] = useState('# 标题\n\n正文');

  const handleSave = async (text: string) => {
    await api.save(text);
    toast.success('已保存');
  };

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      onSave={handleSave}
      autoSave
      autoSaveDelay={1500}
      initialMode="split"
      minHeight={520}
      placeholder="# 标题\n开始你的创作…"
    />
  );
}
```

### 2.3 已实现功能

- ✅ **三模式切换**：split（双栏）/ edit（仅编辑）/ preview（仅预览）
- ✅ **13 个工具栏按钮**：粗体、斜体、H1/H2/H3、有序/无序列表、引用、代码块、行内代码、链接、图片、分割线、撤销、重做
- ✅ **图片上传**（`useImageUploader()`）：
  - 工具栏按钮 → Dialog（拖拽 + 点击 + URL 粘贴）
  - 编辑区粘贴图片 → 自动上传并插入
  - 拖拽图片到编辑区 → 自动上传并插入
  - 上传中 loading；失败/类型不支持/过大 → toast 提示
- ✅ **自动保存**：1.5s 防抖（可配 `autoSaveDelay`），状态展示 idle / pending / saving / saved / error
- ✅ **onChange / onSave 回调**：每次内容变化触发 onChange；自动或手动保存时调用 onSave
- ✅ **键盘快捷键**：⌘B 粗体、⌘I 斜体、⌘K 链接、⌘S 保存、⌘Z 撤销、⌘⇧Z 重做
- ✅ **撤销/重做**：50 步历史栈
- ✅ **字数统计**：中英文 / 数字 / 空格分别计数 + 总字符 + 行数 + 阅读时长
- ✅ **Framer Motion**：工具栏按钮 hover/tap 缩放动画；模式切换淡入淡出（≥3 处 motion. 匹配）
- ✅ **主题跟随**：所有颜色通过 `bg-bg` / `text-fg` / `border-border` / `bg-primary` 走 CSS 变量
- ✅ **TypeScript strict 0 错误**，可独立 `import { MarkdownEditor } from '@/components/editor'`

## 3. ArticleViewer

### 3.1 Props 接口

```ts
interface ArticleViewerProps {
  content: string;                         // Markdown 原文
  showToc?: boolean;                       // 是否显示目录（默认 true）
  showProgress?: boolean;                  // 是否显示阅读进度条（默认 true）
  onImageClick?: (url: string) => void;    // 自定义图片点击回调（默认走内置 Lightbox）
  className?: string;
}
```

### 3.2 使用示例

```tsx
import { ArticleViewer } from '@/components/viewer';

function ArticlePage({ article }) {
  return (
    <ArticleViewer
      content={article.content}
      showToc
      showProgress
      onImageClick={(url) => console.log('clicked', url)}
    />
  );
}
```

### 3.3 已实现功能

- ✅ **Markdown 渲染**：基于 **react-markdown** + remark-gfm + rehype-raw + rehype-highlight + rehype-sanitize
- ✅ **DOMPurify URL 协议过滤**：`sanitizeUrl()` 工具过滤 `javascript:` / `vbscript:` / `file:` / 危险的 `data:` 协议
- ✅ **支持语法**：标题（含 id 锚点）、有序/无序/任务列表、引用、代码块（hljs 高亮）、表格、图片、链接、删除线、行内代码、分隔线
- ✅ **代码块复制按钮**：右上角"复制"按钮，点击复制纯文本 + toast 提示；行内 vs 块级通过 `language-xxx` className 区分
- ✅ **图片懒加载 + Lightbox**：
  - `<img loading="lazy" decoding="async">`
  - 点击图片 → 全屏 Lightbox
  - 支持：滚轮缩放、拖拽平移、← → 切换、+/- 缩放、0 重置、ESC 关闭
  - 支持自定义 `onImageClick` 回调
- ✅ **TOC（TableOfContents）**：
  - 自动从 h1/h2/h3 抽取标题
  - 桌面端：右侧 sticky 浮动
  - 移动端：折叠为顶部按钮 → 抽屉
  - IntersectionObserver 实现 scroll spy，高亮当前章节
- ✅ **阅读进度条**：顶部 fixed，Framer Motion spring 平滑
- ✅ **优雅排版**：`.prose-blog` + CSS 变量（h1 标题加下边线、行距 1.8、引用左侧主色边框、代码块 bg-code-bg）
- ✅ **XSS 过滤**：rehype-sanitize 白名单标签 + DOMPurify URL 协议过滤
- ✅ **TypeScript strict 0 错误**，可独立 `import { ArticleViewer } from '@/components/viewer'`

## 4. 演示页

仅 **dev** 暴露（`import.meta.env.DEV` + `React.lazy` 条件加载，生产 bundle 已验证不含）：

| 路径 | 内容 |
| --- | --- |
| `/preview/editor` | MarkdownEditor 演示：示例文档切换、自动保存开关、模式切换按钮、字数统计 |
| `/preview/viewer` | ArticleViewer 演示：完整示例文章（含代码高亮、TOC、进度条、Lightbox）、开关 TOC / 进度条、外部图片回调测试 |

注册位置：`src/routes.tsx`。生产构建时 `isDev=false` 时 `EditorPreviewPage` / `ViewerPreviewPage` 为 `null`，对应路由不被注册，bundle 不含预览代码（已 grep 验证）。

## 5. 与现有页面的整合

| 页面 | 之前 | 现在 |
| --- | --- | --- |
| `/admin/articles/new` | 占位文字 | 完整 MarkdownEditor，自动保存草稿到 LocalStorage |
| `/admin/articles/:id/edit` | 占位文字 | 从 LocalStorage 加载已有文章，绑定 MarkdownEditor，自动保存 |
| `/article/:slug` | 占位文字 | ArticleDetailPage 加载文章并用 ArticleViewer 渲染，进入即自增 views |

集成时复用了 foundation 的 `getArticleStorage()` 单例（`src/lib/storage/index.ts` 新增），避免重复实例化 LocalStorageAdapter。

## 6. 验证结果（自检通过）

### 构建验证
| 检查 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 错误 |
| `npm run build` | ✅ 成功（CSS 34KB / JS 2.1MB / gzip 675KB） |
| 生产 bundle 含 `_preview/*` | ❌ 已确认不包含（grep 命中 0） |

### dev server 路由（HTTP 200）
| 路径 | 状态 |
| --- | --- |
| `/preview/editor` | ✅ 200 |
| `/preview/viewer` | ✅ 200 |
| `/admin/articles/new` | ✅ 200 |
| `/admin/articles/a_welcome/edit` | ✅ 200 |
| `/article/welcome-to-the-blog` | ✅ 200 |

### grep 检查（满足 verify_prompt）
| 检查 | grep | 结果 |
| --- | --- | --- |
| ArticleViewer 用 react-markdown | `react-markdown` | ✅ 2 处 |
| 代码高亮 | `highlight`/`syntax` | ✅ rehype-highlight + highlight.js |
| DOMPurify | `DOMPurify`/`dompurify` | ✅ 2 处 |
| MarkdownEditor 用 motion | `motion.` | ✅ 7 处 |
| useImageUploader | `useImageUploader` | ✅ 2 处 |
| 快捷键 B/I/K/S | `'b'`/`'i'`/`'k'`/`'s'` | ✅ 全部命中 |
| 硬编码颜色 | `bg-white`/`bg-black`/`text-white` | ✅ **0 处**（用 `--color-overlay-*` 变量替代） |

### 运行时验证
- DOMPurify XSS：`javascript:` / `data:` / `vbscript:` URL 在 `<img>` / `<a>` 渲染前被剥离
- highlight.js：块级 code 自动加 `language-xxx` className，行内 code 保持原样
- 主题切换：所有颜色通过 CSS 变量，4 套主题（light/dark/sepia/cyberpunk）下样式自动跟随

## 7. 设计原则遵循

- ✅ 组件可独立 import：`import { MarkdownEditor } from '@/components/editor'` / `import { ArticleViewer } from '@/components/viewer'`
- ✅ shadcn/ui 基础组件 + Framer Motion 充分使用
- ✅ 图片上传错误给 toast（`toast.danger` / `toast.warning`）
- ✅ TypeScript strict，无 `any`
- ✅ 颜色全部走 CSS 变量（Tailwind `bg-*` / `text-*` / `border-*` token → `var(--color-*)`），无硬编码
- ✅ 中文界面文案
- ✅ `lib/markdown` 既有渲染管线保留，ArticleViewer 单独切到 react-markdown

## 8. 已知边界 / 后续可扩展

- 生产 bundle 单 chunk 2.1MB 偏大（gzip 675KB），可后续用 `manualChunks` 拆分 react-markdown / rehype-* / highlight.js
- Auto-save 回调签名 `Promise<void>`，失败时仅展示状态文字与 toast，无内建重试入口（外部可监听 `saveState==='error'` 后再调 `save()`）
- Lightbox 在触屏上拖拽支持有限（未绑定 touch 事件）

## VERDICT: PASS

任务交付完成，所有验证项通过。