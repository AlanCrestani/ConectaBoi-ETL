"""
Teste de funcionamento da estrutura do projeto
"""

import sys
import os
from pathlib import Path

def test_project_structure():
    """Testa se toda a estrutura do projeto está funcionando"""
    
    print("🧪 Testando estrutura do projeto ConectaBoi-ETL...")
    print("=" * 60)
    
    # 1. Testa importação das configurações
    try:
        from backend.config.settings import get_settings
        settings = get_settings()
        print("✅ Configurações carregadas com sucesso")
    except Exception as e:
        print(f"❌ Erro ao carregar configurações: {e}")
        return False
    
    # 2. Testa importação do ETL
    try:
        from backend.etl.conectaboi_etl_smart import ConectaBoiETL
        print("✅ ETL Engine importado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao importar ETL Engine: {e}")
        return False
    
    # 3. Testa importação dos utilitários
    try:
        from backend.utils.helpers import validate_file_extension
        print("✅ Utilitários importados com sucesso")
    except Exception as e:
        print(f"❌ Erro ao importar utilitários: {e}")
        return False
    
    # 4. Testa estrutura de diretórios
    required_dirs = [
        "backend/api",
        "backend/config", 
        "backend/etl",
        "backend/utils",
        "data/input",
        "data/processed",
        "data/logs",
        "tests",
        "docs"
    ]
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print(f"✅ Diretório {dir_path} existe")
        else:
            print(f"❌ Diretório {dir_path} não encontrado")
            return False
    
    # 5. Testa se os arquivos principais existem
    required_files = [
        "backend/api/main.py",
        "backend/config/settings.py",
        "backend/etl/conectaboi_etl_smart.py",
        "backend/utils/helpers.py",
        "start_api.py",
        ".env"
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ Arquivo {file_path} existe")
        else:
            print(f"❌ Arquivo {file_path} não encontrado")
            return False
    
    print("=" * 60)
    print("🎉 Todos os testes passaram! Projeto estruturado corretamente.")
    print("🚀 Para iniciar:")
    print("   1. Frontend: npm run dev")
    print("   2. Backend:  python start_api.py")
    
    return True

if __name__ == "__main__":
    test_project_structure()
