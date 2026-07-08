# Design System: Caixa Gerencial (Gestão Financeira)
**Project ID:** Gestão Financeira

## 1. Visual Theme & Atmosphere
Minimalismo corporativo ágil e de alto contraste. Foge da burocracia de sistemas legados. A interface transmite "confiança, agilidade e clareza", com foco nos dados e métricas isolados por vastas áreas de respiro (whitespace). Microtransições indicam responsividade orgânica a cada clique e hover.

## 2. Color Palette & Roles
* **Branco Puro** (`#FFFFFF`): Fundo de cartões/modais, focado no conteúdo em destaque.
* **Cinza Translúcido / Gelo** (`bg-neutral-50`): Fundo global da aplicação para separar os cartões do ambiente da tela.
* **Preto Carvão Profundo** (`bg-neutral-900`): Usado na Sidebar e botões de ação principal, criando âncoras focais muito nítidas de navegação.
* **Esmeralda Positiva** (`bg-emerald-100` / `text-emerald-600`): Role de sucesso, indicativo de entradas/receitas.
* **Vermelho Alerta** (`bg-red-100` / `text-red-600`): Role de erro, indicativo de despesas/saídas ou botões destrutivos.
* **Azul Elétrico** (`text-blue-400`): Destaque pontual para o que está ativo/selecionado (itens da sidebar).

## 3. Typography Rules
* **Família**: Sans-serif nativa de interface (provida pelo Tailwind - Inter/Roboto).
* **Pesos**: `normal` para listagens e tabelas; `medium` para status, botões e labels; `bold` estritamente reservado para títulos proeminentes da página (`text-2xl`) e para dar ênfase visual em KPI/montantes de moedas.

## 4. Component Stylings
* **Buttons:** Arredondados em formato pílula orgânica (`rounded-xl`), preenchimento generoso (`px-4 py-2`), sempre com contraste rígido e microtransições suaves (200ms) no hover.
* **Cards/Containers:** Fundo branco blindado contra o cinza global, bordas muito arredondadas (`rounded-2xl`), sutis linhas delimitadoras em cinza fraco e leve profundidade (`shadow-sm`).
* **Inputs/Forms:** Formato também arredondado (`rounded-xl`), bordas visíveis sem sombra, ativando um "focus ring" no uso do teclado para aprimorar a acessibilidade e digitação ágil de moedas/dados.
* **Tabelas:** Linhas ativadas no hover (`hover:bg-neutral-50`). Botões de ações de cada linha ficam *ocultos* por padrão e revelam-se perante o hover do mouse.

## 5. Layout Principles
100vh fixo sem overflow global. A Sidebar dita a navegação (oculta-se em mobile para uma *Top Bar* com hambúrguer). O conteúdo rola internamente e é encapsulado sob `max-w-7xl` para não perder a proporção em telas ultrawide.
