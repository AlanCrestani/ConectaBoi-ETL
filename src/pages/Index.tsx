import { useState } from "react";
import Header from "@/components/Header";
import FileSelector from "@/components/FileSelector";
import ETLConfigStep1 from "@/components/ETLConfigStep1";
import ETLConfigStep2 from "@/components/ETLConfigStep2";
import ETLConfigStep3 from "@/components/ETLConfigStep3";
import ETLConfigStep4 from "@/components/ETLConfigStep4";
import { ConfigManager } from "@/components/ConfigManager";
import { ETLErrorBoundary } from "@/components/ETLErrorBoundary";
import {
  usePersistedState,
  clearPersistedETLState,
  hasPersistedETLState,
} from "@/hooks/usePersistedState";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Settings } from "lucide-react";

type Step = "select" | "config1" | "config2" | "config3" | "config4";

interface ColumnMapping {
  csvColumn: string;
  sqlColumn: string;
  type: "direct" | "derived" | "fixed";
  transformations?: Record<string, string>;
  fixedValue?: string;
  derivedFrom?: string;
  validateInDimCurral?: boolean;
}

const Index = () => {
  const [currentStep, setCurrentStep] = usePersistedState<Step>(
    "etl-current-step",
    "select"
  );
  const [selectedFile, setSelectedFile] = usePersistedState<string>(
    "etl-selected-file",
    ""
  );
  const [csvData, setCsvData] = usePersistedState<unknown[]>(
    "etl-csv-data",
    []
  );
  const [csvHeaders, setCsvHeaders] = usePersistedState<string[]>(
    "etl-csv-headers",
    []
  );
  const [sqlSchema, setSqlSchema] = usePersistedState<string>(
    "etl-sql-schema",
    ""
  );
  const [mappings, setMappings] = usePersistedState<ColumnMapping[]>(
    "etl-mappings",
    []
  );
  const [excludedRows, setExcludedRows] = usePersistedState<number[]>(
    "etl-excluded-rows",
    []
  );

  // Verificar se há estado persistido e mostrar alerta
  const [showRestoreAlert, setShowRestoreAlert] = useState(
    hasPersistedETLState()
  );

  // Estado para controlar a exibição do gerenciador de configurações
  const [showConfigManager, setShowConfigManager] = useState(false);

  const handleRestoreSession = () => {
    setShowRestoreAlert(false);
    console.log("📁 Sessão anterior restaurada:", {
      currentStep,
      selectedFile,
    });
  };

  const handleStartNew = () => {
    clearPersistedETLState();
    setCurrentStep("select");
    setSelectedFile("");
    setCsvData([]);
    setCsvHeaders([]);
    setSqlSchema("");
    setMappings([]);
    setExcludedRows([]);
    setShowRestoreAlert(false);
    console.log("🆕 Nova sessão iniciada");
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    setCurrentStep("config1");
  };

  const handleStep1Complete = (
    data: unknown[],
    headers: string[],
    schema: string
  ) => {
    setCsvData(data);
    setCsvHeaders(headers);
    setSqlSchema(schema);
    setCurrentStep("config2");
  };

  const handleStep2Complete = (columnMappings: ColumnMapping[]) => {
    console.log("handleStep2Complete called with:", columnMappings);
    console.log("Mappings length:", columnMappings?.length);
    console.log("Current step before:", currentStep);
    setMappings(columnMappings);
    setCurrentStep("config3");
    console.log("Step changed to config3");
  };

  const handleStep3Complete = (excludedRowIndices: number[]) => {
    console.log("handleStep3Complete called with:", excludedRowIndices);
    console.log("Current step before:", currentStep);
    setExcludedRows(excludedRowIndices);
    setCurrentStep("config4");
    console.log("Step changed to config4");
  };

  const handleComplete = () => {
    // Reset to file selection for new configuration
    setCurrentStep("select");
    setSelectedFile("");
    setCsvData([]);
    setCsvHeaders([]);
    setSqlSchema("");
    setMappings([]);
    setExcludedRows([]);
  };

  const handleBack = () => {
    switch (currentStep) {
      case "config1":
        setCurrentStep("select");
        break;
      case "config2":
        setCurrentStep("config1");
        break;
      case "config3":
        setCurrentStep("config2");
        break;
      case "config4":
        setCurrentStep("config3");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Alerta de restauração de sessão */}
      {showRestoreAlert && (
        <div className="container mx-auto px-6 pt-4">
          <Alert>
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  <strong>Sessão anterior encontrada!</strong> Você estava no{" "}
                  {currentStep === "config1"
                    ? "Step 1"
                    : currentStep === "config2"
                    ? "Step 2"
                    : currentStep === "config3"
                    ? "Step 3"
                    : "Step 4"}
                  {selectedFile && ` com arquivo "${selectedFile}"`}.
                </span>
                <div className="flex space-x-2 ml-4">
                  <Button size="sm" onClick={handleRestoreSession}>
                    Continuar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStartNew}>
                    Novo
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <ETLErrorBoundary>
        <main className="container mx-auto px-6 py-8">
          {currentStep === "select" && (
            <FileSelector onFileSelect={handleFileSelect} />
          )}

          {currentStep === "config1" && (
            <ETLConfigStep1
              fileId={selectedFile}
              onNext={handleStep1Complete}
            />
          )}

          {currentStep === "config2" && (
            <ETLConfigStep2
              fileId={selectedFile}
              csvHeaders={csvHeaders}
              sqlSchema={sqlSchema}
              csvData={csvData}
              onNext={handleStep2Complete}
              onBack={handleBack}
            />
          )}

          {currentStep === "config3" && (
            <ETLConfigStep3
              fileId={selectedFile}
              csvData={csvData}
              csvHeaders={csvHeaders}
              mappings={mappings}
              onNext={handleStep3Complete}
              onBack={handleBack}
            />
          )}

          {currentStep === "config4" && (
            <ETLConfigStep4
              fileId={selectedFile}
              csvData={csvData}
              csvHeaders={csvHeaders}
              mappings={mappings}
              excludedRows={excludedRows}
              sqlSchema={sqlSchema}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          )}
        </main>
      </ETLErrorBoundary>
    </div>
  );
};

export default Index;
