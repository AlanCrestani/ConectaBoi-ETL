# 🚀 ConectaBoi ETL - Sistema Completo de Configuração e Execução

## 📋 Visão Geral

O ConectaBoi ETL agora possui um sistema completo que permite:

1. **Configurar ETL via interface web** - Configure transformações, mapeamentos e validações
2. **Salvar configurações** - Reutilize configurações em sessões futuras
3. **Quick ETL** - Aplique configurações salvas em novos arquivos rapidamente
4. **Gerar Scripts Python** - Crie scripts executáveis independentes
5. **Gerenciar Scripts** - Visualize e execute scripts salvos

## 🎯 Como Usar

### 1. Configuração Inicial via Web Interface

1. **Acesse**: http://localhost:8084
2. **Suba um arquivo**: CSV ou XLSX na primeira tela
3. **Configure mapeamentos**: Defina transformações e validações
4. **Preview e validação**: Revise dados e exclua linhas inválidas
5. **Salve a configuração**: Use a aba "Configurações" para salvar

### 2. Quick ETL - Aplicação Rápida

Na tela "Preview e Validação", aba "Quick ETL":

1. **Selecione uma configuração salva** na aba "Configurações"
2. **Carregue a configuração** no Quick ETL
3. **Selecione novo arquivo** para processar
4. **Clique "Processar e Enviar"** para executar todo o pipeline
5. **Salve como script** para uso futuro (opcional)

### 3. Scripts Python Independentes

#### Geração de Scripts:
1. **Na aba Quick ETL**, clique "Salvar Script"
2. **Defina nome e descrição** do script
3. **Script será salvo** em `generated_scripts/`

#### Execução de Scripts:
1. **Visualize scripts** na aba "Scripts"
2. **Copie o comando** de execução
3. **Execute no terminal**:
   ```bash
   python "c:\Projetos\ConectaBoi-ETL\generated_scripts\run_[nome_script].py"
   ```

## 📁 Estrutura de Arquivos Gerados

```
generated_scripts/
├── etl_historico_consumo.py          # Script ETL principal
├── etl_historico_consumo_config.json # Configuração salva
└── run_etl_historico_consumo.py      # Script executável
```

### Tipos de Arquivos:

- **`[nome].py`**: Script ETL com lógica de processamento
- **`[nome]_config.json`**: Configuração e metadados
- **`run_[nome].py`**: Script executável que configura ambiente

## 🔧 Funcionalidades do Sistema

### ✅ Interface Web (Porta 8084)
- Upload e preview de arquivos
- Configuração de transformações (ex: "ENF01" → "76")
- Validação de dados e exclusão de linhas
- Ordenação de tabelas (incluindo números de linha)
- Sistema de persistência de estado

### ✅ Quick ETL
- Aplicação rápida de configurações salvas
- Upload direto para Supabase
- Preview de dados processados
- Geração de scripts Python

### ✅ Gerenciamento de Configurações
- Salvamento local (localStorage)
- Carregamento de configurações
- Descrições e metadados
- Exclusão de configurações

### ✅ Scripts Python Independentes
- Auto-executáveis (sem dependência da web)
- Configuração automática de ambiente
- Upload para Supabase integrado
- Prompt interativo para seleção de arquivos

### ✅ API Backend (Porta 8000)
- Endpoints para upload e processamento
- ETL com filtros de outliers automáticos
- Upload para Supabase
- Salvamento e listagem de scripts

## 🚀 Fluxo de Trabalho Recomendado

### Primeiro Uso:
1. **Configure via web** → Teste com arquivo de exemplo
2. **Salve a configuração** → Dê nome descritivo
3. **Gere script Python** → Para uso futuro independente

### Uso Recorrente:
1. **Use Quick ETL** → Para processamento rápido
2. **Execute scripts Python** → Para automação/batch

### Uso em Produção:
1. **Execute scripts via terminal** → Sem dependência da interface web
2. **Automatize com cron/scheduler** → Para processamento regular

## 📊 Exemplo de Uso Completo

```bash
# 1. Iniciar servidores
cd c:\Projetos\ConectaBoi-ETL
npm run dev                    # Frontend (8084)
cd backend\api && python main.py  # Backend (8000)

# 2. Configurar via web (primeira vez)
# http://localhost:8084 → Configurar → Salvar

# 3. Executar script gerado
python "generated_scripts\run_etl_historico_consumo.py"
```

## 🎯 Objetivos Atingidos

✅ **Sistema persistente**: Configurações salvas para reutilização
✅ **Scripts independentes**: Execução sem interface web
✅ **Quick ETL**: Processamento rápido de novos arquivos
✅ **Upload automático**: Integração direta com Supabase
✅ **Interface amigável**: Abas organizadas e intuitivas
✅ **Documentação completa**: Instruções claras de uso

---

**Pronto!** O sistema ConectaBoi ETL está completo e operacional! 🎉
