"use strict";
/* ============================================================
   SAF-PP · data-io.js
   Exportação e importação dos dados brutos em .json (backup / migração entre dispositivos).
   ============================================================ */

/* ---------- Exportar / Importar dados brutos (.json) ----------
   Complementa o Export PDF: o PDF é só um retrato para leitura/impressão,
   sem dados estruturados. O JSON permite migrar de dispositivo/navegador,
   fazer backup, ou continuar preenchendo depois em outro computador —
   já que os dados hoje só ficam salvos localmente neste dispositivo. */
function exportJSON(){
  try{
    const payload = JSON.stringify({ _safpp: true, versao: 1, exportadoEm: new Date().toISOString(), state: state }, null, 2);
    const blob = new Blob([payload], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nome = 'saf-pp-dados-'+(state.meta.produtor||'projeto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'.json';
    a.href = url; a.download = nome || 'saf-pp-dados.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
    showToast('Dados exportados em .json — guarde este arquivo para importar depois ou em outro dispositivo.');
  }catch(e){
    console.error('Falha ao exportar JSON', e);
    showToast('Não foi possível exportar os dados.');
  }
}
function importJSONFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    let parsed;
    try{ parsed = JSON.parse(reader.result); }
    catch(e){ showToast('Arquivo inválido — não é um .json legível.'); return; }
    // aceita tanto o formato exportado por esta ferramenta ({_safpp:true, state:{...}})
    // quanto um objeto de estado "cru", para maior tolerância
    const incoming = (parsed && parsed._safpp && parsed.state) ? parsed.state : parsed;
    const chavesEsperadas = ['meta','premissas','investimentos','financiamentos','custos','receitas'];
    const pareceValido = incoming && typeof incoming==='object' && chavesEsperadas.every(k=> k in incoming);
    if(!pareceValido){
      showToast('Este arquivo não parece ser um export de dados do SAF-PP.');
      return;
    }
    showConfirm('Isso vai substituir os dados atuais pelos dados do arquivo importado. Continuar?', ()=>{
      const previousState = JSON.parse(JSON.stringify(state));
      state = incoming;
      uidN = 9999; // mantém contador de ids seguro após importar
      scheduleSave();
      renderAll();
      showToast('Dados importados com sucesso.', {
        label:'Desfazer',
        onClick:()=>{ state = previousState; scheduleSave(); renderAll(); showToast('Ação desfeita — dados anteriores restaurados.'); }
      });
    });
  };
  reader.onerror = ()=> showToast('Não foi possível ler o arquivo selecionado.');
  reader.readAsText(file, 'utf-8');
}

