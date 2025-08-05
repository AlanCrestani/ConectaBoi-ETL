import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ETLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 ETL Error Boundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no Sistema ETL</AlertTitle>
              <AlertDescription className="mt-2">
                Ocorreu um erro inesperado durante o processamento dos dados.
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-medium">
                    Detalhes técnicos (clique para expandir)
                  </summary>
                  <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                    {this.state.error?.message}
                    {this.state.error?.stack && (
                      <>
                        {"\n\nStack trace:\n"}
                        {this.state.error.stack}
                      </>
                    )}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                Recarregar Página
              </Button>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>
                💡 <strong>Dicas para resolver:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Verifique se o arquivo CSV está bem formatado</li>
                <li>
                  Certifique-se de que os dados foram carregados corretamente
                </li>
                <li>Tente recarregar a página e repetir o processo</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
