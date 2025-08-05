// Teste para debug do QuickETL
console.log("=== TESTE QUICK ETL DEBUG ===");

// Simular uma configuração como a que seria passada para o QuickETL
const mockSavedConfig = {
  transformations: {
    MACHO: "M",
    FEMEA: "F",
  },
  removedColumns: ["coluna_removida"],
  fileId: "03_desvio_distribuicao",
  originalFileName: "03_desvio_distribuicao.csv",
  previewData: [],
  columns: ["data", "hora", "trato", "tratador", "vagao"],
  mappings: [
    {
      csvColumn: "data",
      sqlColumn: "data",
      type: "direct",
    },
    {
      csvColumn: "hora",
      sqlColumn: "hora",
      type: "direct",
    },
    {
      csvColumn: "trato",
      sqlColumn: "trato",
      type: "direct",
    },
  ],
};

console.log("📋 Mock Config:", JSON.stringify(mockSavedConfig, null, 2));

// Simular o que seria enviado para /etl/process-quick
const mockETLRequest = {
  file_id: "03_desvio_distribuicao.csv",
  transformations: mockSavedConfig.transformations || {},
  excluded_columns: mockSavedConfig.removedColumns || [],
  excluded_rows: [],
  mappings: mockSavedConfig.mappings || [],
  skip_first_line: false,
};

console.log(
  "🚀 Request que seria enviado:",
  JSON.stringify(mockETLRequest, null, 2)
);

// Verificar se mappings está vazio
console.log("❓ Mappings length:", mockETLRequest.mappings?.length || 0);
console.log(
  "❓ Tem mappings?",
  mockETLRequest.mappings && mockETLRequest.mappings.length > 0
);

if (!mockETLRequest.mappings || mockETLRequest.mappings.length === 0) {
  console.log("❌ PROBLEMA: Mappings vazio - vai usar fallback simples!");
} else {
  console.log("✅ Mappings OK - vai usar lógica completa!");
}
