/**
 * LoginPage —— 必须可工作的登录页
 */
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { IS_PUBLIC_ONLY } from '@/lib/build-config';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';
import { useAuth, listMockAccounts } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

export default function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = listMockAccounts();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ username, password });
      toast.success(`欢迎回来，${user.name}`);
      // 跳转到来源页或首页
      const target = from === '/login' ? '/' : from;
      navigate(user.permissions.includes('admin:access') && from === '/login' ? '/admin' : target, {
        replace: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败';
      setError(msg);
      toast.danger('登录失败', { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  function fillAccount(u: string, p: string): void {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg-subtle p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-soft-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-fg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>登录</CardTitle>
                <CardDescription>使用账号登录以继续</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="请输入密码"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-muted hover:text-fg"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {error ? (
                <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <div className="rounded-md border border-border bg-bg-subtle p-3">
                <div className="mb-2 flex items-center gap-1 text-xs font-medium text-fg-muted">
                  <Sparkles className="h-3 w-3" /> 演示账号
                </div>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() =>
                        fillAccount(
                          acc.username,
                          acc.username === 'admin' ? 'admin123' : 'user123',
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-xs transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="font-mono">{acc.username}</span>
                      <span className="text-fg-muted">({acc.role})</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? '登录中…' : '登录'}
              </Button>
              <p className="text-center text-xs text-fg-muted">
                还没有账号？{' '}
                <Link to="/" className="text-primary hover:underline">
                  返回首页
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}