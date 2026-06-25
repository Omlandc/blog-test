/**
 * ReadingProgress —— 顶部阅读进度条
 *
 * 监听 window scroll，根据"已滚动距离 / 可滚动距离"计算百分比，
 * 渲染顶部固定进度条。颜色使用主题 CSS 变量。
 */
import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ReadingProgressProps {
  /** 监听的目标元素（默认 document） */
  target?: React.RefObject<HTMLElement>;
  /** 颜色变体：primary / accent */
  color?: 'primary' | 'accent';
  /** 自定义高度（px） */
  height?: number;
  className?: string;
}

export function ReadingProgress({
  target,
  color = 'primary',
  height = 3,
  className,
}: ReadingProgressProps): React.ReactElement {
  const { scrollYProgress } = useScroll(
    target?.current ? { target } : undefined,
  );
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.4,
  });

  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const unsub = smooth.on('change', (v) => setPercent(v * 100));
    return () => unsub();
  }, [smooth]);

  return (
    <div
      role="progressbar"
      aria-label="阅读进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={cn(
        'fixed left-0 right-0 top-0 z-40 bg-transparent',
        className,
      )}
      style={{ height, pointerEvents: 'none' }}
    >
      <motion.div
        style={{ scaleX: smooth, transformOrigin: '0 50%', height }}
        className={cn(
          'h-full w-full',
          color === 'primary' ? 'bg-primary' : 'bg-accent',
        )}
      />
    </div>
  );
}