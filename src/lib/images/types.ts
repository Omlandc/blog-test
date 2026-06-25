/**
 * 图片上传模块类型
 * 抽象 ImageUploader 接口，可注入 Mock / HTTP / OSS / S3 / COS 等实现
 */
import type { UploadedImage, UploadOptions } from '../types';

export interface ImageUploader {
  /** 上传单个文件 */
  upload(file: File, options?: UploadOptions): Promise<UploadedImage>;
  /** 批量上传 */
  uploadMany(files: File[], options?: UploadOptions): Promise<UploadedImage[]>;
  /** 是否支持指定类型 */
  accepts?: string[];
  /** 默认最大尺寸（字节） */
  maxSize?: number;
}

export interface ImageUploaderContextValue {
  uploader: ImageUploader;
  upload: (file: File, options?: UploadOptions) => Promise<UploadedImage>;
  uploadMany: (files: File[], options?: UploadOptions) => Promise<UploadedImage[]>;
  /** 最近一次上传是否成功 */
  uploading: boolean;
  error: Error | null;
}

export interface ImageUploaderProviderProps {
  uploader?: ImageUploader;
  children: React.ReactNode;
}

export type { UploadedImage, UploadOptions };