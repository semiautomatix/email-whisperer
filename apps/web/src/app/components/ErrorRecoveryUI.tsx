"use client";

import React from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorRecoveryUIProps {
  error?: Error | null;
  resetError?: () => void;
  errorInfo?: React.ErrorInfo | null;
  message?: string;
  showHomeButton?: boolean;
}

const ErrorRecoveryUI: React.FC<ErrorRecoveryUIProps> = ({
  error,
  resetError,
  errorInfo,
  message = "We apologize for the inconvenience. The application encountered an unexpected error.",
  showHomeButton = true,
}) => {
  const router = useRouter();

  const navigateHome = () => {
    router.push("/");
  };

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
        <p className="text-muted-foreground mb-4">{message}</p>
        {process.env.NODE_ENV === "development" && error && (
          <div className="mb-4 text-left">
            <details className="bg-gray-50 p-2 rounded-md text-xs overflow-auto max-h-44">
              <summary className="font-medium cursor-pointer mb-1">
                Error Details
              </summary>
              <p className="font-mono text-red-600 whitespace-pre-wrap">
                {error.toString()}
              </p>
              {errorInfo && (
                <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              )}
            </details>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {resetError && (
            <Button
              onClick={resetError}
              className="bg-brand-teal hover:bg-brand-teal-dark"
            >
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Button
              onClick={navigateHome}
              variant="outline"
              className="border-brand-sand hover:bg-brand-sand/10"
            >
              <Home size={16} className="mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorRecoveryUI;
