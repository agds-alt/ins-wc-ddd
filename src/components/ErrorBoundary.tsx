// src/components/ErrorBoundary.tsx - Catch React errors
import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // ⚠️ FIRST THING CALLED when error occurs
    console.error('🔴 getDerivedStateFromError CALLED with error:', error);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error stack:', error.stack);

    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // ✅ ALWAYS log to console (even in production)
    console.error('🚨 ErrorBoundary caught error:', error);
    console.error('📍 Component stack:', errorInfo.componentStack);
    console.error('📝 Error stack:', error.stack);

    // Also log via logger
    logger.error('React component error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      console.error('🟡 ErrorBoundary RENDERING error UI');
      console.error('🟡 Error state:', this.state.error);

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>

              <p className="text-gray-600 mb-4">
                We've logged the error and will look into it. Please try reloading the page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="w-full mb-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                    Error details (dev only)
                  </summary>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-40">
                    <p className="text-red-900 font-bold mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    <pre className="text-red-800 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleHome}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
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