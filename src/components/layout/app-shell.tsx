/**
 * AppShell —— 全站布局壳：Header + 面包屑 + 主内容区
 */
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Breadcrumb } from './Breadcrumb';
import { ScrollToTop } from './ScrollToTop';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { SHOW_POWERED_BY, MASTER_URL } from '@/lib/build-config';
import { useSiteConfig } from '@/lib/site-config';

export interface AppShellProps {
  /** 自定义类名（作用于主内容容器） */
  className?: string;
}

export function AppShell({ className }: AppShellProps): React.ReactElement {
  const { t } = useI18n();
  const { config } = useSiteConfig();
  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <ScrollToTop />
      <Header />
      <div className="border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <Breadcrumb />
        </div>
      </div>
      <main className={cn('flex-1', className)}>
        <Outlet />
      </main>
      <footer className="border-t border-border bg-bg-elevated py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-fg-muted">
          © {new Date().getFullYear()} {config.name}
          {SHOW_POWERED_BY && (
            <>
              {' · '}
              <a
                href={MASTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                由 blog-system 管理
              </a>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}