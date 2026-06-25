/**
 * Mock 图片上传器 —— 转 base64 dataURL 存 localStorage
 * 限制 < 2MB。仅用于演示与本地开发。
 */
import type { ImageUploader } from './types';
import type { UploadedImage, UploadOptions } from '../types';
import { fileToDataUrl, getImageDimensions } from '../utils';

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_ACCEPTS = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

export class MockImageUploader implements ImageUploader {
  accepts = DEFAULT_ACCEPTS;
  maxSize = DEFAULT_MAX_SIZE;

  async upload(file: File, options: UploadOptions = {}): Promise<UploadedImage> {
    const maxSize = options.maxSize ?? this.maxSize;
    if (file.size > maxSize) {
      throw new Error(
        `图片 ${file.name} 超过限制（${(maxSize / 1024 / 1024).toFixed(1)}MB）`,
      );
    }
    if (options.accept && options.accept.length > 0) {
      if (!options.accept.includes(file.type)) {
        throw new Error(`不支持的图片类型：${file.type}`);
      }
    } else if (!this.accepts.includes(file.type)) {
      throw new Error(`不支持的图片类型：${file.type}`);
    }

    const dataUrl = await fileToDataUrl(file);
    let width: number | undefined;
    let height: number | undefined;
    if (file.type !== 'image/svg+xml') {
      try {
        const dim = await getImageDimensions(dataUrl);
        width = dim.width;
        height = dim.height;
      } catch {
        // 忽略尺寸探测失败
      }
    }

    // 把 dataURL 缓存到 localStorage（按 file.name 去重）
    try {
      const cache = JSON.parse(localStorage.getItem('blog-system:images') ?? '{}');
      cache[file.name] = { url: dataUrl, size: file.size, mime: file.type };
      localStorage.setItem('blog-system:images', JSON.stringify(cache));
    } catch {
      // quota exceeded 等错误忽略；dataURL 本身仍然可用
    }

    return {
      url: dataUrl,
      width,
      height,
      size: file.size,
      mime: file.type,
      filename: file.name,
    };
  }

  async uploadMany(files: File[], options?: UploadOptions): Promise<UploadedImage[]> {
    const results: UploadedImage[] = [];
    for (const file of files) {
      results.push(await this.upload(file, options));
    }
    return results;
  }
}

/**
 * HTTP 图片上传器（stub）
 * 通过 POST multipart/form-data 把图片上传到 endpoint，
 * 服务端返回 { url, width?, height? }。
 *
 * 使用方式：
 *   const uploader = new HttpImageUploader({ endpoint: '/api/upload' });
 *   const { url } = await uploader.upload(file);
 *
 * 当前为占位实现，后续 task 可以补全鉴权、进度、重试等。
 */
export interface HttpImageUploaderOptions {
  endpoint: string;
  /** 额外字段（会随 FormData 一起发送） */
  extraFields?: Record<string, string>;
  /** 自定义 header */
  headers?: Record<string, string>;
  /** 响应解析（默认 { url }） */
  parseResponse?: (resp: unknown) => UploadedImage;
}

export class HttpImageUploader implements ImageUploader {
  accepts = DEFAULT_ACCEPTS;
  maxSize = 10 * 1024 * 1024; // 10MB

  constructor(private readonly opts: HttpImageUploaderOptions) {
    if (!opts.endpoint) throw new Error('HttpImageUploader requires an endpoint');
  }

  async upload(file: File, options: UploadOptions = {}): Promise<UploadedImage> {
    const maxSize = options.maxSize ?? this.maxSize;
    if (file.size > maxSize) {
      throw new Error(`图片超过 ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (this.opts.extraFields) {
      for (const [k, v] of Object.entries(this.opts.extraFields)) {
        fd.append(k, v);
      }
    }
    const resp = await fetch(this.opts.endpoint, {
      method: 'POST',
      body: fd,
      headers: this.opts.headers,
    });
    if (!resp.ok) {
      throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
    }
    const data: unknown = await resp.json();
    const parser = this.opts.parseResponse ?? defaultParse;
    return parser(data);
  }

  async uploadMany(files: File[], options?: UploadOptions): Promise<UploadedImage[]> {
    return Promise.all(files.map((f) => this.upload(f, options)));
  }
}

function defaultParse(resp: unknown): UploadedImage {
  if (typeof resp !== 'object' || resp === null) {
    throw new Error('Invalid upload response');
  }
  const obj = resp as Record<string, unknown>;
  const url = obj['url'];
  if (typeof url !== 'string') throw new Error('Upload response missing url');
  return {
    url,
    width: typeof obj['width'] === 'number' ? (obj['width'] as number) : undefined,
    height: typeof obj['height'] === 'number' ? (obj['height'] as number) : undefined,
    size: typeof obj['size'] === 'number' ? (obj['size'] as number) : undefined,
    mime: typeof obj['mime'] === 'string' ? (obj['mime'] as string) : undefined,
    filename: typeof obj['filename'] === 'string' ? (obj['filename'] as string) : undefined,
  };
}