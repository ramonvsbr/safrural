"use strict";
/* ============================================================
   SAF-PP · events.js
   Delegação de eventos da área de conteúdo (input/click/change) + modais próprios de confirmação e toast.
   ============================================================ */

/* ============================== EVENT DELEGATION ============================== */
function handleInput(e){
  const t = e.target;
  if(!t.dataset || !t.dataset.bind) return;
  const bind = t.dataset.bind;
  let value = t.value;
  if(t.type==='number') value = value===''? 0 : parseFloat(value);
  try{ setPath(state, bind, value); }catch(err){ console.error('bind error', bind, err); return; }
  scheduleSave();
  requestRender();
}

function handleClick(e){
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if(action==='add-inv'){
    state.investimentos.push({id:uid('inv'),categoria:CATEGORIAS[2],descricao:'',origem:'novo_proprio',quantidade:1,valorUnit:0,vidaTotal:10,anosUso:0});
  } else if(action==='del-inv'){
    state.investimentos = state.investimentos.filter(x=>x.id!==id);
  } else if(action==='add-fin'){
    state.financiamentos.push({id:uid('fin'),descricao:'',saldoDevedor:0,percJuros:25,parcelas:{1:0,2:0,3:0,4:0,5:0}});
  } else if(action==='del-fin'){
    state.financiamentos = state.financiamentos.filter(x=>x.id!==id);
  } else if(action==='add-cst'){
    state.custos.push({id:uid('cst'),descricao:'',tipo:'Variável',valores:{1:0,2:0,3:0,4:0,5:0}});
  } else if(action==='del-cst'){
    state.custos = state.custos.filter(x=>x.id!==id);
  } else if(action==='repeat-cst'){
    const c = getArrById('custos', id);
    if(c){ const v1=num(c.valores[1]); YEARS.forEach(y=> c.valores[y]=v1); }
  } else if(action==='add-rec'){
    state.receitas.push({id:uid('rec'),produto:'Novo produto',unidade:'Und.',percAutoconsumo:0,quantidades:{1:0,2:0,3:0,4:0,5:0},precos:{1:0,2:0,3:0,4:0,5:0}});
  } else if(action==='del-rec'){
    state.receitas = state.receitas.filter(x=>x.id!==id);
  } else if(action==='set-tipo-projeto'){
    state.meta.tipoProjeto = btn.dataset.val;
  } else { return; }
  scheduleSave();
  renderAll();
}

function handleChange(e){
  const t = e.target;
  if(!t.dataset || !t.dataset.bind) return;
  if(t.tagName==='SELECT'){
    handleInput(e);
    renderAll(); // selects can change layout (e.g., origem novo/existente, giro modo)
    return;
  }
  // Ao sair do campo (blur / Enter), respeita os limites min/max do input —
  // evita salvar percentuais >100%, quantidades negativas etc. Feito só no
  // "change" (não a cada tecla) para não atrapalhar a digitação.
  if(t.type==='number'){
    let value = t.value===''? 0 : parseFloat(t.value);
    if(!isFinite(value)) value = 0;
    const min = t.getAttribute('min');
    const max = t.getAttribute('max');
    if(min!==null && value < parseFloat(min)) value = parseFloat(min);
    if(max!==null && value > parseFloat(max)) value = parseFloat(max);
    try{ setPath(state, t.dataset.bind, value); }catch(err){ console.error('bind error', t.dataset.bind, err); return; }
    scheduleSave();
    renderAll();
  }
}

/* ---------- Modal de confirmação próprio (substitui window.confirm) ---------- */
function showConfirm(message, onConfirm){
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML =
    '<div class="confirm-box"><p>'+message+'</p>'+
    '<div class="confirm-actions">'+
      '<button class="btn" data-role="cancel">Cancelar</button>'+
      '<button class="btn danger" data-role="ok">Confirmar</button>'+
    '</div></div>';
  document.body.appendChild(overlay);
  function close(){ overlay.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e){ if(e.key==='Escape') close(); }
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
  overlay.querySelector('[data-role="cancel"]').addEventListener('click', close);
  overlay.querySelector('[data-role="ok"]').addEventListener('click', ()=>{ close(); onConfirm(); });
  overlay.querySelector('[data-role="ok"]').focus();
}

function showToast(msg, action){
  const t = document.createElement('div');
  t.className='toast';
  const span = document.createElement('span');
  span.textContent = msg;
  t.appendChild(span);
  let timer;
  if(action && action.label && typeof action.onClick==='function'){
    const btn = document.createElement('button');
    btn.className = 'toast-undo';
    btn.type = 'button';
    btn.textContent = action.label;
    btn.addEventListener('click', ()=>{
      clearTimeout(timer);
      action.onClick();
      t.classList.remove('show'); setTimeout(()=> t.remove(), 250);
    });
    t.appendChild(btn);
  }
  document.body.appendChild(t);
  requestAnimationFrame(()=> t.classList.add('show'));
  const duration = action? 6000 : 2200;
  timer = setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(), 250); }, duration);
}

