import {
  Package,
  Database,
  Settings,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  clearPersistedETLState,
  hasPersistedETLState,
} from "@/hooks/usePersistedState";

const Header = () => {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(
    null
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkSupabaseConnection = async () => {
    try {
      const response = await fetch("http://localhost:8000/health/supabase", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSupabaseConnected(result.connected === true);
      } else {
        setSupabaseConnected(false);
      }
    } catch (error) {
      console.warn("Erro ao verificar conexão Supabase:", error);
      setSupabaseConnected(false);
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Verificar conexão na inicialização
    checkSupabaseConnection();

    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkSupabaseConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleResetSession = () => {
    if (
      confirm(
        "🔄 Deseja reiniciar a sessão ETL? Isso irá limpar todo o progresso atual."
      )
    ) {
      clearPersistedETLState();
      window.location.reload();
    }
  };

  const showResetButton = hasPersistedETLState();

  const getConnectionStatus = () => {
    if (supabaseConnected === null) {
      return {
        icon: Database,
        text: "Verificando...",
        variant: "secondary" as const,
        className: "text-yellow-600",
      };
    } else if (supabaseConnected) {
      return {
        icon: Wifi,
        text: "Supabase Conectado",
        variant: "secondary" as const,
        className: "text-green-600 bg-green-50 border-green-200",
      };
    } else {
      return {
        icon: WifiOff,
        text: "Supabase Desconectado",
        variant: "destructive" as const,
        className: "text-red-600 bg-red-50 border-red-200",
      };
    }
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-lg">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              ConectaBoi ETL
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Importação Configurável
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showResetButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSession}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reiniciar</span>
            </Button>
          )}

          <Badge
            variant={connectionStatus.variant}
            className={`flex items-center space-x-1 ${connectionStatus.className}`}
            onClick={checkSupabaseConnection}
            style={{ cursor: "pointer" }}
            title={`Última verificação: ${
              lastChecked?.toLocaleTimeString() || "Nunca"
            } - Clique para verificar novamente`}
          >
            <ConnectionIcon className="h-3 w-3" />
            <span className="text-xs">{connectionStatus.text}</span>
          </Badge>

          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
