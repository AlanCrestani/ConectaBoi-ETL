// ETL Frontend - Modo Offline
// Este componente simula o backend quando não está disponível

interface OfflineFileInfo {
  file_id: string;
  original_filename: string;
  headers: string[];
  sample_data: string[][];
}

export const useOfflineMode = () => {
  const processFileOffline = (file: File): Promise<OfflineFileInfo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());

          if (lines.length === 0) {
            reject(new Error("Arquivo vazio"));
            return;
          }

          // Parse CSV simples
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().replace(/"/g, ""));
          const sample_data = lines
            .slice(1, 6)
            .map((line) =>
              line.split(",").map((cell) => cell.trim().replace(/"/g, ""))
            );

          const fileId = `offline_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          resolve({
            file_id: fileId,
            original_filename: file.name,
            headers,
            sample_data,
          });
        } catch (error) {
          reject(new Error("Erro ao processar arquivo CSV"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo"));
      };

      reader.readAsText(file, "utf-8");
    });
  };

  return { processFileOffline };
};
