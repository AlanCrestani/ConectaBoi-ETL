import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useConfigPersistence } from "@/hooks/useConfigPersistence";
import { Save, Upload, Trash2, Calendar, FileText } from "lucide-react";

interface SavedConfigData {
  transformations: Record<string, string>;
  removedColumns: string[];
  fileId: string;
  originalFileName: string;
  previewData: Record<string, unknown>[];
  columns: string[];
}

interface ConfigManagerProps {
  currentConfig?: SavedConfigData;
  onLoadConfig: (config: SavedConfigData) => void;
}

export function ConfigManager({
  currentConfig,
  onLoadConfig,
}: ConfigManagerProps) {
  const { savedConfigs, saveConfig, loadConfig, deleteConfig } =
    useConfigPersistence();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");

  const handleSaveConfig = () => {
    if (!currentConfig || !configName.trim()) return;

    const configId = saveConfig(
      configName.trim(),
      currentConfig,
      configDescription.trim()
    );
    setIsDialogOpen(false);
    setConfigName("");
    setConfigDescription("");
  };

  const handleLoadConfig = (configId: string) => {
    const config = loadConfig(configId);
    if (config) {
      onLoadConfig(config.config);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Botão para salvar configuração atual */}
      {currentConfig && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração Atual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Configuração ETL</DialogTitle>
              <DialogDescription>
                Salve a configuração atual para reutilizar nas próximas vezes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="config-name">Nome da Configuração *</Label>
                <Input
                  id="config-name"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Ex: ETL Histórico Consumo"
                />
              </div>
              <div>
                <Label htmlFor="config-description">Descrição (opcional)</Label>
                <Textarea
                  id="config-description"
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  placeholder="Descreva o que esta configuração faz..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig} disabled={!configName.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Lista de configurações salvas */}
      {savedConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Configurações Salvas
            </CardTitle>
            <CardDescription>
              Clique em uma configuração para carregá-la
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleLoadConfig(config.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{config.name}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(config.createdAt)}
                      </div>
                    </div>
                    {config.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {config.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant="secondary">
                        {
                          Object.keys(config.config.transformations || {})
                            .length
                        }{" "}
                        transformações
                      </Badge>
                      <Badge variant="outline">
                        {config.config.removedColumns?.length || 0} colunas
                        removidas
                      </Badge>
                      <Badge variant="outline">
                        Arquivo: {config.config.originalFileName}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadConfig(config.id)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Carregar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmar Exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a configuração "
                            {config.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConfig(config.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {savedConfigs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma configuração salva ainda.</p>
              <p className="text-sm">
                Configure seu ETL e salve para reutilizar depois.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
