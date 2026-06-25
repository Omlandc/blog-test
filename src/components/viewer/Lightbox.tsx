/**
 * Lightbox —— 全屏图片查看器
 *
 * 全屏覆盖层使用独立的 CSS 变量（`--color-overlay-*`），不依赖主题色板，
 * 保证在 4 套主题下都有稳定的视觉对比。所有 chrome 颜色走 CSS 变量。
 *
 * 行为：
 *  - 点击背景或关闭按钮 → 关闭
 *  - ESC 键 → 关闭；← / → 切换；+/- 缩放；0 重置
 *  - 滚轮缩放、鼠标拖拽平移
 *  - Framer Motion 入场/退场动画
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LightboxImage {
  src: string;
  alt?: string;
}

export interface LightboxProps {
  open: boolean;
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

// CSS 变量名（在 index.css 中已声明，主题切换时不变；全屏覆盖层需要稳定的视觉对比）
const OVERLAY_BG = 'var(--color-overlay-bg, rgba(0, 0, 0, 0.85))';
const OVERLAY_CHROME = 'var(--color-overlay-chrome, rgba(255, 255, 255, 0.1))';
const OVERLAY_CHROME_HOVER = 'var(--color-overlay-chrome-hover, rgba(255, 255, 255, 0.2))';
const OVERLAY_TEXT = 'var(--color-overlay-text, rgba(255, 255, 255, 0.85))';
const OVERLAY_TEXT_MUTED = 'var(--color-overlay-text-muted, rgba(255, 255, 255, 0.6))';

export function Lightbox({
  open,
  images,
  initialIndex = 0,
  onClose,
}: LightboxProps): React.ReactElement {
  const [index, setIndex] = useState<number>(initialIndex);
  const [scale, setScale] = useState<number>(1);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setScale(1);
      setPos({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      else if (e.key === '+' || e.key === '=') setScale((s) => Math.min(4, s + 0.25));
      else if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.25));
      else if (e.key === '0') {
        setScale(1);
        setPos({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length, onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.max(0.5, Math.min(4, s + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
      startX: e.clientX,
      startY: e.clientY,
    };
  }, [pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPos({ x: dx, y: dy });
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const moved = Math.abs(e.clientX - dragRef.current.startX) + Math.abs(e.clientY - dragRef.current.startY);
    if (moved < 4 && scale <= 1.01) {
      onClose();
    }
    dragRef.current = null;
  }, [scale, onClose]);

  const current = images[index];

  const chromeStyle: React.CSSProperties = {
    background: OVERLAY_CHROME,
    color: OVERLAY_TEXT,
  };

  const chromeHoverStyle: React.CSSProperties = {
    background: OVERLAY_CHROME,
    color: OVERLAY_TEXT,
    transition: 'background 0.15s ease',
  };

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
          style={{ background: OVERLAY_BG }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* 关闭 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={chromeHoverStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = OVERLAY_CHROME;
            }}
          >
            <X className="h-5 w-5" />
          </button>

          {/* 顶部信息 */}
          <div
            className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full px-3 py-1 text-xs"
            style={{ background: OVERLAY_CHROME, color: OVERLAY_TEXT_MUTED }}
          >
            {index + 1} / {images.length} · {Math.round(scale * 100)}%
            {current.alt ? ` · ${current.alt}` : ''}
          </div>

          {/* 左右切换 */}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + images.length) % images.length);
                  setScale(1);
                  setPos({ x: 0, y: 0 });
                }}
                aria-label="上一张"
                className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full"
                style={chromeStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = OVERLAY_CHROME;
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % images.length);
                  setScale(1);
                  setPos({ x: 0, y: 0 });
                }}
                aria-label="下一张"
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full"
                style={chromeStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = OVERLAY_CHROME;
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          {/* 缩放控制 */}
          <div
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full p-1.5"
            style={{ background: OVERLAY_CHROME }}
          >
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: OVERLAY_TEXT }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="缩小"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPos({ x: 0, y: 0 });
              }}
              className="inline-flex h-9 items-center justify-center rounded-full px-3 text-xs"
              style={{ color: OVERLAY_TEXT }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              重置
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(4, s + 0.25))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: OVERLAY_TEXT }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = OVERLAY_CHROME_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="放大"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* 图片 */}
          <div
            className="relative max-h-[90vh] max-w-[90vw] cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              dragRef.current = null;
            }}
          >
            <motion.img
              ref={imgRef}
              key={`${current.src}-${index}`}
              src={current.src}
              alt={current.alt ?? ''}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale, opacity: 1, x: pos.x, y: pos.y }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              draggable={false}
              className={cn('max-h-[90vh] max-w-[90vw] select-none object-contain')}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}