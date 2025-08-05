"""
Utilitários gerais para o projeto ConectaBoi ETL
"""

import logging
import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional
import re

def setup_logging(log_file: str = None, log_level: str = "INFO"):
    """
    Configura o sistema de logging para a aplicação
    
    Args:
        log_file: Caminho para o arquivo de log
        log_level: Nível de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    log_level = getattr(logging, log_level.upper())
    
    # Formato das mensagens de log
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Logger raiz
    logger = logging.getLogger()
    logger.setLevel(log_level)
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Handler para arquivo (se especificado)
    if log_file:
        # Cria diretório se não existir
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Valida se a extensão do arquivo é permitida
    
    Args:
        filename: Nome do arquivo
        allowed_extensions: Lista de extensões permitidas
        
    Returns:
        True se a extensão é válida, False caso contrário
    """
    if not filename:
        return False
    
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in [ext.lower() for ext in allowed_extensions]

def sanitize_filename(filename: str) -> str:
    """
    Sanitiza o nome do arquivo removendo caracteres inválidos
    
    Args:
        filename: Nome original do arquivo
        
    Returns:
        Nome do arquivo sanitizado
    """
    # Remove caracteres especiais e espaços
    sanitized = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Remove underscores múltiplos
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Adiciona timestamp para unicidade
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name, ext = os.path.splitext(sanitized)
    
    return f"{name}_{timestamp}{ext}"

def validate_csv_structure(df: pd.DataFrame, required_columns: List[str]) -> Dict[str, Any]:
    """
    Valida a estrutura de um DataFrame CSV
    
    Args:
        df: DataFrame a ser validado
        required_columns: Lista de colunas obrigatórias
        
    Returns:
        Dicionário com resultado da validação
    """
    result = {
        "is_valid": True,
        "errors": [],
        "warnings": [],
        "info": {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns)
        }
    }
    
    # Verifica colunas obrigatórias
    missing_columns = set(required_columns) - set(df.columns)
    if missing_columns:
        result["is_valid"] = False
        result["errors"].append(f"Colunas obrigatórias ausentes: {list(missing_columns)}")
    
    # Verifica se há dados
    if len(df) == 0:
        result["warnings"].append("Arquivo não contém dados")
    
    # Verifica colunas vazias
    empty_columns = [col for col in df.columns if df[col].isna().all()]
    if empty_columns:
        result["warnings"].append(f"Colunas completamente vazias: {empty_columns}")
    
    # Verifica duplicatas
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        result["warnings"].append(f"Encontradas {duplicates} linhas duplicadas")
    
    return result

def convert_data_types(df: pd.DataFrame, type_mapping: Dict[str, str]) -> pd.DataFrame:
    """
    Converte tipos de dados do DataFrame
    
    Args:
        df: DataFrame original
        type_mapping: Mapeamento de colunas para tipos de dados
        
    Returns:
        DataFrame com tipos convertidos
    """
    df_converted = df.copy()
    
    for column, target_type in type_mapping.items():
        if column not in df_converted.columns:
            continue
            
        try:
            if target_type == "datetime":
                df_converted[column] = pd.to_datetime(df_converted[column], errors='coerce')
            elif target_type == "numeric":
                df_converted[column] = pd.to_numeric(df_converted[column], errors='coerce')
            elif target_type == "string":
                df_converted[column] = df_converted[column].astype(str)
            elif target_type == "boolean":
                df_converted[column] = df_converted[column].astype(bool)
                
        except Exception as e:
            logging.warning(f"Erro ao converter coluna {column} para {target_type}: {e}")
    
    return df_converted

def clean_dataframe(df: pd.DataFrame, cleaning_rules: Dict[str, Any]) -> pd.DataFrame:
    """
    Aplica regras de limpeza no DataFrame
    
    Args:
        df: DataFrame original
        cleaning_rules: Regras de limpeza a serem aplicadas
        
    Returns:
        DataFrame limpo
    """
    df_clean = df.copy()
    
    # Remove linhas completamente vazias
    if cleaning_rules.get("remove_empty_rows", True):
        df_clean = df_clean.dropna(how='all')
    
    # Remove colunas completamente vazias
    if cleaning_rules.get("remove_empty_columns", True):
        df_clean = df_clean.dropna(axis=1, how='all')
    
    # Remove duplicatas
    if cleaning_rules.get("remove_duplicates", False):
        df_clean = df_clean.drop_duplicates()
    
    # Limpa espaços em strings
    if cleaning_rules.get("strip_strings", True):
        string_columns = df_clean.select_dtypes(include=['object']).columns
        for col in string_columns:
            df_clean[col] = df_clean[col].astype(str).str.strip()
    
    # Substitui valores específicos
    if "replace_values" in cleaning_rules:
        for old_value, new_value in cleaning_rules["replace_values"].items():
            df_clean = df_clean.replace(old_value, new_value)
    
    return df_clean

def generate_processing_report(
    file_path: str,
    records_processed: int,
    records_failed: int,
    processing_time: float,
    errors: List[str] = None
) -> Dict[str, Any]:
    """
    Gera relatório de processamento
    
    Args:
        file_path: Caminho do arquivo processado
        records_processed: Número de registros processados com sucesso
        records_failed: Número de registros que falharam
        processing_time: Tempo de processamento em segundos
        errors: Lista de erros encontrados
        
    Returns:
        Relatório de processamento
    """
    return {
        "file_name": os.path.basename(file_path),
        "processed_at": datetime.now().isoformat(),
        "statistics": {
            "records_processed": records_processed,
            "records_failed": records_failed,
            "success_rate": records_processed / (records_processed + records_failed) * 100 if (records_processed + records_failed) > 0 else 0,
            "processing_time_seconds": round(processing_time, 2)
        },
        "errors": errors or [],
        "status": "success" if records_failed == 0 else "partial_success" if records_processed > 0 else "failed"
    }
