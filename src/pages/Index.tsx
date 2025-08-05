import { useState } from "react";
import Header from "@/components/Header";
import FileSelector from "@/components/FileSelector";
import ETLConfigStep1 from "@/components/ETLConfigStep1";
import ETLConfigStep2 from "@/components/ETLConfigStep2";
import ETLConfigStep3 from "@/components/ETLConfigStep3";
import ETLConfigStep4 from "@/components/ETLConfigStep4";
import { ETLErrorBoundary } from "@/components/ETLErrorBoundary";

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
  const [currentStep, setCurrentStep] = useState<Step>("select");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [sqlSchema, setSqlSchema] = useState<string>("");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [excludedRows, setExcludedRows] = useState<number[]>([]);

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    setCurrentStep("config1");
  };

  const handleStep1Complete = (
    data: any[],
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
