"use strict";
/* ============================================================
   SAF-PP · utils.js
   Funções utilitárias puras: formatação de números/moeda e helpers genéricos.
   ============================================================ */

/* ============================== HELPERS ============================== */
function fmtR$(n){
  if(!isFinite(n)) return "—";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
}
function fmtR$2(n){
  if(!isFinite(n)) return "—";
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
}
function fmtPct(n,dec){
  if(!isFinite(n)) return "—";
  return (n*100).toLocaleString('pt-BR',{maximumFractionDigits:dec==null?1:dec})+"%";
}
function fmtNum(n,dec){
  if(!isFinite(n)) return "—";
  return n.toLocaleString('pt-BR',{maximumFractionDigits:dec==null?2:dec});
}
function num(v){ const n=parseFloat(v); return isFinite(n)?n:0; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function findById(arr,id){ return arr.find(x=>x.id===id); }

