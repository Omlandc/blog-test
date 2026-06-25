/**
 * NewsletterForm —— 邮件订阅表单
 *
 * 嵌入文章末尾、首页底部、侧边栏等任意位置。
 * 可关联 Lead Magnet（引导磁铁）。
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getSubscriberStore,
  getLeadMagnetStore,
  isValidEmail,
} from '@/lib/newsletter';
import type { LeadMagnet, SubscriberSource } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  /** 来源标识 */
  source: SubscriberSource;
  /** 来源文章 ID */
  articleId?: string;
  /** 关联的 Lead Magnet（可选） */
  leadMagnet?: LeadMagnet;
  /** 标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 紧凑模式（用于侧边栏） */
  compact?: boolean;
  className?: string;
}

export function NewsletterForm({
  source,
  articleId,
  leadMagnet,
  title,
  subtitle,
  compact = false,
  className,
}: Props): React.ReactElement {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError('请输入有效邮箱');
      return;
    }
    setLoading(true);
    try {
      getSubscriberStore().subscribeEmail({
        email,
        name: name || undefined,
        source,
        sourceArticleId: articleId,
        leadMagnetId: leadMagnet?.id,
      });
      setSuccess(true);
      setEmail('');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '订阅失败');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-xl border border-success/40 bg-success/10 p-6 text-center',
          className,
        )}
      >
        <Check className="mx-auto mb-2 h-10 w-10 text-success" />
        <p className="font-semibold text-fg">订阅成功！</p>
        <p className="mt-1 text-sm text-fg-muted">
          {leadMagnet ? `《${leadMagnet.title}》已发送到你的邮箱` : '我们会在每周精选里见到你'}
        </p>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-gradient-to-br from-bg-elevated to-bg p-6',
        compact && 'p-4',
        className,
      )}
    >
      {leadMagnet && (
        <Badge className="mb-3">
          <Sparkles className="mr-1 h-3 w-3" /> 免费下载
        </Badge>
      )}
      <h3
        className={cn(
          'font-semibold text-fg',
          compact ? 'text-base' : 'text-lg',
        )}
      >
        {title || leadMagnet?.title || '订阅每周精选'}
      </h3>
      {(subtitle || leadMagnet?.subtitle) && (
        <p className="mt-1 text-sm text-fg-muted">
          {subtitle || leadMagnet?.subtitle}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        {!compact && (
          <Input
            type="text"
            placeholder="昵称（可选）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          <Mail className="h-4 w-4" />
          {loading ? '订阅中...' : leadMagnet?.cta || '订阅'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-fg-muted">
        免费订阅，可随时退订。我们承诺不发垃圾邮件。
      </p>
    </div>
  );
}

/** 选一个随机启用的 Lead Magnet 用于首页弹窗 */
export function pickRandomLeadMagnet(): LeadMagnet | undefined {
  const enabled = getLeadMagnetStore().getEnabled();
  if (enabled.length === 0) return undefined;
  return enabled[Math.floor(Math.random() * enabled.length)];
}