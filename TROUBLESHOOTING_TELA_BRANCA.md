# 🚨 Guia de Troubleshooting - Tela Branca

## 📋 Causas Mais Comuns da Tela Branca:

### 1. **Backend não está rodando**

**Sintoma:** Erro de conexão ao localhost:8000
**Solução:**

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. **Supabase não conectado**

**Sintoma:** Erro de validação dim_curral
**Solução:**

- Configure as variáveis de ambiente:
  ```
  SUPABASE_URL=sua_url_do_supabase
  SUPABASE_KEY=sua_chave_do_supabase
  ```

### 3. **Erro no mapeamento de colunas**

**Sintoma:** Tela branca ao tentar ir para Step 3
**Solução:**

- Verifique se todos os mapeamentos estão preenchidos
- Use o formato correto para transformações: `ENF01 -> 76`

### 4. **JavaScript/React Error**

**Sintoma:** Tela branca sem mensagens
**Solução:**

- Abra o Console do Navegador (F12)
- Procure por erros em vermelho
- Reporte o erro específico

## 🔧 Como Debuggar:

### 1. **Verificar Console do Navegador:**

```
F12 > Console
```

Procure por:

- `ETLConfigStep2 mounted with props:`
- `ETLConfigStep3 mounted with props:`
- `handleStep2Complete called with:`
- Mensagens de erro em vermelho

### 2. **Verificar Backend:**

```powershell
Test-NetConnection -ComputerName localhost -Port 8000
```

### 3. **Verificar Logs de Debug:**

Os logs mostram:

- Quando cada componente é montado
- Que dados estão sendo passados
- Onde o erro está acontecendo

## 🎯 Soluções Rápidas:

### **Se backend não estiver rodando:**

1. Navegue para pasta backend
2. Execute: `python -m uvicorn main:app --reload --port 8000`
3. Teste: http://localhost:8000/docs

### **Se Supabase não estiver conectado:**

1. Desabilite validação dim_curral temporariamente
2. Configure variáveis de ambiente
3. Teste conexão no backend

### **Se tela branca persistir:**

1. Limpe cache do navegador (Ctrl+Shift+R)
2. Feche e abra o navegador
3. Verifique se ports estão livres

## 📞 Como Reportar o Problema:

Quando reportar tela branca, inclua:

1. **Console logs** (F12 > Console)
2. **Network tab** (F12 > Network) - para ver chamadas falhando
3. **Passo onde parou** (Step 1, 2, 3 ou 4)
4. **Se backend está rodando**
5. **Dados que estava tentando processar**
