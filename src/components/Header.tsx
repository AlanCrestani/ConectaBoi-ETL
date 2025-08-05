import { Package, Database, Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearPersistedETLState,
  hasPersistedETLState,
} from "@/hooks/usePersistedState";

const Header = () => {
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

          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>Supabase Conectado</span>
          </div>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
