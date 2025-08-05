# 🔍 Botão Validar - ConectaBoi ETL

## ✅ Implementado

### 🎯 **Botão "Validar"**

- **Localização:** Step 3 (Preview e Validação)
- **Posição:** Entre "Voltar" e "Salvar Config"
- **Ícone:** CheckCircle2
- **Função:** Executa validação detalhada dos dados

### 📊 **Validação Detalhada**

#### **O que é validado:**

1. **Dados CSV:**

   - Formato válido (array de arrays)
   - Consistência entre headers e dados
   - Número de linhas válidas

2. **Mapeamentos:**

   - Colunas mapeadas existem no CSV
   - Colunas derivadas têm origem válida
   - Tipos de mapeamento corretos

3. **Transformações:**

   - Quantas colunas têm transformações
   - Total de transformações configuradas
   - Syntax das transformações

4. **Linhas Excluídas:**
   - Quantidade de linhas excluídas
   - Linhas válidas restantes
   - Warnings para poucos dados

### 🔍 **Logs Detalhados**

#### **Console Logs:**

```javascript
🔍 VALIDAÇÃO DETALHADA - Iniciando...
🔍 VALIDAÇÃO COMPLETA: {
  safeData: { headers: [...], data: [...], isValid: true, errors: [] },
  originalData: { csvData: [...], csvHeaders: [...] },
  mappings: [...],
  excludedRows: [0, 5, 10],
  validRowCount: 995,
  issues: [],
  warnings: ["Poucas linhas válidas"],
  summary: {
    totalRows: 1000,
    excludedRows: 5,
    validRows: 995,
    totalColumns: 15,
    mappedColumns: 12,
    transformationsCount: 25,
    columnsWithTransformations: 5
  }
}
```

#### **Toast Notifications:**

- ✅ **Sucesso:** "Validação OK! X linhas válidas, Y colunas mapeadas"
- ⚠️ **Problemas:** "X problemas, Y avisos encontrados"

### 🚀 **Validação Automática no "Próximo"**

#### **Fluxo:**

1. **Usuário clica "Gerar Script ETL"**
2. **Sistema executa validação automática**
3. **Se há problemas críticos:**
   - ❌ Bloqueia navegação
   - 🔔 Mostra toast de erro
   - 📝 Log detalhado dos problemas
4. **Se validação OK:**
   - ✅ Permite navegação
   - 📄 Log de sucesso

#### **Logs do Próximo:**

```javascript
🚀 PRÓXIMO STEP - Iniciando validação automática...
🔍 VALIDAÇÃO DETALHADA - Iniciando...
🔍 VALIDAÇÃO COMPLETA: {...}
✅ Validação passou, prosseguindo...
Calling onNext function...
onNext called successfully
```

### 📋 **Problemas Detectados**

#### **Issues (bloqueiam navegação):**

- Dados CSV inválidos
- Mapeamentos para colunas inexistentes
- Colunas derivadas sem origem
- Formato de dados corrompido

#### **Warnings (não bloqueiam):**

- Poucas linhas válidas (< 10)
- Colunas sem mapeamento
- Muitas linhas excluídas

### 🎯 **Interface de Usuário**

#### **Botões na ordem:**

1. **"Voltar"** (outline, ArrowLeft)
2. **"Validar"** (outline, CheckCircle2) ⭐ NOVO
3. **"Salvar Config"** (outline, Download)
4. **"Gerar Script ETL"** (default, ArrowRight)

#### **Feedback Visual:**

- 🔔 **Toast success/error**
- ⚠️ **Alert de dados inválidos** (se houver)
- 📊 **Logs detalhados no console**

## 🚀 **Como Usar**

### **Fluxo Normal:**

1. Configure mapeamentos no Step 2
2. Navegue para Step 3
3. **Clique "Validar"** para verificar tudo
4. Revise alertas/warnings se houver
5. Clique "Gerar Script ETL" para continuar

### **Debug de Problemas:**

1. Abra DevTools (F12)
2. Vá para aba Console
3. Clique "Validar"
4. Analise logs detalhados
5. Corrija problemas identificados

---

**Resultado:** Sistema robusto com validação proativa e logs detalhados! 🎯
