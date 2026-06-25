/**
 * HomeTools —— 首页工具快键区
 *
 * 当 SiteConfig.tools 中存在 position=home 或 both 的工具时，
 * 在 Hero 下方渲染一个"配套工具"卡片网格，
 * 让首页/文章列表承担"产品宣发"角色。
 */
import { motion } from 'framer-motion';
import { Wrench, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ToolEntry } from '@/lib/types';

export function HomeTools({ tools }: { tools: ToolEntry[] }): React.ReactElement {
  if (tools.length === 0) return <></>;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Wrench className="h-4 w-4 text-primary" />
        配套工具
        <span className="text-xs font-normal text-fg-muted">
          写与读之外，这些工具帮你跑得更快
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            className="group relative overflow-hidden border-border bg-bg-elevated transition-all hover:border-primary/40 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                  {tool.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-fg">{tool.name}</h3>
                    {tool.badge && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  {tool.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
                      {tool.description}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={tool.url}
                target={tool.target ?? '_self'}
                rel={tool.target === '_blank' ? 'noopener noreferrer' : undefined}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                打开 {tool.name}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.section>
  );
}
