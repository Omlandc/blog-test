/**
 * App —— 根组件
 *
 * 启动流程：
 * 1) 尝试加载 /data/articles.json（静态包），失败则忽略
 * 2) 用静态包内容覆盖 SiteConfigProvider 的初始值
 * 3) 根据 SiteConfig.mode 决定是否显示后台
 */
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { ImageUploaderProvider, CompressedImageUploader } from '@/lib/images';
import { SiteConfigProvider, DEFAULT_TOOLS } from '@/lib/site-config';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRouter } from '@/routes';
import { loadStaticBundle } from '@/lib/storage/static-bundle';
import type { SiteConfig, ToolEntry } from '@/lib/types';

interface BundleData {
  config: SiteConfig;
  tools: ToolEntry[];
}

export default function App(): React.ReactElement {
  const [bundle, setBundle] = useState<BundleData | null>(null);
  const [ready, setReady] = useState(false);
  // 默认使用压缩版上传器：canvas 压缩 + webp，自动控制体积
  // GitHub Pages 部署推荐使用 URL 上传器（见 ImageUploadButton 的模式切换）
  const uploader = new CompressedImageUploader({
    maxWidth: 1600,
    quality: 0.82,
    mimeType: 'image/webp',
  });

  useEffect(() => {
    (async () => {
      const b = await loadStaticBundle();
      if (b) {
        setBundle({ config: b.siteConfig, tools: b.tools });
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    // 极简启动屏，避免 hydrate 闪烁
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        加载中…
      </div>
    );
  }

  return (
    <I18nProvider>
      <SiteConfigProvider
        initialConfig={bundle?.config}
        initialTools={bundle?.tools ?? DEFAULT_TOOLS}
        // 修复：static bundle 存在时自动设为 static 模式
        // 不然 /admin 路由在 static 部署里还能访问（虽然没有真后端，但 mock auth 能登入）
        initialMode={bundle ? 'static' : 'embedded'}
      >
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <ImageUploaderProvider uploader={uploader}>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
              <Toaster />
            </ImageUploaderProvider>
          </AuthProvider>
        </ThemeProvider>
      </SiteConfigProvider>
    </I18nProvider>
  );
}
