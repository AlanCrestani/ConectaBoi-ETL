# 🔧 Correção: Mapeamento de Colunas no Quick ETL

## 🚨 Problema Identificado

O **Quick ETL** estava usando os **nomes das colunas do arquivo original** ao invés dos **nomes mapeados** configurados na segunda tela do ETL.

### Exemplo do Problema:
- **Arquivo CSV**: Coluna "CURRAL"
- **Mapeamento (Tela 2)**: "CURRAL" → "id_curral" 
- **Quick ETL (ANTES)**: Enviava "CURRAL" ❌
- **Quick ETL (DEPOIS)**: Envia "id_curral" ✅

## ✅ Solução Implementada

### 1. **Frontend: ETLConfigStep3.tsx**
```typescript
// ANTES: selectedConfig não tinha mappings
const [selectedConfig, setSelectedConfig] = useState<{
  transformations: Record<string, string>;
  removedColumns: string[];
  // ... outros campos
}>

// DEPOIS: selectedConfig inclui mappings
const [selectedConfig, setSelectedConfig] = useState<{
  transformations: Record<string, string>;
  removedColumns: string[];
  mappings: ColumnMapping[]; // ✅ Adicionado
  // ... outros campos
}>
```

### 2. **Frontend: QuickETL.tsx**
```typescript
// Agora envia mappings para o backend
const etlConfig = {
  file_id: uploadResult.file_id,
  transformations: savedConfig.transformations,
  excluded_columns: savedConfig.removedColumns,
  excluded_rows: [],
  mappings: savedConfig.mappings, // ✅ Adicionado
};
```

### 3. **Backend: main.py**
```python
class ETLProcessRequest(BaseModel):
    file_id: str
    transformations: dict[str, str]
    excluded_columns: list[str]
    excluded_rows: list[int] = []
    mappings: list[dict[str, Any]] = []  # ✅ Adicionado

@app.post("/etl/process-quick")
async def process_etl_simple(request: ETLProcessRequest):
    # Se temos mappings, usar a lógica completa do ETL
    if request.mappings:
        # 1. Aplicar transformações derivadas (ENF01 -> 76)
        # 2. Aplicar mapeamento de colunas (CSV -> SQL)
        df_result = etl._apply_column_mapping_transformations(df, column_mapping)
    # ... resto da lógica
```

## 🔄 Fluxo Corrigido

### Antes (❌ Problema):
1. Carrega arquivo CSV
2. Aplica transformações simples
3. **Mantém nomes de colunas originais**
4. Envia para Supabase com nomes errados

### Depois (✅ Correto):
1. Carrega arquivo CSV
2. **Aplica transformações derivadas** (ENF01 → 76)
3. **Aplica mapeamento de colunas** (CURRAL → id_curral)
4. Remove linhas/colunas excluídas
5. **Envia para Supabase com nomes SQL corretos**

## 🎯 Impacto

### ✅ **Quick ETL agora:**
- Usa os **mesmos mappings** configurados no ETL normal
- Aplica **transformações derivadas** corretamente (ENF01 → 76)
- Envia dados com **nomes de colunas SQL** corretos
- Mantém **compatibilidade total** com a configuração salva

### 🔧 **Funcionalidades preservadas:**
- Sistema de exclusão de linhas
- Transformações de valores
- Remoção de colunas
- Upload direto para Supabase

## 🧪 Como Testar

1. **Configure um ETL completo** (4 etapas)
2. **Salve a configuração** na tela 3
3. **Use Quick ETL** com a configuração salva
4. **Verifique** se os dados chegam no Supabase com colunas corretas

### Exemplo de Teste:
```
CSV: CURRAL | CONSUMO | ENF01
     123    | 45.5    | ENF01

Mapeamento:
- CURRAL → id_curral  
- CONSUMO → consumo_kg
- ENF01 (derivado) → sexo (ENF01 → M)

Resultado Supabase:
id_curral | consumo_kg | sexo
123       | 45.5       | M
```

## 📋 Status

- ✅ **Problema identificado e corrigido**
- ✅ **Testes de compilação: OK**
- ✅ **Backend funcionando: OK**
- ✅ **Commit realizado**
- 🟡 **Teste manual pendente**

---

**🎉 Quick ETL agora está 100% alinhado com o mapeamento configurado!**
