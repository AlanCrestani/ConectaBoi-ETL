#!/usr/bin/env python3
"""
ETL Inteligente para ConectaBoi
Sistema que detecta automaticamente estruturas de dados e configura ETL
"""

import pandas as pd
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
from pathlib import Path

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ConectaBoiETL:
    """Classe principal para processamento ETL inteligente"""
    
    def __init__(self, config_path: str = None):
        self.config = self.load_config(config_path) if config_path else {}
        self.supabase = None
        self.setup_supabase()
    
    def setup_supabase(self):
        """Configura conexão REAL com Supabase"""
        try:
            from supabase import create_client, Client
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.dirname(__file__)))
            from config.settings import get_settings
            
            settings = get_settings()
            
            if settings.supabase_url and settings.supabase_service_role_key:
                self.supabase: Client = create_client(
                    settings.supabase_url, 
                    settings.supabase_service_role_key
                )
                logger.info("✅ Conexão REAL com Supabase estabelecida")
                logger.info(f"🔗 URL: {settings.supabase_url}")
                
                # Testa a conexão
                try:
                    # Tenta uma query simples para validar conexão
                    result = self.supabase.table('information_schema.tables').select('table_name').limit(1).execute()
                    logger.info("✅ Teste de conexão com Supabase bem-sucedido")
                except Exception as test_error:
                    logger.warning(f"⚠️ Conexão estabelecida mas teste falhou: {test_error}")
                        
            else:
                logger.warning("❌ Credenciais Supabase não configuradas - usando modo simulado")
                logger.info("💡 Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env")
                self.supabase = None
                
        except ImportError as import_error:
            logger.error(f"❌ Erro de importação: {import_error}")
            logger.info("💡 Execute: pip install supabase")
            self.supabase = None
        except Exception as e:
            logger.error(f"❌ Erro ao conectar com Supabase: {e}")
            self.supabase = None
    
    def load_config(self, config_path: str) -> Dict:
        """Carrega configuração de arquivo JSON"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Arquivo de configuração não encontrado: {config_path}")
            return {}
    
    def detect_csv_structure(self, file_path: str, skip_first_line: bool = False) -> Dict:
        """
        Detecta automaticamente a estrutura do CSV
        
        Args:
            file_path: Caminho para o arquivo CSV
            skip_first_line: Se True, remove primeira linha e usa segunda como header
            
        Returns:
            Dict com informações da estrutura detectada
        """
        logger.info(f"Analisando estrutura do arquivo: {file_path}")
        
        try:
            # Leitura inicial para análise
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) < 2:
                raise ValueError("Arquivo deve ter pelo menos 2 linhas")
            
            # Aplicar skip_first_line se necessário
            if skip_first_line:
                lines = lines[1:]  # Remove primeira linha
                logger.info("Primeira linha removida, usando segunda linha como cabeçalho")
            
            # Parse das linhas
            headers = self._parse_csv_line(lines[0])
            sample_data = [self._parse_csv_line(line) for line in lines[1:6]]  # Amostra das primeiras 5 linhas
            
            # Detectar tipos de dados
            column_types = self._detect_column_types(headers, sample_data)
            
            # Detectar padrões conhecidos
            file_type = self._detect_file_type(file_path, headers)
            
            structure = {
                'file_path': file_path,
                'headers': headers,
                'column_count': len(headers),
                'estimated_rows': len(lines) - 1,
                'column_types': column_types,
                'detected_file_type': file_type,
                'skip_first_line': skip_first_line,
                'sample_data': sample_data[:3],  # Primeiras 3 linhas como exemplo
                'suggested_table': f"etl_staging_{file_type}" if file_type else None
            }
            
            logger.info(f"Estrutura detectada: {len(headers)} colunas, ~{len(lines)} linhas")
            return structure
            
        except Exception as e:
            logger.error(f"Erro ao detectar estrutura: {e}")
            raise
    
    def _parse_csv_line(self, line: str) -> List[str]:
        """Parse simples de linha CSV (melhorar com biblioteca CSV real)"""
        return [cell.strip().strip('"') for cell in line.strip().split(',')]
    
    def _detect_column_types(self, headers: List[str], sample_data: List[List[str]]) -> Dict[str, str]:
        """Detecta tipos de dados das colunas baseado em amostras"""
        types = {}
        
        for i, header in enumerate(headers):
            column_values = [row[i] if i < len(row) else '' for row in sample_data]
            detected_type = self._infer_type(column_values)
            types[header] = detected_type
        
        return types
    
    def _infer_type(self, values: List[str]) -> str:
        """Infere tipo de dados baseado nos valores"""
        non_empty = [v for v in values if v.strip()]
        
        if not non_empty:
            return 'TEXT'
        
        # Tenta detectar números
        numeric_count = 0
        date_count = 0
        
        for value in non_empty:
            # Teste para número
            try:
                float(value.replace(',', '.'))
                numeric_count += 1
                continue
            except ValueError:
                pass
            
            # Teste para data
            if self._looks_like_date(value):
                date_count += 1
        
        total = len(non_empty)
        
        if numeric_count > total * 0.8:
            return 'NUMERIC'
        elif date_count > total * 0.6:
            return 'DATE'
        else:
            return 'TEXT'
    
    def _looks_like_date(self, value: str) -> bool:
        """Verifica se valor parece uma data"""
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # 2024-01-01
            r'\d{2}/\d{2}/\d{4}',  # 01/01/2024
            r'\d{2}-\d{2}-\d{4}',  # 01-01-2024
        ]
        
        import re
        for pattern in date_patterns:
            if re.match(pattern, value.strip()):
                return True
        return False
    
    def _detect_file_type(self, file_path: str, headers: List[str]) -> Optional[str]:
        """Detecta tipo de arquivo baseado no nome e cabeçalhos"""
        file_name = Path(file_path).stem.lower()
        headers_lower = [h.lower() for h in headers]
        
        # Padrões conhecidos do ConectaBoi
        patterns = {
            '01_historico_consumo': ['curral', 'data', 'cms', 'consumo', 'animais'],
            '02_desvio_carregamento': ['carregamento', 'desvio', 'pazeiro', 'ingrediente'],
            '03_desvio_distribuicao': ['distribuicao', 'tratador', 'trato', 'curral'],
            '04_itens_trato': ['trato', 'ingrediente', 'carregamento'],
            '05_trato_curral': ['trato', 'curral', 'abastecido', 'vagao']
        }
        
        # Primeiro, tenta pelo nome do arquivo
        for pattern_name in patterns.keys():
            if pattern_name in file_name:
                return pattern_name
        
        # Depois, tenta pelos cabeçalhos
        best_match = None
        best_score = 0
        
        for pattern_name, keywords in patterns.items():
            score = sum(1 for keyword in keywords 
                       if any(keyword in header for header in headers_lower))
            
            if score > best_score:
                best_score = score
                best_match = pattern_name
        
        return best_match if best_score > 1 else None
    
    def generate_auto_mapping(self, structure: Dict) -> List[Dict]:
        """Gera mapeamento automático baseado na estrutura detectada"""
        mappings = []
        detected_type = structure.get('detected_file_type')
        headers = structure.get('headers', [])
        
        if not detected_type:
            logger.warning("Tipo de arquivo não detectado, usando mapeamento genérico")
            return self._generate_generic_mapping(headers)
        
        # Mapeamentos específicos por tipo
        type_mappings = {
            '01_historico_consumo': {
                'data': 'data',
                'curral': 'id_curral',
                'animais': 'qtd_animais',
                'cms_realizado': 'cms_realizado_kg',
                'cms_previsto': 'cms_previsto_kg',
                'lote': 'lote',
                'sexo': 'sexo',
                'peso_entrada': 'peso_entrada_kg'
            },
            '02_desvio_carregamento': {
                'data': 'data',
                'carregamento': 'carregamento',
                'pazeiro': 'pazeiro',
                'ingrediente': 'ingrediente',
                'desvio_kg': 'desvio_kg',
                'previsto': 'previsto_kg',
                'realizado': 'realizado_kg'
            }
            # Adicionar outros tipos conforme necessário
        }
        
        mapping_rules = type_mappings.get(detected_type, {})
        
        for header in headers:
            header_lower = header.lower()
            
            # Busca mapeamento direto
            sql_column = None
            mapping_type = 'direct'
            
            for pattern, target in mapping_rules.items():
                if pattern in header_lower:
                    sql_column = target
                    break
            
            if not sql_column:
                # Mapeamento genérico
                sql_column = header_lower.replace(' ', '_').replace('-', '_')
                
            mappings.append({
                'csvColumn': header,
                'sqlColumn': sql_column,
                'type': mapping_type,
                'confidence': 0.8 if sql_column in mapping_rules.values() else 0.5
            })
        
        return mappings
    
    def _generate_generic_mapping(self, headers: List[str]) -> List[Dict]:
        """Gera mapeamento genérico quando tipo não é detectado"""
        mappings = []
        
        for header in headers:
            sql_column = header.lower().replace(' ', '_').replace('-', '_')
            mappings.append({
                'csvColumn': header,
                'sqlColumn': sql_column,
                'type': 'direct',
                'confidence': 0.3
            })
        
        return mappings
    
    def process_file(self, file_path: str, skip_first_line: bool = False, 
                    custom_config: Dict = None) -> Dict:
        """
        Processa arquivo completo com detecção automática
        
        Args:
            file_path: Caminho do arquivo CSV
            skip_first_line: Se True, remove primeira linha
            custom_config: Configuração customizada (opcional)
            
        Returns:
            Dict com resultado do processamento
        """
        try:
            # 1. Detectar estrutura
            structure = self.detect_csv_structure(file_path, skip_first_line)
            
            # 2. Gerar mapeamento automático
            auto_mapping = self.generate_auto_mapping(structure)
            
            # 3. Carregar dados
            df = pd.read_csv(file_path, skiprows=1 if skip_first_line else 0)
            
            # 4. Aplicar transformações
            transformed_df = self.apply_transformations(df, auto_mapping, custom_config)
            
            # 5. Preparar resultado
            result = {
                'structure': structure,
                'mapping': auto_mapping,
                'data_sample': transformed_df.head(5).to_dict('records'),
                'total_rows': len(transformed_df),
                'success': True,
                'processed_at': datetime.now().isoformat()
            }
            
            logger.info(f"Processamento concluído: {len(transformed_df)} linhas processadas")
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento: {e}")
            return {
                'success': False,
                'error': str(e),
                'processed_at': datetime.now().isoformat()
            }
    
    def apply_transformations(self, df: pd.DataFrame, mappings: List[Dict], 
                            custom_config: Dict = None) -> pd.DataFrame:
        """Aplica transformações baseadas no mapeamento"""
        result_df = pd.DataFrame()
        
        for mapping in mappings:
            csv_col = mapping['csvColumn']
            sql_col = mapping['sqlColumn']
            
            if csv_col in df.columns:
                result_df[sql_col] = df[csv_col]
        
        # Adicionar colunas padrão
        result_df['batch_id'] = pd.Series([f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"] * len(result_df))
        result_df['uploaded_at'] = pd.Series([datetime.now()] * len(result_df))
        result_df['processed'] = False
        
        return result_df

    def get_supabase_table_schema(self, table_name: str) -> Dict[str, Any]:
        """
        Conecta REALMENTE no Supabase e consulta o schema de uma tabela específica
        
        Args:
            table_name: Nome da tabela para consultar o schema
            
        Returns:
            Dicionário com informações do schema da tabela
        """
        try:
            logger.info(f"🔍 Consultando schema REAL da tabela {table_name} no Supabase...")
            
            if not self.supabase:
                logger.warning("❌ Conexão Supabase não estabelecida - usando schema simulado")
                return self._get_predefined_schema_dict(table_name)
            
            # CONSULTA REAL no PostgreSQL via Supabase
            columns_info = []
            
            try:
                # Query real no information_schema do PostgreSQL
                result = self.supabase.rpc('get_table_schema', {
                    'table_name_param': table_name
                }).execute()
                
                if result.data:
                    logger.info(f"✅ Schema obtido via RPC: {len(result.data)} colunas")
                    columns_info = result.data
                else:
                    raise Exception("RPC não retornou dados")
                    
            except Exception as rpc_error:
                logger.warning(f"⚠️ RPC falhou, tentando query direta: {rpc_error}")
                
                # Fallback: tenta obter informações via SELECT na tabela
                try:
                    # Pega uma linha da tabela para descobrir as colunas
                    sample = self.supabase.table(table_name).select('*').limit(1).execute()
                    
                    if sample.data and len(sample.data) > 0:
                        # Extrai nomes das colunas do resultado
                        first_row = sample.data[0]
                        columns_info = [
                            {
                                'column_name': col,
                                'data_type': self._infer_postgres_type(first_row[col]),
                                'is_nullable': 'YES',
                                'ordinal_position': i + 1
                            }
                            for i, col in enumerate(first_row.keys())
                        ]
                        logger.info(f"✅ Schema obtido via amostra: {len(columns_info)} colunas")
                    else:
                        raise Exception("Tabela vazia ou inacessível")
                        
                except Exception as select_error:
                    logger.error(f"❌ Falha ao acessar tabela {table_name}: {select_error}")
                    # Último recurso: schema predefinido
                    return self._get_predefined_schema_dict(table_name)
            
            # Constrói o CREATE TABLE statement
            create_table_sql = self._build_create_table_statement(table_name, columns_info)
            
            # Organiza informações do schema
            schema_info = {
                "table_name": table_name,
                "columns": columns_info,
                "create_table_sql": create_table_sql,
                "column_count": len(columns_info),
                "exists": True,
                "source": "supabase_real",
                "column_mapping": self._suggest_column_mapping(columns_info),
                "processed_at": datetime.now().isoformat()
            }
            
            logger.info(f"✅ Schema da tabela {table_name} obtido: {len(columns_info)} colunas")
            return schema_info
            
            logger.info(f"Schema obtido para tabela {table_name}: {len(columns_info)} colunas")
            return schema_info
            
        except Exception as e:
            logger.error(f"Erro ao obter schema da tabela {table_name}: {e}")
            return {
                "table_name": table_name,
                "columns": [],
                "create_table_sql": f"-- Erro ao obter schema da tabela {table_name}: {str(e)}",
                "column_count": 0,
                "exists": False,
                "error": str(e)
            }
    
    def _get_table_info_via_select(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Obtém informações da tabela através de um SELECT LIMIT 0 para descobrir estrutura
        """
        try:
            # Tenta fazer um SELECT na tabela para descobrir as colunas
            result = self.supabase.table(table_name).select("*").limit(0).execute()
            
            if hasattr(result, 'data') and result.data is not None:
                # Se a consulta funcionou, a tabela existe
                # Agora precisamos fazer outro SELECT para obter pelo menos um registro e inferir tipos
                sample_result = self.supabase.table(table_name).select("*").limit(1).execute()
                
                if sample_result.data and len(sample_result.data) > 0:
                    sample_row = sample_result.data[0]
                    columns_info = []
                    
                    for i, (col_name, value) in enumerate(sample_row.items()):
                        col_info = {
                            'column_name': col_name,
                            'data_type': self._infer_postgres_type(value),
                            'is_nullable': 'YES',  # Assumimos que pode ser nulo
                            'column_default': None,
                            'ordinal_position': i + 1
                        }
                        columns_info.append(col_info)
                    
                    return columns_info
            
            return []
            
        except Exception as e:
            logger.warning(f"Não foi possível obter schema via SELECT para {table_name}: {e}")
            return []
    
    def _get_predefined_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Retorna schemas predefinidos para tabelas conhecidas do ConectaBoi
        """
        predefined_schemas = {
            'etl_staging_01_historico_consumo': [
                {'column_name': 'id', 'data_type': 'bigint', 'is_nullable': 'NO', 'column_default': 'nextval(...)', 'ordinal_position': 1},
                {'column_name': 'id_curral', 'data_type': 'text', 'is_nullable': 'NO', 'ordinal_position': 2},
                {'column_name': 'lote', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 3},
                {'column_name': 'data', 'data_type': 'date', 'is_nullable': 'NO', 'ordinal_position': 4},
                {'column_name': 'qtd_animais', 'data_type': 'integer', 'is_nullable': 'YES', 'ordinal_position': 5},
                {'column_name': 'dias_confinamento', 'data_type': 'integer', 'is_nullable': 'YES', 'ordinal_position': 6},
                {'column_name': 'peso_entrada_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 7},
                {'column_name': 'cms_previsto_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 8},
                {'column_name': 'cms_realizado_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 9},
                {'column_name': 'batch_id', 'data_type': 'uuid', 'is_nullable': 'YES', 'column_default': 'gen_random_uuid()', 'ordinal_position': 10},
                {'column_name': 'uploaded_at', 'data_type': 'timestamp with time zone', 'is_nullable': 'YES', 'column_default': 'now()', 'ordinal_position': 11},
                {'column_name': 'processed', 'data_type': 'boolean', 'is_nullable': 'YES', 'column_default': 'false', 'ordinal_position': 12}
            ],
            'etl_staging_02_desvio_carregamento': [
                {'column_name': 'id', 'data_type': 'bigint', 'is_nullable': 'NO', 'column_default': 'nextval(...)', 'ordinal_position': 1},
                {'column_name': 'data', 'data_type': 'date', 'is_nullable': 'NO', 'ordinal_position': 2},
                {'column_name': 'carregamento', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 3},
                {'column_name': 'pazeiro', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 4},
                {'column_name': 'ingrediente', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 5},
                {'column_name': 'previsto_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 6},
                {'column_name': 'realizado_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 7},
                {'column_name': 'desvio_kg', 'data_type': 'numeric', 'is_nullable': 'YES', 'ordinal_position': 8},
                {'column_name': 'batch_id', 'data_type': 'uuid', 'is_nullable': 'YES', 'column_default': 'gen_random_uuid()', 'ordinal_position': 9},
                {'column_name': 'uploaded_at', 'data_type': 'timestamp with time zone', 'is_nullable': 'YES', 'column_default': 'now()', 'ordinal_position': 10},
                {'column_name': 'processed', 'data_type': 'boolean', 'is_nullable': 'YES', 'column_default': 'false', 'ordinal_position': 11}
            ]
        }
        
        return predefined_schemas.get(table_name, [])
    
    def _infer_postgres_type(self, value) -> str:
        """
        Infere o tipo PostgreSQL baseado no valor
        """
        if value is None:
            return 'text'
        elif isinstance(value, bool):
            return 'boolean'
        elif isinstance(value, int):
            return 'integer'
        elif isinstance(value, float):
            return 'numeric'
        elif isinstance(value, str):
            # Tenta detectar se é uma data
            try:
                pd.to_datetime(value)
                return 'date'
            except:
                return 'text'
        else:
            return 'text'
    
    def _build_create_table_statement(self, table_name: str, columns_info: List[Dict[str, Any]]) -> str:
        """
        Constrói o statement CREATE TABLE baseado nas informações das colunas
        """
        if not columns_info:
            return f"-- Tabela {table_name} não encontrada no banco de dados"
        
        create_sql = f"CREATE TABLE {table_name} (\n"
        column_definitions = []
        
        for col in columns_info:
            col_name = col.get('column_name', 'unknown')
            data_type = col.get('data_type', 'text')
            is_nullable = col.get('is_nullable', 'YES')
            col_default = col.get('column_default', '')
            
            # Monta a definição da coluna
            col_def = f"  {col_name} {data_type.upper()}"
            
            # Adiciona NOT NULL se necessário
            if is_nullable == 'NO':
                col_def += " NOT NULL"
            
            # Adiciona DEFAULT se existir
            if col_default and col_default not in ['', 'NULL', 'null']:
                if 'nextval' in str(col_default):
                    col_def += " PRIMARY KEY"
                elif col_default in ['gen_random_uuid()', 'now()']:
                    col_def += f" DEFAULT {col_default}"
                else:
                    col_def += f" DEFAULT {col_default}"
            
            column_definitions.append(col_def)
        
        create_sql += ",\n".join(column_definitions)
        create_sql += "\n);"
        
        return create_sql
    
    def _suggest_column_mapping(self, columns_info: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Sugere mapeamento inteligente de colunas baseado nos nomes
        """
        mapping = {}
        
        for col in columns_info:
            col_name = col.get('column_name', '').lower()
            data_type = col.get('data_type', 'text').lower()
            
            # Mapeamentos inteligentes baseados em padrões comuns
            if any(keyword in col_name for keyword in ['data', 'date']):
                mapping[col_name] = 'DATE'
            elif 'id' == col_name or col_name.endswith('_id'):
                mapping[col_name] = 'ID'
            elif any(keyword in col_name for keyword in ['peso', 'kg', 'qtd', 'quantidade', 'previsto', 'realizado']):
                mapping[col_name] = 'NUMERIC'
            elif any(keyword in col_name for keyword in ['curral', 'lote', 'nome', 'descricao', 'pazeiro', 'ingrediente']):
                mapping[col_name] = 'TEXT'
            elif data_type in ['boolean', 'bool']:
                mapping[col_name] = 'BOOLEAN'
            elif data_type in ['timestamp', 'timestamptz']:
                mapping[col_name] = 'TIMESTAMP'
            else:
                mapping[col_name] = 'AUTO_DETECT'
        
        return mapping

    def process_step1_complete(self, file_path: str, skip_first_line: bool = False, 
                          selected_table: str = None, schema_sql: str = None) -> Dict[str, Any]:
        """
        Processamento completo da Etapa 1 quando usuário clica 'Próximo'
        1. Detecta e corrige encoding para UTF-8
        2. Exclui primeira linha se necessário
        3. Promove nova primeira linha para cabeçalho
        4. Busca schema da tabela no Supabase
        5. Gera mapeamento automático inteligente
        """
        try:
            logger.info(f"Iniciando processamento completo da Etapa 1: {file_path}")
            
            # 1. Detectar encoding original (brasileiro)
            original_encoding = self._detect_encoding(file_path)
            logger.info(f"Encoding brasileiro detectado: {original_encoding}")
            
            # 2. Converter para UTF-8 (OBRIGATÓRIO para SQL)
            utf8_file_path = self._convert_to_utf8(file_path, original_encoding)
            logger.info(f"🔄 Conversão para UTF-8 concluída")
            
            # 3. Ler CSV com UTF-8 e delimitador brasileiro
            df = self._read_csv_safely(utf8_file_path, 'utf-8')
            logger.info(f"CSV UTF-8 carregado: {len(df)} linhas, {len(df.columns)} colunas")
            
            # 3. Processar primeira linha conforme configuração
            original_headers = list(df.columns)
            
            if skip_first_line and len(df) > 0:
                # Excluir primeira linha atual (que é o cabeçalho atual)
                # e promover primeira linha de dados para novo cabeçalho
                if len(df) > 0:
                    new_headers = df.iloc[0].tolist()
                    df = df.drop(index=0).reset_index(drop=True)
                    df.columns = [str(h) for h in new_headers]
                    logger.info("Primeira linha excluída e nova linha promovida para cabeçalho")
                    logger.info(f"Novos cabeçalhos: {list(df.columns)}")
            
            # 4. Limpar e padronizar dados
            df = self._clean_dataframe_for_processing(df)
            
            # 5. Se uma tabela foi selecionada, buscar schema do Supabase
            table_schema = None
            if selected_table:
                table_schema = self.get_supabase_table_schema(selected_table)
                logger.info(f"Schema da tabela {selected_table} obtido")
            
            # 6. Gerar mapeamento automático inteligente
            auto_mapping = self._generate_intelligent_mapping(
                csv_columns=df.columns.tolist(),
                table_schema=table_schema,
                sample_data=df.head(5).to_dict('records') if len(df) > 0 else []
            )
            
            # 7. Preparar dados para a Etapa 2
            result = {
                "csv_data": {
                    "headers": df.columns.tolist(),
                    "sample_rows": df.head(10).to_dict('records') if len(df) > 0 else [],
                    "total_rows": len(df),
                    "encoding_used": "utf-8",  # Sempre UTF-8 após conversão
                    "original_headers": original_headers
                },
                "table_schema": table_schema,
                "auto_mapping": auto_mapping,
                "processing_info": {
                    "skip_first_line_applied": skip_first_line,
                    "selected_table": selected_table,
                    "processed_at": datetime.now().isoformat(),
                    "file_path": file_path
                }
            }
            
            # 8. Salvar dados processados para próxima etapa
            processed_file_path = file_path.replace('.csv', '_processed.json')
            with open(processed_file_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info("Processamento da Etapa 1 concluído com sucesso")
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento da Etapa 1: {str(e)}")
            raise Exception(f"Erro no processamento da Etapa 1: {str(e)}")
    
    def _detect_csv_delimiter(self, file_path: str, encoding: str = 'utf-8') -> str:
        """
        Detecta o delimitador do arquivo CSV
        Para arquivos brasileiros, prioriza ponto-e-vírgula
        """
        import csv
        
        # Prioridade para arquivos brasileiros: ponto-e-vírgula primeiro
        delimiters = [';', ',', '\t', '|']
        
        with open(file_path, 'r', encoding=encoding) as file:
            # Lê algumas linhas para detectar o delimitador
            sample = file.read(2048)
            file.seek(0)
            
            # Conta ocorrências de cada delimitador
            delimiter_counts = {d: sample.count(d) for d in delimiters}
            
            # Se ponto-e-vírgula tem pelo menos algumas ocorrências, usa ele
            if delimiter_counts[';'] > 0:
                logger.info(f"Delimitador brasileiro detectado: ';' (contagem: {delimiter_counts[';']})")
                return ';'
            
            # Senão, usa o que tem mais ocorrências
            best_delimiter = max(delimiter_counts, key=delimiter_counts.get)
            logger.info(f"Delimitador detectado por contagem: '{best_delimiter}' (contagem: {delimiter_counts[best_delimiter]})")
            return best_delimiter

    def _read_csv_safely(self, file_path: str, encoding: str = 'utf-8') -> pd.DataFrame:
        """
        Lê CSV de forma segura otimizado para arquivos brasileiros
        """
        delimiter = self._detect_csv_delimiter(file_path, encoding)
        
        try:
            # Configuração otimizada para arquivos brasileiros com aspas
            df = pd.read_csv(
                file_path, 
                encoding=encoding, 
                delimiter=delimiter,
                quotechar='"',  # Aspas duplas
                skipinitialspace=True,  # Remove espaços após delimitador
                keep_default_na=False  # Não converte strings vazias em NaN
            )
            logger.info(f"CSV brasileiro lido com sucesso: {len(df)} linhas, {len(df.columns)} colunas")
            return df
        except Exception as e:
            logger.warning(f"Erro ao ler CSV com configuração brasileira: {e}")
            
            # Fallback: tentativas alternativas
            for alt_delimiter in [';', ',', '\t', '|']:
                if alt_delimiter != delimiter:
                    try:
                        df = pd.read_csv(
                            file_path, 
                            encoding=encoding, 
                            delimiter=alt_delimiter,
                            quotechar='"'
                        )
                        logger.info(f"CSV lido com delimitador alternativo '{alt_delimiter}': {len(df)} linhas, {len(df.columns)} colunas")
                        return df
                    except:
                        continue
            
            # Última tentativa: modo mais permissivo
            try:
                df = pd.read_csv(
                    file_path, 
                    encoding=encoding, 
                    delimiter=';',  # Força ponto-e-vírgula
                    quotechar='"',
                    on_bad_lines='skip'  # Pula linhas problemáticas
                )
                logger.info(f"CSV lido em modo permissivo brasileiro: {len(df)} linhas, {len(df.columns)} colunas")
                return df
            except Exception as final_error:
                logger.error(f"Falha ao ler CSV mesmo em modo permissivo: {final_error}")
                raise final_error
    
    def _detect_encoding(self, file_path: str) -> str:
        """
        Detecta o encoding do arquivo e prioriza encodings brasileiros
        """
        import chardet
        
        with open(file_path, 'rb') as file:
            raw_data = file.read()
            result = chardet.detect(raw_data)
            detected_encoding = result['encoding']
            confidence = result['confidence']
            
            logger.info(f"Encoding detectado: {detected_encoding} (confiança: {confidence})")
            
            # Mapeamento de encodings brasileiros comuns
            brazilian_encodings = {
                'ISO-8859-1': 'windows-1252',
                'windows-1252': 'windows-1252',
                'cp1252': 'windows-1252',
                'latin-1': 'windows-1252'
            }
            
            # Se detectou um encoding brasileiro, usa ele
            if detected_encoding in brazilian_encodings:
                final_encoding = brazilian_encodings[detected_encoding]
                logger.info(f"Usando encoding brasileiro: {final_encoding}")
                return final_encoding
            
            # Fallback para UTF-8 se confiança muito baixa
            if confidence < 0.7:
                logger.warning(f"Baixa confiança no encoding ({confidence}), tentando windows-1252 primeiro")
                return 'windows-1252'
            
            return detected_encoding or 'windows-1252'

    def _convert_to_utf8(self, file_path: str, source_encoding: str) -> str:
        """
        Converte arquivo para UTF-8 e salva uma versão temporária
        OBRIGATÓRIO para compatibilidade com banco SQL
        """
        from pathlib import Path
        import tempfile
        import os
        
        # Cria arquivo temporário UTF-8
        temp_dir = Path(file_path).parent / 'temp'
        temp_dir.mkdir(exist_ok=True)
        
        utf8_file_path = temp_dir / f"utf8_{Path(file_path).name}"
        
        try:
            # Lê no encoding original
            with open(file_path, 'r', encoding=source_encoding) as source_file:
                content = source_file.read()
            
            # Escreve em UTF-8
            with open(utf8_file_path, 'w', encoding='utf-8') as utf8_file:
                utf8_file.write(content)
            
            logger.info(f"✅ Arquivo convertido para UTF-8: {utf8_file_path}")
            logger.info(f"📄 Encoding original: {source_encoding} → UTF-8 (compatível com SQL)")
            
            return str(utf8_file_path)
            
        except Exception as e:
            logger.error(f"❌ Erro na conversão UTF-8: {e}")
            # Se falhar, tenta usar o arquivo original
            return file_path
        """
        Detecta o encoding do arquivo CSV
        """
        import chardet
        
        try:
            with open(file_path, 'rb') as f:
                raw_data = f.read(10000)  # Lê primeiros 10KB
                result = chardet.detect(raw_data)
                detected_encoding = result['encoding']
                
                if detected_encoding:
                    logger.info(f"Encoding detectado: {detected_encoding} (confiança: {result['confidence']})")
                    return detected_encoding
                else:
                    logger.warning("Não foi possível detectar encoding, usando UTF-8")
                    return 'utf-8'
                    
        except Exception as e:
            logger.warning(f"Erro ao detectar encoding: {e}, usando UTF-8")
            return 'utf-8'
    
    def _clean_dataframe_for_processing(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Limpa e padroniza DataFrame para processamento com validações robustas
        """
        try:
            # Validação inicial
            if df is None or df.empty:
                logger.warning("DataFrame vazio ou None recebido")
                return pd.DataFrame()
            
            logger.info(f"🧹 Limpando DataFrame: {len(df)} linhas, {len(df.columns)} colunas")
            
            # Remove linhas completamente vazias
            df_cleaned = df.dropna(how='all')
            logger.info(f"📝 Após remoção de linhas vazias: {len(df_cleaned)} linhas")
            
            # Validação após limpeza inicial
            if df_cleaned.empty:
                logger.warning("DataFrame ficou vazio após limpeza inicial")
                return df_cleaned
            
            # Limpa espaços em colunas de string
            string_columns = df_cleaned.select_dtypes(include=['object']).columns
            logger.info(f"🔤 Processando {len(string_columns)} colunas de texto")
            
            for col in string_columns:
                try:
                    # Converte para string e remove espaços
                    df_cleaned[col] = df_cleaned[col].astype(str).str.strip()
                    # Remove valores que são apenas 'nan' como string
                    df_cleaned[col] = df_cleaned[col].replace('nan', None)
                except Exception as col_error:
                    logger.warning(f"⚠️ Erro ao processar coluna '{col}': {col_error}")
                    continue
            
            # Limpa nomes das colunas garantindo unicidade
            try:
                original_columns = list(df_cleaned.columns)
                used_names = set()
                cleaned_columns = []
                
                for i, col in enumerate(original_columns):
                    cleaned_name = self._clean_column_name(str(col), column_index=i, used_names=used_names)
                    cleaned_columns.append(cleaned_name)
                
                df_cleaned.columns = cleaned_columns
                logger.info(f"🏷️ Colunas renomeadas com unicidade: {len(cleaned_columns)} colunas")
                logger.debug(f"📝 Mapeamento de colunas: {dict(zip(original_columns, cleaned_columns))}")
            except Exception as columns_error:
                logger.error(f"❌ Erro ao renomear colunas: {columns_error}")
                # Continua sem renomear se houver erro
            
            logger.info(f"✅ DataFrame limpo: {len(df_cleaned)} linhas, {len(df_cleaned.columns)} colunas")
            return df_cleaned
            
        except Exception as e:
            logger.error(f"❌ Erro crítico na limpeza do DataFrame: {e}")
            logger.error(f"📊 Tipo do DataFrame: {type(df)}")
            logger.error(f"📊 Shape do DataFrame: {df.shape if hasattr(df, 'shape') else 'N/A'}")
            raise Exception(f"Erro na limpeza do DataFrame: {str(e)}")
    
    def _clean_column_name(self, column_name: str, column_index: int = None, used_names: set = None) -> str:
        """
        Limpa e padroniza nomes de colunas garantindo unicidade
        """
        import re
        
        if used_names is None:
            used_names = set()
        
        # Remove caracteres especiais e espaços extras
        cleaned = re.sub(r'[^\w\s]', '', str(column_name))
        cleaned = re.sub(r'\s+', '_', cleaned.strip())
        cleaned = cleaned.lower()
        
        # Remove underscores múltiplos
        cleaned = re.sub(r'_+', '_', cleaned)
        
        # Remove underscore no início ou fim
        cleaned = cleaned.strip('_')
        
        # Se nome está vazio ou inválido, cria nome baseado no índice
        if not cleaned or cleaned in ['nan', 'none', 'null', '']:
            base_name = f'col_{column_index}' if column_index is not None else 'col_unnamed'
        else:
            base_name = cleaned
        
        # Garante unicidade adicionando sufixo se necessário
        final_name = base_name
        counter = 1
        while final_name in used_names:
            final_name = f"{base_name}_{counter}"
            counter += 1
        
        used_names.add(final_name)
        return final_name
    
    def _infer_postgres_type(self, value) -> str:
        """Infere o tipo PostgreSQL baseado no valor"""
        if value is None:
            return 'text'
        elif isinstance(value, bool):
            return 'boolean'
        elif isinstance(value, int):
            return 'integer'
        elif isinstance(value, float):
            return 'numeric'
        elif isinstance(value, str):
            if len(value) > 255:
                return 'text'
            else:
                return 'varchar(255)'
        else:
            return 'text'
    
    def _get_predefined_schema_dict(self, table_name: str) -> Dict[str, Any]:
        """Retorna schema predefinido quando conexão real falha"""
        logger.info(f"📋 Usando schema predefinido para {table_name}")
        
        # Schema padrão genérico
        default_columns = [
            {'column_name': 'id', 'data_type': 'integer', 'is_nullable': 'NO', 'ordinal_position': 1},
            {'column_name': 'created_at', 'data_type': 'timestamp', 'is_nullable': 'YES', 'ordinal_position': 2},
            {'column_name': 'data_column_1', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 3},
            {'column_name': 'data_column_2', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 4},
            {'column_name': 'data_column_3', 'data_type': 'text', 'is_nullable': 'YES', 'ordinal_position': 5}
        ]
        
        return {
            "table_name": table_name,
            "columns": default_columns,
            "create_table_sql": f"-- Schema simulado para {table_name}",
            "column_count": len(default_columns),
            "exists": False,
            "source": "predefined_fallback",
            "column_mapping": {},
            "processed_at": datetime.now().isoformat()
        }
    
    def _generate_intelligent_mapping(self, csv_columns: list, table_schema: Dict = None, 
                                    sample_data: list = None) -> list:
        """
        Gera mapeamento inteligente entre colunas CSV e tabela do banco
        """
        mappings = []
        
        # Se temos schema da tabela, usar para mapeamento inteligente
        if table_schema and table_schema.get('columns'):
            db_columns = [col['column_name'] for col in table_schema['columns']]
            
            for csv_col in csv_columns:
                best_match = self._find_best_column_match(csv_col, db_columns)
                
                mapping = {
                    "csv_column": csv_col,
                    "db_column": best_match,
                    "confidence": self._calculate_match_confidence(csv_col, best_match),
                    "data_type": self._infer_csv_column_type(csv_col, sample_data),
                    "suggested": True if best_match else False
                }
                mappings.append(mapping)
        else:
            # Mapeamento genérico quando não temos schema
            for csv_col in csv_columns:
                mapping = {
                    "csv_column": csv_col,
                    "db_column": self._clean_column_name(csv_col),
                    "confidence": 0.5,
                    "data_type": self._infer_csv_column_type(csv_col, sample_data),
                    "suggested": False
                }
                mappings.append(mapping)
        
        return mappings
    
    def _find_best_column_match(self, csv_column: str, db_columns: list) -> str:
        """
        Encontra a melhor correspondência entre coluna CSV e colunas do banco
        """
        csv_clean = self._clean_column_name(csv_column.lower())
        
        # Busca correspondência exata
        for db_col in db_columns:
            if csv_clean == db_col.lower():
                return db_col
        
        # Busca correspondência parcial
        for db_col in db_columns:
            if csv_clean in db_col.lower() or db_col.lower() in csv_clean:
                return db_col
        
        # Busca por palavras-chave conhecidas
        keyword_mappings = {
            'data': ['data', 'date'],
            'curral': ['id_curral', 'curral'],
            'lote': ['lote', 'batch'],
            'peso': ['peso_entrada_kg', 'peso_kg'],
            'animais': ['qtd_animais', 'quantidade_animais'],
            'consumo': ['cms_realizado_kg', 'cms_previsto_kg']
        }
        
        for keyword, possible_matches in keyword_mappings.items():
            if keyword in csv_clean:
                for possible in possible_matches:
                    for db_col in db_columns:
                        if possible in db_col.lower():
                            return db_col
        
        return None
    
    def _calculate_match_confidence(self, csv_col: str, db_col: str) -> float:
        """
        Calcula confiança do mapeamento (0.0 a 1.0)
        """
        if not db_col:
            return 0.0
        
        csv_clean = self._clean_column_name(csv_col.lower())
        db_clean = db_col.lower()
        
        if csv_clean == db_clean:
            return 1.0
        elif csv_clean in db_clean or db_clean in csv_clean:
            return 0.8
        else:
            return 0.6
    
    def _infer_csv_column_type(self, column_name: str, sample_data: list) -> str:
        """
        Infere tipo da coluna CSV baseado no nome e dados de amostra
        """
        col_name_lower = column_name.lower()
        
        # Inferência por nome
        if any(keyword in col_name_lower for keyword in ['data', 'date']):
            return 'DATE'
        elif any(keyword in col_name_lower for keyword in ['id', 'codigo']):
            return 'INTEGER'
        elif any(keyword in col_name_lower for keyword in ['peso', 'kg', 'qtd', 'quantidade', 'valor']):
            return 'NUMERIC'
        elif any(keyword in col_name_lower for keyword in ['nome', 'descricao', 'lote', 'curral']):
            return 'TEXT'
        
        # Se temos dados de amostra, analisar valores
        if sample_data and len(sample_data) > 0:
            values = [str(row.get(column_name, '')) for row in sample_data if row.get(column_name)]
            if values:
                return self._infer_type_from_values(values)
        
        return 'TEXT'
    
    def _infer_type_from_values(self, values: list) -> str:
        """
        Infere tipo baseado em valores reais
        """
        clean_values = [v for v in values if v and str(v).strip() and str(v) != 'nan']
        
        if not clean_values:
            return 'TEXT'
        
        # Testa se são números
        numeric_count = 0
        date_count = 0
        
        for value in clean_values[:5]:  # Testa apenas primeiros 5 valores
            # Testa número
            try:
                float(str(value).replace(',', '.'))
                numeric_count += 1
            except:
                pass
            
            # Testa data
            try:
                pd.to_datetime(str(value))
                date_count += 1
            except:
                pass
        
        total = len(clean_values[:5])
        
        if date_count / total > 0.6:
            return 'DATE'
        elif numeric_count / total > 0.6:
            return 'NUMERIC'
        else:
            return 'TEXT'

    def process_csv_with_preprocessing(self, file_path: str, target_table: str, skip_first_line: bool = False) -> Dict[str, Any]:
        """
        Processa CSV com pré-processamento completo:
        1. Converte para UTF-8
        2. Exclui primeira linha se necessário
        3. Promove nova primeira linha para cabeçalho
        4. Obtém schema da tabela do Supabase
        5. Gera mapeamento inteligente
        
        Args:
            file_path: Caminho do arquivo CSV
            target_table: Nome da tabela de destino
            skip_first_line: Se deve pular a primeira linha
            
        Returns:
            Resultado completo do processamento
        """
        try:
            logger.info(f"Iniciando processamento completo do arquivo {file_path}")
            
            # 1. Detecta estrutura do CSV com processamento UTF-8
            csv_structure = self.detect_csv_structure(file_path, skip_first_line)
            
            # 2. Obtém schema da tabela do Supabase
            table_schema = self.get_supabase_table_schema(target_table)
            
            # 3. Gera mapeamento automático inteligente
            auto_mapping = self.generate_auto_mapping(file_path, target_table, skip_first_line)
            
            # 4. Resultado completo
            result = {
                "success": True,
                "file_info": {
                    "file_path": file_path,
                    "file_name": os.path.basename(file_path),
                    "processed_at": datetime.now().isoformat(),
                    "skip_first_line": skip_first_line
                },
                "csv_structure": csv_structure,
                "table_schema": table_schema,
                "auto_mapping": auto_mapping,
                "ready_for_mapping_step": True,
                "next_step": "Configure o mapeamento de colunas CSV → Banco de dados"
            }
            
            logger.info(f"Processamento completo concluído com sucesso para {target_table}")
            return result
            
        except Exception as e:
            logger.error(f"Erro no processamento completo: {e}")
            return {
                "success": False,
                "error": str(e),
                "file_path": file_path,
                "target_table": target_table
            }
    
    def process_step2_preview(self, file_path: str, column_mapping: List[Dict], 
                             skip_first_line: bool = False, preview_rows: int = 20) -> Dict[str, Any]:
        """
        Processa dados para preview da Etapa 2 quando usuário clica 'Próximo/Preview'
        - Aplica mapeamento de colunas configurado
        - Exclui colunas não mapeadas
        - Aplica transformações de dados
        - Valida tipos de dados
        - Retorna preview dos dados transformados
        
        Args:
            file_path: Caminho do arquivo CSV
            column_mapping: Lista de mapeamentos {csv_column, db_column, enabled}
            skip_first_line: Se deve pular primeira linha
            preview_rows: Número de linhas para preview
            
        Returns:
            Dict com dados transformados e estatísticas
        """
        try:
            logger.info(f"🔄 Iniciando preview da Etapa 2 para: {file_path}")
            logger.info(f"📝 Mapeamentos configurados: {len(column_mapping)} colunas")
            
            # 1. Carregar e preparar dados
            df_original = self._load_and_prepare_dataframe(file_path, skip_first_line)
            logger.info(f"📊 DataFrame original: {len(df_original)} linhas, {len(df_original.columns)} colunas")
            
            # 2. Aplicar mapeamentos e transformações
            df_transformed = self._apply_column_mapping_transformations(df_original, column_mapping)
            logger.info(f"✅ DataFrame transformado: {len(df_transformed)} linhas, {len(df_transformed.columns)} colunas")
            
            # 3. Validar dados transformados
            validation_results = self._validate_transformed_data(df_transformed)
            
            # 4. Gerar estatísticas de transformação
            transformation_stats = self._generate_transformation_stats(df_original, df_transformed, column_mapping)
            
            # 5. Preparar preview dos dados
            preview_data = df_transformed.head(preview_rows).fillna("").to_dict('records')
            
            # 6. Resultado completo
            result = {
                "success": True,
                "transformation_info": {
                    "original_columns": len(df_original.columns),
                    "mapped_columns": len([m for m in column_mapping if m.get('enabled', True)]),
                    "excluded_columns": len([m for m in column_mapping if not m.get('enabled', True)]),
                    "total_rows": len(df_transformed),
                    "processed_at": datetime.now().isoformat()
                },
                "transformed_data": {
                    "columns": list(df_transformed.columns),
                    "preview_rows": preview_data,
                    "total_rows": len(df_transformed),
                    "data_types": df_transformed.dtypes.astype(str).to_dict()
                },
                "validation_results": validation_results,
                "transformation_stats": transformation_stats,
                "column_mapping_applied": column_mapping,
                "ready_for_load": validation_results.get('is_valid', False),
                "next_step": "Revisar dados transformados e carregar no banco" if validation_results.get('is_valid', False) else "Corrigir problemas de validação"
            }
            
            logger.info(f"✅ Preview da Etapa 2 concluído: {len(df_transformed)} linhas prontas")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro no preview da Etapa 2: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "file_path": file_path,
                "processed_at": datetime.now().isoformat()
            }
    
    def _load_and_prepare_dataframe(self, file_path: str, skip_first_line: bool = False) -> pd.DataFrame:
        """
        Carrega e prepara DataFrame com todas as limpezas necessárias
        """
        try:
            # 1. Detectar e converter encoding
            original_encoding = self._detect_encoding(file_path)
            utf8_file_path = self._convert_to_utf8(file_path, original_encoding)
            
            # 2. Ler CSV com configurações brasileiras
            df = self._read_csv_safely(utf8_file_path, 'utf-8')
            
            # 3. Processar primeira linha se necessário
            if skip_first_line and len(df) > 0:
                # Promover primeira linha de dados para cabeçalho
                new_headers = df.iloc[0].tolist()
                df = df.drop(index=0).reset_index(drop=True)
                df.columns = [str(h) for h in new_headers]
                logger.info("🔄 Primeira linha excluída e nova linha promovida para cabeçalho")
            
            # 4. Limpar e padronizar dados
            df_cleaned = self._clean_dataframe_for_processing(df)
            
            return df_cleaned
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar DataFrame: {e}")
            raise Exception(f"Erro ao carregar dados: {str(e)}")
    
    def _apply_column_mapping_transformations(self, df: pd.DataFrame, column_mapping: List[Dict]) -> pd.DataFrame:
        """
        Aplica transformações baseadas no mapeamento de colunas configurado
        """
        try:
            logger.info(f"🔄 Aplicando mapeamentos de colunas...")
            
            # DataFrame resultado
            df_result = pd.DataFrame()
            
            # Estatísticas de mapeamento
            mapped_count = 0
            skipped_count = 0
            
            for mapping in column_mapping:
                csv_column = mapping.get('csv_column')
                db_column = mapping.get('db_column')
                enabled = mapping.get('enabled', True)
                data_type = mapping.get('data_type', 'TEXT')
                
                # Pular colunas desabilitadas
                if not enabled:
                    skipped_count += 1
                    logger.debug(f"⏭️ Coluna '{csv_column}' pulada (desabilitada)")
                    continue
                
                # Verificar se coluna existe no DataFrame
                if csv_column not in df.columns:
                    logger.warning(f"⚠️ Coluna '{csv_column}' não encontrada no CSV")
                    continue
                
                # Mapear coluna com nome do banco
                if db_column and db_column.strip():
                    target_column = db_column.strip()
                else:
                    target_column = self._clean_column_name(csv_column)
                
                # Copiar dados e aplicar transformações de tipo
                df_result[target_column] = self._apply_data_type_transformation(
                    df[csv_column], data_type
                )
                
                mapped_count += 1
                logger.debug(f"✅ '{csv_column}' → '{target_column}' ({data_type})")
            
            # Adicionar colunas de controle ETL
            df_result = self._add_etl_control_columns(df_result)
            
            logger.info(f"✅ Mapeamento aplicado: {mapped_count} colunas mapeadas, {skipped_count} excluídas")
            return df_result
            
        except Exception as e:
            logger.error(f"❌ Erro ao aplicar mapeamentos: {e}")
            raise Exception(f"Erro na transformação de colunas: {str(e)}")
    
    def _apply_data_type_transformation(self, series: pd.Series, target_type: str) -> pd.Series:
        """
        Aplica transformação de tipo de dados na série
        """
        try:
            target_type = target_type.upper()
            
            if target_type in ['TEXT', 'VARCHAR', 'STRING']:
                return series.astype(str).replace('nan', '')
                
            elif target_type in ['INTEGER', 'INT', 'BIGINT']:
                # Tenta converter para inteiro, mantém vazio se falhar
                def safe_int_convert(x):
                    try:
                        if pd.isna(x) or str(x).strip() == '':
                            return None
                        # Remove vírgulas decimais brasileiras
                        clean_x = str(x).replace(',', '.').split('.')[0]
                        return int(float(clean_x))
                    except:
                        return None
                return series.apply(safe_int_convert)
                
            elif target_type in ['NUMERIC', 'DECIMAL', 'FLOAT', 'DOUBLE']:
                # Tenta converter para float, mantém vazio se falhar
                def safe_float_convert(x):
                    try:
                        if pd.isna(x) or str(x).strip() == '':
                            return None
                        # Converte vírgula brasileira para ponto
                        clean_x = str(x).replace(',', '.')
                        return float(clean_x)
                    except:
                        return None
                return series.apply(safe_float_convert)
                
            elif target_type in ['DATE', 'TIMESTAMP']:
                # Tenta converter para data
                def safe_date_convert(x):
                    try:
                        if pd.isna(x) or str(x).strip() == '':
                            return None
                        return pd.to_datetime(str(x), dayfirst=True)  # Formato brasileiro
                    except:
                        return None
                return series.apply(safe_date_convert)
                
            elif target_type in ['BOOLEAN', 'BOOL']:
                # Converte para boolean
                def safe_bool_convert(x):
                    try:
                        if pd.isna(x) or str(x).strip() == '':
                            return None
                        str_x = str(x).lower().strip()
                        return str_x in ['true', '1', 'sim', 'yes', 'verdadeiro', 't']
                    except:
                        return None
                return series.apply(safe_bool_convert)
                
            else:
                # Tipo não reconhecido, retorna como texto
                return series.astype(str).replace('nan', '')
                
        except Exception as e:
            logger.warning(f"⚠️ Erro na conversão de tipo {target_type}: {e}")
            return series.astype(str).replace('nan', '')
    
    def _add_etl_control_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Adiciona colunas de controle ETL padrão
        """
        try:
            # Gera ID único para este batch
            batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            current_time = datetime.now()
            
            # Adiciona colunas de controle se não existirem
            if 'batch_id' not in df.columns:
                df['batch_id'] = batch_id
            
            if 'uploaded_at' not in df.columns:
                df['uploaded_at'] = current_time
            
            if 'processed' not in df.columns:
                df['processed'] = False
            
            if 'created_at' not in df.columns:
                df['created_at'] = current_time
            
            logger.info(f"📝 Colunas de controle ETL adicionadas (batch_id: {batch_id})")
            return df
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao adicionar colunas de controle: {e}")
            return df
    
    def _validate_transformed_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Valida dados transformados antes do carregamento
        """
        try:
            validation_results = {
                "is_valid": True,
                "warnings": [],
                "errors": [],
                "stats": {
                    "total_rows": len(df),
                    "empty_rows": 0,
                    "null_percentages": {},
                    "data_quality_score": 0.0
                }
            }
            
            # 1. Verificar linhas vazias
            empty_rows = df.isnull().all(axis=1).sum()
            validation_results["stats"]["empty_rows"] = int(empty_rows)
            
            if empty_rows > 0:
                validation_results["warnings"].append(f"Encontradas {empty_rows} linhas completamente vazias")
            
            # 2. Verificar percentual de nulos por coluna
            for col in df.columns:
                null_count = df[col].isnull().sum()
                null_percentage = (null_count / len(df)) * 100
                validation_results["stats"]["null_percentages"][col] = round(null_percentage, 2)
                
                if null_percentage > 50:
                    validation_results["warnings"].append(f"Coluna '{col}' tem {null_percentage:.1f}% de valores nulos")
                elif null_percentage > 80:
                    validation_results["errors"].append(f"Coluna '{col}' tem {null_percentage:.1f}% de valores nulos (crítico)")
            
            # 3. Verificar se há pelo menos algumas linhas válidas
            valid_rows = len(df) - empty_rows
            if valid_rows == 0:
                validation_results["is_valid"] = False
                validation_results["errors"].append("Nenhuma linha válida encontrada após transformação")
            elif valid_rows < 5:
                validation_results["warnings"].append(f"Apenas {valid_rows} linhas válidas encontradas")
            
            # 4. Calcular score de qualidade
            total_cells = len(df) * len(df.columns)
            null_cells = df.isnull().sum().sum()
            quality_score = ((total_cells - null_cells) / total_cells) * 100 if total_cells > 0 else 0
            validation_results["stats"]["data_quality_score"] = round(quality_score, 2)
            
            # 5. Determinar validade final
            if len(validation_results["errors"]) > 0:
                validation_results["is_valid"] = False
            
            logger.info(f"✅ Validação concluída: {quality_score:.1f}% de qualidade, {len(validation_results['errors'])} erros")
            return validation_results
            
        except Exception as e:
            logger.error(f"❌ Erro na validação: {e}")
            return {
                "is_valid": False,
                "errors": [f"Erro na validação: {str(e)}"],
                "warnings": [],
                "stats": {}
            }
    
    def _generate_transformation_stats(self, df_original: pd.DataFrame, df_transformed: pd.DataFrame, 
                                     column_mapping: List[Dict]) -> Dict[str, Any]:
        """
        Gera estatísticas detalhadas da transformação
        """
        try:
            stats = {
                "columns_summary": {
                    "original_count": len(df_original.columns),
                    "transformed_count": len(df_transformed.columns),
                    "mapped_count": len([m for m in column_mapping if m.get('enabled', True)]),
                    "excluded_count": len([m for m in column_mapping if not m.get('enabled', True)])
                },
                "rows_summary": {
                    "original_count": len(df_original),
                    "transformed_count": len(df_transformed),
                    "rows_maintained": len(df_transformed) == len(df_original)
                },
                "data_types_applied": {},
                "transformation_log": []
            }
            
            # Conta tipos de dados aplicados
            for mapping in column_mapping:
                if mapping.get('enabled', True):
                    data_type = mapping.get('data_type', 'TEXT')
                    stats["data_types_applied"][data_type] = stats["data_types_applied"].get(data_type, 0) + 1
            
            # Log de transformações
            for mapping in column_mapping:
                if mapping.get('enabled', True):
                    stats["transformation_log"].append({
                        "csv_column": mapping.get('csv_column'),
                        "db_column": mapping.get('db_column'),
                        "data_type": mapping.get('data_type', 'TEXT'),
                        "status": "mapped"
                    })
                else:
                    stats["transformation_log"].append({
                        "csv_column": mapping.get('csv_column'),
                        "status": "excluded"
                    })
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar estatísticas: {e}")
            return {"error": str(e)}
    
    def process_step3_load_data(self, file_path: str, column_mapping: List[Dict], 
                               target_table: str, skip_first_line: bool = False, 
                               batch_size: int = 1000, auto_remove_outliers: bool = True) -> Dict[str, Any]:
        """
        Carrega dados finais no banco de dados após validação do preview
        Inclui filtragem automática de outliers baseada em tabelas de dimensão
        
        Args:
            file_path: Caminho do arquivo CSV
            column_mapping: Mapeamento de colunas validado
            target_table: Tabela de destino no Supabase
            skip_first_line: Se deve pular primeira linha
            batch_size: Tamanho do batch para inserção
            auto_remove_outliers: Se deve remover automaticamente outliers de dimensões
            
        Returns:
            Resultado da operação de carregamento
        """
        try:
            logger.info(f"🚀 Iniciando carregamento final dos dados na tabela {target_table}")
            
            # 1. Carregar e transformar dados
            df_original = self._load_and_prepare_dataframe(file_path, skip_first_line)
            df_transformed = self._apply_column_mapping_transformations(df_original, column_mapping)
            
            # 2. Filtragem automática de outliers por dimensões
            outlier_results = []
            if auto_remove_outliers:
                df_transformed = self._auto_filter_dimension_outliers(df_transformed, outlier_results)
            
            # 3. Validação final antes do carregamento
            validation_results = self._validate_transformed_data(df_transformed)
            if not validation_results.get('is_valid', False):
                raise Exception(f"Dados inválidos para carregamento: {validation_results.get('errors', [])}")
            
            # 4. Verificar conexão com Supabase
            if not self.supabase:
                raise Exception("Conexão com Supabase não disponível")
            
            # 5. Carregar dados em batches
            total_rows = len(df_transformed)
            loaded_rows = 0
            failed_rows = 0
            load_errors = []
            
            logger.info(f"📤 Carregando {total_rows} linhas em batches de {batch_size}")
            
            for start_idx in range(0, total_rows, batch_size):
                end_idx = min(start_idx + batch_size, total_rows)
                batch_df = df_transformed.iloc[start_idx:end_idx]
                
                try:
                    # Converter DataFrame para lista de dicionários
                    batch_data = batch_df.fillna(None).to_dict('records')
                    
                    # Inserir batch no Supabase
                    result = self.supabase.table(target_table).insert(batch_data).execute()
                    
                    if result.data:
                        batch_loaded = len(result.data)
                        loaded_rows += batch_loaded
                        logger.info(f"✅ Batch {start_idx//batch_size + 1}: {batch_loaded} linhas carregadas")
                    else:
                        failed_rows += len(batch_data)
                        load_errors.append(f"Batch {start_idx//batch_size + 1}: Resposta vazia do Supabase")
                        
                except Exception as batch_error:
                    failed_rows += len(batch_df)
                    error_msg = f"Batch {start_idx//batch_size + 1}: {str(batch_error)}"
                    load_errors.append(error_msg)
                    logger.error(f"❌ {error_msg}")
            
            # 6. Calcular estatísticas finais
            success_rate = (loaded_rows / total_rows) * 100 if total_rows > 0 else 0
            
            # 7. Resultado final
            result = {
                "success": loaded_rows > 0,
                "load_summary": {
                    "target_table": target_table,
                    "total_rows_processed": total_rows,
                    "rows_loaded": loaded_rows,
                    "rows_failed": failed_rows,
                    "success_rate_percent": round(success_rate, 2),
                    "batches_processed": (total_rows // batch_size) + (1 if total_rows % batch_size > 0 else 0),
                    "loaded_at": datetime.now().isoformat()
                },
                "outlier_filtering": outlier_results,
                "validation_results": validation_results,
                "load_errors": load_errors[:10],  # Primeiros 10 erros apenas
                "column_mapping_used": column_mapping,
                "recommendations": self._generate_load_recommendations(success_rate, load_errors, outlier_results)
            }
            
            if loaded_rows == total_rows:
                logger.info(f"🎉 Carregamento 100% bem-sucedido: {loaded_rows} linhas em {target_table}")
            elif loaded_rows > 0:
                logger.warning(f"⚠️ Carregamento parcial: {loaded_rows}/{total_rows} linhas em {target_table}")
            else:
                logger.error(f"❌ Falha no carregamento: 0 linhas carregadas em {target_table}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro crítico no carregamento: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "load_summary": {
                    "target_table": target_table,
                    "total_rows_processed": 0,
                    "rows_loaded": 0,
                    "rows_failed": 0,
                    "success_rate_percent": 0.0,
                    "loaded_at": datetime.now().isoformat()
                }
            }
    
    def _auto_filter_dimension_outliers(self, df: pd.DataFrame, outlier_results: List[Dict]) -> pd.DataFrame:
        """
        Aplica filtragem automática de outliers baseada em tabelas de dimensão conhecidas
        """
        try:
            logger.info(f"🧹 Iniciando filtragem automática de outliers por dimensão")
            
            # Mapeamento de colunas para suas respectivas tabelas de dimensão
            # Por enquanto, apenas dim_curral para testes iniciais
            dimension_mappings = {
                'id_curral': 'dim_curral',
                'curral': 'dim_curral'
            }
            
            df_filtered = df.copy()
            total_outliers_removed = 0
            
            # Verificar cada coluna do DataFrame
            for column in df.columns:
                column_lower = column.lower()
                
                # Verificar se a coluna corresponde a alguma dimensão
                dimension_table = None
                for pattern, table in dimension_mappings.items():
                    if pattern in column_lower:
                        dimension_table = table
                        break
                
                if dimension_table:
                    logger.info(f"🔍 Validando coluna '{column}' contra {dimension_table}")
                    
                    # Aplicar filtragem de outliers
                    filter_result = self.filter_outliers_by_dimension(
                        df_filtered, column, dimension_table, remove_outliers=True
                    )
                    
                    if filter_result.get('success', False):
                        df_filtered = filter_result.get('filtered_dataframe', df_filtered)
                        outliers_removed = filter_result.get('outliers_removed', 0)
                        total_outliers_removed += outliers_removed
                        
                        # Adicionar resultado às estatísticas
                        outlier_results.append({
                            "column": column,
                            "dimension_table": dimension_table,
                            "outliers_removed": outliers_removed,
                            "outlier_percentage": filter_result.get('outlier_percentage', 0.0),
                            "outlier_values_sample": filter_result.get('outlier_values', [])[:5],
                            "recommendations": filter_result.get('recommendations', [])
                        })
                        
                        if outliers_removed > 0:
                            logger.info(f"🧹 '{column}': {outliers_removed} outliers removidos")
                    else:
                        logger.warning(f"⚠️ Erro na filtragem de '{column}': {filter_result.get('error', 'Erro desconhecido')}")
            
            logger.info(f"✅ Filtragem automática concluída: {total_outliers_removed} outliers removidos total")
            logger.info(f"📊 DataFrame final: {len(df_filtered)} linhas (era {len(df)})")
            
            return df_filtered
            
        except Exception as e:
            logger.error(f"❌ Erro na filtragem automática de outliers: {str(e)}")
            # Em caso de erro, retorna DataFrame original
            return df
    
    def _generate_load_recommendations(self, success_rate: float, load_errors: List[str], 
                                     outlier_results: List[Dict] = None) -> List[str]:
        """
        Gera recomendações baseadas no resultado do carregamento e filtragem de outliers
        """
        recommendations = []
        
        # Recomendações sobre filtragem de outliers
        if outlier_results:
            total_outliers = sum(r.get('outliers_removed', 0) for r in outlier_results)
            dimensions_filtered = len([r for r in outlier_results if r.get('outliers_removed', 0) > 0])
            
            if total_outliers > 0:
                recommendations.append(f"🧹 {total_outliers} outliers removidos automaticamente de {dimensions_filtered} dimensões")
                
                # Detalhes por dimensão
                for result in outlier_results:
                    if result.get('outliers_removed', 0) > 0:
                        recommendations.append(f"   • {result['column']}: {result['outliers_removed']} outliers ({result.get('outlier_percentage', 0):.1f}%)")
            else:
                recommendations.append("✅ Nenhum outlier encontrado - dados 100% compatíveis com dimensões")
        
        # Recomendações sobre carregamento
        if success_rate == 100:
            recommendations.append("✅ Carregamento perfeito! Todos os dados foram inseridos com sucesso.")
        elif success_rate >= 90:
            recommendations.append("✅ Carregamento quase perfeito! Verifique os poucos erros reportados.")
        elif success_rate >= 70:
            recommendations.append("⚠️ Carregamento parcial. Revise as validações de dados e mapeamentos.")
        else:
            recommendations.append("❌ Taxa de sucesso baixa. Verifique conectividade, permissões e estrutura da tabela.")
        
        # Análise dos erros comuns
        if load_errors:
            error_text = " ".join(load_errors[:5]).lower()
            
            if "permission" in error_text or "authorization" in error_text:
                recommendations.append("🔐 Verifique as permissões da service role key do Supabase.")
            
            if "duplicate" in error_text or "unique" in error_text:
                recommendations.append("🔑 Possíveis violações de chave única. Verifique dados duplicados.")
            
            if "data type" in error_text or "invalid" in error_text:
                recommendations.append("📊 Problemas de tipo de dados. Revise as conversões de tipo.")
            
            if "timeout" in error_text or "connection" in error_text:
                recommendations.append("🌐 Problemas de conectividade. Considere batches menores.")
        
        return recommendations
    
    def filter_outliers_by_dimension(self, df: pd.DataFrame, column_name: str, 
                                   dimension_table: str, lookup_column: str = None,
                                   remove_outliers: bool = True) -> Dict[str, Any]:
        """
        Filtra outliers baseado na validação contra tabela de dimensão
        Remove automaticamente registros que não existem na dimensão (outliers)
        
        Args:
            df: DataFrame com os dados
            column_name: Nome da coluna no DataFrame para validar
            dimension_table: Nome da tabela de dimensão (ex: 'dim_curral')
            lookup_column: Coluna de busca na dimensão (ex: 'id_curral')
            remove_outliers: Se deve remover outliers automaticamente
            
        Returns:
            Resultado da filtragem com DataFrame limpo e estatísticas
        """
        try:
            logger.info(f"🔍 Filtrando outliers da coluna '{column_name}' contra {dimension_table}")
            
            if column_name not in df.columns:
                return {
                    "success": False,
                    "error": f"Coluna '{column_name}' não encontrada no DataFrame",
                    "original_rows": len(df),
                    "filtered_rows": len(df)
                }
            
            # Obter valores únicos da coluna
            column_values = df[column_name].dropna().astype(str).tolist()
            
            if not column_values:
                logger.warning(f"⚠️ Nenhum valor encontrado na coluna '{column_name}'")
                return {
                    "success": True,
                    "original_rows": len(df),
                    "filtered_rows": len(df),
                    "outliers_removed": 0,
                    "filtered_dataframe": df.copy(),
                    "outlier_values": [],
                    "validation_summary": "Coluna vazia, nenhum outlier para remover"
                }
            
            # Validar contra tabela de dimensão
            validation_result = self.validate_against_dimension_table(
                column_values, dimension_table, lookup_column
            )
            
            if not validation_result.get('success', False):
                return {
                    "success": False,
                    "error": f"Erro na validação: {validation_result.get('error', 'Erro desconhecido')}",
                    "original_rows": len(df),
                    "filtered_rows": len(df)
                }
            
            # Obter valores válidos e inválidos
            valid_values = set(validation_result.get('valid_values', []))
            invalid_values = validation_result.get('invalid_values', [])
            
            original_rows = len(df)
            
            if remove_outliers and invalid_values:
                # Filtrar DataFrame removendo outliers
                df_filtered = df[df[column_name].astype(str).isin(valid_values)].copy()
                outliers_removed = original_rows - len(df_filtered)
                
                logger.info(f"🧹 Outliers removidos: {outliers_removed} registros ({len(invalid_values)} valores únicos inválidos)")
                
            else:
                df_filtered = df.copy()
                outliers_removed = 0
                
                if invalid_values:
                    logger.info(f"⚠️ Encontrados {len(invalid_values)} valores inválidos, mas remoção está desabilitada")
            
            # Resultado da filtragem
            filter_result = {
                "success": True,
                "dimension_table": dimension_table,
                "lookup_column": validation_result.get('lookup_column'),
                "column_validated": column_name,
                "original_rows": original_rows,
                "filtered_rows": len(df_filtered),
                "outliers_removed": outliers_removed,
                "outlier_percentage": round((outliers_removed / original_rows) * 100, 2) if original_rows > 0 else 0.0,
                "filtered_dataframe": df_filtered,
                "outlier_values": invalid_values[:20],  # Primeiros 20 valores inválidos
                "validation_summary": validation_result.get('validation_summary', {}),
                "recommendations": self._generate_outlier_filter_recommendations(
                    outliers_removed, original_rows, len(invalid_values)
                ),
                "filtered_at": datetime.now().isoformat()
            }
            
            if outliers_removed > 0:
                logger.info(f"✅ Filtragem concluída: {outliers_removed} outliers removidos ({filter_result['outlier_percentage']}%)")
            else:
                logger.info(f"✅ Filtragem concluída: Nenhum outlier encontrado")
            
            return filter_result
            
        except Exception as e:
            logger.error(f"❌ Erro na filtragem de outliers: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "original_rows": len(df) if 'df' in locals() else 0,
                "filtered_rows": len(df) if 'df' in locals() else 0,
                "filtered_dataframe": df.copy() if 'df' in locals() else pd.DataFrame()
            }
    
    def _generate_outlier_filter_recommendations(self, outliers_removed: int, 
                                               original_rows: int, unique_invalid: int) -> List[str]:
        """
        Gera recomendações baseadas na filtragem de outliers
        """
        recommendations = []
        
        if outliers_removed == 0:
            recommendations.append("✅ Excelente! Nenhum outlier encontrado - todos os dados são válidos")
        else:
            outlier_percentage = (outliers_removed / original_rows) * 100 if original_rows > 0 else 0
            
            if outlier_percentage < 5:
                recommendations.append(f"✅ Poucos outliers removidos ({outlier_percentage:.1f}%) - dados de boa qualidade")
            elif outlier_percentage < 15:
                recommendations.append(f"⚠️ Outliers moderados removidos ({outlier_percentage:.1f}%) - qualidade aceitável")
            else:
                recommendations.append(f"❌ Muitos outliers removidos ({outlier_percentage:.1f}%) - verifique qualidade dos dados origem")
            
            recommendations.append(f"📊 {outliers_removed} registros com {unique_invalid} valores únicos inválidos foram removidos")
            
            if outlier_percentage > 20:
                recommendations.append("💡 Considere revisar o processo de coleta de dados ou criar valores faltantes na dimensão")
        
        return recommendations
    
    def validate_against_dimension_table(self, data_values: List[str], dimension_table: str, 
                                       lookup_column: str = None) -> Dict[str, Any]:
        """
        Valida dados contra uma tabela de dimensão (ex: dim_curral)
        
        Args:
            data_values: Lista de valores para validar
            dimension_table: Nome da tabela de dimensão (ex: 'dim_curral')
            lookup_column: Coluna de busca na dimensão (ex: 'id_curral')
            
        Returns:
            Resultado da validação com valores válidos/inválidos
        """
        try:
            logger.info(f"🔍 Validando {len(data_values)} valores contra {dimension_table}")
            
            if not self.supabase:
                logger.warning("❌ Conexão Supabase não disponível para validação")
                return {
                    "success": False,
                    "error": "Conexão com banco não disponível",
                    "validation_mode": "simulation"
                }
            
            # Se não especificou coluna, tenta detectar automaticamente
            if not lookup_column:
                lookup_column = self._detect_dimension_key_column(dimension_table)
            
            # Remove valores duplicados para eficiência
            unique_values = list(set([str(v).strip() for v in data_values if v and str(v).strip()]))
            
            if not unique_values:
                return {
                    "success": True,
                    "total_values": len(data_values),
                    "unique_values": 0,
                    "valid_values": [],
                    "invalid_values": [],
                    "validation_summary": {
                        "valid_count": 0,
                        "invalid_count": 0,
                        "valid_percentage": 0.0
                    }
                }
            
            # Buscar valores existentes na dimensão
            logger.info(f"🔍 Consultando {lookup_column} em {dimension_table}")
            
            # Faz consulta por batches para evitar URLs muito longas
            valid_values = set()
            batch_size = 50
            
            for i in range(0, len(unique_values), batch_size):
                batch = unique_values[i:i + batch_size]
                
                try:
                    # Consulta no Supabase
                    result = self.supabase.table(dimension_table)\
                        .select(lookup_column)\
                        .in_(lookup_column, batch)\
                        .execute()
                    
                    if result.data:
                        batch_valid = {str(row[lookup_column]) for row in result.data}
                        valid_values.update(batch_valid)
                        
                except Exception as batch_error:
                    logger.warning(f"⚠️ Erro no batch {i//batch_size + 1}: {batch_error}")
                    continue
            
            # Calcular resultados
            invalid_values = [v for v in unique_values if v not in valid_values]
            valid_count = len(valid_values)
            invalid_count = len(invalid_values)
            total_unique = len(unique_values)
            
            validation_result = {
                "success": True,
                "dimension_table": dimension_table,
                "lookup_column": lookup_column,
                "total_values": len(data_values),
                "unique_values": total_unique,
                "valid_values": sorted(list(valid_values)),
                "invalid_values": sorted(invalid_values),
                "validation_summary": {
                    "valid_count": valid_count,
                    "invalid_count": invalid_count,
                    "valid_percentage": round((valid_count / total_unique) * 100, 2) if total_unique > 0 else 0.0
                },
                "recommendations": self._generate_dimension_validation_recommendations(
                    valid_count, invalid_count, dimension_table, invalid_values[:5]
                ),
                "validated_at": datetime.now().isoformat()
            }
            
            logger.info(f"✅ Validação concluída: {valid_count}/{total_unique} válidos ({validation_result['validation_summary']['valid_percentage']}%)")
            return validation_result
            
        except Exception as e:
            logger.error(f"❌ Erro na validação de dimensão: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "dimension_table": dimension_table,
                "lookup_column": lookup_column,
                "validated_at": datetime.now().isoformat()
            }
    
    def _detect_dimension_key_column(self, dimension_table: str) -> str:
        """
        Detecta automaticamente a coluna chave de uma tabela de dimensão
        """
        # Padrões comuns para chaves de dimensão
        # Por enquanto, apenas dim_curral para implementação inicial
        common_patterns = {
            'dim_curral': 'id_curral'
        }
        
        # Tenta padrão conhecido primeiro
        if dimension_table in common_patterns:
            return common_patterns[dimension_table]
        
        # Tenta detectar pela estrutura da tabela
        try:
            schema = self.get_supabase_table_schema(dimension_table)
            if schema and schema.get('columns'):
                columns = schema['columns']
                
                # Procura por colunas que terminam com _id ou id_
                for col in columns:
                    col_name = col.get('column_name', '').lower()
                    if col_name.endswith('_id') or col_name.startswith('id_'):
                        return col_name
                
                # Fallback: primeira coluna
                if columns:
                    return columns[0].get('column_name', 'id')
                    
        except Exception as e:
            logger.warning(f"⚠️ Erro ao detectar coluna chave para {dimension_table}: {e}")
        
        # Fallback final
        return 'id'
    
    def _generate_dimension_validation_recommendations(self, valid_count: int, invalid_count: int, 
                                                     dimension_table: str, sample_invalid: List[str]) -> List[str]:
        """
        Gera recomendações baseadas na validação de dimensão
        """
        recommendations = []
        total = valid_count + invalid_count
        valid_percentage = (valid_count / total) * 100 if total > 0 else 0
        
        if valid_percentage == 100:
            recommendations.append(f"✅ Perfeito! Todos os valores existem em {dimension_table}")
        elif valid_percentage >= 90:
            recommendations.append(f"✅ Excelente! {valid_percentage:.1f}% dos valores são válidos")
            recommendations.append(f"💡 Verifique os {invalid_count} valores inválidos antes de prosseguir")
        elif valid_percentage >= 70:
            recommendations.append(f"⚠️ Atenção! {valid_percentage:.1f}% dos valores são válidos")
            recommendations.append(f"❌ {invalid_count} valores não existem em {dimension_table}")
            recommendations.append("💡 Considere criar os valores faltantes na dimensão ou corrigir os dados")
        else:
            recommendations.append(f"❌ Problema crítico! Apenas {valid_percentage:.1f}% dos valores são válidos")
            recommendations.append(f"🔍 Verifique se a coluna está sendo mapeada corretamente")
            recommendations.append("💡 Possível erro no mapeamento ou dados muito diferentes da dimensão")
        
        # Exemplos de valores inválidos
        if sample_invalid:
            recommendations.append(f"📝 Exemplos de valores inválidos: {', '.join(sample_invalid[:3])}")
        
        return recommendations


def main():
    """Função principal para teste"""
    import argparse
    
    parser = argparse.ArgumentParser(description='ConectaBoi ETL Inteligente')
    parser.add_argument('file_path', help='Caminho do arquivo CSV')
    parser.add_argument('--skip-first-line', action='store_true', 
                       help='Pular primeira linha e usar segunda como cabeçalho')
    parser.add_argument('--config', help='Arquivo de configuração JSON (opcional)')
    parser.add_argument('--output', help='Arquivo de saída (opcional)')
    
    args = parser.parse_args()
    
    # Inicializar ETL
    etl = ConectaBoiETL(args.config)
    
    # Processar arquivo
    result = etl.process_file(args.file_path, args.skip_first_line)
    
    if result['success']:
        print(f"✅ Processamento concluído!")
        print(f"📊 Estrutura detectada: {result['structure']['detected_file_type']}")
        print(f"📝 Colunas: {result['structure']['column_count']}")
        print(f"📈 Linhas processadas: {result['total_rows']}")
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False, default=str)
            print(f"💾 Resultado salvo em: {args.output}")
        
    else:
        print(f"❌ Erro no processamento: {result['error']}")


if __name__ == "__main__":
    main()
