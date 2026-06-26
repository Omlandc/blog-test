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
  // admin_token 验证状态：
  //   null = 未验证（默认 public 模式）
  //   true = 验证通过（嵌入 admin 模式，可写文章）
  //   false = token 无效或过期（忽略，进入 public 模式）
  const [adminVerified, setAdminVerified] = useState<boolean | null>(null);
  // 默认使用压缩版上传器：canvas 压缩 + webp，自动控制体积
  // GitHub Pages 部署推荐使用 URL 上传器（见 ImageUploadButton 的模式切换）
  const uploader = new CompressedImageUploader({
    maxWidth: 1600,
    quality: 0.82,
    mimeType: 'image/webp',
  });

  useEffect(() => {
    (async () => {
      // 检查 URL ?admin_token=xxx（主仓 dispatcher 生成）
      const params = new URLSearchParams(window.location.search);
      const token = params.get('admin_token');
      if (token) {
        try {
          const { verifyAdminToken } = await import('@/lib/sites-console');
          const valid = await verifyAdminToken(token);
          if (valid) {
            setAdminVerified(true);
            // 清除 URL 参数（防泄露） + 在 localStorage 记一个会话标记
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
            window.localStorage.setItem('blog-system:admin-session', '1');
            // 预写一个 mock admin user 到 mock auth localStorage
            // （RequireAuth / AdminGuard 会读这个 user）
            const mockUser = {
              id: 'u_admin',
              username: 'admin',
              name: '超级管理员',
              avatar: '',
              role: 'admin',
              email: 'admin@example.com',
              bio: '',
              permissions: [
                'article:read',
                'article:create',
                'article:edit',
                'article:delete',
                'article:publish',
                'admin:access',
                'theme:manage',
                'user:manage',
              ],
            };
            window.localStorage.setItem(
              'blog-system:auth:current',
              JSON.stringify({ user: mockUser, loggedInAt: new Date().toISOString() }),
            );
          } else {
            setAdminVerified(false);
          }
        } catch {
          setAdminVerified(false);
        }
      } else {
        // 沿用上次会话标记（页面刷新后不需重 token）
        const persisted = window.localStorage.getItem('blog-system:admin-session');
        setAdminVerified(persisted === '1');
      }

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
        initialMode={
          // 优先级：admin_token 验证通过 > 静态包存在 = static 模式
          // admin_token 验证通过后即使有静态包也走 embedded，才能写文章
          adminVerified ? 'embedded' : bundle ? 'static' : 'embedded'
        }
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
