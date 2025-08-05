# ConectaBoi ETL - Estrutura do Projeto Definitiva

## 📁 Estrutura de Diretórios

```
ConectaBoi-ETL/
├── 📁 backend/              # Backend Python (API + ETL)
│   ├── 📁 api/              # FastAPI endpoints
│   │   ├── __init__.py
│   │   └── main.py          # API principal
│   ├── 📁 config/           # Configurações
│   │   ├── __init__.py
│   │   └── settings.py      # Settings com Pydantic
│   ├── 📁 etl/              # Engine ETL inteligente
│   │   ├── __init__.py
│   │   └── conectaboi_etl_smart.py  # ETL principal
│   ├── 📁 utils/            # Utilitários
│   │   ├── __init__.py
│   │   └── helpers.py       # Funções auxiliares
│   ├── __init__.py
│   └── requirements.txt     # Dependências backend
├── 📁 src/                  # Frontend React + TypeScript
│   ├── 📁 components/       # Componentes React
│   ├── 📁 hooks/            # Custom hooks
│   ├── 📁 integrations/     # Integrações (Supabase)
│   ├── 📁 lib/              # Bibliotecas utilitárias
│   └── 📁 pages/            # Páginas da aplicação
├── 📁 data/                 # Dados e arquivos
│   ├── 📁 input/            # Arquivos de entrada (CSV)
│   ├── 📁 processed/        # Arquivos processados
│   └── 📁 logs/             # Logs da aplicação
├── 📁 tests/                # Testes automatizados
│   ├── __init__.py
│   └── test_etl_smart.py    # Testes do ETL
├── 📁 docs/                 # Documentação
│   ├── RESUMO_EXECUTIVO.md
│   ├── BRIEFING_COORDENADOR.md
│   └── PYTHON_SETUP.md
├── 📁 supabase/             # Configuração Supabase
├── 📁 venv_etl/             # Ambiente virtual Python
├── .env                     # Variáveis de ambiente (protegido)
├── .gitignore              # Arquivos ignorados pelo Git
├── start_api.py            # Script para inicializar API
├── package.json            # Dependências frontend
├── requirements.txt        # Dependências Python globais
└── README.md               # Documentação principal
```

## 🚀 Como Executar

### 1. Frontend (React + Vite)

```bash
npm run dev
```

### 2. Backend (FastAPI)

```bash
python start_api.py
```

### 3. Ambiente Virtual

```bash
# Ativar ambiente virtual
.\venv_etl\Scripts\Activate.ps1

# Instalar dependências
pip install -r backend\requirements.txt
```

## 🔧 Componentes Principais

### Backend API

- **FastAPI**: Framework web moderno para Python
- **Endpoints**:
  - `/etl/detect-structure` - Detecta estrutura CSV
  - `/etl/auto-mapping` - Gera mapeamento automático
  - `/etl/process` - Processa arquivos ETL
  - `/etl/tables` - Lista tabelas disponíveis

### ETL Inteligente

- **Detecção automática** de estrutura CSV
- **Mapeamento inteligente** para tabelas Supabase
- **Validação** de dados integrada
- **Processamento em lote** otimizado

### Frontend React

- **Interface** moderna e responsiva
- **Upload** de arquivos com drag & drop
- **Configuração** step-by-step do ETL
- **Monitoramento** em tempo real

## 🔒 Segurança

- Arquivo `.env` protegido pelo `.gitignore`
- Chaves de API isoladas no backend
- Validação rigorosa de entrada de dados

## 📊 Banco de Dados (Supabase)

- **animais_staging**: Dados dos animais
- **lotes_staging**: Informações dos lotes
- **racoes_staging**: Dados das rações
- **consumo_staging**: Consumo alimentar
- **desempenho_staging**: Performance dos animais

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Python 3.12, FastAPI, Pandas
- **Database**: PostgreSQL (Supabase)
- **Deploy**: Pronto para produção
