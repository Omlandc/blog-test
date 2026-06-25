/**
 * Explorables 注册表
 *
 * 静态导入所有专栏模块，按 slug 索引。
 * 详情页用 lazy load 拉组件。
 *
 * 增删改查：
 * - 增：在 seed.ts 加一条
 * - 删：删 seed.ts 一条
 * - 改 meta：改 seed.ts
 * - 改 component：改 components/explorables/ 下对应文件
 * - "查" = 通过 list() 自动出现在 /explore
 */
import { useEffect, useState, lazy, Suspense, type ComponentType } from 'react';
import type { ExplorableMeta, ExplorableModule } from './types';

import { themeShowcase } from './seed';

const SEED: ExplorableModule[] = [
  themeShowcase,
];

/** 注册表：slug → module */
const REGISTRY = new Map<string, ExplorableModule>(SEED.map((m) => [m.meta.slug, m]));

/** 列出全部（按 publishedAt 倒序） */
export function listExplorables(): ExplorableMeta[] {
  return Array.from(REGISTRY.values())
    .map((m) => m.meta)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 按 slug 取 meta */
export function getExplorableMeta(slug: string): ExplorableMeta | null {
  return REGISTRY.get(slug)?.meta ?? null;
}

/** 按 slug 取 lazy 组件 */
export function getExplorableComponent(slug: string): ComponentType | null {
  const m = REGISTRY.get(slug);
  if (!m) return null;
  return lazy(m.component as () => Promise<{ default: ComponentType }>);
}

/** 按 category 过滤 */
export function listExplorablesByCategory(category: ExplorableMeta['category']): ExplorableMeta[] {
  return listExplorables().filter((m) => m.category === category);
}

/** 按 tag 过滤 */
export function listExplorablesByTag(tag: string): ExplorableMeta[] {
  return listExplorables().filter((m) => m.tags.includes(tag));
}

/* ============================================================
 * React Hooks
 * ============================================================ */

interface UseExplorableResult {
  meta: ExplorableMeta | null;
  Component: ComponentType | null;
  loading: boolean;
}

/** 单个专栏的 hook（带懒加载状态） */
export function useExplorable(slug: string): UseExplorableResult {
  const [meta, setMeta] = useState<ExplorableMeta | null>(() => getExplorableMeta(slug));
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMeta(getExplorableMeta(slug));
    const loader = REGISTRY.get(slug)?.component;
    if (!loader) {
      setComponent(null);
      setLoading(false);
      return;
    }
    loader()
      .then((mod) => {
        if (cancelled) return;
        // 兼容 { default: Component } 与裸组件
        const C = (mod as { default: ComponentType }).default ?? (mod as unknown as ComponentType);
        setComponent(() => C);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { meta, Component, loading };
}

/** Suspense 包装（详情页用） */
export function ExplorableBoundary({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Suspense fallback={<ExplorableSkeleton />}>{children}</Suspense>;
}

function ExplorableSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="h-8 w-2/3 animate-pulse rounded bg-bg-elevated" />
      <div className="h-64 animate-pulse rounded-lg bg-bg-elevated" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 animate-pulse rounded bg-bg-elevated" />
        <div className="h-32 animate-pulse rounded bg-bg-elevated" />
      </div>
    </div>
  );
}
