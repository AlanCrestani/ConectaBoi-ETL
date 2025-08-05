# 🐂 ConectaBoi-ETL

Sistema ETL (Extract, Transform, Load) inteligente para processamento de dados de confinamento bovino. Solução completa com frontend React + TypeScript e backend Python com FastAPI, integrado ao Supabase PostgreSQL.

## 🚀 Funcionalidades Principais

### 🧠 ETL Inteligente

- **Detecção automática** de estrutura CSV
- **Mapeamento inteligente** para tabelas do banco
- **Validação automática** de tipos de dados
- **Processamento em lote** otimizado

### 🎯 Interface Moderna

- **Upload** de arquivos com drag & drop
- **Configuração step-by-step** do ETL
- **Monitoramento** em tempo real
- **Relatórios** de processamento

### 🔧 API Robusta

- **FastAPI** com documentação automática
- **Endpoints RESTful** para todas as operações
- **Tratamento de erros** avançado
- **Logging** completo

## 🏗️ Arquitetura Técnica

```
Frontend React → FastAPI Backend → ETL Engine → Supabase PostgreSQL
```

### Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Python 3.12, FastAPI, Pandas, Uvicorn
- **Database**: PostgreSQL (Supabase)
- **ETL**: Engine inteligente customizado

## 📁 Estrutura do Projeto

```
ConectaBoi-ETL/
├── backend/              # Backend Python (API + ETL)
│   ├── api/              # FastAPI endpoints
│   ├── config/           # Configurações
│   ├── etl/              # Engine ETL inteligente
│   └── utils/            # Utilitários
├── src/                  # Frontend React + TypeScript
├── data/                 # Dados e arquivos (input/processed/logs)
├── tests/                # Testes automatizados
├── docs/                 # Documentação
└── venv_etl/             # Ambiente virtual Python
```

## 🚀 Como Executar

### 1. Configurar Ambiente Python

```bash
# Ativar ambiente virtual
.env_etlcriptsctivate.ps1

# Instalar dependências backend
pip install -r backend/requirements.txt
```

### 2. Iniciar Backend API

```bash
cd c:\Projetos\ConectaBoi-ETL\backend\api
python main.py
```

Acesse: http://localhost:8000/docs

### 3. Iniciar Frontend

```bash
cd c:\Projetos\ConectaBoi-ETL
npm install
npm run dev
```

Acesse: http://localhost:8083

## 📊 Banco de Dados (Supabase)

### Tabelas ETL

- **animais_staging**: Dados dos animais em confinamento
- **lotes_staging**: Informações dos lotes
- **racoes_staging**: Dados das rações
- **consumo_staging**: Registro de consumo alimentar
- **desempenho_staging**: Performance dos animais

## 🔧 Endpoints da API

- `GET /` - Status da API
- `GET /health` - Verificação de saúde
- `POST /etl/detect-structure` - Detecta estrutura CSV
- `POST /etl/auto-mapping` - Gera mapeamento automático
- `POST /etl/process` - Processa arquivos ETL
- `GET /etl/tables` - Lista tabelas disponíveis
- `GET /etl/table-schema/{table}` - Schema de tabela específica

## 🔒 Segurança

- Arquivo `.env` protegido pelo `.gitignore`
- Chaves de API isoladas no backend
- Validação rigorosa de entrada de dados
- Sanitização de nomes de arquivos

## 📚 Documentação Adicional

- [📋 Estrutura Definitiva](docs/ESTRUTURA_DEFINITIVA.md)
- [👔 Resumo Executivo](docs/RESUMO_EXECUTIVO.md)
- [🎯 Briefing Coordenador](docs/BRIEFING_COORDENADOR.md)
- [🐍 Setup Python](docs/PYTHON_SETUP.md)

## 🤝 Contribuição

Este projeto utiliza uma arquitetura moderna e escalável, pronto para produção com todas as melhores práticas implementadas.

---

**Desenvolvido com ❤️ para otimizar o agronegócio brasileiro**
