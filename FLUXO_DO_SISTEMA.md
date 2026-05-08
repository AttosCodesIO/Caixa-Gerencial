# Mapa de Fluxo do Sistema — Caixa Gerencial

---

## 1. Fluxo Geral de Acesso

```mermaid
flowchart TD
    START([Usuário acessa o sistema]) --> AUTH{Sessão ativa?}

    AUTH -- Não --> LOGIN[/Tela de Login/]
    AUTH -- Sim --> DASHBOARD[Dashboard]

    LOGIN --> FORM_LOGIN[Informar e-mail e senha]
    FORM_LOGIN --> SIGN_IN{Autenticação}
    SIGN_IN -- Sucesso --> DASHBOARD
    SIGN_IN -- "E-mail não confirmado" --> ERR_EMAIL[Exibe: confirme seu e-mail]
    SIGN_IN -- "Credenciais inválidas" --> ERR_CRED[Exibe: usuário ou senha incorretos]
    ERR_EMAIL --> FORM_LOGIN
    ERR_CRED --> FORM_LOGIN

    LOGIN --> LINK_REG[Ir para Cadastro]
    LINK_REG --> REGISTER[/Tela de Cadastro/]
    REGISTER --> FORM_REG[Informar nome, CPF, e-mail, senha]
    FORM_REG --> SIGN_UP{Criar conta}
    SIGN_UP -- Sucesso --> MSG_OK[Exibe: conta criada — redirecionando]
    MSG_OK --> LOGIN
    SIGN_UP -- Erro --> ERR_REG[Exibe mensagem de erro]
    ERR_REG --> FORM_REG

    DASHBOARD --> MENU{Menu lateral}
    MENU --> MOD_CAIXA[Caixa Gerencial]
    MENU --> MOD_CM[Correção Monetária]
    MENU --> MOD_CAD[Cadastros]
    MENU --> LOGOUT[Sair]
    LOGOUT --> START
```

---

## 2. Módulo: Caixa Gerencial — Dashboard

```mermaid
flowchart TD
    DASH([Dashboard]) --> SEL_PERIODO[Selecionar período\nMensal ou Anual]
    SEL_PERIODO --> NAV{Navegar período}
    NAV -- Anterior --> LOAD_PREV[Carrega período anterior]
    NAV -- Próximo --> LOAD_NEXT[Carrega período seguinte]
    LOAD_PREV --> CALC
    LOAD_NEXT --> CALC

    SEL_PERIODO --> CALC[Calcular balanço do período]
    CALC --> SALDO_INI[Saldo Inicial\nSoma acumulada antes do período]
    CALC --> ENTRADAS[Entradas\nSoma transações positivas]
    CALC --> SAIDAS[Saídas\nSoma transações negativas]
    CALC --> SALDO_FIM[Saldo Final\nInicial + Entradas − Saídas]

    CALC --> GRAF1[Gráfico de Pizza\nSaídas por Projeto]
    CALC --> GRAF2[Gráfico de Pizza\nSaídas por Classificação]
```

---

## 3. Módulo: Caixa Gerencial — Lançamentos

```mermaid
flowchart TD
    TRANS([Lançamentos]) --> LOAD[Carregar transações do período]
    LOAD --> FILTROS{Aplicar filtros?}
    FILTROS -- Sim --> FILTRAR[Filtrar por: dia, mês, ano,\ndescricão, favorecido,\nprojeto, classificação, valor]
    FILTRAR --> LISTA[Exibir lista filtrada]
    FILTROS -- Não --> LISTA

    LISTA --> ACAO{Ação do usuário}

    ACAO -- Novo lançamento --> MODAL_NOVO[Abrir modal de cadastro]
    MODAL_NOVO --> FORM_T[Preencher: tipo, data, valor,\nfavorecido, projeto,\nclassificação, descrição]
    FORM_T --> SALVAR_T{Salvar?}
    SALVAR_T -- Sim --> INSERT[Inserir no banco]
    INSERT --> RELOAD[Recarregar lista]
    RELOAD --> LISTA
    SALVAR_T -- Cancelar --> LISTA

    ACAO -- Editar --> MODAL_EDIT[Abrir modal com dados pré-preenchidos]
    MODAL_EDIT --> FORM_T
    SALVAR_T -- Sim --> UPDATE[Atualizar no banco]
    UPDATE --> RELOAD

    ACAO -- Excluir --> CONFIRM_DEL{Confirmar exclusão}
    CONFIRM_DEL -- Sim --> DELETE[Remover do banco]
    DELETE --> RELOAD
    CONFIRM_DEL -- Não --> LISTA

    ACAO -- Recibo --> RECIBO_MENU{Tipo de recibo}
    RECIBO_MENU -- Salário --> HTML_SAL[Gerar HTML do recibo de salário]
    RECIBO_MENU -- Serviços --> HTML_SVC[Gerar HTML do recibo de serviços]
    HTML_SAL --> PRINT_WIN[Abrir em nova janela\nwindow.print]
    HTML_SVC --> PRINT_WIN

    ACAO -- Relatório --> REL_MENU{Tipo de relatório}
    REL_MENU -- "Browser (período)" --> HTML_REL[Gerar HTML do relatório completo]
    REL_MENU -- "PDF (período)" --> CANVAS_REL[html2canvas → jsPDF\nDownload do PDF]
    REL_MENU -- "Browser (filtrado)" --> HTML_REL_F[Gerar HTML com filtros aplicados]
    REL_MENU -- "PDF (filtrado)" --> CANVAS_REL_F[html2canvas → jsPDF filtrado\nDownload do PDF]
    HTML_REL --> PRINT_WIN
    HTML_REL_F --> PRINT_WIN
```

---

## 4. Módulo: Correção Monetária — Novo Cálculo

```mermaid
flowchart TD
    CM([Novo Cálculo]) --> MODO{Modo de entrada}

    MODO -- Manual --> FORM_MAN[Preencher: valor, data inicial,\ndata final, índice, juros ad.]
    FORM_MAN --> BTN_CALC[Calcular]

    MODO -- Lote --> UPLOAD[Upload de planilha .xlsx]
    UPLOAD --> MAP_COL{Colunas detectadas\nautomaticamente?}
    MAP_COL -- Sim --> PREVIEW[Pré-visualização das linhas]
    MAP_COL -- Não --> MAPPER[Interface de mapeamento\nmanual de colunas]
    MAPPER --> PREVIEW
    PREVIEW --> BTN_CALC

    BTN_CALC --> PROC[Iniciar processamento]
    PROC --> PROGRESS[Exibir barra de progresso]

    PROC --> LOOP{Para cada entrada\nbatch de 3 simultâneos}

    LOOP --> CHUNK{Período > 1 ano?}
    CHUNK -- Sim --> SPLIT[Dividir em blocos anuais]
    SPLIT --> FETCH_BCB[Chamar API BCB\npor bloco]
    CHUNK -- Não --> FETCH_BCB

    FETCH_BCB --> RETRY{Resposta OK?}
    RETRY -- HTTP 406 ou erro --> BACKOFF[Aguardar 800ms / 1600ms\nAté 3 tentativas]
    BACKOFF --> FETCH_BCB
    RETRY -- Sucesso --> FATORES[Array de fatores diários]

    FATORES --> CALCULAR[Aplicar correção multiplicativa\n+ juros adicionais simples]
    CALCULAR --> STATUS{Resultado}
    STATUS -- OK --> ENTRY_OK[Status: SUCCESS\ncorrectedValue, interestValue, percentage]
    STATUS -- Erro API --> ENTRY_ERR[Status: ERROR\nmensagem de erro]

    ENTRY_OK --> AGREGADOS[Agregar resultados]
    ENTRY_ERR --> AGREGADOS
    LOOP -- próxima entrada --> LOOP
    LOOP -- concluído --> DASH_SUM

    AGREGADOS --> DASH_SUM[Exibir resumo\nTotal Original, Corrigido, Juros]
    DASH_SUM --> CHART3D[Gráfico 3D por Ano\ncom filtro por Mês]
    DASH_SUM --> TABELA[Tabela de resultados]

    TABELA --> EXP{Exportar?}
    EXP -- Excel --> XLSX_EXP[Download .xlsx]
    EXP -- PDF --> PDF_EXP[Download PDF via jsPDF autoTable]

    TABELA --> SALVAR{Salvar tabela?}
    SALVAR -- Sim --> NOME[Informar nome da tabela]
    NOME --> SAVE_DB[Gravar em\nmonetary_saved_tables\n+ monetary_calculation_results]
    SAVE_DB --> HIST[Disponível no Histórico]
    SALVAR -- Não --> FIM([Concluído])
```

---

## 5. Módulo: Correção Monetária — Histórico

```mermaid
flowchart TD
    HIST([Histórico]) --> LOAD_HIST[Carregar todas as tabelas\ntodos os usuários da empresa]
    LOAD_HIST --> LISTA_HIST[Listar tabelas:\nnome, criado em, atualizado em]

    LISTA_HIST --> ACAO_HIST{Ação}

    ACAO_HIST -- Abrir --> LOAD_RES[Carregar resultados da tabela]
    LOAD_RES --> VIZ[Exibir:\nResumo + Gráfico 3D + Tabela]

    VIZ --> ACAO_VIZ{Ação na tabela aberta}

    ACAO_VIZ -- Adicionar registros --> ADD_ENT[Usar BatchCalc\nManual ou Lote]
    ADD_ENT --> RECALC_NEW[Calcular novos registros]
    RECALC_NEW --> UPDATE_DB[Atualizar monetary_calculation_results]
    UPDATE_DB --> LOAD_RES

    ACAO_VIZ -- Editar entrada --> EDIT_ENT[Editar campos da entrada]
    EDIT_ENT --> RE_FETCH[Re-buscar fatores BCB\ncom novos parâmetros]
    RE_FETCH --> UPDATE_ENT[Atualizar entrada no banco]
    UPDATE_ENT --> LOAD_RES

    ACAO_VIZ -- Exportar Excel --> XLSX_H[Download .xlsx]
    ACAO_VIZ -- Exportar PDF --> PDF_H[Download PDF]

    ACAO_VIZ -- Recalcular Tudo --> RECALC_ALL[Reprocessar todas as entradas\nviaAPI BCB atual]
    RECALC_ALL --> UPDATE_DB

    ACAO_VIZ -- Excluir Tabela --> CONFIRM_H{Confirmar exclusão?}
    CONFIRM_H -- Sim --> DEL_RES[Deletar monetary_calculation_results]
    DEL_RES --> DEL_TAB[Deletar monetary_saved_tables]
    DEL_TAB --> LISTA_HIST
    CONFIRM_H -- Não --> VIZ

    ACAO_HIST -- Excluir\nnome da tabela --> CONFIRM_H
```

---

## 6. Módulo: Cadastros

```mermaid
flowchart TD
    CAD([Cadastros]) --> SUBMENU{Submenu}

    SUBMENU --> FAV[Favorecidos]
    SUBMENU --> PROJ[Projetos]
    SUBMENU --> CLASS[Classificações]

    FAV --> CRUD_FAV{Operação}
    CRUD_FAV -- Listar --> LIST_FAV[Exibir todos os favorecidos\nordenados por nome]
    CRUD_FAV -- Criar --> FORM_FAV[Nome, Tipo PF/PJ,\nDocumento CPF/CNPJ,\nCargo, Endereço]
    FORM_FAV --> MASK[Aplicar máscara\nCPF ou CNPJ]
    MASK --> SAVE_FAV[Inserir no banco]
    CRUD_FAV -- Editar --> FORM_FAV
    CRUD_FAV -- Excluir --> CHECK_FAV{Possui transações\nvinculadas?}
    CHECK_FAV -- Sim --> ERR_FAV[Erro: não é possível excluir]
    CHECK_FAV -- Não --> DEL_FAV[Remover do banco]

    PROJ --> CRUD_PROJ{Operação}
    CRUD_PROJ -- Listar --> LIST_PROJ[Exibir todos os projetos\nordenados por nome]
    CRUD_PROJ -- Criar / Editar --> FORM_PROJ[Nome e Descrição]
    FORM_PROJ --> SAVE_PROJ[Inserir / Atualizar no banco]
    CRUD_PROJ -- Excluir --> CHECK_PROJ{Possui transações\nvinculadas?}
    CHECK_PROJ -- Sim --> ERR_PROJ[Erro: não é possível excluir]
    CHECK_PROJ -- Não --> DEL_PROJ[Remover do banco]

    CLASS --> CRUD_CLASS{Operação}
    CRUD_CLASS -- Listar --> LIST_CLASS[Exibir todas as classificações\nordenadas por nome]
    CRUD_CLASS -- Criar / Editar --> FORM_CLASS[Nome e Descrição]
    FORM_CLASS --> SAVE_CLASS[Inserir / Atualizar no banco]
    CRUD_CLASS -- Excluir --> CHECK_CLASS{Possui transações\nvinculadas?}
    CHECK_CLASS -- Sim --> ERR_CLASS[Erro: não é possível excluir]
    CHECK_CLASS -- Não --> DEL_CLASS[Remover do banco]
```

---

## 7. Fluxo de Integração com a API BCB

```mermaid
flowchart TD
    CALL([fetchBcbData\níndice, dataInicial, dataFinal]) --> SPLIT_CHK{Período\n> 1 ano?}

    SPLIT_CHK -- Não --> SINGLE[Um único bloco]
    SPLIT_CHK -- Sim --> MULTI[Dividir em blocos de 1 ano]

    SINGLE --> CHUNK_REQ
    MULTI --> CHUNK_REQ[fetchBcbChunk\npor bloco]

    CHUNK_REQ --> URL[Montar URL:\napi.bcb.gov.br/dados/serie/\nbcdata.sgs.CODIGO/dados\n?formato=json&dataInicial=..&dataFinal=..]

    URL --> HTTP{HTTP Request}
    HTTP -- 200 OK --> PARSE[Parsear JSON\nArray de data + valor]
    HTTP -- 406 / Erro --> RETRY{Tentativas < 3?}
    RETRY -- Sim --> WAIT[Aguardar 800ms × tentativa]
    WAIT --> HTTP
    RETRY -- Não --> THROW[Lançar erro\nStatus: ERROR na entrada]

    PARSE --> AGG[Concatenar resultados\ndos blocos]
    AGG --> RETURN([Retornar array\nde BcbSeriesResponse])
```

---

## 8. Fluxo de Geração de Documentos

```mermaid
flowchart TD
    DOC([Gerar Documento]) --> TIPO{Tipo}

    TIPO -- Recibo Salário --> HTML_SAL[pdfGenerators.ts\ngerarReciboSalario\nRetorna HTML]
    TIPO -- Recibo Serviços --> HTML_SVC[pdfGenerators.ts\ngerarReciboServicos\nRetorna HTML]
    TIPO -- Relatório Período --> HTML_REL[pdfGenerators.ts\ngerarRelatorioPeriodo\nRetorna HTML]
    TIPO -- Correção Monetária PDF --> CM_PDF[jsPDF autoTable\na partir dos dados]
    TIPO -- Correção Monetária Excel --> CM_XLS[XLSX.utils.json_to_sheet\nXLSX.writeFile]

    HTML_SAL --> DESTINO_A{Destino}
    HTML_SVC --> DESTINO_A
    HTML_REL --> DESTINO_B{Destino}

    DESTINO_A -- Imprimir --> WIN_PRINT[window.open → document.write\n→ window.print]

    DESTINO_B -- Browser --> WIN_PRINT
    DESTINO_B -- PDF --> CANVAS[html2canvas\ncaptura container HTML\ncomo imagem]
    CANVAS --> SLICE[Dividir canvas em\npáginas de altura A4]
    SLICE --> JPDF[jsPDF.addImage\npor página]
    JPDF --> DOWNLOAD_PDF[jsPDF.save\ndownload .pdf]

    CM_PDF --> DOWNLOAD_PDF
    CM_XLS --> DOWNLOAD_XLS[XLSX.writeFile\ndownload .xlsx]
```

---

## 9. Fluxo de Dados — Visão Geral

```mermaid
flowchart LR
    USER([Usuário]) <--> REACT[React Frontend\nVite + TypeScript]

    REACT <--> SUPA[(Supabase\nPostgreSQL)]
    REACT <-->|Apenas leitura| BCB[(API BCB\nÍndices Econômicos)]

    SUPA --> T1[payees]
    SUPA --> T2[projects]
    SUPA --> T3[classifications]
    SUPA --> T4[transactions]
    SUPA --> T5[monetary_saved_tables]
    SUPA --> T6[monetary_calculation_results]
    SUPA --> AUTH[auth.users]

    BCB --> S1[SELIC — série 11]
    BCB --> S2[IPCA — série 433]
    BCB --> S3[IGPM — série 189]
    BCB --> S4[INCC — série 192]

    REACT --> OUT1[PDF Download]
    REACT --> OUT2[Excel Download]
    REACT --> OUT3[Impressão Browser]
```