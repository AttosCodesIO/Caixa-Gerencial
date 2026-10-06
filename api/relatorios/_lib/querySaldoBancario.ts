// =============================================================================
// Relatorio de Saldo Bancario (Conciliacao de Saldos)
// =============================================================================
// Reimplementacao determinística de ATTOS.PRC_FT_CONCILIACAOSALDOS (schema
// ATTOS, acessada via dblink @ATTOS2). Codigo-fonte completo lido via
// ALL_SOURCE@ATTOS2 (owner ATTOS, objeto PRC_FT_CONCILIACAOSALDOS).
//
// POR QUE REIMPLEMENTAR EM VEZ DE CHAMAR A PROCEDURE DIRETO:
// A procedure devolve seus dados por um parametro RETORNO IN OUT do tipo
// ATTOS.PCK_RESULTADO.RESULT (um REF CURSOR fraco). Testado e confirmado
// duas vezes que o Oracle nao permite FETCH de um REF CURSOR aberto por uma
// chamada de procedure remota via dblink:
//   1) bind OUT do tipo oracledb.CURSOR + fetch no cliente node-oracledb
//      -> ORA-01001: invalid cursor
//   2) bloco PL/SQL local que chama a procedure remota e tenta FETCH da
//      mesma dentro do proprio bloco (inteiramente no servidor, sem round-
//      trip ao cliente) -> NJS-107 / ORA-24338: statement handle not
//      executed
// Essa e uma restricao documentada do proprio Oracle (cursor variable nao
// pode ser fetchado atraves de um database link), nao uma limitacao desta
// implementacao. Por isso o UNICO caminho tecnicamente viavel a partir desta
// conexao (que so alcanca a base ATTOS via dblink) e reproduzir a mesma
// logica com SELECT parametrizado, chamando as MESMAS funcoes Oracle que a
// procedure chama internamente (nao reimplementando os calculos "na mao"),
// preservando a identidade AGENTE=AGN_IN_CODIGO em todo o pipeline.
//
// CHAMADA IGNORADA (documentada, nao usada por este relatorio):
// Antes de abrir o cursor, a procedure chama
// "ATTOS.PRC_FT_CHEQUESEMITIDOSNC(AGENTE,1,COMP_ST_NOME,USU_IN_CODIGO,
// DATAREF)" -- fonte lida integralmente: essa chamada apenas fFAZ um INSERT
// na tabela temporaria FINA_CHEQUESEMITIDOSTEMP (lista detalhada de cheques
// emitidos nao compensados de UM agente), usada por uma tela/relatorio
// diferente. O SELECT que segue (o unico que produz as colunas abaixo) NAO
// le essa tabela em nenhum momento -- CHEQUESEMITIDOS vem de
// FT_FNC_SALDOCONCBANCARIA(...,'CE'), uma funcao totalmente independente.
// Por isso essa chamada e, com segurança, dispensavel para este relatorio.
//
// MAPEAMENTO COMPLETO (nomes abaixo = variaveis internas da propria
// procedure original, tipo do parametro "v_tipo"/"tipo" de
// FT_FNC_SALDOANTEXTRATO/FT_FNC_SALDOCONCBANCARIA):
//   SC  = FT_FNC_SALDOANTEXTRATO(agente, dataBase, 'SC')      -- sem filial
//   AGD = FT_FNC_SALDOANTEXTRATO(agente, dataBase, 'AGD')     -- sem filial
//   PGTO_ELET_ABERTO = F_ATT_PGTOELETABERTOS(agente)          -- sem filial
//   DNE = FT_FNC_SALDOANTEXTRATO(agente, dataBase, 'DNE')     -- sem filial
//   CNB = FT_FNC_SALDOANTEXTRATO(agente, dataBase, 'CNB')     -- sem filial
//         (sempre 0: os dois lados da subtracao somam o mesmo conjunto de
//         linhas na definicao original -- fidelidade de calculo, nao bug
//         desta reimplementacao)
//   CNE = FT_FNC_SALDOANTEXTRATO(agente, dataBase, 'CNE')     -- sem filial
//   DC  = FT_FNC_SALDOCONCBANCARIA(...,'DC')  -- COM filial (ver nota)
//   CE  = FT_FNC_SALDOCONCBANCARIA(...,'CE')  -- COM filial (ver nota)
//
// DC/CE na definicao original filtram os movimentos pela filial ativa do
// usuario/estacao MEGA que gerou o relatorio (EXISTS contra GLO_FILIAL_ATIVA
// com COMP_ST_NOME/USU_IN_CODIGO). Este app nao tem sessao MEGA propria, e
// qualquer combinacao (estacao, usuario) valida cuja filial ativa inclua a
// filial do movimento chega ao MESMO resultado matematico -- entao o mesmo
// filtro e obtido aqui trocando o EXISTS por
// "m.FIL_IN_CODIGO IN (<lista de filiais do grupo>)", com a lista resolvida
// deterministicamente a partir dos dados reais do MEGA em
// resolveGrupoConsolidado.ts (nao por um organograma aproximado -- ver
// comentario la para o caso real que motivou a escolha). O placeholder
// /*FILIAIS_ALVO*/0 abaixo e substituido em runtime por essa lista (codigos
// numericos vindos de resolucao server-side, nunca de entrada direta do
// usuario -- mesmo mecanismo de troca de texto usado em
// relatorioExecutivo.ts).
//
// COMPOSICAO DAS COLUNAS EXIBIDAS (as unicas 4 nao documentadas no codigo-
// fonte da procedure -- SALDOAJUSTADO, o campo mais parecido, na verdade
// NUNCA usa DOCAGENDADO/PGTO_ELET_ABERTO, e o relatorio de referencia usa.
// Descoberto por comparacao numerica direta, byte a byte, contra o
// relatorio de referencia: 9 contas sem NENHUMA movimentacao entre duas
// capturas em horarios diferentes bateram exatas nas 6 colunas visiveis):
//   Doc. Gerados  = AGD
//   Doc. Agendado = PGTO_ELET_ABERTO
//   Debitos       = CE
//   Creditos      = DC
//   Saldo Extrato = SC + CE + CNE - DNE - DC
//   Saldo Real    = SC - PGTO_ELET_ABERTO
// CNB nunca aparece em nenhuma coluna visivel (sempre 0, ver acima).
//
// FILTROS DE UNIVERSO DE CONTAS (AGN_TAB_IN_CODIGO = 53, igual a procedure
// original):
//  - Contas inativas excluidas: AGN_CH_STATUS <> 'I' em GLO_AGENTES_ID
//    (join "agd" na procedure original), reproduzindo o filtro
//    "and agn_ch_status <> 'I'" do final do SELECT original.
//  - GLO_AGENTES_ID tem uma linha por "papel" do agente (AGN_TAU_ST_CODIGO:
//    representante, gestor, etc.) para a mesma conta -- sem o mesmo INNER
//    JOIN da procedure original ate GLO_CATEGORIA (via CAT_TAB/PAD/IDE/
//    IN_REDUZIDO), o join com GLO_AGENTES_ID duplicaria cada conta uma vez
//    por papel. So sobra 1 linha por conta porque so 1 papel tem categoria
//    preenchida (os demais tem os 4 campos CAT_* nulos).
//  - GLO_CONTASFIN (tab=53) tambem inclui registros que nao sao contas
//    bancarias reais: agentes de pessoa fisica (funcionarios) sem banco de
//    verdade associado, e ate o proprio agente-filial/empresa (mesmo codigo
//    que aparece na lista de filiais do grupo). Ambos excluidos: INNER JOIN
//    com GLO_BANCO (so entra conta com banco de fato) e
//    "AGN_IN_CODIGO NOT IN (lista de filiais)".
//
// A coluna "Banco" do relatorio de referencia mostra o NOME DA CONTA (ex.
// "ATTOS - BRADESCO - C/C"), nao o nome da instituicao bancaria -- confirmado
// comparando AGN_ST_NOME contra o relatorio. Por isso vem de
// GLO_AGENTES.AGN_ST_NOME, nao de GLO_BANCO.BAN_ST_NOME.
//
// EXCECAO EMPIRICA -- contas 5749 (QUALITY - FUNDO FIXO - OBRA QL.14) e 8329
// (CONCEITO - CONTA CAIXA FUNDO FIXO): passam por TODOS os filtros de
// universo acima (status ativo, banco de verdade associado, categoria
// preenchida, movimento dentro do grupo) exatamente como qualquer conta
// valida -- nao existe, em nenhuma das tabelas consultadas (GLO_CONTASFIN,
// GLO_AGENTES, GLO_AGENTES_ID, GLO_CONTASAGENTES), um unico campo que as
// diferencie estruturalmente de uma conta legitima. Ainda assim, elas NAO
// aparecem no relatorio real -- confirmado de forma reprodutivel em 3
// comparacoes independentes ao vivo (dois relatorios Crystal em horarios
// diferentes e uma consulta direta na tela do MEGA): excluindo apenas essas
// duas, as 6 colunas do total geral batem exatas, centavo a centavo, nas
// tres vezes. A hipotese mais provavel e que o usuario/estacao MEGA que gera
// o relatorio oficial nao tem essas duas contas especificas marcadas como
// ativas no momento -- uma configuracao de sessao que nao fica registrada em
// nenhuma tabela de dados consultavel por este app. Exclusao mantida como
// excecao pontual, documentada e por codigo explicito (nao por um criterio
// geral) -- se uma conta nova aparecer com o mesmo padrao, ela nao sera
// excluida automaticamente por esta regra.
//
// DATA BASE COMO STRING, NAO COMO DATE (":dataBaseStr" + TO_DATE(...,
// 'DD/MM/YYYY')): a sessao Oracle desta conexao roda em SESSIONTIMEZONE
// '-03:00'. Um bind de DATE construido no cliente (node-oracledb) a partir
// de um JS Date em UTC meia-noite chega ao servidor deslocado 3h para tras
// (equivale a "ontem as 21h" no fuso da sessao) -- confirmado com teste
// direto: um movimento datado hoje as 00:00 (fuso da sessao) era
// incorretamente excluido de "MOV_DT_DATADOCTO <= dataBase" por esse
// deslocamento, mesmo sendo do dia certo. TO_DATE sobre uma string
// 'DD/MM/YYYY' e resolvido inteiramente no servidor, sem nenhuma conversao
// de fuso horario do lado do cliente -- exatamente como a procedure
// original monta DATAREF com To_Date(DATAREF,'dd/MM/yyyy'). Elimina a
// ambiguidade de fuso por completo, em vez de tentar compensa-la.
//
// Fica em um modulo TS (e nao em um .sql lido com fs) para entrar no bundle
// da Serverless Function da Vercel sem depender de rastreamento de arquivos.
// Atencao ao editar a string abaixo -- o parser de bind do Oracle procura
// dois-pontos seguidos de um nome ate dentro de comentarios SQL.
// =============================================================================

export const QUERY_SALDO_BANCARIO_SQL = `
WITH universo AS (
  SELECT ctf.AGN_IN_CODIGO AGENTE, agn.AGN_ST_NOME NOME_CONTA
    FROM ATTOS.GLO_CONTASFIN@ATTOS2 ctf, ATTOS.GLO_BANCO@ATTOS2 ban, ATTOS.GLO_AGENTES@ATTOS2 agn,
         ATTOS.GLO_AGENTES_ID@ATTOS2 agd, ATTOS.GLO_CATEGORIA@ATTOS2 cat
   WHERE ban.BAN_IN_NUMERO = ctf.BAN_IN_NUMERO
     AND agn.AGN_TAB_IN_CODIGO = ctf.AGN_TAB_IN_CODIGO
     AND agn.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
     AND agn.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
     AND agd.AGN_TAB_IN_CODIGO = ctf.AGN_TAB_IN_CODIGO
     AND agd.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
     AND agd.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
     AND agd.CAT_TAB_IN_CODIGO = cat.CAT_TAB_IN_CODIGO
     AND agd.CAT_PAD_IN_CODIGO = cat.CAT_PAD_IN_CODIGO
     AND agd.CAT_IDE_ST_CODIGO = cat.CAT_IDE_ST_CODIGO
     AND agd.CAT_IN_REDUZIDO = cat.CAT_IN_REDUZIDO
     AND agd.AGN_CH_STATUS <> 'I'
     AND ctf.AGN_TAB_IN_CODIGO = 53
     AND ctf.AGN_IN_CODIGO NOT IN (/*FILIAIS_ALVO*/0)
     AND ctf.AGN_IN_CODIGO NOT IN (5749, 8329)
     AND (:todasContas = 1 OR ctf.AGN_IN_CODIGO = :agenteFiltro)
     AND EXISTS (
           SELECT 1
             FROM ATTOS.FIN_MOVIMENTO@ATTOS2 m
            WHERE m.AGN_TAB_IN_CODIGO = 53
              AND m.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
              AND m.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
              AND m.FIL_IN_CODIGO IN (/*FILIAIS_ALVO*/0)
         )
),
base AS (
  SELECT
    u.AGENTE,
    u.NOME_CONTA,
    NVL(ATTOS.FT_FNC_SALDOANTEXTRATO@ATTOS2(u.AGENTE, TO_DATE(:dataBaseStr, 'DD/MM/YYYY'), 'SC'), 0) SC,
    NVL(ATTOS.FT_FNC_SALDOANTEXTRATO@ATTOS2(u.AGENTE, TO_DATE(:dataBaseStr, 'DD/MM/YYYY'), 'AGD'), 0) AGD,
    NVL(ATTOS.F_ATT_PGTOELETABERTOS@ATTOS2(u.AGENTE), 0) PGTO_ELET_ABERTO,
    NVL(ATTOS.FT_FNC_SALDOANTEXTRATO@ATTOS2(u.AGENTE, TO_DATE(:dataBaseStr, 'DD/MM/YYYY'), 'DNE'), 0) DNE,
    NVL(ATTOS.FT_FNC_SALDOANTEXTRATO@ATTOS2(u.AGENTE, TO_DATE(:dataBaseStr, 'DD/MM/YYYY'), 'CNB'), 0) CNB,
    NVL(ATTOS.FT_FNC_SALDOANTEXTRATO@ATTOS2(u.AGENTE, TO_DATE(:dataBaseStr, 'DD/MM/YYYY'), 'CNE'), 0) CNE,
    NVL((
      SELECT SUM(m.MOV_RE_VALOR)
        FROM ATTOS.FIN_MOVIMENTO@ATTOS2 m
       WHERE m.AGN_TAB_IN_CODIGO = 53
         AND m.AGN_IN_CODIGO = u.AGENTE
         AND m.MOV_CH_NATUREZA = 'D'
         AND m.MOV_CH_SITUACAO <> 'C'
         AND m.FIL_IN_CODIGO IN (/*FILIAIS_ALVO*/0)
         AND NVL(m.CON_IN_SEQUENCIAL, 1) NOT IN (SELECT j.CON_IN_SEQUENCIAL FROM ATTOS.FIN_CONCILIAMOVIMENTO@ATTOS2 j)
         AND m.MOV_DT_DATADOCTO <= TO_DATE(:dataBaseStr, 'DD/MM/YYYY')
    ), 0) DC,
    NVL((
      SELECT SUM(m.MOV_RE_VALOR)
        FROM ATTOS.FIN_MOVIMENTO@ATTOS2 m
       WHERE m.AGN_TAB_IN_CODIGO = 53
         AND m.AGN_IN_CODIGO = u.AGENTE
         AND m.MOV_CH_NATUREZA = 'C'
         AND m.MOV_CH_SITUACAO <> 'C'
         AND m.FIL_IN_CODIGO IN (/*FILIAIS_ALVO*/0)
         AND (NOT EXISTS (
                SELECT 1
                  FROM ATTOS.FIN_CONCILIAMOVIMENTO@ATTOS2 mc, ATTOS.FIN_CONCILIACAO@ATTOS2 fc
                 WHERE mc.CON_IN_SEQUENCIAL = fc.CON_IN_SEQUENCIAL
                   AND mc.CON_IN_SEQUENCIAL = m.CON_IN_SEQUENCIAL
                   AND fc.CBA_DT_DATA <= TO_DATE(:dataBaseStr, 'DD/MM/YYYY'))
              OR m.CON_IN_SEQUENCIAL IS NULL)
         AND m.MOV_DT_DATADOCTO <= TO_DATE(:dataBaseStr, 'DD/MM/YYYY')
    ), 0) CE
  FROM universo u
)
SELECT
  AGENTE,
  NOME_CONTA BANCO,
  AGD DOCGERADOS,
  PGTO_ELET_ABERTO DOCAGENDADO,
  CE DEBITOS,
  DC CREDITOS,
  SC + CE + CNE - DNE - DC SALDOEXTRATO,
  SC - PGTO_ELET_ABERTO SALDOREAL
  FROM base
 ORDER BY AGENTE
`;
