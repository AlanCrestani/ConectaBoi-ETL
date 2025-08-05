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

interface ETLConfigStep1Props {
  fileId: string;
  onNext: (csvData: any[], headers: string[], sqlSchema: string) => void;
}

const ETLConfigStep1 = ({ fileId, onNext }: ETLConfigStep1Props) => {
  // CSV related state
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [skipFirstLine, setSkipFirstLine] = useState(false);

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

    // Gerar schema básico baseado no nome da tabela
    const schemaTemplates: Record<string, string> = {
      etl_staging_01_historico_consumo: `CREATE TABLE etl_staging_01_historico_consumo (
  id BIGSERIAL PRIMARY KEY,
  id_curral TEXT NOT NULL,
  lote TEXT,
  data DATE NOT NULL,
  qtd_animais INTEGER,
  dias_confinamento INTEGER,
  data_entrada DATE,
  leitura_cocho TEXT,
  ajuste_kg NUMERIC,
  leitura_noturna TEXT,
  sexo TEXT,
  grupo_genetico TEXT,
  peso_entrada_kg NUMERIC,
  peso_medio_estimado_kg NUMERIC,
  cms_previsto_kg NUMERIC,
  cms_realizado_kg NUMERIC,
  cmn_previsto_kg NUMERIC,
  cmn_realizado_kg NUMERIC,
  ms_dieta_meta_pc NUMERIC,
  ms_dieta_real_pc NUMERIC,
  cms_real_pc_pv NUMERIC,
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);`,
      etl_staging_02_desvio_carregamento: `CREATE TABLE etl_staging_02_desvio_carregamento (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  hora_carregamento TIME,
  carregamento TEXT,
  pazeiro TEXT,
  vagao TEXT,
  dieta TEXT,
  ingrediente TEXT,
  tipo_ingrediente TEXT,
  previsto_kg NUMERIC,
  realizado_kg NUMERIC,
  desvio_kg NUMERIC,
  desvio_pc NUMERIC,
  status TEXT,
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);`,
    };

    const schema =
      schemaTemplates[tableName] ||
      `CREATE TABLE ${tableName} (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL,
  batch_id UUID DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
  -- Adicione mais colunas conforme necessário
);`;

    setSqlSchema(schema);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo CSV está vazio ou não possui dados válidos.",
          variant: "destructive",
        });
        return;
      }

      // Parse CSV (simple implementation)
      const parsedData = lines.map((line) => {
        // Simple CSV parsing - in production, use a proper CSV parser
        return line
          .split(",")
          .map((cell) => cell.trim().replace(/^"(.*)"$/, "$1"));
      });

      // Aplicar lógica de skip da primeira linha se ativada
      let processedData = parsedData;
      if (skipFirstLine && parsedData.length > 1) {
        processedData = parsedData.slice(1); // Remove primeira linha
        toast({
          title: "Primeira linha excluída",
          description:
            "A primeira linha foi removida e a segunda linha agora é o cabeçalho.",
        });
      }

      const csvHeaders = processedData[0];
      const csvRows = processedData
        .slice(1)
        .filter((row) => row.join("").length > 30); // Filter short rows

      setHeaders(csvHeaders);
      setCsvData(csvRows);
      setCsvUploaded(true);

      // Auto-detectar e sugerir schema baseado no fileId
      autoDetectSchema();

      toast({
        title: "Arquivo carregado",
        description: `CSV carregado com ${csvRows.length} linhas e ${csvHeaders.length} colunas.`,
      });
    };

    reader.readAsText(file);
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

  const handleNext = () => {
    if (!csvUploaded || !sqlSchema.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, carregue o CSV e adicione o schema SQL.",
        variant: "destructive",
      });
      return;
    }

    onNext(csvData, headers, sqlSchema);
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
          disabled={!csvUploaded || !sqlSchema.trim()}
          className="flex items-center space-x-2"
        >
          <span>Próximo: Mapeamento</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ETLConfigStep1;
