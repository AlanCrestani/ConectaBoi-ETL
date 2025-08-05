# 🚀 Como Iniciar os Servidores - ConectaBoi ETL

## Frontend (React + Vite)

```bash
cd c:\Projetos\ConectaBoi-ETL
npm run dev
```

**URL:** http://localhost:8083 (configurado no vite.config.ts)

### Alternativas para mudar porta:

```bash
# Porta específica (sintaxe correta para Vite)
npx vite --port 8083

# Ou usando npm com sintaxe correta
npm run dev -- --port 8083

# Variável de ambiente
set PORT=8083 && npm run dev
```

## Backend (FastAPI + Python)

```bash
cd c:\Projetos\ConectaBoi-ETL\backend\api
C:\Projetos\ConectaBoi-ETL\backend\venv\Scripts\python.exe main.py
```

**URL:** http://localhost:8000

### Alternativa Backend (se venv ativo):

```bash
cd c:\Projetos\ConectaBoi-ETL\backend\api
python main.py
```

## Verificar se está funcionando:

- Frontend: Abrir http://localhost:8083
- Backend: Abrir http://localhost:8000 (deve mostrar: `{"message": "ConectaBoi ETL API", "status": "operational"}`)
- API Docs: http://localhost:8000/docs

---

**Pronto!** Sistema 100% operacional 🎯
