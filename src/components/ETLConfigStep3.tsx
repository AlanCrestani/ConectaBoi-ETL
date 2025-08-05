import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Zap,
  Settings,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSafeCSVData } from "@/hooks/useSafeCSVData";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfigManager } from "@/components/ConfigManager";
import { QuickETL } from "@/components/QuickETL";
import { SavedScripts } from "@/components/SavedScripts";
import { useConfigPersistence } from "@/hooks/useConfigPersistence";

interface ColumnMapping {
  csvColumn: string;
  sqlColumn: string;
  type: "direct" | "derived" | "fixed";
  transformations?: Record<string, string>;
  fixedValue?: string;
  derivedFrom?: string;
  validateInDimCurral?: boolean;
}

interface ETLConfigStep3Props {
  fileId: string;
  csvData: Record<string, unknown>[];
  csvHeaders: string[];
  mappings: ColumnMapping[];
  onNext: (excludedRows: number[]) => void;
  onBack: () => void;
}

const ETLConfigStep3 = ({
  fileId,
  csvData,
  csvHeaders,
  mappings,
  onNext,
  onBack,
}: ETLConfigStep3Props) => {
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set([0])); // First row excluded by default
  const [showPreview, setShowPreview] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    column: number | "row-number" | null;
    direction: "asc" | "desc" | null;
  }>({ column: null, direction: null });
  const [selectedConfig, setSelectedConfig] = useState<{
    transformations: Record<string, string>;
    removedColumns: string[];
    fileId: string;
    originalFileName: string;
    previewData: Record<string, unknown>[];
    columns: string[];
    mappings: ColumnMapping[];
  } | null>(null);
  const { toast } = useToast();
  const { loadConfig } = useConfigPersistence();

  // Usar validação defensiva dos dados CSV
  const safeData = useSafeCSVData(csvHeaders, csvData);

  // Debug logs
  console.log("🔍 ETLConfigStep3 Debug - Dados recebidos:");
  console.log("csvData type:", typeof csvData);
  console.log("csvData isArray:", Array.isArray(csvData));
  console.log("csvData sample:", csvData ? csvData.slice(0, 2) : null);
  console.log("🛡️ SafeData:", safeData); // Filter short rows (< 30 characters) for auto-exclusion - com proteção usando dados seguros
  const shortRows = safeData.data
    .map((row, index) => ({
      index,
      isShort: row.join("").length < 30,
    }))
    .filter((item) => item.isShort)
    .map((item) => item.index);

  // Initialize excluded rows with first row and short rows
  useState(() => {
    const initialExcluded = new Set([0, ...shortRows]);
    setExcludedRows(initialExcluded);
  });

  // Proteção contra dados undefined ou vazios (após os hooks)
  if (
    !csvData ||
    !csvHeaders ||
    !mappings ||
    csvData.length === 0 ||
    mappings.length === 0
  ) {
    console.error("ETLConfigStep3: Dados incompletos recebidos:", {
      csvData: !!csvData,
      csvHeaders: !!csvHeaders,
      mappings: !!mappings,
      csvDataLength: csvData?.length,
      mappingsLength: mappings?.length,
    });

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Erro: Dados Incompletos
          </h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados necessários para o preview.
          </p>
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Mapeamento</span>
          </Button>
        </div>
      </div>
    );
  }

  const handleNextClick = () => {
    console.log("🚀 PRÓXIMO STEP - Iniciando validação automática...");

    // Validação automática antes de prosseguir
    const validation = validateData();

    console.log(
      "Gerar Script ETL clicked with excludedRows:",
      Array.from(excludedRows)
    );

    // Verificar se há problemas críticos
    if (validation.issues.length > 0) {
      console.error(
        "❌ Validação falhou, não pode prosseguir:",
        validation.issues
      );
      toast({
        title: "❌ Não é possível prosseguir",
        description: `Corrija os ${validation.issues.length} problemas encontrados antes de continuar`,
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Validação passou, prosseguindo...");
    console.log("Calling onNext function...");

    try {
      onNext(Array.from(excludedRows));
      console.log("onNext called successfully");
    } catch (error) {
      console.error("Error calling onNext:", error);
      toast({
        title: "❌ Erro ao prosseguir",
        description: "Erro interno ao navegar para próximo step",
        variant: "destructive",
      });
    }
  };

  const toggleRowExclusion = (rowIndex: number) => {
    const newExcluded = new Set(excludedRows);
    if (newExcluded.has(rowIndex)) {
      newExcluded.delete(rowIndex);
    } else {
      newExcluded.add(rowIndex);
    }
    setExcludedRows(newExcluded);
  };

  // Função para ordenar os dados mantendo índices originais
  const sortDataWithIndices = (
    data: string[][],
    columnIndex: number,
    direction: "asc" | "desc"
  ) => {
    // Criar array com dados + índice original
    const dataWithIndices = data.map((row, originalIndex) => ({
      row,
      originalIndex,
    }));

    return dataWithIndices.sort((a, b) => {
      const aVal = a.row[columnIndex] || "";
      const bVal = b.row[columnIndex] || "";

      // Tentar converter para número se possível
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Comparação numérica
        return direction === "asc" ? aNum - bNum : bNum - aNum;
      } else {
        // Comparação string
        const result = aVal.localeCompare(bVal);
        return direction === "asc" ? result : -result;
      }
    });
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = (columnIndex: number | "row-number") => {
    let newDirection: "asc" | "desc" = "desc"; // Padrão: decrescente como solicitado

    if (sortConfig.column === columnIndex) {
      // Se já está ordenando por esta coluna, alterna direção
      newDirection = sortConfig.direction === "desc" ? "asc" : "desc";
    }

    setSortConfig({ column: columnIndex, direction: newDirection });

    const columnName =
      columnIndex === "row-number"
        ? "Número da Linha"
        : safeData.headers[columnIndex];
    console.log(
      `🔄 Ordenando ${
        columnIndex === "row-number"
          ? "por número da linha"
          : `coluna ${columnIndex} (${columnName})`
      } - ${newDirection}`
    );
    toast({
      title: "🔄 Dados ordenados",
      description: `${
        columnIndex === "row-number"
          ? "Linhas ordenadas por número"
          : `Coluna "${columnName}" ordenada`
      } em ordem ${newDirection === "desc" ? "decrescente" : "crescente"}`,
    });
  };

  // Aplicar ordenação aos dados se necessário
  const sortedDataWithIndices = (() => {
    if (sortConfig.column === null || !sortConfig.direction) {
      return safeData.data.map((row, originalIndex) => ({
        row,
        originalIndex,
      }));
    }

    if (sortConfig.column === "row-number") {
      // Ordenação por número da linha (índice original)
      const dataWithIndices = safeData.data.map((row, originalIndex) => ({
        row,
        originalIndex,
      }));
      return dataWithIndices.sort((a, b) => {
        return sortConfig.direction === "asc"
          ? a.originalIndex - b.originalIndex
          : b.originalIndex - a.originalIndex;
      });
    } else {
      // Ordenação por coluna de dados
      return sortDataWithIndices(
        safeData.data,
        sortConfig.column,
        sortConfig.direction
      );
    }
  })();

  // Ícone de ordenação para os cabeçalhos
  const getSortIcon = (columnIndex: number | "row-number") => {
    if (sortConfig.column !== columnIndex) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  };

  const generatePreviewRow = () => {
    // Find first non-excluded row for preview usando dados seguros
    const firstValidRow = safeData.data.find(
      (_, index) => !excludedRows.has(index)
    );
    if (!firstValidRow) return {};

    const previewData: Record<string, string | number> = {};

    mappings.forEach((mapping) => {
      if (mapping.type === "fixed") {
        previewData[mapping.sqlColumn] = mapping.fixedValue;
      } else if (mapping.type === "derived") {
        const sourceValue =
          firstValidRow[safeData.headers.indexOf(mapping.derivedFrom || "")];
        // Apply transformations if any
        previewData[mapping.sqlColumn] = sourceValue || "DERIVADO";
      } else {
        const csvIndex = safeData.headers.indexOf(mapping.csvColumn);
        previewData[mapping.sqlColumn] = firstValidRow[csvIndex] || "";
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
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileId}_config.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Configuração salva",
      description: "Arquivo JSON de configuração baixado com sucesso.",
    });
  };

  const validateData = () => {
    console.log("🔍 VALIDAÇÃO DETALHADA - Iniciando...");

    const validation = {
      safeData: safeData,
      originalData: { csvData, csvHeaders },
      mappings: mappings,
      excludedRows: Array.from(excludedRows),
      validRowCount: safeData.data.length - excludedRows.size,
      issues: [] as string[],
      warnings: [] as string[],
      summary: {} as Record<string, string | number>,
    };

    // Validar dados básicos
    if (!safeData.isValid) {
      validation.issues.push("Dados CSV inválidos");
      validation.issues.push(...safeData.errors);
    }

    // Validar mapeamentos
    const mappingIssues = mappings.filter((m) => {
      if (m.type === "direct" && !safeData.headers.includes(m.csvColumn)) {
        return true;
      }
      if (
        m.type === "derived" &&
        m.derivedFrom &&
        !safeData.headers.includes(m.derivedFrom)
      ) {
        return true;
      }
      return false;
    });

    if (mappingIssues.length > 0) {
      validation.issues.push(
        `${mappingIssues.length} mapeamentos com colunas inexistentes`
      );
    }

    // Validar transformações
    const transformationStats = mappings.reduce(
      (acc, mapping) => {
        if (
          mapping.transformations &&
          Object.keys(mapping.transformations).length > 0
        ) {
          acc.withTransformations++;
          acc.totalTransformations += Object.keys(
            mapping.transformations
          ).length;
        }
        return acc;
      },
      { withTransformations: 0, totalTransformations: 0 }
    );

    validation.summary = {
      totalRows: safeData.data.length,
      excludedRows: excludedRows.size,
      validRows: safeData.data.length - excludedRows.size,
      totalColumns: safeData.headers.length,
      mappedColumns: mappings.length,
      transformationsCount: transformationStats.totalTransformations,
      columnsWithTransformations: transformationStats.withTransformations,
    };

    // Warnings
    const validRows = safeData.data.length - excludedRows.size;
    if (validRows < 10) {
      validation.warnings.push("Poucas linhas válidas para processamento");
    }

    if (mappings.length < safeData.headers.length) {
      validation.warnings.push(
        `${safeData.headers.length - mappings.length} colunas sem mapeamento`
      );
    }

    console.log("🔍 VALIDAÇÃO COMPLETA:", validation);

    // Toast com resultado
    if (validation.issues.length === 0) {
      toast({
        title: "✅ Validação OK!",
        description: `${validation.summary.validRows} linhas válidas, ${validation.summary.mappedColumns} colunas mapeadas`,
      });
    } else {
      toast({
        title: "⚠️ Problemas encontrados",
        description: `${validation.issues.length} problemas, ${validation.warnings.length} avisos`,
        variant: "destructive",
      });
    }

    return validation;
  };

  // Função para carregar configuração
  const handleLoadConfig = (config: {
    transformations: Record<string, string>;
    removedColumns: string[];
    fileId: string;
    originalFileName: string;
    previewData: Record<string, unknown>[];
    columns: string[];
  }) => {
    setSelectedConfig({
      ...config,
      mappings: mappings // Adiciona os mappings atuais
    });
    toast({
      title: "Configuração Carregada",
      description: "A configuração foi carregada com sucesso para o Quick ETL.",
    });
  };

  const previewData = generatePreviewRow();
  const validRowCount = safeData.data.length - excludedRows.size;

  // Configuração atual para salvar
  const currentConfig = {
    transformations: mappings.reduce((acc, mapping) => {
      if (mapping.transformations) {
        Object.assign(acc, mapping.transformations);
      }
      return acc;
    }, {} as Record<string, string>),
    removedColumns: csvHeaders.filter(
      (header) => !mappings.some((mapping) => mapping.csvColumn === header)
    ),
    fileId,
    originalFileName: fileId,
    previewData: safeData.data.slice(0, 10).map((row) =>
      row.reduce((acc, value, index) => {
        acc[csvHeaders[index] || `column_${index}`] = value;
        return acc;
      }, {} as Record<string, unknown>)
    ),
    columns: csvHeaders,
  };

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

      {/* Alert para dados inválidos */}
      {!safeData.isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>⚠️ Problema com os dados:</strong>
            <ul className="list-disc list-inside mt-2">
              {safeData.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs para Preview/Validação e Quick ETL */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview" className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Preview & Validação
          </TabsTrigger>
          <TabsTrigger value="quick-etl" className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Quick ETL
          </TabsTrigger>
          <TabsTrigger value="configs" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="scripts" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Scripts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          {/* Data Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Dados do CSV</span>
                  <Badge variant="secondary">
                    {validRowCount} linhas válidas
                  </Badge>
                  {sortConfig.column !== null && (
                    <Badge variant="outline" className="text-xs">
                      Ordenado por: {safeData.headers[sortConfig.column]}
                      {sortConfig.direction === "desc" ? " ↓" : " ↑"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {sortConfig.column !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSortConfig({ column: null, direction: null })
                      }
                      className="text-xs"
                    >
                      Limpar ordenação
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Ocultar" : "Mostrar"} Preview
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 w-12">Excluir</th>
                      <th className="text-left p-2 w-12">
                        <button
                          onClick={() => handleSort("row-number")}
                          className="flex items-center space-x-1 hover:bg-muted/50 rounded px-1 py-0.5 w-full text-left"
                          title="Ordenar por número da linha"
                        >
                          <span>#</span>
                          {getSortIcon("row-number")}
                        </button>
                      </th>
                      {safeData.headers.slice(0, 6).map((header, idx) => (
                        <th key={idx} className="text-left p-2 min-w-24">
                          <button
                            onClick={() => handleSort(idx)}
                            className="flex items-center space-x-1 hover:bg-muted/50 rounded px-1 py-0.5 w-full text-left truncate"
                            title={`Ordenar por ${header}`}
                          >
                            <span className="truncate">{header}</span>
                            {getSortIcon(idx)}
                          </button>
                        </th>
                      ))}
                      {safeData.headers.length > 6 && (
                        <th className="text-left p-2">
                          +{safeData.headers.length - 6} mais...
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDataWithIndices
                      .slice(0, 20)
                      .map((item, displayIndex) => {
                        const { row, originalIndex } = item;
                        return (
                          <tr
                            key={`${originalIndex}-${displayIndex}`}
                            className={`border-t border-border ${
                              excludedRows.has(originalIndex)
                                ? "bg-destructive/5 text-muted-foreground"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            <td className="p-2">
                              <Checkbox
                                checked={excludedRows.has(originalIndex)}
                                onCheckedChange={() =>
                                  toggleRowExclusion(originalIndex)
                                }
                              />
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {originalIndex + 1}
                            </td>
                            {row
                              .slice(0, 6)
                              .map((cell: string, cellIdx: number) => (
                                <td
                                  key={cellIdx}
                                  className="p-2 max-w-32 truncate"
                                  title={cell}
                                >
                                  {cell}
                                </td>
                              ))}
                            {row.length > 6 && (
                              <td className="p-2 text-xs text-muted-foreground">
                                +{row.length - 6} cols
                              </td>
                            )}
                          </tr>
                        );
                      })}
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
                  • {excludedRows.size} linhas excluídas • {validRowCount}{" "}
                  linhas para processar
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
                      const mapping = mappings.find(
                        (m) => m.sqlColumn === column
                      );
                      const getTypeColor = () => {
                        switch (mapping?.type) {
                          case "derived":
                            return "text-accent border-accent/20 bg-accent/5";
                          case "fixed":
                            return "text-secondary border-secondary/20 bg-secondary/5";
                          default:
                            return "text-primary border-primary/20 bg-primary/5";
                        }
                      };

                      return (
                        <div
                          key={column}
                          className={`border rounded-lg p-3 ${getTypeColor()}`}
                        >
                          <div className="font-medium text-sm">{column}</div>
                          <div className="text-xs opacity-75 mt-1">
                            {mapping?.type === "fixed"
                              ? "Valor fixo"
                              : mapping?.type === "derived"
                              ? `Derivado de: ${mapping.derivedFrom}`
                              : `CSV: ${mapping?.csvColumn}`}
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
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={validateData}
                className="flex items-center space-x-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Validar</span>
              </Button>

              <Button
                variant="outline"
                onClick={downloadConfig}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Salvar Config</span>
              </Button>

              <Button
                onClick={handleNextClick}
                className="flex items-center space-x-2"
              >
                <span>Gerar Script ETL</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quick-etl" className="space-y-6">
          <QuickETL savedConfig={selectedConfig} />
        </TabsContent>

        <TabsContent value="configs" className="space-y-6">
          <ConfigManager
            currentConfig={currentConfig}
            onLoadConfig={handleLoadConfig}
          />
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <SavedScripts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ETLConfigStep3;
