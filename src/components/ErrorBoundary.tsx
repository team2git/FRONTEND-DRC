import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 p-6 shadow-sm">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">
                  Something went wrong
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-1">
                  {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
                </p>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-500 cursor-pointer font-semibold hover:underline">
                      Show stack trace
                    </summary>
                    <pre className="mt-2 text-[10px] text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                      {this.state.error?.stack}
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <button
                  onClick={this.handleReset}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#C8102E] text-white rounded-xl text-xs font-bold hover:bg-[#a00d24] transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
