/**
 * ToolRedirect —— 通用工具路由
 *
 * 根据 url 从 SiteConfig.tools 中找到对应入口：
 * - 内部路径（以 / 开头）：用 React Router 导航
 * - 外部 URL：直接 window.location 跳转
 * - #placeholder：占位 iframe（用于尚未开发完成的工具）
 */
import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSiteConfig } from '@/lib/site-config';
import { Construction } from 'lucide-react';

export function ToolRedirect(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { tools, getTopNavTools, getHomeTools } = useSiteConfig();

  const all = [...getTopNavTools(), ...getHomeTools()];
  const tool = all.find((t) => t.id === id || t.url === `/tools/${id}`);

  useEffect(() => {
    if (!tool) return;
    if (tool.url.startsWith('http://') || tool.url.startsWith('https://')) {
      window.location.href = tool.url;
    } else if (tool.url !== location.pathname) {
      navigate(tool.url, { replace: true });
    }
  }, [tool, navigate, location.pathname]);

  if (!tool) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-fg">工具未找到</h1>
        <p className="mt-2 text-fg-muted">id = {id}</p>
      </div>
    );
  }

  // 占位 iframe 渲染
  if (tool.url.startsWith('#')) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-lg border-2 border-dashed border-border bg-bg-elevated p-12 text-center">
          <Construction className="mx-auto h-12 w-12 text-fg-muted" />
          <h1 className="mt-4 text-2xl font-bold text-fg">
            {tool.icon} {tool.name}
          </h1>
          {tool.description && (
            <p className="mt-2 text-fg-muted">{tool.description}</p>
          )}
          <p className="mt-6 text-xs text-fg-subtle">
            工具占位中 —— 在后台 /admin/site-config 中编辑 url 即可挂入真实功能。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-fg-muted">正在跳转到 {tool.name}…</p>
    </div>
  );
}