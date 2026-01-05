import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearData = () => {
    if (
      confirm(
        "This will clear all your data. Are you sure you want to continue?"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message ||
                "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
