# Especificações do Sistema — Caixa Gerencial

**Versão:** 1.0
**Data:** Abril de 2026
**Empresa:** ATTOS Empreendimentos Imobiliários S.A.
**CNPJ:** 05.579.210/0001-08

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura](#3-arquitetura)
4. [Autenticação e Controle de Acesso](#4-autenticação-e-controle-de-acesso)
5. [Módulo: Caixa Gerencial](#5-módulo-caixa-gerencial)
   - 5.1 [Dashboard](#51-dashboard)
   - 5.2 [Lançamentos](#52-lançamentos)
6. [Módulo: Correção Monetária](#6-módulo-correção-monetária)
   - 6.1 [Novo Cálculo](#61-novo-cálculo)
   - 6.2 [Histórico](#62-histórico)
7. [Módulo: Cadastros](#7-módulo-cadastros)
   - 7.1 [Favorecidos](#71-favorecidos)
   - 7.2 [Projetos](#72-projetos)
   - 7.3 [Classificações](#73-classificações)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Integrações Externas](#9-integrações-externas)
10. [Geração de Documentos](#10-geração-de-documentos)
11. [Regras de Negócio](#11-regras-de-negócio)
12. [Rotas do Sistema](#12-rotas-do-sistema)

---

## 1. Visão Geral

O **Caixa Gerencial** é um sistema web de gestão financeira desenvolvido para a ATTOS Empreendimentos Imobiliários S.A. O sistema centraliza o controle de entradas e saídas de caixa, cálculo de correção monetária com índices oficiais do Banco Central do Brasil e a gestão dos cadastros de suporte (favorecidos, projetos e classificações).

### Premissas de Operação

- **Modelo:** Single-tenant (todos os usuários autenticados operam sobre os mesmos dados)
- **Acesso:** Restrito a usuários autenticados; dados compartilhados entre todos os usuários da empresa
- **Localidade padrão:** Brasília - DF
- **Moeda:** Real Brasileiro (BRL)
- **Idioma:** Português do Brasil

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend Framework | React | 19.0 |
| Linguagem | TypeScript | 5.8 |
| Build Tool | Vite | 6.4 |
| Estilização | Tailwind CSS | 4.1 |
| Roteamento | React Router DOM | 7.13 |
| Backend / BaaS | Supabase (PostgreSQL + Auth) | 2.49 |
| Gráficos | Recharts | 3.8 |
| Manipulação de Datas | date-fns | 4.1 |
| Planilhas Excel | XLSX (SheetJS) | 0.18 |
| Geração de PDF | jsPDF + jspdf-autotable | 4.2 |
| HTML para Imagem | html2canvas | 1.4 |
| Ícones | lucide-react | 0.546 |
| Deploy | Vercel | — |
| Domínio | sistema.grupoattos.com.br | — |

---

## 3. Arquitetura

### Estrutura de Pastas

```
src/
├── pages/          # Páginas da aplicação (8 páginas)
├── components/     # Componentes reutilizáveis (4 componentes)
├── services/       # Camada de serviços externos (BCB API, Supabase)
├── lib/            # Configurações e contextos (Auth, API, Supabase)
├── hooks/          # Hooks customizados (useTransactions)
├── utils/          # Utilitários (finance, pdfGenerators, valorPorExtenso)
├── types.ts        # Definições de tipos TypeScript
├── App.tsx         # Roteamento principal
└── main.tsx        # Ponto de entrada
```

### Fluxo de Dados

```
Usuário → React (Frontend) → Supabase (PostgreSQL) [dados transacionais]
                           → BCB API              [índices monetários]
```

### Otimização de Bundle (Chunks)

O bundle de produção é dividido em chunks por domínio para garantir performance e deploy confiável:

| Chunk | Conteúdo | Tamanho (gzip) |
|-------|----------|---------------|
| vendor-react | React, ReactDOM, React Router | ~17 kB |
| vendor-supabase | Supabase JS | ~46 kB |
| vendor-charts | Recharts, D3 | ~113 kB |
| vendor-xlsx | SheetJS | ~142 kB |
| vendor-pdf | jsPDF, jspdf-autotable | ~139 kB |
| vendor-html2canvas | html2canvas | ~48 kB |
| index | Código da aplicação | ~101 kB |

---

## 4. Autenticação e Controle de Acesso

### Provedor de Autenticação

Supabase Auth com estratégia **email + senha**.

### Cadastro de Usuário

Campos obrigatórios:
- **Nome completo**
- **CPF** (formato: XXX.XXX.XXX-XX)
- **E-mail**
- **Senha**

Os campos `nome` e `cpf` são armazenados como metadados do usuário na tabela `auth.users` do Supabase.

### Login

- Autenticação via e-mail e senha
- Mensagens de erro específicas para: credenciais inválidas, e-mail não confirmado
- Sessão persistida no armazenamento do navegador (gerenciada pelo Supabase Auth)
- Redirecionamento automático para o Dashboard após login bem-sucedido

### Proteção de Rotas

- Todas as rotas (exceto `/login` e `/register`) são protegidas pelo componente `ProtectedRoute`
- Usuários não autenticados são redirecionados automaticamente para `/login`
- Usuários já autenticados que acessam `/login` ou `/register` são redirecionados para o Dashboard

### Permissões (RLS — Row Level Security)

O sistema opera em modelo **single-tenant**:
- Todas as tabelas de dados operacionais (payees, projects, classifications, transactions) são visíveis e editáveis por qualquer usuário autenticado
- As tabelas de correção monetária (`monetary_saved_tables`, `monetary_calculation_results`) também são visíveis e editáveis por qualquer usuário autenticado

---

## 5. Módulo: Caixa Gerencial

### 5.1 Dashboard

**Rota:** `/`

O Dashboard apresenta um resumo financeiro consolidado do período selecionado.

#### Funcionalidades

**Seleção de Período**
- Alternância entre visualização **Mensal** e **Anual**
- Navegação entre períodos com botões "anterior" e "próximo"
- Exibição do período atual no centro do seletor

**Cards de Resumo (4 métricas)**

| Card | Descrição |
|------|-----------|
| Saldo Inicial | Soma acumulada de todas as transações anteriores ao período |
| Entradas | Soma de todas as transações positivas no período |
| Saídas | Soma do valor absoluto de todas as transações negativas no período |
| Saldo Atual | Saldo Inicial + Entradas − Saídas |

**Gráficos de Pizza**
- **Despesas por Projeto:** Distribuição percentual das saídas agrupadas por projeto/centro de custo
- **Despesas por Classificação:** Distribuição percentual das saídas agrupadas por categoria

> Ambos os gráficos consideram apenas transações negativas (saídas) do período selecionado.

---

### 5.2 Lançamentos

**Rota:** `/transactions`

Tela central para registro e gestão de todas as movimentações financeiras.

#### Funcionalidades

**Listagem de Transações**
- Exibição em tabela com colunas: Data, Favorecido, Projeto, Classificação, Valor, Descrição, Ações
- Exibição do Saldo Inicial e Saldo Final do período no cabeçalho
- Cores diferenciadas: verde para entradas, vermelho para saídas

**Filtros**
Os filtros podem ser combinados livremente:

| Filtro | Tipo | Descrição |
|--------|------|-----------|
| Dia | Texto | Filtra pelo dia da data (número 1–31) |
| Mês | Texto | Filtra pelo mês da data (número 1–12) |
| Ano | Texto | Filtra pelo ano |
| Descrição | Texto livre | Busca por correspondência parcial |
| Favorecido | Texto livre | Busca por nome do favorecido |
| Projeto | Texto livre | Busca por nome do projeto |
| Classificação | Texto livre | Busca por nome da classificação |
| Valor | Texto | Busca por correspondência no valor formatado |

Botão "Limpar Filtros" reseta todos os filtros aplicados.

**Cadastro de Lançamento**

Modal com os seguintes campos:

| Campo | Tipo | Obrigatório | Observações |
|-------|------|-------------|-------------|
| Tipo | Seletor | Sim | Saída (negativo) ou Entrada (positivo) |
| Data | Data | Sim | Formato dd/mm/aaaa |
| Valor | Moeda | Sim | Formatado automaticamente em BRL |
| Favorecido | Seletor | Não | Listagem de favorecidos cadastrados |
| Projeto | Seletor | Não | Listagem de projetos cadastrados |
| Classificação | Seletor | Não | Listagem de classificações cadastradas |
| Descrição | Texto livre | Não | Observações da transação |

**Edição e Exclusão**
- Ícone de lápis abre o modal de edição com dados pré-preenchidos
- Ícone de lixeira realiza exclusão com confirmação implícita
- Exclusão remove permanentemente o registro do banco

**Relatórios**

O botão "Relatório" disponibiliza 4 opções:

| Opção | Formato | Descrição |
|-------|---------|-----------|
| Relatório do Período (Browser) | HTML imprimível | Relatório formatado aberto em nova aba do navegador |
| Relatório do Período (PDF) | PDF | Mesmo relatório exportado como arquivo PDF (html2canvas + jsPDF) |
| Relatório Filtrado (Browser) | HTML imprimível | Aplica os filtros ativos antes de gerar o relatório |
| Relatório Filtrado (PDF) | PDF | Relatório filtrado exportado como PDF |

**Conteúdo do Relatório de Período:**
- Logotipo da empresa (centralizado)
- Cabeçalho com período e data de geração
- Grid de resumo: Saldo Inicial, Entradas, Saídas, Saldo Final
- Tabela de lançamentos: Data, Favorecido, Projeto, Valor, Descrição

**Recibos**

Para cada transação, o botão "Recibo" abre um submenu com duas opções:

**Recibo de Pagamento de Salário**
- Cabeçalho com logotipo e nome da empresa
- Identificação do favorecido: nome, CPF, cargo
- Mês e ano de referência
- Valor por extenso (por exemplo: "dois mil reais")
- Linha de assinatura e localidade (Brasília - DF)

**Recibo de Prestação de Serviços**
- Cabeçalho com logotipo e nome da empresa
- Identificação do prestador: nome, CPF/CNPJ, endereço
- Descrição dos serviços prestados
- Valor numérico e por extenso
- Data e localidade (Brasília - DF)
- Linha de assinatura

Ambos os recibos podem ser impressos via navegador.

---

## 6. Módulo: Correção Monetária

### 6.1 Novo Cálculo

**Rota:** `/monetary-correction`

Permite calcular a atualização monetária de valores utilizando índices econômicos oficiais do Banco Central do Brasil.

#### Índices Disponíveis

| Índice | Descrição | Código BCB |
|--------|-----------|-----------|
| SELIC | Taxa SELIC Over | 11 |
| IPCA | Índice de Preços ao Consumidor Amplo | 433 |
| IGPM | Índice Geral de Preços do Mercado | 189 |
| INCC | Índice Nacional da Construção Civil | 192 |

#### Modos de Entrada

**Modo Manual (entrada individual)**

| Campo | Tipo | Obrigatório | Observações |
|-------|------|-------------|-------------|
| Valor Original | Moeda | Sim | Valor a ser corrigido |
| Data Inicial | Data | Sim | Início do período de correção |
| Data Final | Data | Sim | Fim do período de correção |
| Índice | Seletor | Sim | SELIC, IPCA, IGPM ou INCC |
| Juros Adicionais | Percentual | Não | Taxa mensal adicional aplicada sobre o período |

**Modo Lote (importação de planilha)**

- Upload de arquivo `.xlsx`
- Detecção automática de colunas por palavras-chave:
  - "Data Inicial", "Início" → campo `startDate`
  - "Data Final", "Fim" → campo `endDate`
  - "Valor" → campo `originalValue`
- Interface de mapeamento manual de colunas caso a detecção automática falhe
- Suporte a datas no formato Excel (número serial) e formato texto (DD/MM/AAAA)
- Barra de progresso indicando a quantidade de registros processados
- Processamento concorrente: **3 registros simultâneos** para otimizar performance

#### Algoritmo de Correção

```
Para cada dia do período:
  1. Busca o fator diário do índice na API BCB
  2. Aplica multiplicativamente: correctedValue *= (1 + fator/100)

Juros adicionais (taxa mensal simples):
  3. meses = diferença em meses entre startDate e endDate
  4. correctedValue += originalValue * (meses * taxaAdicional / 100)

Resultado:
  - correctedValue: valor corrigido final
  - interestValue: correctedValue − originalValue
  - totalPercentage: ((correctedValue / originalValue) − 1) × 100
```

#### Tratamento de Limitações da API BCB

- A API do BCB retorna HTTP 406 para intervalos superiores a 9 anos
- O sistema automaticamente divide o intervalo em **chunks anuais** e concatena os resultados
- Implementado retry com backoff exponencial: até 3 tentativas (800 ms → 1600 ms)

#### Resultados

Após o processamento, são exibidos:

**Cards de Resumo**
- Valor Original Total
- Valor Corrigido Total
- Juros Totais

**Gráfico de Barras 3D por Ano**
- Eixo X: Ano (derivado do campo `endDate` de cada entrada)
- Eixo Y: Valor em BRL
- Barras duplas por ano: Original (azul) e Corrigido (verde)
- Efeito 3D com faces SVG: frontal, superior (clara) e lateral direita (escura)
- Filtro por mês no cabeçalho do gráfico (dropdown com os 12 meses + "Todos")

**Tabela de Resultados**

Colunas exibidas:

| Coluna | Descrição |
|--------|-----------|
| Data Inicial | Data de início do período |
| Data Final | Data de fim do período |
| Índice | Índice utilizado |
| Juros Ad. (%) | Taxa adicional informada |
| Valor Original | Valor informado |
| Valor Corrigido | Valor após correção |
| Juros | Diferença (Corrigido − Original) |
| Status | PENDING / CALCULATING / SUCCESS / ERROR |

**Exportação de Resultados**
- **Excel (.xlsx):** Exporta a tabela completa com todos os campos
- **PDF:** Exporta a tabela usando jsPDF com plugin autoTable

**Salvamento de Tabela**

O usuário pode nomear e salvar o conjunto de resultados como uma "tabela" no banco de dados, acessível posteriormente no submenu **Histórico**.

---

### 6.2 Histórico

**Rota:** `/monetary-correction/history`

Gerencia as tabelas de cálculo salvas anteriormente.

#### Funcionalidades

**Listagem de Tabelas**
- Exibe todas as tabelas salvas por **qualquer usuário** da empresa (single-tenant)
- Informações exibidas: nome da tabela, data de criação, data de última atualização
- Botão "Abrir" para visualizar os detalhes
- Botão de exclusão (ícone lixeira) ao lado de cada tabela

**Visualização de Tabela**
- Exibe a tabela de resultados completa (mesmo componente `ResultDisplay`)
- Permite exportar novamente para Excel ou PDF
- Exibe os cards de resumo (total original, corrigido, juros)
- Exibe o gráfico 3D por ano

**Adição de Novos Registros**
- O usuário pode adicionar novas entradas (manual ou lote) a uma tabela existente
- Os novos registros são recalculados e persistidos junto aos existentes

**Edição de Registros**
- Permite editar individualmente qualquer entrada da tabela
- A edição re-busca os dados da API BCB com os novos parâmetros

**Exclusão de Tabela**
- Exclui permanentemente a tabela e todos os seus registros do banco
- Confirmação exibida via `window.confirm` antes da operação
- Remove primeiro os registros de `monetary_calculation_results`, depois o registro de `monetary_saved_tables`

**Recálculo Total**
- Botão "Recalcular Tudo" reprocessa todas as entradas da tabela buscando os índices atuais da API BCB
- Útil para atualizar cálculos com dados mais recentes

---

## 7. Módulo: Cadastros

### 7.1 Favorecidos

**Rota:** `/payees`

Gerencia as pessoas físicas e jurídicas que recebem ou realizam pagamentos.

#### Campos

| Campo | Tipo | Obrigatório | Observações |
|-------|------|-------------|-------------|
| Nome | Texto | Sim | Nome completo ou razão social |
| Tipo | Seletor | Sim | PF (Pessoa Física) ou PJ (Pessoa Jurídica) |
| Documento | Texto | Não | CPF (PF) ou CNPJ (PJ) — máscara automática |
| Cargo / Função | Texto | Não | Cargo do colaborador ou tipo de serviço |
| Endereço | Texto | Não | Endereço completo |

**Formatação de Documentos**
- CPF: `XXX.XXX.XXX-XX`
- CNPJ: `XX.XXX.XXX/XXXX-XX`

#### Restrição de Exclusão

Favorecidos vinculados a transações **não podem ser excluídos**. O sistema exibe mensagem de erro informando a restrição.

---

### 7.2 Projetos

**Rota:** `/projects`

Gerencia os centros de custo e projetos da empresa.

#### Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | Texto | Sim |
| Descrição | Texto | Não |

#### Restrição de Exclusão

Projetos vinculados a transações **não podem ser excluídos**.

---

### 7.3 Classificações

**Rota:** `/classifications`

Gerencia as categorias de classificação das transações.

#### Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | Texto | Sim |
| Descrição | Texto | Não |

#### Restrição de Exclusão

Classificações vinculadas a transações **não podem ser excluídas**.

---

## 8. Modelo de Dados

### Diagrama de Entidades

```
auth.users (Supabase Auth)
    ├── monetary_saved_tables (user_id)
    │       └── monetary_calculation_results (table_id)

payees ←── transactions ──→ projects
                  └───────→ classifications
```

### Tabelas

#### `payees`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer (PK) | Identificador único |
| name | text | Nome ou razão social |
| type | text | 'PF' ou 'PJ' |
| document | text | CPF ou CNPJ |
| cargo | text | Cargo / função |
| endereco | text | Endereço |

#### `projects`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer (PK) | Identificador único |
| name | text | Nome do projeto |
| description | text | Descrição |

#### `classifications`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer (PK) | Identificador único |
| name | text | Nome da classificação |
| description | text | Descrição |

#### `transactions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer (PK) | Identificador único |
| date | date | Data da transação (YYYY-MM-DD) |
| payee_id | integer (FK) | Referência a `payees.id` |
| project_id | integer (FK) | Referência a `projects.id` |
| classification_id | integer (FK) | Referência a `classifications.id` |
| amount | numeric | Valor (positivo = entrada, negativo = saída) |
| description | text | Descrição / observações |

#### `monetary_saved_tables`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | Identificador único |
| user_id | uuid (FK) | Referência a `auth.users.id` |
| name | text | Nome dado à tabela pelo usuário |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data da última atualização |

#### `monetary_calculation_results`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | Identificador único |
| table_id | uuid (FK) | Referência a `monetary_saved_tables.id` |
| data | jsonb | Array de `CalculationEntry` (JSON) |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data da última atualização |

### Tipos TypeScript Principais

```typescript
type IndexType = 'SELIC' | 'IPCA' | 'IGPM' | 'INCC'

interface CalculationEntry {
  id: string
  originalValue: number
  startDate: string            // YYYY-MM-DD
  endDate: string              // YYYY-MM-DD
  indexType: IndexType
  additionalInterestRate: number
  correctedValue?: number
  interestValue?: number
  totalPercentage?: number
  status: 'PENDING' | 'CALCULATING' | 'SUCCESS' | 'ERROR'
  errorMessage?: string
}
```

---

## 9. Integrações Externas

### 9.1 Supabase

**Finalidade:** Banco de dados relacional (PostgreSQL) e autenticação de usuários.

**Configuração:**
- URL e chave anônima via variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Políticas RLS (Row Level Security) configuradas para acesso single-tenant

### 9.2 API do Banco Central do Brasil (BCB)

**Finalidade:** Obtenção das taxas diárias dos índices econômicos para correção monetária.

**URL base:**
```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
```

**Parâmetros de query:**

| Parâmetro | Formato | Exemplo |
|-----------|---------|---------|
| formato | fixo: `json` | `formato=json` |
| dataInicial | dd/MM/aaaa | `dataInicial=01/01/2022` |
| dataFinal | dd/MM/aaaa | `dataFinal=31/12/2022` |

**Formato de resposta:**
```json
[
  { "data": "03/01/2022", "valor": "0.038750" },
  { "data": "04/01/2022", "valor": "0.038750" }
]
```

**Limitações e tratamento:**
- Intervalos superiores a ~9 anos retornam HTTP 406
- Solução: divisão automática do intervalo em blocos anuais
- Retry automático com backoff exponencial (até 3 tentativas)

---

## 10. Geração de Documentos

### 10.1 Relatório de Lançamentos

**Biblioteca:** html2canvas + jsPDF
**Formatos:** Browser (impressão) e PDF (download)

**Conteúdo:**
- Logotipo da empresa (centralizado)
- Cabeçalho: razão social, CNPJ, período, data de geração
- Grid de resumo: Saldo Inicial, Entradas, Saídas, Saldo Final
- Tabela de lançamentos completa (ou filtrada)

### 10.2 Recibo de Pagamento de Salário

**Formato:** HTML → janela do navegador → impressão

**Campos:**
- Razão social e CNPJ do empregador
- Nome, CPF e cargo do empregado
- Mês e ano de referência
- Valor numérico e por extenso
- Assinatura do empregado
- Local (Brasília - DF) e data

### 10.3 Recibo de Prestação de Serviços

**Formato:** HTML → janela do navegador → impressão

**Campos:**
- Razão social e CNPJ do tomador de serviços
- Nome, CPF/CNPJ e endereço do prestador
- Descrição dos serviços prestados
- Valor numérico e por extenso
- Local (Brasília - DF) e data
- Assinatura do prestador

### 10.4 Exportação de Correção Monetária

**Formatos disponíveis:**

| Formato | Biblioteca | Colunas |
|---------|-----------|---------|
| Excel (.xlsx) | SheetJS | Data Inicial, Data Final, Índice, Juros Ad. (%), Valor Original, Valor Corrigido, Juros |
| PDF | jsPDF + autoTable | Mesmas colunas |

---

## 11. Regras de Negócio

### Transações
- Valores positivos representam **entradas** (receitas)
- Valores negativos representam **saídas** (despesas)
- Favorecido, Projeto e Classificação são opcionais por transação
- O saldo é calculado em tempo real no frontend a partir das transações persistidas

### Saldo
- **Saldo Inicial do período** = soma de todas as transações com data anterior ao período selecionado
- **Saldo Final** = Saldo Inicial + Entradas − Saídas do período

### Correção Monetária
- A correção é aplicada multiplicativamente dia a dia sobre o valor original
- Os juros adicionais são calculados de forma simples (não composta) sobre o valor original
- O cálculo é independente do ano: funciona para qualquer período histórico disponível na API BCB
- Entradas com status `ERROR` são exibidas na tabela com mensagem explicativa e não afetam os totais

### Exclusão com Proteção de Integridade
- **Favorecidos, Projetos e Classificações** não podem ser excluídos se houver transações vinculadas
- **Tabelas de Correção Monetária:** a exclusão remove primeiro os resultados associados (`monetary_calculation_results`) e depois o registro da tabela (`monetary_saved_tables`)

### Acesso a Dados (Single-Tenant)
- Todas as transações, favorecidos, projetos e classificações são compartilhados entre todos os usuários autenticados
- Todas as tabelas de correção monetária são visíveis e gerenciáveis por todos os usuários autenticados, independentemente de quem as criou

---

## 12. Rotas do Sistema

| Rota | Componente | Descrição | Protegida |
|------|-----------|-----------|-----------|
| `/login` | Login | Tela de autenticação | Não |
| `/register` | Register | Cadastro de usuário | Não |
| `/` | Dashboard | Painel financeiro | Sim |
| `/transactions` | Transactions | Gestão de lançamentos | Sim |
| `/monetary-correction` | MonetaryCorrection | Novo cálculo de correção | Sim |
| `/monetary-correction/history` | MonetaryHistory | Histórico de tabelas salvas | Sim |
| `/payees` | Payees | Cadastro de favorecidos | Sim |
| `/projects` | Projects | Cadastro de projetos | Sim |
| `/classifications` | Classifications | Cadastro de classificações | Sim |

---

*Documento gerado em Abril de 2026. Reflete o estado do sistema na versão 1.0 (commit inicial + melhorias implementadas até esta data).*