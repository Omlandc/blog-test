/**
 * 图片上传策略配置（图床设置）
 *
 * 用户可在 /admin/site-config 配置：
 * - 默认策略（远程 URL / 压缩 / 自定义 HTTP / Mock）
 * - 自定义 HTTP endpoint（用于自建图床：OSS/S3/COS/七牛/imgur 等）
 * - 压缩参数（maxWidth / quality / mimeType）
 * - 默认 CDN 域名（拼接相对路径用）
 */
import { useEffect, useState, useCallback } from 'react';

export type ImageStrategy = 'remote-url' | 'compressed' | 'custom-http' | 'mock';

export interface ImageHostingConfig {
  strategy: ImageStrategy;
  /** 自定义 HTTP endpoint（POST 接口，接收 multipart/form-data） */
  customHttpEndpoint?: string;
  /** 自定义 endpoint 需要的额外 header（JSON 字符串） */
  customHttpHeaders?: string;
  /** 响应字段映射（如 { url: 'data.url' }） */
  customHttpResponseField?: string;
  /** 压缩参数 */
  maxWidth?: number;
  quality?: number;
  /** 输出的 MIME（默认 image/webp） */
  mimeType?: string;
  /** 默认 CDN 域名（上传成功后若返回的是相对路径，自动拼接） */
  cdnBase?: string;
}

const STORAGE_KEY = 'blog-system:image-config';

const DEFAULT_CONFIG: ImageHostingConfig = {
  strategy: 'remote-url',
  maxWidth: 1600,
  quality: 0.82,
  mimeType: 'image/webp',
};

/* ------------------------------------------------------------------ */
/*  持久化（localStorage）                                              */
/* ------------------------------------------------------------------ */
function readConfig(): ImageHostingConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as ImageHostingConfig) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeConfig(cfg: ImageHostingConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function getImageHostingConfig(): ImageHostingConfig {
  return readConfig();
}

export function setImageHostingConfig(cfg: ImageHostingConfig): void {
  writeConfig(cfg);
}

/* ------------------------------------------------------------------ */
/*  工厂：根据 config 创建对应的 uploader 实例                          */
/* ------------------------------------------------------------------ */
export function describeStrategy(s: ImageStrategy): { name: string; desc: string; pros: string; cons: string } {
  switch (s) {
    case 'remote-url':
      return {
        name: '远程 URL',
        desc: '粘贴/输入图片 URL，零存储',
        pros: '0 存储成本 · GitHub Pages 友好 · 不占 localStorage',
        cons: '需要图片已在网络上 · 第三方图床可能失效',
      };
    case 'compressed':
      return {
        name: '客户端压缩',
        desc: 'canvas 压缩后转 WebP/base64',
        pros: '完全本地 · 不依赖外部服务 · 自动优化大小',
        cons: '占 localStorage · 跨设备无法共享',
      };
    case 'custom-http':
      return {
        name: '自定义 HTTP',
        desc: 'POST 到你自己的图床（OSS/S3/七牛/imgur 等）',
        pros: '自有图床 · 跨设备 · 永久链接',
        cons: '需要后端或图床服务 · 需配置 endpoint',
      };
    case 'mock':
      return {
        name: '演示 (Mock)',
        desc: '原样 base64，仅供本地演示',
        pros: '零配置 · 离线可用',
        cons: '占 localStorage · 不真实',
      };
  }
}

/* ------------------------------------------------------------------ */
/*  React Hook                                                          */
/* ------------------------------------------------------------------ */
export function useImageHostingConfig(): {
  config: ImageHostingConfig;
  update: (patch: Partial<ImageHostingConfig>) => void;
  reset: () => void;
} {
  const [config, setConfig] = useState<ImageHostingConfig>(() => readConfig());

  // 监听跨标签页更新
  useEffect(() => {
    const handler = (): void => setConfig(readConfig());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const update = useCallback((patch: Partial<ImageHostingConfig>): void => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      writeConfig(next);
      return next;
    });
  }, []);

  const reset = useCallback((): void => {
    setConfig(DEFAULT_CONFIG);
    writeConfig(DEFAULT_CONFIG);
  }, []);

  return { config, update, reset };
}
