"use strict";
/* ============================================================
   SAF-PP · app.js
   Ponto de entrada da aplicação: liga os botões do cabeçalho (menu de ações, sample, reset, export) e inicializa o app.
   ============================================================ */

function wireTopBar(){
  document.getElementById('btnSample').addEventListener('click', ()=>{
    showConfirm('Isso vai substituir os dados atuais pelo exemplo de demonstração. Continuar?', ()=>{
      const previousState = JSON.parse(JSON.stringify(state));
      state = defaultState();
      scheduleSave();
      renderAll();
      showToast('Exemplo de demonstração carregado.', {
        label:'Desfazer',
        onClick:()=>{ state = previousState; scheduleSave(); renderAll(); showToast('Ação desfeita — dados anteriores restaurados.'); }
      });
    });
  });
  document.getElementById('btnReset').addEventListener('click', ()=>{
    showConfirm('Isso vai apagar todos os dados preenchidos. Deseja continuar?', ()=>{
      const previousState = JSON.parse(JSON.stringify(state));
      state = defaultState();
      state.investimentos=[]; state.financiamentos=[]; state.custos=[]; state.receitas=[];
      state.meta = {produtor:'',local:'',atividade:'',beneficiarios:1,data:new Date().toISOString().slice(0,10),tipoProjeto:'zero'};
      scheduleSave();
      renderAll();
      showToast('Todos os dados foram apagados.', {
        label:'Desfazer',
        onClick:()=>{ state = previousState; scheduleSave(); renderAll(); showToast('Ação desfeita — dados anteriores restaurados.'); }
      });
    });
  });
  document.getElementById('btnExportPdf').addEventListener('click', exportPDF);
  document.getElementById('btnExportJson').addEventListener('click', exportJSON);
  document.getElementById('btnImportJson').addEventListener('click', ()=>{
    document.getElementById('fileImportJson').click();
  });
  document.getElementById('fileImportJson').addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois
    if(!file) return;
    importJSONFile(file);
  });

  /* menu de ações do cabeçalho (colapsado em telas pequenas) */
  const menuToggle = document.getElementById('menuToggle');
  const actionsPanel = document.getElementById('mastheadActions');
  const actionsBackdrop = document.getElementById('actionsBackdrop');
  function closeActionsMenu(){
    actionsPanel.classList.remove('open');
    actionsBackdrop.classList.remove('open');
    menuToggle.setAttribute('aria-expanded','false');
  }
  function openActionsMenu(){
    actionsPanel.classList.add('open');
    actionsBackdrop.classList.add('open');
    menuToggle.setAttribute('aria-expanded','true');
  }
  menuToggle.addEventListener('click', ()=>{
    if(actionsPanel.classList.contains('open')) closeActionsMenu();
    else openActionsMenu();
  });
  actionsBackdrop.addEventListener('click', closeActionsMenu);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeActionsMenu(); });
  actionsPanel.addEventListener('click', (e)=>{
    if(e.target.closest('.btn')) closeActionsMenu();
  });
  window.addEventListener('resize', ()=>{ if(window.innerWidth>860) closeActionsMenu(); });

  /* sombra no cabeçalho fixo ao rolar a página + altura real p/ posicionar as abas */
  const masthead = document.getElementById('masthead');
  function syncHeaderHeight(){
    document.documentElement.style.setProperty('--header-h', masthead.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('scroll', ()=>{
    masthead.classList.toggle('is-stuck', window.scrollY>4);
  }, {passive:true});
}


async function init(){
  wireTopBar();
  document.getElementById('content').addEventListener('input', handleInput);
  document.getElementById('content').addEventListener('change', handleChange);
  document.getElementById('content').addEventListener('click', handleClick);
  await loadState();
  renderAll();
}
init();
