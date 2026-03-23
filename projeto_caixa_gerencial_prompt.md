# Prompt de Contexto do Projeto: Caixa Gerencial

Este documento serve como a "fonte da verdade" para o projeto **Caixa Gerencial**, um sistema de gestão financeira focado em controle de pequenos caixas em espécie (petty cash). Use as informações abaixo para manter a consistência ao gerar código, sugerir melhorias ou explicar funcionalidades.

---

## 1. Visão Geral do Projeto
- **Objetivo**: Controle de fluxo de caixa (entradas e saídas) com saldo inicial, transações detalhadas e visão por projetos e classificações.
- **Público**: Gestores financeiros que precisam de uma interface limpa para gerenciar lançamentos manuais.

## 2. Stack Tecnológica
- **Frontend**: React 19, TypeScript, Vite.
- **Estilização**: Tailwind CSS 4.x (via `@tailwindcss/vite`) e classes com semântica Bootstrap (`form-control`, `form-select`) para formulários.
- **Navegação**: React Router DOM (v7).
- **Ícones**: Lucide React.
- **Animações**: Framer Motion (`motion`).
- **Gráficos**: Recharts.
- **Exportação PDF**: `jsPDF` e `jspdf-autotable`.
- **Utils**: `date-fns`, `clsx`, `tailwind-merge`.
- **Backend/DB**: Express + Better-SQLite3 (banco de dados local `petty_cash.db`).

## 3. Arquitetura de Dados (SQLite)
- **`payees`**: (id, name, type [PF/PJ], document, created_at)
- **`projects`**: (id, name, description, created_at)
- **`classifications`**: (id, name, description, created_at)
- **`transactions`**: (id, date [YYYY-MM-DD], payee_id, project_id, classification_id, amount, description, created_at)
  - *Nota*: Valores positivos em `amount` são ENTRADAS. Valores negativos são SAÍDAS.

## 4. Guia de Estilo (UI/UX)
- **Paleta de Cores**:
  - **Destaque**: Emerald (`#10b981`) para temas de dinheiro e acentos positivos.
  - **Fundo/Interface**: Slate (`#0f172a` para sidebar, `#f8fafc` para fundo principal).
  - **Tipografia**: Sans-serif moderna (Inter/Outfit).
- **Componentes**: Cards com bordas arredondadas (`rounded-2xl`), sombras suaves (`shadow-sm`), botões estilizados com hover e transições.

## 5. Estrutura de Páginas e Rotas
- `/` - **Dashboard**: Visão consolidada com 4 cards de topo (Saldo Inicial, Entradas, Saídas, Saldo Atual) e gráficos de pizza (Despesas por Projeto e por Classificação).
- `/transactions` - **Lançamentos**: Listagem tabular de transações com filtros por período e formulário modal para novos lançamentos.
- `/payees` - **Favorecidos**: Gerenciamento de pessoas/empresas (PF/PJ).
- `/projects` - **Projetos**: Cadastro de centros de custo ou projetos específicos.
- `/classifications` - **Classificações**: Categorias financeiras para os lançamentos.

## 6. Regras de Negócio Importantes
- **Cálculo de Saldo**:
  - `Saldo Inicial`: Soma de todas as transações anteriores ao mês/período selecionado.
  - `Saldo Atual`: Saldo Inicial + (Entradas do Período - Saídas do Período).
- **Linguagem**: O sistema está inteiramente em **Português do Brasil (pt-BR)**.
- **API**: Todas as rotas de API residem sob o prefixo `/api/*` (ex: `/api/transactions`, `/api/balance/:period`).

---

## 7. Módulo de Lançamentos e Relatórios Dinâmicos
- **Filtros Dinâmicos**:
  - A tela de Lançamentos possui filtros dinâmicos no cabeçalho da tabela (Data com seletores de Dia, Mês e Ano específicos; Histórico, Favorecido, Projeto, Classificação e Valor).
  - A lógica de filtragem ocorre em memória na constante `filteredTransactions` com base nos dados brutos da API. Isso garante que os saldos exibidos no cabeçalho não sejam alterados, refletindo o período real.
- **Exportação e Relatórios**:
  - O botão de "Relatório" aciona um Modal (estilo Bootstrap) onde o usuário define o escopo (Dados Filtrados da tela ou Relatório Completo do mês/ano).
  - Pode-se exportar via Inpressão nativa de Browser ou gerando um documento `.pdf` parametrizado usando a biblioteca `jsPDF`.

---

**Instrução para a IA**: Ao trabalhar neste projeto, sempre respeite esses padrões visuais e arquiteturais. Priorize código limpo, TypeScript tipado e interfaces que causem um efeito "WOW" de profissionalismo.
