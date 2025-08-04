# Ambiente Virtual Python - ConectaBoi ETL

## 🐍 Configuração do Ambiente Virtual

### Ambiente Virtual Criado com Sucesso! ✅

- **Localização**: `venv_etl/`
- **Versão Python**: 3.12.4
- **Status**: Configurado e pronto para uso

### 📦 Dependências Instaladas

- `pandas>=2.0.0` - Manipulação de dados CSV/Excel
- `supabase>=2.0.0` - Cliente para banco Supabase
- `python-dotenv>=1.0.0` - Carregamento de variáveis de ambiente
- `openpyxl>=3.1.0` - Leitura de arquivos Excel
- `requests>=2.31.0` - Requisições HTTP

### 🚀 Como Usar

#### 1. Ativar o Ambiente Virtual

```powershell
# No PowerShell (Windows)
.\venv_etl\Scripts\Activate.ps1

# No CMD (Windows)
venv_etl\Scripts\activate.bat

# No Git Bash/Linux/Mac
source venv_etl/bin/activate
```

#### 2. Configurar Variáveis de Ambiente

```powershell
# Copiar arquivo de exemplo
copy .env.example .env

# Editar .env com suas configurações
notepad .env
```

#### 3. Executar Scripts ETL

```powershell
# Exemplo: executar ETL do histórico de consumo
python etl_01_historico_consumo.py

# Ou usando caminho completo
C:/Projetos/ConectaBoi-ETL/venv_etl/Scripts/python.exe etl_01_historico_consumo.py
```

#### 4. Desativar o Ambiente

```powershell
deactivate
```

### 📁 Estrutura de Arquivos Necessária

```
ConectaBoi-ETL/
├── venv_etl/                 # Ambiente virtual
├── .env                      # Configurações (criar baseado em .env.example)
├── requirements.txt          # Dependências Python
├── config/                   # Configurações ETL (criar se necessário)
│   ├── 01_historico_consumo_config.json
│   ├── 02_desvio_carregamento_config.json
│   └── ...
├── C:/conectaboi_csv/        # Arquivos CSV para processar
│   ├── 01_historico_consumo.csv
│   ├── 02_desvio_carregamento.csv
│   └── processed/            # Arquivos processados
└── scripts/                  # Scripts ETL gerados (criar se necessário)
    ├── etl_01_historico_consumo.py
    ├── etl_02_desvio_carregamento.py
    └── ...
```

### 🔧 Comandos Úteis

```powershell
# Verificar pacotes instalados
pip list

# Instalar novo pacote
pip install nome_do_pacote

# Atualizar requirements.txt
pip freeze > requirements.txt

# Reinstalar dependências
pip install -r requirements.txt

# Verificar versão do Python
python --version
```

### ⚠️ Importantes

1. **Sempre ative o ambiente virtual** antes de executar scripts ETL
2. **Configure o arquivo .env** com suas credenciais do Supabase
3. **Crie as pastas necessárias** para CSV e configurações
4. **Mantenha o arquivo .env seguro** (não commitar no Git)

### 🎯 Próximos Passos

1. Configurar o arquivo `.env` com suas credenciais
2. Criar as pastas para CSV (`C:/conectaboi_csv/`)
3. Usar o webapp para gerar configurações ETL
4. Executar os scripts Python gerados
