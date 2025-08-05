import { useMemo } from "react";

export interface SafeCSVData {
  headers: string[];
  data: string[][];
  isValid: boolean;
  errors: string[];
}

export function useSafeCSVData(
  csvHeaders: unknown,
  csvData: unknown
): SafeCSVData {
  return useMemo(() => {
    const errors: string[] = [];

    // Validar headers
    let safeHeaders: string[] = [];
    if (Array.isArray(csvHeaders)) {
      safeHeaders = csvHeaders.filter((h) => typeof h === "string");
    } else if (csvHeaders) {
      errors.push("Headers não estão em formato de array");
      safeHeaders = [];
    } else {
      errors.push("Headers não fornecidos");
      safeHeaders = [];
    }

    // Validar data
    let safeData: string[][] = [];
    if (Array.isArray(csvData)) {
      safeData = csvData
        .filter((row) => row !== null && row !== undefined)
        .map((row) => {
          if (Array.isArray(row)) {
            return row.map((cell) =>
              cell === null || cell === undefined ? "" : String(cell)
            );
          } else {
            // Se row não é array, tenta converter em array
            if (typeof row === "object" && row !== null) {
              return Object.values(row).map((cell) =>
                cell === null || cell === undefined ? "" : String(cell)
              );
            } else {
              return [String(row)];
            }
          }
        });
    } else if (csvData) {
      errors.push("Dados não estão em formato de array");
      safeData = [];
    } else {
      errors.push("Dados não fornecidos");
      safeData = [];
    }

    // Verificar consistência entre headers e data
    if (safeHeaders.length > 0 && safeData.length > 0) {
      const expectedColumns = safeHeaders.length;
      const inconsistentRows = safeData.filter(
        (row) => row.length !== expectedColumns
      );

      if (inconsistentRows.length > 0) {
        errors.push(
          `${inconsistentRows.length} linhas têm número de colunas diferente dos headers`
        );

        // Normalizar todas as linhas para ter o mesmo número de colunas
        safeData = safeData.map((row) => {
          if (row.length < expectedColumns) {
            // Adicionar células vazias se a linha for muito curta
            return [...row, ...Array(expectedColumns - row.length).fill("")];
          } else if (row.length > expectedColumns) {
            // Truncar se a linha for muito longa
            return row.slice(0, expectedColumns);
          }
          return row;
        });
      }
    }

    const isValid =
      errors.length === 0 && safeHeaders.length > 0 && safeData.length > 0;

    console.log("🛡️ SafeCSVData validation:", {
      originalHeaders: csvHeaders,
      originalData: csvData,
      safeHeaders,
      safeDataLength: safeData.length,
      isValid,
      errors,
    });

    return {
      headers: safeHeaders,
      data: safeData,
      isValid,
      errors,
    };
  }, [csvHeaders, csvData]);
}
