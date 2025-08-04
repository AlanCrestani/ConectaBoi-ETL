import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, FileText, Database, Settings, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColumnMapping {
  csvColumn: string;
  sqlColumn: string;
  type: 'direct' | 'derived' | 'fixed';
  transformations?: Record<string, string>;
  fixedValue?: string;
  derivedFrom?: string;
  validateInDimCurral?: boolean;
}

interface ETLConfigStep4Props {
  fileId: string;
  csvData: any[];
  csvHeaders: string[];
  mappings: ColumnMapping[];
  excludedRows: number[];
  sqlSchema: string;
  onBack: () => void;
  onComplete: () => void;
}

const ETLConfigStep4 = ({ 
  fileId, 
  csvData, 
  csvHeaders, 
  mappings, 
  excludedRows, 
  sqlSchema,
  onBack, 
  onComplete 
}: ETLConfigStep4Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePythonScript = () => {
    return `#!/usr/bin/env python3
"""
ETL Script para ${fileId}
Gerado automaticamente pelo ConectaBoi ETL
"""

import pandas as pd
import json
import logging
from datetime import datetime
from supabase import create_client, Client
import os

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuração Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_config():
    """Carrega configuração do arquivo JSON"""
    with open('config/${fileId}_config.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_curral(df):
    """Valida se currais existem na dim_curral"""
    try:
        # Busca todos os currais válidos
        response = supabase.table('dim_curral').select('id, nome').execute()
        valid_currals = {row['nome']: row['id'] for row in response.data}
        
        # Valida e mapeia currais
        df['id_curral_mapped'] = df['id_curral'].map(valid_currals)
        
        # Log currais não encontrados
        invalid_currals = df[df['id_curral_mapped'].isna()]['id_curral'].unique()
        if len(invalid_currals) > 0:
            logger.warning(f"Currais não encontrados em dim_curral: {list(invalid_currals)}")
            
        return df.dropna(subset=['id_curral_mapped'])
        
    except Exception as e:
        logger.error(f"Erro na validação de currais: {e}")
        return df

def transform_data(df, config):
    """Aplica transformações nos dados"""
    logger.info("Iniciando transformação dos dados...")
    
    # Aplicar mapeamentos
    result_df = pd.DataFrame()
    
    for mapping in config['mappings']:
        col_name = mapping['sqlColumn']
        
        if mapping['type'] == 'fixed':
            result_df[col_name] = mapping['fixedValue']
            
        elif mapping['type'] == 'direct':
            if mapping['csvColumn'] in df.columns:
                result_df[col_name] = df[mapping['csvColumn']]
            else:
                logger.warning(f"Coluna {mapping['csvColumn']} não encontrada no CSV")
                
        elif mapping['type'] == 'derived':
            if mapping.get('derivedFrom') in df.columns:
                source_col = df[mapping['derivedFrom']]
                
                # Aplicar transformações se existirem
                if mapping.get('transformations'):
                    result_df[col_name] = source_col.map(mapping['transformations']).fillna(source_col)
                else:
                    result_df[col_name] = source_col
    
    # Validar currais se necessário
    if 'id_curral' in result_df.columns:
        curral_mapping = next((m for m in config['mappings'] if m['sqlColumn'] == 'id_curral'), None)
        if curral_mapping and curral_mapping.get('validateInDimCurral'):
            result_df = validate_curral(result_df)
    
    logger.info(f"Dados transformados: {len(result_df)} linhas")
    return result_df

def load_to_staging(df):
    """Carrega dados para tabela staging"""
    try:
        # Converter DataFrame para lista de dicionários
        records = df.to_dict('records')
        
        # Inserir no Supabase
        response = supabase.table('etl_staging_${fileId}').insert(records).execute()
        
        if response.data:
            logger.info(f"Dados carregados com sucesso: {len(response.data)} registros")
            return True
        else:
            logger.error("Erro ao carregar dados")
            return False
            
    except Exception as e:
        logger.error(f"Erro no carregamento: {e}")
        return False

def main():
    """Função principal do ETL"""
    try:
        logger.info("Iniciando ETL para ${fileId}")
        
        # Carregar configuração
        config = load_config()
        
        # Carregar CSV
        df = pd.read_csv('C:/conectaboi_csv/${fileId}.csv')
        logger.info(f"CSV carregado: {len(df)} linhas")
        
        # Remover linhas excluídas
        excluded_rows = config.get('excludedRows', [])
        df = df.drop(excluded_rows).reset_index(drop=True)
        logger.info(f"Linhas após exclusão: {len(df)}")
        
        # Transformar dados
        transformed_df = transform_data(df, config)
        
        # Carregar para staging
        success = load_to_staging(transformed_df)
        
        if success:
            logger.info("ETL concluído com sucesso!")
            
            # Mover arquivo para pasta processed
            import shutil
            shutil.move(f'C:/conectaboi_csv/${fileId}.csv', f'C:/conectaboi_csv/processed/${fileId}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
            
        else:
            logger.error("ETL falhou!")
            return False
            
    except Exception as e:
        logger.error(f"Erro geral no ETL: {e}")
        return False

if __name__ == "__main__":
    main()
`;
  };

  const generateConfigJSON = () => {
    return {
      fileId,
      tableName: `etl_staging_${fileId}`,
      csvHeaders,
      mappings,
      excludedRows,
      sqlSchema,
      createdAt: new Date().toISOString(),
      description: `Configuração ETL para ${fileId}`,
      version: "1.0"
    };
  };

  const downloadAllFiles = () => {
    setIsGenerating(true);
    
    try {
      // Generate files
      const pythonScript = generatePythonScript();
      const configJSON = generateConfigJSON();
      
      // Download Python script
      const scriptBlob = new Blob([pythonScript], { type: 'text/python' });
      const scriptUrl = URL.createObjectURL(scriptBlob);
      const scriptLink = document.createElement('a');
      scriptLink.href = scriptUrl;
      scriptLink.download = `etl_${fileId}.py`;
      scriptLink.click();
      URL.revokeObjectURL(scriptUrl);
      
      // Download config JSON
      const configBlob = new Blob([JSON.stringify(configJSON, null, 2)], { type: 'application/json' });
      const configUrl = URL.createObjectURL(configBlob);
      const configLink = document.createElement('a');
      configLink.href = configUrl;
      configLink.download = `${fileId}_config.json`;
      configLink.click();
      URL.revokeObjectURL(configUrl);
      
      // Download SQL schema
      const sqlBlob = new Blob([sqlSchema], { type: 'text/sql' });
      const sqlUrl = URL.createObjectURL(sqlBlob);
      const sqlLink = document.createElement('a');
      sqlLink.href = sqlUrl;
      sqlLink.download = `etl_staging_${fileId}.sql`;
      sqlLink.click();
      URL.revokeObjectURL(sqlUrl);
      
      toast({
        title: "Arquivos gerados",
        description: "Script Python, configuração JSON e schema SQL baixados com sucesso!",
      });
      
    } catch (error) {
      toast({
        title: "Erro na geração",
        description: "Falha ao gerar os arquivos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatsData = () => {
    const validRows = csvData.length - excludedRows.length;
    const directMappings = mappings.filter(m => m.type === 'direct').length;
    const derivedMappings = mappings.filter(m => m.type === 'derived').length;
    const fixedMappings = mappings.filter(m => m.type === 'fixed').length;
    
    return {
      totalRows: csvData.length,
      validRows,
      excludedRows: excludedRows.length,
      totalMappings: mappings.length,
      directMappings,
      derivedMappings,
      fixedMappings
    };
  };

  const stats = getStatsData();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Configuração Concluída
        </h2>
        <p className="text-muted-foreground">
          ETL configurado com sucesso! Baixe os arquivos e execute o processamento.
        </p>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Resumo da Configuração</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">{stats.validRows}</div>
              <div className="text-sm text-muted-foreground">Linhas Válidas</div>
            </div>
            
            <div className="text-center p-4 bg-accent/5 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent">{stats.totalMappings}</div>
              <div className="text-sm text-muted-foreground">Mapeamentos</div>
            </div>
            
            <div className="text-center p-4 bg-success/5 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">{stats.directMappings}</div>
              <div className="text-sm text-muted-foreground">Diretos</div>
            </div>
            
            <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">{stats.derivedMappings + stats.fixedMappings}</div>
              <div className="text-sm text-muted-foreground">Transformados</div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">
              CSV: {csvHeaders.length} colunas
            </Badge>
            <Badge variant="outline">
              SQL: {mappings.length} campos mapeados
            </Badge>
            <Badge variant="outline">
              Excluídas: {stats.excludedRows} linhas
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Generated Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Arquivos Gerados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Code className="h-8 w-8 text-primary" />
              <div>
                <div className="font-medium">etl_{fileId}.py</div>
                <div className="text-sm text-muted-foreground">Script Python</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Settings className="h-8 w-8 text-accent" />
              <div>
                <div className="font-medium">{fileId}_config.json</div>
                <div className="text-sm text-muted-foreground">Configuração</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Database className="h-8 w-8 text-secondary" />
              <div>
                <div className="font-medium">etl_staging_{fileId}.sql</div>
                <div className="text-sm text-muted-foreground">Schema SQL</div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Próximos Passos:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Baixe todos os arquivos gerados</li>
              <li>Execute o schema SQL no Supabase para criar a tabela staging</li>
              <li>Configure as variáveis de ambiente (SUPABASE_URL, SUPABASE_KEY)</li>
              <li>Execute o script Python: <code className="bg-background px-1 rounded">python etl_{fileId}.py</code></li>
              <li>Verifique os logs e os dados na tabela staging</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button
            onClick={downloadAllFiles}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGenerating ? 'Gerando...' : 'Baixar Arquivos'}</span>
          </Button>
          
          <Button 
            onClick={onComplete}
            variant="outline"
          >
            Configurar Outro Arquivo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ETLConfigStep4;