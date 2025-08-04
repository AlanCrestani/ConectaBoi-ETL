import { useState } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileOption {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'configured' | 'processing';
}

const FileSelector = ({ onFileSelect }: { onFileSelect: (fileId: string) => void }) => {
  const [files] = useState<FileOption[]>([
    {
      id: "01_historico_consumo",
      name: "01 - Histórico de Consumo",
      description: "Dados históricos de consumo de ração por curral",
      status: 'pending'
    },
    {
      id: "02_desvio_carregamento", 
      name: "02 - Desvio de Carregamento",
      description: "Análise de desvios no processo de carregamento",
      status: 'pending'
    },
    {
      id: "03_desvio_distribuicao",
      name: "03 - Desvio de Distribuição", 
      description: "Monitoramento de desvios na distribuição",
      status: 'pending'
    },
    {
      id: "04_itens_trato",
      name: "04 - Itens do Trato",
      description: "Composição detalhada dos itens utilizados no trato",
      status: 'pending'
    },
    {
      id: "05_trato_curral",
      name: "05 - Trato por Curral",
      description: "Distribuição de trato específica por curral",
      status: 'pending'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'processing':
        return <div className="animate-spin h-5 w-5 border-2 border-warning border-t-transparent rounded-full" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'configured':
        return 'border-success bg-success/5';
      case 'processing':
        return 'border-warning bg-warning/5';
      default:
        return 'border-border hover:border-primary/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Selecione o Arquivo CSV</h2>
        <p className="text-muted-foreground">Escolha qual arquivo você deseja configurar para importação</p>
      </div>

      <div className="grid gap-4 max-w-3xl mx-auto">
        {files.map((file) => (
          <Card key={file.id} className={`cursor-pointer transition-all hover:shadow-md ${getStatusColor(file.status)}`}>
            <CardContent className="p-6" onClick={() => onFileSelect(file.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(file.status)}
                  <div>
                    <h3 className="font-semibold text-foreground">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">{file.description}</p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FileSelector;