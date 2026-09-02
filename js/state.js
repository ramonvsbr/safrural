"use strict";
/* ============================================================
   SAF-PP · state.js
   Modelo de dados padrão (defaultState) + persistência (Claude Storage / localStorage).
   ============================================================ */

/* ============================== STATE ============================== */
let uidN = 1;
function uid(p){ return p + (uidN++); }

const YEARS = [1,2,3,4,5];

function defaultState(){
  uidN = 1;
  return {
    meta:{
      produtor:"Produtor(a) / Associação Rural",
      local:"Sertão de Pernambuco",
      atividade:"Ovinocultura (Ovinos)",
      beneficiarios:1,
      data: new Date().toISOString().slice(0,10),
      tipoProjeto:"zero"
    },
    premissas:{
      impostoReceita:3,
      tma:10,
      anoAnalise:5,
      mesesGiro:3,
      folgaTirMinima:3,
      paybackAlerta:4
    },
    investimentos:[
      {id:uid('inv'),categoria:"Obras e Instalações",descricao:"Galpão e baias",origem:"existente",quantidade:1,valorUnit:50000,vidaTotal:10,anosUso:4},
      {id:uid('inv'),categoria:"Obras e Instalações",descricao:"Piquetes",origem:"existente",quantidade:1,valorUnit:15000,vidaTotal:15,anosUso:4},
      {id:uid('inv'),categoria:"Equipamentos e Máquinas",descricao:"Triturador de palma",origem:"existente",quantidade:1,valorUnit:5770,vidaTotal:8,anosUso:4},
      {id:uid('inv'),categoria:"Equipamentos e Máquinas",descricao:"Misturador de ração",origem:"existente",quantidade:1,valorUnit:9970,vidaTotal:8,anosUso:3},
      {id:uid('inv'),categoria:"Equipamentos e Máquinas",descricao:"Cerca elétrica (a adquirir)",origem:"novo_proprio",quantidade:1,valorUnit:3200,vidaTotal:10,anosUso:0}
    ],
    financiamentos:[
      {id:uid('fin'),descricao:"Pronaf — parcelas em andamento (trator)",saldoDevedor:8000,percJuros:25,parcelas:{1:2000,2:2000,3:2000,4:2000,5:0}}
    ],
    custos:[
      {id:uid('cst'),descricao:"Ração / suplementação (palma, milho)",tipo:"Variável",valores:{1:9000,2:9200,3:9400,4:9600,5:9800}},
      {id:uid('cst'),descricao:"Sanidade animal (vacinas, vermífugos)",tipo:"Variável",valores:{1:1800,2:1800,3:1900,4:1900,5:2000}},
      {id:uid('cst'),descricao:"Mão de obra contratada",tipo:"Fixo",valores:{1:6000,2:6000,3:6300,4:6300,5:6600}},
      {id:uid('cst'),descricao:"Energia e combustível",tipo:"Fixo",valores:{1:2400,2:2400,3:2500,4:2500,5:2600}}
    ],
    capitalGiro:{modo:"auto",valorManual:0},
    receitas:[
      {id:uid('rec'),produto:"Animal vivo (venda)",unidade:"Und.",percAutoconsumo:0,
        quantidades:{1:60,2:60,3:62,4:62,5:65}, precos:{1:500,2:510,3:510,4:520,5:520}},
      {id:uid('rec'),produto:"Animais para genética",unidade:"Und.",percAutoconsumo:0,
        quantidades:{1:20,2:20,3:20,4:20,5:22}, precos:{1:5000,2:5000,3:5100,4:5100,5:5200}}
    ],
    cenarios:{ otimistaReceita:10, otimistaCusto:10, pessimistaReceita:10, pessimistaCusto:10 }
  };
}

let state = defaultState();
let activeTab = "dashboard";

/* ============================== STORAGE ==============================
   Camada dupla: tenta primeiro o armazenamento do ambiente Claude (window.storage),
   e se não existir (ex: publicado no Cloudflare Pages, ou qualquer site fora do Claude)
   usa localStorage do navegador. Assim o mesmo arquivo funciona nos dois lugares. */
const STORE_KEY = "safpp:v1:data";
let saveTimer = null;

function hasClaudeStorage(){
  return typeof window!=='undefined' && window.storage && typeof window.storage.set==='function';
}

async function storageSet(key, value){
  if(hasClaudeStorage()){
    try{
      const res = await window.storage.set(key, value, false);
      if(res) return true;
    }catch(e){ /* cai para localStorage abaixo */ }
  }
  try{ localStorage.setItem(key, value); return true; }
  catch(e){ console.error('Não foi possível salvar (localStorage indisponível)', e); return false; }
}

async function storageGet(key){
  if(hasClaudeStorage()){
    try{
      const res = await window.storage.get(key, false);
      if(res && res.value) return res.value;
    }catch(e){ /* chave não existe nesse modo, tenta localStorage */ }
  }
  try{ return localStorage.getItem(key); }
  catch(e){ return null; }
}

function markSaving(){ const d=document.getElementById('saveDot'); const l=document.getElementById('saveLabel'); if(d){d.classList.add('busy'); l.textContent='salvando...';} }
function markSaved(ok){ const d=document.getElementById('saveDot'); const l=document.getElementById('saveLabel');
  if(d){ d.classList.remove('busy'); l.textContent= ok? 'dados salvos neste dispositivo' : 'não foi possível salvar — dados só nesta sessão'; }
}
function scheduleSave(){
  markSaving();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    const ok = await storageSet(STORE_KEY, JSON.stringify(state));
    markSaved(ok);
  }, 500);
}
async function loadState(){
  try{
    const raw = await storageGet(STORE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = parsed;
      uidN = 9999; // mantém contador de ids seguro
      markSaved(true);
      return true;
    }
  }catch(e){ console.error('Falha ao carregar dados salvos', e); }
  markSaved(false);
  return false;
}

