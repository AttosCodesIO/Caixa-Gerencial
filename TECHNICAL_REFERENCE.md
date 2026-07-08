# Caixa Gerencial — Referência Técnica do Sistema

> **Documento oficial de referência técnica da evolução e funcionalidades do sistema.**
> Mantido continuamente. Toda alteração, correção, refatoração ou nova funcionalidade deve ser registrada na seção [Histórico de Alterações](#histórico-de-alterações).

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura e Stack Tecnológica](#2-arquitetura-e-stack-tecnológica)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Módulos e Funcionalidades](#4-módulos-e-funcionalidades)
   - 4.1 [Caixa Gerencial (Dashboard)](#41-caixa-gerencial-dashboard)
   - 4.2 [Lançamentos (Transactions)](#42-lançamentos-transactions)
   - 4.3 [Correção Monetária](#43-correção-monetária)
   - 4.4 [Histórico de Cálculos](#44-histórico-de-cálculos)
   - 4.5 [Cadastro de Favorecidos](#45-cadastro-de-favorecidos)
   - 4.6 [Cadastro de Projetos](#46-cadastro-de-projetos)
   - 4.7 [Cadastro de Classificações](#47-cadastro-de-classificações)
   - 4.8 [Autenticação e Controle de Acesso](#48-autenticação-e-controle-de-acesso)
5. [Geração de Documentos](#5-geração-de-documentos)
6. [Integração com APIs Externas](#6-integração-com-apis-externas)
7. [Banco de Dados](#7-banco-de-dados)
8. [Pipeline CI/CD](#8-pipeline-cicd)
9. [Testes](#9-testes)
10. [Histórico de Alterações](#histórico-de-alterações)

---

## 1. Visão Geral do Sistema

| Atributo | Valor |
|---|---|
| **Nome do sistema** | Caixa Gerencial |
| **Organização** | ATTOS Empreendimentos Imobiliários S.A. |
| **CNPJ** | 05.579.210/0001-08 |
| **Sede** | Brasília – DF |
| **URL de produção** | https://sistema.grupoattos.com.br |
| **Plataforma de deploy** | Vercel |
| **Modelo de tenancy** | Single-tenant (todos os usuários autenticados compartilham os dados transacionais) |
| **Primeiro deploy** | 2026-03-23 |

O sistema é uma aplicação financeira interna que centraliza o controle de caixa da organização, oferece calculadora de correção monetária com índices oficiais do Banco Central do Brasil e gerencia os cadastros de apoio (favorecidos, projetos, classificações).

---

## 2. Arquitetura e Stack Tecnológica

### Frontend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 19.0.0 | Framework de interface |
| TypeScript | ~5.8.2 | Tipagem estática |
| React Router DOM | 7.18.1 | Roteamento SPA |
| Tailwind CSS | 4.1.14 | Estilização utilitária |
| Recharts | 3.8.0 | Gráficos e visualizações |
| Motion | 12.23.24 | Animações de interface |
| Lucide React | 0.546.0 | Ícones SVG |
| date-fns | 4.1.0 | Manipulação de datas |
| Vite | 6.2.0 | Build tool e dev server |

### Backend / Serviços

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Supabase JS | 2.49.4 | Auth, banco de dados (PostgreSQL), RLS |
| API BCB | — | Séries históricas de índices econômicos (SELIC, IPCA, IGPM, INCC) |

### Geração de Arquivos

| Biblioteca | Versão | Finalidade |
|---|---|---|
| jsPDF | 4.2.1 | Geração de PDFs |
| jspdf-autotable | 5.0.7 | Tabelas em PDF |
| html2canvas | 1.4.1 | Captura de DOM para PDF |
| XLSX (SheetJS) | 0.18.5 | Importação e exportação de Excel |

### Qualidade e Testes

| Ferramenta | Versão | Finalidade |
|---|---|---|
| Vitest | 1.3.1 | Testes unitários |
| Playwright | 1.42.1 | Testes end-to-end |
| Testing Library | 16.2.0 | Utilitários para testes React |
| ESLint | 8.57.0 | Linting de código |
| Prettier | 3.2.5 | Formatação de código |

### Estratégia de Code Splitting (Vite)

| Chunk | Conteúdo | Tamanho (gzip aprox.) |
|---|---|---|
| `vendor-react` | React, ReactDOM, React Router | 17 KB |
| `vendor-supabase` | Supabase JS | 46 KB |
| `vendor-charts` | Recharts, D3 | 113 KB |
| `vendor-xlsx` | SheetJS | 142 KB |
| `vendor-pdf` | jsPDF, jspdf-autotable | 139 KB |
| `vendor-html2canvas` | html2canvas | 48 KB |
| `index` | Código da aplicação | 101 KB |

---

## 3. Estrutura do Projeto

```
caixa-gerencial/
├── .github/workflows/ci.yml     # Pipeline CI/CD (build, lint, unit tests, E2E)
├── .claude/                     # Configurações Claude Code
├── e2e/                         # Testes end-to-end (Playwright)
├── Skills/                      # Documentação de skills Claude Code
├── src/
│   ├── components/              # Componentes reutilizáveis
│   │   ├── BatchCalc.tsx        # Cálculo em lote (manual + upload Excel)
│   │   ├── DashboardSummary.tsx # Cards de resumo e gráfico 3D da correção
│   │   ├── ResultDisplay.tsx    # Tabela de resultados com export PDF/Excel
│   │   └── SavedTables.tsx      # Lista e gerenciamento de tabelas salvas
│   ├── hooks/
│   │   └── useTransactions.ts   # Hook centralizado de estado de lançamentos
│   ├── lib/
│   │   ├── AuthContext.tsx      # Contexto e provider de autenticação
│   │   ├── api.ts               # Cliente Supabase — CRUD de entidades
│   │   ├── supabase.ts          # Inicialização do cliente Supabase
│   │   └── valorPorExtenso.ts   # Conversão de número para texto em português
│   ├── pages/                   # Páginas da aplicação
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── MonetaryCorrection.tsx
│   │   ├── MonetaryHistory.tsx
│   │   ├── Payees.tsx
│   │   ├── Projects.tsx
│   │   └── Classifications.tsx
│   ├── services/
│   │   ├── bcbService.ts        # Integração com API do Banco Central
│   │   └── supabaseService.ts   # CRUD de tabelas de correção monetária
│   ├── utils/
│   │   ├── finance.ts           # Algoritmo de correção monetária
│   │   ├── pdfGenerators.ts     # Geração de recibos e relatórios em HTML/PDF
│   │   ├── testFactories.ts     # Factories para testes
│   │   └── testUtils.tsx        # Utilitários de setup para testes
│   ├── App.tsx                  # Definição de rotas
│   ├── types.ts                 # Interfaces TypeScript globais
│   └── main.tsx                 # Entry point React
├── package.json
├── vite.config.ts
├── playwright.config.ts
├── vitest.setup.ts
└── vercel.json                  # Configuração de deploy e rewrites SPA
```

---

## 4. Módulos e Funcionalidades

### 4.1 Caixa Gerencial (Dashboard)

**Rota:** `/`

Painel financeiro mensal/anual com navegação de período.

**Funcionalidades:**
- Navegação por mês e ano (anterior/próximo) com dois modos: mensal e anual
- 4 cards de resumo: Saldo Inicial, Entradas, Saídas, Saldo Atual
- Gráfico de pizza: Despesas por Projeto
- Gráfico de pizza: Despesas por Classificação
- Cálculo dinâmico de saldo inicial acumulando todos os lançamentos anteriores ao período

**Arquivo principal:** [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)

---

### 4.2 Lançamentos (Transactions)

**Rota:** `/transactions`

Livro caixa principal com CRUD completo de movimentações financeiras.

**Funcionalidades:**

**Listagem e Navegação:**
- Tabela com colunas: Data, Favorecido, Projeto, Valor, Descrição
- Filtro de datas unificado com 3 modos, selecionáveis por abas *(adicionado em 2026-07-08)*:
  - **Dia:** seleção de uma data específica
  - **Período:** intervalo livre (data início/fim) com pills de atalho — Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês, Mês passado, Personalizado
  - **Mês:** navegação mensal/anual (anterior/próximo), comportamento legado preservado
- Filtro ativo persistido na URL via query string (link compartilhável/recarregável)

**Filtros:**
- Filtro por dia (coluna, texto parcial nos dois dígitos do dia)
- Filtro por favorecido (texto parcial, case-insensitive)
- Filtro por projeto
- Filtro por classificação
- Filtro por valor
- Filtro por descrição (texto parcial, case-insensitive)

**Ações por lançamento:**
- **Editar:** Abre modal pré-preenchido para edição
- **Duplicar:** Pré-preenche o formulário de criação com os dados do lançamento selecionado *(adicionado em 2026-05-08)*
- **Excluir:** Remove o lançamento com confirmação
- **Imprimir Recibo:** Gera recibo de Pagamento de Salário ou Prestação de Serviços — recibo de salário inclui campo "Histórico" com a descrição do lançamento *(adicionado em 2026-07-08)*

**Criação/Edição:**
- Modal com campos: Data, Favorecido, Projeto, Classificação, Valor, Descrição
- Valores positivos = entradas, negativos = saídas
- Seleção de favorecido, projeto e classificação via dropdowns populados do cadastro

**Relatórios:**
- Botão "Relatório" abre modal de opções
- Escopo: lançamentos filtrados ou todos os lançamentos do período
- Formato: PDF (via html2canvas + jsPDF), Excel (via SheetJS) ou HTML
- Inclui seção de resumo: saldo inicial, entradas, saídas, saldo final *(Excel adicionado em 2026-05-08)*
- Título/nome do arquivo refletem o modo de filtro ativo (dia específico, intervalo "de...a..." ou mês/ano) *(adicionado em 2026-07-08)*

**Arquivos principais:** [src/pages/Transactions.tsx](src/pages/Transactions.tsx), [src/hooks/useTransactions.ts](src/hooks/useTransactions.ts), [src/utils/dateFilter.ts](src/utils/dateFilter.ts), [src/components/DateFilter.tsx](src/components/DateFilter.tsx), [src/components/DatePresetPills.tsx](src/components/DatePresetPills.tsx)

---

### 4.3 Correção Monetária

**Rota:** `/monetary-correction`

Calculadora de correção monetária com índices do Banco Central do Brasil.

**Índices disponíveis:**
- SELIC (código BCB: 11)
- IPCA (código BCB: 433)
- IGPM (código BCB: 189)
- INCC (código BCB: 192)

**Modo Manual:**
- Campos: Valor Original, Data Inicial, Data Final, Índice, Taxa de Juros Adicional (% a.m.)
- Adicionar múltiplas entradas antes de calcular

**Modo Lote (Excel):**
- Upload de arquivo `.xlsx` ou `.xls`
- Detecção automática de colunas por cabeçalho
- Mapeamento manual de colunas quando necessário
- Suporte a múltiplos registros simultâneos

**Processamento:**
- Processamento concorrente de até 3 requisições simultâneas
- Barra de progresso durante o cálculo
- Chunking automático de intervalos superiores a 1 ano (requisição por blocos)
- Retry automático com backoff exponencial (3 tentativas)

**Algoritmo de cálculo** (`src/utils/finance.ts`):
1. Busca fatores diários/mensais da API BCB
2. Aplica correção multiplicativa: `valorCorrigido *= (1 + fator/100)`
3. Aplica juros simples mensais: `meses * taxa / 100`
4. Retorna: valor corrigido, valor de juros, percentual total

**Resultados:**
- Cards: Total Original, Total Corrigido, Total de Juros
- Gráfico 3D de barras: Original vs Corrigido por ano (filtrável por mês)
- Tabela com colunas: Período, Índice, Valor Original, Valor Corrigido, Juros
- Exportação para PDF e Excel

**Arquivos principais:** [src/pages/MonetaryCorrection.tsx](src/pages/MonetaryCorrection.tsx), [src/components/BatchCalc.tsx](src/components/BatchCalc.tsx), [src/components/ResultDisplay.tsx](src/components/ResultDisplay.tsx), [src/utils/finance.ts](src/utils/finance.ts), [src/services/bcbService.ts](src/services/bcbService.ts)

---

### 4.4 Histórico de Cálculos

**Rota:** `/monetary-correction/history`

Gerenciamento de tabelas de cálculo salvas por usuário.

**Funcionalidades:**
- Listagem das tabelas salvas (por usuário autenticado)
- Visualização detalhada de tabela salva
- Adição de novas entradas em tabela existente
- Edição de entradas individuais
- Remoção de entradas individuais
- Exclusão completa de tabela com todos os resultados

**Armazenamento:** Tabelas salvas via Supabase com RLS por `user_id` — cada usuário vê apenas seus próprios históricos.

**Arquivos principais:** [src/pages/MonetaryHistory.tsx](src/pages/MonetaryHistory.tsx), [src/components/SavedTables.tsx](src/components/SavedTables.tsx), [src/services/supabaseService.ts](src/services/supabaseService.ts)

---

### 4.5 Cadastro de Favorecidos

**Rota:** `/payees`

Registro de pessoas físicas e jurídicas que participam dos lançamentos.

**Campos:**
- Nome (obrigatório)
- Tipo: Pessoa Física (PF) ou Pessoa Jurídica (PJ)
- Documento: CPF (PF) ou CNPJ (PJ) com máscara automática
- Cargo/Função (opcional)
- Endereço (opcional)

**Regras:**
- Favorecido com lançamentos vinculados não pode ser excluído (proteção de integridade referencial)
- Máscara de CPF: `000.000.000-00`
- Máscara de CNPJ: `00.000.000/0000-00`

**Arquivo principal:** [src/pages/Payees.tsx](src/pages/Payees.tsx)

---

### 4.6 Cadastro de Projetos

**Rota:** `/projects`

Registro de projetos ou centros de custo para classificação de lançamentos.

**Campos:**
- Nome (obrigatório)
- Descrição (opcional)

**Arquivo principal:** [src/pages/Projects.tsx](src/pages/Projects.tsx)

---

### 4.7 Cadastro de Classificações

**Rota:** `/classifications`

Registro de categorias de receita/despesa para classificação de lançamentos.

**Campos:**
- Nome (obrigatório)
- Descrição (opcional)

**Arquivo principal:** [src/pages/Classifications.tsx](src/pages/Classifications.tsx)

---

### 4.8 Autenticação e Controle de Acesso

**Provedor:** Supabase Auth (email + senha)

**Registro:**
- Campos: Nome, CPF, E-mail, Senha
- CPF armazenado como metadado no `auth.users`
- Confirmação de e-mail configurável no painel Supabase

**Login:**
- Campos: E-mail, Senha
- Toggle mostrar/ocultar senha
- Sessão persistida no `localStorage` (gerenciado pelo Supabase)
- Redirecionamento automático ao Dashboard após login

**Controle de acesso:**
- Todas as rotas (exceto `/login` e `/register`) protegidas pelo componente `ProtectedRoute`
- Hook `useAuth()` expõe `user`, `session` e `loading`
- RLS no Supabase: tabelas de correção monetária isoladas por `user_id`
- Dados transacionais (lançamentos, cadastros) compartilhados entre todos os usuários autenticados

**Arquivos principais:** [src/lib/AuthContext.tsx](src/lib/AuthContext.tsx), [src/lib/supabase.ts](src/lib/supabase.ts), [src/pages/Login.tsx](src/pages/Login.tsx), [src/pages/Register.tsx](src/pages/Register.tsx)

---

## 5. Geração de Documentos

Todos os documentos gerados são construídos via HTML renderizado e convertido ou via jsPDF direto.

### Recibo de Pagamento de Salário

**Função:** `gerarReciboSalario()` em [src/utils/pdfGenerators.ts](src/utils/pdfGenerators.ts)

**Conteúdo:**
- Cabeçalho com logo/nome da empresa (ATTOS Empreendimentos Imobiliários S.A.)
- Nome, CPF e cargo do funcionário
- Mês de referência: **mês anterior** ao mês do lançamento *(corrigido em 2026-05-08)*
- Valor em algarismos e por extenso (via `valorPorExtenso()`)
- Campos de assinatura

### Recibo de Prestação de Serviços

**Função:** `gerarReciboServicos()` em [src/utils/pdfGenerators.ts](src/utils/pdfGenerators.ts)

**Conteúdo:**
- Dados do prestador: nome, CPF/CNPJ, endereço
- Descrição do serviço prestado
- Valor em algarismos e por extenso
- Data da transação
- Campo de assinatura

### Relatório de Período

**Função:** `gerarRelatorioPeriodo()` em [src/utils/pdfGenerators.ts](src/utils/pdfGenerators.ts)

**Conteúdo:**
- Período do relatório
- Tabela de lançamentos (data, favorecido, projeto, classificação, valor, descrição)
- Seção de resumo: saldo inicial, entradas, saídas, saldo final

**Formatos de saída disponíveis:** PDF, Excel (`.xlsx`), HTML

### Utilitário: Valor por Extenso

**Função:** `valorPorExtenso()` em [src/lib/valorPorExtenso.ts](src/lib/valorPorExtenso.ts)

Converte valor numérico para texto em português brasileiro.
Exemplo: `1523.45` → `"um mil, quinhentos e vinte e três reais e quarenta e cinco centavos"`

---

## 6. Integração com APIs Externas

### API do Banco Central do Brasil (BCB)

**Endpoint base:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados`

**Arquivo:** [src/services/bcbService.ts](src/services/bcbService.ts)

| Índice | Código da Série | Periodicidade |
|---|---|---|
| SELIC | 11 | Diária |
| IPCA | 433 | Mensal |
| IGPM | 189 | Mensal |
| INCC | 192 | Mensal |

**Comportamentos implementados:**
- Requisições com parâmetros `dataInicial` e `dataFinal` no formato `dd/MM/yyyy`
- Chunking automático: intervalos superiores a 1 ano são divididos em sub-requisições de até 12 meses
- Retry com backoff exponencial: até 3 tentativas, com delay crescente em caso de falha
- Resposta em JSON com campos `data` (string `dd/MM/yyyy`) e `valor` (string percentual)

### Supabase

**Arquivo:** [src/lib/supabase.ts](src/lib/supabase.ts)

Variáveis de ambiente necessárias:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O cliente Supabase usa valores placeholder quando as variáveis não estão definidas (ambiente de teste), evitando erros de inicialização que impediriam o carregamento de mocks nos testes unitários.

---

## 7. Banco de Dados

### Tabelas Transacionais (compartilhadas — single-tenant)

#### `public.payees`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer | PK, auto-increment |
| name | text | Nome do favorecido |
| type | text | `'PF'` ou `'PJ'` |
| document | text | CPF ou CNPJ (nullable) |
| cargo | text | Cargo/função (nullable) |
| endereco | text | Endereço completo (nullable) |

#### `public.projects`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer | PK, auto-increment |
| name | text | Nome do projeto |
| description | text | Descrição (nullable) |

#### `public.classifications`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer | PK, auto-increment |
| name | text | Nome da classificação |
| description | text | Descrição (nullable) |

#### `public.transactions`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer | PK, auto-increment |
| date | date | Data do lançamento (YYYY-MM-DD) |
| payee_id | integer | FK → payees.id (nullable) |
| project_id | integer | FK → projects.id (nullable) |
| classification_id | integer | FK → classifications.id (nullable) |
| amount | numeric | Positivo = entrada, negativo = saída |
| description | text | Descrição do lançamento |

### Tabelas de Correção Monetária (isoladas por usuário — RLS)

#### `public.monetary_saved_tables`

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK, `gen_random_uuid()` |
| user_id | uuid | FK → auth.users.id |
| name | text | Nome da tabela |
| created_at | timestamptz | — |
| updated_at | timestamptz | — |

**RLS:** Usuário vê apenas suas próprias tabelas.

#### `public.monetary_calculation_results`

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| table_id | uuid | FK → monetary_saved_tables.id |
| data | jsonb | Array de `CalculationEntry` |
| created_at | timestamptz | — |
| updated_at | timestamptz | — |

**RLS:** Herda isolamento via `table_id` → `monetary_saved_tables.user_id`.

### Autenticação

**`auth.users`** (gerenciado pelo Supabase Auth)

Metadados relevantes:
- `raw_user_meta_data.nome`: nome do usuário
- `raw_user_meta_data.cpf`: CPF do usuário

---

## 8. Pipeline CI/CD

**Arquivo:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

**Trigger:** Push e Pull Request na branch `main`

**Etapas:**
1. **Build** — `npm run build` com variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` injetadas via GitHub Secrets
2. **Lint** — `npm run lint`
3. **Testes unitários** — `npm run test` com variáveis de ambiente injetadas
4. **Testes E2E** — Playwright com variáveis de ambiente injetadas

**Deploy:** Automático via Vercel ao passar o pipeline na branch `main`.

**Configuração Vercel** (`vercel.json`): Regra de rewrite `/*` → `/index.html` para suporte ao React Router SPA.

---

## 9. Testes

### Testes Unitários (Vitest)

**Configuração:** [vitest.setup.ts](vitest.setup.ts), ambiente jsdom

**Arquivos de teste:**
- [src/App.test.tsx](src/App.test.tsx) — Smoke test da aplicação
- [src/pages/Login.test.tsx](src/pages/Login.test.tsx) — Testes da página de login

**Utilitários:**
- [src/utils/testFactories.ts](src/utils/testFactories.ts) — Factories para criação de objetos de teste
- [src/utils/testUtils.tsx](src/utils/testUtils.tsx) — Setup e wrappers de contexto para testes

### Testes E2E (Playwright)

**Configuração:** [playwright.config.ts](playwright.config.ts)

**Arquivos de teste:**
- [e2e/login.spec.ts](e2e/login.spec.ts) — Fluxo de login end-to-end

---

## Histórico de Alterações

> Formato: `[DATA] — Tipo — Módulo/Arquivo — Descrição`
> Tipos: **Funcional** (nova feature), **Corretivo** (bug fix), **Evolutivo** (melhoria), **Estrutural** (infra, config, refactor)

---

### 2026-03-23 — Primeiro Deploy

**Commit:** `11e1202` — `feat: first commit`
**Tipo:** Funcional

Sistema completo entregue no primeiro deploy. Funcionalidades incluídas na versão inicial:

- Módulo de autenticação (login, registro, proteção de rotas)
- Dashboard financeiro com navegação por período e gráficos de pizza
- Livro caixa (lançamentos) com CRUD, filtros e geração de recibos
- Calculadora de correção monetária (SELIC, IPCA, IGPM, INCC) com modos manual e em lote
- Histórico de cálculos de correção monetária com persistência por usuário
- Cadastro de favorecidos (PF/PJ com máscaras de CPF/CNPJ)
- Cadastro de projetos
- Cadastro de classificações
- Integração com API do Banco Central do Brasil
- Integração com Supabase (Auth + PostgreSQL + RLS)
- Exportação de resultados para PDF e Excel
- Geração de recibos de salário e prestação de serviços
- Conversão de valores numéricos para texto em português (`valorPorExtenso`)

---

### 2026-05-08 — Preparação para Deploy de Produção

**Commit:** `49a81be` — `chore: prepare for production deploy`
**Tipo:** Estrutural / Evolutivo

**Alterações:**

- **Lint:** Correção de erros ESLint (`no-explicit-any`, `no-unused-vars`) em múltiplos arquivos
- **Vite config:** Removido chunk `vendor-motion` vazio da configuração de code splitting
- **`.gitignore`:** Ajustes de formatação; adicionados artefatos do Playwright
- **CI/CD:** Adicionado pipeline GitHub Actions (`.github/workflows/ci.yml`) com etapas de build, lint, testes unitários e testes E2E
- **Testes:** Adicionados testes unitários (`Login.test.tsx`, `App.test.tsx`) e E2E (`e2e/login.spec.ts`) com Playwright
- **Prettier:** Adicionado arquivo de configuração (`.prettierrc`)
- **Documentação técnica:** Adicionados `ESPECIFICACOES_SISTEMA.md`, `Especificacoes_Frontend.md`, `FLUXO_DO_SISTEMA.md`
- **Skills Claude Code:** Adicionado `AVAILABLE_SKILLS.md` e arquivos em `Skills/`
- **Hook `useTransactions`:** Extraído para `src/hooks/useTransactions.ts` — centraliza estado, filtros, navegação e formatação de moeda da página de Lançamentos
- **`pdfGenerators.ts`:** Extraído para `src/utils/pdfGenerators.ts` — separa lógica de geração de HTML/PDF da página de Lançamentos
- **Refactor geral:** Refatoração significativa de `Transactions.tsx`, `BatchCalc.tsx`, `DashboardSummary.tsx`, `ResultDisplay.tsx`, `SavedTables.tsx`, `Dashboard.tsx` e demais páginas para reduzir complexidade
- **API client (`api.ts`):** Refatorado para melhor separação de responsabilidades
- **`bcbService.ts`:** Melhorias no tratamento de erros e retry logic
- **`supabaseService.ts`:** Ajustes na interface de métodos de persistência
- **`valorPorExtenso.ts`:** Refatoração interna
- **`AuthContext.tsx`:** Ajuste no provider de autenticação

**Módulos impactados:** Todos (refatoração ampla pré-deploy)

---

### 2026-05-08 — Correção de Pipeline CI e Export Excel

**Commit:** `0fec1cc` — `fix: unblock CI/deploy pipeline and add Excel export`
**Tipo:** Corretivo / Funcional

**Alterações:**

1. **CI/CD** ([.github/workflows/ci.yml](.github/workflows/ci.yml)):
   - Adicionadas variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas etapas de build e E2E — o build falhava por ausência dessas variáveis

2. **Supabase Auth** ([src/lib/AuthContext.tsx](src/lib/AuthContext.tsx)):
   - Adicionado `.catch()` em `getSession()` para que o estado de `loading` sempre seja resolvido, mesmo quando o Supabase está inacessível — evitava tela branca em ambiente sem conexão

3. **Vercel** ([vercel.json](vercel.json)):
   - Restaurada a regra de rewrite `/*` → `/index.html`, necessária para o React Router funcionar corretamente em SPA (URLs diretas retornavam 404)

4. **Export Excel em Lançamentos** ([src/pages/Transactions.tsx](src/pages/Transactions.tsx)):
   - Adicionada opção de exportação para Excel (`.xlsx`) no modal de relatório da página de Lançamentos (formato disponível anteriormente apenas via PDF e HTML)

**Módulos impactados:** CI/CD, Autenticação, Deploy, Lançamentos

---

### 2026-05-08 — Correção de Variáveis de Ambiente nos Testes Unitários

**Commit:** `75f0a51` — `fix: add env vars to unit test step in CI`
**Tipo:** Corretivo

**Alteração:**

- **CI/CD** ([.github/workflows/ci.yml](.github/workflows/ci.yml)):
  - Adicionadas variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` também na etapa de testes unitários (passo `Run unit tests`) — a etapa falhava pois o Vitest carregava o módulo `supabase.ts` que lançava erro quando as variáveis estavam ausentes

**Módulo impactado:** CI/CD (testes unitários)

---

### 2026-05-08 — Correção do Cliente Supabase para Testes Unitários

**Commit:** `38b34f9` — `fix: remove module-level throw in supabase.ts to unblock unit tests`
**Tipo:** Corretivo

**Alteração:**

- **`src/lib/supabase.ts`** ([src/lib/supabase.ts](src/lib/supabase.ts)):
  - Removido `throw` em nível de módulo que era executado quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estavam ausentes
  - O throw impedia o hoisting do `vi.mock()` pelo Vitest, impossibilitando o carregamento de `AuthContext` nos testes
  - Substituído por fallback para valores placeholder (`'http://placeholder'`, `'placeholder'`) — sem impacto em produção (variáveis sempre presentes) e sem impacto nos testes (Supabase é sempre mockado)

**Módulo impactado:** Autenticação, Testes Unitários

---

### 2026-05-08 — Botão Duplicar Lançamento e Correção do Recibo de Salário

**Commit:** `7039f88` — `feat: add duplicate transaction button and fix salary receipt reference month`
**Tipo:** Funcional / Corretivo

**Alterações:**

1. **Botão "Duplicar" em Lançamentos** ([src/pages/Transactions.tsx](src/pages/Transactions.tsx)):
   - Adicionado botão de ação "Duplicar" na linha de cada lançamento da tabela
   - Ao clicar, o formulário de criação de novo lançamento é aberto pré-preenchido com todos os dados do lançamento selecionado (data, favorecido, projeto, classificação, valor, descrição)
   - Agiliza o registro de lançamentos recorrentes sem necessidade de preencher todos os campos manualmente

2. **Mês de Referência no Recibo de Salário** ([src/utils/pdfGenerators.ts](src/utils/pdfGenerators.ts)):
   - Corrigido: o recibo de pagamento de salário agora exibe o **mês anterior** ao mês do lançamento como período de referência
   - Antes exibia o próprio mês do lançamento, o que estava incorreto (salário de abril é pago em maio)
   - Utilizadas funções `subMonths` e `format` do `date-fns` para calcular o mês anterior

**Módulos impactados:** Lançamentos, Geração de Documentos

---

### 2026-07-08 — Histórico no Recibo de Salário

**Tag:** `v1.0.0`
**Tipo:** Evolutivo

**Alterações:**

1. **Recibo de Salário** ([src/utils/pdfGenerators.ts](src/utils/pdfGenerators.ts)):
   - Adicionado campo "Histórico" ao recibo de pagamento de salário, exibindo a descrição do lançamento de origem

**Módulos impactados:** Lançamentos, Geração de Documentos

---

### 2026-07-08 — Filtro de Datas Unificado em Lançamentos

**Tag:** `v1.0.0`
**Tipo:** Funcional

**Alterações:**

1. **Filtro de datas com 3 modos** ([src/components/DateFilter.tsx](src/components/DateFilter.tsx), [src/components/DatePresetPills.tsx](src/components/DatePresetPills.tsx), [src/utils/dateFilter.ts](src/utils/dateFilter.ts)):
   - Substituído o seletor de período (só mensal/anual) por um filtro unificado com abas **Dia**, **Período** e **Mês**
   - **Dia:** seleção de uma data específica via `<input type="date">`
   - **Período:** intervalo livre (início/fim) com 6 pills de atalho — Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês, Mês passado — mais o estado implícito "Personalizado" ao editar as datas manualmente
   - **Mês:** comportamento legado (mensal/anual, navegação anterior/próximo) preservado sem alteração
   - Transição entre modos animada com a biblioteca `motion`, já presente no projeto
   - Validação client-side (dia obrigatório; período exige início e fim com fim ≥ início) — sem camada de backend própria, o projeto usa Supabase consultado direto do frontend

2. **API de consultas** ([src/lib/api.ts](src/lib/api.ts)):
   - `getTransactions`/`getBalance` passam a receber `{ dataInicio, dataFim }` já resolvidos, em vez do parâmetro `period` (string ambígua inferida por tamanho `yyyy` vs `yyyy-MM`)

3. **Persistência de URL** ([src/hooks/useTransactions.ts](src/hooks/useTransactions.ts)):
   - O filtro ativo (modo + parâmetros) é sincronizado com a query string via `useSearchParams`, permitindo recarregar ou compartilhar o link com o filtro preservado
   - Estado hidratado de forma "lazy" a partir da URL (sem efeito pós-montagem), evitando um fetch inicial desperdiçado com valores padrão antes da hidratação

4. **Dashboard** ([src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)):
   - Apenas o ponto de chamada de `getBalance` foi adaptado à nova assinatura (reaproveitando `resolveDateRange` de `dateFilter.ts`); o seletor de período próprio do Dashboard não foi alterado

**Módulos impactados:** Lançamentos, Dashboard

---

*Última atualização: 2026-07-08*
*Responsável pela manutenção: Equipe de Desenvolvimento — ATTOS Empreendimentos Imobiliários S.A.*
