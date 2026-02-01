// equipeInterna.js

/**
 * Coleta os dados da equipe interna (vendedor e operador) do formulário.
 * Mostra os dados no console como confirmação visual.
 */

function capturarEquipeInterna() {
  const vendedorEl = document.getElementById("selectVendedor");
  const operadorEl = document.getElementById("operadorInterno");

  const vendedor = vendedorEl?.value || vendedorEl?.selectedOptions?.[0]?.textContent || "-";
  const operador = operadorEl?.value || operadorEl?.selectedOptions?.[0]?.textContent || "-";

  const dadosEquipe = {
    vendedor,
    operador
  };

  console.table(dadosEquipe);
  console.log("%c✅ Dados da equipe interna capturados com sucesso.", "color: green; font-weight: bold;");

  return dadosEquipe;
}



// ✅ Lista fixa (sem backend) - usada como base/fallback
   // ✅ Lista fixa (fallback na 2ª tentativa)
const VENDEDORES_FIXOS_FALLBACK = {
  "pagina": 1,
  "total_de_paginas": 1,
  "registros": 12,
  "total_de_registros": 12,
  "cadastro": [
    {"codInt":"","codigo":2452905334,"comissao":1,"email":"joaomartins@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"JOAO CLEBER MARTINS","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905376,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"Paulo Sergio Machado da Silva","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905381,"comissao":0,"email":"marilena.ulhoa@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"MARILENA DE ALMEIDA ULHOA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905445,"comissao":1,"email":"rafael.angelo@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"RAFAEL ANGELO ARAUJO DA SILVA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905491,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"DOUGLAS VITOR DA SILVA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905509,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"GABRIEL JUNIOR DO COUTO NEPOMUCENO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905682,"comissao":0,"email":"felipe.ulhoa@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"FELIPE ULHOA FERREIRA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452911859,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"MAURO LUCIO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452927579,"comissao":0,"email":"projetos@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"S","nome":"ANA FLAVIA RODRIGUES PRATES","visualiza_pedido":"N"},
    {"codInt":"","codigo":2618640819,"comissao":0,"email":"lais.rabelo@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"S","nome":"LAIS MAGALHÃES RABELO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2698639092,"comissao":0,"email":"servidor@ferreiraulhoa.com.br","fatura_pedido":"S","inativo":"S","nome":"VANESSA ULHOA","visualiza_pedido":"N"},
   
  ]
};
function normalizarNome(nome) {
  return String(nome || "").trim().toUpperCase();
}

function preencherSelectVendedores(select, lista) {
  select.innerHTML = '<option value="">Selecione</option>';

  const set = new Set();
  (lista || []).forEach(v => {
    const nome = normalizarNome(v?.cNome);
    if (!nome || set.has(nome)) return;
    set.add(nome);
    select.appendChild(new Option(nome, nome));
  });

  console.log(
    `%c✅ ${set.size} vendedores carregados no select.`,
    "color: green; font-weight: bold;"
  );
}

function garantirOpcaoNoSelect(select, nome) {
  const alvo = normalizarNome(nome);
  if (!alvo) return false;

  const opts = Array.from(select.options || []);
  const existe = opts.find(o => normalizarNome(o.value) === alvo || normalizarNome(o.text) === alvo);

  if (existe) {
    select.value = existe.value;
    return true;
  }

  // ✅ Se não achou, CRIA a opção com o nome recebido e seleciona
  const opt = new Option(alvo, alvo);
  select.appendChild(opt);
  select.value = alvo;
  return true;
}

/**
 * ✅ Carrega vendedores no select. Se der qualquer problema, usa VENDEDORES_FIXOS.
 * - Sempre tenta preencher o vendedor do "dados.vendedorResponsavel" (se você passar).
 * - Se não encontrar, cria a opção e seleciona.
 * - Se o campo ficar vazio, tenta novamente algumas vezes.
 * - Quando conseguir preencher, chama ocultarCarregando().
 */


// Exemplo de uso ao clicar em salvar (mantive como você tinha)
const botaoSalvar = document.getElementById("save-proposal");
if (botaoSalvar) {
  botaoSalvar.addEventListener("click", capturarEquipeInterna);
} else {
  console.warn("⚠️ Botão de salvar proposta não encontrado para vincular captura da equipe interna.");
}
