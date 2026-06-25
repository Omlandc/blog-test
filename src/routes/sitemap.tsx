/**
 * /sitemap.xml —— 站点地图
 *
 * 由客户端动态生成，包含所有文章 + Pillar 页 + Cluster 页。
 * 借鉴细分内容站 SEO 方法论，确保搜索引擎能完整抓取。
 */
import { useEffect, useState } from 'react';
import { getArticleStorage } from '@/lib/storage';
import { getSeriesStore } from '@/lib/series';
import { listExplorables } from '@/lib/explorables';
import { generateSitemap } from '@/lib/seo';
import { useSiteConfig } from '@/lib/site-config';

export default function SitemapRoute(): null {
  const { config } = useSiteConfig();
  const [xml, setXml] = useState<string>('');

  useEffect(() => {
    const baseUrl = config.customDomain || window.location.origin;
    void Promise.all([
      getArticleStorage().getAll(),
      Promise.resolve(getSeriesStore().getAll()),
      Promise.resolve(listExplorables()),
    ]).then(([articles, series, explorables]) => {
      const paths: Array<{
        loc: string;
        lastmod?: string;
        priority?: number;
        changefreq?: string;
      }> = [
        { loc: '/', changefreq: 'daily', priority: 1.0 },
        { loc: '/articles', changefreq: 'daily', priority: 0.9 },
        { loc: '/topics', changefreq: 'weekly', priority: 0.9 },
        // 资源导航总入口 + 7 个分类页（SEO 增益）
        { loc: '/resources', changefreq: 'weekly', priority: 0.9 },
        { loc: '/resources/design', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/dev', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/writing', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/marketing', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/analytics', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/productivity', changefreq: 'weekly', priority: 0.7 },
        { loc: '/resources/other', changefreq: 'weekly', priority: 0.5 },
      ];

      // Pillar 优先
      series
        .filter((s) => s.isPillar)
        .forEach((s) => {
          paths.push({
            loc: `/topics/${s.slug}`,
            lastmod: s.updatedAt,
            changefreq: 'weekly',
            priority: 0.9,
          });
        });
      series
        .filter((s) => !s.isPillar && s.parentId)
        .forEach((s) => {
          paths.push({
            loc: `/topics/${s.slug}`,
            lastmod: s.updatedAt,
            changefreq: 'weekly',
            priority: 0.7,
          });
        });

      // 文章
      articles
        .filter((a) => a.status === 'published')
        .forEach((a) => {
          paths.push({
            loc: `/article/${a.slug}`,
            lastmod: a.updatedAt,
            changefreq: 'monthly',
            priority: a.seo?.sitemapPriority ?? 0.6,
          });
        });

      // 交互式专栏
      paths.push({ loc: '/explore', changefreq: 'weekly', priority: 0.8 });
      explorables.forEach((e) => {
        paths.push({
          loc: `/explore/${e.slug}`,
          lastmod: e.updatedAt,
          changefreq: 'monthly',
          priority: 0.7,
        });
      });

      const generated = generateSitemap(baseUrl, paths);
      setXml(generated);
      // 替换 document 内容
      document.open();
      document.write(generated);
      document.close();
    });
  }, [config]);

  // 组件实际不会渲染（直接重写 document），但 React 要求返回元素
  return null;
}