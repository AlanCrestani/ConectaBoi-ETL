"""
ConectaBoi ETL - API Principal
FastAPI application para interface com o sistema ETL inteligente
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import sys
import os
import logging
import json
from pathlib import Path
from datetime import datetime

# Adiciona o diretório backend ao path para imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from etl.conectaboi_etl_smart import ConectaBoiETL
from config.settings import get_settings

# Modelos Pydantic
class ProcessStep1Request(BaseModel):
    """Modelo para requisição de processamento da Etapa 1"""
    file_id: str
    skip_first_line: bool = False
    selected_table: Optional[str] = None
    schema_sql: Optional[str] = None

class ProcessStep2PreviewRequest(BaseModel):
    """Modelo para requisição de preview da Etapa 2"""
    file_id: str
    column_mapping: list
    skip_first_line: bool = False
    preview_rows: int = 20

class ColumnMapping(BaseModel):
    """Modelo para mapeamento de coluna"""
    csv_column: str
    db_column: str
    enabled: bool = True
    data_type: str = "TEXT"

class ProcessStep3LoadRequest(BaseModel):
    """Modelo para requisição de carregamento final da Etapa 3"""
    file_id: str
    column_mapping: list
    target_table: str
    skip_first_line: bool = False
    batch_size: int = 1000
    auto_remove_outliers: bool = True  # Novo parâmetro para filtragem automática

class ValidateDimensionRequest(BaseModel):
    """Modelo para validação contra tabela de dimensão"""
    file_id: str
    csv_column: str
    dimension_table: str
    lookup_column: Optional[str] = None
    skip_first_line: bool = False

class FilterOutliersRequest(BaseModel):
    """Modelo para filtragem de outliers por dimensão"""
    file_id: str
    column_name: str
    dimension_table: str
    lookup_column: Optional[str] = None
    skip_first_line: bool = False
    remove_outliers: bool = True
    
    # Mapeamento de colunas para aplicar antes da filtragem
    column_mapping: Optional[list] = None

# Configuração de logging
import os
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'api.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Inicialização da aplicação
app = FastAPI(
    title="ConectaBoi ETL API",
    description="API para processamento inteligente de dados de confinamento bovino",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8082", "http://localhost:8083", "http://localhost:8084"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instância global do ETL
etl_instance = None

def get_etl_instance():
    """Obtém instância singleton do ETL"""
    global etl_instance
    if etl_instance is None:
        etl_instance = ConectaBoiETL()
    return etl_instance

@app.get("/")
async def root():
    """Endpoint de status da API"""
    return {"message": "ConectaBoi ETL API", "status": "operational"}

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    try:
        etl = get_etl_instance()
        # Teste simples de conexão com Supabase se disponível
        if etl.supabase:
            try:
                # Testa uma query simples
                result = etl.supabase.table('information_schema.tables').select('table_name').limit(1).execute()
                return {"status": "healthy", "database": "connected", "supabase": "operational"}
            except Exception as db_error:
                return {"status": "partial", "database": "connection_issue", "supabase": str(db_error)}
        else:
            return {"status": "healthy", "database": "not_configured", "supabase": "simulated_mode"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=200,  # Mudança: sempre retorna 200 para não quebrar o frontend
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload de arquivo CSV para processamento
    """
    try:
        logger.info(f"Iniciando upload do arquivo: {file.filename}")
        
        # Validar tipo de arquivo
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Apenas arquivos CSV são aceitos")
        
        # Criar pasta temporária se não existir
        temp_dir = Path("../../data/temp")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Gerar nome único para o arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = file.filename.replace(" ", "_")
        file_id = f"{timestamp}_{safe_filename}"
        file_path = temp_dir / file_id
        
        # Salvar arquivo
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Detectar estrutura básica
        etl = get_etl_instance()
        try:
            structure_info = etl.detect_csv_structure(str(file_path))
        except Exception as e:
            logger.warning(f"Erro ao detectar estrutura: {e}")
            structure_info = {"error": str(e), "basic_info": f"Arquivo salvo: {file_path}"}
        
        logger.info(f"Arquivo {file.filename} enviado com sucesso como {file_id}")
        return {
            "success": True,
            "file_id": file_id,
            "file_path": str(file_path),
            "original_filename": file.filename,
            "structure_info": structure_info,
            "message": "Arquivo enviado com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro no upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

@app.post("/process-step2-preview")
async def process_step2_preview(request: ProcessStep2PreviewRequest):
    """
    Processa dados para preview da Etapa 2 quando usuário clica 'Próximo/Preview'
    Aplica mapeamento de colunas, exclui colunas não mapeadas e retorna preview
    """
    try:
        logger.info(f"Processando preview da Etapa 2 para arquivo: {request.file_id}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        etl = get_etl_instance()
        
        # Processar dados conforme mapeamento configurado
        preview_result = etl.process_step2_preview(
            file_path=str(file_path),
            column_mapping=request.column_mapping,
            skip_first_line=request.skip_first_line,
            preview_rows=request.preview_rows
        )
        
        logger.info("Preview da Etapa 2 concluído com sucesso")
        return {
            "success": True,
            "preview_data": preview_result,
            "message": "Preview dos dados transformados gerado com sucesso"
        }
        
    except Exception as e:
        logger.error(f"Erro no preview da Etapa 2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no preview: {str(e)}")

@app.post("/process-step3-load")
async def process_step3_load(request: ProcessStep3LoadRequest):
    """
    Carrega dados finalmente no banco de dados após validação do preview
    """
    try:
        logger.info(f"Carregando dados da Etapa 3 para tabela: {request.target_table}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        etl = get_etl_instance()
        
        # Carregar dados no banco de dados
        load_result = etl.process_step3_load_data(
            file_path=str(file_path),
            column_mapping=request.column_mapping,
            target_table=request.target_table,
            skip_first_line=request.skip_first_line,
            batch_size=request.batch_size,
            auto_remove_outliers=request.auto_remove_outliers
        )
        
        if load_result["success"]:
            logger.info(f"Carregamento concluído: {load_result['load_summary']['rows_loaded']} linhas")
            return {
                "success": True,
                "load_result": load_result,
                "message": f"Dados carregados com sucesso na tabela {request.target_table}"
            }
        else:
            logger.error(f"Falha no carregamento: {load_result.get('error', 'Erro desconhecido')}")
            return {
                "success": False,
                "load_result": load_result,
                "message": "Falha no carregamento dos dados"
            }
        
    except Exception as e:
        logger.error(f"Erro no carregamento da Etapa 3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no carregamento: {str(e)}")

@app.post("/validate-dimension")
async def validate_dimension(request: ValidateDimensionRequest):
    """
    Valida dados de uma coluna contra uma tabela de dimensão
    """
    try:
        logger.info(f"Validando coluna {request.csv_column} contra {request.dimension_table}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        etl = get_etl_instance()
        
        # Carregar dados para extrair valores da coluna
        df = etl._load_and_prepare_dataframe(str(file_path), request.skip_first_line)
        
        if request.csv_column not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Coluna '{request.csv_column}' não encontrada no arquivo"
            )
        
        # Extrair valores únicos da coluna
        column_values = df[request.csv_column].dropna().astype(str).tolist()
        
        # Validar contra tabela de dimensão
        validation_result = etl.validate_against_dimension_table(
            data_values=column_values,
            dimension_table=request.dimension_table,
            lookup_column=request.lookup_column
        )
        
        if validation_result["success"]:
            logger.info(f"Validação concluída: {validation_result['validation_summary']['valid_percentage']}% válidos")
            return {
                "success": True,
                "validation_result": validation_result,
                "message": "Validação de dimensão concluída com sucesso"
            }
        else:
            logger.error(f"Falha na validação: {validation_result.get('error', 'Erro desconhecido')}")
            return {
                "success": False,
                "validation_result": validation_result,
                "message": "Falha na validação de dimensão"
            }
        
    except Exception as e:
        logger.error(f"Erro na validação de dimensão: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na validação: {str(e)}")

@app.post("/filter-outliers")
async def filter_outliers(request: FilterOutliersRequest):
    """
    Filtra outliers baseado em validação contra tabela de dimensão
    Remove automaticamente registros que não existem na dimensão
    """
    try:
        logger.info(f"Filtrando outliers para arquivo: {request.file_id}")
        logger.info(f"Coluna: {request.column_name}, Dimensão: {request.dimension_table}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        # Inicializar ETL
        etl = ConectaBoiETL()
        
        # Carregar dados
        df = etl._load_and_prepare_dataframe(str(file_path), request.skip_first_line)
        
        # Aplicar mapeamento de colunas se fornecido
        if request.column_mapping:
            df = etl._apply_column_mapping_transformations(df, request.column_mapping)
        
        # Verificar se coluna existe
        if request.column_name not in df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Coluna '{request.column_name}' não encontrada no arquivo"
            )
        
        # Filtrar outliers
        filter_result = etl.filter_outliers_by_dimension(
            df=df,
            column_name=request.column_name,
            dimension_table=request.dimension_table,
            lookup_column=request.lookup_column,
            remove_outliers=request.remove_outliers
        )
        
        if filter_result["success"]:
            logger.info(f"Filtragem concluída: {filter_result['outliers_removed']} outliers removidos")
            
            # Salvar DataFrame filtrado se outliers foram removidos
            if filter_result['outliers_removed'] > 0 and request.remove_outliers:
                filtered_df = filter_result['filtered_dataframe']
                filtered_file_path = Path("../../data/temp") / f"filtered_{request.file_id}"
                
                # Salvar arquivo filtrado
                filtered_df.to_csv(filtered_file_path, index=False, encoding='utf-8')
                logger.info(f"Arquivo filtrado salvo: {filtered_file_path}")
                
                filter_result['filtered_file_id'] = f"filtered_{request.file_id}"
            
            return {
                "success": True,
                "filter_result": filter_result,
                "message": f"Filtragem concluída: {filter_result['outliers_removed']} outliers removidos"
            }
        else:
            logger.error(f"Falha na filtragem: {filter_result.get('error', 'Erro desconhecido')}")
            return {
                "success": False,
                "filter_result": filter_result,
                "message": "Falha na filtragem de outliers"
            }
        
    except Exception as e:
        logger.error(f"Erro na filtragem de outliers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na filtragem: {str(e)}")

@app.post("/process-step1")
async def process_step1(request: ProcessStep1Request):
    """
    Processa arquivo da Etapa 1 quando usuário clica 'Próximo'
    """
    try:
        logger.info(f"Processando Etapa 1 para arquivo: {request.file_id}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        etl = get_etl_instance()
        
        # Processar arquivo conforme configurações da Etapa 1
        processed_data = etl.process_step1_complete(
            file_path=str(file_path),
            skip_first_line=request.skip_first_line,
            selected_table=request.selected_table,
            schema_sql=request.schema_sql
        )
        
        logger.info("Processamento da Etapa 1 concluído com sucesso")
        return {
            "success": True,
            "processed_data": processed_data,
            "message": "Arquivo processado com sucesso para Etapa 2"
        }
        
    except Exception as e:
        logger.error(f"Erro no processamento da Etapa 1: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.post("/etl/prepare-for-mapping")
async def prepare_for_mapping(
    file: UploadFile = File(...),
    target_table: str = Form(...),
    skip_first_line: bool = Form(False)
):
    """
    Prepara arquivo CSV completo para etapa de mapeamento:
    - Processa arquivo com UTF-8
    - Exclui primeira linha se necessário 
    - Obtém schema da tabela Supabase
    - Gera mapeamento automático inteligente
    """
    try:
        logger.info(f"Preparando {file.filename} para mapeamento na tabela {target_table}")
        
        # Salva o arquivo temporariamente
        temp_file_path = f"../../data/input/temp_mapping_{file.filename}"
        content = await file.read()
        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        # Processa completamente o arquivo
        etl = get_etl_instance()
        result = etl.process_csv_with_preprocessing(
            file_path=temp_file_path,
            target_table=target_table,
            skip_first_line=skip_first_line
        )
        
        # Remove arquivo temporário
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        if result["success"]:
            logger.info(f"Arquivo preparado com sucesso para mapeamento")
            return {
                "status": "success",
                "message": "Arquivo processado e pronto para mapeamento",
                "data": result
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
        
    except Exception as e:
        logger.error(f"Erro ao preparar arquivo para mapeamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/etl/table-schema/{table_name}")
async def get_table_schema_detailed(table_name: str):
    """
    Retorna schema detalhado de uma tabela específica consultando diretamente o Supabase
    """
    try:
        etl = get_etl_instance()
        schema_info = etl.get_supabase_table_schema(table_name)
        
        return {
            "status": "success",
            "schema": schema_info
        }
    except Exception as e:
        logger.error(f"Erro ao obter schema detalhado da tabela {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/etl/auto-mapping")
async def generate_auto_mapping(
    file: UploadFile = File(...),
    skip_first_line: bool = Form(False),
    target_table: str = Form(...)
):
    """
    Gera mapeamento automático para uma tabela específica
    """
    try:
        logger.info(f"Gerando mapeamento automático para {target_table}")
        
        # Lê o conteúdo do arquivo
        content = await file.read()
        
        # Salva temporariamente o arquivo
        temp_file_path = f"../../data/input/temp_{file.filename}"
        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        # Gera o mapeamento
        etl = get_etl_instance()
        mapping = etl.generate_auto_mapping(temp_file_path, target_table, skip_first_line)
        
        # Remove arquivo temporário
        os.remove(temp_file_path)
        
        logger.info("Mapeamento gerado com sucesso")
        return {
            "status": "success",
            "mapping": mapping
        }
        
    except Exception as e:
        logger.error(f"Erro ao gerar mapeamento: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/etl/process")
async def process_etl(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    """
    Processa um arquivo CSV com configuração específica
    """
    try:
        # Parse da configuração
        config_data = json.loads(config)
        logger.info(f"Processando arquivo {file.filename} com configuração customizada")
        
        # Salva o arquivo de entrada
        input_file_path = f"../../data/input/{file.filename}"
        content = await file.read()
        with open(input_file_path, 'wb') as f:
            f.write(content)
        
        # Processa o arquivo
        etl = get_etl_instance()
        result = etl.process_file(
            file_path=input_file_path,
            target_table=config_data['target_table'],
            column_mapping=config_data['column_mapping'],
            skip_first_line=config_data.get('skip_first_line', False),
            validation_rules=config_data.get('validation_rules', {})
        )
        
        # Move arquivo processado
        processed_file_path = f"../../data/processed/{file.filename}"
        os.rename(input_file_path, processed_file_path)
        
        logger.info(f"Arquivo processado com sucesso: {result['records_processed']} registros")
        return {
            "status": "success",
            "result": result,
            "processed_file": processed_file_path
        }
        
    except Exception as e:
        logger.error(f"Erro no processamento ETL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/etl/tables")
async def get_available_tables():
    """
    Retorna as tabelas disponíveis para ETL
    """
    try:
        etl = get_etl_instance()
        return {
            "status": "success",
            "tables": list(etl.table_schemas.keys())
        }
    except Exception as e:
        logger.error(f"Erro ao obter tabelas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/etl/table-schema/{table_name}")
async def get_table_schema(table_name: str):
    """
    Retorna o schema de uma tabela específica
    """
    try:
        etl = get_etl_instance()
        if table_name not in etl.table_schemas:
            raise HTTPException(status_code=404, detail="Tabela não encontrada")
        
        return {
            "status": "success",
            "schema": etl.table_schemas[table_name]
        }
    except Exception as e:
        logger.error(f"Erro ao obter schema da tabela {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ETLProcessRequest(BaseModel):
    """Modelo para processamento ETL simplificado"""
    file_id: str
    transformations: dict[str, str]
    excluded_columns: list[str]
    excluded_rows: list[int] = []
    mappings: list[dict[str, Any]] = []

class SupabaseUploadRequest(BaseModel):
    """Modelo para upload direto ao Supabase"""
    file_id: str
    table_name: str
    data: list[dict[str, Any]]

@app.post("/etl/process-quick")
async def process_etl_simple(request: ETLProcessRequest):
    """
    Processa arquivo com transformações simples para Quick ETL
    """
    try:
        logger.info(f"Processando ETL simples para arquivo: {request.file_id}")
        
        file_path = Path("../../data/temp") / request.file_id
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Arquivo {request.file_id} não encontrado")
        
        etl = get_etl_instance()
        
        # Carregar dados
        df = etl._load_and_prepare_dataframe(str(file_path), skip_first_line=True)
        
        # Se temos mappings, usar a lógica completa do ETL
        if request.mappings and len(request.mappings) > 0:
            logger.info(f"Aplicando {len(request.mappings)} mapeamentos de coluna")
            logger.info(f"Colunas originais do DataFrame: {list(df.columns)}")
            
            # Converter mappings para formato esperado pelo ETL
            column_mapping = []
            for mapping in request.mappings:
                # Aplicar transformações específicas primeiro se existirem
                if mapping.get('type') == 'derived' and mapping.get('transformations'):
                    csv_col = mapping.get('derivedFrom', mapping.get('csvColumn', ''))
                    if csv_col and csv_col in df.columns:
                        logger.info(f"Aplicando transformações derivadas na coluna '{csv_col}'")
                        for old_val, new_val in mapping['transformations'].items():
                            df[csv_col] = df[csv_col].replace(old_val, new_val)
                            logger.debug(f"  {old_val} → {new_val}")
                
                # Adicionar ao mapeamento no formato correto
                csv_column = mapping.get('csvColumn', '')
                sql_column = mapping.get('sqlColumn', '')
                
                if csv_column and sql_column:
                    column_mapping.append({
                        'csv_column': csv_column,    # Formato esperado pela função
                        'db_column': sql_column,     # Formato esperado pela função  
                        'enabled': True,
                        'data_type': 'TEXT'
                    })
                    logger.debug(f"Mapeamento: '{csv_column}' → '{sql_column}'")
            
            logger.info(f"Total de mapeamentos válidos: {len(column_mapping)}")
            
            # Aplicar mapeamento de colunas usando a função do ETL
            df_result = etl._apply_column_mapping_transformations(df, column_mapping)
            
            logger.info(f"Colunas após mapeamento: {list(df_result.columns)}")
            
        else:
            # Fallback: lógica simples original
            logger.info("Nenhum mapeamento fornecido, usando transformações simples")
            
            # Aplicar transformações
            for old_value, new_value in request.transformations.items():
                df = df.replace(old_value, new_value)
            
            # Remover colunas excluídas
            if request.excluded_columns:
                existing_excluded_columns = [col for col in request.excluded_columns if col in df.columns]
                if existing_excluded_columns:
                    df = df.drop(columns=existing_excluded_columns)
            
            df_result = df
        
        # Remover linhas excluídas
        if request.excluded_rows:
            df_result = df_result.drop(index=request.excluded_rows, errors='ignore')
        
        # Converter para lista de dicionários
        data = df_result.to_dict('records')
        
        logger.info(f"ETL simples concluído: {len(data)} registros processados")
        
        return {
            "status": "success",
            "data": data,
            "message": f"Processamento concluído: {len(data)} registros",
            "summary": {
                "total_records": len(data),
                "transformations_applied": len(request.transformations),
                "columns_removed": len(request.excluded_columns),
                "rows_removed": len(request.excluded_rows),
                "mappings_applied": len(request.mappings) if request.mappings else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Erro no ETL simples: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

@app.post("/supabase/upload")
async def upload_to_supabase(request: SupabaseUploadRequest):
    """
    Faz upload de dados processados diretamente para uma tabela do Supabase
    """
    try:
        etl = get_etl_instance()
        
        if not etl.supabase:
            raise HTTPException(status_code=503, detail="Supabase não configurado")
        
        if not request.data:
            raise HTTPException(status_code=400, detail="Nenhum dado fornecido para upload")
        
        logger.info(f"Iniciando upload para Supabase - Tabela: {request.table_name}, Registros: {len(request.data)}")
        
        # Inserir dados na tabela
        result = etl.supabase.table(request.table_name).insert(request.data).execute()
        
        if hasattr(result, 'data') and result.data:
            records_inserted = len(result.data)
        else:
            records_inserted = len(request.data)  # Fallback
        
        logger.info(f"Upload concluído: {records_inserted} registros inseridos em {request.table_name}")
        
        return {
            "status": "success",
            "message": f"Upload concluído com sucesso",
            "table_name": request.table_name,
            "records_inserted": records_inserted,
            "file_id": request.file_id
        }
        
    except Exception as e:
        logger.error(f"Erro no upload para Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

class SaveScriptRequest(BaseModel):
    """Modelo para salvar script Python"""
    script_name: str
    script_content: str
    config_data: Dict[str, Any]
    description: Optional[str] = None

@app.post("/scripts/save")
async def save_python_script(request: SaveScriptRequest):
    """
    Salva um script Python gerado na pasta generated_scripts
    """
    try:
        # Criar diretório se não existir
        scripts_dir = Path("../../generated_scripts")
        scripts_dir.mkdir(exist_ok=True)
        
        # Salvar script Python
        script_path = scripts_dir / f"{request.script_name}.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(request.script_content)
        
        # Salvar configuração JSON
        config_path = scripts_dir / f"{request.script_name}_config.json"
        config_data = {
            "script_name": request.script_name,
            "created_at": datetime.now().isoformat(),
            "description": request.description,
            "config": request.config_data
        }
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)
        
        # Criar script executável
        exec_script_content = f'''#!/usr/bin/env python3
"""
Script executável para {request.script_name}
Gerado automaticamente pelo ConectaBoi ETL
"""

import sys
import os
from pathlib import Path

# Adicionar diretório backend ao path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

# Executar o script principal
if __name__ == "__main__":
    exec(open(r"{script_path.absolute()}").read())
'''
        
        exec_path = scripts_dir / f"run_{request.script_name}.py"
        with open(exec_path, 'w', encoding='utf-8') as f:
            f.write(exec_script_content)
        
        logger.info(f"Script salvo: {script_path}")
        
        return {
            "status": "success",
            "message": f"Script {request.script_name} salvo com sucesso",
            "paths": {
                "script": str(script_path.absolute()),
                "config": str(config_path.absolute()),
                "executable": str(exec_path.absolute())
            }
        }
        
    except Exception as e:
        logger.error(f"Erro ao salvar script: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scripts/list")
async def list_saved_scripts():
    """
    Lista todos os scripts salvos na pasta generated_scripts
    """
    try:
        scripts_dir = Path("../../generated_scripts")
        if not scripts_dir.exists():
            return {"scripts": []}
        
        scripts = []
        for config_file in scripts_dir.glob("*_config.json"):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)
                    
                script_name = config_data.get("script_name", config_file.stem.replace("_config", ""))
                script_path = scripts_dir / f"{script_name}.py"
                exec_path = scripts_dir / f"run_{script_name}.py"
                
                scripts.append({
                    "name": script_name,
                    "description": config_data.get("description", ""),
                    "created_at": config_data.get("created_at", ""),
                    "exists": {
                        "script": script_path.exists(),
                        "config": config_file.exists(),
                        "executable": exec_path.exists()
                    },
                    "paths": {
                        "script": str(script_path.absolute()),
                        "config": str(config_file.absolute()),
                        "executable": str(exec_path.absolute())
                    }
                })
            except Exception as e:
                logger.error(f"Erro ao ler config {config_file}: {e}")
                continue
        
        return {"scripts": scripts}
        
    except Exception as e:
        logger.error(f"Erro ao listar scripts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
