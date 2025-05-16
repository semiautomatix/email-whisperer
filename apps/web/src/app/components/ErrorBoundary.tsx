"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl border border-brand-sand-light shadow-lg max-w-md">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle size={36} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              We apologize for the inconvenience. The application encountered an
              unexpected error.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mb-4 text-left">
                <details className="bg-gray-50 p-2 rounded-md text-xs overflow-auto max-h-44">
                  <summary className="font-medium cursor-pointer mb-1">
                    Error Details
                  </summary>
                  <p className="font-mono text-red-600 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              </div>
            )}
            <Button
              onClick={this.resetErrorBoundary}
              className="bg-brand-teal hover:bg-brand-teal-dark"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create a component-specific error boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component";

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
