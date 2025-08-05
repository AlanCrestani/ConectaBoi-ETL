# 🔍 Debug do Quick ETL - Erro 500 Upload Supabase

## 🚨 Problema Relatado
```
:8000/supabase/upload:1 Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Erro no upload para Supabase: Error: Erro no upload para Supabase
```

## ✅ Correções Implementadas

### 1. **Formato dos Mappings**
- **Problema**: Backend esperava `csv_column`/`db_column`, frontend enviava `csvColumn`/`sqlColumn`
- **Solução**: Conversão no backend corrigida

### 2. **Logs de Debug Adicionados**
```python
logger.info(f"Colunas originais do DataFrame: {list(df.columns)}")
logger.info(f"Aplicando transformações derivadas na coluna '{csv_col}'")
logger.info(f"Total de mapeamentos válidos: {len(column_mapping)}")
logger.info(f"Colunas após mapeamento: {list(df_result.columns)}")
```

### 3. **Validações Adicionadas**
- Mappings vazios ou undefined
- Fallback para transformações simples
- Verificação de colunas existentes

## 🧪 Como Testar

### Passo 1: Iniciar Servidores
```bash
# Backend
C:\Projetos\ConectaBoi-ETL\backend\venv\Scripts\python.exe C:\Projetos\ConectaBoi-ETL\backend\api\main.py

# Frontend  
cd c:\Projetos\ConectaBoi-ETL
npm run dev
```

### Passo 2: Configurar ETL Completo
1. Faça upload de um arquivo CSV
2. Configure os mappings na tela 2
3. Salve a configuração na tela 3
4. Carregue a configuração no Quick ETL

### Passo 3: Verificar Logs
**No terminal do backend, procure por:**
```
INFO: Aplicando X mapeamentos de coluna
INFO: Colunas originais do DataFrame: ['COL1', 'COL2', ...]
INFO: Total de mapeamentos válidos: X
INFO: Colunas após mapeamento: ['sql_col1', 'sql_col2', ...]
```

### Passo 4: Debug no Frontend
**No DevTools do navegador:**
```javascript
// Deve aparecer no console:
🔍 Debug ETL Config: {
  file_id: "arquivo.csv",
  transformations: {...},
  excluded_columns: [...],
  mappings: [
    {csvColumn: "COL1", sqlColumn: "sql_col1", type: "direct"},
    // ...
  ]
}
```

## 🔧 Possíveis Causas do Erro 500

### 1. **Mappings Vazios**
- `savedConfig.mappings` é undefined/vazio
- **Solução**: Usar fallback `|| []`

### 2. **Colunas Não Mapeadas**
- Arquivo tem colunas não configuradas
- **Solução**: Verificar se todos os mappings são válidos

### 3. **Erro no Supabase**
- Tabela não existe
- Colunas SQL não existem na tabela
- **Solução**: Verificar schema da tabela `etl_staging_01_historico_consumo`

### 4. **Dados Inválidos**
- Valores que não passam na validação do Supabase
- **Solução**: Aplicar data_type transformations

## 🎯 Próximos Passos

1. **Testar com arquivo real** usando Quick ETL
2. **Verificar logs detalhados** no backend
3. **Confirmar schema da tabela** Supabase
4. **Validar dados antes do upload**

## 📋 Checklist de Debug

- [ ] Backend rodando e logs visíveis
- [ ] Frontend rodando na porta 8083
- [ ] Configuração salva com mappings válidos
- [ ] Quick ETL recebendo mappings corretamente
- [ ] Logs mostrando aplicação dos mappings
- [ ] Colunas finais compatíveis com Supabase
- [ ] Upload bem-sucedido

---

**💡 Se ainda houver erro, verifique os logs do backend para identificar a causa exata!**
