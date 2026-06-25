/**
 * 通用状态页：Forbidden（403）/ NotFound（404）/ Loading
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, FileQuestion, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export function ForbiddenPage(): React.ReactElement {
  const { user } = useAuth();
  return (
    <StatusShell
      icon={<ShieldAlert className="h-12 w-12" />}
      code="403"
      title="无权访问"
      description={
        user
          ? `当前账号（${user.name} · ${user.role}）没有访问该页面的权限。`
          : '请先登录后再访问。'
      }
      actionLabel={user ? '返回首页' : '去登录'}
      actionTo={user ? '/' : '/login'}
    />
  );
}

export function NotFoundPage(): React.ReactElement {
  return (
    <StatusShell
      icon={<FileQuestion className="h-12 w-12" />}
      code="404"
      title="页面不存在"
      description="你访问的页面已被移除、重命名或暂时不可用。"
      actionLabel="返回首页"
      actionTo="/"
    />
  );
}

export function LoadingPage({ message = '加载中…' }: { message?: string }): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-2 text-fg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function StatusShell({
  icon,
  code,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle text-fg-muted">
          {icon}
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-fg-subtle">
          {code}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-fg">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-fg-muted">{description}</p>
        <div className="mt-6">
          <Button asChild>
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}