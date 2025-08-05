#!/usr/bin/env python3
"""
ETL Script para 03_desvio_distribuicao
Gerado automaticamente pelo ConectaBoi ETL
"""

import pandas as pd
import json
import logging
from datetime import datetime
from supabase import create_client, Client
import os

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuração Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_config():
    """Carrega configuração do arquivo JSON"""
    with open('config/03_desvio_distribuicao_config.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_curral(df):
    """Valida se currais existem na dim_curral"""
    try:
        # Busca todos os currais válidos
        response = supabase.table('dim_curral').select('id, nome').execute()
        valid_currals = {row['nome']: row['id'] for row in response.data}
        
        # Valida e mapeia currais
        df['id_curral_mapped'] = df['id_curral'].map(valid_currals)
        
        # Log currais não encontrados
        invalid_currals = df[df['id_curral_mapped'].isna()]['id_curral'].unique()
        if len(invalid_currals) > 0:
            logger.warning(f"Currais não encontrados em dim_curral: {list(invalid_currals)}")
            
        return df.dropna(subset=['id_curral_mapped'])
        
    except Exception as e:
        logger.error(f"Erro na validação de currais: {e}")
        return df

def transform_data(df, config):
    """Aplica transformações nos dados"""
    logger.info("Iniciando transformação dos dados...")
    
    # Aplicar mapeamentos
    result_df = pd.DataFrame()
    
    for mapping in config['mappings']:
        col_name = mapping['sqlColumn']
        
        if mapping['type'] == 'fixed':
            result_df[col_name] = mapping['fixedValue']
            
        elif mapping['type'] == 'direct':
            if mapping['csvColumn'] in df.columns:
                result_df[col_name] = df[mapping['csvColumn']]
            else:
                logger.warning(f"Coluna {mapping['csvColumn']} não encontrada no CSV")
                
        elif mapping['type'] == 'derived':
            if mapping.get('derivedFrom') in df.columns:
                source_col = df[mapping['derivedFrom']]
                
                # Aplicar transformações se existirem
                if mapping.get('transformations'):
                    result_df[col_name] = source_col.map(mapping['transformations']).fillna(source_col)
                else:
                    result_df[col_name] = source_col
    
    # Validar currais se necessário
    if 'id_curral' in result_df.columns:
        curral_mapping = next((m for m in config['mappings'] if m['sqlColumn'] == 'id_curral'), None)
        if curral_mapping and curral_mapping.get('validateInDimCurral'):
            result_df = validate_curral(result_df)
    
    logger.info(f"Dados transformados: {len(result_df)} linhas")
    return result_df

def load_to_staging(df):
    """Carrega dados para tabela staging"""
    try:
        # Converter DataFrame para lista de dicionários
        records = df.to_dict('records')
        
        # Inserir no Supabase
        response = supabase.table('etl_staging_03_desvio_distribuicao').insert(records).execute()
        
        if response.data:
            logger.info(f"Dados carregados com sucesso: {len(response.data)} registros")
            return True
        else:
            logger.error("Erro ao carregar dados")
            return False
            
    except Exception as e:
        logger.error(f"Erro no carregamento: {e}")
        return False

def main():
    """Função principal do ETL"""
    try:
        logger.info("Iniciando ETL para 03_desvio_distribuicao")
        
        # Carregar configuração
        config = load_config()
        
        # Carregar CSV
        df = pd.read_csv('C:/conectaboi_csv/03_desvio_distribuicao.csv')
        logger.info(f"CSV carregado: {len(df)} linhas")
        
        # Remover linhas excluídas
        excluded_rows = config.get('excludedRows', [])
        df = df.drop(excluded_rows).reset_index(drop=True)
        logger.info(f"Linhas após exclusão: {len(df)}")
        
        # Transformar dados
        transformed_df = transform_data(df, config)
        
        # Carregar para staging
        success = load_to_staging(transformed_df)
        
        if success:
            logger.info("ETL concluído com sucesso!")
            
            # Mover arquivo para pasta processed
            import shutil
            shutil.move(f'C:/conectaboi_csv/03_desvio_distribuicao.csv', f'C:/conectaboi_csv/processed/03_desvio_distribuicao_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
            
        else:
            logger.error("ETL falhou!")
            return False
            
    except Exception as e:
        logger.error(f"Erro geral no ETL: {e}")
        return False

if __name__ == "__main__":
    main()
