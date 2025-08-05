# 📋 Guia de Transformações - ConectaBoi ETL

## 🔄 Formato de Transformações

Use o formato `valor_original -> valor_transformado` para definir transformações de dados:

### ✅ Exemplos Válidos:

```
ENF01 -> 76
ENF02 -> 77
ENF03 -> 78
MACHO -> M
FEMEA -> F
SIM -> 1
NAO -> 0
VERDADEIRO -> true
FALSO -> false
```

### 📋 Casos de Uso Comuns:

**1. Códigos de Enfermidade:**

```
ENF01 -> 76
ENF02 -> 77
ENF03 -> 78
DIA001 -> 150
DIA002 -> 151
```

**2. Valores Booleanos:**

```
SIM -> 1
NAO -> 0
TRUE -> 1
FALSE -> 0
S -> 1
N -> 0
```

**3. Gênero/Sexo:**

```
MACHO -> M
FEMEA -> F
MASCULINO -> M
FEMININO -> F
```

**4. Status/Estados:**

```
ATIVO -> A
INATIVO -> I
PENDENTE -> P
CONCLUIDO -> C
```

### 🛠️ Como Usar:

1. **No Step 2 (Mapeamento de Colunas):**

   - Selecione tipo "Derivado"
   - Escolha a coluna de origem
   - Na área de transformações, digite uma transformação por linha
   - Use o formato: `valor_original -> valor_transformado`

2. **Preview Automático:**

   - O sistema mostra quantas transformações foram configuradas
   - Exibe preview dos primeiros 3 mapeamentos
   - Valida automaticamente o formato

3. **No Step 3 (Preview):**
   - Veja como os dados serão transformados
   - Verifique se as transformações estão corretas

### ⚠️ Regras Importantes:

- **Uma transformação por linha**
- **Use espaços ao redor da seta:** `ENF01 -> 76` ✅
- **Sem espaços:** `ENF01->76` ❌
- **Valores podem ter espaços:** `ENFERMIDADE 01 -> 76` ✅
- **Case sensitive:** `SIM` e `sim` são diferentes

### 🔍 Exemplo Completo:

```
# Códigos de enfermidade
ENF01 -> 76
ENF02 -> 77
ENF03 -> 78

# Status
ATIVO -> A
INATIVO -> I

# Booleanos
SIM -> 1
NAO -> 0
```

### 🎯 No Código Python Gerado:

As transformações são aplicadas usando pandas:

```python
# Se houver transformações configuradas
if mapping.get('transformations'):
    result_df[col_name] = source_col.map(mapping['transformations']).fillna(source_col)
else:
    result_df[col_name] = source_col
```

Valores não encontrados no mapeamento mantêm o valor original.
