// prazosCondicoes.js — lê textos de window.CFG (configuracoes.js) com fallback

function _textoCondicao(key) {
  return window.CFG?.condicoesGerais?.find(c => c.key === key)?.texto || null;
}

function _preencherCondicoesGerais(key) {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) { console.warn("⚠️ Campo 'condicoesGerais' não encontrado."); return; }
  const texto = _textoCondicao(key);
  if (texto) textarea.value = texto;
}

function preencherCondicoesComInstalacao()         { _preencherCondicoesGerais("comInstalacao"); }
function preencherCondicoesSemInstalacao()         { _preencherCondicoesGerais("semInstalacao"); }
function preencherCondicoesSemTampo()              { _preencherCondicoesGerais("semTampo");      }
function preencherCondicoesGeraisComDiagramacao()  {
  _preencherCondicoesGerais("diagramacao");
  const preview = document.getElementById("condicoesPreview");
  if (preview) {
    const texto = _textoCondicao("diagramacao") || "";
    preview.style.whiteSpace = "pre-wrap";
    preview.style.fontFamily = "monospace";
    preview.textContent = texto;
  }
}

function preencherPrazosPadrao() {
  const textarea = document.getElementById("prazosArea");
  if (!textarea) { console.warn("⚠️ Campo 'prazosArea' não encontrado."); return; }
  const texto = window.CFG?.prazosAreaPadrao;
  if (texto) textarea.value = texto;
}

document.addEventListener("DOMContentLoaded", preencherPrazosPadrao);
