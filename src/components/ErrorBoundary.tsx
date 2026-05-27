import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : null;
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
            <div>
              <p className="font-medium text-destructive">Algo salió mal</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {this.state.message ?? "Error inesperado. Recargá la página."}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg border border-destructive/30 px-4 py-1.5 text-xs text-destructive transition hover:bg-destructive/10"
              >
                Recargar
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
