# Documento de Especificações do Frontend
**Projeto:** Gestão Financeira (Caixa Gerencial)
**Objetivo:** Estabelecer os padrões visuais, comportamentais e estruturais do frontend para garantir a consistência no desenvolvimento de novos módulos e funcionalidades.

---

## 1. Estrutura Geral da Interface

### Organização das Páginas
A aplicação segue o modelo de **Dashboard (Single Page Application)** com uma estrutura de layout fixa que divide a navegação global do conteúdo específico da página.

### Layout Principal e Variações
- **Container Principal (`AppLayout`):** Ocupa 100% da altura da tela (`100vh`) e oculta qualquer transbordo global (`overflow-hidden`), definindo o fundo geral da aplicação como um tom de cinza muito claro (`bg-neutral-50`).
- **Sidebar (Esquerda):** Painel de navegação fixo com fundo escuro (`bg-neutral-900`) e largura de `16rem` (`w-64`) no desktop.
- **Área de Conteúdo (Direita):** Ocupa o restante do espaço (`flex-1`) com rolagem vertical habilitada (`overflow-y-auto`). Todo o conteúdo da página fica dentro de um limite de largura máxima (`max-w-7xl mx-auto`) com preenchimentos laterais de `p-4 md:p-8` para respiro.

### Hierarquia Visual
1. **Navegação Global (Nível 1):** Sidebar lateral.
2. **Cabeçalho da Página (Nível 2):** Título (`h1`) grande e subtítulo cinza, dispostos horizontalmente com os controles de ação primários (botões "Novo", "Relatório", Filtros de data).
3. **Cartões de Resumo / KPI (Nível 3):** Cards horizontais no topo exibindo informações consolidadas (Ex: Saldo Inicial, Entradas, Saídas, Saldo Atual).
4. **Conteúdo Analítico / Tabelas (Nível 4):** Listagens de dados ou gráficos dispostos em cards grandes abaixo dos KPIs.

---

## 2. Paleta de Cores

A identidade visual utiliza tons neutros altamente contrastantes com cores semânticas vibrantes para facilitar a leitura e tomada de decisão. As classes são baseadas no **Tailwind CSS**.

### Cores Primárias e Secundárias
- **Fundo Global:** `bg-neutral-50` (Cinza claro quase branco).
- **Fundo de Cards/Modais:** `bg-white`.
- **Fundo Primário Escuro (Sidebar, Botões de Ação Principal, Cards de Destaque):** `bg-neutral-900`.
- **Fundo Secundário Escuro (Ativos na Sidebar):** `bg-neutral-800`.
- **Texto Principal:** `text-neutral-900` e `text-neutral-700`.
- **Texto Secundário / Descritivo:** `text-neutral-500` e `text-neutral-400`.
- **Bordas e Linhas Divisórias:** `border-neutral-200` (Padrão) e `border-neutral-300` (Inputs).

### Cores Semânticas
- **Sucesso / Entrada:** 
  - Fundo/Ícone: `bg-emerald-100` / `text-emerald-600`.
- **Erro / Saída / Alerta Destrutivo:** 
  - Fundo/Ícone: `bg-red-100` ou `bg-red-50` / `text-red-600` ou `text-red-500`.
- **Destaque de Seleção / Ícones Ativos:** `text-blue-400` ou `text-blue-600` (utilizado pontualmente em links ativos ou botões edit).
- **Gráficos (Paleta Categórica):** 
  - Utiliza uma paleta de 8 cores fixas e vibrantes: Azul (`#3b82f6`), Esmeralda (`#10b981`), Âmbar (`#f59e0b`), Vermelho (`#ef4444`), Violeta (`#8b5cf6`), Rosa (`#ec4899`), Ciano (`#06b6d4`) e Laranja (`#f97316`).

### Regras de Uso e Combinações
- NUNCA utilizar cores vibrantes como fundo principal de grandes áreas. Elas devem ser restritas a ícones, distintivos (badges), gráficos e valores monetários.
- Ações primárias devem ser representadas pelo contraste de `bg-neutral-900` com `text-white`.
- Ações secundárias devem usar `bg-white` com `border-neutral-200` e texto `text-neutral-700`.

---

## 3. Tipografia

- **Fonte Padrão:** Sans-serif do sistema (`font-sans`), provida pelo Tailwind (Inter/Roboto/San Francisco).
- **Pesos Utilizados:**
  - `font-normal`: Corpo de texto em tabelas (`text-sm`).
  - `font-medium`: Títulos de colunas de tabela, botões, rótulos (labels) e status.
  - `font-semibold`: Subtítulos, grupos de navegação (`uppercase tracking-wider`).
  - `font-bold`: Títulos principais da página (`text-2xl`), Valores monetários de destaque (`text-2xl`), Títulos de Modais (`text-lg` ou `text-xl`).

- **Tamanhos Padrão:**
  - Valores muito pequenos (badges, labels de gráficos): `text-xs`.
  - Corpo da aplicação (tabelas, formulários): `text-sm`.
  - Texto padrão legível: `text-base` (geralmente implícito).
  - Títulos de sessão: `text-lg`.
  - Títulos de página / KPIs numéricos: `text-2xl`.

---

## 4. Menus e Navegação

### Menu Principal (Sidebar)
- **Logotipo:** No topo da Sidebar, acompanhado pelo nome "Gestão Financeira".
- **Estrutura Agrupada:** Módulos expansíveis (Accordion).
  - *Cabeçalho do Grupo:* Texto `text-xs font-semibold uppercase tracking-wider text-neutral-500`. Possui chevron indicando estado (recolhido/expandido).
  - *Itens do Grupo:* Link flex com um ícone à esquerda (`w-4 h-4`) e texto (`text-sm`). Espaçamento interno de `px-3 py-2`, borda arredondada (`rounded-xl`).
- **Estados da Navegação:**
  - *Inativo:* `text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50`.
  - *Ativo:* Fundo `bg-neutral-800`, texto `text-white font-medium`, sombra fina `shadow-sm ring-1 ring-white/10`. O ícone recebe a cor `text-blue-400`.
- **Menu do Usuário:** Posicionado na parte inferior da sidebar (rodapé fixo), com borda superior `border-t border-neutral-800`. Botão de logout destacando-se com hover vermelho (`hover:text-red-400`).

---

## 5. Componentes e Elementos Visuais

- **Ícones:** Biblioteca **Lucide React**. Tamanho padrão `w-5 h-5` para botões soltos e cabeçalhos; `w-4 h-4` para itens de lista e ações de tabela; `w-6 h-6` para menus móveis.
- **Cartões (Cards):** Utilizados para separar as áreas da interface. Fundo branco (`bg-white`), bordas muito arredondadas (`rounded-2xl` ou `rounded-xl`), contorno sutil (`border border-neutral-200`) e sombra leve (`shadow-sm`).
- **Botões Principais:** Formato arredondado (`rounded-xl`), preenchimento `px-4 py-2` (ou `py-2.5`), com flex para ícone e texto (`gap-2`). Sombra `shadow-sm`.
- **Inputs e Selects:** 
  - Altura padrão, preenchimento interno `px-3 py-2`, bordas visíveis (`border border-neutral-300`), cantos `rounded-xl`. Sem sombra externa.
  - Campos de filtro inline: usam formatação menor (`text-xs rounded px-2 py-1`).
- **Tabelas:**
  - Cabeçalho: Fundo `bg-neutral-50/50`, texto em tom cinza médio `text-neutral-500 text-xs` ou `text-sm`, todas as células alinhadas à esquerda (exceto valores numéricos e ações, que ficam à direita).
  - Linhas de Tabela: Separadas por `divide-y divide-neutral-100` ou `neutral-200`. Transição suave no hover (`hover:bg-neutral-50`).
- **Modais:**
  - Sobreposição: Fundo escurecido semidesfocado (`bg-black/50`).
  - Container do Modal: Centro da tela, `bg-white rounded-2xl shadow-xl max-w-md w-full`.
  - Estrutura: Header (Título + Botão X), Body (scroll interno se necessário `overflow-y-auto`, `p-6`), Footer (Ações com fundo `bg-neutral-50`, alinhadas à direita).
- **Badges (Etiquetas):** Formato "pílula" (`rounded-full`), fundo sutil (`bg-neutral-100`), texto miúdo (`text-xs font-medium text-neutral-700`). Preenchimento enxuto `px-2.5 py-0.5`.

---

## 6. Estados e Interações

- **Hover (Passar o Mouse):**
  - O sistema abusa de microtransições nos hovers de botão (`transition-colors`).
  - Linhas de tabela sempre devem destacar a linha atual (`hover:bg-neutral-50`).
  - Ações de linha (editar, deletar, imprimir) ficam **ocultas** (opacidade 0) por padrão e aparecem apenas no hover da linha da tabela (`group-hover:opacity-100`).
- **Focus (Navegação via teclado / Foco em Input):**
  - Ao focar em um campo de entrada (`input`, `select`), o contorno padrão do navegador é removido (`outline-none`) e é ativado um anel de foco customizado: `focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400`.
- **Carregamento (Loading):** 
  - Spinner minimalista construído em CSS puro (`w-10 h-10 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin`).

---

## 7. Efeitos Visuais e Animações

- **Transições:** Praticamente todos os botões e elementos interativos possuem `transition-all` ou `transition-colors` com `duration-200`.
- **Animações de Entrada/Saída:**
  - Menus e sidebars utilizam transformações em eixo X (`translate-x-0` vs `-translate-x-full`) com suavização (`ease-in-out`).
  - Accordions utilizam grid tricks (`grid-rows-[1fr]` vs `grid-rows-[0fr]`) aliado com opacidade para efeito de sanfona macio em CSS puro, sem recorrer a JavaScript pesado.
- **Sombras:** Uso restrito a três níveis (`shadow-sm` na maioria dos cartões e botões, sombra nativa do navegador para tooltip de gráficos, `shadow-xl` restrito a modais focais).

---

## 8. Tema Visual

### Estilo Geral e Sensação
A interface transborda o **minimalismo corporativo**. Ela foge das interfaces burocráticas pesadas e antigas, apostando no **design "Clean" e de alto contraste**.
- **A Sensação Desejada:** Confiança, agilidade e modernidade. O usuário deve sentir que a plataforma responde imediatamente (ajudado pelas microinterações de hover) e focar nos números, que possuem espaços em branco adequados (respiro).
- **Coerência:** Novos módulos devem manter a preferência pelo uso de fundos brancos puros dentro de um fundo cinza de página, utilizando apenas a paleta neutra (Preto/Cinza/Branco) para marcações estruturais, reservando o verde e o vermelho exclusivamente para status financeiros ou ações perigosas.

---

## 9. Responsividade

- **Mobile (Smartphones - telas menores que `md`):**
  - A Sidebar lateral desaparece.
  - Surge uma **Top Bar** branca com logotipo e um botão "Sanduíche" (Menu).
  - O clique no Menu desliza a Sidebar sobre a tela (`fixed inset-y-0 left-0 z-50`) coberta por um overlay.
  - As grids passam de 4 colunas (`grid-cols-4`) para 1 coluna empilhada (`grid-cols-1`).
  - Elementos em "linha" flexível passam para coluna (`flex-col sm:flex-row`).
- **Tabelas no Mobile:** Para lidar com os limites horizontais da tabela, as listagens são envelopadas em um contêiner com rolagem no eixo X (`overflow-x-auto`), com o atributo `whitespace-nowrap` em células chave.

---

## 10. Regras de Padronização e Expansão

Para os desenvolvedores de futuros módulos manterem a consistência visual desta interface:

1. **O que NÃO PODE ser alterado:**
   - **Arredondamento:** Nunca use contornos quadrados (`rounded-none` ou cantos afiados padrão). Todos os cartões devem possuir `rounded-2xl` e botões/inputs `rounded-xl`.
   - **Uso Extremo de Cores Puras:** Não pinte cabeçalhos de tabela, rodapés ou grandes faixas de fundo com cores vibrantes (como azul ou vermelho). O sistema é baseado em `branco/preto/cinza`.
   - **Cores Semânticas Trocadas:** O vermelho NUNCA deve representar uma receita e o verde NUNCA uma saída ou cancelamento.
   - **Estado Hover de Tabelas:** Ocultar botões de ação e revelá-los apenas via hover na linha da tabela é a lei, para evitar o "clutter" (poluição visual) na tela.

2. **Critérios para Novas Criações:**
   - Ao adicionar novos gráficos, utilize a paleta `COLORS` definida em `Dashboard.tsx`.
   - Se for criar um componente de diálogo (Modal), construa com um overlay de `bg-black/50`, largura travada em `max-w-md` ou `max-w-xl` e três partições (Header border-b, Body paddings, Footer background gray).
   - Botões devem seguir explicitamente o tamanho e espessura definidos na Seção 5, inclusive carregando ícones do pacote `lucide-react`.

3. **Requisitos de Código:**
   - Utilize funções de utilidade (Ex: `cn()` com `clsx` e `tailwind-merge`) para unir classes customizadas sem sobrescrever as predefinições.
   - Escreva HTML semântico com classes de responsividade adequadas (`sm:`, `md:`, `lg:`).
   - Componentes muito extensos devem ser fatiados em componentes menores; mas as classes de layout globais devem continuar vindo da biblioteca Tailwind nativa para evitar "vendor lock-in" com CSS Customizado no index.css.
