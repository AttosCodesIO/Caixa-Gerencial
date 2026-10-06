// Relatório Gerencial de Compromissos Baixados (Relatório Executivo de Baixas).
// Reproduz a query do Apêndice A.2 da especificação SDD do módulo de Relatório
// Financeiro, com três adaptações em relação ao original:
//  - a comparação de igualdade da filial virou um IN sobre o placeholder
//    /*FILIAIS_ALVO*/0, trocado em runtime pela lista expandida de filiais
//    (ver relatorioExecutivo.ts);
//  - o período entra como texto 'YYYY-MM-DD' convertido por TO_DATE no
//    servidor, e não como bind de DATE — um JS Date é deslocado pelo fuso da
//    sessão/processo antes de chegar ao Oracle (mesmo problema documentado em
//    querySaldoBancario.ts);
//  - a data do movimento sai como texto 'YYYY-MM-DD' (TO_CHAR), pelo mesmo
//    motivo, no sentido inverso.
// Fica em um módulo TS (e não em um .sql lido com fs) para entrar no bundle
// da Serverless Function da Vercel sem depender de rastreamento de arquivos.
// Atenção ao editar: o parser de bind do Oracle procura dois-pontos seguidos
// de um nome até dentro de comentários SQL — não use esse padrão em
// comentários dentro da string abaixo.
export const QUERY_RELATORIO_SQL = `
SELECT TO_CHAR(DATAMOVIMENTO, 'YYYY-MM-DD') DATAISO, FILIAL, NOMEFIL, AGNORIGINALNOME, MOVHISTORICO, VALORORIGINAL, PROJETOS
  FROM (

        SELECT

        --VALOR RATEADO CLASSES E PROJETOS...
         RATEIOCUBO.pro_re_valor,
         decode(RATEIOCUBO.lcl_ch_natureza,
                'D',
                 RATEIOCUBO.pro_re_valor,
                 'C',
                 RATEIOCUBO.pro_re_valor) -
                ((ATTOS.fnc_ft_cubo_saldoref@ATTOS2(BXCUBO.fil_in_codigo,
                                       ATTOS.FNC_ft_cubo_in@ATTOS2(BXCUBO.fil_in_codigo,
                                       BXCUBO.mov_in_numlancto),
                                       BXCUBO.MOVDATAVENCTO) *
                (RATEIOCUBO.LCL_RE_PERCENTUAL / 100))) VALORORIGINAL,

          --CENTRO DE CUSTO...
          RATEIOCUBO.CUS_ST_EXTENSO || ' - ' ||
          RATEIOCUBO.CUS_ST_DESCRICAO CENTROCUSTO,
          RATEIOCUBO.CUS_IN_REDUZIDO CODIGOCENTROCUSTO,
          -- PROJETOS...
          RATEIOCUBO.pro_in_reduzido || ' - ' ||
          RATEIOCUBO.pro_st_descricao PROJETOS,
          RATEIOCUBO.pro_in_reduzido CODIGOPROJETO,
          -- CLASSES FINANCEIRAS...
          RATEIOCUBO.cla_in_reduzido CODIGOCLASSE,
          RATEIOCUBO.cla_st_extenso || ' - ' ||
          RATEIOCUBO.cla_st_descricao CLASSEFINANCEIRA,
          --CAMPOS DO CUBO...
          BXCUBO.*,
          to_char(BXCUBO.MOVDATAVENCTO, 'DD') DIA,
          to_char(BXCUBO.MOVDATAVENCTO, 'MM') MES,
          to_char(BXCUBO.MOVDATAVENCTO, 'YYYY') ANO,
          to_char(BXCUBO.MOVDATAVENCTO, 'MM') || '/' ||
          to_char(BXCUBO.MOVDATAVENCTO, 'YYYY') MESANO,
          BXCUBO.MOVDATADOCTO DATAMOVIMENTO,
          BXCUBO.AGNORIGINAL AGNMOVIMENTO

        -- CONSULTA PL/SQL BLOCK...

          FROM (select
                 distinct --CHAVES PARA JOIN
                           MVTII.org_tab_in_codigo org_tab_in_codigo,
                          MVTII.org_pad_in_codigo org_pad_in_codigo,
                          MVTII.org_in_codigo     org_in_codigo,
                          MVTII.org_tau_st_codigo org_tau_st_codigo,
                          MVTII.mov_tab_in_codigo mov_tab_in_codigo,
                          MVTII.mov_seq_in_codigo mov_seq_in_codigo,
                          MVTII.mov_in_numlancto  mov_in_numlancto,
                          MVTII.fil_in_codigo     fil_in_codigo,
                          --
                          mvt.agn_tab_in_codigo AGNBAIXATAB,
                          mvt.agn_pad_in_codigo AGNBAIXAPAD,
                          mvt.agn_in_codigo AGNBAIXA,
                          mvt.agn_tau_st_codigo AGNBAIXATAU,
                          agn.agn_st_nome AGNBAIXANOME,
                          mvt.tpd_st_codigo TPDBAIXA,
                          mvt.mov_st_documento DOCBAIXA,
                          mvt.mov_in_numlancto NUMLANCTOBAIXA,
                          mfi.mvf_st_nominal NOMINAL,
                          mvtII.agn_tab_in_codigo AGNORIGINALTAB,
                          mvtII.agn_pad_in_codigo AGNORIGINALPAD,
                          mvtII.agn_in_codigo AGNORIGINAL,
                          rpad(to_char(agnII.agn_st_nome), 40) AGNORIGINALNOME,
                          mvtIII.tpd_st_codigo TPDORIGINAL,
                          mvtII.mov_st_documento DOCORIGINAL,
                          mvtIII.mov_st_complhist COMPORIGINAL,
                          mvtII.mov_in_numlancto NUMLANCTOORIGINAL,
                          mvt.mov_dt_datadocto MOVDATADOCTO,
                          mvt.mov_dt_prorrogado MOVDATAVENCTO,
                          cta.ban_in_numero CODBANCO,
                          cta.ctaage_st_numero AGENCIA,
                          Trim(cta.cta_st_numero) CONTA,
                          ban.ban_st_nome NOMEBANCO,
                          mvt.fil_in_codigo FILIAL,
                          mvt.mov_st_parcela PARCELA,
                          acao.acao_st_nome NOMEACAO,
                          agnfil.agn_st_nome NOMEEMP,
                          org.agn_st_nome NOMEFIL,
                          mvt.mov_st_complhist MOVHISTORICO


                   from ATTOS.fin_movimento@ATTOS2     mvt,
                        ATTOS.fin_referenciafin@ATTOS2 rfn,
                        ATTOS.fin_movimento@ATTOS2     mvtII,
                        ATTOS.fin_referenciafin@ATTOS2 rfnII,
                        ATTOS.fin_movimento@ATTOS2     mvtIII,
                        ATTOS.glo_agentes@ATTOS2       agn,
                        ATTOS.glo_agentes@ATTOS2       agnII,
                        ATTOS.fin_movfin@ATTOS2        mfi,
                        ATTOS.glo_contasfin@ATTOS2     cta,
                        ATTOS.glo_banco@ATTOS2         ban,
                        ATTOS.glo_acao@ATTOS2          acao,
                        ATTOS.glo_agentes@ATTOS2       agnfil,
                        ATTOS.glo_agentes@ATTOS2   org

                  where rfn.org_tab_in_codigo = mvt.org_tab_in_codigo
                    and rfn.org_pad_in_codigo = mvt.org_pad_in_codigo
                    and rfn.org_in_codigo = mvt.org_in_codigo
                    and rfn.org_tau_st_codigo = mvt.org_tau_st_codigo
                    and rfn.mov_tab_in_codigo = mvt.mov_tab_in_codigo
                    and rfn.mov_seq_in_codigo = mvt.mov_seq_in_codigo
                    and rfn.ref_mov_in_numlancto = mvt.mov_in_numlancto
                       --
                    and mvtII.org_tab_in_codigo = rfn.org_tab_in_codigo
                    and mvtII.org_pad_in_codigo = rfn.org_pad_in_codigo
                    and mvtII.org_in_codigo = rfn.org_in_codigo
                    and mvtII.org_tau_st_codigo = rfn.org_tau_st_codigo
                    and mvtII.mov_tab_in_codigo = rfn.mov_tab_in_codigo
                    and mvtII.mov_seq_in_codigo = rfn.mov_seq_in_codigo
                    and mvtII.mov_in_numlancto = rfn.mov_in_numlancto
                       --
                    and rfnII.org_tab_in_codigo = mvtII.org_tab_in_codigo
                    and rfnII.org_pad_in_codigo = mvtII.org_pad_in_codigo
                    and rfnII.org_in_codigo = mvtII.org_in_codigo
                    and rfnII.org_tau_st_codigo = mvtII.org_tau_st_codigo
                    and rfnII.mov_tab_in_codigo = mvtII.mov_tab_in_codigo
                    and rfnII.mov_seq_in_codigo = mvtII.mov_seq_in_codigo
                    and rfnII.mov_in_numlancto = mvtII.mov_in_numlancto
                       -- EXCLUIR DUPLICIDADES DE MOVIMENTOS..
                    and rfnII.ref_st_tipo not in ('BXCPA', -- Baixa Contas a Pagar
                         'BXJUROS', -- Baixa de Juros
                         'BXMULTA') -- Baixa de Multas
                       --
                    and mvtIII.org_tab_in_codigo = rfnII.org_tab_in_codigo
                    and mvtIII.org_pad_in_codigo = rfnII.org_pad_in_codigo
                    and mvtIII.org_in_codigo = rfnII.org_in_codigo
                    and mvtIII.org_tau_st_codigo = rfnII.org_tau_st_codigo
                    and mvtIII.mov_tab_in_codigo = rfnII.mov_tab_in_codigo
                    and mvtIII.mov_seq_in_codigo = rfnII.mov_seq_in_codigo
                    and mvtIII.mov_in_numlancto =
                        rfnII.ori_mov_in_numlancto
                       --
                    and mfi.org_tab_in_codigo(+) = mvt.org_tab_in_codigo
                    and mfi.org_pad_in_codigo(+) = mvt.org_pad_in_codigo
                    and mfi.org_in_codigo(+) = mvt.org_in_codigo
                    and mfi.org_tau_st_codigo(+) = mvt.org_tau_st_codigo
                    and mfi.mov_tab_in_codigo(+) = mvt.mov_tab_in_codigo
                    and mfi.mov_seq_in_codigo(+) = mvt.mov_seq_in_codigo
                    and mfi.mov_in_numlancto(+) = mvt.mov_in_numlancto
                       --
                    and mvt.agn_tab_in_codigo = agn.agn_tab_in_codigo
                    and mvt.agn_pad_in_codigo = agn.agn_pad_in_codigo
                    and mvt.agn_in_codigo = agn.agn_in_codigo
                       --
                    and mvtII.agn_tab_in_codigo = agnII.agn_tab_in_codigo
                    and mvtII.agn_pad_in_codigo = agnII.agn_pad_in_codigo
                    and mvtII.agn_in_codigo = agnII.agn_in_codigo

                    and mvt.agn_tab_in_codigo = cta.agn_tab_in_codigo(+)
                    and mvt.agn_pad_in_codigo = cta.agn_pad_in_codigo(+)
                    and mvt.agn_in_codigo = cta.agn_in_codigo(+)
                       --
                    and ban.ban_in_numero(+) = cta.ban_in_numero
                       --
                    and mvt.acao_tab_in_codigo = acao.acao_tab_in_codigo
                    and mvt.acao_pad_in_codigo = acao.acao_pad_in_codigo
                    and mvt.acao_in_codigo = acao.acao_in_codigo
                       --
                    and mvt.org_tab_in_codigo = agnfil.agn_tab_in_codigo
                    and mvt.org_pad_in_codigo = agnfil.agn_pad_in_codigo
                    and mvt.org_in_codigo = agnfil.agn_in_codigo
                       --
  and mvt.org_tab_in_codigo = org.agn_tab_in_codigo
  and mvt.org_pad_in_codigo = org.agn_pad_in_codigo
  and mvt.fil_in_codigo     = org.agn_in_codigo

                       --
                    and mvt.mov_ch_origem = 'M'
                    and mvt.mov_ch_natureza = 'C'
                    and mvt.mov_ch_situacao <> 'C'
                    and mvt.acao_in_codigo <> '264'
                    and mvt.acao_in_codigo <> '283'
                    and mvt.acao_in_codigo <> '914'
                    and mvt.acao_in_codigo <> '915'
                    and mvt.acao_in_codigo <> '266') BXCUBO,
                -- MOVIMENTACAO PARA RATEIO CENTRO DE CUSTO / PROJETOS / CLASSES FINANCEIRAS
                (SELECT
                 --CHAVES PARA JOIN DO RATEIO
                  MOV.org_tab_in_codigo,
                  MOV.org_pad_in_codigo,
                  MOV.org_in_codigo,
                  MOV.org_tau_st_codigo,
                  MOV.mov_tab_in_codigo,
                  MOV.mov_seq_in_codigo,
                  MOV.mov_in_numlancto,
                  --
                  CL.cla_tab_in_codigo,
                  CL.cla_pad_in_codigo,
                  CL.cla_ide_st_codigo,
                  CL.cla_in_reduzido,
                  CL.lcl_re_percentual,
                  CL.lcl_ch_natureza,
                  CLA.cla_st_extenso,
                  CLA.cla_st_descricao,
                  CC.ccf_tab_in_codigo cus_tab_in_codigo,
                  CC.ccf_pad_in_codigo cus_pad_in_codigo,
                  CC.ccf_ide_st_codigo cus_ide_st_codigo,
                  CC.ccf_in_reduzido cus_in_reduzido,
                  CUS.cus_st_extenso,
                  CUS.cus_st_descricao,
                  PR.pro_tab_in_codigo,
                  PR.pro_pad_in_codigo,
                  PR.pro_ide_st_codigo,
                  PR.pro_in_reduzido,
                  PR.lpr_re_valor pro_re_valor,
                  PRO.pro_st_extenso,
                  PRO.pro_st_descricao
                   FROM ATTOS.fin_lancclasse@ATTOS2   CL,
                        ATTOS.fin_movimento@ATTOS2    MOV,
                        ATTOS.fin_lancccusto@ATTOS2   CC,
                        ATTOS.fin_lancproj@ATTOS2     PR,
                        ATTOS.fin_classe@ATTOS2       CLA,
                        ATTOS.con_centro_custo@ATTOS2 CUS,
                        ATTOS.glo_projetos@ATTOS2     PRO
                  WHERE MOV.org_tab_in_codigo = CL.org_tab_in_codigo
                    and MOV.org_pad_in_codigo = CL.org_pad_in_codigo
                    and MOV.org_in_codigo = CL.org_in_codigo
                    and MOV.org_tau_st_codigo = CL.org_tau_st_codigo
                    and MOV.mov_tab_in_codigo = CL.mov_tab_in_codigo
                    and MOV.mov_seq_in_codigo = CL.mov_seq_in_codigo
                    and MOV.mov_in_numlancto = CL.mov_in_numlancto
                       --
                    and CL.org_tab_in_codigo = CC.org_tab_in_codigo
                    and CL.org_pad_in_codigo = CC.org_pad_in_codigo
                    and CL.org_in_codigo = CC.org_in_codigo
                    and CL.org_tau_st_codigo = CC.org_tau_st_codigo
                    and CL.mov_tab_in_codigo = CC.mov_tab_in_codigo
                    and CL.mov_seq_in_codigo = CC.mov_seq_in_codigo
                    and CL.mov_in_numlancto = CC.mov_in_numlancto
                       --
                    and CL.cla_tab_in_codigo = CC.cla_tab_in_codigo
                    and CL.cla_pad_in_codigo = CC.cla_pad_in_codigo
                    and CL.cla_ide_st_codigo = CC.cla_ide_st_codigo
                    and CL.cla_in_reduzido = CC.cla_in_reduzido
                    and CL.lcl_ch_natureza = CC.lcl_ch_natureza
                       --
                    and CC.org_tab_in_codigo = PR.org_tab_in_codigo
                    and CC.org_pad_in_codigo = PR.org_pad_in_codigo
                    and CC.org_in_codigo = PR.org_in_codigo
                    and CC.org_tau_st_codigo = PR.org_tau_st_codigo
                    and CC.mov_tab_in_codigo = PR.mov_tab_in_codigo
                    and CC.mov_seq_in_codigo = PR.mov_seq_in_codigo
                    and CC.mov_in_numlancto = PR.mov_in_numlancto
                       --
                    and CC.cla_tab_in_codigo = PR.cla_tab_in_codigo
                    and CC.cla_pad_in_codigo = PR.cla_pad_in_codigo
                    and CC.cla_ide_st_codigo = PR.cla_ide_st_codigo
                    and CC.lcl_ch_natureza = PR.lcl_ch_natureza
                    and CC.lcc_in_numero = PR.lcc_in_numero
                       --
                    and CLA.cla_tab_in_codigo = CL.cla_tab_in_codigo
                    and CLA.cla_pad_in_codigo = CL.cla_pad_in_codigo
                    and CLA.cla_ide_st_codigo = CL.cla_ide_st_codigo
                    and CLA.cla_in_reduzido = CL.cla_in_reduzido
                       --
                    and CC.ccf_tab_in_codigo = CUS.cus_tab_in_codigo
                    and CC.ccf_pad_in_codigo = CUS.cus_pad_in_codigo
                    and CC.ccf_ide_st_codigo = CUS.cus_ide_st_codigo
                    and CC.ccf_in_reduzido = CUS.cus_in_reduzido
                       --
                    and PRO.pro_tab_in_codigo = PR.pro_tab_in_codigo
                    and PRO.pro_pad_in_codigo = PR.pro_pad_in_codigo
                    and PRO.pro_ide_st_codigo = PR.pro_ide_st_codigo
                    and PRO.pro_in_reduzido = PR.pro_in_reduzido) RATEIOCUBO

         WHERE BXCUBO.org_tab_in_codigo = RATEIOCUBO.org_tab_in_codigo
           and BXCUBO.org_pad_in_codigo = RATEIOCUBO.org_pad_in_codigo
           and BXCUBO.org_in_codigo = RATEIOCUBO.org_in_codigo
           and BXCUBO.org_tau_st_codigo = RATEIOCUBO.org_tau_st_codigo
           and BXCUBO.mov_tab_in_codigo = RATEIOCUBO.mov_tab_in_codigo
           and BXCUBO.mov_seq_in_codigo = RATEIOCUBO.mov_seq_in_codigo
           and BXCUBO.mov_in_numlancto = RATEIOCUBO.mov_in_numlancto)

 WHERE

 FIL_IN_CODIGO IN (/*FILIAIS_ALVO*/0)
 and DATAMOVIMENTO >= TO_DATE(:dataInicio, 'YYYY-MM-DD')
 and DATAMOVIMENTO <  TO_DATE(:dataFim, 'YYYY-MM-DD') + 1
 and AGNMOVIMENTO >= :agenteInicio
 and AGNMOVIMENTO <= :agenteFim
 and CODIGOPROJETO >= :projetoInicio
 and CODIGOPROJETO <= :projetoFim
 and CODIGOCLASSE  >= :classeInicio
 and CODIGOCLASSE  <= :classeFim
 and CODIGOCENTROCUSTO  >= :centroCustoInicio
 and CODIGOCENTROCUSTO  <= :centroCustoFim

 ORDER BY DATAMOVIMENTO, AGNORIGINALNOME
`;
