#!/usr/bin/env python3
"""
Teste de debug para o problema de tela branca no preview
"""

import sys
import os
import traceback
import pandas as pd
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_basic_imports():
    """Testa importações básicas"""
    print("🔍 Testando importações básicas...")
    try:
        import pandas as pd
        print("✅ Pandas OK")
        
        from datetime import datetime
        print("✅ Datetime OK")
        
        from typing import Dict, List, Any
        print("✅ Typing OK")
        
        return True
    except Exception as e:
        print(f"❌ Erro nas importações básicas: {e}")
        return False

def test_etl_import():
    """Testa importação do ETL"""
    print("\n🔍 Testando importação do ETL...")
    try:
        from backend.etl.conectaboi_etl_smart import ConectaBoiETL
        print("✅ ETL importado com sucesso")
        
        etl = ConectaBoiETL()
        print("✅ Instância ETL criada")
        
        # Verificar se método existe
        if hasattr(etl, 'process_step2_preview'):
            print("✅ Método process_step2_preview encontrado")
        else:
            print("❌ Método process_step2_preview NÃO encontrado")
            
        return etl
    except Exception as e:
        print(f"❌ Erro na importação do ETL: {e}")
        traceback.print_exc()
        return None

def test_api_import():
    """Testa importação da API"""
    print("\n🔍 Testando importação da API...")
    try:
        from backend.api.main import app
        print("✅ API importada com sucesso")
        
        # Verificar endpoints
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                method = list(route.methods)[0] if route.methods else "GET"
                routes.append(f"{method} {route.path}")
        
        print("📋 Endpoints encontrados:")
        for route in routes:
            if 'step' in route.lower() or 'preview' in route.lower():
                print(f"  {route}")
                
        return True
    except Exception as e:
        print(f"❌ Erro na importação da API: {e}")
        traceback.print_exc()
        return False

def test_step2_preview():
    """Testa especificamente o método process_step2_preview"""
    print("\n🔍 Testando process_step2_preview...")
    
    etl = test_etl_import()
    if not etl:
        return False
        
    try:
        # Criar dados de teste
        test_data = {
            'id_curral': ['C001', 'C002', 'C003'],
            'lote': ['L001', 'L002', 'L003'],
            'data': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'qtd_animais': [100, 150, 200]
        }
        
        df_test = pd.DataFrame(test_data)
        test_file = "test_data.csv"
        df_test.to_csv(test_file, index=False)
        print(f"✅ Arquivo de teste criado: {test_file}")
        
        # Criar mapeamento de teste
        column_mapping = [
            {"csv_column": "id_curral", "db_column": "id_curral", "enabled": True, "data_type": "TEXT"},
            {"csv_column": "lote", "db_column": "lote", "enabled": True, "data_type": "TEXT"},
            {"csv_column": "data", "db_column": "data", "enabled": True, "data_type": "DATE"},
            {"csv_column": "qtd_animais", "db_column": "qtd_animais", "enabled": True, "data_type": "INTEGER"}
        ]
        
        print("✅ Mapeamento de colunas criado")
        
        # Testar o método
        result = etl.process_step2_preview(
            file_path=test_file,
            column_mapping=column_mapping,
            skip_first_line=False,
            preview_rows=5
        )
        
        print("✅ process_step2_preview executado sem erro")
        print(f"📊 Resultado: success = {result.get('success', 'N/A')}")
        
        if result.get('success'):
            print(f"📈 Linhas transformadas: {result.get('transformation_info', {}).get('total_rows', 'N/A')}")
            print(f"📋 Colunas mapeadas: {result.get('transformation_info', {}).get('mapped_columns', 'N/A')}")
        else:
            print(f"❌ Erro no resultado: {result.get('error', 'Erro desconhecido')}")
            
        # Limpar arquivo de teste
        if os.path.exists(test_file):
            os.remove(test_file)
            
        return result.get('success', False)
        
    except Exception as e:
        print(f"❌ Erro no teste do preview: {e}")
        traceback.print_exc()
        return False

def main():
    """Função principal de teste"""
    print("🚀 Iniciando testes de debug para o preview...")
    print("=" * 60)
    
    # Teste 1: Importações básicas
    if not test_basic_imports():
        return
    
    # Teste 2: Importação ETL
    etl = test_etl_import()
    if not etl:
        return
    
    # Teste 3: Importação API
    if not test_api_import():
        return
    
    # Teste 4: Método específico
    if test_step2_preview():
        print("\n🎉 Todos os testes passaram! O problema pode estar no frontend.")
    else:
        print("\n❌ Problema encontrado no backend.")
    
    print("=" * 60)
    print("🔚 Testes concluídos")

if __name__ == "__main__":
    main()
