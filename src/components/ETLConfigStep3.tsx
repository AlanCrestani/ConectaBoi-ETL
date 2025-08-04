import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Eye, Download, Trash2, CheckCircle } from "lucide-react";
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

interface ETLConfigStep3Props {
  fileId: string;
  csvData: any[];
  csvHeaders: string[];
  mappings: ColumnMapping[];
  onNext: (excludedRows: number[]) => void;
  onBack: () => void;
}

const ETLConfigStep3 = ({ fileId, csvData, csvHeaders, mappings, onNext, onBack }: ETLConfigStep3Props) => {
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set([0])); // First row excluded by default
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Filter short rows (< 30 characters) for auto-exclusion
  const shortRows = csvData.map((row, index) => ({
    index,
    isShort: row.join('').length < 30
  })).filter(item => item.isShort).map(item => item.index);

  // Initialize excluded rows with first row and short rows
  useState(() => {
    const initialExcluded = new Set([0, ...shortRows]);
    setExcludedRows(initialExcluded);
  });

  const toggleRowExclusion = (rowIndex: number) => {
    const newExcluded = new Set(excludedRows);
    if (newExcluded.has(rowIndex)) {
      newExcluded.delete(rowIndex);
    } else {
      newExcluded.add(rowIndex);
    }
    setExcludedRows(newExcluded);
  };

  const generatePreviewRow = () => {
    // Find first non-excluded row for preview
    const firstValidRow = csvData.find((_, index) => !excludedRows.has(index));
    if (!firstValidRow) return {};

    const previewData: Record<string, any> = {};
    
    mappings.forEach(mapping => {
      if (mapping.type === 'fixed') {
        previewData[mapping.sqlColumn] = mapping.fixedValue;
      } else if (mapping.type === 'derived') {
        const sourceValue = firstValidRow[csvHeaders.indexOf(mapping.derivedFrom || '')];
        // Apply transformations if any
        previewData[mapping.sqlColumn] = sourceValue || 'DERIVADO';
      } else {
        const csvIndex = csvHeaders.indexOf(mapping.csvColumn);
        previewData[mapping.sqlColumn] = firstValidRow[csvIndex] || '';
      }
    });

    return previewData;
  };

  const downloadConfig = () => {
    const config = {
      fileId,
      tableName: `etl_staging_${fileId}`,
      csvHeaders,
      mappings,
      excludedRows: Array.from(excludedRows),
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileId}_config.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Configuração salva",
      description: "Arquivo JSON de configuração baixado com sucesso.",
    });
  };

  const previewData = generatePreviewRow();
  const validRowCount = csvData.length - excludedRows.size;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Preview e Validação
        </h2>
        <p className="text-muted-foreground">
          Revise os dados, exclua linhas inválidas e visualize o resultado final
        </p>
      </div>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Dados do CSV</span>
              <Badge variant="secondary">{validRowCount} linhas válidas</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Mostrar'} Preview
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 w-12">Excluir</th>
                  <th className="text-left p-2 w-12">#</th>
                  {csvHeaders.slice(0, 6).map((header, idx) => (
                    <th key={idx} className="text-left p-2 min-w-24 truncate">{header}</th>
                  ))}
                  {csvHeaders.length > 6 && (
                    <th className="text-left p-2">+{csvHeaders.length - 6} mais...</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 20).map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    className={`border-t border-border ${
                      excludedRows.has(rowIndex) ? 'bg-destructive/5 text-muted-foreground' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="p-2">
                      <Checkbox
                        checked={excludedRows.has(rowIndex)}
                        onCheckedChange={() => toggleRowExclusion(rowIndex)}
                      />
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{rowIndex + 1}</td>
                    {row.slice(0, 6).map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className="p-2 max-w-32 truncate" title={cell}>
                        {cell}
                      </td>
                    ))}
                    {row.length > 6 && (
                      <td className="p-2 text-xs text-muted-foreground">
                        +{row.length - 6} cols
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExcludedRows(new Set([0, ...shortRows]))}
              className="flex items-center space-x-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Auto-exclusão</span>
            </Button>
            
            <div className="text-sm text-muted-foreground flex items-center">
              • {excludedRows.size} linhas excluídas • {validRowCount} linhas para processar
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transformed Data Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>Preview dos Dados Transformados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Primeira linha válida após transformação:
              </p>
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(previewData).map(([column, value]) => {
                  const mapping = mappings.find(m => m.sqlColumn === column);
                  const getTypeColor = () => {
                    switch(mapping?.type) {
                      case 'derived': return 'text-accent border-accent/20 bg-accent/5';
                      case 'fixed': return 'text-secondary border-secondary/20 bg-secondary/5'; 
                      default: return 'text-primary border-primary/20 bg-primary/5';
                    }
                  };

                  return (
                    <div key={column} className={`border rounded-lg p-3 ${getTypeColor()}`}>
                      <div className="font-medium text-sm">{column}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {mapping?.type === 'fixed' ? 'Valor fixo' :
                         mapping?.type === 'derived' ? `Derivado de: ${mapping.derivedFrom}` :
                         `CSV: ${mapping?.csvColumn}`}
                      </div>
                      <div className="font-mono text-sm mt-2 bg-background/50 rounded px-2 py-1">
                        {String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={downloadConfig}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Salvar Config</span>
          </Button>
          
          <Button 
            onClick={() => onNext(Array.from(excludedRows))}
            className="flex items-center space-x-2"
          >
            <span>Gerar Script ETL</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ETLConfigStep3;