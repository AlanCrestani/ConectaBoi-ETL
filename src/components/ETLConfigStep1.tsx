import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, ArrowRight, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ETLConfigStep1Props {
  fileId: string;
  onNext: (
    csvData: unknown[],
    headers: string[],
    sqlSchema: string,
    additionalData?: Record<string, unknown>
  ) => void;
}

const ETLConfigStep1 = ({ fileId, onNext }: ETLConfigStep1Props) => {
  // CSV related state
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [skipFirstLine, setSkipFirstLine] = useState(false);

  // Upload state
  const [fileInfo, setFileInfo] = useState<{
    file_id: string;
    original_filename: string;
    structure_info: Record<string, unknown>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Schema related state
  const [sqlSchema, setSqlSchema] = useState("");
  const [schemaMode, setSchemaMode] = useState<"manual" | "select">("manual");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [supabaseTables, setSupabaseTables] = useState<string[]>([]);

  // Refs and hooks
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar tabelas ETL conhecidas diretamente
    setSupabaseTables([
      "etl_staging_01_historico_consumo",
      "etl_staging_02_desvio_carregamento",
      "etl_staging_03_desvio_distribuicao",
      "etl_staging_04_itens_trato",
      "etl_staging_05_trato_curral",
    ]);
  }, []);

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);

    try {
      toast({
        title: "Buscando schema...",
        description: `Consultando estrutura real da tabela ${tableName} no Supabase`,
      });

      // ✨ BUSCAR SCHEMA REAL DO SUPABASE - Não usar predefinidos!
      const response = await fetch(
        `http://localhost:8000/etl/table-schema/${tableName}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao buscar schema da tabela`);
      }

      const result = await response.json();

      if (result.status === "success" && result.schema) {
        // Usar o CREATE TABLE SQL real do Supabase
        const realSchema =
          result.schema.create_table_sql ||
          `-- Schema obtido via API do Supabase
-- Tabela: ${result.schema.table_name}
-- Colunas: ${result.schema.column_count}
-- Fonte: ${result.schema.source}

CREATE TABLE ${result.schema.table_name} (
${result.schema.columns
  .map(
    (col) =>
      `  ${col.column_name} ${col.data_type.toUpperCase()}${
        col.is_nullable === "NO" ? " NOT NULL" : ""
      }`
  )
  .join(",\n")}
);`;

        setSqlSchema(realSchema);

        toast({
          title: "✅ Schema obtido!",
          description: `Schema real da tabela ${tableName} carregado com ${result.schema.column_count} colunas (fonte: ${result.schema.source})`,
        });

        console.log("🔍 Schema real obtido:", {
          table: result.schema.table_name,
          columns: result.schema.column_count,
          source: result.schema.source,
          schema: realSchema,
        });
      } else {
        throw new Error(result.error || "Schema não encontrado na resposta");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar schema real:", error);

      toast({
        title: "❌ Erro ao buscar schema",
        description: `Não foi possível obter o schema real da tabela ${tableName}. Erro: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
        variant: "destructive",
      });

      // Schema de fallback apenas em caso de erro real
      const fallbackSchema = `-- FALLBACK: Erro ao buscar schema real do Supabase
-- PROBLEMA: ${error instanceof Error ? error.message : "Erro desconhecido"}
-- TABELA: ${tableName}

CREATE TABLE ${tableName} (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  -- ⚠️ ADICIONE AS COLUNAS CORRETAS MANUALMENTE
  -- Este é apenas um fallback devido ao erro acima
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);`;

      setSqlSchema(fallbackSchema);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Erro no arquivo",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/upload-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro no upload do arquivo");
      }

      const result = await response.json();

      // Armazenar informações do arquivo
      setFileInfo({
        file_id: result.file_id,
        original_filename: result.original_filename,
        structure_info: result.structure_info,
      });

      // Atualizar dados básicos para exibição
      if (result.structure_info && result.structure_info.headers) {
        setHeaders(result.structure_info.headers);
        setCsvData(result.structure_info.sample_data || []);
      }

      // Atualizar estado para mostrar que arquivo foi carregado
      setCsvUploaded(true);

      toast({
        title: "Arquivo enviado com sucesso!",
        description: `${file.name} foi carregado e está pronto para processamento.`,
      });

      // Auto-detectar e sugerir schema baseado no fileId
      autoDetectSchema();
    } catch (error) {
      console.error("Erro no upload:", error);

      // Verificar se é erro de conectividade
      const isConnectionError =
        error instanceof TypeError && error.message.includes("fetch");

      if (isConnectionError) {
        toast({
          title: "Erro de Conexão",
          description:
            "Não foi possível conectar ao servidor backend. Verifique se o backend está rodando em http://localhost:8000",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no upload",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const autoDetectSchema = () => {
    // Se schema mode é 'select' e ainda não tem tabela selecionada, auto-sugerir
    if (schemaMode === "select" && !selectedTable) {
      const suggestedTable = `etl_staging_${fileId}`;
      if (supabaseTables.includes(suggestedTable)) {
        handleTableSelect(suggestedTable);
        toast({
          title: "Schema detectado",
          description: `Schema sugerido automaticamente: ${suggestedTable}`,
        });
      }
    }
  };

  const handleNext = async () => {
    if (!fileInfo?.file_id) {
      toast({
        title: "Nenhum arquivo enviado",
        description: "Por favor, faça upload de um arquivo CSV primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!sqlSchema.trim()) {
      toast({
        title: "Schema não definido",
        description: "Por favor, defina o schema SQL da tabela.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      toast({
        title: "Processando...",
        description: "Preparando arquivo para mapeamento. Aguarde...",
      });

      // Processar arquivo na Etapa 1
      const response = await fetch("http://localhost:8000/process-step1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileInfo.file_id,
          skip_first_line: skipFirstLine,
          selected_table: selectedTable || null,
          schema_sql: sqlSchema,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro no processamento");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Processamento completo!",
          description:
            "Arquivo preparado com UTF-8, schema obtido e mapeamento gerado automaticamente.",
        });

        // Passar dados processados para próxima etapa
        onNext(
          result.processed_data.csv_data.sample_rows || [],
          result.processed_data.csv_data.headers || [],
          sqlSchema,
          {
            preprocessingResult: result.processed_data,
            tableSchema: result.processed_data.table_schema,
            autoMapping: result.processed_data.auto_mapping,
            csvStructure: result.processed_data.csv_data,
            fileInfo: fileInfo,
          }
        );
      } else {
        throw new Error(result.error || "Erro no processamento");
      }
    } catch (error) {
      console.error("Erro no processamento:", error);

      // Verificar se é erro de conectividade
      const isConnectionError =
        error instanceof TypeError && error.message.includes("fetch");

      if (isConnectionError) {
        toast({
          title: "Erro de Conexão",
          description:
            "Não foi possível conectar ao servidor backend. Verifique se o backend está rodando em http://localhost:8000",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no processamento",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFileDisplayName = (fileId: string) => {
    const names: Record<string, string> = {
      "01_historico_consumo": "01 - Histórico de Consumo",
      "02_desvio_carregamento": "02 - Desvio de Carregamento",
      "03_desvio_distribuicao": "03 - Desvio de Distribuição",
      "04_itens_trato": "04 - Itens do Trato",
      "05_trato_curral": "05 - Trato por Curral",
    };
    return names[fileId] || fileId;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Configuração Inicial - {getFileDisplayName(fileId)}
        </h2>
        <p className="text-muted-foreground">
          Carregue o arquivo CSV e defina o schema da tabela staging
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>1. Upload do CSV</span>
              {csvUploaded && (
                <Check className="h-5 w-5 text-success ml-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Clique para selecionar o arquivo CSV
              </p>
              <p className="text-xs text-muted-foreground">
                Formato: {fileId}.csv
              </p>
            </div>

            {/* Opção para excluir primeira linha */}
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="skip-first-line"
                checked={skipFirstLine}
                onCheckedChange={(checked) =>
                  setSkipFirstLine(checked as boolean)
                }
              />
              <label
                htmlFor="skip-first-line"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Excluir primeira linha e usar a segunda como cabeçalho
              </label>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {csvUploaded && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm text-success-foreground">
                  ✓ Arquivo carregado: {csvData.length} linhas, {headers.length}{" "}
                  colunas
                </p>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Colunas encontradas:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {headers.slice(0, 5).map((header, idx) => (
                      <span
                        key={idx}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                      >
                        {header}
                      </span>
                    ))}
                    {headers.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{headers.length - 5} mais...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SQL Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>2. Schema SQL</span>
              {sqlSchema && <Check className="h-5 w-5 text-success ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={schemaMode === "manual" ? "default" : "outline"}
                onClick={() => setSchemaMode("manual")}
                className="text-sm"
              >
                Colar CREATE TABLE
              </Button>
              <Button
                variant={schemaMode === "select" ? "default" : "outline"}
                onClick={() => setSchemaMode("select")}
                className="text-sm"
              >
                Selecionar Tabela
              </Button>
            </div>

            {schemaMode === "manual" ? (
              <Textarea
                placeholder={`Cole aqui o CREATE TABLE da tabela staging:

CREATE TABLE etl_staging_${fileId} (
  id SERIAL PRIMARY KEY,
  curral VARCHAR(50),
  data DATE,
  -- adicione demais colunas...
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);`}
                value={sqlSchema}
                onChange={(e) => setSqlSchema(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            ) : (
              <div className="space-y-3">
                <Select value={selectedTable} onValueChange={handleTableSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma tabela do Supabase" />
                  </SelectTrigger>
                  <SelectContent>
                    {supabaseTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTable && (
                  <div className="bg-secondary/50 border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Schema da tabela {selectedTable}:
                    </p>
                    <pre className="text-xs font-mono bg-background p-3 rounded border overflow-auto max-h-[200px]">
                      {sqlSchema}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {sqlSchema && (
              <div className="mt-2 bg-info/10 border border-info/20 rounded-lg p-3">
                <p className="text-xs text-info-foreground">
                  ✓ Schema SQL definido - pronto para mapping
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!fileInfo?.file_id || !sqlSchema.trim() || isLoading}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <span>Processando...</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            <>
              <span>Próximo: Mapeamento</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ETLConfigStep1;
