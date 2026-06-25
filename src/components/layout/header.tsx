/**
 * App 全局 Header：Logo + 导航 + 主题切换 + 用户菜单/登录按钮
 *
 * 移动端：Logo + 搜索 + 汉堡按钮（点开 Drawer 显示全部菜单）
 * 桌面端：Logo + 横向导航 + 搜索 + 语言 + 主题 + 用户菜单
 */
import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
  BookOpen,
  FolderTree,
  Search,
  Menu,
  X,
  ExternalLink,
  Compass,
  Sparkles,
  Palette,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { useSiteConfig } from '@/lib/site-config';
import { useI18n } from '@/lib/i18n';
import { IS_PUBLIC_ONLY, SHOW_POWERED_BY, MASTER_URL } from '@/lib/build-config';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', labelKey: 'common.home', end: true, icon: BookOpen },
  { to: '/articles', labelKey: 'common.articles', icon: BookOpen },
  { to: '/topics', labelKey: 'common.topics', icon: FolderTree },
  { to: '/resources', labelKey: 'common.resources', icon: Compass },
  { to: '/explore', labelKey: 'common.explore', icon: Sparkles },
];

export function Header(): React.ReactElement {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { config, mode, getTopNavTools } = useSiteConfig();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const tools = getTopNavTools();

  const go = (path: string): void => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b border-border bg-bg-elevated/80 backdrop-blur',
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-fg">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
                {config.logoMark ? (
                  <span className="text-lg">{config.logoMark}</span>
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
              </div>
              <span className="font-semibold">{config.name}</span>
            </Link>
            {/* 桌面端横向导航 */}
            <nav className="hidden gap-1 sm:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-bg-subtle text-fg'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                    )
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              {tools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target={tool.target ?? '_self'}
                  rel={tool.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
                >
                  <span aria-hidden>{tool.icon}</span>
                  {tool.name}
                  {tool.badge && (
                    <span className="ml-0.5 rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">
                      {tool.badge}
                    </span>
                  )}
                </a>
              ))}
              {mode === 'embedded' && hasPermission('admin:access') && !IS_PUBLIC_ONLY && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-bg-subtle text-fg'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                    )
                  }
                >
                  后台
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/search')}
              aria-label="搜索"
              title="搜索"
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ThemeSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-fg-muted">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!IS_PUBLIC_ONLY && (
                  <>
                  <DropdownMenuItem onSelect={() => navigate('/admin')}>
                    <ShieldCheck className="h-4 w-4" /> 管理后台
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/admin/sites')}>
                    <Layers className="h-4 w-4" /> 多站点管理
                  </DropdownMenuItem>
                  {hasPermission('series:manage') && (
                    <DropdownMenuItem onSelect={() => navigate('/admin/series')}>
                      <FolderTree className="h-4 w-4" /> 主题簇管理
                    </DropdownMenuItem>
                  )}
                  {hasPermission('site:configure') && (
                    <DropdownMenuItem onSelect={() => navigate('/admin/content-themes')}>
                      <Palette className="h-4 w-4" /> 内容主题
                    </DropdownMenuItem>
                  )}
                  {hasPermission('subscribers:manage') && (
                    <DropdownMenuItem onSelect={() => navigate('/admin/subscribers')}>
                      <UserIcon className="h-4 w-4" /> 订阅者
                    </DropdownMenuItem>
                  )}
                  {hasPermission('analytics:view') && (
                    <DropdownMenuItem onSelect={() => navigate('/admin/analytics')}>
                      <BookOpen className="h-4 w-4" /> 流量分析
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate('/admin/settings')}>
                    <Settings className="h-4 w-4" /> 设置
                  </DropdownMenuItem>
                  </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut className="h-4 w-4" /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !IS_PUBLIC_ONLY ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                className="hidden gap-2 sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                {t('nav.login')}
              </Button>
            ) : null}
            {/* 移动端汉堡按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="菜单"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* 移动端菜单 Drawer */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          className="inset-y-0 left-0 right-auto w-[85vw] max-w-sm translate-x-0 translate-y-0 rounded-none p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">菜单</DialogTitle>
          <MobileMenu
            pathname={location.pathname}
            tools={tools.map((t) => ({ id: t.id, name: t.name, icon: t.icon, url: t.url, target: t.target ?? '_self', badge: t.badge }))}
            isAdmin={mode === 'embedded' && hasPermission('admin:access')}
            user={user ? { name: user.name, email: user.email, avatar: user.avatar } : null}
            onClose={() => setMenuOpen(false)}
            onNavigate={go}
            onLogout={async () => {
              await logout();
              setMenuOpen(false);
              navigate('/');
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileMenu({
  pathname,
  tools,
  isAdmin,
  user,
  onClose,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  tools: Array<{ id: string; name: string; icon: string; url: string; target: string; badge?: string }>;
  isAdmin: boolean;
  user: { name: string; email: string; avatar: string } | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>;
}): React.ReactElement {
  const { t } = useI18n();
  const { config } = useSiteConfig();
  return (
    <div className="flex h-full flex-col bg-bg">
      {/* 顶栏 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 text-fg"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-fg">
            <span className="text-lg">{config.logoMark ?? '✍'}</span>
          </div>
          <span className="font-semibold">{config.name}</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="关闭"
          className="h-9 w-9"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 用户区 */}
      {user ? (
        <div className="flex items-center gap-3 border-b border-border bg-bg-subtle px-4 py-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{user.name}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
          </div>
        </div>
      ) : !IS_PUBLIC_ONLY ? (
        <div className="border-b border-border bg-bg-subtle px-4 py-3">
          <Button
            className="w-full"
            onClick={() => onNavigate('/login')}
          >
            <LogIn className="h-4 w-4" /> {t('nav.login')}
          </Button>
        </div>
      ) : null}

      {/* 主导航 */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 text-xs font-medium uppercase text-fg-subtle">导航</p>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                onClick={() => onNavigate(item.to)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-fg'
                    : 'text-fg hover:bg-bg-subtle',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t(item.labelKey)}</span>
                {active && <span className="text-xs">●</span>}
              </button>
            );
          })}
        </div>

        {tools.length > 0 && (
          <>
            <p className="mt-6 px-3 pb-2 text-xs font-medium uppercase text-fg-subtle">
              配套工具
            </p>
            <div className="space-y-1">
              {tools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target={tool.target}
                  rel={tool.target === '_blank' ? 'noopener noreferrer' : undefined}
                  onClick={onClose}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-bg-subtle"
                >
                  <span className="text-base" aria-hidden>
                    {tool.icon}
                  </span>
                  <span className="flex-1">{tool.name}</span>
                  {tool.badge && (
                    <span className="rounded bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                      {tool.badge}
                    </span>
                  )}
                  {tool.target === '_blank' && (
                    <ExternalLink className="h-3 w-3 text-fg-muted" />
                  )}
                </a>
              ))}
            </div>
          </>
        )}

        {isAdmin && !IS_PUBLIC_ONLY && (
          <>
            <p className="mt-6 px-3 pb-2 text-xs font-medium uppercase text-fg-subtle">
              后台
            </p>
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('/admin')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary text-primary-fg'
                    : 'text-fg hover:bg-bg-subtle',
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="flex-1">管理后台</span>
              </button>
              <button
                onClick={() => onNavigate('/admin/articles')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-bg-subtle"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1">文章管理</span>
              </button>
              <button
                onClick={() => onNavigate('/admin/site-config')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-bg-subtle"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="flex-1">站点配置</span>
              </button>
              <button
                onClick={() => onNavigate('/admin/resources')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-bg-subtle"
              >
                <Compass className="h-4 w-4 shrink-0" />
                <span className="flex-1">资源导航</span>
              </button>
            </div>
          </>
        )}
      </nav>

      {/* 底部 */}
      <div className="border-t border-border p-4">
        <div className="mb-3 sm:hidden">
          <LanguageSwitcher className="w-full" />
        </div>
        {user && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" /> 退出登录
          </Button>
        )}
        <p className="mt-3 text-center text-xs text-fg-subtle">
          © {new Date().getFullYear()} {config.name}
        </p>
      </div>
    </div>
  );
}
