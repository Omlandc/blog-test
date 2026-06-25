/**
 * 管理后台 /admin/settings
 *
 * 主题管理 + 演示账号切换
 */
import { useState } from 'react';
import { Check, User, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/lib/theme';
import { listMockAccountsWithCredentials, type MockAccount } from '@/lib/auth/mock';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage(): React.ReactElement {
  const { theme, setTheme, themes, resolvedTheme } = useTheme();
  const { login, user } = useAuth();
  const [accounts] = useState<MockAccount[]>(listMockAccountsWithCredentials());
  const [switching, setSwitching] = useState<string | null>(null);

  const switchAccount = async (acc: MockAccount): Promise<void> => {
    setSwitching(acc.username);
    try {
      await login({ username: acc.username, password: acc.password });
      toast.show('已切换账号', {
        description: `现在以 ${acc.name}（${acc.role}）的身份操作`,
      });
    } catch (e) {
      toast.show('切换失败', {
        description: e instanceof Error ? e.message : '未知错误',
        variant: 'danger',
      });
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-fg">系统设置</h1>
        <p className="text-sm text-fg-muted">主题外观与演示账号管理</p>
      </div>

      <Tabs defaultValue="themes">
        <TabsList>
          <TabsTrigger value="themes">
            <Palette className="mr-1 h-3.5 w-3.5" /> 主题
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <User className="mr-1 h-3.5 w-3.5" /> 演示账号
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>主题外观</CardTitle>
              <CardDescription>
                当前主题：<span className="font-medium text-fg">{resolvedTheme}</span>
                。点击下方色卡即可实时切换。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {themes.map((t, idx) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setTheme(t.id);
                      toast.show('主题已切换', { description: t.name });
                    }}
                    className={cn(
                      'group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all',
                      theme === t.id
                        ? 'border-primary shadow-lg'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div
                      className="mb-3 flex h-20 overflow-hidden rounded-md"
                      style={{
                        background: `linear-gradient(135deg, ${t.preview.primary} 0%, ${t.preview.accent} 100%)`,
                      }}
                    >
                      <div
                        className="flex-1"
                        style={{ background: t.preview.bg }}
                      />
                      <div
                        className="flex-1"
                        style={{ background: t.preview.bg, opacity: 0.85 }}
                      />
                      <div
                        className="flex-1"
                        style={{ background: t.preview.fg }}
                      />
                      <div
                        className="flex-1"
                        style={{ background: t.preview.fg, opacity: 0.5 }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-fg">{t.name}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">
                          {t.description}
                        </p>
                      </div>
                      {theme === t.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>演示账号</CardTitle>
              <CardDescription>
                点击账号卡片快速切换登录身份。用于演示不同角色的权限差异。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.map((acc, idx) => {
                const isCurrent = user?.id === acc.id;
                return (
                  <motion.div
                    key={acc.username}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      'flex items-center gap-4 rounded-lg border p-4',
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="h-12 w-12 rounded-full bg-bg-elevated"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-fg">{acc.name}</p>
                        <Badge
                          variant={acc.role === 'admin' ? 'default' : 'secondary'}
                        >
                          {acc.role}
                        </Badge>
                        {isCurrent && <Badge variant="outline">当前</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {acc.username} · {acc.permissions.length} 个权限
                      </p>
                      <p className="mt-1 text-xs text-fg-muted">
                        {acc.role === 'admin'
                          ? '可访问所有功能，包括管理后台、用户管理、主题设置。'
                          : '仅可读和创建草稿，访问 /admin 会被拒绝。'}
                      </p>
                    </div>
                    <Button
                      variant={isCurrent ? 'outline' : 'default'}
                      size="sm"
                      disabled={isCurrent || switching === acc.username}
                      onClick={() => void switchAccount(acc)}
                    >
                      {isCurrent
                        ? '当前账号'
                        : switching === acc.username
                          ? '切换中...'
                          : '切换到此账号'}
                    </Button>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
