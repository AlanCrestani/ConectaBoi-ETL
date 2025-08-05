"""
Configurações do projeto ConectaBoi ETL
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

class Settings(BaseSettings):
    """Configurações da aplicação"""
    
    # Configurações do Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Configurações da API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # Configurações de logging
    log_level: str = "INFO"
    log_file: str = "../../data/logs/app.log"
    
    # Configurações de arquivos
    upload_max_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: list = [".csv", ".xlsx", ".xls"]
    
    # Configurações do ETL
    batch_size: int = 1000
    max_retries: int = 3
    
    class Config:
        env_file = "../../.env"
        case_sensitive = False

# Instância global das configurações
_settings = None

def get_settings() -> Settings:
    """Retorna instância singleton das configurações"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
