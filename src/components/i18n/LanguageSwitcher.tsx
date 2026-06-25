/**
 * LanguageSwitcher —— 简短的"中 / EN"切换器
 */
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LOCALES: Array<{ value: Locale; label: string; short: string }> = [
  { value: 'zh-CN', label: '简体中文', short: '中' },
  { value: 'en-US', label: 'English', short: 'EN' },
];

export function LanguageSwitcher({ className }: { className?: string }): React.ReactElement {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-0.5',
        className,
      )}
    >
      <Globe className="ml-1 h-3 w-3 text-fg-muted" />
      {LOCALES.map((l) => (
        <button
          key={l.value}
          onClick={() => setLocale(l.value)}
          title={l.label}
          className={cn(
            'rounded px-2 py-1 text-xs transition-colors',
            locale === l.value
              ? 'bg-primary text-primary-fg'
              : 'text-fg-muted hover:text-fg',
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}