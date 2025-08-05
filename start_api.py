"""
Script para inicializar o servidor ConectaBoi ETL API
"""

import os
import sys
import uvicorn
from pathlib import Path

# Adiciona o diretório raiz ao path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

def main():
    """Inicia o servidor da API"""
    
    # Configurações do servidor
    host = "localhost"
    port = 8000
    reload = True
    
    print(f"🚀 Iniciando ConectaBoi ETL API...")
    print(f"📍 Servidor: http://{host}:{port}")
    print(f"📚 Documentação: http://{host}:{port}/docs")
    print(f"🔄 Auto-reload: {reload}")
    print("=" * 50)
    
    # Inicia o servidor
    uvicorn.run(
        "backend.api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()
