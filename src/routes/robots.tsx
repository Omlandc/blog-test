/**
 * /robots.txt —— 爬虫指令
 *
 * 借鉴细分内容站 SEO 经验：
 * - 默认禁止 AI 爬虫（保护原创）
 * - 通过 SiteConfig.allowAI 可切换为允许（获得 AI 搜索引用）
 */
import { useEffect } from 'react';
import { generateRobotsTxt } from '@/lib/seo';
import { useSiteConfig } from '@/lib/site-config';

export default function RobotsRoute(): null {
  const { config } = useSiteConfig();

  useEffect(() => {
    const baseUrl = config.customDomain || window.location.origin;
    const txt = generateRobotsTxt(baseUrl, {
      allowAI: config.allowAI,
      disallowPaths: ['/admin', '/login'],
    });
    document.open();
    document.write(txt);
    document.close();
  }, [config]);

  return null;
}