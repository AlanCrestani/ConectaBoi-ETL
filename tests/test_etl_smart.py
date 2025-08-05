#!/usr/bin/env python3
"""
Teste do ETL Inteligente ConectaBoi
Script de demonstração das funcionalidades
"""

import sys
import os
import pandas as pd
from pathlib import Path

# Adicionar o diretório scripts ao path
sys.path.append(str(Path(__file__).parent))

try:
    from conectaboi_etl_smart import ConectaBoiETL
except ImportError:
    print("Erro: Não foi possível importar o módulo conectaboi_etl_smart")
    sys.exit(1)

def create_sample_csv():
    """Cria um CSV de exemplo para teste"""
    
    # Dados de exemplo - Histórico de Consumo
    sample_data = {
        'Data Trato': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
        'Curral': ['C001', 'C002', 'C001', 'C003'],
        'Lote': ['L001', 'L002', 'L001', 'L003'],
        'Qtd Animais': [50, 75, 50, 60],
        'CMS Previsto (kg)': [450.5, 680.2, 445.8, 520.1],
        'CMS Realizado (kg)': [448.2, 675.8, 450.3, 518.9],
        'Peso Médio (kg)': [480, 520, 485, 495],
        'GMD Esperado': [1.2, 1.4, 1.2, 1.3],
        'Leitura Cocho': ['Limpo', 'Sobra', 'Limpo', 'Limpo'],
        'Sexo': ['Macho', 'Macho', 'Macho', 'Fêmea']
    }
    
    df = pd.DataFrame(sample_data)
    
    # Salvar CSV de teste
    csv_path = 'C:/temp/teste_historico_consumo.csv'
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    
    # Adicionar uma linha "inválida" no topo para testar skip_first_line
    with open(csv_path, 'w', encoding='utf-8') as f:
        f.write("RELATÓRIO GERADO EM: 2024-01-05 - CONFINAMENTO TESTE\n")
        df.to_csv(f, index=False)
    
    print(f"✅ CSV de teste criado: {csv_path}")
    return csv_path

def test_etl_detection():
    """Testa a detecção automática do ETL"""
    
    print("🧪 Iniciando teste do ETL Inteligente ConectaBoi\n")
    
    # 1. Criar CSV de exemplo
    csv_path = create_sample_csv()
    
    # 2. Inicializar ETL
    etl = ConectaBoiETL()
    
    # 3. Teste SEM skip_first_line
    print("📊 Teste 1: Processamento normal")
    try:
        structure_normal = etl.detect_csv_structure(csv_path, skip_first_line=False)
        print(f"   Headers detectados: {structure_normal['headers'][:3]}...")
        print(f"   Tipo detectado: {structure_normal['detected_file_type']}")
        print(f"   Colunas: {structure_normal['column_count']}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    
    # 4. Teste COM skip_first_line (simulando checkbox marcado)
    print("📊 Teste 2: Com skip_first_line=True (checkbox marcado)")
    try:
        structure_skip = etl.detect_csv_structure(csv_path, skip_first_line=True)
        print(f"   Headers detectados: {structure_skip['headers'][:3]}...")
        print(f"   Tipo detectado: {structure_skip['detected_file_type']}")
        print(f"   Colunas: {structure_skip['column_count']}")
        print(f"   Skip aplicado: {structure_skip['skip_first_line']}")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    
    # 5. Teste de mapeamento automático
    print("📊 Teste 3: Mapeamento automático")
    try:
        auto_mapping = etl.generate_auto_mapping(structure_skip)
        print("   Mapeamentos sugeridos:")
        for mapping in auto_mapping[:3]:
            confidence = mapping.get('confidence', 0) * 100
            print(f"   • {mapping['csvColumn']} → {mapping['sqlColumn']} ({confidence:.0f}%)")
        print(f"   ... e mais {len(auto_mapping) - 3} mapeamentos")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    
    # 6. Teste de processamento completo
    print("📊 Teste 4: Processamento completo")
    try:
        result = etl.process_file(csv_path, skip_first_line=True)
        
        if result['success']:
            print(f"   ✅ Sucesso!")
            print(f"   📈 Linhas processadas: {result['total_rows']}")
            print(f"   🎯 Tipo detectado: {result['structure']['detected_file_type']}")
            print(f"   📝 Amostra dos dados:")
            
            for i, row in enumerate(result['data_sample'][:2]):
                print(f"      Linha {i+1}: {list(row.keys())[:3]}...")
        else:
            print(f"   ❌ Falha: {result['error']}")
            
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print("\n🎯 Teste concluído!")

def test_integration_with_frontend():
    """Simula integração com o frontend React"""
    
    print("\n🔗 Simulação de integração Frontend → Python")
    
    # Simular dados vindos do frontend (ETLConfigStep1)
    frontend_data = {
        'fileId': '01_historico_consumo',
        'skipFirstLine': True,  # Checkbox marcado
        'csvPath': 'C:/temp/teste_historico_consumo.csv',
        'schemaMode': 'select',
        'selectedTable': 'etl_staging_01_historico_consumo'
    }
    
    print(f"📥 Dados do frontend: {frontend_data}")
    
    # Processar com ETL
    etl = ConectaBoiETL()
    
    try:
        result = etl.process_file(
            frontend_data['csvPath'], 
            frontend_data['skipFirstLine']
        )
        
        if result['success']:
            # Simular resposta para o frontend
            response = {
                'success': True,
                'message': 'Processamento concluído com sucesso',
                'data': {
                    'detected_type': result['structure']['detected_file_type'],
                    'headers': result['structure']['headers'],
                    'column_count': result['structure']['column_count'],
                    'row_count': result['total_rows'],
                    'suggested_mappings': result['mapping'],
                    'sample_data': result['data_sample'][:3]
                }
            }
            
            print("📤 Resposta para frontend:")
            print(f"   • Tipo detectado: {response['data']['detected_type']}")
            print(f"   • Headers: {len(response['data']['headers'])} colunas")
            print(f"   • Mapeamentos: {len(response['data']['suggested_mappings'])} sugestões")
            print("   ✅ Pronto para Etapa 2 (Mapeamento)")
            
        else:
            print(f"❌ Erro na integração: {result['error']}")
            
    except Exception as e:
        print(f"❌ Erro na simulação: {e}")

if __name__ == "__main__":
    # Executar testes
    test_etl_detection()
    test_integration_with_frontend()
    
    print("\n" + "="*50)
    print("🚀 Como usar no frontend:")
    print("1. Usuário marca checkbox 'skip_first_line'")
    print("2. Frontend chama: POST /api/etl/detect")
    print("3. Python retorna estrutura + mapeamentos")
    print("4. Frontend pré-popula Etapa 2 automaticamente")
    print("="*50)
