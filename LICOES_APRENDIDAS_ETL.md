# 📚 Lições Aprendidas - ConectaBoi ETL

Este documento registra todos os problemas encontrados e soluções aplicadas durante o desenvolvimento do sistema ETL, servindo como referência para evitar repetição de erros.

## 🔍 Problemas Identificados e Soluções

### 1. **Formato de Números Brasileiros**

**❌ Problema:**

- CSV usava vírgula como separador decimal (`-0,60`)
- PostgreSQL/Supabase espera ponto decimal (`-0.60`)
- **Erro:** `invalid input syntax for type numeric: "-0,60"`

**✅ Solução:**

- Criada função `_convert_brazilian_numeric_format()` em `backend/api/main.py`
- Detecção automática de colunas com números brasileiros via regex `^-?\d+,\d+$`
- Conversão automática de vírgulas para pontos antes do upload

**📝 Implementação:**

```python
# Detecta e converte automaticamente
brazilian_number_pattern = r'^-?\d+,\d+$'
converted = str_x.replace(',', '.')
```

### 2. **Formato de Datas Brasileiras**

**❌ Problema:**

- CSV usava formato brasileiro (`22/05/2025`)
- PostgreSQL espera formato ISO (`2025-05-22`)
- **Erro:** `date/time field value out of range: "22/05/2025"`

**✅ Solução:**

- Adicionada detecção de datas brasileiras na mesma função
- Conversão automática `dd/mm/yyyy` → `yyyy-mm-dd`

**📝 Implementação:**

```python
# Detecta e converte datas brasileiras
brazilian_date_pattern = r'^\d{1,2}/\d{1,2}/\d{4}$'
day, month, year = str_x.split('/')
iso_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
```

### 3. **Linha Extra Fantasma**

**❌ Problema:**

- Arquivo tinha 2.354 registros, mas Supabase recebia 2.355
- Uma linha com `id_curral: 123, data: 01/01/2025, qtd_animais: 50` e resto em branco

**✅ Solução:**

- Problema estava em `skip_first_line=True` hard-coded no endpoint `/etl/process-quick`
- CSV já tinha cabeçalhos corretos, não precisava pular primeira linha
- Adicionado campo `skip_first_line: bool = False` ao modelo `ETLProcessRequest`
- Frontend agora envia `skip_first_line: false` explicitamente

**📝 Implementação:**

```python
# Backend - Modelo corrigido
class ETLProcessRequest(BaseModel):
    skip_first_line: bool = False  # Não pular por padrão

# Frontend - Configuração correta
const etlConfig = {
    skip_first_line: false,  // Não pular primeira linha
    // ...outros campos
};
```

### 4. **Encoding de Arquivos**

**❌ Problema:**

- Arquivos CSV brasileiros usam `windows-1252` ou `ISO-8859-1`
- Sistema tentava ler como `UTF-8`
- **Erro:** `'utf-8' codec can't decode byte 0xd3 in position 23`

**✅ Solução:**

- Sistema já tinha detecção automática de encoding
- Conversão automática para UTF-8 antes do processamento
- **Funcionou corretamente desde o início**

### 5. **Delimitadores Brasileiros**

**❌ Problema:**

- CSV brasileiro usa `;` como delimitador
- Sistema padrão espera `,`

**✅ Solução:**

- Sistema já tinha detecção automática de delimitadores
- **Funcionou corretamente desde o início**

### 6. **Tipos TypeScript**

**❌ Problema:**

- ESLint reclamando de `useState<any[]>`
- **Warning:** `Unexpected any. Specify a different type.`

**✅ Solução:**

- Substituído por `useState<Record<string, unknown>[]>`
- Tipo mais específico e seguro

## 🛡️ Checklist de Prevenção para Próximos Arquivos

### ✅ Antes de Processar Qualquer Arquivo CSV:

1. **Formatos Numéricos**

   - [ ] Verificar se usa vírgula decimal (brasileiro)
   - [ ] Confirmar que conversão automática está ativa
   - [ ] Testar com valores negativos

2. **Formatos de Data**

   - [ ] Identificar formato de data (dd/mm/yyyy vs mm/dd/yyyy)
   - [ ] Verificar se conversão automática detecta corretamente
   - [ ] Validar datas convertidas

3. **Estrutura do Arquivo**

   - [ ] Confirmar se primeira linha são cabeçalhos válidos
   - [ ] Definir `skip_first_line: false` se cabeçalhos estão corretos
   - [ ] Contar registros antes e depois do processamento

4. **Configuração do Schema**

   - [ ] Verificar se schema da tabela está definido
   - [ ] Confirmar tipos de dados (NUMERIC para números, DATE para datas)
   - [ ] Validar nomes das colunas

5. **Mapeamento de Colunas**
   - [ ] Revisar mapeamento automático gerado
   - [ ] Confirmar que colunas essenciais estão mapeadas
   - [ ] Verificar se não há colunas duplicadas

### 🔧 Funções Críticas que Devem Funcionar:

1. **`_convert_brazilian_numeric_format()`** - Conversão de formatos
2. **`_load_and_prepare_dataframe()`** - Carregamento correto
3. **`_apply_column_mapping_transformations()`** - Mapeamento de colunas
4. **Frontend `skip_first_line: false`** - Configuração correta

## 🎯 Resultado Final do Arquivo 01:

- ✅ **2.354 registros** processados corretamente
- ✅ **Formatos brasileiros** convertidos automaticamente
- ✅ **Upload bem-sucedido** para `etl_staging_01_historico_consumo`
- ✅ **Sem registros extras** ou duplicados

## 📋 Para o Próximo Arquivo (02_desvio_carregamento):

1. Aplicar todas as lições aprendidas
2. Verificar se schema está correto
3. Testar com arquivo pequeno primeiro
4. Validar contagem de registros
5. Confirmar formatos de números e datas

---

**💡 Lembrete:** Sempre verificar logs em `data/logs/api.log` para debug detalhado!
