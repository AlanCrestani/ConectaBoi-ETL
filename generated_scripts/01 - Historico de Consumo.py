#!/usr/bin/env python3
"""
Script ETL ConectaBoi - 01 - Historico de Consumo

Gerado automaticamente em: 05/08/2025
"""

import sys
import os
from pathlib import Path

# Adicionar diretório backend ao path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

from etl.conectaboi_etl_smart import ConectaBoiETL

def main():
    """Executa o processo ETL completo"""
    
    # Configurações
    transformations = {
        'ENF01': '76',
        'ENF02': '77'
    }
    
    removed_columns = ["setor","tipo_de_engorda_curva_de_consumo_referência","dieta_prevista","raça","cod_grupo_genético","proprietário_predominante","origem_predominante","tipo_de_aquisição","col_19","categoria","consumo_total_kg_mn","consumo_total_kg_ms","consumo_total_kg_ndt","ndt_dieta_meta","ndt_dieta_real","cndt_previsãokgcab","cndt_realkgcab","gmd_médio_gramas","cms_referência_pv","col_38","cms_referência_kgcab","cndt_pv_meta","ndt_meta_curvakg","cndt_pv_real","silagem_maiz_ms","burlanda_ms","maiz_humido_ms","nucleo_confinamiento_ms","milho_moído_nº4_ms","fosfato_bicálcico_18_ms","sorgo_silagem_ms","sorgo_grão_úmido_silagem_ms","água_ms","farelo_de_soja_ms","ureia_pecuaria_ms","calcareo_ms","pasto_feno_ms","nucleo_pasto_ms","capiasu_ms","milheto_silagem_ms","selenito_de_sódio_ms","silagem_maiz_mn","burlanda_mn","maiz_humido_mn","nucleo_confinamiento_mn","milho_moído_nº4_mn","fosfato_bicálcico_18_mn","sorgo_silagem_mn","sorgo_grão_úmido_silagem_mn","água_mn","farelo_de_soja_mn","ureia_pecuaria_mn","calcareo_mn","pasto_feno_mn","nucleo_pasto_mn","capiasu_mn","milheto_silagem_mn","selenito_de_sódio_mn","silagem_maiz_cmn","burlanda_cmn","maiz_humido_cmn","nucleo_confinamiento_cmn","milho_moído_nº4_cmn","fosfato_bicálcico_18_cmn","sorgo_silagem_cmn","sorgo_grão_úmido_silagem_cmn","água_cmn","farelo_de_soja_cmn","ureia_pecuaria_cmn","calcareo_cmn","pasto_feno_cmn","nucleo_pasto_cmn","capiasu_cmn","milheto_silagem_cmn","selenito_de_sódio_cmn"]
    
    # Inicializar ETL
    etl = ConectaBoiETL()
    
    print("🚀 Iniciando processo ETL...")
    
    # Solicitar arquivo de entrada
    input_file = input("Digite o caminho do arquivo CSV/XLSX: ").strip()
    if not os.path.exists(input_file):
        print(f"❌ Arquivo não encontrado: {input_file}")
        return
    
    try:
        # Processar arquivo
        print("📊 Processando dados...")
        result = etl.process_file(
            file_path=input_file,
            transformations=transformations,
            excluded_columns=removed_columns,
            excluded_rows=[]
        )
        
        print(f"✅ Processamento concluído!")
        print(f"📈 Registros processados: {len(result.get('data', []))}")
        
        # Upload para Supabase
        upload_choice = input("Fazer upload para Supabase? (s/n): ").strip().lower()
        if upload_choice in ['s', 'sim', 'y', 'yes']:
            print("☁️ Fazendo upload para Supabase...")
            upload_result = etl.upload_to_supabase(
                table_name="conectaboi_historico_consumo",
                data=result['data']
            )
            print(f"🎯 Upload concluído! {upload_result.get('records_inserted', 0)} registros inseridos.")
        
        print("🏆 Processo ETL finalizado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante o processo ETL: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
