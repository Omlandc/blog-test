/**
 * ViewerPreview —— ArticleViewer 独立预览页
 *
 * 仅 dev 暴露。展示文章渲染器：
 *  - Markdown 渲染（标题、列表、引用、代码高亮、表格、图片、链接、删除线、任务列表）
 *  - TOC（右侧悬浮）
 *  - 阅读进度条（顶部）
 *  - 代码块复制按钮
 *  - 图片 Lightbox
 *  - XSS 过滤（自动注入的 <script> 会被剥离）
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArticleViewer } from '@/components/viewer';
import { toast } from '@/components/ui/toast';

const SAMPLE_CONTENT = `# ArticleViewer 演示

> 这是一篇用于演示 **ArticleViewer** 的示例文章，涵盖了 Markdown 的全部核心语法。

## 一、文本格式

普通段落里可以包含 **粗体**、*斜体*、~~删除线~~、\`行内代码\`，也可以组合使用，例如：**\`加粗的代码\`**。

下面是一个引用块：

> "工欲善其事，必先利其器。" —— 《论语》

## 二、列表

### 无序列表
- React 18
  - Suspense
  - Concurrent Rendering
- Vite 5
- TypeScript 5
- Tailwind CSS 3

### 有序列表
1. 安装依赖
2. 启动开发服务器
3. 打开浏览器预览

### 任务列表
- [x] Markdown 渲染
- [x] 代码高亮
- [x] 阅读进度条
- [x] 目录（TOC）
- [x] 图片 Lightbox
- [ ] 实时协作（规划中）

## 三、代码块

### TypeScript

\`\`\`typescript
import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const html = hljs.highlight(text, { language: lang ?? 'plaintext' }).value;
  return \`<pre><code class="hljs language-\${lang}">\${html}</code></pre>\`;
};

marked.use({ renderer, gfm: true });
\`\`\`

### Python

\`\`\`python
from dataclasses import dataclass

@dataclass
class Article:
    id: str
    title: str
    content: str
    views: int = 0

    def increment(self):
        self.views += 1
\`\`\`

### Bash

\`\`\`bash
# 安装依赖
npm install
# 启动 dev server
npm run dev
# 构建生产版本
npm run build
\`\`\`

## 四、表格

| 组件 | 文件 | 状态 |
| --- | --- | --- |
| MarkdownEditor | \`src/components/editor\` | ✅ 完成 |
| ArticleViewer | \`src/components/viewer\` | ✅ 完成 |
| Lightbox | \`src/components/viewer\` | ✅ 完成 |
| TOC | \`src/components/viewer\` | ✅ 完成 |

## 五、图片

### 在线图片

![Markdown Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Markdown-mark.svg/208px-Markdown-mark.svg.png)

### Base64 / dataURL（来自 Mock 上传器）

如果之前在编辑器中上传过图片，会作为 base64 内联在此处。

## 六、链接

- [Markdown 官方文档](https://commonmark.org/)
- [highlight.js](https://highlight.js.org/)
- [DOMPurify](https://github.com/cure53/DOMPurify)

## 七、XSS 防护

下面的内容如果直接渲染，\`<script>\` 标签会被 DOMPurify 自动剥离：

<script>alert('XSS!');</script>

~~这是一个删除线示例~~

---

## 八、分割线之后

到这里示例就结束了。试试看：

- **滚动** 页面：顶部进度条会跟随移动
- **点击** 代码块右上角的"复制"按钮：会复制代码并弹出 toast
- **点击** 图片：会打开全屏 Lightbox（支持滚轮缩放、拖拽、键盘 ESC 关闭）

> 再次切换主题（右上角调色板按钮），所有颜色都会自动跟随 CSS 变量重新渲染。
`;

export default function ViewerPreview(): React.ReactElement {
  const [showToc, setShowToc] = useState<boolean>(true);
  const [showProgress, setShowProgress] = useState<boolean>(true);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-fg">ArticleViewer 预览</h1>
          <p className="text-sm text-fg-muted">
            Markdown 渲染 + 代码高亮 + TOC + 阅读进度 + Lightbox + XSS 防护
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showToc}
              onChange={(e) => setShowToc(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            显示 TOC
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showProgress}
              onChange={(e) => setShowProgress(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            显示进度条
          </label>
          <button
            type="button"
            onClick={() => toast.show('提示', { description: 'toast 也能在 viewer 内触发' })}
            className="rounded border border-border bg-bg-elevated px-2 py-1 hover:bg-bg-subtle"
          >
            测试 toast
          </button>
        </div>
      </motion.div>

      <ArticleViewer
        content={SAMPLE_CONTENT}
        showToc={showToc}
        showProgress={showProgress}
        onImageClick={(url) => {
          toast.show('外部图片点击回调', { description: url });
        }}
      />
    </div>
  );
}