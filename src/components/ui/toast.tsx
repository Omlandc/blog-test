import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-soft-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-border bg-bg-elevated text-fg',
        success: 'border-success/40 bg-bg-elevated text-fg',
        warning: 'border-warning/40 bg-bg-elevated text-fg',
        danger: 'border-danger/40 bg-bg-elevated text-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-bg-subtle',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-fg-muted opacity-0 transition-opacity hover:text-fg group-hover:opacity-100',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold text-fg', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90 text-fg-muted', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

/* ============================================================
 * Toast 控制器（sonner 风格的轻量 API）
 * ============================================================ */
type ToastVariant = 'default' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastListener = (items: ToastItem[]) => void;

class ToastController {
  private items: ToastItem[] = [];
  private listeners = new Set<ToastListener>();

  subscribe(cb: ToastListener): () => void {
    this.listeners.add(cb);
    cb(this.items);
    return () => this.listeners.delete(cb);
  }

  push(input: Omit<ToastItem, 'id'> & { id?: string }): string {
    const id = input.id ?? `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: ToastItem = { variant: 'default', duration: 4000, ...input, id };
    this.items = [...this.items, item];
    this.emit();
    if (item.duration && item.duration > 0) {
      setTimeout(() => this.dismiss(id), item.duration);
    }
    return id;
  }

  dismiss(id: string): void {
    this.items = this.items.filter((t) => t.id !== id);
    this.emit();
  }

  clear(): void {
    this.items = [];
    this.emit();
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.items);
  }
}

export const toastController = new ToastController();

/** sonner 风格的便捷 API */
export const toast = {
  show: (title: string, opts?: Partial<Omit<ToastItem, 'id' | 'title'>>) =>
    toastController.push({ title, ...opts }),
  success: (title: string, opts?: Partial<Omit<ToastItem, 'id' | 'title' | 'variant'>>) =>
    toastController.push({ title, variant: 'success', ...opts }),
  warning: (title: string, opts?: Partial<Omit<ToastItem, 'id' | 'title' | 'variant'>>) =>
    toastController.push({ title, variant: 'warning', ...opts }),
  danger: (title: string, opts?: Partial<Omit<ToastItem, 'id' | 'title' | 'variant'>>) =>
    toastController.push({ title, variant: 'danger', ...opts }),
  dismiss: (id: string) => toastController.dismiss(id),
  clear: () => toastController.clear(),
};

/** Toaster 组件 —— 放在 App 根节点 */
export function Toaster(): React.ReactElement {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    return toastController.subscribe(setItems);
  }, []);

  return (
    <ToastProvider duration={4000}>
      {items.map((item) => (
        <Toast
          key={item.id}
          variant={item.variant}
          duration={item.duration}
          onOpenChange={(open) => {
            if (!open) toastController.dismiss(item.id);
          }}
        >
          <div className="grid gap-1">
            <ToastTitle>{item.title}</ToastTitle>
            {item.description ? (
              <ToastDescription>{item.description}</ToastDescription>
            ) : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}