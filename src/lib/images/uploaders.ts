/**
 * 图片上传器：RemoteUrl + Compressed + Mock
 *
 * - RemoteUrlImageUploader：粘贴/输入 URL，零存储成本，GitHub Pages 友好
 * - CompressedImageUploader：canvas 压缩后转 base64（可控大小）
 * - MockImageUploader：原样 base64，仅供演示
 */
import type { ImageUploader } from './types';
import type { UploadedImage, UploadOptions } from '../types';
import { getImageDimensions } from '../utils';

const DEFAULT_ACCEPTS = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/* ============================================================
 * 1. RemoteUrl —— 粘贴/输入 URL，零存储
 * ============================================================ */

export class RemoteUrlImageUploader implements ImageUploader {
  accepts = DEFAULT_ACCEPTS;
  maxSize = Infinity;

  /**
   * 远程 URL 模式不直接接收 File，而是由调用方传 { url, filename? }。
   * 为了兼容 ImageUploader 接口，这里如果传 File 就视为"读取其内容作为 dataURL"，
   * 真正的"输入 URL"在编辑器里有专门 UI。
   */
  async upload(_file: File, _options?: UploadOptions): Promise<UploadedImage> {
    throw new Error(
      'RemoteUrlImageUploader 不支持文件上传，请在 UI 中使用"插入 URL"功能',
    );
  }

  async uploadMany(_files: File[]): Promise<UploadedImage[]> {
    throw new Error('同上，请使用 addByUrl');
  }

  /** 通过 URL 直接添加（核心方法） */
  async addByUrl(url: string, filename?: string): Promise<UploadedImage> {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('URL 必须以 http:// 或 https:// 开头');
    }
    // 探测尺寸
    let width: number | undefined;
    let height: number | undefined;
    try {
      const dim = await getImageDimensions(url);
      width = dim.width;
      height = dim.height;
    } catch {
      // 跨域图片可能拿不到尺寸，跳过
    }
    return {
      url,
      width,
      height,
      filename: filename ?? url.split('/').pop()?.slice(0, 64) ?? 'remote-image',
      source: 'remote',
    };
  }
}

/* ============================================================
 * 2. Compressed —— canvas 客户端压缩
 * ============================================================ */

export interface CompressedUploaderOptions {
  /** 最大宽边（像素）。默认 1600 */
  maxWidth?: number;
  /** 压缩质量 0-1，默认 0.82 */
  quality?: number;
  /** 输出格式，默认 image/webp（兼容性 + 体积） */
  mimeType?: 'image/webp' | 'image/jpeg';
  /** 压缩后仍超过该字节数则报错。默认 250KB */
  warnAfterBytes?: number;
}

/**
 * 在浏览器内用 <canvas> 压缩图片后转 base64。
 * 适合"图片也希望跟着 localStorage 走，但又不想爆配额"的场景。
 *
 * 与 Mock 的区别：自动降分辨率 + 重编码，体积通常能压到原来的 1/5 ~ 1/20。
 */
export class CompressedImageUploader implements ImageUploader {
  accepts = DEFAULT_ACCEPTS;
  maxSize = 10 * 1024 * 1024; // 上传前 10MB（压缩后会小很多）

  constructor(private readonly opts: CompressedUploaderOptions = {}) {}

  async upload(file: File, options: UploadOptions = {}): Promise<UploadedImage> {
    if (file.size > this.maxSize) {
      throw new Error(
        `图片 ${file.name} 过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请先离线压缩`,
      );
    }
    if (file.type === 'image/svg+xml') {
      // SVG 不压缩，直接走 Mock 路径
      const { MockImageUploader } = await import('./mock');
      return new MockImageUploader().upload(file, options);
    }
    if (!this.accepts.includes(file.type)) {
      throw new Error(`不支持的图片类型：${file.type}`);
    }

    const maxWidth = this.opts.maxWidth ?? 1600;
    const quality = this.opts.quality ?? 0.82;
    const mimeType = this.opts.mimeType ?? 'image/webp';
    const warnAfter = this.opts.warnAfterBytes ?? 250 * 1024;

    const compressed = await compressImage(file, { maxWidth, quality, mimeType });

    if (compressed.size > warnAfter) {
      console.warn(
        `[CompressedImageUploader] ${file.name} 压缩后仍 ${(compressed.size / 1024).toFixed(0)}KB，建议改用 RemoteUrlImageUploader`,
      );
    }

    return {
      url: compressed.dataUrl,
      width: compressed.width,
      height: compressed.height,
      size: compressed.size,
      mime: mimeType,
      filename: replaceExt(file.name, mimeType),
    };
  }

  async uploadMany(files: File[], options?: UploadOptions): Promise<UploadedImage[]> {
    return Promise.all(files.map((f) => this.upload(f, options)));
  }
}

/* ============================================================
 * 3. helpers
 * ============================================================ */

async function compressImage(
  file: File,
  opts: { maxWidth: number; quality: number; mimeType: string },
): Promise<{ dataUrl: string; size: number; width: number; height: number }> {
  const img = await loadImage(URL.createObjectURL(file));
  let { width, height } = img;
  if (width > opts.maxWidth) {
    height = Math.round((height * opts.maxWidth) / width);
    width = opts.maxWidth;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context 不可用');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(opts.mimeType, opts.quality);
  URL.revokeObjectURL(img.src);
  // base64 dataURL 的"大小"近似 = (dataUrl.length - prefix) * 3/4
  const prefix = `data:${opts.mimeType};base64,`;
  const size = Math.round(((dataUrl.length - prefix.length) * 3) / 4);
  return { dataUrl, size, width, height };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`图片加载失败：${e}`));
    img.src = src;
  });
}

function replaceExt(filename: string, mimeType: string): string {
  const dot = filename.lastIndexOf('.');
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'bin';
  return `${base}.${ext}`;
}

/* ============================================================
 * 4. 智能选择：默认上传器策略
 * ============================================================ */

export type ImageUploaderStrategy = 'auto' | 'compressed' | 'remote' | 'mock';

/**
 * 根据文件大小返回推荐策略。
 * - < 300KB：压缩版（base64 跟着 localStorage 走）
 * - 300KB ~ 1MB：压缩版 + 警告
 * - > 1MB：建议远程 URL
 */
export function recommendStrategy(file: File): ImageUploaderStrategy {
  if (file.size < 300 * 1024) return 'compressed';
  if (file.size < 1024 * 1024) return 'compressed';
  return 'remote';
}
