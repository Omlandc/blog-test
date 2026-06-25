/**
 * ErrorBoundary —— 错误边界
 * 防止单页崩溃导致整站白屏
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-danger" />
          <h2 className="text-xl font-bold text-fg">页面出错了</h2>
          <p className="mt-2 text-sm text-fg-muted">
            {this.state.error?.message || '发生了一个未知错误'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button onClick={this.reset}>
              <RefreshCw className="h-4 w-4" /> 重试
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              返回首页
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
