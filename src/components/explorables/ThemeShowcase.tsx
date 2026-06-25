/**
 * ThemeShowcase —— 主题切换演示（v1 第一篇 Explorables）
 *
 * 互动元素：
 * 1. 主题切换（4 套）—— 实时影响下方所有 demo
 * 2. CSS 变量实时数值展示
 * 3. 组件变体展示（Card / Button / Badge / Input）
 * 4. 对比模式（两个主题并排看）
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Coffee,
  Zap,
  Copy,
  Check,
  GitCompare,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { cn } from '@/lib/utils';

type ThemeId = 'light' | 'dark' | 'sepia' | 'cyberpunk';

const THEMES: Array<{
  id: ThemeId;
  name: string;
  icon: typeof Sun;
  description: string;
}> = [
  { id: 'light', name: '明亮', icon: Sun, description: '日间默认' },
  { id: 'dark', name: '暗黑', icon: Moon, description: '夜间低光' },
  { id: 'sepia', name: '护眼', icon: Coffee, description: '阅读友好' },
  { id: 'cyberpunk', name: '赛博', icon: Zap, description: '高对比度' },
];

interface TokenSnapshot {
  name: string;
  value: string;
  description: string;
}

function readTokens(): TokenSnapshot[] {
  if (typeof window === 'undefined') return [];
  const cs = getComputedStyle(document.documentElement);
  const names: Array<[string, string]> = [
    ['--color-bg', '背景色'],
    ['--color-bg-elevated', '抬升背景'],
    ['--color-bg-subtle', '次级背景'],
    ['--color-fg', '主前景色'],
    ['--color-fg-muted', '次级文字'],
    ['--color-primary', '主色'],
    ['--color-primary-fg', '主色文字'],
    ['--color-border', '边框'],
    ['--color-success', '成功'],
    ['--color-warning', '警告'],
    ['--color-danger', '危险'],
  ];
  return names.map(([n, desc]) => ({
    name: n,
    value: cs.getPropertyValue(n).trim() || '—',
    description: desc,
  }));
}

export default function ThemeShowcase(): React.ReactElement {
  const [activeTheme, setActiveTheme] = useState<ThemeId>('light');
  const [compareTheme, setCompareTheme] = useState<ThemeId>('dark');
  const [showCompare, setShowCompare] = useState(false);
  const [tokens, setTokens] = useState<TokenSnapshot[]>(() => readTokens());
  const [copied, setCopied] = useState(false);

  // 切换主题
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
    setTokens(readTokens());
  }, [activeTheme]);

  const handleCopy = async (): Promise<void> => {
    const css = `:root[data-theme="${activeTheme}"] {\n${tokens
      .map((t) => `  ${t.name}: ${t.value};`)
      .join('\n')}\n}`;
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. 主题选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" /> 选择主题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(t.id)}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                    active
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-bg-elevated hover:border-primary/40',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      active ? 'text-primary' : 'text-fg-muted',
                    )}
                  />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-fg">{t.name}</div>
                    <div className="text-xs text-fg-muted">{t.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
            <span>你已经在用：</span>
            <ThemeSwitcher variant="dropdown" />
            <span className="ml-2">
              两者会保持同步（在演示里选的也会被保存为你的偏好）
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. CSS 变量实时值 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> 当前生效的 CSS 变量
            </span>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" /> 已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> 复制变量
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {tokens.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-xs"
              >
                <div
                  className="h-4 w-4 shrink-0 rounded border border-border"
                  style={{ backgroundColor: `var(${t.name})` }}
                  aria-hidden
                />
                <span className="font-semibold text-fg">{t.description}</span>
                <span className="ml-auto truncate text-fg-muted">{t.name}</span>
                <span className="shrink-0 rounded bg-bg-elevated px-1.5 py-0.5 text-fg">
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. 组件变体展示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">组件在当前主题下的呈现</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>主按钮</Button>
            <Button variant="secondary">次按钮</Button>
            <Button variant="outline">描边</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="destructive">危险</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>默认</Badge>
            <Badge variant="secondary">次级</Badge>
            <Badge variant="outline">描边</Badge>
            <Badge variant="danger">警示</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="输入框" defaultValue="示例文本" />
            <Input placeholder="禁用" disabled defaultValue="不可编辑" />
          </div>
          <Card className="border-dashed">
            <CardContent className="p-4">
              <p className="text-sm text-fg">
                这是一张卡片。注意 border、shadow、padding、文字色在主题切换下都跟着变量变。
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                不会突然出现"白底黑字"或"黑底白字"的硬切。
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* 4. 对比模式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" /> 并排对比
            </span>
            <Button
              size="sm"
              variant={showCompare ? 'default' : 'outline'}
              onClick={() => setShowCompare(!showCompare)}
            >
              {showCompare ? '关闭对比' : '打开对比'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCompare ? (
            <CompareView
              leftTheme={activeTheme}
              rightTheme={compareTheme}
              onChangeRight={setCompareTheme}
            />
          ) : (
            <p className="text-sm text-fg-muted">
              打开对比可以同时预览两个主题的呈现，适合做"哪个更适合长期阅读"这种判断。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 5. 它是怎么工作的（简短文字） */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">它怎么工作的？</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-fg-muted">
          <ul className="space-y-2 text-sm">
            <li>
              <strong className="text-fg">4 套主题，1 个变量表。</strong>{' '}
              每套主题在{' '}
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
                [data-theme=&quot;xxx&quot;]
              </code>{' '}
              选择器下定义同名变量。
            </li>
            <li>
              <strong className="text-fg">组件不写死颜色。</strong>{' '}
              全部用{' '}
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">
                bg-bg-elevated
              </code>{' '}
              这类 Tailwind 别名 → CSS 变量。
            </li>
            <li>
              <strong className="text-fg">切换瞬间生效。</strong>{' '}
              改 <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">document.documentElement</code> 的{' '}
              <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs">data-theme</code>，所有变量重新解析。
            </li>
            <li>
              <strong className="text-fg">没有 CLS。</strong>{' '}
              字体、圆角、间距都是变量值，不会因为主题切换导致布局跳动。
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * 对比视图：两个主题并排显示同一段内容
 * ============================================================ */

function CompareView({
  leftTheme,
  rightTheme,
  onChangeRight,
}: {
  leftTheme: ThemeId;
  rightTheme: ThemeId;
  onChangeRight: (t: ThemeId) => void;
}): React.ReactElement {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <PreviewPane theme={leftTheme} label="左侧" editable={false} />
      <PreviewPane
        theme={rightTheme}
        label="右侧"
        editable={true}
        onChangeTheme={onChangeRight}
      />
    </div>
  );
}

function PreviewPane({
  theme,
  label,
  editable,
  onChangeTheme,
}: {
  theme: ThemeId;
  label: string;
  editable: boolean;
  onChangeTheme?: (t: ThemeId) => void;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-fg-muted">
          {label} · {THEMES.find((t) => t.id === theme)?.name}
        </span>
        {editable && onChangeTheme && (
          <select
            value={theme}
            onChange={(e) => onChangeTheme(e.target.value as ThemeId)}
            className="rounded border border-border bg-bg-elevated px-2 py-1 text-xs text-fg"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div
        data-theme={theme}
        className="rounded-lg border border-border p-4 transition-colors"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-fg)' }}
      >
        <SampleContent />
      </div>
    </div>
  );
}

function SampleContent(): React.ReactElement {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold" style={{ color: 'var(--color-fg)' }}>
        文章标题示例
      </h3>
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
        这是一段示例正文。主题切换时，背景、文字、卡片、按钮、徽章都会跟着变量变。
      </p>
      <div className="flex flex-wrap gap-2">
        <span
          className="rounded px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          主色徽章
        </span>
        <span
          className="rounded border px-2 py-0.5 text-xs"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-fg-muted)' }}
        >
          描边
        </span>
      </div>
      <button
        className="rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        主按钮
      </button>
      <div
        className="rounded-md p-3"
        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
      >
        <code
          className="font-mono text-xs"
          style={{ color: 'var(--color-code-fg, var(--color-fg))' }}
        >
          const theme = &#39;light&#39;;
        </code>
      </div>
    </div>
  );
}
