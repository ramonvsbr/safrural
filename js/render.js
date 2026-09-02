"use strict";
/* ============================================================
   SAF-PP · render.js
   Renderização de toda a interface: abas, campos de formulário e os painéis (Ajuda, Dashboard, Projeto, Investimentos, Financiamentos, Custos, Capital de Giro, Receitas, Fluxo de Caixa, Indicadores).
   ============================================================ */

/* ============================== FOCUS-PRESERVING RENDER ============================== */
function captureFocus(){
  const el = document.activeElement;
  if(!el || !el.dataset || !el.dataset.bind) return null;
  // Inputs do tipo "number" não suportam a API de seleção (selectionStart/End
  // lança exceção nesses campos). Sem esse guard, a captura falhava
  // silenciosamente e o cursor voltava para o início a cada tecla digitada.
  let selStart = null, selEnd = null;
  if(el.type!=='number' && el.type!=='date'){
    try{
      if(typeof el.selectionStart==='number') selStart = el.selectionStart;
      if(typeof el.selectionEnd==='number') selEnd = el.selectionEnd;
    }catch(e){ /* tipo não suporta seleção */ }
  }
  return { bind: el.dataset.bind, type: el.type, selStart, selEnd };
}
function restoreFocus(f){
  if(!f) return;
  const el = document.querySelector('[data-bind="'+CSS.escape(f.bind)+'"]');
  if(!el) return;
  el.focus();
  if(f.selStart!=null && f.selEnd!=null && el.setSelectionRange){
    try{ el.setSelectionRange(f.selStart, f.selEnd); }catch(e){}
  } else if(el.type==='number'){
    // Campos number não aceitam setSelectionRange. Reatribuir o valor
    // move o cursor para o final, que é o comportamento esperado ao digitar.
    try{ const v = el.value; el.value=''; el.value=v; }catch(e){}
  }
}

let rafPending=false;
function requestRender(){
  if(rafPending) return;
  rafPending=true;
  requestAnimationFrame(()=>{ rafPending=false; renderAll(); });
}

/* ============================== TABS DEFINITION ============================== */
const TABS = [
  {id:'ajuda', n:'?', label:'Como Usar'},
  {id:'dashboard', n:'00', label:'Painel Geral'},
  {id:'projeto', n:'01', label:'Dados & Premissas'},
  {id:'invest', n:'02', label:'Investimentos'},
  {id:'financ', n:'03', label:'Dívidas Ativas'},
  {id:'custos', n:'04', label:'Custos Operacionais'},
  {id:'giro', n:'05', label:'Capital de Giro'},
  {id:'receitas', n:'06', label:'Receitas Projetadas'},
  {id:'fluxo', n:'07', label:'Fluxo de Caixa'},
  {id:'indicadores', n:'08', label:'Indicadores & Cenários'}
];

function renderTabs(){
  const nav = document.getElementById('tabs');
  nav.innerHTML = TABS.map(t=>
    '<button data-tab="'+t.id+'" class="'+(activeTab===t.id?'active':'')+'"><span class="n">'+t.n+'</span>'+t.label+'</button>'
  ).join('');
  nav.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ activeTab=b.dataset.tab; renderAll(); });
  });
}

/* ============================== FIELD BUILDERS ============================== */
function fld(labelTxt, bind, value, opts){
  opts = opts||{};
  const type = opts.type||'text';
  const step = opts.step? ' step="'+opts.step+'"':'';
  const min = opts.min!=null? ' min="'+opts.min+'"':'';
  const max = opts.max!=null? ' max="'+opts.max+'"':'';
  const val = value==null? '' : value;
  return '<label class="field"><span>'+labelTxt+'</span>'+
    '<input type="'+type+'"'+step+min+max+' data-bind="'+bind+'" value="'+String(val).replace(/"/g,'&quot;')+'" '+(opts.readonly?'readonly':'')+'></label>';
}
function selectFld(labelTxt, bind, value, options){
  const opts = options.map(o=>'<option value="'+o.v+'" '+(o.v===value?'selected':'')+'>'+o.l+'</option>').join('');
  return '<label class="field"><span>'+labelTxt+'</span><select data-bind="'+bind+'">'+opts+'</select></label>';
}

/* generic bind path setter: "investimentos.INVID.descricao" or "custos.CID.valores.3" or "meta.produtor" */
function setPath(root, path, value){
  const parts = path.split('.');
  let ref = root;
  for(let i=0;i<parts.length-1;i++){
    const p = parts[i];
    if(/^\d+$/.test(p) === false && Array.isArray(ref)){
      // find by id
      const found = ref.find(x=>x.id===p);
      ref = found;
    } else {
      ref = ref[p];
    }
  }
  const last = parts[parts.length-1];
  ref[last] = value;
}
function getArrById(section, id){ return state[section].find(x=>x.id===id); }

/* ============================== PANEL: COMO USAR / AJUDA ============================== */
function renderAjuda(){
  let html = '<div class="panel-head"><div><h2>Como Usar o SAF-PP</h2></div></div>';

  html += '<div class="panel-note">Este guia explica, passo a passo, como preencher o sistema e como interpretar os resultados. '+
    'Não é preciso preencher tudo de uma vez: os dados ficam salvos automaticamente e você pode voltar e completar depois.</div>';

  /* ---- TIPO DE PROJETO ---- */
  html += '<fieldset class="block"><legend>Antes de começar: qual é a situação do seu projeto?</legend>'+
    '<p style="margin:0 0 10px;font-size:12.8px;color:var(--ink-soft);line-height:1.6;">Logo na aba <b>01 · Dados &amp; Premissas</b> você escolhe entre duas situações. '+
    'Essa escolha muda o que o sistema cobra no "Ano 0" (hoje):</p>'+
    '<div class="tipo-projeto-grid">'+
    '<div class="tipo-card active" style="cursor:default;"><div class="tc-title"><span class="dot" style="background:var(--green);border-color:var(--green-dark);"></span>Projeto do Zero</div>'+
    '<div class="tc-desc">Você ainda vai investir — comprar máquinas, construir, montar a estrutura. O sistema desconta o valor desse investimento e o capital de giro logo no início da análise (Ano 0).</div></div>'+
    '<div class="tipo-card active" style="cursor:default;"><div class="tc-title"><span class="dot" style="background:var(--green);border-color:var(--green-dark);"></span>Projeto em Andamento</div>'+
    '<div class="tc-desc">A estrutura já existe e já está funcionando. O sistema não cobra novo investimento nem capital de giro no início — a análise foca só no que o negócio já gera de resultado dia a dia.</div></div>'+
    '</div></fieldset>';

  /* ---- PASSO A PASSO ---- */
  html += '<fieldset class="block"><legend>Passo a passo de preenchimento</legend><ol class="help-steps">';

  html += '<li><h4>01 · Dados &amp; Premissas</h4>'+
    '<p>Comece escolhendo se o projeto é "do zero" ou "em andamento" (veja acima), e identifique o produtor, o local e a atividade produtiva '+
    '(ex.: apicultura, caprinocultura, fruticultura). Informe também o número de beneficiários da renda e as premissas gerais do projeto, como o '+
    '<b>'+LABELS.tmaCurto.toLowerCase()+'</b> — o rendimento que você teria aplicando esse dinheiro em outro lugar, como a poupança ou um banco (TMA) —, '+
    'o ano que será usado como referência para a análise e os meses de cobertura do capital de giro.</p>'+
    '<p>Essas informações servem de base para todos os cálculos das demais abas — por isso é o primeiro passo.</p></li>';

  html += '<li><h4>02 · Investimentos</h4>'+
    '<p>Liste tudo o que precisa ser comprado ou construído para viabilizar o projeto (equipamentos, benfeitorias, animais, mudas, etc.), '+
    'com a quantidade, o valor unitário e a origem do recurso (próprio ou financiado). O sistema soma automaticamente o investimento total '+
    'e separa quanto sai do bolso do produtor e quanto vem de financiamento.</p></li>';

  html += '<li><h4>03 · Dívidas Ativas (Financiamentos)</h4>'+
    '<p>Se parte do investimento vier de crédito rural ou outro financiamento, cadastre aqui as condições: valor financiado, taxa de juros, '+
    'carência e prazo. O sistema calcula as parcelas anuais que entrarão como saída de caixa no fluxo de caixa do projeto.</p></li>';

  html += '<li><h4>04 · Custos Operacionais</h4>'+
    '<p>Registre os custos de manter a atividade funcionando ano a ano: insumos, mão de obra, manutenção, energia, transporte, etc. '+
    'Classifique cada item como custo fixo (não muda com a produção) ou variável (muda conforme a quantidade produzida) — '+
    'essa classificação é usada depois para calcular o Ponto de Equilíbrio.</p></li>';

  html += '<li><h4>05 · Capital de Giro</h4>'+
    '<p>O capital de giro é o dinheiro necessário para pagar as contas do dia a dia antes que as vendas comecem a entrar. '+
    'O sistema sugere um valor automático (com base no custo mensal e nos meses de cobertura definidos nas premissas), '+
    'mas você também pode informar um valor manual, se preferir.</p>'+
    '<p>Se você escolheu <b>"Projeto em Andamento"</b> na etapa 01, esta aba fica marcada como "não aplicável", pois considera-se que o negócio já tem seu capital de giro resolvido no dia a dia.</p></li>';

  html += '<li><h4>06 · Receitas Projetadas</h4>'+
    '<p>Cadastre cada produto ou serviço que será vendido, com a quantidade esperada e o preço unitário em cada um dos 5 anos de análise. '+
    'Se parte da produção for para consumo da própria família (autoconsumo), informe o percentual — esse valor não entra como receita de venda, '+
    'mas é mostrado separadamente como um ganho informativo (economia que a família deixa de gastar no mercado).</p></li>';

  html += '<li><h4>07 · Fluxo de Caixa</h4>'+
    '<p>Esta aba é calculada automaticamente a partir de tudo o que foi preenchido nas abas anteriores. Ela mostra, ano a ano, '+
    'quanto entra (receitas), quanto sai (impostos, custos, parcelas de financiamento, reposição de investimentos) e qual o saldo final — '+
    'o chamado fluxo de caixa líquido. É a "espinha dorsal" que alimenta os indicadores de viabilidade.</p></li>';

  html += '<li><h4>08 · Indicadores &amp; Cenários</h4>'+
    '<p>Aqui você vê se o projeto vale a pena, com um <b>semáforo de viabilidade</b> (verde, amarelo ou vermelho) logo no topo, além do '+
    LABELS.vplCurto.toLowerCase()+' (VPL), da '+LABELS.tirCurto.toLowerCase()+' (TIR), do '+LABELS.paybackCurto.toLowerCase()+' (Payback), '+
    'do ponto de equilíbrio, da lucratividade e da renda mensal por beneficiário. '+
    'Também é possível simular um cenário otimista (mais receita, menos custo) e um pessimista (menos receita, mais custo), '+
    'para entender os riscos do projeto. Veja a explicação de cada indicador no glossário abaixo.</p></li>';

  html += '<li><h4>Exportar e salvar</h4>'+
    '<p>A qualquer momento, use o botão de exportação no topo da página para gerar um PDF completo com todos os dados e resultados — '+
    'útil para levar a um técnico, banco ou linha de crédito. O botão de exemplo carrega dados fictícios de demonstração, '+
    'e o botão de reset apaga tudo para começar do zero.</p></li>';

  html += '</ol></fieldset>';

  html += '<div class="help-callout"><b>Dica:</b> preencha as abas na ordem sugerida (01 a 08). Como cada etapa usa os dados da anterior, '+
    'preencher fora de ordem pode fazer os indicadores aparecerem zerados ou incompletos até que tudo esteja lançado.</div>';

  /* ---- SEMÁFORO DE VIABILIDADE ---- */
  html += '<fieldset class="block"><legend>O semáforo de viabilidade</legend>'+
    '<p style="margin:0 0 12px;font-size:12.8px;color:var(--ink-soft);line-height:1.6;">Na aba <b>Painel Geral</b> e na aba <b>Indicadores &amp; Cenários</b>, o sistema mostra um semáforo '+
    'para resumir, de forma visual, se o projeto compensa ou não:</p>'+
    renderSemaforo({vpl:100,tir:0.5,payback:1,fluxo0:-1,cashflows:[-1,1,1,1,1,1],andamento:false})+
    renderSemaforo({vpl:50,tir:num(state.premissas.tma)/100+0.01,payback:4.5,fluxo0:-1,cashflows:[-1,1,1,1,1,1],andamento:false})+
    renderSemaforo({vpl:-100,tir:0.01,payback:null,fluxo0:-1,cashflows:[-1,0,0,0,0,0],andamento:false})+
    '</fieldset>';

  html += '<div class="help-callout"><b>Como calculamos a cor:</b> começamos pelo '+LABELS.vplCurto.toLowerCase()+' (VPL). Se ele for negativo, o sinal já fica vermelho. '+
    'Se for positivo, olhamos a '+LABELS.tirCurto.toLowerCase()+' (TIR) comparada ao '+LABELS.tmaCurto.toLowerCase()+': folga pequena (menos de '+fmtNum(state.premissas.folgaTirMinima,1)+' pontos percentuais) ou '+
    'payback maior que '+fmtNum(state.premissas.paybackAlerta,1)+' anos dá amarelo (viável, mas apertado); folga confortável dá verde. '+
    'Esses dois números (folga mínima e payback de alerta) podem ser ajustados na aba <b>01 · Dados &amp; Premissas</b>.</div>';

  /* ---- GLOSSÁRIO DE INDICADORES ---- */
  html += '<fieldset class="block"><legend>O que significam os valores e índices dos resultados</legend>';

  html += glossItem(LABELS.vplCurto, 'VPL · Valor Presente Líquido',
    'Traz todo o dinheiro que o projeto vai gerar (ou consumir) no futuro para o valor de hoje, descontando o '+LABELS.tmaCurto.toLowerCase()+' (TMA) — '+
    'ou seja, considera que "um real hoje vale mais do que um real daqui a 5 anos".',
    '<b>Como ler:</b> um valor positivo significa que o projeto gera mais riqueza do que deixar esse dinheiro rendendo no banco — o projeto é economicamente vantajoso. '+
    'Um valor negativo indica que o projeto, nas condições simuladas, não cobre o rendimento mínimo desejado sobre o capital investido.',
    'Quanto maior, melhor');

  html += glossItem(LABELS.tirCurto, 'TIR · Taxa Interna de Retorno',
    'É a taxa de retorno anual que o próprio negócio proporciona — o quanto ele "rende" por ano, em porcentagem, comparado ao dinheiro que foi colocado nele.',
    '<b>Como ler:</b> compare com o '+LABELS.tmaCurto.toLowerCase()+'. Se a rentabilidade anual for maior, o projeto rende mais do que outras alternativas de aplicação do dinheiro e vale a pena investir. '+
    'Se for menor, ou se aparecer a mensagem de "não se aplica", o projeto não é atrativo financeiramente nas condições atuais, ou simplesmente não exige um aporte inicial a ser recuperado.',
    'Quanto maior, melhor');

  html += glossItem(LABELS.paybackCurto, 'Payback · Período de retorno',
    'Indica quanto tempo (em anos) leva para o produtor recuperar todo o dinheiro investido no projeto, somando os fluxos de caixa acumulados.',
    '<b>Como ler:</b> quanto menor esse tempo, mais rápido o investimento "se paga" e menor o risco de o produtor ficar exposto por muito tempo. '+
    'Projetos que não recuperam o investimento dentro do horizonte de análise (5 anos) mostram um aviso nesse sentido.',
    'Quanto menor, melhor');

  html += glossItem('Ponto de Equilíbrio', 'Break-even',
    'Mostra o valor de receita mínimo necessário no ano para cobrir exatamente os custos fixos e variáveis, sem lucro nem prejuízo.',
    '<b>Como ler:</b> se a receita projetada ficar acima do ponto de equilíbrio, o projeto está gerando lucro naquele ano; '+
    'se ficar abaixo, o projeto está operando no prejuízo. É um alerta importante para saber a "margem de segurança" da atividade.',
    'Quanto menor em relação à receita, melhor');

  html += glossItem('Lucratividade', '% sobre a receita',
    'É o percentual do lucro líquido em relação à receita total (receita líquida + autoconsumo) do ano analisado.',
    '<b>Como ler:</b> mostra, de cada R$ 100,00 vendidos (ou produzidos para consumo), quanto sobra de lucro depois de pagar impostos, custos operacionais, '+
    'os juros do financiamento e a depreciação dos bens. Ajuda a comparar a eficiência do projeto independentemente do seu tamanho. '+
    '(A amortização de principal do financiamento e a reposição de bens não entram aqui — são movimentos de caixa, não despesa contábil; elas aparecem no Fluxo de Caixa.)',
    'Quanto maior, melhor');

  html += glossItem('Renda Mensal por Beneficiário', 'R$ / mês / pessoa',
    'Soma o fluxo de caixa do ano (o que sobra depois de todas as saídas reais: custos, parcela cheia do financiamento e reposição de bens) com o valor do autoconsumo, '+
    'e divide o resultado por 12 meses e pelo número de pessoas beneficiadas pela atividade (informado na aba Dados &amp; Premissas).',
    '<b>Como ler:</b> é o indicador mais próximo do dia a dia da família — mostra, na prática, quanto dinheiro (mais o que é consumido em casa) o projeto coloca à disposição por mês e por pessoa. '+
    'Por usar caixa em vez de lucro contábil, ele não é reduzido pela depreciação (que não é uma saída de dinheiro), mas cai nos anos em que há reposição de um bem ou pagamento pesado de financiamento. '+
    'É útil para comparar o resultado do projeto com o custo de vida ou com outras fontes de renda.',
    'Quanto maior, melhor');

  html += glossItem('Cenários (Otimista / Realista / Pessimista)', 'Análise de sensibilidade',
    'Recalcula todos os indicadores aplicando variações percentuais de aumento ou redução na receita e no custo, para simular momentos '+
    'de mercado favoráveis (otimista) ou desfavoráveis (pessimista).',
    '<b>Como ler:</b> se mesmo no cenário pessimista o '+LABELS.vplCurto.toLowerCase()+' continuar positivo e a '+LABELS.tirCurto.toLowerCase()+' continuar acima do '+
    LABELS.tmaCurto.toLowerCase()+', o projeto tem uma margem de segurança maior diante de imprevistos como quebra de safra, queda de preços ou aumento de insumos.',
    'Quanto mais estável entre os cenários, mais seguro');

  html += '</fieldset>';

  html += '<div class="help-callout"><b>Sobre as mensagens do sistema:</b> em vez de mostrar erros matemáticos (como "não converge" ou "NaN") quando um índice não pode ser calculado, '+
    'o SAF-PP explica em linguagem simples o motivo — por exemplo, "Não se aplica — o projeto não exige aporte inicial para gerar lucro". Isso é normal e não significa um erro no preenchimento.</div>';

  html += '<div class="help-callout"><b>Importante:</b> estes indicadores são ferramentas de apoio à decisão, construídas a partir dos dados que você informou. '+
    'A qualidade da análise depende diretamente da qualidade das informações lançadas em cada aba. Em caso de dúvida sobre os números, '+
    'procure a assistência técnica rural ou o agente de crédito responsável pelo projeto.</div>';

  document.getElementById('content').innerHTML = html;
}
function glossItem(nome, sigla, oQueE, comoLer, tag){
  return '<div class="gloss-item">'+
    '<div class="gloss-head"><span class="name">'+nome+'</span><span class="sigla">'+sigla+'</span></div>'+
    '<div class="gloss-body"><p style="margin:0 0 8px;"><b>O que é:</b> '+oQueE+'</p>'+
    '<p style="margin:0;">'+comoLer+'</p>'+
    '<span class="tag">'+tag+'</span></div>'+
    '</div>';
}

/* ============================== PANEL: DASHBOARD ============================== */
function renderDashboard(){
  const scn = buildScenario();
  const inv = scn.inv;
  const y = clamp(num(state.premissas.anoAnalise)||5,1,5);
  const rendaBenef = scn.anos[y].rendaFamiliar/12/Math.max(1,num(state.meta.beneficiarios));

  let html = '<div class="panel-head"><div><h2>Painel Geral</h2></div>'+
    '<div style="font-size:12px;color:var(--ink-soft)">'+(state.meta.produtor||'')+' · '+(state.meta.atividade||'')+
    (isAndamento()?' · <span style="color:var(--ochre-dark)">Projeto em Andamento</span>':' · Projeto do Zero')+'</div></div>';

  html += renderSemaforo(scn);

  html += '<div class="kpi-grid">'+
    kpi(LABELS.vplCompleto, explainVPL(scn), scn.vpl!=null && scn.vpl<0, 'ao '+LABELS.tmaCurto.toLowerCase()+' de '+fmtNum(state.premissas.tma,1)+'% a.a.')+
    kpi(LABELS.tirCompleto, explainTIR(scn), scn.tir!=null && scn.tir < num(state.premissas.tma)/100, 'compare com o '+LABELS.tmaCurto.toLowerCase())+
    kpi(LABELS.paybackCompleto, explainPayback(scn), scn.payback==null && scn.fluxo0<0, 'tempo até o saldo ficar positivo')+
    kpi('Renda mensal / beneficiário (ano '+y+')', fmtR$(rendaBenef), rendaBenef<0, num(state.meta.beneficiarios)+' beneficiário(s) · caixa do ano + autoconsumo')+
    '</div>';

  html += '<div class="two-col">';

  // cash flow bars
  html += '<div><h3 style="font-size:14px;margin-bottom:6px;">Fluxo de Caixa Líquido — Ano 0 a Ano 5</h3>';
  const vals = scn.cashflows;
  const maxAbs = Math.max(1,...vals.map(v=>Math.abs(v)));
  html += '<div class="bars">';
  vals.forEach((v,i)=>{
    const h = Math.max(2, Math.round(Math.abs(v)/maxAbs*140));
    html += '<div class="bar-col">'+
      (v>=0? '<span class="bv">'+fmtR$(v)+'</span>' : '')+
      '<div class="bar '+(v<0?'neg':'')+'" style="height:'+h+'px;'+(v<0?'align-self:flex-start;':'')+'"></div>'+
      (v<0? '<span class="bv">'+fmtR$(v)+'</span>' : '')+
      '<span class="bl">Ano '+i+'</span></div>';
  });
  html += '</div></div>';

  // summary notes
  html += '<div><h3 style="font-size:14px;margin-bottom:6px;">Como o projeto está montado</h3><ul class="note-list">'+
    '<li>Patrimônio já existente (sem novo desembolso): <b>'+fmtR$(inv.patrimonioExistente)+'</b></li>'+
    '<li>Novo investimento com recursos próprios (Ano 0): <b>'+(scn.andamento?'Não aplicável (projeto em andamento)':fmtR$(scn.novoProprioAno0))+'</b></li>'+
    '<li>Novo investimento financiado: <b>'+fmtR$(inv.novoFinanciado)+'</b></li>'+
    '<li>Capital de giro estimado: <b>'+(scn.andamento?'Não aplicável (projeto em andamento)':fmtR$(scn.giroBase))+'</b></li>'+
    '<li>Depreciação anual total: <b>'+fmtR$(inv.deprecTotal)+'</b> (custo contábil, não sai do caixa)</li>'+
    '<li>Reposição de bens prevista dentro dos 5 anos: '+repoList(inv.reposicoes)+'</li>'+
    '</ul></div>';

  html += '</div>';
  
  document.getElementById('content').innerHTML = html;
}
function repoList(rep){
  const parts=[];
  YEARS.forEach(y=>{ if(rep[y]>0) parts.push('Ano '+y+': '+fmtR$(rep[y])); });
  return parts.length? parts.join(' · ') : 'nenhuma no horizonte';
}
function kpi(lbl,val,neg,sub){
  return '<div class="kpi"><div class="lbl">'+lbl+'</div><div class="val '+(neg?'neg':'')+'">'+val+'</div><div class="sub">'+(sub||'')+'</div></div>';
}

/* ============================== PANEL: PROJETO (meta + premissas) ============================== */
function renderProjeto(){
  let html = '<div class="panel-head"><div><h2>Dados do Projeto & Premissas</h2></div></div>';

  const andamento = isAndamento();
  html += '<fieldset class="block"><legend>Qual é a situação do seu projeto?</legend>'+
    '<div class="tipo-projeto-grid">'+
    '<button type="button" class="tipo-card'+(!andamento?' active':'')+'" data-action="set-tipo-projeto" data-val="zero">'+
      '<div class="tc-title"><span class="dot"></span>Projeto do Zero</div>'+
      '<div class="tc-desc">Ainda vou construir, comprar máquinas/equipamentos ou montar a estrutura. O sistema vai considerar o investimento inicial (Ano 0) e a necessidade de capital de giro.</div>'+
    '</button>'+
    '<button type="button" class="tipo-card'+(andamento?' active':'')+'" data-action="set-tipo-projeto" data-val="andamento">'+
      '<div class="tc-title"><span class="dot"></span>Projeto em Andamento</div>'+
      '<div class="tc-desc">A estrutura já existe e a atividade já está funcionando. O sistema não vai cobrar novo investimento no Ano 0 nem capital de giro inicial.</div>'+
    '</button>'+
    '</div></fieldset>';

  html += '<fieldset class="block"><legend>Identificação</legend><div class="grid g2">'+
    fld('Produtor(a) / Associação', 'meta.produtor', state.meta.produtor)+
    fld('Localização', 'meta.local', state.meta.local)+
    fld('Atividade principal', 'meta.atividade', state.meta.atividade)+
    fld('Nº de beneficiários(as)', 'meta.beneficiarios', state.meta.beneficiarios, {type:'number', step:1, min:1})+
    fld('Data de preenchimento', 'meta.data', state.meta.data, {type:'date'})+
    '</div></fieldset>';

  html += '<fieldset class="block"><legend>Premissas financeiras</legend><div class="grid g4">'+
    fld('Impostos/taxas sobre a receita (%)','premissas.impostoReceita', state.premissas.impostoReceita, {type:'number', step:0.1, min:0, max:100})+
    fld(LABELS.tmaCurto+' (% a.a.)','premissas.tma', state.premissas.tma, {type:'number', step:0.1, min:0})+
    fld('Ano de análise para indicadores (1–5)','premissas.anoAnalise', state.premissas.anoAnalise, {type:'number', step:1, min:1, max:5})+
    fld('Meses de custo para Capital de Giro','premissas.mesesGiro', state.premissas.mesesGiro, {type:'number', step:1, min:0, readonly:andamento})+
    '</div></fieldset>';

  html += '<fieldset class="block"><legend>Critérios do semáforo de viabilidade</legend><div class="grid g2">'+
    fld('Folga mínima da TIR sobre a TMA para ficar "verde" (pontos percentuais)','premissas.folgaTirMinima', state.premissas.folgaTirMinima, {type:'number', step:0.5, min:0})+
    fld('Payback acima do qual o sinal fica "amarelo" (anos)','premissas.paybackAlerta', state.premissas.paybackAlerta, {type:'number', step:0.5, min:0})+
    '</div></fieldset>';
  html += '<div class="panel-note" style="margin-top:-8px;">Esses dois valores definem quando o semáforo (Painel Geral) passa de verde para amarelo: uma folga pequena entre a rentabilidade do projeto (TIR) e o '+LABELS.tmaCurto.toLowerCase()+', ou um tempo de retorno (payback) considerado longo. Ajuste conforme o critério da sua instituição/técnico responsável — os valores padrão (3 p.p. e 4 anos) são uma referência geral, não uma norma fixa.</div>';

  html += '<div class="panel-note">Essas premissas alimentam todos os cálculos automáticos: impostos reduzem a receita líquida; '+
    'o <b>'+LABELS.tmaCurto.toLowerCase()+'</b> (TMA) é o retorno mínimo que você aceitaria ganhar aplicando esse mesmo dinheiro em outro lugar — como a poupança ou um banco — '+
    'e é usado para saber se o negócio vale mais a pena do que essa alternativa; o "ano de análise" define qual ano aparece nos indicadores e no ponto de equilíbrio. '+
    '<br><br><b>Importante:</b> lance todos os valores (preços, custos, parcelas) em <u>preços de hoje</u>, sem embutir inflação futura — e use como '+LABELS.tmaCurto.toLowerCase()+' uma taxa também "de hoje" (ex.: o que a poupança ou um CDB pagariam agora), para manter a comparação justa. '+
    'O percentual de impostos/taxas é aplicado de forma simplificada, direto sobre a receita comercializada (como no Simples/Funrural) — ele não substitui uma consulta ao regime tributário específico do seu caso, principalmente se a atividade estiver em faixas ou regras diferentes.</div>';

  if(andamento){
    html += '<div class="help-callout"><b>Projeto em Andamento selecionado:</b> as abas <b>Investimentos</b> e <b>Capital de Giro</b> continuam disponíveis para registro/consulta, '+
      'mas os valores de novo investimento com recursos próprios e o capital de giro inicial <u>não</u> serão descontados no Ano 0 do fluxo de caixa, pois considera-se que a estrutura já está pronta e em operação.</div>';
  }

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: INVESTIMENTOS ============================== */
const ORIGENS = [
  {v:'novo_proprio', l:'Novo — recursos próprios (sai do caixa no Ano 0)'},
  {v:'novo_financiado', l:'Novo — financiado (lance as parcelas em Dívidas)'},
  {v:'existente', l:'Já existente — recursos próprios já realizados'}
];
const CATEGORIAS = ['Terrenos','Obras e Instalações','Equipamentos e Máquinas','Veículos','Semoventes (Animais)','Outros'];

function renderInvest(){
  let html = '<div class="panel-head"><div><h2>Investimentos</h2></div>'+
    '<button class="btn ochre small" data-action="add-inv">+ novo item</button></div>';

  html += '<div class="panel-note">Para máquinas e bens <b>já comprados</b>, marque a origem como "Já existente": o valor entra como patrimônio e gera depreciação, mas <u>não</u> é descontado do fluxo de caixa futuro. Informe o valor de mercado atual (não o valor da nota antiga) e os anos de uso, para calcular a vida útil restante.</div>';

  if(isAndamento()){
    html += '<div class="help-callout"><b>Projeto em Andamento:</b> mesmo que você lance itens como "Novo — recursos próprios", esse valor <u>não</u> será descontado no Ano 0 do fluxo de caixa, pois considera-se que o investimento inicial já foi feito. Use esta aba apenas para registrar o patrimônio existente (para fins de depreciação) ou para planejar novos investimentos financiados.</div>';
  }

  html += '<div class="wrap-table"><table class="data"><thead><tr>'+
    '<th style="min-width:170px">Descrição</th><th>Categoria</th><th style="min-width:230px">Origem</th>'+
    '<th>Qtd.</th><th>Valor unit. atual (R$)</th><th>Total (R$)</th>'+
    '<th>Vida útil total (anos)</th><th>Anos de uso</th><th>Vida útil restante</th><th>Deprec. anual (R$)</th><th></th>'+
    '</tr></thead><tbody>';

  if(state.investimentos.length===0){
    html += '<tr><td colspan="11" class="empty-hint">Nenhum item lançado ainda. Clique em "+ novo item".</td></tr>';
  }

  let totNovoProprio=0, totNovoFin=0, totExist=0, totDeprec=0;
  state.investimentos.forEach(it=>{
    const total = itemValorTotal(it);
    const vr = itemVidaRestante(it);
    const dep = itemDeprecAnual(it);
    if(it.origem==='novo_proprio') totNovoProprio+=total;
    else if(it.origem==='novo_financiado') totNovoFin+=total;
    else totExist+=total;
    totDeprec+=dep;
    const isExist = it.origem==='existente';
    html += '<tr>'+
      '<td class="txt"><input type="text" data-bind="investimentos.'+it.id+'.descricao" value="'+esc(it.descricao)+'"></td>'+
      '<td><select data-bind="investimentos.'+it.id+'.categoria">'+CATEGORIAS.map(c=>'<option '+(c===it.categoria?'selected':'')+'>'+c+'</option>').join('')+'</select></td>'+
      '<td class="txt"><select data-bind="investimentos.'+it.id+'.origem">'+ORIGENS.map(o=>'<option value="'+o.v+'" '+(o.v===it.origem?'selected':'')+'>'+o.l+'</option>').join('')+'</select></td>'+
      '<td><input type="number" step="1" min="0" data-bind="investimentos.'+it.id+'.quantidade" value="'+it.quantidade+'"></td>'+
      '<td><input type="number" step="0.01" min="0" data-bind="investimentos.'+it.id+'.valorUnit" value="'+it.valorUnit+'"></td>'+
      '<td class="mono">'+fmtR$(total)+'</td>'+
      '<td><input type="number" step="1" min="1" data-bind="investimentos.'+it.id+'.vidaTotal" value="'+it.vidaTotal+'"></td>'+
      '<td>'+(isExist? '<input type="number" step="1" min="0" data-bind="investimentos.'+it.id+'.anosUso" value="'+it.anosUso+'">' : '<span style="color:var(--ink-faint)">0</span>')+'</td>'+
      '<td class="mono">'+fmtNum(vr,1)+'</td>'+
      '<td class="mono">'+fmtR$(dep)+'</td>'+
      '<td class="row-actions"><button class="icon-btn" data-action="del-inv" data-id="'+it.id+'" title="remover">✕</button></td>'+
      '</tr>';
  });

  html += '<tr class="total-row"><td colspan="5">Totais</td><td class="mono">'+fmtR$(totNovoProprio+totNovoFin+totExist)+'</td>'+
    '<td colspan="3"></td><td class="mono">'+fmtR$(totDeprec)+'</td><td></td></tr>';
  html += '</tbody></table></div>';

  html += '<div class="grid g4" style="margin-top:16px;">'+
    kpiMini('Novo — recursos próprios', fmtR$(totNovoProprio))+
    kpiMini('Novo — financiado', fmtR$(totNovoFin))+
    kpiMini('Patrimônio já existente', fmtR$(totExist))+
    kpiMini('Depreciação anual total', fmtR$(totDeprec))+
    '</div>';

  document.getElementById('content').innerHTML = html;
}
function kpiMini(l,v){
  return '<div class="kpi"><div class="lbl">'+l+'</div><div class="val" style="font-size:18px;">'+v+'</div></div>';
}
function esc(s){ return String(s==null?'':s).replace(/"/g,'&quot;'); }

/* ============================== PANEL: FINANCIAMENTOS ============================== */
function renderFinanc(){
  let html = '<div class="panel-head"><div><h2>Dívidas Ativas / Financiamentos</h2></div>'+
    '<button class="btn ochre small" data-action="add-fin">+ nova dívida</button></div>';

  html += '<div class="panel-note">Se algum bem já usado (ou o novo item marcado como "financiado") ainda tem parcelas a pagar — como um financiamento Pronaf — lance aqui os valores anuais. Essas parcelas <b>saem do caixa de verdade</b> e entram no Fluxo de Caixa. '+
    'Informe também o <b>% de juros da parcela</b>: a maior parte da parcela costuma ser devolução do dinheiro emprestado (amortização), mas uma parte é juros — só essa parte de juros conta como despesa no Lucro Líquido. Se não souber o percentual exato, um valor aproximado (ex.: 20–30% em linhas de crédito rural subsidiadas) já melhora bastante a precisão do resultado.</div>';

  html += '<div class="wrap-table"><table class="data"><thead><tr><th style="min-width:200px">Descrição</th><th>Saldo devedor (R$)</th><th>Juros na parcela (%)</th>'+
    YEARS.map(y=>'<th>Parcela Ano '+y+'</th>').join('')+'<th>Total</th><th></th></tr></thead><tbody>';

  if(state.financiamentos.length===0){
    html += '<tr><td colspan="10" class="empty-hint">Nenhuma dívida lançada. Se as máquinas foram compradas à vista, esta aba pode ficar vazia.</td></tr>';
  }
  let totalPorAno={1:0,2:0,3:0,4:0,5:0};
  let totalJurosPorAno={1:0,2:0,3:0,4:0,5:0};
  state.financiamentos.forEach(f=>{
    let totalF=0;
    const pj = clamp(num(f.percJuros)/100,0,1);
    YEARS.forEach(y=>{ const p=num(f.parcelas[y]); totalF+=p; totalPorAno[y]+=p; totalJurosPorAno[y]+=p*pj; });
    html += '<tr><td class="txt"><input type="text" data-bind="financiamentos.'+f.id+'.descricao" value="'+esc(f.descricao)+'"></td>'+
      '<td><input type="number" step="0.01" min="0" data-bind="financiamentos.'+f.id+'.saldoDevedor" value="'+f.saldoDevedor+'"></td>'+
      '<td><input type="number" step="1" min="0" max="100" data-bind="financiamentos.'+f.id+'.percJuros" value="'+(f.percJuros||0)+'"></td>'+
      YEARS.map(y=>'<td><input type="number" step="0.01" min="0" data-bind="financiamentos.'+f.id+'.parcelas.'+y+'" value="'+(f.parcelas[y]||0)+'"></td>').join('')+
      '<td class="mono">'+fmtR$(totalF)+'</td>'+
      '<td class="row-actions"><button class="icon-btn" data-action="del-fin" data-id="'+f.id+'">✕</button></td></tr>';
  });
  html += '<tr class="total-row"><td colspan="3">Total por ano</td>'+YEARS.map(y=>'<td class="mono">'+fmtR$(totalPorAno[y])+'</td>').join('')+'<td colspan="2"></td></tr>';
  html += '</tbody></table></div>';

  html += '<div class="grid g2" style="margin-top:16px;">'+
    kpiMini('Total de parcelas nos 5 anos', fmtR$(YEARS.reduce((a,y)=>a+totalPorAno[y],0)))+
    kpiMini('Dos quais, juros (despesa financeira)', fmtR$(YEARS.reduce((a,y)=>a+totalJurosPorAno[y],0)))+
    '</div>';

  // Verificação cruzada informativa: valor lançado como "novo — financiado" em
  // Investimentos vs. total de parcelas lançadas aqui. Ajuda a pegar esquecimento
  // de lançar parcelas de um bem financiado (ou parcelas "soltas" sem bem vinculado).
  const totNovoFin = state.investimentos.reduce((a,it)=> a + (it.origem==='novo_financiado'? itemValorTotal(it):0), 0);
  const totParcelas5anos = YEARS.reduce((a,y)=>a+totalPorAno[y],0);
  if(totNovoFin>0 || totParcelas5anos>0){
    html += '<div class="panel-note" style="margin-top:14px;">Conferência: em <b>Investimentos</b>, você marcou <b>'+fmtR$(totNovoFin)+'</b> em bens "novo — financiado". Aqui, o total de parcelas lançadas nos 5 anos é <b>'+fmtR$(totParcelas5anos)+'</b>. '+
      (totNovoFin>0 && totParcelas5anos===0 ? 'Não há parcelas lançadas para esse valor financiado — confira se não esqueceu de lançar a dívida.' :
       'Esses valores não precisam bater exatamente (parcelas incluem juros e podem cobrir dívidas antigas não ligadas a um bem novo), mas vale conferir se fazem sentido entre si.')+'</div>';
  }

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: CUSTOS ============================== */
function renderCustos(){
  let html = '<div class="panel-head"><div><h2>Custos Operacionais</h2></div>'+
    '<button class="btn ochre small" data-action="add-cst">+ novo custo</button></div>';

  html += '<div class="panel-note">Use o <b>histórico real do último ano</b> do empreendimento sempre que possível, em vez de estimar. Classifique como <b>Fixo</b> (não varia com a produção) ou <b>Variável</b> (varia com a quantidade produzida) — essa classificação é usada no cálculo do Ponto de Equilíbrio.</div>';

  html += '<div class="wrap-table"><table class="data"><thead><tr><th style="min-width:220px">Descrição</th><th>Tipo</th>'+
    YEARS.map(y=>'<th>Ano '+y+'</th>').join('')+'<th></th></tr></thead><tbody>';

  if(state.custos.length===0){ html += '<tr><td colspan="8" class="empty-hint">Nenhum custo lançado ainda.</td></tr>'; }

  let totalPorAno={1:0,2:0,3:0,4:0,5:0};
  state.custos.forEach(c=>{
    YEARS.forEach(y=> totalPorAno[y]+=num(c.valores[y]));
    html += '<tr><td class="txt"><input type="text" data-bind="custos.'+c.id+'.descricao" value="'+esc(c.descricao)+'"></td>'+
      '<td><select data-bind="custos.'+c.id+'.tipo"><option '+(c.tipo==='Fixo'?'selected':'')+'>Fixo</option><option '+(c.tipo==='Variável'?'selected':'')+'>Variável</option></select></td>'+
      YEARS.map(y=>'<td><input type="number" step="0.01" min="0" data-bind="custos.'+c.id+'.valores.'+y+'" value="'+(c.valores[y]||0)+'"></td>').join('')+
      '<td class="row-actions">'+
        '<button class="icon-btn" data-action="repeat-cst" data-id="'+c.id+'" title="repetir valor do Ano 1 para os demais">↦</button> '+
        '<button class="icon-btn" data-action="del-cst" data-id="'+c.id+'">✕</button>'+
      '</td></tr>';
  });
  html += '<tr class="total-row"><td colspan="2">Total por ano</td>'+YEARS.map(y=>'<td class="mono">'+fmtR$(totalPorAno[y])+'</td>').join('')+'<td></td></tr>';
  html += '</tbody></table></div>';

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: CAPITAL DE GIRO ============================== */
function renderGiro(){
  const {total:custoTotal} = calcCustosPorAno();
  const auto = calcCapitalGiro(custoTotal[1]);
  let html = '<div class="panel-head"><div><h2>Capital de Giro</h2></div></div>';

  if(isAndamento()){
    html += '<div class="help-callout"><b>Não aplicável — Projeto em Andamento.</b> Como a atividade já está em funcionamento, o sistema não exige capital de giro inicial no Ano 0. '+
      'Se quiser voltar a considerar esse valor, mude para "Projeto do Zero" na aba <b>01 · Dados &amp; Premissas</b>.</div>';
    document.getElementById('content').innerHTML = html;
    return;
  }

  html += '<div class="panel-note">Capital de giro é o valor necessário para manter as atividades <b>antes</b> de receber pelas primeiras vendas. Por padrão sugerimos um cálculo automático a partir dos custos operacionais do Ano 1, mas você pode informar um valor manual.</div>';

  html += '<fieldset class="block"><legend>Modo de cálculo</legend><div class="grid g2">'+
    selectFld('Como calcular', 'capitalGiro.modo', state.capitalGiro.modo, [{v:'auto',l:'Automático (meses de custo × custo mensal)'},{v:'manual',l:'Valor manual'}]);
  if(state.capitalGiro.modo==='manual'){
    html += fld('Valor manual do Capital de Giro (R$)', 'capitalGiro.valorManual', state.capitalGiro.valorManual, {type:'number',step:0.01, min:0});
  } else {
    html += '<label class="field"><span>Estimativa automática</span><input type="text" readonly value="'+fmtR$(auto)+'"></label>';
  }
  html += '</div></fieldset>';

  html += '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);">'+
    kpiMini('Custo operacional mensal (Ano 1)', fmtR$(custoTotal[1]/12))+
    kpiMini('Meses de cobertura', state.premissas.mesesGiro+' meses (ajuste em 01 · Premissas)')+
    kpiMini('Capital de giro considerado', fmtR$(state.capitalGiro.modo==='manual'?num(state.capitalGiro.valorManual):auto))+
    '</div>';

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: RECEITAS ============================== */
function renderReceitas(){
  let html = '<div class="panel-head"><div><h2>Receitas Projetadas</h2></div>'+
    '<button class="btn ochre small" data-action="add-rec">+ novo produto</button></div>';

  html += '<div class="panel-note">Separe o que é <b>vendido</b> (gera caixa) do que é <b>autoconsumo</b> (garante alimentação da família, mas não gera receita monetária) usando o % de autoconsumo. O valor do autoconsumo entra no resultado da família, mas não no fluxo de caixa.</div>';

  state.receitas.forEach(r=>{
    html += '<fieldset class="block"><legend>'+esc(r.produto||'Produto')+'</legend>';
    html += '<div class="grid g3" style="margin-bottom:10px;">'+
      fld('Produto', 'receitas.'+r.id+'.produto', r.produto)+
      fld('Unidade de comercialização', 'receitas.'+r.id+'.unidade', r.unidade)+
      fld('% de autoconsumo (não gera caixa)', 'receitas.'+r.id+'.percAutoconsumo', r.percAutoconsumo, {type:'number', step:0.5, min:0, max:100})+
      '</div>';
    html += '<div class="wrap-table"><table class="data"><thead><tr><th></th>'+YEARS.map(y=>'<th>Ano '+y+'</th>').join('')+'</tr></thead><tbody>';
    html += '<tr><td class="txt">Quantidade</td>'+YEARS.map(y=>'<td><input type="number" step="0.01" min="0" data-bind="receitas.'+r.id+'.quantidades.'+y+'" value="'+(r.quantidades[y]||0)+'"></td>').join('')+'</tr>';
    html += '<tr><td class="txt">Preço unitário (R$)</td>'+YEARS.map(y=>'<td><input type="number" step="0.01" min="0" data-bind="receitas.'+r.id+'.precos.'+y+'" value="'+(r.precos[y]||0)+'"></td>').join('')+'</tr>';
    const totRow = YEARS.map(y=> num(r.quantidades[y])*num(r.precos[y]));
    html += '<tr class="total-row"><td class="txt">Total (R$)</td>'+totRow.map(v=>'<td class="mono">'+fmtR$(v)+'</td>').join('')+'</tr>';
    html += '</tbody></table></div>';
    html += '<div style="text-align:right;margin-top:8px;"><button class="icon-btn" data-action="del-rec" data-id="'+r.id+'" title="remover produto">✕ remover produto</button></div>';
    html += '</fieldset>';
  });

  if(state.receitas.length===0){
    html += '<div class="empty-hint">Nenhum produto lançado. Clique em "+ novo produto".</div>';
  }

  // summary
  const {brutaComerc, autoconsumo} = calcReceitasPorAno();
  html += '<fieldset class="block"><legend>Resumo de receitas</legend><div class="wrap-table"><table class="data"><thead><tr><th></th>'+YEARS.map(y=>'<th>Ano '+y+'</th>').join('')+'</tr></thead><tbody>'+
    '<tr><td class="txt">Receita bruta de comercialização</td>'+YEARS.map(y=>'<td class="mono">'+fmtR$(brutaComerc[y])+'</td>').join('')+'</tr>'+
    '<tr><td class="txt">Valor do autoconsumo (informativo)</td>'+YEARS.map(y=>'<td class="mono">'+fmtR$(autoconsumo[y])+'</td>').join('')+'</tr>'+
    '</tbody></table></div></fieldset>';

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: FLUXO DE CAIXA ============================== */
function renderFluxo(){
  const scn = buildScenario();
  let html = '<div class="panel-head"><div><h2>Fluxo de Caixa</h2></div></div>';

  html += '<div class="panel-note">O Ano 0 reflete a fotografia de hoje: só sai caixa para o que é <b>novo, com recursos próprios</b>, mais o capital de giro. Bens já existentes não geram saída de caixa no Ano 0 — apenas depreciação e, se a vida útil acabar dentro do horizonte, uma reposição futura. '+
    'No último ano do período, o capital de giro imobilizado no Ano 0 volta a ficar disponível — por isso aparece como uma entrada ("recuperação do capital de giro"): ele não é uma despesa perdida, é dinheiro que continua girando no negócio.</div>';

  if(scn.andamento){
    html += '<div class="help-callout"><b>Projeto em Andamento:</b> o Ano 0 não considera novo investimento nem capital de giro inicial, pois a atividade já está funcionando.</div>';
  }

  const rows = [
    ['Receita bruta de comercialização', y=>scn.anos[y].brutaComerc, 0],
    ['(–) Impostos e taxas sobre a receita', y=>-scn.anos[y].impostos, 0],
    ['(=) Receita líquida', y=>scn.anos[y].receitaLiquida, 1],
    ['(–) Custos operacionais', y=>-scn.anos[y].custos, 0],
    ['(–) Parcelas de financiamento (principal + juros)', y=>-scn.anos[y].financ, 0],
    ['(–) Reposição de investimentos', y=>-scn.anos[y].reposicao, 0],
    ['(+) Recuperação do capital de giro', y=>scn.anos[y].recGiro, 0],
    ['(=) Fluxo de caixa líquido do ano', y=>scn.anos[y].fluxoCaixa, 1]
  ];

  html += '<div class="wrap-table"><table class="data"><thead><tr><th style="min-width:230px">Ano 0</th><th>Valor</th>'+
    YEARS.map(y=>'<th>Ano '+y+'</th>').join('')+'</tr></thead><tbody>';
  html += '<tr><td class="txt">(–) Investimento novo (recursos próprios)</td><td class="mono">'+fmtR$(-scn.novoProprioAno0)+'</td>'+YEARS.map(()=> '<td></td>').join('')+'</tr>';
  html += '<tr><td class="txt">(–) Capital de giro inicial</td><td class="mono">'+fmtR$(-scn.giroBase)+'</td>'+YEARS.map(()=> '<td></td>').join('')+'</tr>';
  html += '<tr class="total-row"><td class="txt">(=) Fluxo Ano 0</td><td class="mono">'+fmtR$(scn.fluxo0)+'</td>'+YEARS.map(()=> '<td></td>').join('')+'</tr>';
  html += '</tbody></table></div>';

  html += '<div class="wrap-table" style="margin-top:14px;"><table class="data"><thead><tr><th style="min-width:230px">Item</th>'+YEARS.map(y=>'<th>Ano '+y+'</th>').join('')+'</tr></thead><tbody>';
  rows.forEach(r=>{
    html += '<tr'+(r[2]?' class="total-row"':'')+'><td class="txt">'+r[0]+'</td>'+YEARS.map(y=>'<td class="mono">'+fmtR$(r[1](y))+'</td>').join('')+'</tr>';
  });
  let acc=scn.fluxo0;
  const accRow = YEARS.map(y=>{ acc+=scn.anos[y].fluxoCaixa; return acc; });
  html += '<tr class="total-row"><td class="txt">Saldo de caixa acumulado</td>'+accRow.map(v=>'<td class="mono">'+fmtR$(v)+'</td>').join('')+'</tr>';
  html += '</tbody></table></div>';

  document.getElementById('content').innerHTML = html;
}

/* ============================== PANEL: INDICADORES & CENÁRIOS ============================== */
function renderIndicadores(){
  const scn = buildScenario();
  const y = clamp(num(state.premissas.anoAnalise)||5,1,5);
  const pe = pontoEquilibrio(scn);

  let html = '<div class="panel-head"><div><h2>Indicadores &amp; Cenários</h2></div></div>';

  html += renderSemaforo(scn);

  html += '<div class="kpi-grid">'+
    kpi(LABELS.vplCompleto+' (ao '+fmtNum(state.premissas.tma,1)+'% a.a.)', explainVPL(scn), scn.vpl!=null && scn.vpl<0)+
    kpi(LABELS.tirCompleto, explainTIR(scn), scn.tir!=null && scn.tir < num(state.premissas.tma)/100)+
    kpi(LABELS.paybackCompleto, explainPayback(scn), scn.payback==null && scn.fluxo0<0)+
    kpi('Ponto de equilíbrio (Ano '+y+')', pe.valor!=null?fmtR$(pe.valor):'Não se aplica — receita não cobre custos variáveis', pe.valor==null)+
    '</div>';

  html += '<fieldset class="block"><legend>Ponto de equilíbrio — detalhamento (Ano '+y+')</legend><div class="grid g3">'+
    kpiMini('Custos fixos', fmtR$(pe.cf))+kpiMini('Custos variáveis', fmtR$(pe.cv))+kpiMini('Receita líquida', fmtR$(pe.receitaLiq))+
    '</div><div class="panel-note" style="margin:12px 0 0;">Este valor é o ponto de equilíbrio <b>agregado</b>, considerando o mix atual de produtos/receitas. Se você vende mais de um produto com margens muito diferentes entre si, o valor em R$ mistura as duas coisas — ele diz "quanto de receita total", não qual produto sustenta o negócio.</div></fieldset>';

  // Cenarios config
  html += '<fieldset class="block"><legend>Configurar cenários de sensibilidade</legend><div class="grid g4">'+
    fld('Otimista — receita +% ', 'cenarios.otimistaReceita', state.cenarios.otimistaReceita, {type:'number', step:1, min:0, max:100})+
    fld('Otimista — custo −%', 'cenarios.otimistaCusto', state.cenarios.otimistaCusto, {type:'number', step:1, min:0, max:100})+
    fld('Pessimista — receita −%', 'cenarios.pessimistaReceita', state.cenarios.pessimistaReceita, {type:'number', step:1, min:0, max:100})+
    fld('Pessimista — custo +%', 'cenarios.pessimistaCusto', state.cenarios.pessimistaCusto, {type:'number', step:1, min:0, max:100})+
    '</div></fieldset>';

  const scnOtim = buildScenario({receita: 1+num(state.cenarios.otimistaReceita)/100, custo: 1-num(state.cenarios.otimistaCusto)/100});
  const scnPess = buildScenario({receita: 1-num(state.cenarios.pessimistaReceita)/100, custo: 1+num(state.cenarios.pessimistaCusto)/100});

  function drow(label, get){
    return '<tr><td class="txt">'+label+'</td>'+
      '<td>'+fmtR$(get(scnPess))+'</td>'+
      '<td>'+fmtR$(get(scn))+'</td>'+
      '<td>'+fmtR$(get(scnOtim))+'</td></tr>';
  }
  const nBenef = Math.max(1,num(state.meta.beneficiarios));
  html += '<fieldset class="block"><legend>Demonstrativo de resultados por cenário — Ano '+y+'</legend>'+
    '<div class="wrap-table"><table class="data scen-table"><thead><tr><th class="txt">Medida</th><th class="pess">Pessimista</th><th>Realista</th><th class="otim">Otimista</th></tr></thead><tbody>'+
    drow('Receita bruta de comercialização', s=>s.anos[y].brutaComerc)+
    drow('Valor do autoconsumo', s=>s.anos[y].autoconsumo)+
    drow('Impostos e taxas', s=>-s.anos[y].impostos)+
    drow('Receita líquida', s=>s.anos[y].receitaLiquida)+
    drow('Custo total', s=>-s.anos[y].custos)+
    drow('Juros do financiamento', s=>-s.anos[y].juros)+
    drow('Lucro líquido', s=>s.anos[y].lucroContabil)+
    '<tr><td class="txt">Lucratividade (%)</td>'+
      '<td>'+fmtPct(scnPess.anos[y].lucroContabil/Math.max(1,(scnPess.anos[y].receitaLiquida+scnPess.anos[y].autoconsumo)))+'</td>'+
      '<td>'+fmtPct(scn.anos[y].lucroContabil/Math.max(1,(scn.anos[y].receitaLiquida+scn.anos[y].autoconsumo)))+'</td>'+
      '<td>'+fmtPct(scnOtim.anos[y].lucroContabil/Math.max(1,(scnOtim.anos[y].receitaLiquida+scnOtim.anos[y].autoconsumo)))+'</td></tr>'+
    '<tr><td class="txt">Renda mensal por beneficiário <span style="font-weight:400;color:var(--ink-faint);">(caixa + autoconsumo)</span></td>'+
      '<td>'+fmtR$(scnPess.anos[y].rendaFamiliar/12/nBenef)+'</td>'+
      '<td>'+fmtR$(scn.anos[y].rendaFamiliar/12/nBenef)+'</td>'+
      '<td>'+fmtR$(scnOtim.anos[y].rendaFamiliar/12/nBenef)+'</td></tr>'+
    '<tr class="total-row"><td class="txt">'+LABELS.vplCurto+' (VPL)</td><td>'+explainVPL(scnPess)+'</td><td>'+explainVPL(scn)+'</td><td>'+explainVPL(scnOtim)+'</td></tr>'+
    '<tr class="total-row"><td class="txt">'+LABELS.tirCurto+' (TIR)</td><td>'+explainTIR(scnPess)+'</td><td>'+explainTIR(scn)+'</td><td>'+explainTIR(scnOtim)+'</td></tr>'+
    '</tbody></table></div></fieldset>';

  document.getElementById('content').innerHTML = html;
}

/* ============================== MAIN RENDER ============================== */
function renderAll(){
  const focus = captureFocus();
  renderTabs();
  switch(activeTab){
    case 'ajuda': renderAjuda(); break;
    case 'dashboard': renderDashboard(); break;
    case 'projeto': renderProjeto(); break;
    case 'invest': renderInvest(); break;
    case 'financ': renderFinanc(); break;
    case 'custos': renderCustos(); break;
    case 'giro': renderGiro(); break;
    case 'receitas': renderReceitas(); break;
    case 'fluxo': renderFluxo(); break;
    case 'indicadores': renderIndicadores(); break;
  }
  restoreFocus(focus);
}

