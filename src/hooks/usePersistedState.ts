import { useState, useEffect } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Inicializar estado com valor do localStorage ou valor padrão
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Erro ao carregar estado persistido para '${key}':`, error);
      return defaultValue;
    }
  });

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      console.log(`💾 Estado '${key}' salvo no localStorage:`, state);
    } catch (error) {
      console.warn(`Erro ao salvar estado persistido para '${key}':`, error);
    }
  }, [key, state]);

  return [state, setState];
}

// Função para limpar todos os estados persistidos do ETL
export function clearPersistedETLState() {
  const keysToRemove = [
    "etl-current-step",
    "etl-selected-file",
    "etl-csv-data",
    "etl-csv-headers",
    "etl-sql-schema",
    "etl-mappings",
    "etl-excluded-rows",
  ];

  keysToRemove.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
      console.log(`🗑️ Estado '${key}' removido do localStorage`);
    } catch (error) {
      console.warn(`Erro ao remover estado '${key}':`, error);
    }
  });

  console.log("🔄 Todos os estados ETL foram limpos do localStorage");
}

// Função para verificar se há estado persistido
export function hasPersistedETLState(): boolean {
  try {
    const currentStep = window.localStorage.getItem("etl-current-step");
    const selectedFile = window.localStorage.getItem("etl-selected-file");
    return !!(currentStep && selectedFile && currentStep !== '"select"');
  } catch (error) {
    return false;
  }
}
