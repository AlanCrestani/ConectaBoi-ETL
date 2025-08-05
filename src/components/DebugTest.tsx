import React from "react";
import { Button } from "@/components/ui/button";

interface DebugTestProps {
  onTestStep3: () => void;
}

const DebugTest = ({ onTestStep3 }: DebugTestProps) => {
  const testData = {
    fileId: "test_file",
    csvData: [
      ["header1", "header2", "header3"],
      ["value1", "value2", "value3"],
      ["value4", "value5", "value6"],
    ],
    csvHeaders: ["header1", "header2", "header3"],
    mappings: [
      {
        csvColumn: "header1",
        sqlColumn: "col1",
        type: "direct" as const,
      },
      {
        csvColumn: "header2",
        sqlColumn: "col2",
        type: "direct" as const,
      },
    ],
  };

  const handleTest = () => {
    console.log("🧪 Testing Step 3 navigation with data:", testData);
    onTestStep3();
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Debug Test - Step 3 Navigation
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Este componente testa a navegação para o Step 3 com dados simulados.
      </p>
      <Button onClick={handleTest}>Testar Navegação para Step 3</Button>
    </div>
  );
};

export default DebugTest;
