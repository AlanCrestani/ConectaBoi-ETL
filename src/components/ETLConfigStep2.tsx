import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ColumnMapping {
  csvColumn: string;
  sqlColumn: string;
  type: "direct" | "derived" | "fixed";
  transformations?: Record<string, string>;
  fixedValue?: string;
  derivedFrom?: string;
  validateInDimCurral?: boolean;
}

interface ETLConfigStep2Props {
  fileId: string;
  csvHeaders: string[];
  sqlSchema: string;
  csvData: any[];
  onNext: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

const ETLConfigStep2 = ({
  fileId,
  csvHeaders,
  sqlSchema,
  csvData,
  onNext,
  onBack,
}: ETLConfigStep2Props) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [sqlColumns, setSqlColumns] = useState<string[]>([]);
  const [transformationTexts, setTransformationTexts] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    // Extract SQL columns from CREATE TABLE statement
    const extractColumns = (schema: string) => {
      const lines = schema.split("\n");
      const columns: string[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          trimmed &&
          !trimmed.startsWith("CREATE") &&
          !trimmed.startsWith("(") &&
          !trimmed.startsWith(")") &&
          !trimmed.startsWith("--")
        ) {
          const columnMatch = trimmed.match(/^(\w+)/);
          if (
            columnMatch &&
            !["id", "batch_id", "uploaded_at", "processed"].includes(
              columnMatch[1]
            )
          ) {
            columns.push(columnMatch[1]);
          }
        }
      });

      return columns;
    };

    const extractedColumns = extractColumns(sqlSchema);
    setSqlColumns(extractedColumns);

    // Initialize mappings
    const initialMappings: ColumnMapping[] = extractedColumns.map((col) => ({
      csvColumn: "",
      sqlColumn: col,
      type: "direct",
    }));
    setMappings(initialMappings);

    // Initialize transformation texts
    const initialTexts: Record<number, string> = {};
    extractedColumns.forEach((_, index) => {
      initialTexts[index] = "";
    });
    setTransformationTexts(initialTexts);
  }, [sqlSchema]);

  const updateMapping = (
    index: number,
    field: keyof ColumnMapping,
    value: any
  ) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
  };

  const addTransformation = (index: number, from: string, to: string) => {
    const newMappings = [...mappings];
    const mapping = newMappings[index];
    if (!mapping.transformations) mapping.transformations = {};
    mapping.transformations[from] = to;
    setMappings(newMappings);
  };

  const removeTransformation = (index: number, key: string) => {
    const newMappings = [...mappings];
    if (newMappings[index].transformations) {
      delete newMappings[index].transformations[key];
    }
    setMappings(newMappings);
  };

  const addDerivedMapping = () => {
    setMappings([
      ...mappings,
      {
        csvColumn: "",
        sqlColumn: "",
        type: "derived",
      },
    ]);
  };

  const addFixedMapping = () => {
    setMappings([
      ...mappings,
      {
        csvColumn: "",
        sqlColumn: "",
        type: "fixed",
        fixedValue: "",
      },
    ]);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "direct":
        return "bg-primary text-primary-foreground";
      case "derived":
        return "bg-accent text-accent-foreground";
      case "fixed":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isValid = () => {
    return mappings.every((mapping) => {
      if (mapping.type === "fixed") {
        return mapping.sqlColumn && mapping.fixedValue;
      }
      return mapping.csvColumn && mapping.sqlColumn;
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Mapeamento de Colunas
        </h2>
        <p className="text-muted-foreground">
          Configure como as colunas do CSV serão mapeadas para a tabela staging
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Configuração de Mapeamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mappings.map((mapping, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(mapping.type)}>
                  {mapping.type === "direct" && "Direto"}
                  {mapping.type === "derived" && "Derivado"}
                  {mapping.type === "fixed" && "Fixo"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMapping(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* SQL Column */}
                <div>
                  <Label>Coluna SQL</Label>
                  {mapping.type === "fixed" || mapping.type === "derived" ? (
                    <Input
                      value={mapping.sqlColumn}
                      onChange={(e) =>
                        updateMapping(index, "sqlColumn", e.target.value)
                      }
                      placeholder="nome_da_coluna"
                    />
                  ) : (
                    <Select
                      value={mapping.sqlColumn}
                      onValueChange={(value) =>
                        updateMapping(index, "sqlColumn", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione coluna SQL" />
                      </SelectTrigger>
                      <SelectContent>
                        {sqlColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* CSV Column / Source */}
                <div>
                  <Label>
                    {mapping.type === "fixed"
                      ? "Valor Fixo"
                      : mapping.type === "derived"
                      ? "Derivado de"
                      : "Coluna CSV"}
                  </Label>
                  {mapping.type === "fixed" ? (
                    <Input
                      value={mapping.fixedValue || ""}
                      onChange={(e) =>
                        updateMapping(index, "fixedValue", e.target.value)
                      }
                      placeholder="GOIÁS"
                    />
                  ) : (
                    <Select
                      value={
                        mapping.type === "derived"
                          ? mapping.derivedFrom
                          : mapping.csvColumn
                      }
                      onValueChange={(value) =>
                        updateMapping(
                          index,
                          mapping.type === "derived"
                            ? "derivedFrom"
                            : "csvColumn",
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione coluna CSV" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Type Selector */}
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={mapping.type}
                    onValueChange={(value: "direct" | "derived" | "fixed") =>
                      updateMapping(index, "type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direto</SelectItem>
                      <SelectItem value="derived">Derivado</SelectItem>
                      <SelectItem value="fixed">Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transformations for derived type */}
              {mapping.type === "derived" && (
                <div className="space-y-2">
                  <Label>
                    Transformações (formato: valor_original {"->"}{" "}
                    valor_transformado)
                  </Label>
                  <Textarea
                    placeholder={`Exemplos:
ENF01 -> 76
ENF02 -> 77
MACHO -> M
FEMEA -> F
SIM -> 1
NAO -> 0`}
                    value={transformationTexts[index] || ""}
                    onChange={(e) => {
                      const text = e.target.value;

                      // Atualizar texto imediatamente para permitir digitação livre
                      setTransformationTexts((prev) => ({
                        ...prev,
                        [index]: text,
                      }));

                      // Parse formato "valor -> transformação"
                      const transformations: Record<string, string> = {};
                      const lines = text
                        .split("\n")
                        .filter((line) => line.trim());
                      lines.forEach((line) => {
                        const match = line.trim().match(/^(.+?)\s*->\s*(.+)$/);
                        if (match) {
                          const [, from, to] = match;
                          transformations[from.trim()] = to.trim();
                        }
                      });

                      updateMapping(index, "transformations", transformations);
                    }}
                    className="min-h-[100px] font-mono text-sm"
                  />

                  {/* Preview das transformações */}
                  {mapping.transformations &&
                    Object.keys(mapping.transformations).length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        <strong>Preview:</strong>{" "}
                        {Object.keys(mapping.transformations).length}{" "}
                        transformação(ões) configurada(s)
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(mapping.transformations)
                            .slice(0, 3)
                            .map(([from, to]) => (
                              <Badge
                                key={from}
                                variant="secondary"
                                className="text-xs"
                              >
                                {from} → {to}
                              </Badge>
                            ))}
                          {Object.keys(mapping.transformations).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.keys(mapping.transformations).length - 3}{" "}
                              mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Validation options */}
              {mapping.sqlColumn === "id_curral" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mapping.validateInDimCurral || false}
                    onChange={(e) =>
                      updateMapping(
                        index,
                        "validateInDimCurral",
                        e.target.checked
                      )
                    }
                    className="rounded"
                  />
                  <Label className="text-sm">Validar em dim_curral</Label>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addDerivedMapping}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Coluna Derivada</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={addFixedMapping}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Valor Fixo</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>

        <Button
          onClick={() => onNext(mappings)}
          disabled={!isValid()}
          className="flex items-center space-x-2"
        >
          <span>Próximo: Preview</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ETLConfigStep2;
