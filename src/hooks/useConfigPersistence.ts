import { useState, useEffect } from 'react';

interface SavedConfig {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  config: {
    transformations: Record<string, string>;
    removedColumns: string[];
    fileId: string;
    originalFileName: string;
    previewData: Record<string, unknown>[];
    columns: string[];
  };
}

export const useConfigPersistence = () => {
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);

  // Carregar configurações salvas
  useEffect(() => {
    const saved = localStorage.getItem('etl_saved_configs');
    if (saved) {
      try {
        setSavedConfigs(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações salvas:', error);
      }
    }
  }, []);

  // Salvar nova configuração
  const saveConfig = (
    name: string,
    config: SavedConfig['config'],
    description?: string
  ): string => {
    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      config
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('etl_saved_configs', JSON.stringify(updatedConfigs));
    
    return newConfig.id;
  };

  // Carregar configuração específica
  const loadConfig = (id: string): SavedConfig | null => {
    return savedConfigs.find(config => config.id === id) || null;
  };

  // Deletar configuração
  const deleteConfig = (id: string) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('etl_saved_configs', JSON.stringify(updatedConfigs));
  };

  // Atualizar configuração existente
  const updateConfig = (id: string, updates: Partial<SavedConfig>) => {
    const updatedConfigs = savedConfigs.map(config =>
      config.id === id ? { ...config, ...updates } : config
    );
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('etl_saved_configs', JSON.stringify(updatedConfigs));
  };

  return {
    savedConfigs,
    saveConfig,
    loadConfig,
    deleteConfig,
    updateConfig
  };
};
