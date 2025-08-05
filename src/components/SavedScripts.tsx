import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Play,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedScript {
  name: string;
  description: string;
  created_at: string;
  exists: {
    script: boolean;
    config: boolean;
    executable: boolean;
  };
  paths: {
    script: string;
    config: string;
    executable: string;
  };
}

export function SavedScripts() {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const loadScripts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/scripts/list");

      if (!response.ok) {
        throw new Error("Erro ao carregar scripts");
      }

      const result = await response.json();
      setScripts(result.scripts || []);
    } catch (error) {
      console.error("Erro ao carregar scripts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de scripts salvos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Caminho copiado para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const downloadScript = (script: SavedScript) => {
    // Simulação de download - na prática, você pode implementar uma rota de download no backend
    toast({
      title: "Download Iniciado",
      description: `Script ${script.name} será baixado em breve.`,
    });
  };

  const deleteScript = async (scriptName: string) => {
    try {
      setDeleting(scriptName);
      const response = await fetch(
        `http://localhost:8000/scripts/delete/${encodeURIComponent(
          scriptName
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir script");
      }

      toast({
        title: "Script Excluído",
        description: `Script "${scriptName}" foi excluído com sucesso.`,
      });

      // Recarregar a lista de scripts
      await loadScripts();
    } catch (error) {
      console.error("Erro ao excluir script:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o script.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
            <p>Carregando scripts salvos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Scripts Salvos</h3>
          <p className="text-sm text-gray-600">
            Scripts Python gerados para execução independente
          </p>
        </div>
        <Button variant="outline" onClick={loadScripts} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {scripts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum script salvo ainda.</p>
              <p className="text-sm">
                Use o Quick ETL para salvar seus primeiros scripts.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {scripts.map((script) => (
            <Card
              key={script.name}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{script.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(script.created_at)}
                  </div>
                </div>
                {script.description && (
                  <CardDescription>{script.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status dos Arquivos */}
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={script.exists.script ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {script.exists.script ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Script
                  </Badge>
                  <Badge
                    variant={script.exists.config ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {script.exists.config ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Config
                  </Badge>
                  <Badge
                    variant={
                      script.exists.executable ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {script.exists.executable ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Executável
                  </Badge>
                </div>

                {/* Caminhos dos Arquivos */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="font-mono text-gray-700 truncate flex-1">
                      {script.paths.executable}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(script.paths.executable)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadScript(script)}
                    disabled={!script.exists.script}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(`python "${script.paths.executable}"`)
                    }
                    disabled={!script.exists.executable}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Comando
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteScript(script.name)}
                    disabled={deleting === script.name}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting === script.name ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>

                {/* Instruções de Execução */}
                {script.exists.executable && (
                  <Alert>
                    <Play className="h-4 w-4" />
                    <AlertDescription>
                      Para executar este script, abra um terminal na pasta do
                      projeto e execute:
                      <code className="block mt-1 p-2 bg-gray-100 rounded text-sm">
                        python "{script.paths.executable}"
                      </code>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
