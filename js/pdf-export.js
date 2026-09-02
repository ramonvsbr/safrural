"use strict";
/* ============================================================
   SAF-PP · pdf-export.js
   Geração do relatório em PDF (jsPDF + AutoTable) — Caderno de Campo Digital.
   ============================================================ */

/* ============================== EXPORTAÇÃO EM PDF ============================== */
function exportPDF(){
  if(!window.jspdf || !window.jspdf.jsPDF){
    showToast('Biblioteca de PDF ainda carregando — tente novamente em alguns segundos.');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const marginBottom = 46;
  let y = 46;

  const C_INK    = [42,32,22];
  const C_SOFT   = [91,76,56];
  const C_FAINT  = [140,122,94];
  const C_GREEN  = [63,90,50];
  const C_GREEND = [44,64,33];
  const C_OCHRE  = [180,121,30];
  const C_BRICK  = [138,58,43];
  const C_PAPER2 = [222,203,160];
  const C_CARD   = [247,241,222];
  const C_LINE   = [205,187,140];

  const scn = buildScenario();
  const y5 = clamp(num(state.premissas.anoAnalise)||5,1,5);
  const pe = pontoEquilibrio(scn);
  const scnOtim = buildScenario({receita: 1+num(state.cenarios.otimistaReceita)/100, custo: 1-num(state.cenarios.otimistaCusto)/100});
  const scnPess = buildScenario({receita: 1-num(state.cenarios.pessimistaReceita)/100, custo: 1+num(state.cenarios.pessimistaCusto)/100});

  function ensureSpace(h){
    if(y + h > pageH - marginBottom){ doc.addPage(); y = 46; }
  }
  function sectionTitle(txt, eyebrow){
    ensureSpace(34);
    if(eyebrow){
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...C_OCHRE);
      doc.text(eyebrow.toUpperCase(), marginX, y);
      y += 12;
    }
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...C_GREEND);
    doc.text(txt, marginX, y);
    y += 6;
    doc.setDrawColor(...C_LINE); doc.setLineWidth(1);
    doc.line(marginX, y, pageW-marginX, y);
    y += 16;
    doc.setTextColor(...C_INK);
  }
  function subTitle(txt){
    ensureSpace(18);
    doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(...C_GREEN);
    doc.text(txt, marginX, y);
    y += 14;
    doc.setTextColor(...C_INK);
  }
  function note(txt){
    ensureSpace(24);
    doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(...C_SOFT);
    const lines = doc.splitTextToSize(txt, pageW-2*marginX);
    doc.text(lines, marginX, y);
    y += lines.length*11 + 8;
    doc.setTextColor(...C_INK);
  }
  function kvGrid(pairs, cols){
    cols = cols||2;
    const colW = (pageW-2*marginX)/cols;
    ensureSpace(Math.ceil(pairs.length/cols)*16+6);
    doc.setFontSize(9);
    pairs.forEach((p,i)=>{
      const col = i%cols, row = Math.floor(i/cols);
      const x = marginX + col*colW;
      const yy = y + row*16;
      doc.setFont('helvetica','bold'); doc.setTextColor(...C_SOFT);
      doc.text(p[0]+':', x, yy);
      doc.setFont('helvetica','normal'); doc.setTextColor(...C_INK);
      doc.text(String(p[1]), x+ Math.min(150,colW*0.55), yy);
    });
    y += Math.ceil(pairs.length/cols)*16 + 10;
  }
  function kpiRow(items){
    const cols = items.length;
    const gap = 8;
    const w = (pageW-2*marginX-gap*(cols-1))/cols;
    const h = 46;
    ensureSpace(h+10);
    items.forEach((it,i)=>{
      const x = marginX + i*(w+gap);
      doc.setDrawColor(...C_LINE); doc.setFillColor(...C_CARD);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');
      doc.setFont('helvetica','normal'); doc.setFontSize(6.8); doc.setTextColor(...C_SOFT);
      const lbl = doc.splitTextToSize(it[0].toUpperCase(), w-10);
      doc.text(lbl, x+7, y+12);
      doc.setFont('helvetica','bold'); doc.setFontSize(12.5);
      doc.setTextColor(...(it[2]? C_BRICK : C_GREEND));
      doc.text(String(it[1]), x+7, y+h-10);
    });
    y += h + 14;
  }
  function table(head, body, opts){
    opts = opts||{};
    doc.autoTable(Object.assign({
      startY: y,
      margin:{left:marginX, right:marginX, bottom:marginBottom},
      head:[head],
      body: body,
      theme:'grid',
      styles:{font:'helvetica', fontSize:8, textColor:C_INK, lineColor:C_LINE, lineWidth:0.5, cellPadding:4},
      headStyles:{fillColor:C_PAPER2, textColor:C_INK, fontStyle:'bold', halign:'center', fontSize:7.6},
      alternateRowStyles:{fillColor:[250,246,233]},
      didDrawPage:function(){ /* footers added manually at end */ }
    }, opts));
    y = doc.lastAutoTable.finalY + 16;
  }
  const money = v => fmtR$(v);

  /* ---------- CAPA ---------- */
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...C_OCHRE);
  doc.text('CADERNO DE CAMPO DIGITAL — ADAPTADO DO SAF-PP (MELONI, 2017)', marginX, y);
  y += 22;
  doc.setFont('helvetica','bold'); doc.setFontSize(19); doc.setTextColor(...C_INK);
  doc.text('Análise Financeira do Empreendimento Rural', marginX, y);
  y += 22;
  doc.setDrawColor(...C_INK); doc.setLineWidth(1.4);
  doc.line(marginX, y, pageW-marginX, y);
  y += 22;

  kvGrid([
    ['Produtor(a) / Associação', state.meta.produtor||'—'],
    ['Localização', state.meta.local||'—'],
    ['Atividade principal', state.meta.atividade||'—'],
    ['Nº de beneficiários(as)', String(num(state.meta.beneficiarios)||1)],
    ['Data de preenchimento', state.meta.data||'—'],
    ['Relatório gerado em', new Date().toLocaleString('pt-BR')]
  ], 2);

  const semaf = calcSemaforo(scn);
  const semafColor = semaf.cor==='verde'?C_GREEND : semaf.cor==='amarelo'?C_OCHRE : semaf.cor==='vermelho'?C_BRICK : C_FAINT;
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.setTextColor(...semafColor);
  doc.text('◆ '+semaf.titulo.toUpperCase(), marginX, y);
  y += 13;
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...C_SOFT);
  const semafLines = doc.splitTextToSize(semaf.msg, pageW-2*marginX);
  doc.text(semafLines, marginX, y);
  y += semafLines.length*11 + 6;
  doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(...C_FAINT);
  doc.text(isAndamento()?'Tipo de projeto: Em Andamento (sem novo investimento inicial nem capital de giro no Ano 0)':'Tipo de projeto: Do Zero (com investimento inicial e capital de giro no Ano 0)', marginX, y);
  y += 16;
  doc.setTextColor(...C_INK);

  /* ---------- PREMISSAS ---------- */
  sectionTitle('Premissas Financeiras', 'Dados inseridos');
  kvGrid([
    ['Impostos/taxas sobre a receita', fmtNum(state.premissas.impostoReceita,1)+'%'],
    [LABELS.tmaCurto+' (TMA)', fmtNum(state.premissas.tma,1)+'% a.a.'],
    ['Ano de análise dos indicadores', 'Ano '+y5],
    ['Meses de custo p/ Capital de Giro', isAndamento()?'Não aplicável (projeto em andamento)':String(state.premissas.mesesGiro)+' meses']
  ], 2);

  /* ---------- RESULTADOS — INDICADORES ---------- */
  sectionTitle('Indicadores de Viabilidade', 'Resultados obtidos — cenário realista');
  kpiRow([
    [LABELS.vplCurto+' (VPL) — ao '+fmtNum(state.premissas.tma,1)+'%', explainVPL(scn), scn.vpl!=null&&scn.vpl<0],
    [LABELS.tirCurto+' (TIR)', explainTIR(scn), scn.tir!=null&&scn.tir<num(state.premissas.tma)/100],
    [LABELS.paybackCurto+' (Payback)', explainPayback(scn), scn.payback==null&&scn.fluxo0<0],
    ['Ponto de equilíbrio (Ano '+y5+')', pe.valor!=null?money(pe.valor):'Não se aplica', pe.valor==null]
  ]);
  subTitle('Ponto de equilíbrio — detalhamento (Ano '+y5+')');
  kvGrid([
    ['Custos fixos', money(pe.cf)],
    ['Custos variáveis', money(pe.cv)],
    ['Receita líquida', money(pe.receitaLiq)]
  ], 3);
  subTitle('Como o projeto está montado');
  kvGrid([
    ['Patrimônio já existente (sem novo desembolso)', money(scn.inv.patrimonioExistente)],
    ['Novo investimento — recursos próprios (Ano 0)', scn.andamento?'Não aplicável (projeto em andamento)':money(scn.novoProprioAno0)],
    ['Novo investimento financiado', money(scn.inv.novoFinanciado)],
    ['Capital de giro estimado', scn.andamento?'Não aplicável (projeto em andamento)':money(scn.giroBase)],
    ['Depreciação anual total', money(scn.inv.deprecTotal)],
    ['Renda mensal / beneficiário (Ano '+y5+') — caixa + autoconsumo', money(scn.anos[y5].rendaFamiliar/12/Math.max(1,num(state.meta.beneficiarios)))]
  ], 2);

  /* ---------- INVESTIMENTOS ---------- */
  sectionTitle('Investimentos', 'Dados inseridos');
  if(state.investimentos.length){
    let tNP=0,tNF=0,tEx=0,tDep=0;
    const body = state.investimentos.map(it=>{
      const total=itemValorTotal(it), vr=itemVidaRestante(it), dep=itemDeprecAnual(it);
      if(it.origem==='novo_proprio') tNP+=total; else if(it.origem==='novo_financiado') tNF+=total; else tEx+=total;
      tDep+=dep;
      const origemL = it.origem==='novo_proprio'?'Novo — próprio':it.origem==='novo_financiado'?'Novo — financiado':'Já existente';
      return [it.descricao||'—', it.categoria, origemL, fmtNum(it.quantidade,0), money(it.valorUnit), money(total), fmtNum(vr,1)+' anos', money(dep)];
    });
    body.push(['Totais','','','','', money(tNP+tNF+tEx),'', money(tDep)]);
    table(['Descrição','Categoria','Origem','Qtd.','Valor unit.','Total','Vida útil restante','Deprec. anual'], body,
      {columnStyles:{0:{halign:'left',cellWidth:100},2:{halign:'left'}}, didParseCell:function(d){ if(d.row.index===body.length-1) d.cell.styles.fontStyle='bold'; }});
    kvGrid([
      ['Novo — recursos próprios', money(tNP)],
      ['Novo — financiado', money(tNF)],
      ['Patrimônio já existente', money(tEx)],
      ['Depreciação anual total', money(tDep)]
    ], 4);
  } else { note('Nenhum investimento lançado.'); }

  /* ---------- FINANCIAMENTOS ---------- */
  sectionTitle('Dívidas Ativas / Financiamentos', 'Dados inseridos');
  if(state.financiamentos.length){
    const totalPorAno={1:0,2:0,3:0,4:0,5:0};
    const totalJurosPorAno={1:0,2:0,3:0,4:0,5:0};
    const body = state.financiamentos.map(f=>{
      let totalF=0;
      const pj = clamp(num(f.percJuros)/100,0,1);
      const parcelas = YEARS.map(yy=>{ const v=num(f.parcelas[yy]); totalF+=v; totalPorAno[yy]+=v; totalJurosPorAno[yy]+=v*pj; return money(v); });
      return [f.descricao||'—', money(f.saldoDevedor), fmtNum(f.percJuros||0,0)+'%', ...parcelas, money(totalF)];
    });
    body.push(['Total por ano','','', ...YEARS.map(yy=>money(totalPorAno[yy])), '']);
    table(['Descrição','Saldo devedor','Juros na parcela', ...YEARS.map(yy=>'Ano '+yy), 'Total'], body,
      {columnStyles:{0:{halign:'left',cellWidth:120}}, didParseCell:function(d){ if(d.row.index===body.length-1) d.cell.styles.fontStyle='bold'; }});
    subTitle('Total de juros embutidos nas parcelas — despesa financeira considerada no Lucro Líquido');
    kvGrid(YEARS.map(yy=>['Ano '+yy, money(totalJurosPorAno[yy])]), 5);
  } else { note('Nenhuma dívida/financiamento lançado.'); }

  /* ---------- CUSTOS ---------- */
  sectionTitle('Custos Operacionais', 'Dados inseridos');
  if(state.custos.length){
    const totalPorAno={1:0,2:0,3:0,4:0,5:0};
    const body = state.custos.map(c=>{
      const vals = YEARS.map(yy=>{ const v=num(c.valores[yy]); totalPorAno[yy]+=v; return money(v); });
      return [c.descricao||'—', c.tipo, ...vals];
    });
    body.push(['Total por ano','', ...YEARS.map(yy=>money(totalPorAno[yy]))]);
    table(['Descrição','Tipo', ...YEARS.map(yy=>'Ano '+yy)], body,
      {columnStyles:{0:{halign:'left',cellWidth:150}}, didParseCell:function(d){ if(d.row.index===body.length-1) d.cell.styles.fontStyle='bold'; }});
  } else { note('Nenhum custo lançado.'); }

  /* ---------- CAPITAL DE GIRO ---------- */
  sectionTitle('Capital de Giro', 'Dados inseridos e resultado');
  if(isAndamento()){
    note('Não aplicável — Projeto em Andamento. Como a atividade já está em funcionamento, o sistema não exige capital de giro inicial no Ano 0.');
  } else {
    const {total:custoTotalAno} = calcCustosPorAno();
    const giroAuto = calcCapitalGiro(custoTotalAno[1]);
    kvGrid([
      ['Modo de cálculo', state.capitalGiro.modo==='manual'?'Valor manual':'Automático'],
      ['Custo operacional mensal (Ano 1)', money(custoTotalAno[1]/12)],
      ['Meses de cobertura', state.premissas.mesesGiro+' meses'],
      ['Capital de giro considerado', money(state.capitalGiro.modo==='manual'?num(state.capitalGiro.valorManual):giroAuto)]
    ], 2);
  }

  /* ---------- RECEITAS ---------- */
  sectionTitle('Receitas Projetadas', 'Dados inseridos');
  if(state.receitas.length){
    state.receitas.forEach(r=>{
      subTitle((r.produto||'Produto')+'  ·  '+(r.unidade||'')+'  ·  autoconsumo: '+fmtNum(r.percAutoconsumo,1)+'%');
      const body = [
        ['Quantidade', ...YEARS.map(yy=>fmtNum(r.quantidades[yy]||0,2))],
        ['Preço unitário', ...YEARS.map(yy=>money(r.precos[yy]||0))],
        ['Total', ...YEARS.map(yy=>money(num(r.quantidades[yy])*num(r.precos[yy])))]
      ];
      table(['', ...YEARS.map(yy=>'Ano '+yy)], body, {columnStyles:{0:{halign:'left',cellWidth:100,fontStyle:'bold'}}});
    });
    const {brutaComerc, autoconsumo} = calcReceitasPorAno();
    subTitle('Resumo de receitas — resultado');
    table(['', ...YEARS.map(yy=>'Ano '+yy)], [
      ['Receita bruta de comercialização', ...YEARS.map(yy=>money(brutaComerc[yy]))],
      ['Valor do autoconsumo (informativo)', ...YEARS.map(yy=>money(autoconsumo[yy]))]
    ], {columnStyles:{0:{halign:'left',cellWidth:160}}});
  } else { note('Nenhuma receita lançada.'); }

  /* ---------- FLUXO DE CAIXA ---------- */
  sectionTitle('Fluxo de Caixa', 'Resultado calculado');
  table(['Ano 0',''], [
    ['(–) Investimento novo (recursos próprios)', money(-scn.novoProprioAno0)],
    ['(–) Capital de giro inicial', money(-scn.giroBase)],
    ['(=) Fluxo Ano 0', money(scn.fluxo0)]
  ], {columnStyles:{0:{halign:'left',cellWidth:260}}, didParseCell:function(d){ if(d.row.index===2) d.cell.styles.fontStyle='bold'; }});

  const rows = [
    ['Receita bruta de comercialização', yy=>scn.anos[yy].brutaComerc, 0],
    ['(–) Impostos e taxas sobre a receita', yy=>-scn.anos[yy].impostos, 0],
    ['(=) Receita líquida', yy=>scn.anos[yy].receitaLiquida, 1],
    ['(–) Custos operacionais', yy=>-scn.anos[yy].custos, 0],
    ['(–) Parcelas de financiamento (principal + juros)', yy=>-scn.anos[yy].financ, 0],
    ['(–) Reposição de investimentos', yy=>-scn.anos[yy].reposicao, 0],
    ['(+) Recuperação do capital de giro', yy=>scn.anos[yy].recGiro, 0],
    ['(=) Fluxo de caixa líquido do ano', yy=>scn.anos[yy].fluxoCaixa, 1]
  ];
  let acc = scn.fluxo0;
  const accRow = YEARS.map(yy=>{ acc+=scn.anos[yy].fluxoCaixa; return acc; });
  const bodyFluxo = rows.map(r=>[r[0], ...YEARS.map(yy=>money(r[1](yy)))]);
  bodyFluxo.push(['Saldo de caixa acumulado', ...accRow.map(money)]);
  table(['Item', ...YEARS.map(yy=>'Ano '+yy)], bodyFluxo,
    {columnStyles:{0:{halign:'left',cellWidth:180}},
     didParseCell:function(d){
       const boldRows = [2,7,8];
       if(boldRows.includes(d.row.index)) d.cell.styles.fontStyle='bold';
     }});

  /* ---------- INDICADORES POR CENÁRIO ---------- */
  sectionTitle('Demonstrativo por Cenário — Ano '+y5, 'Resultado calculado · análise de sensibilidade');
  kvGrid([
    ['Cenário otimista', 'receita +'+fmtNum(state.cenarios.otimistaReceita,0)+'% · custo −'+fmtNum(state.cenarios.otimistaCusto,0)+'%'],
    ['Cenário pessimista', 'receita −'+fmtNum(state.cenarios.pessimistaReceita,0)+'% · custo +'+fmtNum(state.cenarios.pessimistaCusto,0)+'%']
  ], 2);
  const nBenef = Math.max(1,num(state.meta.beneficiarios));
  function drowPdf(label, get){
    return [label, money(get(scnPess)), money(get(scn)), money(get(scnOtim))];
  }
  const bodyScn = [
    drowPdf('Receita bruta de comercialização', s=>s.anos[y5].brutaComerc),
    drowPdf('Valor do autoconsumo', s=>s.anos[y5].autoconsumo),
    drowPdf('Impostos e taxas', s=>-s.anos[y5].impostos),
    drowPdf('Receita líquida', s=>s.anos[y5].receitaLiquida),
    drowPdf('Custo total', s=>-s.anos[y5].custos),
    drowPdf('Juros do financiamento', s=>-s.anos[y5].juros),
    drowPdf('Lucro líquido', s=>s.anos[y5].lucroContabil),
    ['Lucratividade (%)',
      fmtPct(scnPess.anos[y5].lucroContabil/Math.max(1,(scnPess.anos[y5].receitaLiquida+scnPess.anos[y5].autoconsumo))),
      fmtPct(scn.anos[y5].lucroContabil/Math.max(1,(scn.anos[y5].receitaLiquida+scn.anos[y5].autoconsumo))),
      fmtPct(scnOtim.anos[y5].lucroContabil/Math.max(1,(scnOtim.anos[y5].receitaLiquida+scnOtim.anos[y5].autoconsumo)))],
    ['Renda mensal por beneficiário (caixa + autoconsumo)',
      money(scnPess.anos[y5].rendaFamiliar/12/nBenef), money(scn.anos[y5].rendaFamiliar/12/nBenef), money(scnOtim.anos[y5].rendaFamiliar/12/nBenef)],
    [LABELS.vplCurto+' (VPL)', explainVPL(scnPess), explainVPL(scn), explainVPL(scnOtim)],
    [LABELS.tirCurto+' (TIR)', explainTIR(scnPess), explainTIR(scn), explainTIR(scnOtim)]
  ];
  table(['Medida','Pessimista','Realista','Otimista'], bodyScn,
    {columnStyles:{0:{halign:'left',cellWidth:170}},
     didParseCell:function(d){ if(d.row.index>=bodyScn.length-2) d.cell.styles.fontStyle='bold'; }});

  /* ---------- RODAPÉS EM TODAS AS PÁGINAS ---------- */
  const totalPages = doc.internal.getNumberOfPages();
  for(let p=1;p<=totalPages;p++){
    doc.setPage(p);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...C_FAINT);
    doc.text('SAF-PP · Caderno de Campo Digital — Análise Financeira do Empreendimento Rural', marginX, pageH-20);
    doc.text('Página '+p+' de '+totalPages, pageW-marginX, pageH-20, {align:'right'});
  }

  const nomeArq = 'analise-financeira-'+(state.meta.produtor||'projeto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'.pdf';
  doc.save(nomeArq || 'analise-financeira.pdf');
  showToast('PDF exportado com sucesso.');
}

/* top bar actions */
