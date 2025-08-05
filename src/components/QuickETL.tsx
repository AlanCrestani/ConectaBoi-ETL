import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Upload, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet,
  Database,
  Zap,
  Save
} from 'lucide-react';

interface QuickETLProps {
  savedConfig?: {
    transformations: Record<string, string>;
    removedColumns: string[];
    fileId: string;
    originalFileName: string;
    previewData: Record<string, unknown>[];
    columns: string[];
  };
}

export function QuickETL({ savedConfig }: QuickETLProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [processedData, setProcessedData] = useState<Record<string, unknown>[]>([]);
  const [saveScriptMode, setSaveScriptMode] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStatus('idle');
      setResultMessage('');
    }
  };

  const processETL = async () => {
    if (!selectedFile || !savedConfig) return;

    setProcessing(true);
    setStatus('processing');
    setProgress(0);

    try {
      // 1. Upload do arquivo
      setProgress(20);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro no upload do arquivo');
      }

      const uploadResult = await uploadResponse.json();
      setProgress(40);

      // 2. Aplicar configurações ETL
      const etlConfig = {
        file_id: uploadResult.file_id,
        transformations: savedConfig.transformations,
        excluded_columns: savedConfig.removedColumns,
        excluded_rows: []
      };

      const etlResponse = await fetch('http://localhost:8000/etl/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(etlConfig),
      });

      if (!etlResponse.ok) {
        throw new Error('Erro no processamento ETL');
      }

      const etlResult = await etlResponse.json();
      setProgress(70);
      setProcessedData(etlResult.data || []);

      // 3. Upload para Supabase
      const supabaseResponse = await fetch('http://localhost:8000/supabase/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: uploadResult.file_id,
          table_name: 'conectaboi_historico_consumo',
          data: etlResult.data
        }),
      });

      if (!supabaseResponse.ok) {
        throw new Error('Erro no upload para Supabase');
      }

      const supabaseResult = await supabaseResponse.json();
      setProgress(100);

      setStatus('success');
      setResultMessage(`✅ Processo concluído! ${supabaseResult.records_inserted || etlResult.data?.length || 0} registros inseridos na tabela conectaboi_historico_consumo.`);

    } catch (error) {
      console.error('Erro no processo ETL:', error);
      setStatus('error');
      setResultMessage(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessing(false);
    }
  };

  const generatePythonScript = () => {
    if (!savedConfig) return '';

    const transformationsCode = Object.entries(savedConfig.transformations)
      .map(([oldValue, newValue]) => `        '${oldValue}': '${newValue}'`)
      .join(',\n');

    return `#!/usr/bin/env python3
"""
Script ETL ConectaBoi - ${scriptName || 'Histórico Consumo'}
${scriptDescription ? `Descrição: ${scriptDescription}` : ''}
Gerado automaticamente em: ${new Date().toLocaleDateString('pt-BR')}
"""

import sys
import os
from pathlib import Path

# Adicionar diretório backend ao path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

from etl.conectaboi_etl_smart import ConectaBoiETL

def main():
    """Executa o processo ETL completo"""
    
    # Configurações
    transformations = {
${transformationsCode}
    }
    
    removed_columns = ${JSON.stringify(savedConfig.removedColumns)}
    
    # Inicializar ETL
    etl = ConectaBoiETL()
    
    print("🚀 Iniciando processo ETL...")
    
    # Solicitar arquivo de entrada
    input_file = input("Digite o caminho do arquivo CSV/XLSX: ").strip()
    if not os.path.exists(input_file):
        print(f"❌ Arquivo não encontrado: {input_file}")
        return
    
    try:
        # Processar arquivo
        print("📊 Processando dados...")
        result = etl.process_file(
            file_path=input_file,
            transformations=transformations,
            excluded_columns=removed_columns,
            excluded_rows=[]
        )
        
        print(f"✅ Processamento concluído!")
        print(f"📈 Registros processados: {len(result.get('data', []))}")
        
        # Upload para Supabase
        upload_choice = input("Fazer upload para Supabase? (s/n): ").strip().lower()
        if upload_choice in ['s', 'sim', 'y', 'yes']:
            print("☁️ Fazendo upload para Supabase...")
            upload_result = etl.upload_to_supabase(
                table_name="conectaboi_historico_consumo",
                data=result['data']
            )
            print(f"🎯 Upload concluído! {upload_result.get('records_inserted', 0)} registros inseridos.")
        
        print("🏆 Processo ETL finalizado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante o processo ETL: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
`;
  };

  const saveScript = async () => {
    if (!savedConfig || !scriptName.trim()) return;

    try {
      const scriptContent = generatePythonScript();
      
      const response = await fetch('http://localhost:8000/scripts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_name: scriptName.trim(),
          script_content: scriptContent,
          config_data: savedConfig,
          description: scriptDescription.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar script');
      }

      const result = await response.json();
      
      setStatus('success');
      setResultMessage(`✅ Script ${scriptName} salvo com sucesso em generated_scripts/`);
      setSaveScriptMode(false);
      setScriptName('');
      setScriptDescription('');

    } catch (error) {
      console.error('Erro ao salvar script:', error);
      setStatus('error');
      setResultMessage(`❌ Erro ao salvar script: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (!savedConfig) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma configuração selecionada.</p>
            <p className="text-sm">Selecione uma configuração salva para usar o Quick ETL.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-orange-500" />
          Quick ETL - Aplicação Rápida
        </CardTitle>
        <CardDescription>
          Aplique a configuração salva em um novo arquivo e faça upload direto para o Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuração Ativa */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Configuração Ativa:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Arquivo Original:</span>
              <Badge variant="outline">{savedConfig.originalFileName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Transformações:</span>
              <Badge variant="secondary">{Object.keys(savedConfig.transformations).length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Colunas Removidas:</span>
              <Badge variant="secondary">{savedConfig.removedColumns.length}</Badge>
            </div>
          </div>
        </div>

        {/* Seleção de Arquivo */}
        <div>
          <Label htmlFor="quick-file">Selecionar Novo Arquivo (.csv, .xlsx)</Label>
          <Input
            id="quick-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={processing}
            className="mt-2"
          />
          {selectedFile && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Progresso */}
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Status */}
        {status !== 'idle' && !processing && (
          <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center">
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className="ml-2">
                {resultMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Dados Processados Preview */}
        {processedData.length > 0 && status === 'success' && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preview dos Dados Processados:</h4>
            <div className="max-h-40 overflow-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(processedData[0] || {}).map((key) => (
                      <th key={key} className="px-2 py-1 text-left border-b">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-2 py-1 border-r">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {processedData.length > 3 && (
                <div className="p-2 text-center text-gray-500 text-xs">
                  ... e mais {processedData.length - 3} registros
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex space-x-4">
          <Button
            onClick={processETL}
            disabled={!selectedFile || processing}
            className="flex-1"
            size="lg"
          >
            {processing ? (
              <>Processando...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Processar e Enviar para Supabase
              </>
            )}
          </Button>

          <Dialog open={saveScriptMode} onOpenChange={setSaveScriptMode}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!savedConfig}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Script
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Script Python</DialogTitle>
                <DialogDescription>
                  Salve a configuração como um script Python executável para uso futuro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="script-name">Nome do Script *</Label>
                  <Input
                    id="script-name"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    placeholder="ex: etl_historico_consumo"
                  />
                </div>
                <div>
                  <Label htmlFor="script-description">Descrição (opcional)</Label>
                  <Textarea
                    id="script-description"
                    value={scriptDescription}
                    onChange={(e) => setScriptDescription(e.target.value)}
                    placeholder="Descreva o que este script faz..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveScriptMode(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={saveScript}
                  disabled={!scriptName.trim()}
                >
                  Salvar Script
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
