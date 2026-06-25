/**
 * 图床设置面板 —— WeMD 风格的「图床设置」入口
 *
 * 4 种策略 + 自定义 HTTP 配置
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Settings, Link2, FileImage, Server, FlaskConical } from 'lucide-react';
import {
  useImageHostingConfig,
  describeStrategy,
  type ImageStrategy,
  type ImageHostingConfig,
} from '@/lib/images/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const STRATEGY_OPTIONS: { value: ImageStrategy; icon: React.ReactNode }[] = [
  { value: 'remote-url', icon: <Link2 className="h-4 w-4" /> },
  { value: 'compressed', icon: <FileImage className="h-4 w-4" /> },
  { value: 'custom-http', icon: <Server className="h-4 w-4" /> },
  { value: 'mock', icon: <FlaskConical className="h-4 w-4" /> },
];

export function ImageHostingSettings({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}): React.ReactElement {
  const { config, update, reset } = useImageHostingConfig();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleSave = (): void => {
    onOpenChange(false);
    toast.success('图床设置已保存', { description: `当前策略：${describeStrategy(config.strategy).name}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
        <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <DialogTitle>图床设置</DialogTitle>
            <DialogDescription>配置图片上传策略，影响编辑器「插入图片」行为</DialogDescription>
          </div>
        </div>

        {/* 策略选择 */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-fg">上传策略</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {STRATEGY_OPTIONS.map(({ value, icon }) => {
              const info = describeStrategy(value);
              const isActive = config.strategy === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ strategy: value })}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-all',
                    isActive
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-md',
                        isActive ? 'bg-primary text-primary-fg' : 'bg-bg-elevated text-fg-muted',
                      )}
                    >
                      {icon}
                    </span>
                    <span className="text-sm font-medium text-fg">{info.name}</span>
                    {isActive && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="mb-1 text-xs text-fg-muted">{info.desc}</p>
                  <p className="text-[11px] text-fg-subtle">
                    <span className="text-success">+ {info.pros}</span>
                  </p>
                  <p className="text-[11px] text-fg-subtle">
                    <span className="text-warning">− {info.cons}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 策略相关配置 */}
        <AnimatePresence mode="wait">
          {config.strategy === 'custom-http' && (
            <motion.div
              key="custom-http"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 space-y-3 rounded-lg border border-border bg-bg-elevated/30 p-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">Endpoint URL *</label>
                <Input
                  value={config.customHttpEndpoint ?? ''}
                  onChange={(e) => update({ customHttpEndpoint: e.target.value })}
                  placeholder="https://api.your-cdn.com/upload"
                />
                <p className="mt-1 text-[11px] text-fg-subtle">
                  POST 接收 multipart/form-data，body 字段名 file
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">额外 Headers（JSON）</label>
                <Input
                  value={config.customHttpHeaders ?? ''}
                  onChange={(e) => update({ customHttpHeaders: e.target.value })}
                  placeholder='{"Authorization": "Bearer xxx"}'
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">响应 URL 字段</label>
                <Input
                  value={config.customHttpResponseField ?? ''}
                  onChange={(e) => update({ customHttpResponseField: e.target.value })}
                  placeholder="url"
                />
                <p className="mt-1 text-[11px] text-fg-subtle">
                  响应 JSON 中图片 URL 的字段名（默认 url）
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">CDN 基础域名</label>
                <Input
                  value={config.cdnBase ?? ''}
                  onChange={(e) => update({ cdnBase: e.target.value })}
                  placeholder="https://cdn.your-domain.com"
                />
                <p className="mt-1 text-[11px] text-fg-subtle">
                  若响应返回相对路径，自动拼接此域名
                </p>
              </div>
            </motion.div>
          )}

          {config.strategy === 'compressed' && (
            <motion.div
              key="compressed"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-4 space-y-3 rounded-lg border border-border bg-bg-elevated/30 p-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">最大宽度（像素）</label>
                <Input
                  type="number"
                  value={config.maxWidth ?? 1600}
                  onChange={(e) => update({ maxWidth: parseInt(e.target.value) || 1600 })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">质量（0-1）</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1"
                  value={config.quality ?? 0.82}
                  onChange={(e) => update({ quality: parseFloat(e.target.value) || 0.82 })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-fg-muted">输出格式</label>
                <Input
                  value={config.mimeType ?? 'image/webp'}
                  onChange={(e) => update({ mimeType: e.target.value })}
                  placeholder="image/webp"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 高级 */}
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="mb-3 text-xs text-fg-muted hover:text-fg"
        >
          {advancedOpen ? '▼' : '▶'} 高级选项
        </button>
        {advancedOpen && (
          <div className="mb-4 space-y-3 rounded-lg border border-border bg-bg-elevated/30 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg-muted">CDN 基础域名</label>
              <Input
                value={config.cdnBase ?? ''}
                onChange={(e) => update({ cdnBase: e.target.value })}
                placeholder="https://cdn.example.com"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={reset}>
            重置默认
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-3 w-3" /> 保存
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImageHostingSettingsButton({
  className,
}: {
  className?: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { config } = useImageHostingConfig();
  const info = describeStrategy(config.strategy);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`图床设置 · 当前：${info.name}`}
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 text-xs text-fg-muted hover:bg-bg-subtle hover:text-fg',
          className,
        )}
      >
        <Settings className="h-3 w-3" />
        图床
      </button>
      <ImageHostingSettings open={open} onOpenChange={setOpen} />
    </>
  );
}
