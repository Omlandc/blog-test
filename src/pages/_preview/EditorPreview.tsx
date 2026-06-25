/**
 * EditorPreview —— MarkdownEditor 独立预览页
 *
 * 仅 dev 暴露（路由注册时通过 import.meta.env.DEV 判断）。
 * 提供多种示例文档切换、自动保存演示、保存回调演示。
 */
import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MarkdownEditor } from '@/components/editor';
import { toast } from '@/components/ui/toast';

const SAMPLES: { name: string; content: string }[] = [
  {
    name: '空白',
    content: '',
  },
  {
    name: '示例文章',
    content: `# 欢迎使用 Markdown 编辑器

这是一个**实时预览**的 Markdown 编辑器。你可以：

- 在左侧 \`<textarea>\` 中输入 Markdown
- 在右侧实时看到渲染效果
- 使用顶部工具栏快速插入格式
- 用 ⌘B / ⌘I / ⌘K / ⌘S 触发快捷键

## 代码高亮

\`\`\`typescript
interface User {
  id: string;
  name: string;
  permissions: string[];
}

const admin: User = {
  id: 'u_001',
  name: '管理员',
  permissions: ['*'],
};
\`\`\`

\`\`\`python
def fib(n: int):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b
\`\`\`

## 表格

| 主题 | 背景 | 主色 | 风格 |
| --- | --- | --- | --- |
| Light | #ffffff | 靛蓝 | 明亮 |
| Dark | #09090b | 浅紫 | 暗夜 |
| Sepia | #f5ecd9 | 棕黄 | 护眼 |
| Cyberpunk | #0a0014 | 霓虹 | 赛博 |

## 任务列表

- [x] 实时预览
- [x] 代码高亮
- [x] 主题切换
- [ ] 多人协作

> 💡 提示：你可以从工具栏插入图片，也支持 **粘贴** 与 **拖拽** 图片。

[了解更多 →](https://github.com)
`,
  },
  {
    name: '纯代码',
    content: '```javascript\nconst x = 42;\nconsole.log("hello", x);\n```\n',
  },
];

export default function EditorPreview(): React.ReactElement {
  const [content, setContent] = useState<string>(SAMPLES[1]?.content ?? '');
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

  const handleSave = useCallback(async (next: string): Promise<void> => {
    // 模拟异步保存
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    console.log('[EditorPreview] onSave called with', next.length, 'chars');
    toast.success('已保存', { description: `${next.length} 字符` });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-fg">MarkdownEditor 预览</h1>
          <p className="text-sm text-fg-muted">
            实时编辑 + 实时预览 + 图片上传 + 自动保存 + 快捷键 + 撤销/重做
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-fg-muted">示例：</span>
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setContent(s.content)}
              className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-fg-muted hover:bg-bg-subtle hover:text-fg"
            >
              {s.name}
            </button>
          ))}
          <label className="ml-3 inline-flex items-center gap-1.5 text-fg-muted">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            自动保存
          </label>
        </div>
      </motion.div>

      <MarkdownEditor
        value={content}
        onChange={setContent}
        onSave={handleSave}
        autoSave={autoSave}
        autoSaveDelay={1500}
        placeholder="开始你的创作…"
        initialMode={mode}
        minHeight={520}
        articleId="preview"
      />

      <div className="mt-4 rounded-md border border-dashed border-border bg-bg-subtle/40 p-4 text-xs text-fg-muted">
        <div className="mb-1 font-semibold text-fg">当前模式：{mode}</div>
        <div>
          点击工具栏右上角的双栏/编辑/预览按钮切换。当前内容长度：<strong className="text-fg">{content.length}</strong> 字符。
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('split')}
            className="rounded border border-border px-2 py-0.5 hover:bg-bg-elevated"
          >
            双栏
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="rounded border border-border px-2 py-0.5 hover:bg-bg-elevated"
          >
            仅编辑
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className="rounded border border-border px-2 py-0.5 hover:bg-bg-elevated"
          >
            仅预览
          </button>
        </div>
      </div>
    </div>
  );
}