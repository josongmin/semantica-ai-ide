import React from "react";

import { Button } from "./Button";
import { Text } from "./Text";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Static fallback UI, or function that receives the error for debugging */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

interface ErrorBoundaryState {
  error: Error | null;
  resetKey: number;
}

/**
 * Catches render errors in children and shows recovery UI.
 * Prevents white-screen crashes in the webview.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    const { error, resetKey } = this.state;
    if (error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(error);
      if (fallback != null) return fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <Text size="sm" tone="ghost">
            Something went wrong
          </Text>
          <Text size="xs" tone="ghost" className="max-w-xs break-words font-mono">
            {error.message}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }))}
          >
            Retry
          </Button>
        </div>
      );
    }
    return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
  }
}
