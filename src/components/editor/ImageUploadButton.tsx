/**
 * ImageUploadButton —— 图片上传按钮 + Dialog
 *
 * 行为：
 *  - 拖拽 / 点击选择 → 调用 useImageUploader()
 *  - 直接粘贴图片 URL → RemoteUrlImageUploader
 *  - 文件 > 1MB 自动建议外链 URL
 *  - 文件 > 5MB 拒绝本地存储，必须用 URL
 *  - 上传成功回调 onUploaded({ url, alt, filename })
 */
import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ImagePlus,
  Loader2,
  Upload,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useImageUploader, recommendStrategy } from '@/lib/images';
import { cn, formatBytes } from '@/lib/utils';

export interface UploadedImageInfo {
  url: string;
  alt: string;
  filename?: string;
}

export interface ImageUploadButtonProps {
  onUploaded: (info: UploadedImageInfo) => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  label?: string;
}

const LOCAL_HARD_LIMIT = 5 * 1024 * 1024; // 5MB
const LOCAL_SOFT_LIMIT = 1 * 1024 * 1024; // 1MB 以上建议用 URL

export function ImageUploadButton({
  onUploaded,
  triggerRef,
  label = '上传图片',
}: ImageUploadButtonProps): React.ReactElement {
  const { upload, uploading, error } = useImageUploader();
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setAlt('');
    setUrlInput('');
    setDragOver(false);
    setMode('upload');
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > LOCAL_HARD_LIMIT) {
        toast.danger('文件过大', {
          description: `${file.name} (${formatBytes(file.size)}) 超过 5MB 上限。请改用 URL 方式。`,
        });
        setMode('url');
        return;
      }
      if (file.size > LOCAL_SOFT_LIMIT) {
        // 自动切换到 URL 模式并提示
        toast.warning('建议使用 URL', {
          description: `${formatBytes(file.size)} 的图片塞进 localStorage 会很快撑爆。建议先传到图床（imgur / sm.ms / 自有 OSS），粘贴 URL。`,
        });
        setMode('url');
        return;
      }
      try {
        const strategy = recommendStrategy(file);
        const result = await upload(file);
        const finalAlt = alt.trim() || file.name.replace(/\.[^.]+$/, '');
        onUploaded({ url: result.url, alt: finalAlt, filename: result.filename ?? file.name });
        toast.success(
          strategy === 'compressed'
            ? '已压缩并上传'
            : '图片上传成功',
          { description: `${file.name} · ${formatBytes(result.size ?? file.size)}` },
        );
        reset();
        setOpen(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.danger('图片上传失败', { description: msg });
      }
    },
    [upload, alt, onUploaded, reset],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (f) await handleFile(f);
      }
    },
    [handleFile],
  );

  const handleUrlConfirm = useCallback(() => {
    const url = urlInput.trim();
    if (!url) {
      toast.warning('请输入图片 URL');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast.danger('URL 格式不正确', {
        description: '必须以 http:// 或 https:// 开头',
      });
      return;
    }
    onUploaded({ url, alt: alt.trim() || 'image' });
    toast.success('已插入图片', { description: url });
    reset();
    setOpen(false);
  }, [urlInput, alt, onUploaded, reset]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <ImagePlus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>插入图片</DialogTitle>
          <DialogDescription>
            小图可直接上传（自动压缩），大图建议用 URL（避免 localStorage 溢出）。
          </DialogDescription>
        </DialogHeader>

        {/* 模式切换 */}
        <div className="flex gap-1 rounded-md border border-border bg-bg-elevated p-0.5">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors',
              mode === 'upload'
                ? 'bg-primary text-primary-fg'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            <Upload className="h-3 w-3" /> 上传文件
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors',
              mode === 'url'
                ? 'bg-primary text-primary-fg'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            <Link2 className="h-3 w-3" /> 粘贴 URL
          </button>
        </div>

        {mode === 'upload' ? (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-bg-subtle/40 hover:border-primary/40',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: dragOver ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="flex flex-col items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                ) : (
                  <Upload className="h-10 w-10 text-fg-muted" />
                )}
                <p className="text-sm text-fg-muted">
                  {uploading ? '正在压缩并上传…' : '拖拽图片到此处，或'}
                </p>
                {!uploading ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择文件
                  </Button>
                ) : null}
              </motion.div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-fg-muted">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                &lt; 1MB 自动压缩 · 1-5MB 建议改 URL · &gt; 5MB 直接拒绝
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="img-url">图片 URL</Label>
              <Input
                id="img-url"
                placeholder="https://your-image-host/xxx.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlConfirm();
                }}
              />
            </div>
            <p className="text-xs text-fg-muted">
              推荐图床：imgur / sm.ms / Cloudflare R2 / 自有 OSS / 七牛 / 腾讯云 COS
            </p>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="img-alt">图片描述（alt，可选）</Label>
          <Input
            id="img-alt"
            placeholder="例：产品截图"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-xs text-danger">最近一次错误：{error.message}</p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            取消
          </Button>
          {mode === 'url' ? (
            <Button type="button" onClick={handleUrlConfirm}>
              插入
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
