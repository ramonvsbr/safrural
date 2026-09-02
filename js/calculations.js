"use strict";
/* ============================================================
   SAF-PP · calculations.js
   Motor de cálculo financeiro: investimentos, custos, receitas, VPL, TIR, payback, ponto de equilíbrio, cenários e semáforo de viabilidade.
   ============================================================ */

/* ============================== CALC ENGINE ============================== */
function itemVidaRestante(it){
  if(it.origem==='existente'){
    const r = num(it.vidaTotal) - num(it.anosUso);
    return r>0 ? r : 1;
  }
  return num(it.vidaTotal)>0 ? num(it.vidaTotal) : 1;
}
function itemValorTotal(it){ return num(it.quantidade)*num(it.valorUnit); }
function itemDeprecAnual(it){ return itemValorTotal(it)/itemVidaRestante(it); }

function calcInvestimentos(){
  let novoProprio=0, novoFinanciado=0, patrimonioExistente=0, deprecTotal=0;
  const reposicoes = {1:0,2:0,3:0,4:0,5:0};
  state.investimentos.forEach(it=>{
    const total = itemValorTotal(it);
    const vr = itemVidaRestante(it);
    deprecTotal += itemDeprecAnual(it);
    if(it.origem==='novo_proprio') novoProprio += total;
    else if(it.origem==='novo_financiado') novoFinanciado += total;
    else patrimonioExistente += total;
    if(vr>=1 && vr<=5){ reposicoes[Math.round(vr)] += total; }
  });
  return {novoProprio, novoFinanciado, patrimonioExistente, deprecTotal, reposicoes};
}

function calcCapitalGiro(custoAno1Total){
  if(state.capitalGiro.modo==='manual') return num(state.capitalGiro.valorManual);
  return (custoAno1Total/12) * num(state.premissas.mesesGiro||3);
}

function calcCustosPorAno(){
  const out={1:0,2:0,3:0,4:0,5:0};
  const fixo={1:0,2:0,3:0,4:0,5:0};
  const variavel={1:0,2:0,3:0,4:0,5:0};
  state.custos.forEach(c=>{
    YEARS.forEach(y=>{
      const v = num(c.valores[y]);
      out[y]+=v;
      if(c.tipo==='Fixo') fixo[y]+=v; else variavel[y]+=v;
    });
  });
  return {total:out, fixo, variavel};
}

function calcFinanciamentosPorAno(){
  // "parcelas" é o valor total pago (amortização + juros) que sai do caixa.
  // "percJuros" é o % da parcela que corresponde a juros (despesa financeira real);
  // o restante é amortização de principal, que reduz dívida mas não é despesa contábil.
  const parcelas={1:0,2:0,3:0,4:0,5:0};
  const juros={1:0,2:0,3:0,4:0,5:0};
  state.financiamentos.forEach(f=>{
    const pj = clamp(num(f.percJuros)/100,0,1);
    YEARS.forEach(y=>{
      const p = num(f.parcelas[y]);
      parcelas[y]+= p;
      juros[y]+= p*pj;
    });
  });
  return {parcelas, juros};
}

function calcReceitasPorAno(mult){
  mult = mult || {receita:1, custo:1};
  const brutaComerc={1:0,2:0,3:0,4:0,5:0};
  const autoconsumo={1:0,2:0,3:0,4:0,5:0};
  state.receitas.forEach(r=>{
    YEARS.forEach(y=>{
      const q = num(r.quantidades[y]);
      const p = num(r.precos[y]) * mult.receita;
      const perc = clamp(num(r.percAutoconsumo)/100,0,1);
      const totalY = q*p;
      autoconsumo[y]+= totalY*perc;
      brutaComerc[y]+= totalY*(1-perc);
    });
  });
  return {brutaComerc, autoconsumo};
}

function buildScenario(mult){
  mult = mult || {receita:1, custo:1};
  const {total:custoTotal} = calcCustosPorAno();
  const {brutaComerc, autoconsumo} = calcReceitasPorAno(mult);
  const {parcelas:financ, juros:financJuros} = calcFinanciamentosPorAno();
  const inv = calcInvestimentos();
  const andamento = isAndamento();
  // Projeto "em andamento": não há novo aporte de investimento nem exigência
  // de capital de giro no Ano 0 — considera-se que a estrutura já está de pé.
  const giroBase = andamento ? 0 : calcCapitalGiro(custoTotal[1]);
  const novoProprioAno0 = andamento ? 0 : inv.novoProprio;
  const ultimoAno = YEARS[YEARS.length-1];

  const impostoTx = clamp(num(state.premissas.impostoReceita)/100,0,1);

  const anos = {};
  YEARS.forEach(y=>{
    const custosY = custoTotal[y]*mult.custo;
    const impostos = brutaComerc[y]*impostoTx;
    const receitaLiquida = brutaComerc[y]-impostos;
    const financY = financ[y];
    const jurosY = financJuros[y];
    const reposY = inv.reposicoes[y]||0;
    // Recuperação do capital de giro: o capital de giro imobilizado no Ano 0
    // não é uma perda — ele volta a ficar disponível ao final do horizonte
    // analisado. Sem essa recuperação o VPL fica sistematicamente subestimado.
    const recGiroY = (y===ultimoAno && !andamento) ? giroBase : 0;
    const fluxoCaixa = receitaLiquida - custosY - financY - reposY + recGiroY;
    // Lucro contábil desconta apenas a parcela de JUROS do financiamento (despesa
    // financeira real), não a amortização de principal (que é devolução de capital,
    // não despesa) — e desconta depreciação (custo contábil não-caixa).
    const lucroContabil = receitaLiquida + autoconsumo[y] - custosY - jurosY - inv.deprecTotal;
    // "Renda familiar disponível": base de caixa (não contábil), pensada para medir
    // o que efetivamente fica disponível para a família — soma o valor do
    // autoconsumo (bem-estar/segurança alimentar, mesmo não sendo caixa) ao fluxo
    // de caixa do ano (que já desconta parcela cheia, custos e reposições reais).
    const rendaFamiliar = fluxoCaixa + autoconsumo[y];
    anos[y] = {
      brutaComerc:brutaComerc[y], autoconsumo:autoconsumo[y], impostos, receitaLiquida,
      custos:custosY, financ:financY, juros:jurosY, reposicao:reposY, recGiro:recGiroY,
      fluxoCaixa, lucroContabil, rendaFamiliar
    };
  });

  const fluxo0 = -(novoProprioAno0) - giroBase;
  const cashflows = [fluxo0, anos[1].fluxoCaixa, anos[2].fluxoCaixa, anos[3].fluxoCaixa, anos[4].fluxoCaixa, anos[5].fluxoCaixa];

  const tma = num(state.premissas.tma)/100;
  const vpl = npv(cashflows, tma);
  const tir = irr(cashflows);
  const payback = paybackSimples(cashflows);

  return {anos, fluxo0, cashflows, vpl, tir, payback, inv, giroBase, novoProprioAno0, custoTotal, andamento};
}

function npv(cfs, rate){
  return cfs.reduce((acc,cf,t)=> acc + cf/Math.pow(1+rate,t), 0);
}
function irr(cfs){
  // Se todos os fluxos forem (numericamente) zero, não há TIR — evita
  // que a bisseção devolva o ponto médio do intervalo de busca (ex.: 452,5%).
  if(cfs.every(v => Math.abs(v) < 0.005)) return null;

  // bisection search for sign change of NPV(rate)
  function f(r){ return npv(cfs,r); }
  let lo=-0.95, hi=60, flo=f(lo), fhi=f(hi);
  if(!isFinite(flo)||!isFinite(fhi)) return null;
  if(flo*fhi>0){
    // try scanning for a bracket (faixas maiores no início, mais largas depois)
    let found=false;
    let prevR=lo, prevF=flo;
    for(let r=-0.9;r<=60;r+=(r<5?0.05:0.5)){
      const fr=f(r);
      if(prevF*fr<=0){ lo=prevR; hi=r; flo=prevF; fhi=fr; found=true; break; }
      prevR=r; prevF=fr;
    }
    if(!found) return null;
  }
  for(let i=0;i<200;i++){
    const mid=(lo+hi)/2, fmid=f(mid);
    if(Math.abs(fmid)<0.5) return mid;
    if(flo*fmid<0){ hi=mid; fhi=fmid; } else { lo=mid; flo=fmid; }
  }
  return (lo+hi)/2;
}
function paybackSimples(cfs){
  let acc=cfs[0];
  if(acc>=0) return 0;
  for(let t=1;t<cfs.length;t++){
    const prev=acc;
    acc+=cfs[t];
    if(acc>=0){
      const frac = cfs[t]!==0 ? (-prev)/cfs[t] : 0;
      return (t-1)+frac;
    }
  }
  return null;
}

function pontoEquilibrio(scn){
  const y = clamp(num(state.premissas.anoAnalise)||5,1,5);
  const custosFixo = {1:0,2:0,3:0,4:0,5:0};
  state.custos.forEach(c=>{ if(c.tipo==='Fixo') YEARS.forEach(yy=> custosFixo[yy]+=num(c.valores[yy])); });
  const custosVar = {1:0,2:0,3:0,4:0,5:0};
  state.custos.forEach(c=>{ if(c.tipo!=='Fixo') YEARS.forEach(yy=> custosVar[yy]+=num(c.valores[yy])); });
  const receitaLiq = scn.anos[y].receitaLiquida;
  const cf = custosFixo[y], cv = custosVar[y];
  if(receitaLiq<=0) return {valor:null, cf, cv, receitaLiq};
  const margem = 1 - (cv/receitaLiq);
  if(margem<=0) return {valor:null, cf, cv, receitaLiq};
  return {valor: cf/margem, cf, cv, receitaLiq, margem};
}

/* ============================== LINGUAGEM ACESSÍVEL ============================== */
// Termos amigáveis para substituir jargões financeiros no sistema e nos relatórios.
// O termo técnico (sigla) é sempre mantido entre parênteses, para quem já o conhece.
const LABELS = {
  tmaCurto: 'Rendimento mínimo desejado',
  tmaCompleto: 'Rendimento mínimo desejado (ex.: a taxa que o banco pagaria) — TMA',
  vplCurto: 'Lucro real acumulado no período',
  vplCompleto: 'Lucro real acumulado no período (VPL)',
  tirCurto: 'Rentabilidade anual do negócio',
  tirCompleto: 'Rentabilidade anual do negócio (TIR)',
  paybackCurto: 'Tempo para recuperar o dinheiro investido',
  paybackCompleto: 'Tempo para recuperar o dinheiro investido (Payback)'
};

function isAndamento(){ return !!(state.meta && state.meta.tipoProjeto === 'andamento'); }

/* Mensagens amigáveis nos casos em que os índices não convergem matematicamente,
   em vez de mostrar termos técnicos como "não converge" ou "NaN". */
function explainVPL(scn){
  if(scn.vpl!=null && isFinite(scn.vpl)) return fmtR$(scn.vpl);
  return 'Não foi possível calcular — confira os valores lançados';
}
function explainTIR(scn){
  if(scn.tir!=null && isFinite(scn.tir)) return fmtPct(scn.tir,1);
  if(scn.fluxo0>=0){
    return 'Não se aplica — o projeto não exige aporte inicial para gerar lucro';
  }
  if(scn.cashflows.slice(1).every(v=>v<=0)){
    return 'Não se aplica — o projeto não gera retorno de caixa nos anos simulados';
  }
  if(scn.vpl!=null && scn.vpl>0 && scn.payback!=null && scn.payback<0.5){
    return 'Extremamente alta — o investimento se paga em poucos meses, acima da nossa escala de cálculo';
  }
  return 'Não foi possível calcular — confira os valores lançados';
}
function explainPayback(scn){
  if(scn.payback!=null && isFinite(scn.payback)) return fmtNum(scn.payback,2)+' anos';
  if(scn.fluxo0>=0){
    return 'Imediato — não há investimento inicial a recuperar';
  }
  return 'Não recupera o investimento dentro de 5 anos';
}

/* ---------- Semáforo de viabilidade ---------- */
function calcSemaforo(scn){
  const tma = num(state.premissas.tma)/100;
  const folgaMinimaPP = num(state.premissas.folgaTirMinima!=null? state.premissas.folgaTirMinima : 3);
  const paybackLimite = num(state.premissas.paybackAlerta!=null? state.premissas.paybackAlerta : 4);
  if(scn.vpl==null || !isFinite(scn.vpl)){
    return {cor:'cinza', titulo:'Sem dados suficientes',
      msg:'Lance os investimentos, custos e receitas do projeto para calcular a viabilidade.'};
  }
  if(scn.vpl < 0){
    return {cor:'vermelho', titulo:'Inviável nas condições atuais',
      msg:'O projeto não cobre o '+LABELS.tmaCurto.toLowerCase()+'. Reveja preços, custos ou o valor do investimento antes de seguir em frente.'};
  }
  // VPL positivo — checa a rentabilidade anual (TIR), quando existir
  if(scn.tir!=null && isFinite(scn.tir)){
    if(scn.tir < tma){
      return {cor:'vermelho', titulo:'Inviável nas condições atuais',
        msg:'A '+LABELS.tirCurto.toLowerCase()+' ficou abaixo do rendimento mínimo desejado.'};
    }
    const folgaPP = (scn.tir - tma) * 100;
    const paybackApertado = scn.payback!=null && scn.payback > paybackLimite;
    if(folgaPP < folgaMinimaPP || paybackApertado){
      return {cor:'amarelo', titulo:'Viável, mas com margem apertada',
        msg:'O projeto compensa, porém com folga pequena. Quedas de preço ou aumento de custos podem inviabilizá-lo — vale ter um plano de contingência.'};
    }
    return {cor:'verde', titulo:'Projeto viável',
      msg:'O projeto supera o rendimento mínimo desejado com boa margem de segurança.'};
  }
  // TIR não definida (ex.: sem aporte inicial a recuperar, ou retorno tão rápido
  // que ultrapassa a escala numérica de busca da TIR)
  if(scn.fluxo0>=0){
    return {cor:'verde', titulo:'Projeto viável',
      msg:'O projeto não exige aporte inicial relevante e já apresenta lucro nos anos simulados.'};
  }
  if(scn.payback!=null && scn.payback<0.5){
    return {cor:'verde', titulo:'Projeto viável',
      msg:'O investimento se paga em poucos meses e a rentabilidade anual é tão alta que ultrapassa nossa escala de cálculo — sinal de retorno muito favorável.'};
  }
  return {cor:'amarelo', titulo:'Atenção',
    msg:'Não foi possível calcular a rentabilidade anual com precisão. Revise os valores lançados nas abas anteriores.'};
}
function renderSemaforo(scn){
  const s = calcSemaforo(scn);
  const ordem = ['vermelho','amarelo','verde'];
  const luzes = ordem.map(c=>'<span class="luz '+(c===s.cor?'on-'+c:'')+'"></span>').join('');
  return '<div class="semaforo cor-'+s.cor+'"><div class="luzes">'+luzes+'</div>'+
    '<div class="txt"><h4>'+s.titulo+'</h4><p>'+s.msg+'</p></div></div>';
}

