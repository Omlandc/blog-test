/**
 * ImageUploaderProvider —— 把 ImageUploader 注入到 React 树中
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  ImageUploader,
  ImageUploaderContextValue,
  ImageUploaderProviderProps,
} from './types';
import type { UploadedImage, UploadOptions } from '../types';
import { MockImageUploader } from './mock';

const ImageUploaderContext = createContext<ImageUploaderContextValue | null>(null);

export function ImageUploaderProvider({
  uploader,
  children,
}: ImageUploaderProviderProps): React.ReactElement {
  const instance = useMemo<ImageUploader>(
    () => uploader ?? new MockImageUploader(),
    [uploader],
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File, options?: UploadOptions): Promise<UploadedImage> => {
      setUploading(true);
      setError(null);
      try {
        return await instance.upload(file, options);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setUploading(false);
      }
    },
    [instance],
  );

  const uploadMany = useCallback(
    async (files: File[], options?: UploadOptions): Promise<UploadedImage[]> => {
      setUploading(true);
      setError(null);
      try {
        return await instance.uploadMany(files, options);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setUploading(false);
      }
    },
    [instance],
  );

  const value = useMemo<ImageUploaderContextValue>(
    () => ({
      uploader: instance,
      upload,
      uploadMany,
      uploading,
      error,
    }),
    [instance, upload, uploadMany, uploading, error],
  );

  return (
    <ImageUploaderContext.Provider value={value}>
      {children}
    </ImageUploaderContext.Provider>
  );
}

export function useImageUploader(): ImageUploaderContextValue {
  const ctx = useContext(ImageUploaderContext);
  if (!ctx) {
    throw new Error('useImageUploader must be used within <ImageUploaderProvider>');
  }
  return ctx;
}