# Tabelas Supabase - ConectaBoi ETL

## ⚠️ IMPORTANTE PARA AGENTES DE IA

**TODAS AS TABELAS DE STAGING EXISTEM NO SUPABASE E ESTÃO FUNCIONAIS!**

Não assuma que as tabelas não existem quando o sistema retorna erro de schema. O problema é na consulta do schema, não na existência das tabelas.

## Tabelas de Staging Existentes

As seguintes tabelas estão criadas e operacionais no Supabase:

### 1. etl_staging_01_historico_consumo

- **Propósito**: Armazena dados de histórico de consumo de animais
- **Status**: ✅ Existe e funcional
- **Arquivo CSV**: `01_historico_consumo.csv`
- **Colunas**: 24 colunas (conforme schema real)

### 2. etl_staging_02_desvio_carregamento

- **Propósito**: Armazena dados de desvios no carregamento
- **Status**: ✅ Existe e funcional
- **Arquivo CSV**: `02_desvio_carregamento.csv`
- **Colunas**: Schema predefinido disponível

### 3. etl_staging_03_desvio_distribuicao

- **Propósito**: Armazena dados de desvios na distribuição
- **Status**: ✅ Existe e funcional
- **Arquivo CSV**: `03_desvio_distribuicao.csv`
- **Colunas**: Schema predefinido disponível

### 4. etl_staging_04_itens_trato

- **Propósito**: Armazena dados de itens do trato
- **Status**: ✅ Existe e funcional
- **Arquivo CSV**: `04_itens_trato.csv`
- **Colunas**: Schema predefinido disponível

### 5. etl_staging_05_trato_curral

- **Propósito**: Armazena dados de trato por curral
- **Status**: ✅ Existe e funcional
- **Arquivo CSV**: `05_trato_curral.csv`
- **Colunas**: Schema predefinido disponível

## Problemas Conhecidos

### ❌ Erro: "Tabela vazia ou inacessível"

**Sintoma**: Logs mostram `❌ Falha ao acessar tabela etl_staging_XX: Tabela vazia ou inacessível`

**Causa Real**:

- Falha na função RPC `get_table_schema` (HTTP 404)
- Falha no fallback de consulta direta à tabela
- Sistema está caindo incorretamente no schema predefinido genérico

**NÃO É**: Tabela inexistente - **TODAS AS TABELAS EXISTEM!**

### ❌ Problema: Quick ETL mostra 0 registros processados

**Sintoma**: ETL processa arquivo mas resulta em 0 registros

**Causa Real**:

- Schema predefinido genérico não corresponde às colunas reais do CSV
- Mapeamento de colunas falha porque usa schema errado
- Resultado: nenhuma coluna é mapeada corretamente

## Soluções Corretas

### ✅ Não criar tabelas (elas já existem!)

### ✅ Corrigir consulta de schema

### ✅ Implementar fallback robusto para schema real

### ✅ Melhorar logging para diagnóstico

## Logs de Referência

### Funcionando (Arquivo 01):

```
✅ Schema obtido via amostra: 24 colunas
✅ Schema da tabela etl_staging_01_historico_consumo obtido: 24 colunas
```

### Falhando (Arquivos 02 e 03):

```
❌ Falha ao acessar tabela etl_staging_02_desvio_carregamento: Tabela vazia ou inacessível
📋 Usando schema predefinido para etl_staging_02_desvio_carregamento
```

## Contatos

Para questões sobre estrutura das tabelas, consultar:

- Logs do sistema em `data/logs/api.log`
- Schema real via query direta ao Supabase
- Este documento para confirmar existência das tabelas

---

**Última atualização**: 05 de Agosto de 2025
**Versão**: 1.0
