function vvDataPartesSemTimezone(valor) {
  if (!valor) return null;

  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return {
      ano: String(valor.getFullYear()),
      mes: String(valor.getMonth() + 1).padStart(2, "0"),
      dia: String(valor.getDate()).padStart(2, "0")
    };
  }

  const texto = String(valor).trim();
  if (!texto) return null;

  let match = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (match) {
    return { ano: match[1], mes: match[2], dia: match[3] };
  }

  match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return { ano: match[3], mes: match[2], dia: match[1] };
  }

  match = texto.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (match) {
    return { ano: match[1], mes: match[2], dia: match[3] };
  }

  const data = new Date(texto);
  if (isNaN(data.getTime())) return null;

  return {
    ano: String(data.getFullYear()),
    mes: String(data.getMonth() + 1).padStart(2, "0"),
    dia: String(data.getDate()).padStart(2, "0")
  };
}

function vvDataISO(valor) {
  const partes = vvDataPartesSemTimezone(valor);
  if (!partes) return "";
  return `${partes.ano}-${partes.mes}-${partes.dia}`;
}

function vvSomarMesesDataISO(valor, meses = 0) {
  const partes = vvDataPartesSemTimezone(valor);
  if (!partes) return "";

  const ano = Number(partes.ano);
  const mesIndex = Number(partes.mes) - 1;
  const dia = Number(partes.dia);
  const data = new Date(ano, mesIndex + Number(meses || 0), 1);
  const ultimoDiaMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();

  data.setDate(Math.min(dia, ultimoDiaMes));

  const anoFinal = String(data.getFullYear());
  const mesFinal = String(data.getMonth() + 1).padStart(2, "0");
  const diaFinal = String(data.getDate()).padStart(2, "0");
  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}

function vvDataPrevisaoServicoParaOmie(valor) {
  if (!valor) return "";

  // A OS da Omie gera o vencimento um ciclo mensal apos a previsao.
  // Enviar um mes antes faz o vencimento bater com a data escolhida na parcela.
  if (window.VV_SERVICOS_COMPENSAR_MES_OMIE === false) {
    return vvDataISO(valor);
  }

  return vvSomarMesesDataISO(valor, -1);
}

function formatarDataBR(valor) {
  const partes = vvDataPartesSemTimezone(valor);
  if (!partes) return "";
  return `${partes.dia}/${partes.mes}/${partes.ano}`;
}

function mostrarPopupPendencias(pendencias) {
  const lista = document.getElementById("listaPendencias");
  lista.innerHTML = "";
  pendencias.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    lista.appendChild(li);
  });
  document.getElementById("popupPendencias").style.display = "block";
  document.getElementById("overlayPopup").style.display = "block";
}

function fecharPopupPendencias() {
  document.getElementById("popupPendencias").style.display = "none";
  document.getElementById("overlayPopup").style.display = "none";
}

function mostrarPopupCustomizado(titulo, mensagem, tipo = "info") {
  ocultarCarregando();
  const popupExistente = document.getElementById("popup-status-omie");
  if (popupExistente) popupExistente.remove();

  const overlay = document.createElement("div");
  overlay.id = "popup-status-omie";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 9999;

  const box = document.createElement("div");
  box.style.backgroundColor = "#fff";
  box.style.borderRadius = "8px";
  box.style.padding = "24px";
  box.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.2)";
  box.style.maxWidth = "500px";
  box.style.width = "90%";
  box.style.textAlign = "center";
  box.style.fontFamily = "Arial, sans-serif";

  const tituloEl = document.createElement("h2");
  tituloEl.textContent = titulo;
  tituloEl.style.color = tipo === "success" ? "green" : tipo === "error" ? "red" : "#333";
  tituloEl.style.marginBottom = "12px";

  const mensagemEl = document.createElement("p");
  mensagemEl.textContent = mensagem;
  mensagemEl.style.marginBottom = "20px";

  const botao = document.createElement("button");
  botao.textContent = "Fechar";
  botao.style.padding = "8px 20px";
  botao.style.border = "none";
  botao.style.backgroundColor = "#007BFF";
  botao.style.color = "#fff";
  botao.style.borderRadius = "4px";
  botao.style.cursor = "pointer";
  botao.addEventListener("click", () => overlay.remove());

  box.appendChild(tituloEl);
  box.appendChild(mensagemEl);
  box.appendChild(botao);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function gerarNumeroPedidoUnico() {
  const agora = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const ano = agora.getFullYear().toString().slice(-2);
  const mes = pad(agora.getMonth() + 1);
  const dia = pad(agora.getDate());
  const hora = pad(agora.getHours());
  const minuto = pad(agora.getMinutes());
  const segundo = pad(agora.getSeconds());
  const milesimo = String(agora.getMilliseconds()).padStart(3, "0");
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${ano}${mes}${dia}${hora}${minuto}${segundo}${milesimo}${aleatorio}`;
}

function gerarCodigoIntegracaoOmie(prefixo = "OMIE") {
  const agora = new Date();
  const pad = n => String(n).padStart(2, "0");
  const timestamp = [
    agora.getFullYear(),
    pad(agora.getMonth() + 1),
    pad(agora.getDate()),
    pad(agora.getHours()),
    pad(agora.getMinutes()),
    pad(agora.getSeconds()),
    String(agora.getMilliseconds()).padStart(3, "0")
  ].join("");
  const aleatorio = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefixo}-${timestamp}-${aleatorio}`;
}




// ============================================================================
//  BLOCO ÚNICO — ENVIO PARA OMIE (COMPLETO E AJUSTADO)
//  - Helpers (formatos, BRL, data, UI stubs)
//  - Coleta (1º item por grupo)
//  - Popup de seleção (rateia Serviços %/R$)
//  - Geração do payload (mantendo estrutura antiga)
//  - Envio (atualizarNaOmie)
//  - Stubs defensivos p/ funções externas ausentes
//  - Tudo exposto no window.*
// ============================================================================

/* =========================
   0) SHIMS / HELPERS GLOBAIS
   ========================= */
(function ensureHelpers(){
  // Visual (stubs para não quebrar se não existirem)
  window.mostrarCarregando      ||= function(){ /* opcional: mostrar overlay */ };
  window.ocultarCarregando      ||= function(){ /* opcional: esconder overlay */ };
  window.mostrarPopupCustomizado ||= function(titulo, msg, tipo){
    // substitua pela sua lib de popup se quiser
    alert((tipo ? `[${tipo.toUpperCase()}] ` : "") + titulo + "\n" + (msg || ""));
  };
  window.mostrarPopupPendencias ||= function(pendencias){
    alert("Pendências:\n- " + pendencias.join("\n- "));
  };

  // Formatação de datas
  window.formatarDataBR ||= function(iso){
    if (!iso) return "";
    const v = String(iso).trim();
    // ISO puro YYYY-MM-DD: split direto, sem new Date() para evitar fuso
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split("-");
      return `${d}/${m}/${y}`;
    }
    // datetime ISO: YYYY-MM-DDTHH:mm:ss
    const isoMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    // fallback com UTC
    const d = new Date(v);
    if (isNaN(d)) return "";
    const dd = String(d.getUTCDate()).padStart(2,"0");
    const mm = String(d.getUTCMonth()+1).padStart(2,"0");
    return `${dd}/${mm}/${d.getUTCFullYear()}`;
  };

  // Números / dinheiro
  window.vv_round2 ||= (n) => Math.round((Number(n)||0) * 100) / 100;

  window.vv_parseBRL ||= function(str){
    if (str == null) return 0;
    let s = String(str).trim();
    if (!s) return 0;
    s = s.replace(/[^\d.,-]/g, '');
    const lastComma = s.lastIndexOf(',');
    const lastDot   = s.lastIndexOf('.');
    const lastSep   = Math.max(lastComma, lastDot);
    if (lastSep >= 0){
      const intPart  = s.slice(0, lastSep).replace(/[^\d-]/g, '');
      const fracPart = s.slice(lastSep + 1).replace(/\D/g, '');
      const normalized = intPart + '.' + fracPart;
      const n = parseFloat(normalized);
      return isNaN(n) ? 0 : n;
    }
    const only = s.replace(/[^\d-]/g,'');
    return parseFloat(only) || 0;
  };

  window.vv_fmtBRL ||= function(n){
    return (Number(n)||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  };

  // Número de pedido (fallback)
  window.gerarNumeroPedidoUnico ||= function(){ return 'PED-' + Date.now(); };

  // Ambientes marcados (fallback)
  window.lerAmbientesMarcados ||= function(){
  return Array.from(document.querySelectorAll(".ambiente-toggle:checked"))
    .map(cb => {
      const label = cb.closest(".form-check")?.querySelector("label")?.textContent || "";
      const m = label.match(/"([^"]+)"/);
      return m ? m[1].trim() : null;
    })
    .filter(Boolean);
};
})();

/* =======================================
   1) CSS do MODAL (injeção, uma única vez)
   ======================================= */
(function ensureModalStyles(){
  if (document.getElementById('selecao-omie-styles')) return;
  const style = document.createElement('style');
  style.id = 'selecao-omie-styles';
  style.textContent = `
  .vv-modal-backdrop{
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display:flex; align-items:center; justify-content:center;
    z-index: 9999;
  }
  .vv-modal{
    width: min(1500px);
    background: #fff; border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,.22);
    overflow: hidden; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
  }
  .vv-modal header{
    padding: 16px 20px; border-bottom: 1px solid #eee; background: #f8fafc;
    display:flex; align-items:center; gap: 8px;
  }
  .vv-modal header h3{ margin:0; font-size: 18px; font-weight: 600; }
  .vv-modal .vv-body{ padding: 16px 20px; max-height: 60vh; overflow:auto; }
  .vv-help{ color:#475569; font-size:14px; margin-bottom: 8px; }
  .vv-table{ width:100%; border-collapse: collapse; }
  .vv-table th, .vv-table td{ padding:10px; border-bottom:1px solid #eee; vertical-align: middle; }
  .vv-table th{ text-align:left; font-size:12px; letter-spacing:.02em; color:#64748b; font-weight:600; background:#f8fafc; position: sticky; top: 0; }
  .vv-table td small{ color:#64748b; }
  .vv-right{ text-align:right; }
  .vv-mono{ font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
  .vv-footer{ padding: 14px 20px; border-top: 1px solid #eee; display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fafafa;}
  .vv-footer .totais{ font-size: 14px; color:#334155;}
  .vv-btn{
    appearance:none; border:1px solid #e2e8f0; background:#fff; padding:10px 14px; border-radius:10px; cursor:pointer;
    font-weight:600;
  }
  .vv-btn:hover{ background:#f8fafc; }
  .vv-btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
  .vv-btn.primary:disabled{ opacity:.6; cursor:not-allowed; }
  .vv-transfer-grid{
    display:grid;
    gap:12px;
    grid-template-columns:repeat(auto-fit,minmax(380px,1fr));
    align-items:start;
  }
  .vv-transfer-panel{
    display:grid;
    gap:12px;
    border:1px solid #e2e8f0;
    border-radius:14px;
    padding:14px;
    background:#fff;
    min-height:320px;
  }
  .vv-transfer-summary{
    display:grid;
    gap:8px;
    grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
    padding:12px;
    border:1px solid #e2e8f0;
    border-radius:12px;
    background:#f8fafc;
  }
  .vv-transfer-list{
    min-height:180px;
    display:grid;
    gap:10px;
    padding:10px;
    border:2px dashed #cbd5e1;
    border-radius:12px;
    background:#f8fbff;
    transition:border-color .15s ease, background .15s ease;
  }
  .vv-transfer-list.is-over{
    border-color:#2563eb;
    background:#eff6ff;
  }
  .vv-transfer-empty{
    margin:0;
    color:#64748b;
    font-size:13px;
    text-align:center;
    padding:12px 8px;
  }
  .vv-parcela-card{
    border:1px solid #e2e8f0;
    border-radius:12px;
    padding:12px;
    background:#fff;
    box-shadow:0 2px 8px rgba(15,23,42,.05);
  }
  .vv-parcela-card.is-dragging{
    opacity:.6;
  }
  .vv-parcela-card.vv-ignorada{
    opacity:.55;
    background:#fafafa;
    border-color:#e2e8f0;
    border-style:dashed;
  }
  .vv-parcela-card.vv-ignorada .row{
    pointer-events:none;
    user-select:none;
  }
  .vv-ignorar-label{
    display:inline-flex;
    align-items:center;
    gap:6px;
    font-size:12px;
    font-weight:600;
    color:#b42318;
    cursor:pointer;
    user-select:none;
    padding:2px 8px;
    border:1px solid #f5b5b5;
    border-radius:6px;
    background:#fff5f5;
    transition:background .12s;
  }
  .vv-ignorar-label:has(input:checked){
    background:#fee2e2;
    color:#7f1d1d;
  }
  .vv-ignorar-label input{
    margin:0;
    cursor:pointer;
  }
  .vv-parcela-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    margin-bottom:8px;
  }
  .vv-drag-handle{
    display:inline-flex;
    align-items:center;
    gap:6px;
    color:#475569;
    font-size:12px;
    font-weight:600;
    cursor:grab;
    user-select:none;
  }
  .vv-transfer-actions{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
  }
  .vv-btn.danger{
    color:#b42318;
    border-color:#f5b5b5;
    background:#fff5f5;
  }
  @media (max-width: 900px){
    .vv-modal{
      width:min(96vw, 1500px);
    }
    .vv-footer{
      flex-direction:column;
      align-items:stretch;
    }
  }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   2) COLETAR ITENS (1º produto por grupo + total por grupo)
   ========================================================= */
function coletarItensPorGrupoParaOmie(ambientesMarcados = []) {
  const itens = [];
  const blocos = document.querySelectorAll("[id^='bloco-']");

  const ambientesMarcadosNormalizados = Array.isArray(ambientesMarcados)
    ? ambientesMarcados.map(a => normalizarAmbienteOmie(a)).filter(Boolean)
    : [];

  console.log("✅ Ambientes marcados (originais):", ambientesMarcados);
  console.log("✅ Ambientes marcados (normalizados):", ambientesMarcadosNormalizados);

  blocos.forEach((bloco) => {
    const grupoId = bloco.id || "(sem-id)";
    const inputAmb = bloco.querySelector("input[placeholder='Ambiente'][data-id-grupo]");
    const nomeAmbiente = (inputAmb?.value || inputAmb?.getAttribute("value") || "").trim() || "Ambiente não identificado";
    const nomeAmbienteNormalizado = normalizarAmbienteOmie(nomeAmbiente);

    console.log("➡️ Bloco:", grupoId, "| Ambiente bruto:", nomeAmbiente, "| Ambiente normalizado:", nomeAmbienteNormalizado);

    if (ambientesMarcadosNormalizados.length > 0) {
      if (!ambientesMarcadosNormalizados.includes(nomeAmbienteNormalizado)) {
        console.log("⛔ Bloco ignorado por ambiente não marcado:", grupoId, nomeAmbiente);
        return;
      }
    }

    const tabela =
      bloco.querySelector("table") ||
      bloco.querySelector(".tabela-grupo table") ||
      bloco.querySelector(".table");

    if (!tabela) {
      console.log("⛔ Bloco sem tabela:", grupoId);
      return;
    }

    const linhas = tabela.querySelectorAll("tbody tr");
    if (!linhas || !linhas.length) {
      console.log("⛔ Bloco sem linhas:", grupoId);
      return;
    }

    let valorTotalGrupo = 0;
    const totalGrupoEl = tabela.querySelector("tfoot tr td:last-child strong");

    if (totalGrupoEl && totalGrupoEl.textContent) {
      valorTotalGrupo = vv_parseBRL(totalGrupoEl.textContent);
    } else {
      const byDataTotal = tabela.querySelector("[data-total-grupo]")?.textContent;
      const byClassTotal = tabela.querySelector(".total-grupo, .totalGrupo, .valor-total-grupo")?.textContent;
      const textoTotal = byDataTotal || byClassTotal || "0";
      valorTotalGrupo = vv_parseBRL(textoTotal);
    }

    const primeiraLinha = linhas[0];
    const td2 = primeiraLinha.querySelector("td:nth-child(2)");
    const td5 = primeiraLinha.querySelector("td:nth-child(5)");

    const descricao =
      (td2?.textContent || td2?.querySelector("input,textarea")?.value || "").trim() ||
      (primeiraLinha.querySelector(".descricao, .nome, .produto-descricao")?.textContent || "").trim() ||
      "Item sem descrição";

    const codigo =
      (td5?.textContent || td5?.querySelector("input")?.value || "").trim() ||
      (primeiraLinha.querySelector(".codigo, .sku, .produto-codigo")?.textContent || "").trim() ||
      "";

    const key = `${grupoId}::${codigo || descricao}`;

    itens.push({
      key,
      grupoId,
      ambiente: nomeAmbiente,
      codigo,
      descricao,
      valorTotalGrupo: Number(valorTotalGrupo) || 0,
    });

    console.log("✅ Item elegível adicionado:", {
      grupoId,
      ambiente: nomeAmbiente,
      codigo,
      descricao,
      valorTotalGrupo
    });
  });

  console.log("📦 Itens coletados para Omie:", itens);
  return itens;
}

/* ============================================
   3) POPUP DE SELEÇÃO + RATEIO DE SERVIÇOS
   ============================================ */
/* =========================================================
   1) COMISSÕES → OMIE (função global usada pelo popup)
   ---------------------------------------------------------
   - Mantém a assinatura: window.enviarComissoes(payload)
   - Envia arquiteto e vendedor em paralelo para sua rota
    https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com/api/api/omie/comissao
   - Dispara eventos:
       vv:comissoes:prontas    (antes do POST)
       vv:comissoes:enviadas   (após POST, com resultados)
   ========================================================= */


(function () {
  if (window.enviarComissoes) return; // evita redefinir

  const API_URL = "https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com/api/omie/comissao";

  // Utilitário: normaliza para YYYY-MM-DD (aceita Date, string ou vazio)
  const toISODate = (d) => {
    if (!d) return "";
    try {
      return vvDataISO(d);
    } catch { return ""; }
  };

  // Toast simples
  function toast(msg, ok = true) {
    try {
      const id = "vv-comm-toast";
      let t = document.getElementById(id);
      if (!t) {
        t = document.createElement("div");
        t.id = id;
        t.style.cssText =
          "position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:999999;padding:10px 14px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);font:500 14px/1.2 Inter,system-ui;max-width:92vw;white-space:pre-line;text-align:center";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.style.background = ok ? "#10b981" : "#ef4444";
      t.style.color = "#fff";
      t.style.opacity = "0";
      t.style.transition = "opacity .2s ease";
      requestAnimationFrame(() => { t.style.opacity = "1"; });
      setTimeout(() => { t.style.opacity = "0"; }, 2600);
    } catch {}
  }

  // Monta o payload esperado pela sua rota, respeitando defaults do backend.
  function montarLancamento(tipo, fonte, baseConsiderada) {
    // fonte = { nome, codigo, modo, percent, valorManual, valorCalculado, previsao, vencimento, observacao }
    const calc = Number(fonte?.valorCalculado || 0);
    const manual = Number(fonte?.valorManual || 0);
    const valor_documento = Number((calc > 0 ? calc : manual).toFixed(2));

    const data_previsao   = toISODate(fonte?.previsao || "");
    const data_vencimento = toISODate(fonte?.vencimento || "");

    // Campos opcionais: se vierem vazios, não enviamos — o backend aplica defaults
    const payload = {
      valor_documento,
      data_previsao,
      data_vencimento,
      ...(fonte?.codigo ? { codigo_cliente_fornecedor: String(fonte.codigo).trim() } : {}),
      // Se quiser sobrescrever categoria/conta, descomente:
      // codigo_categoria: "2.02.01",
      // id_conta_corrente: "2523861035",
      observacao:
        (fonte?.observacao?.trim()
          || `Comissão ${tipo} — ${fonte?.nome || ""} (base: ${Number(baseConsiderada||0).toFixed(2)})`)
    };

    return payload;
  }

  // Validação leve antes de enviar (evita 400 do backend)
  function validarLancamento(lanc, papel) {
    const erros = [];
    if (!(lanc?.valor_documento > 0)) erros.push("valor_documento inválido");
    if (!lanc?.data_previsao)  erros.push("data_previsao ausente");
    if (!lanc?.data_vencimento) erros.push("data_vencimento ausente");
    return { valido: erros.length === 0, erros, papel };
  }

  async function postarLancamento(lanc, papel) {
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lanc)
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json?.ok === false) {
        const msg = json?.error || `HTTP ${r.status}`;
        return { ok: false, papel, erro: msg, resposta: json, enviado: lanc };
      }
      return { ok: true, papel, resposta: json, enviado: lanc };
    } catch (e) {
      return { ok: false, papel, erro: e?.message || "Falha de rede", enviado: lanc };
    }
  }

  // === Função global que o popup chama no Confirmar ===
  // Espera payload: { baseConsiderada, arquiteto:{...}, vendedor:{...} }
 window.enviarComissoes = async function (payload) {
  try {
    document.dispatchEvent(
      new CustomEvent("vv:comissoes:prontas", { detail: { payload } })
    );
  } catch {}

  const lancArq = montarLancamento("arquiteto", payload?.arquiteto, payload?.baseConsiderada);
  const lancVend = montarLancamento("vendedor", payload?.vendedor, payload?.baseConsiderada);

  const vArq = validarLancamento(lancArq, "arquiteto");
  const vVend = validarLancamento(lancVend, "vendedor");

  let resArq = { ok: false }, resVend = { ok: false };

  // Envio separado para ARQUITETO
  if (vArq.valido) {
    resArq = await postarLancamento(lancArq, "arquiteto");
    if (resArq.ok) {
      toast("Comissão enviada com sucesso (arquiteto).");
    } else {
      toast(`Falha ao enviar comissão do arquiteto: ${resArq.erro || "erro"}`, false);
    }
  } else {
    toast(`Comissão do arquiteto inválida: ${vArq.erros.join(", ")}`, false);
  }

  // Envio separado para VENDEDOR
  if (vVend.valido) {
    resVend = await postarLancamento(lancVend, "vendedor");
    if (resVend.ok) {
      toast("Comissão enviada com sucesso (vendedor).");
    } else {
      toast(`Falha ao enviar comissão do vendedor: ${resVend.erro || "erro"}`, false);
    }
  } else {
    toast(`Comissão do vendedor inválida: ${vVend.erros.join(", ")}`, false);
  }

  const okGeral = resArq.ok || resVend.ok;

  try {
    document.dispatchEvent(
      new CustomEvent("vv:comissoes:enviadas", {
        detail: {
          ok: okGeral,
          resultados: {
            arquiteto: resArq,
            vendedor: resVend
          }
        }
      })
    );
  } catch {}

  return {
    ok: okGeral,
    resultados: {
      arquiteto: resArq,
      vendedor: resVend
    }
  };
};

})();

/* =========================================================
   2) POPUP DE SELEÇÃO + RATEIO + ENVIO DE COMISSÕES
   ---------------------------------------------------------
   - NÃO altera nada além do que você pediu
   - Inclui previsão/vencimento/observação para Arquiteto e Vendedor
   - Chama window.enviarComissoes(...) no confirmar
   ========================================================= */

const dispararAtualizacaoClientes = () => {
  fetch("https://ulhoa-servico-ec4e1aa95355.herokuapp.com/clientes/atualizar").catch(() => {});
  fetch("https://ulhoa-0a02024d350a.herokuapp.com/clientes/atualizar").catch(() => {});
};


async function verificarClienteEAtualizar() {
  // tenta pelo seletor novo E pelo antigo (.razaoSocial)
  const inp = document.querySelector(
    '#clientesWrapper > div > div.col-md-6.position-relative.d-flex.align-items-end.gap-2 > div > input, ' +
    'input.form-control.razaoSocial'
  );

  if (!inp) {
    console.warn("⚠️ verificarClienteEAtualizar: input de razão social não encontrado.");
    return;
  }

  const norm = s => (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const alvo = norm(inp.value || inp.dataset.valorOriginal);
  if (!alvo) {
    console.warn("⚠️ verificarClienteEAtualizar: razão social vazia.");
    return;
  }

  // Busca nas duas bases
  const [o, l] = await Promise.all([
    fetch("https://ulhoa-servico-ec4e1aa95355.herokuapp.com/clientes")
      .then(r => r.ok ? r.json() : null)
      .catch(() => null),
    fetch("https://ulhoa-0a02024d350a.herokuapp.com/clientes/visualizar")
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
  ]);

  // API de serviços: { total, ultimaAtualizacao, clientes: [...] }
  const lo = Array.isArray(o?.clientes) ? o.clientes : (Array.isArray(o) ? o : []);
  // API local: pode ser { clientes: [...] } ou array direto
  const ll = Array.isArray(l?.clientes) ? l.clientes : (Array.isArray(l) ? l : []);

  // Atualiza cache global para outras funções (getCodigoClientePorRazao)
  if (Array.isArray(lo) && lo.length) {
    window.listaClientesServico = lo;
  }

  // Compatível tanto com nome_fantasia quanto razao_social
  const existeOmie = lo.some(c =>
    norm(c.razao_social || c.nome_fantasia) === alvo
  );

  const existeLocal = ll.some(c =>
    norm(c.razao_social || c.nome_fantasia) === alvo
  );

  if (!existeOmie || !existeLocal) {
    alert("Cliente não encontrado em ambas as bases. Atualizando lista de clientes…");
    if (typeof dispararAtualizacaoClientes === "function") {
      dispararAtualizacaoClientes();
    } else {
      console.warn("⚠️ dispararAtualizacaoClientes não está definida.");
    }
  } else {
    console.log("✅ Cliente encontrado nas duas bases (Omie e sistema local).");
  }
}

const VV_CONDICOES_PAGTO_PARCELAS = [
  { value: "avista", label: "3 dias apos finalizar instalacao completa." },
  { value: "na-retirada", label: "3 dias apos finalizar instalacao da estrutura." },
  { value: "30-dias", label: "3 dias apos finalizar instalacao dos vidros." },
  { value: "entrada+30", label: "Na retirada/entrega do produto." },
  { value: "personalizado", label: "Personalizado" }
];

function vvParseBRLControleParcelas(valor) {
  if (typeof vv_parseBRL === "function") return vv_parseBRL(valor || "0");
  return Number(
    String(valor || "0")
      .replace(/\u00A0/g, " ")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;
}

function vvFmtBRLControleParcelas(valor) {
  if (typeof vv_fmtBRL === "function") return vv_fmtBRL(Number(valor || 0));
  return `R$ ${Number(valor || 0).toFixed(2).replace(".", ",")}`;
}

function vvRound2ControleParcelas(valor) {
  if (typeof vv_round2 === "function") return vv_round2(valor);
  return Math.round((Number(valor) || 0) * 100) / 100;
}

function vvCondicaoEhPersonalizadaParcelas(condicao = "") {
  const valor = String(condicao || "").trim();
  if (!valor) return false;
  return !VV_CONDICOES_PAGTO_PARCELAS.some(op => op.value === valor);
}

function vvCriarSelectCondicaoParcelas(className = "condicao-pagto") {
  const select = document.createElement("select");
  select.className = `form-select ${className}`;

  const optPlaceholder = document.createElement("option");
  optPlaceholder.value = "";
  optPlaceholder.disabled = true;
  optPlaceholder.selected = true;
  optPlaceholder.textContent = "Selecione...";
  select.appendChild(optPlaceholder);

  VV_CONDICOES_PAGTO_PARCELAS.forEach(op => {
    const option = document.createElement("option");
    option.value = op.value;
    option.textContent = op.label;
    select.appendChild(option);
  });

  return select;
}

function vvCriarInputCondicaoParcelas(className = "condicao-pagto", valor = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.className = `form-control ${className}`;
  input.placeholder = "Descreva a condicao de pagamento...";
  input.value = valor || "Personalizado - ";
  return input;
}

function vvMontarCampoCondicaoParcelas(wrapper, {
  className = "condicao-pagto",
  valor = "",
  onChange = null
} = {}) {
  const registrar = (el) => {
    if (!el || typeof onChange !== "function") return el;
    el.addEventListener("input", onChange);
    el.addEventListener("change", onChange);
    return el;
  };

  wrapper.innerHTML = "";

  if (vvCondicaoEhPersonalizadaParcelas(valor)) {
    const input = registrar(vvCriarInputCondicaoParcelas(className, valor));
    wrapper.appendChild(input);
    return input;
  }

  const select = vvCriarSelectCondicaoParcelas(className);
  if (valor) {
    select.value = valor;
  } else {
    select.selectedIndex = 0;
  }

  select.addEventListener("change", () => {
    if (select.value === "personalizado") {
      const input = registrar(vvCriarInputCondicaoParcelas(className));
      wrapper.innerHTML = "";
      wrapper.appendChild(input);
      requestAnimationFrame(() => input.focus());
      if (typeof onChange === "function") onChange();
      return;
    }

    if (typeof onChange === "function") onChange();
  });

  wrapper.appendChild(registrar(select));
  return select;
}

function vvNormalizarParcelaControle(parcela = {}) {
  const valorBruto =
    parcela?.valor ??
    parcela?.valor_digitado ??
    parcela?.valor_formatado ??
    0;

  return {
    tipo_monetario: String(parcela?.tipo_monetario ?? parcela?.tipo ?? "").trim(),
    condicao_pagto: String(parcela?.condicao_pagto ?? parcela?.condicao ?? "").trim(),
    valor: vvRound2ControleParcelas(vvParseBRLControleParcelas(valorBruto)),
    vencimento: String(parcela?.vencimento ?? parcela?.data ?? parcela?.previsao ?? "").trim(),
    ignorar: parcela?.ignorar === true || parcela?.ignorar === "true",
    descritivo: String(parcela?.descritivo ?? parcela?.observacao ?? "").trim(),
    tipo_parcelamento: String(parcela?.tipo_parcelamento ?? "normal").trim() || "normal"
  };
}

function vvSomarParcelasControle(parcelas = []) {
  return vvRound2ControleParcelas(
    (parcelas || [])
      .filter(parcela => !parcela?.ignorar)
      .reduce((acc, parcela) => acc + Number(parcela?.valor || 0), 0)
  );
}

function vvSerializarParcelasProdutoParaFormulario(parcelasProduto = []) {
  return (parcelasProduto || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0 && !parcela.ignorar)
    .map(parcela => ({
      tipo: parcela.tipo_monetario || "",
      condicao: parcela.condicao_pagto || "",
      valor: vvFmtBRLControleParcelas(parcela.valor),
      data: parcela.vencimento || "",
      descritivo: parcela.descritivo || "",
      tipo_parcelamento: parcela.tipo_parcelamento || "normal"
    }));
}

function vvSerializarParcelasServicoParaServidor(parcelasServico = []) {
  return (parcelasServico || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0 && !parcela.ignorar)
    .map(parcela => ({
      tipo_monetario: parcela.tipo_monetario || "",
      condicao_pagto: parcela.condicao_pagto || "",
      valor: vvRound2ControleParcelas(parcela.valor),
      previsao: parcela.vencimento || "",
      vencimento: parcela.vencimento || "",
      descritivo: parcela.descritivo || "",
      tipo_parcelamento: parcela.tipo_parcelamento || "normal"
    }));
}

function vvLerParcelasFormularioPrincipal() {
  const linhas = [...document.querySelectorAll("#listaParcelas .row")];
  return linhas
    .map(row => {
      const condSelect = row.querySelector("select.condicao-pagto");
      const condInput = row.querySelector("input.condicao-pagto");
      return vvNormalizarParcelaControle({
        tipo: row.querySelector(".tipo-monetario")?.value || "",
        condicao: condSelect?.value || condInput?.value || row.querySelector(".condicao-pagto")?.value || "",
        valor: row.querySelector(".valor-parcela")?.value || "",
        data: row.querySelector(".data-parcela")?.value || ""
      });
    })
    .filter(parcela =>
      parcela.valor > 0 ||
      parcela.vencimento ||
      parcela.tipo_monetario ||
      parcela.condicao_pagto
    );
}

function vvObterParcelasProdutoParaEnvioOmie(parcelasPreferidas = null) {
  const fontes = [
    parcelasPreferidas,
    window.vvParcelamentoProdutosServicosOmie?.parcelasProduto,
    window.vvParcelasProdutoOmie,
    vvLerParcelasFormularioPrincipal()
  ];

  for (const fonte of fontes) {
    if (!Array.isArray(fonte) || !fonte.length) continue;

    const normalizadas = fonte
      .map(vvNormalizarParcelaControle)
      .filter(parcela => parcela.valor > 0 && !parcela.ignorar);

    if (normalizadas.length) return normalizadas;
  }

  return [];
}

function vvMontarParcelasProdutoPayloadOmie(parcelasProduto = []) {
  const parcelasValidas = (parcelasProduto || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0 && !parcela.ignorar && formatarDataBR(parcela.vencimento));

  const totalParcelas = vvRound2ControleParcelas(
    parcelasValidas.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0)
  );

  return parcelasValidas.map((parcela, index) => ({
    numero_parcela: index + 1,
    percentual: totalParcelas > 0
      ? Number(((Number(parcela.valor || 0) / totalParcelas) * 100).toFixed(2))
      : 0,
    data_vencimento: formatarDataBR(parcela.vencimento),
    valor: vvRound2ControleParcelas(parcela.valor)
  }));
}

function vvCriarLinhaParcelaFormularioFallback() {
  const row = document.createElement("div");
  row.className = "row g-2 align-items-end mb-2";
  row.innerHTML = `
    <div class="col-3 col-lg-2">
      <label class="form-label mb-0">Tipo Monetario</label>
      <select class="form-select tipo-monetario">
        <option value="" disabled selected>Selecione...</option>
        <option value="PIX">Pix</option>
        <option value="DIN">Dinheiro</option>
        <option value="CRCP">Cartao Parcelado</option>
        <option value="CRC">Cartao de Credito</option>
        <option value="CRD">Cartao de Debito</option>
        <option value="BOLR">Boleto Recorrente</option>
        <option value="BOLV">Boleto a Vista</option>
        <option value="PER">Permuta</option>
      </select>
    </div>
    <div class="col-4 col-lg-3">
      <label class="form-label mb-0">Condicao de Pagto</label>
      <div class="condicao-wrapper"></div>
    </div>
    <div class="col-3 col-lg-2">
      <label class="form-label mb-0">Valor</label>
      <input type="text" class="form-control valor-parcela" placeholder="Ex: 1000,00">
    </div>
    <div class="col-2 col-lg-3">
      <label class="form-label mb-0">Vencimento</label>
      <input type="date" class="form-control data-parcela">
    </div>
    <div class="col-12 col-lg-2">
      <button type="button" class="btn btn-outline-danger w-100 btn-remover-parcela-formulario">Remover</button>
    </div>
  `;

  const wrapper = row.querySelector(".condicao-wrapper");
  vvMontarCampoCondicaoParcelas(wrapper, { className: "condicao-pagto" });

  row.querySelector(".btn-remover-parcela-formulario")?.addEventListener("click", () => {
    row.remove();
    if (typeof atualizarValoresParcelas === "function") atualizarValoresParcelas();
  });

  return row;
}

function vvAplicarParcelaProdutoNaLinhaFormulario(row, parcela = {}) {
  const normalizada = vvNormalizarParcelaControle(parcela);
  const tipoSelect = row.querySelector(".tipo-monetario");
  const valorInput = row.querySelector(".valor-parcela");
  const dataInput = row.querySelector(".data-parcela");
  const condWrapper = row.querySelector(".condicao-wrapper");

  if (tipoSelect) tipoSelect.value = normalizada.tipo_monetario || "";
  if (valorInput) valorInput.value = normalizada.valor > 0 ? vvFmtBRLControleParcelas(normalizada.valor) : "";
  if (dataInput) dataInput.value = normalizada.vencimento || "";
  if (condWrapper) {
    vvMontarCampoCondicaoParcelas(condWrapper, {
      className: "condicao-pagto",
      valor: normalizada.condicao_pagto || ""
    });
  }
}

function vvAtualizarListaParcelasFormulario(parcelasProduto = []) {
  const lista = document.getElementById("listaParcelas");
  if (!lista) {
    console.warn("[parcelas] #listaParcelas nao encontrado para aplicar parcelas de produtos.");
    return false;
  }

  const parcelasNormalizadas = (parcelasProduto || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0);

  lista.innerHTML = "";

  const parcelamentoContainer = document.getElementById("parcelamentoContainer");
  if (parcelamentoContainer) {
    parcelamentoContainer.style.display = "block";
  }

  parcelasNormalizadas.forEach(parcela => {
    let row = null;

    if (typeof adicionarParcela === "function") {
      adicionarParcela();
      const linhas = document.querySelectorAll("#listaParcelas .row");
      row = linhas[linhas.length - 1] || null;
    }

    if (!row) {
      row = vvCriarLinhaParcelaFormularioFallback();
      lista.appendChild(row);
      if (typeof aplicarEventosParcela === "function") {
        aplicarEventosParcela(row);
      }
    }

    vvAplicarParcelaProdutoNaLinhaFormulario(row, parcela);
  });

  if (typeof atualizarValoresParcelas === "function") {
    atualizarValoresParcelas();
  }

  return true;
}

async function vvSalvarParcelamentoOmieNoServidor({
  parcelasProduto = [],
  parcelasServico = [],
  persistirNoServidor = false
} = {}) {
  try {
    if (!persistirNoServidor) {
      console.info("[parcelas] persistencia no Heroku bloqueada no envio Omie; usando parcelas apenas em memoria para montar os payloads.");
      return { ok: true, skipped: true };
    }

    const idProposta = new URLSearchParams(window.location.search).get("id");
    if (!idProposta) {
      console.warn("[parcelas] ID da proposta nao encontrado na URL. Parcelas nao foram salvas no servidor.");
      return null;
    }

    const propostaBase = window.propostaEmEdicao || window.propostaAtual;
    if (!propostaBase || typeof propostaBase !== "object") {
      console.warn("[parcelas] Proposta base nao encontrada em memoria. Parcelas nao foram salvas no servidor.");
      return null;
    }

    const parcelasProdutoFormulario = vvSerializarParcelasProdutoParaFormulario(parcelasProduto);
    const parcelasServicoServidor = vvSerializarParcelasServicoParaServidor(parcelasServico);

    const payload = JSON.parse(JSON.stringify(propostaBase));
    payload.camposFormulario = payload.camposFormulario || {};
    payload.camposFormulario.parcelas = parcelasProdutoFormulario;
    payload.camposFormulario.parcelasServico = parcelasServicoServidor;

    console.group("[parcelas] salvando no servidor");
    console.log("idProposta:", idProposta);
    console.log("parcelasProdutoFormulario:", JSON.parse(JSON.stringify(parcelasProdutoFormulario || [])));
    console.log("parcelasServicoServidor:", JSON.parse(JSON.stringify(parcelasServicoServidor || [])));
    console.groupEnd();

    const resposta = await fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${idProposta}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado?.erro || resultado?.message || "Falha ao salvar parcelamento de produtos e servicos.");
    }

    if (window.propostaEmEdicao) {
      window.propostaEmEdicao.camposFormulario = window.propostaEmEdicao.camposFormulario || {};
      window.propostaEmEdicao.camposFormulario.parcelas = parcelasProdutoFormulario;
      window.propostaEmEdicao.camposFormulario.parcelasServico = parcelasServicoServidor;
    }

    if (window.propostaAtual) {
      window.propostaAtual.camposFormulario = window.propostaAtual.camposFormulario || {};
      window.propostaAtual.camposFormulario.parcelas = parcelasProdutoFormulario;
      window.propostaAtual.camposFormulario.parcelasServico = parcelasServicoServidor;
    }

    return resultado;
  } catch (erro) {
    console.error("[parcelas] erro ao salvar no servidor:", erro);
    throw erro;
  }
}

function vvSubtrairParcelasServicoDeParcelasProduto(parcelasProduto = [], parcelasServico = []) {
  const produtos = (parcelasProduto || []).map(vvNormalizarParcelaControle);
  const servicos = (parcelasServico || []).map(vvNormalizarParcelaControle).filter(parcela => parcela.valor > 0);

  for (const servico of servicos) {
    let restante = vvRound2ControleParcelas(servico.valor);

    const indicesPreferenciais = [];
    produtos.forEach((produto, index) => {
      if (produto.valor > 0 && produto.vencimento && produto.vencimento === servico.vencimento) {
        indicesPreferenciais.push(index);
      }
    });

    produtos.forEach((produto, index) => {
      if (produto.valor > 0 && !indicesPreferenciais.includes(index)) {
        indicesPreferenciais.push(index);
      }
    });

    for (const index of indicesPreferenciais) {
      if (restante <= 0.009) break;
      const produto = produtos[index];
      const abatido = Math.min(produto.valor, restante);
      produto.valor = vvRound2ControleParcelas(produto.valor - abatido);
      restante = vvRound2ControleParcelas(restante - abatido);
    }

    if (restante > 0.02) {
      return {
        ok: false,
        parcelasProdutoAjustadas: (parcelasProduto || []).map(vvNormalizarParcelaControle)
      };
    }
  }

  return {
    ok: true,
    parcelasProdutoAjustadas: produtos.filter(produto => produto.valor > 0.009)
  };
}

function vvEscolherParcelasIniciaisProdutosServicos({
  valorTotalProdutos = 0,
  valorTotalServicos = 0,
  parcelasProduto = [],
  parcelasServico = []
} = {}) {
  const parcelasProdutoIniciais = (parcelasProduto || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0);

  const parcelasServicoIniciais = (parcelasServico || [])
    .map(vvNormalizarParcelaControle)
    .filter(parcela => parcela.valor > 0);

  // Só cria parcela inicial de produto se não houver nenhuma salva
  if (!parcelasProdutoIniciais.length && valorTotalProdutos > 0) {
    parcelasProdutoIniciais.push({
      tipo_monetario: "",
      condicao_pagto: "",
      valor: vvRound2ControleParcelas(valorTotalProdutos),
      vencimento: "",
      ignorar: false
    });
  }

  // Serviços: nunca cria automaticamente — o usuário adiciona se quiser

  return {
    origem: "persistido",
    parcelasProdutoIniciais,
    parcelasServicoIniciais
  };
}

function abrirPopupParcelamentoProdutosServicos({
  valorTotalProdutos = 0,
  valorTotalServicos = 0,
  parcelasProdutoExistentes = [],
  parcelasServicoExistentes = []
} = {}) {
  return new Promise((resolveParcelas) => {
    const totalProdutosTarget = vvRound2ControleParcelas(valorTotalProdutos);
    const totalServicosTarget = vvRound2ControleParcelas(valorTotalServicos);

    const inicial = vvEscolherParcelasIniciaisProdutosServicos({
      valorTotalProdutos: totalProdutosTarget,
      valorTotalServicos: totalServicosTarget,
      parcelasProduto: parcelasProdutoExistentes,
      parcelasServico: parcelasServicoExistentes
    });

    console.group("[parcelas] abrirPopupParcelamentoProdutosServicos");
    console.log("valorTotalProdutos:", totalProdutosTarget);
    console.log("valorTotalServicos:", totalServicosTarget);
    console.log("origem inicial:", inicial.origem);
    console.log("parcelasProdutoIniciais:", JSON.parse(JSON.stringify(inicial.parcelasProdutoIniciais || [])));
    console.log("parcelasServicoIniciais:", JSON.parse(JSON.stringify(inicial.parcelasServicoIniciais || [])));
    console.groupEnd();

    const bd = document.createElement("div");
    bd.className = "vv-modal-backdrop";

    const md = document.createElement("div");
    md.className = "vv-modal";
    md.style.maxWidth = "1400px";
    md.style.width = "96vw";

    const hd = document.createElement("header");
    hd.innerHTML = `
      <div style="display:grid; gap:4px;">
        <h3>Controle de Parcelas: Produtos e Servicos</h3>
        <div class="vv-help" style="margin:0;">
          Arraste parcelas entre produtos e servicos. Quando o valor arrastado passar do que falta no destino, a parcela sera dividida automaticamente.
        </div>
      </div>
    `;

    const by = document.createElement("div");
    by.className = "vv-body";
    by.innerHTML = `
      <div style="display:grid; gap:12px;">
        <div class="vv-transfer-summary">
          <div>Total a parcelar: <b id="vv-total-target-produtos">${vvFmtBRLControleParcelas(totalProdutosTarget)}</b></div>
          <div>Total parcelado (produtos): <b id="vv-prod-somado">${vvFmtBRLControleParcelas(0)}</b></div>
          <div>Total parcelado (servicos): <b id="vv-serv-somado">${vvFmtBRLControleParcelas(0)}</b></div>
        </div>
        <div class="vv-transfer-grid">
          <section class="vv-transfer-panel">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
              <div>
                <h4 style="margin:0;">Produtos</h4>
                <div class="vv-help" style="margin:4px 0 0 0;">Essas parcelas vao para o pedido de produtos da Omie.</div>
              </div>
              <div class="vv-transfer-actions">
                <button type="button" class="vv-btn" id="vv-add-parcela-produto">Adicionar</button>
                <button type="button" class="vv-btn" id="vv-gerar-1x-produto">Gerar 1x</button>
                <button type="button" class="vv-btn" id="vv-gerar-2x-produto">Gerar 2x</button>
              </div>
            </div>
            <div class="vv-transfer-list" data-bucket-list="produtos"></div>
          </section>
          <section class="vv-transfer-panel">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
              <div>
                <h4 style="margin:0;">Servicos</h4>
                <div class="vv-help" style="margin:4px 0 0 0;">Essas parcelas vao para a OS de servicos.</div>
              </div>
              <div class="vv-transfer-actions">
                <button type="button" class="vv-btn" id="vv-add-parcela-servico">Adicionar</button>
                <button type="button" class="vv-btn" id="vv-gerar-1x-servico">Gerar 1x</button>
                <button type="button" class="vv-btn" id="vv-gerar-2x-servico">Gerar 2x</button>
              </div>
            </div>
            <div class="vv-transfer-list" data-bucket-list="servicos"></div>
          </section>
        </div>
      </div>
    `;

    const ft = document.createElement("div");
    ft.className = "vv-footer";
    ft.innerHTML = `
      <div class="vv-help" id="vv-help-controle-parcelas">
        As parcelas aqui sao usadas apenas neste envio para Omie. O formulario e o Heroku nao sao alterados.
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="vv-btn" id="vv-cancelar-controle-parcelas">Cancelar</button>
        <button class="vv-btn primary" id="vv-confirmar-controle-parcelas">Confirmar parcelamento</button>
      </div>
    `;

    md.appendChild(hd);
    md.appendChild(by);
    md.appendChild(ft);
    bd.appendChild(md);
    document.body.appendChild(bd);

    const buckets = {
      produtos: {
        label: "Produtos",
        target: totalProdutosTarget,
        list: by.querySelector('[data-bucket-list="produtos"]'),
        sumEl: by.querySelector("#vv-prod-somado")
      },
      servicos: {
        label: "Servicos",
        target: totalServicosTarget,
        list: by.querySelector('[data-bucket-list="servicos"]'),
        sumEl: by.querySelector("#vv-serv-somado")
      }
    };

    let draggedRow = null;

    function criarLinhaParcelaCard(parcela = {}, bucket = "produtos") {
      const normalizada = vvNormalizarParcelaControle(parcela);

      const card = document.createElement("div");
      card.className = "vv-parcela-card";
      card.draggable = true;
      card.dataset.bucket = bucket;

      card.innerHTML = `
        <div class="vv-parcela-head">
          <span class="vv-drag-handle">Arraste para transferir</span>
          <div style="display:flex;gap:8px;align-items:center;">
            <label class="vv-ignorar-label" title="Faturamento direto — esta parcela nao sera enviada para a Omie">
              <input type="checkbox" class="vv-ignorar-parcela"> Ignorar (fat. direto)
            </label>
            <button type="button" class="vv-btn danger vv-remover-parcela-transfer">Remover</button>
          </div>
        </div>
        <div class="row g-2 align-items-end">
          <div class="col-12 col-xl-3">
            <label class="form-label mb-0">Tipo Monetario</label>
            <select class="form-select tipo-monetario-transfer">
              <option value="" disabled selected>Selecione...</option>
              <option value="PIX">Pix</option>
              <option value="DIN">Dinheiro</option>
              <option value="CRCP">Cartao Parcelado</option>
              <option value="CRC">Cartao de Credito</option>
              <option value="CRD">Cartao de Debito</option>
              <option value="BOLR">Boleto Recorrente</option>
              <option value="BOLV">Boleto a Vista</option>
              <option value="PER">Permuta</option>
            </select>
          </div>
          <div class="col-12 col-xl-4">
            <label class="form-label mb-0">Condicao de Pagto</label>
            <div class="condicao-wrapper-transfer"></div>
          </div>
          <div class="col-12 col-xl-2">
            <label class="form-label mb-0">Valor</label>
            <input type="text" class="form-control valor-parcela-transfer" placeholder="Ex: 1000,00">
          </div>
          <div class="col-12 col-xl-3">
            <label class="form-label mb-0">Vencimento</label>
            <input type="date" class="form-control data-parcela-transfer">
          </div>
          <div class="col-12 col-xl-3">
            <label class="form-label mb-0">Tipo de Parcelamento</label>
            <select class="form-select tipo-parcelamento-transfer">
              <option value="normal">Normal</option>
              <option value="faturamento_direto">Faturamento Direto</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label mb-0">Descritivo</label>
            <input type="text" class="form-control descritivo-parcela-transfer" placeholder="Ex: Entrada, 1ª parcela...">
          </div>
        </div>
      `;

      const tipoSelect = card.querySelector(".tipo-monetario-transfer");
      const valorInput = card.querySelector(".valor-parcela-transfer");
      const dataInput = card.querySelector(".data-parcela-transfer");
      const wrapper = card.querySelector(".condicao-wrapper-transfer");

      if (tipoSelect) tipoSelect.value = normalizada.tipo_monetario || "";
      if (valorInput) valorInput.value = normalizada.valor > 0 ? vvFmtBRLControleParcelas(normalizada.valor) : "";
      if (dataInput) dataInput.value = normalizada.vencimento || "";
      const tipoParcelamentoSelect = card.querySelector(".tipo-parcelamento-transfer");
      if (tipoParcelamentoSelect) {
        tipoParcelamentoSelect.value = normalizada.tipo_parcelamento || "normal";
        tipoParcelamentoSelect.addEventListener("change", atualizarResumoParcelasControle);
      }
      const descrInput = card.querySelector(".descritivo-parcela-transfer");
      if (descrInput) {
        descrInput.value = normalizada.descritivo || "";
        descrInput.addEventListener("input", atualizarResumoParcelasControle);
      }

      const ignorarCheck = card.querySelector(".vv-ignorar-parcela");
      if (ignorarCheck) {
        ignorarCheck.checked = !!normalizada.ignorar;
        ignorarCheck.addEventListener("change", () => {
          if (ignorarCheck.checked) {
            const bucketAtual = card.dataset.bucket || bucket;
            card.remove();
            atualizarEstadoLista(bucketAtual);
            atualizarResumoParcelasControle();
          }
        });
      }

      vvMontarCampoCondicaoParcelas(wrapper, {
        className: "condicao-pagto-transfer",
        valor: normalizada.condicao_pagto || "",
        onChange: atualizarResumoParcelasControle
      });

      tipoSelect?.addEventListener("change", atualizarResumoParcelasControle);
      valorInput?.addEventListener("input", atualizarResumoParcelasControle);
      valorInput?.addEventListener("blur", () => {
        const valor = vvParseBRLControleParcelas(valorInput.value || "0");
        valorInput.value = valor > 0 ? vvFmtBRLControleParcelas(valor) : "";
        atualizarResumoParcelasControle();
      });
      dataInput?.addEventListener("change", atualizarResumoParcelasControle);

      card.querySelector(".vv-remover-parcela-transfer")?.addEventListener("click", () => {
        const bucketAtual = card.dataset.bucket || bucket;
        card.remove();
        atualizarEstadoLista(bucketAtual);
        atualizarResumoParcelasControle();
      });

      card.addEventListener("dragstart", () => {
        draggedRow = card;
        card.classList.add("is-dragging");
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        draggedRow = null;
        Object.values(buckets).forEach(info => info.list.classList.remove("is-over"));
      });

      return card;
    }

    function coletarParcelasBucket(bucket) {
      return [...buckets[bucket].list.querySelectorAll(".vv-parcela-card")]
        .map(card => {
          const condicaoEl = card.querySelector(".condicao-pagto-transfer");
          return vvNormalizarParcelaControle({
            tipo_monetario: card.querySelector(".tipo-monetario-transfer")?.value || "",
            condicao_pagto: condicaoEl?.value || "",
            valor: card.querySelector(".valor-parcela-transfer")?.value || "",
            vencimento: card.querySelector(".data-parcela-transfer")?.value || "",
            descritivo: card.querySelector(".descritivo-parcela-transfer")?.value || "",
            tipo_parcelamento: card.querySelector(".tipo-parcelamento-transfer")?.value || "normal"
          });
        })
        .filter(parcela =>
          parcela.valor > 0 ||
          parcela.vencimento ||
          parcela.tipo_monetario ||
          parcela.condicao_pagto
        );
    }

    function atualizarEstadoLista(bucket) {
      const info = buckets[bucket];
      if (!info) return;

      let vazio = info.list.querySelector(".vv-transfer-empty");
      const temCards = info.list.querySelector(".vv-parcela-card");

      if (!temCards && !vazio) {
        vazio = document.createElement("p");
        vazio.className = "vv-transfer-empty";
        vazio.textContent = bucket === "produtos"
          ? "Arraste parcelas para produtos ou crie novas."
          : "Arraste parcelas para servicos ou crie novas.";
        info.list.appendChild(vazio);
      }

      if (temCards && vazio) {
        vazio.remove();
      }
    }

    function adicionarLinhaNoBucket(bucket, parcela = {}) {
      const card = criarLinhaParcelaCard(parcela, bucket);
      buckets[bucket].list.appendChild(card);
      atualizarEstadoLista(bucket);
      atualizarResumoParcelasControle();
      return card;
    }

    function limparBucket(bucket) {
      buckets[bucket].list.innerHTML = "";
      atualizarEstadoLista(bucket);
      atualizarResumoParcelasControle();
    }

    function gerarParcelasIguais(bucket, qtd) {
      if (!qtd || qtd <= 0) return;

      const target = buckets[bucket].target;
      const atuais = coletarParcelasBucket(bucket);
      const outroBucket = bucket === "produtos" ? "servicos" : "produtos";
      const referencia = atuais[0] || coletarParcelasBucket(outroBucket)[0] || {};

      limparBucket(bucket);

      let acumulado = 0;
      for (let i = 0; i < qtd; i++) {
        let valor = vvRound2ControleParcelas(target / qtd);
        if (i === qtd - 1) {
          valor = vvRound2ControleParcelas(target - acumulado);
        }
        acumulado = vvRound2ControleParcelas(acumulado + valor);

        adicionarLinhaNoBucket(bucket, {
          tipo_monetario: referencia.tipo_monetario || "",
          condicao_pagto: referencia.condicao_pagto || "",
          valor,
          vencimento: i === 0 ? (referencia.vencimento || "") : ""
        });
      }
    }

    function atualizarResumoBucket(bucket, totalParcelado) {
      const info = buckets[bucket];
      if (info.sumEl) info.sumEl.textContent = vvFmtBRLControleParcelas(totalParcelado);
    }

    function atualizarResumoParcelasControle() {
      const totalProdutos = vvRound2ControleParcelas(
        coletarParcelasBucket("produtos").reduce((s, p) => s + p.valor, 0)
      );
      const totalServicos = vvRound2ControleParcelas(
        coletarParcelasBucket("servicos").reduce((s, p) => s + p.valor, 0)
      );
      atualizarResumoBucket("produtos", totalProdutos);
      atualizarResumoBucket("servicos", totalServicos);
    }

    function moverLinhaParaBucket(card, bucketDestino, valorTransferencia = null) {
      if (!card) return;

      const bucketOrigem = card.dataset.bucket || "produtos";
      if (bucketOrigem === bucketDestino) return;

      const dadosOriginais = vvNormalizarParcelaControle({
        tipo_monetario: card.querySelector(".tipo-monetario-transfer")?.value || "",
        condicao_pagto: card.querySelector(".condicao-pagto-transfer")?.value || "",
        valor: card.querySelector(".valor-parcela-transfer")?.value || "",
        vencimento: card.querySelector(".data-parcela-transfer")?.value || ""
      });

      if (
        typeof valorTransferencia === "number" &&
        valorTransferencia > 0.009 &&
        valorTransferencia < dadosOriginais.valor - 0.009
      ) {
        const valorRestante = vvRound2ControleParcelas(dadosOriginais.valor - valorTransferencia);
        const valorInput = card.querySelector(".valor-parcela-transfer");

        if (valorRestante > 0.009 && valorInput) {
          valorInput.value = vvFmtBRLControleParcelas(valorRestante);
        } else {
          card.remove();
        }

        const clone = criarLinhaParcelaCard({
          ...dadosOriginais,
          valor: valorTransferencia
        }, bucketDestino);
        buckets[bucketDestino].list.appendChild(clone);
      } else {
        card.dataset.bucket = bucketDestino;
        buckets[bucketDestino].list.appendChild(card);
      }

      atualizarEstadoLista(bucketOrigem);
      atualizarEstadoLista(bucketDestino);
      atualizarResumoParcelasControle();
    }

    Object.entries(buckets).forEach(([bucket, info]) => {
      info.list.addEventListener("dragover", (event) => {
        event.preventDefault();
        info.list.classList.add("is-over");
      });

      info.list.addEventListener("dragleave", () => {
        info.list.classList.remove("is-over");
      });

      info.list.addEventListener("drop", (event) => {
        event.preventDefault();
        info.list.classList.remove("is-over");

        if (!draggedRow) return;

        const valorLinha = vvParseBRLControleParcelas(
          draggedRow.querySelector(".valor-parcela-transfer")?.value || "0"
        );

        const totalAtualDestino = vvSomarParcelasControle(coletarParcelasBucket(bucket));
        const faltaDestino = vvRound2ControleParcelas(info.target - totalAtualDestino);
        const valorTransferencia =
          faltaDestino > 0.009 && valorLinha > faltaDestino + 0.009
            ? faltaDestino
            : null;

        moverLinhaParaBucket(draggedRow, bucket, valorTransferencia);
      });
    });

    by.querySelector("#vv-add-parcela-produto")?.addEventListener("click", () => {
      adicionarLinhaNoBucket("produtos");
    });
    by.querySelector("#vv-add-parcela-servico")?.addEventListener("click", () => {
      adicionarLinhaNoBucket("servicos");
    });
    by.querySelector("#vv-gerar-1x-produto")?.addEventListener("click", () => gerarParcelasIguais("produtos", 1));
    by.querySelector("#vv-gerar-2x-produto")?.addEventListener("click", () => gerarParcelasIguais("produtos", 2));
    by.querySelector("#vv-gerar-1x-servico")?.addEventListener("click", () => gerarParcelasIguais("servicos", 1));
    by.querySelector("#vv-gerar-2x-servico")?.addEventListener("click", () => gerarParcelasIguais("servicos", 2));

    ft.querySelector("#vv-cancelar-controle-parcelas")?.addEventListener("click", () => {
      document.body.removeChild(bd);
      resolveParcelas(null);
    });

    ft.querySelector("#vv-confirmar-controle-parcelas")?.addEventListener("click", () => {
      try {
        const parcelasProduto = coletarParcelasBucket("produtos").filter(p => p.valor > 0);
        const parcelasServico = coletarParcelasBucket("servicos").filter(p => p.valor > 0);

        const parcelasServicoServidor = vvSerializarParcelasServicoParaServidor(parcelasServico);

        window.vvParcelasProdutoOmie = parcelasProduto;
        window.vvParcelasServicoOmie = parcelasServicoServidor;
        window.vvParcelamentoProdutosServicosOmie = {
          totalProdutos: totalProdutosTarget,
          totalServicos: totalServicosTarget,
          parcelasProduto,
          parcelasServico: parcelasServicoServidor
        };

        document.body.removeChild(bd);
        resolveParcelas({
          totalProdutos: totalProdutosTarget,
          totalServicos: totalServicosTarget,
          parcelasProduto,
          parcelasServico: parcelasServicoServidor
        });
      } catch (erro) {
        console.error("[parcelas] erro ao confirmar controle de parcelas:", erro);
        alert("Erro ao confirmar o controle de parcelas.");
      }
    });

    (inicial.parcelasProdutoIniciais || []).forEach(parcela => adicionarLinhaNoBucket("produtos", parcela));
    (inicial.parcelasServicoIniciais || []).forEach(parcela => adicionarLinhaNoBucket("servicos", parcela));

    atualizarEstadoLista("produtos");
    atualizarEstadoLista("servicos");
    atualizarResumoParcelasControle();
  });
}



async function abrirPopupSelecaoItensOmie(itens){
verificarClienteEAtualizar()



  if (typeof ocultarCarregando === 'function') ocultarCarregando();

  // ===== helpers de UI: toast =====
  function vvToast(msg, tipo='ok', tempo=4500){
    let cont = document.getElementById('vv-toast-container');
    if (!cont){
      cont = document.createElement('div');
      cont.id = 'vv-toast-container';
      cont.style.cssText = `
        position:fixed; inset:auto 16px 16px auto; z-index:10000; display:flex; flex-direction:column; gap:8px;
      `;
      document.body.appendChild(cont);
    }
    const el = document.createElement('div');
    el.className = 'vv-toast';
    el.style.cssText = `
      max-width: min(92vw, 560px);
      background: ${tipo==='erro' ? '#fee2e2' : tipo==='info' ? '#e0f2fe' : '#dcfce7'};
      border: 1px solid ${tipo==='erro' ? '#ef4444' : tipo==='info' ? '#38bdf8' : '#22c55e'};
      color: #111827; padding: 10px 12px; border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,.12); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
    `;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .35s linear'; }, tempo-350);
    setTimeout(()=>{ cont.removeChild(el); }, tempo);
  }

  // ---- helpers de normalização/identificação ----
  const normalize = (s) => (s || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const isMaoDeObraInstalPorHora = (desc) => {
    const n = normalize(desc);
    return n.includes('mao de obra de instalacao') && n.includes('(por hora)');
  };

  const classifyKind = (desc) => {
    const n = (desc || "")
      .toString()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    if (/^vidros?\b/.test(n)) return "vidro";
    if (isMaoDeObraInstalPorHora(desc)) return "servico";
    return "produto";
  };

  // ✅ AJUSTE: comissão do vendedor = 1% do #valorFinalTotal
  function lerValorFinalTotal(){
    const el = document.getElementById('valorFinalTotal');
    let txt = (el?.textContent || '').trim();
    if (!txt) return 0;

    // normaliza NBSP
    txt = txt.replace(/\u00A0/g,' ');

    // tenta helper BRL primeiro
    if (typeof vv_parseBRL === 'function'){
      const v1 = vv_parseBRL(txt);
      if (!isNaN(v1) && v1 > 0) return v1;
    }

    // fallback robusto: aceita "R$ 2444039.47" e "R$ 2.444.039,47"
    const s = txt.replace(/[^\d,\.]/g,'');
    if (!s) return 0;

    // se tiver vírgula, assume decimal BR; se não, assume ponto decimal
    if (s.includes(',')){
      return Number(s.replace(/\./g,'').replace(',','.')) || 0;
    }
    return Number(s) || 0;
  }

  // ========== ESTADO DE COMISSÕES (só informativo) ==========
  const vendedorDefault =
    document.querySelector('#vendedorResponsavel')?.value?.trim() ||
    document.querySelector('#vendedorResponsavel')?.textContent?.trim() ||
    '';

  const ARQ_COMISSAO_SEL = '#totalizadoresExternosPorAmbiente > div:nth-child(4) > div.row.text-center.gx-4.gy-3 > div:nth-child(5) > div.fw-bold';
  const $arqDomEl = document.querySelector(ARQ_COMISSAO_SEL);
  const arqDomValorInicial = (typeof vv_parseBRL === 'function')
    ? vv_parseBRL($arqDomEl?.textContent || '0')
    : Number(String($arqDomEl?.textContent || '0').replace(/[^\d,-]/g,'').replace(/\./g,'').replace(',','.')) || 0;

  let _comArq = { modo:'percent', percent:0, valorManual:0, nome:'', codigo:'', prev:'', venc:'', obs:'' };
  let _comVend= { modo:'percent', percent:0, valorManual:0, nome:(vendedorDefault||''), codigo:'', prev:'', venc:'', obs:'' };
  let _lastTotalBaseMO = 0;

  if (arqDomValorInicial > 0) { _comArq.modo = 'valor'; _comArq.valorManual = arqDomValorInicial; }

  function coletarArquitetosCadastrados(){
    const lista = [];
    document.querySelectorAll('#clientesWrapper .cliente-item').forEach(item=>{
      const nome = (item.querySelector('.razaoSocial')?.value
                 || item.querySelector('.razaoSocial')?.getAttribute('data-valor-original')
                 || '').trim();
      const codigo = (item.querySelector('.codigoCliente')?.value || '').trim();
      if (nome) lista.push({ nome, codigo });
    });
    const nomeArqExtra = (document.getElementById('arquitetoNome')?.value || '').trim();
    const codArqExtra  = (document.getElementById('codigoArquiteto')?.value || '').trim();
    if (nomeArqExtra) lista.push({ nome: nomeArqExtra, codigo: codArqExtra });
    const seen = new Set();
    return lista.filter(a=>{
      const k = a.nome.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function lerComissaoArquitetoDoResumo(){
    const el = document.querySelector(ARQ_COMISSAO_SEL);
    return el ? (window.vv_parseBRL ? vv_parseBRL(el.textContent||'0') : 0) : 0;
  }
  function atualizarComissaoArquitetoNoResumo(valor){
    const el = document.querySelector(ARQ_COMISSAO_SEL);
    if (el && window.vv_fmtBRL) el.textContent = vv_fmtBRL(Number(valor)||0);
  }

  // ===== SUB-POPUP: COMISSÕES =====
 // ===== SUB-POPUP: COMISSÕES =====
function abrirPopupComissao(){
  return new Promise((resolveC)=>{
    const ARQUITETOS = coletarArquitetosCadastrados();

    // ================== HELPERS ==================
    const parseBRL = (s)=> {
      if (window.vv_parseBRL) return vv_parseBRL(s);
      return Number(
        String(s || '')
          .replace(/\u00A0/g, ' ')
          .replace(/[^\d,-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0;
    };

    const fmtBRL = (n)=> {
      if (window.vv_fmtBRL) return vv_fmtBRL(n);
      return `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
    };

    const toISODate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const proximoDia15 = (base = new Date()) => {
      const y = base.getFullYear();
      const m = base.getMonth();
      const diaHoje = base.getDate();
      const alvo = (diaHoje <= 15) ? new Date(y, m, 15) : new Date(y, m + 1, 15);
      return toISODate(alvo);
    };

    const primeiroDiaUtilProxMes = (base = new Date()) => {
      const y = base.getFullYear();
      const m = base.getMonth();
      let d = new Date(y, m + 1, 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      return toISODate(d);
    };

    function lerValorProdutoResumo(){
      const el =
        document.getElementById('vv-total-ajustado') ||
        document.getElementById('vv-cat-produto');
      return parseBRL(el?.textContent || '0');
    }

    function lerComissaoArquitetoResumoVisual(){
      const cards = [...document.querySelectorAll('.col')];
      for (const card of cards) {
        const titulo = card.querySelector('.text-muted.small')?.textContent || '';
        if (/Comissão\s*Arquiteta/i.test(titulo.replace(/\s+/g, ' '))) {
          const bold = card.querySelector('.fw-bold')?.textContent || '0';
          return parseBRL(bold);
        }
      }
      return 0;
    }

    // ================== DEFAULTS DE DATAS ==================
    const hoje = new Date();
    const defaultArq = proximoDia15(hoje);
    const defaultVend = primeiroDiaUtilProxMes(hoje);

    if (!_comArq) _comArq = {};
    if (!_comVend) _comVend = {};

    if (!_comArq.prev) _comArq.prev = defaultArq;
    if (!_comArq.venc) _comArq.venc = defaultArq;

    if (!_comVend.prev) _comVend.prev = defaultVend;
    if (!_comVend.venc) _comVend.venc = defaultVend;

    // ================== OBS PADRÃO ==================
    const elOrc = document.getElementById("numeroOrcamento");
    const numeroOrcamento =
      (elOrc?.value || "").trim() ||
      (elOrc?.dataset?.valorOriginal || "").trim();

    const obsPadrao = numeroOrcamento ? `Orçamento: ${numeroOrcamento}` : "";

    if (!_comArq.obs)  _comArq.obs  = obsPadrao;
    if (!_comVend.obs) _comVend.obs = obsPadrao;

    // ================== DEFAULTS DE COMISSÃO ==================
    if (!_comArq.modo) _comArq.modo = 'valor';

    const valorArquitetoResumo = lerComissaoArquitetoResumoVisual();
    if (_comArq.valorManual == null || isNaN(Number(_comArq.valorManual))) {
      _comArq.valorManual = valorArquitetoResumo || 0;
    }

    if (_comArq.percent == null || isNaN(Number(_comArq.percent))) {
      _comArq.percent = 0;
    }

    // vendedor SEMPRE 1% do total produto
    _comVend.modo = 'percent';
    _comVend.percent = 1;
    _comVend.valorManual = 0;

    if (!window._comDesc) window._comDesc = { modo:'percent', percent:0, valorManual:0 };

    const bd = document.createElement('div');
    bd.className = 'vv-modal-backdrop';

    const md = document.createElement('div');
    md.className = 'vv-modal';

    const hd = document.createElement('header');
    hd.innerHTML = `
      <h3>Comissões</h3>
      <div class="vv-help" style="margin-top:4px;">
        <b>Arquiteto:</b> valor exibido no resumo “Comissão Arquiteta” ·
        <b>Vendedor:</b> <u>1% fixo do Total (Produto)</u>
      </div>
    `;

    const optsArq = ARQUITETOS.map(a=>{
      const txt = a.codigo ? `${a.nome} — ${a.codigo}` : a.nome;
      const sel = (a.nome && a.nome === (_comArq?.nome||'')) ? 'selected' : '';
      return `<option value="${a.nome.replace(/"/g,'&quot;')}" data-codigo="${(a.codigo||'').replace(/"/g,'&quot;')}" ${sel}>${txt}</option>`;
    }).join('');

    const by = document.createElement('div');
    by.className = 'vv-body';
    by.innerHTML = `
      <div style="display:grid; gap:16px;">
        <div style="display:grid; gap:8px;">
          <div class="vv-help">
            Base atual (Arquiteto):
            <b id="vv-com-base-arq">${fmtBRL(valorArquitetoResumo || 0)}</b>
            <span class="vv-help" style="margin-left:8px;">(vem do resumo “Comissão Arquiteta”)</span>
          </div>
          <div class="vv-help">
            Base fixa (Vendedor = 1%):
            <b id="vv-com-base-vend">${fmtBRL(lerValorProdutoResumo() || 0)}</b>
            <span class="vv-help" style="margin-left:8px;">(vem do total final de produtos enviado para a Omie)</span>
          </div>
        </div>

        <div style="display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(280px,1fr));">
          <!-- Arquiteto -->
          <section style="border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
            <h4 style="margin:0 0 8px 0;">Arquiteto</h4>

            <label class="form-label">Selecionar arquiteto cadastrado</label>
            <select id="comArqSelect" class="form-select" style="margin-bottom:8px;">
              <option value="">— escolher —</option>
              ${optsArq}
            </select>

            <div class="row g-2" style="margin-bottom:8px;">
              <div class="col-8">
                <label class="form-label">Nome</label>
                <input id="comArqNome" class="form-control" placeholder="Nome do arquiteto" value="${_comArq?.nome||''}">
              </div>
              <div class="col-4">
                <label class="form-label">Código</label>
                <input id="comArqCodigo" class="form-control" placeholder="Código" value="${_comArq?.codigo||''}">
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
              <label><input type="radio" name="comArqModo" value="percent" ${_comArq?.modo==='percent'?'checked':''}> %</label>
              <label><input type="radio" name="comArqModo" value="valor" ${_comArq?.modo!=='percent'?'checked':''}> Valor fixo (R$)</label>
            </div>

            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <label class="form-label" style="min-width:90px;">Valor</label>
              <input id="comArqPercent" type="number" min="0" step="0.01" value="${Number(_comArq?.percent||0)}" class="form-control" style="max-width:140px;">
              <input id="comArqValor" type="text" value="${fmtBRL(_comArq?.valorManual ?? valorArquitetoResumo ?? 0)}" class="form-control" style="max-width:180px;">
            </div>

            <div class="row g-2" style="margin-top:8px;">
              <div class="col-6">
                <label class="form-label">Previsão</label>
                <input type="date" id="arqPrev" class="form-control" value="${_comArq?.prev||''}">
              </div>
              <div class="col-6">
                <label class="form-label">Vencimento</label>
                <input type="date" id="arqVenc" class="form-control" value="${_comArq?.venc||''}">
              </div>
            </div>

            <div style="margin-top:8px;">
              <label class="form-label">Observação (opcional)</label>
              <textarea id="arqObs" rows="2" class="form-control" placeholder="Ex: Comissão arquiteto">${_comArq?.obs||''}</textarea>
            </div>

            <div class="vv-help" style="margin-top:6px;">Calculado: <b id="comArqCalc">R$ 0,00</b></div>
          </section>

          <!-- Vendedor -->
          <section style="border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
            <h4 style="margin:0 0 8px 0;">Vendedor</h4>

            <div class="row g-2" style="margin-bottom:8px;">
              <div class="col-8">
                <label class="form-label">Nome</label>
                <input id="comVendNome" class="form-control" placeholder="Nome do vendedor" value="${_comVend?.nome|| (document.getElementById('vendedorResponsavel')?.value||'')}">
              </div>
              <div class="col-4">
                <label class="form-label">Código</label>
                <input id="comVendCodigo" class="form-control" placeholder="Código" value="${_comVend?.codigo|| (document.getElementById('codigoVendedor')?.value||'')}">
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px;">
              <label><input type="radio" name="comVendModo" value="percent" checked> % do total produto</label>
              <label><input type="radio" name="comVendModo" value="valor"> Valor fixo (R$)</label>
            </div>

            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <label class="form-label" style="min-width:90px;">Valor</label>
              <input id="comVendPercent" type="number" min="0" step="0.01" value="1" class="form-control" style="max-width:140px;">
              <input id="comVendValor" type="text" value="${fmtBRL(0)}" class="form-control" style="max-width:180px;">
            </div>

            <div class="row g-2" style="margin-top:8px;">
              <div class="col-6">
                <label class="form-label">Previsão</label>
                <input type="date" id="vendPrev" class="form-control" value="${_comVend?.prev||''}">
              </div>
              <div class="col-6">
                <label class="form-label">Vencimento</label>
                <input type="date" id="vendVenc" class="form-control" value="${_comVend?.venc||''}">
              </div>
            </div>

            <div style="margin-top:8px;">
              <label class="form-label">Observação (opcional)</label>
              <textarea id="vendObs" rows="2" class="form-control" placeholder="Ex: Comissão consultor">${_comVend?.obs||''}</textarea>
            </div>

            <div class="vv-help" style="margin-top:6px;">Calculado: <b id="comVendCalc">R$ 0,00</b></div>
          </section>

          <!-- Resumo -->
          <section style="border:1px solid #e5e7eb; border-radius:12px; padding:12px;">
            <h4 style="margin:0 0 8px 0;">Resumo</h4>
            <div class="vv-help">Arquiteto: <b id="sumArq">R$ 0,00</b></div>
            <div class="vv-help">Vendedor: <b id="sumVend">R$ 0,00</b></div>
            <div class="vv-help" style="margin-top:4px;">Total: <b id="sumTot">R$ 0,00</b></div>
          </section>
        </div>
      </div>
    `;

    const ft = document.createElement('div');
    ft.className = 'vv-footer';
    ft.innerHTML = `
      <div class="vv-help">Informativo — não altera valores enviados à Omie.</div>
      <div style="display:flex; gap:8px;">
        <button class="vv-btn" id="commCancel">Cancelar</button>
        <button class="vv-btn primary" id="commSave">Salvar</button>
      </div>
    `;

    md.appendChild(hd);
    md.appendChild(by);
    md.appendChild(ft);
    bd.appendChild(md);
    document.body.appendChild(bd);

    const $selArq        = by.querySelector('#comArqSelect');
    const $comArqNome    = by.querySelector('#comArqNome');
    const $comArqCodigo  = by.querySelector('#comArqCodigo');
    const $comArqPercent = by.querySelector('#comArqPercent');
    const $comArqValor   = by.querySelector('#comArqValor');
    const $arqPrev       = by.querySelector('#arqPrev');
    const $arqVenc       = by.querySelector('#arqVenc');
    const $arqObs        = by.querySelector('#arqObs');

    const $comVendNome    = by.querySelector('#comVendNome');
    const $comVendCodigo  = by.querySelector('#comVendCodigo');
    const $comVendPercent = by.querySelector('#comVendPercent');
    const $comVendValor   = by.querySelector('#comVendValor');
    const $vendPrev       = by.querySelector('#vendPrev');
    const $vendVenc       = by.querySelector('#vendVenc');
    const $vendObs        = by.querySelector('#vendObs');

    const $comArqCalc   = by.querySelector('#comArqCalc');
    const $comVendCalc  = by.querySelector('#comVendCalc');
    const $sumArq       = by.querySelector('#sumArq');
    const $sumVend      = by.querySelector('#sumVend');
    const $sumTot       = by.querySelector('#sumTot');
    const $baseArqLabel = by.querySelector('#vv-com-base-arq');
    const $baseVendLabel= by.querySelector('#vv-com-base-vend');

    const getModoArq = ()=> by.querySelector('input[name="comArqModo"]:checked')?.value || 'valor';

    // trava UI do vendedor
    by.querySelectorAll('input[name="comVendModo"]').forEach(r => {
      r.checked = (r.value === 'percent');
      r.disabled = true;
    });
    $comVendPercent.value = '1';
    $comVendPercent.disabled = true;
    $comVendValor.value = fmtBRL(0);
    $comVendValor.disabled = true;

    if ($selArq){
      $selArq.addEventListener('change', ()=>{
        const opt = $selArq.selectedOptions[0];
        if (!opt) return;
        $comArqNome.value   = opt.value || '';
        $comArqCodigo.value = opt.getAttribute('data-codigo') || '';
      });
    }

    function recalcComm(){
      const baseArqResumo = lerComissaoArquitetoResumoVisual();
      const baseVendProduto = lerValorProdutoResumo();

      const arq = (getModoArq() === 'percent')
        ? (Number($comArqPercent.value || 0) / 100) * baseArqResumo
        : parseBRL($comArqValor.value || '0');

      const vend = 0.01 * baseVendProduto;

      $baseArqLabel.textContent = fmtBRL(baseArqResumo);
      $baseVendLabel.textContent = fmtBRL(baseVendProduto);

      $comArqCalc.textContent = fmtBRL(arq);
      $comVendCalc.textContent = fmtBRL(vend);

      $sumArq.textContent = fmtBRL(arq);
      $sumVend.textContent = fmtBRL(vend);
      $sumTot.textContent = fmtBRL(Math.max(0, arq) + Math.max(0, vend));
    }

    by.querySelectorAll('input[name="comArqModo"]').forEach(r => r.addEventListener('change', recalcComm));
    [$comArqPercent, $comArqValor].forEach(inp => {
      inp.addEventListener('input', recalcComm);
      if (inp === $comArqValor) {
        inp.addEventListener('blur', ()=>{
          inp.value = fmtBRL(parseBRL(inp.value || '0'));
          recalcComm();
        });
      }
    });

    recalcComm();

    ft.querySelector('#commCancel').addEventListener('click', ()=>{
      document.body.removeChild(bd);
      resolveC(null);
    });

    ft.querySelector('#commSave').addEventListener('click', ()=>{
      _comArq = {
        modo: getModoArq(),
        percent: Number($comArqPercent.value || 0),
        valorManual: parseBRL($comArqValor.value || '0'),
        nome: $comArqNome.value || '',
        codigo: $comArqCodigo.value || '',
        prev: $arqPrev.value || '',
        venc: $arqVenc.value || '',
        obs: $arqObs.value || ''
      };

      _comVend = {
        modo: 'percent',
        percent: 1,
        valorManual: 0,
        nome: $comVendNome.value || '',
        codigo: $comVendCodigo.value || '',
        prev: $vendPrev.value || '',
        venc: $vendVenc.value || '',
        obs: $vendObs.value || ''
      };

      const arqCalc = parseBRL($sumArq.textContent || '0');
      const venCalc = parseBRL($sumVend.textContent || '0');

      if (typeof atualizarComissaoArquitetoNoResumo === 'function') {
        atualizarComissaoArquitetoNoResumo(arqCalc);
      }

      document.body.removeChild(bd);
      resolveC({
        baseConsiderada: lerValorProdutoResumo(),
        arquiteto: { ..._comArq, valorCalculado: arqCalc },
        vendedor:  { ..._comVend, valorCalculado: venCalc },
        total: arqCalc + venCalc
      });
    });
  });
}


  // === Normalização nome->código vendedor ===
  function _vv_normNome(s){
    return (s || "")
      .toString()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/\s+/g," ")
      .trim()
      .toUpperCase();
  }
  const VENDEDORES_CODIGO = [
    { nome:"FELIPE ULHOA FERREIRA", codigo:"2452908656", aliases:["FELIPE ULHOA","FELIPE U","FELIPE F","FELIPE FERREIRA"] },
    { nome:"JOAO CLEBER MARTINS",   codigo:"2487961636", aliases:["JOAO CLEBER","JOÃO CLEBER","JOAO C MARTINS","J C MARTINS","JOAO MARTINS"] },
    { nome:"RAFAEL ANGELO ARAUJO DA SILVA", codigo:"2458334379", aliases:["RAFAEL ANGELO","RAFAEL A A SILVA","RAFAEL ARAUJO","RAFAEL SILVA"] }
  ];
  function resolverCodigoVendedor(nome){
    const n = _vv_normNome(nome);
    if (!n) return "";
    for (const v of VENDEDORES_CODIGO){
      if (_vv_normNome(v.nome) === n) return v.codigo;
    }
    for (const v of VENDEDORES_CODIGO){
      if ((v.aliases||[]).some(a => _vv_normNome(a) === n)) return v.codigo;
    }
    for (const v of VENDEDORES_CODIGO){
      const alvo = _vv_normNome(v.nome);
      if (n.includes(alvo) || alvo.includes(n)) return v.codigo;
      if ((v.aliases||[]).some(a => {
        const aa = _vv_normNome(a);
        return n.includes(aa) || aa.includes(n);
      })) return v.codigo;
    }
    return "";
  }
  (function wireVendedorCodigoAuto(){
    const sel = document.getElementById("vendedorResponsavel");
    if (!sel) return;
    let cod = document.getElementById("codigoVendedor");
    if (!cod){
      cod = document.createElement("input");
      cod.type = "text";
      cod.id = "codigoVendedor";
      cod.className = "form-control";
      cod.placeholder = "Código do vendedor";
      cod.style.maxWidth = "220px";
      sel.parentElement?.appendChild(cod);
    }
    function atualizarCodigo(){
      const nome = (sel.value || sel.options?.[sel.selectedIndex]?.text || "").trim();
      const codigo = resolverCodigoVendedor(nome);
      cod.value = codigo;
    }
    sel.addEventListener("change", atualizarCodigo);
    sel.addEventListener("input", atualizarCodigo);
    atualizarCodigo();
  })();

  // ===================== MODAL PRINCIPAL =====================
  return new Promise(resolve => {
    const backdrop = document.createElement('div'); backdrop.className = 'vv-modal-backdrop';
    const modal    = document.createElement('div'); modal.className    = 'vv-modal';

    const header = document.createElement('header');
    header.innerHTML = `<h3>Selecione os itens (Desconto primeiro → Ignorar → MO → Serviços)</h3>`;

    const body  = document.createElement('div'); body.className = 'vv-body';

    // --------- controles ---------
    const controls = document.createElement('div');
    controls.style.cssText = "display:grid; gap:8px; margin-bottom:12px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items:end;";
    controls.innerHTML = `
      <!-- Serviços -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-weight:600;">Serviços (aplicado nos aprovados)</label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <label><input type="radio" name="srvModo" value="percent" checked> % do total aprovado</label>
          <label><input type="radio" name="srvModo" value="valor"> Valor fixo (R$)</label>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="srvPercent" type="number" min="0" step="0.01" value="0" class="vv-input" style="width:120px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
          <input id="srvValor"   type="text"   value="R$ 0,00" class="vv-input" style="width:160px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
        </div>
        <small class="vv-help">Ignorados não entram no rateio de Serviços.</small>
      </div>

      <!-- Desconto -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-weight:600;">Desconto (primeiro, sobre o <b>TOTAL</b> dos itens)</label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <label><input type="radio" name="discModo" value="percent" checked> % do total</label>
          <label><input type="radio" name="discModo" value="valor"> Valor fixo (R$)</label>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="discPercent" type="number" min="0" step="0.01" value="0" class="vv-input" style="width:120px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
          <input id="discValor"   type="text"   value="R$ 0,00" class="vv-input" style="width:160px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
        </div>
        <small class="vv-help">Depois o desconto é <b>dividido igualmente</b> entre os aprovados.</small>
      </div>

      <!-- Comissão (display) -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-weight:600;">Comissão (informativa — não vai para a Omie)</label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <label><input type="radio" name="comModo" value="percent" checked> % do total aprovado</label>
          <label><input type="radio" name="comModo" value="valor"> Valor fixo (R$)</label>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="comPercent" type="number" min="0" step="0.01" value="0" class="vv-input" style="width:120px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
          <input id="comValor"   type="text"   value="R$ 0,00" class="vv-input" style="width:160px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;">
        </div>
        <small class="vv-help">Use o botão "Comissão…" para cadastrar nomes e confirmar.</small>
      </div>
    `;

    // --------- tabela ---------
    const table = document.createElement('table');
    table.className = 'vv-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width:44px;">Ignorar</th>
          <th>Ambiente</th>
          <th>Produto</th>
          <th>Código</th>
          <th class="vv-right">% part.</th>
          <th class="vv-right">Valor original</th>
          <th class="vv-right">Valor ajustado (base+MO)</th>
          <th class="vv-right">Final p/ OMIE</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    // --------- rodapé ---------
    const footer = document.createElement('div');
    footer.className = 'vv-footer';
    footer.innerHTML = `
      <div class="totais">
        <div>Total aprovado (base + MO): <b id="vv-total-aprovado">R$ 0,00</b></div>
        <div>Serviços aplicado: <b id="vv-total-servicos">R$ 0,00</b></div>
        <div>Desconto total (sobre TODOS): <b id="vv-total-desconto">R$ 0,00</b></div>
        <div>Comissão (info): <b id="vv-total-comissao">R$ 0,00</b></div>
        <div>Total produtos após ajuste: <b id="vv-total-ajustado">R$ 0,00</b></div>

        <div style="margin-top:10px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px; padding-top:8px; border-top:1px dashed #e5e7eb;">
          <div>🔹 Total (Produto): <b id="vv-cat-produto">R$ 0,00</b></div>
          <div>🔹 Total (Serviço): <b id="vv-cat-servico">R$ 0,00</b></div>
          <div>🔹 Produtos faturados diretos: <b id="vv-cat-vidro">R$ 0,00</b></div>
        </div>

        <small class="vv-help" style="display:block; margin-top:6px;">
          <b>Regra especial:</b> se "Mão de Obra de Instalação (por Hora)" for <i>ignorado</i>, seu valor é dividido em partes iguais entre os itens não ignorados.
        </small>
      </div>
      <div class="acoes" style="display:flex; gap:8px;">
        <button class="vv-btn" id="vv-comissoes">Comissão…</button>
        <button class="vv-btn" id="vv-marcar-todos">Marcar todos como ignorados</button>
        <button class="vv-btn" id="vv-desmarcar-todos">Limpar marcações</button>
        <button class="vv-btn" id="vv-cancelar">Cancelar</button>
        <button class="vv-btn primary" id="vv-confirmar">Confirmar seleção</button>
      </div>
    `;

    // --------- ajuda + filtros ---------
    const help = document.createElement('div');
    help.className = 'vv-help';
    help.innerHTML = `
      Ordem: <b>Desconto</b> sobre TODOS → <b>Ignorar</b> → <b>MO</b> redistribuida entre aprovados → <b>Servicos</b> abatidos do total final de produtos. Arredonda so no final.
    `;

    const filtros = document.createElement('div');
    filtros.style.cssText = "display:flex; gap:10px; align-items:center; margin:12px 0; flex-wrap:wrap;";
    filtros.innerHTML = `
      <input id="filtroTexto" type="text" placeholder="Buscar..." 
        style="padding:8px 12px; border:1px solid #ccc; border-radius:8px; width:220px;" />
      <button class="vv-btn" id="filtroTodos">Todos</button>
      <button class="vv-btn" id="filtroVidros">Somente Vidros</button>
      <button class="vv-btn" id="filtroServicos">Somente Serviços</button>
      <small class="vv-help">Filtros são visuais; não alteram os cálculos.</small>
    `;

    // monta
    const bodyWrap = document.createElement('div');
    bodyWrap.appendChild(help);
    bodyWrap.appendChild(filtros);
    bodyWrap.appendChild(controls);
    bodyWrap.appendChild(table);
    body.appendChild(bodyWrap);
    modal.appendChild(header); modal.appendChild(body); modal.appendChild(footer);
    backdrop.appendChild(modal); document.body.appendChild(backdrop);

    // --------- linhas ---------
    itens.forEach(item => {
      const tr = document.createElement('tr');
      const ehMOHora = isMaoDeObraInstalPorHora(item.descricao);
      const kind = classifyKind(item.descricao || '');
      tr.innerHTML = `
        <td><input type="checkbox" class="vv-ignorar" data-key="${item.key}"></td>
        <td>${item.ambiente || '-'}</td>
        <td>${item.descricao ? item.descricao : '<small>Sem descrição</small>'}${ehMOHora ? ' <small style="color:#2563eb;font-weight:600;">(MO Hora)</small>' : ''}</td>
        <td><span class="vv-mono">${item.codigo || '-'}</span></td>
        <td class="vv-right vv-mono" data-col="part">0%</td>
        <td class="vv-right vv-mono" data-col="original">${vv_fmtBRL(Number(item.valorTotalGrupo)||0)}</td>
        <td class="vv-right vv-mono" data-col="ajustado">R$ 0,00</td>
        <td class="vv-right vv-mono" data-col="final">R$ 0,00</td>
      `;
      tr.dataset.key = item.key;
      tr.dataset.valor = String(Number(item.valorTotalGrupo)||0);
      tr.dataset.islabor = ehMOHora ? '1' : '0';
      tr.dataset.kind = kind; // produto | servico | vidro
      tbody.appendChild(tr);
    });

    // --------- refs ---------
    const chkAll       = [...tbody.querySelectorAll('.vv-ignorar')];
    const $totAprov    = footer.querySelector('#vv-total-aprovado');
    const $totServ     = footer.querySelector('#vv-total-servicos');
    const $totDesc     = footer.querySelector('#vv-total-desconto');
    const $totCom      = footer.querySelector('#vv-total-comissao');
    const $totAjust    = footer.querySelector('#vv-total-ajustado');
    const $catProduto  = footer.querySelector('#vv-cat-produto');
    const $catServico  = footer.querySelector('#vv-cat-servico');
    const $catVidro    = footer.querySelector('#vv-cat-vidro');

  const $srvPercent  = controls.querySelector('#srvPercent');
const $srvValor    = controls.querySelector('#srvValor');
const $discPercent = controls.querySelector('#discPercent');
const $discValor   = controls.querySelector('#discValor');
const $comPercent  = controls.querySelector('#comPercent');
const $comValor    = controls.querySelector('#comValor');

// ===================== SYNC DESCONTO COM #campoDescontoFinal =====================


const $campoDescontoFinal = document.getElementById('campoDescontoFinal');

function syncDescontoFromCampoFinal(){
  if (!$campoDescontoFinal) return;

  // pega primeiro o que o usuário digitou; se vazio, usa o data-valor-original
  let raw = String(
    ($campoDescontoFinal.value ?? '').trim() ||
    ($campoDescontoFinal.dataset?.valorOriginal ?? '').trim() ||
    ($campoDescontoFinal.textContent ?? '').trim()
  );

  if (!raw) return;

  // normaliza NBSP
  raw = raw.replace(/\u00A0/g, ' ');

  // Se vier com %, usa percent
  if (raw.includes('%')) {
    const rPercent = controls.querySelector('input[name="discModo"][value="percent"]');
    if (rPercent) rPercent.checked = true;

    const num = Number(raw.replace(',', '.').replace(/[^\d.]/g,'')) || 0;
    $discPercent.value = String(num);

    // ✅ AJUSTE: manter data-valor-original alinhado com #campoDescontoFinal
    $discPercent.dataset.valorOriginal = String(num);
    // (limpa o outro pra não confundir)
    $discValor.dataset.valorOriginal = vv_fmtBRL(0);

    return;
  }

  // Caso contrário, trata como VALOR FIXO (R$), inclusive quando raw = "500"
  const rValor = controls.querySelector('input[name="discModo"][value="valor"]');
  if (rValor) rValor.checked = true;

  // se for "500" puro, vv_parseBRL pode retornar 0 dependendo da sua implementação,
  // então garantimos fallback numérico
  let v = (typeof vv_parseBRL === 'function') ? vv_parseBRL(raw) : 0;
  if (!v || isNaN(v)) {
    v = Number(String(raw).replace(/[^\d,\.]/g,'').replace(/\./g,'').replace(',','.')) || 0;
  }

  $discValor.value = vv_fmtBRL(v);

  // ✅ AJUSTE: data-valor-original do discValor = data-valor-original do campoDescontoFinal (mesma base numérica)
  // Ex: campoDescontoFinal data-valor-original="500" -> discValor data-valor-original="500"
  $discValor.dataset.valorOriginal = String(Number(v) || 0);
  // (e mantém o percent coerente)
  $discPercent.dataset.valorOriginal = String(Number($discPercent.value || 0) || 0);
}

// sincroniza ao abrir o modal
syncDescontoFromCampoFinal();

// mantém sincronizado quando o campo mudar fora do modal
if ($campoDescontoFinal){
  $campoDescontoFinal.addEventListener('input', ()=>{ syncDescontoFromCampoFinal(); recalc(); });
  $campoDescontoFinal.addEventListener('change', ()=>{ syncDescontoFromCampoFinal(); recalc(); });
}
// ================================================================================

const getModoServicos = () => (controls.querySelector('input[name="srvModo"]:checked')?.value) || 'percent';
const getModoDesconto = () => (controls.querySelector('input[name="discModo"]:checked')?.value) || 'percent';
const getModoComissao = () => (controls.querySelector('input[name="comModo"]:checked')?.value) || 'percent';


    const sum = (arr) => arr.reduce((a,b)=>a+b,0);
    const toCents = (v) => Math.round(v * 100);
    const fromCents = (c) => c / 100;

    // ============== FILTROS (visuais) ==============
    const filtroInput = filtros.querySelector('#filtroTexto');
    const btnTodos    = filtros.querySelector('#filtroTodos');
    const btnVidros   = filtros.querySelector('#filtroVidros');
    const btnServ     = filtros.querySelector('#filtroServicos');

    function aplicarFiltro(tipo = 'todos'){
      const termo = (filtroInput.value || '').toLowerCase().trim();
      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        const desc = (tr.children[2]?.innerText || '').toLowerCase();
        const amb  = (tr.children[1]?.innerText || '').toLowerCase();
        const kind = tr.dataset.kind;
        const isLabor = tr.dataset.islabor === '1';

        let mostra = true;
        if (tipo === 'vidros')   mostra = (kind === 'vidro');
        if (tipo === 'servicos') mostra = (kind === 'servico' || isLabor);

        if (termo && !(desc.includes(termo) || amb.includes(termo))) mostra = false;

        tr.style.display = mostra ? '' : 'none';
      });
    }

    filtroInput.addEventListener('input', ()=>aplicarFiltro());
    btnTodos.addEventListener('click', ()=>aplicarFiltro('todos'));
    btnVidros.addEventListener('click', ()=>aplicarFiltro('vidros'));
    btnServ.addEventListener('click',  ()=>aplicarFiltro('servicos'));


    function mostrarAlertaDescontoExcessivo(msg, tipo = "erro") {
  let alerta = document.getElementById("vv-alerta-desconto-excessivo");

  if (!alerta) {
    alerta = document.createElement("div");
    alerta.id = "vv-alerta-desconto-excessivo";
    alerta.style.margin = "10px 0";
    alerta.style.padding = "12px 14px";
    alerta.style.borderRadius = "10px";
    alerta.style.fontWeight = "600";
    alerta.style.fontSize = "14px";
    alerta.style.display = "none";
    alerta.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";

    controls.parentNode.insertBefore(alerta, table);
  }

  if (!msg) {
    alerta.style.display = "none";
    alerta.innerHTML = "";
    return;
  }

  alerta.style.display = "block";

  if (tipo === "ok") {
    alerta.style.background = "#e8f7ee";
    alerta.style.color = "#146c2e";
    alerta.style.border = "1px solid #b7e4c7";
    alerta.innerHTML = `✅ ${msg}`;
  } else {
    alerta.style.background = "#fdecec";
    alerta.style.color = "#a61b1b";
    alerta.style.border = "1px solid #f5b5b5";
    alerta.innerHTML = `⚠️ ${msg}`;
  }
}
    // ===================== RECALC =====================
function recalc(){
  const rows = [...tbody.querySelectorAll('tr')];
  const isIgnoredKey = (key) => !!chkAll.find(c => c.dataset.key===key)?.checked;

  const catVidroC_all = rows.reduce((acc, tr) => {
    if (tr.dataset.kind === "vidro") {
      const original = Number(tr.dataset.valor || 0) || 0;
      return acc + toCents(original);
    }
    return acc;
  }, 0);

  const totalTodos = rows.reduce((acc, tr) => acc + (Number(tr.dataset.valor||0) || 0), 0);

  let descontoTotal = 0;
  if (getModoDesconto()==='percent'){
    const p = Number($discPercent.value||0);
    descontoTotal = (p/100) * totalTodos;
  } else {
    descontoTotal = vv_parseBRL($discValor.value||'0');
  }
  descontoTotal = Math.max(0, Math.min(descontoTotal, totalTodos));

  const aprovadosRows = rows.filter(tr => !isIgnoredKey(tr.dataset.key));
  const nAprov = aprovadosRows.length;

  if (nAprov === 0){
    rows.forEach(tr => {
      tr.querySelector('[data-col="part"]').textContent = '0%';
      tr.querySelector('[data-col="ajustado"]').textContent = vv_fmtBRL(Number(tr.dataset.valor||0));
      tr.querySelector('[data-col="final"]').textContent = vv_fmtBRL(0);
    });

    const totalIgnoradoSemMO_zero = rows.reduce((acc, tr) => {
      const isLabor = tr.dataset.islabor === '1';
      return acc + (isLabor ? 0 : (Number(tr.dataset.valor || 0) || 0));
    }, 0);

    $totAprov.textContent = vv_fmtBRL(0);
    $totServ.textContent  = vv_fmtBRL(0);
    $totDesc.textContent  = vv_fmtBRL(descontoTotal);
    $totCom.textContent   = vv_fmtBRL(0);
    $totAjust.textContent = vv_fmtBRL(0);
    $catProduto.textContent = vv_fmtBRL(lerValorFinalTotal());
    $catServico.textContent = vv_fmtBRL(0);
    $catVidro.textContent   = vv_fmtBRL(fromCents(catVidroC_all));
    _lastTotalBaseMO = 0;
    return;
  }

  const laborIgnoredTotal = rows.reduce((acc, tr) => {
    const isLab = tr.dataset.islabor === '1';
    const isIgn = isIgnoredKey(tr.dataset.key);
    return acc + (isLab && isIgn ? (Number(tr.dataset.valor||0)||0) : 0);
  }, 0);

  const cotaMO = laborIgnoredTotal > 0 ? (laborIgnoredTotal / nAprov) : 0;

  const baseMOMap = new Map();
  let totalBaseMO = 0;
  aprovadosRows.forEach(tr => {
    const original = Number(tr.dataset.valor||0) || 0;
    const base = original + cotaMO;
    baseMOMap.set(tr.dataset.key, base);
    totalBaseMO += base;
  });

  const descontoAplicavel = Math.min(descontoTotal, totalBaseMO);
  const cotaDescontoIgual = nAprov > 0 ? (descontoAplicavel / nAprov) : 0;
  const baseLiquidaMap = new Map();
  let totalLiquidoGeral = 0;
  aprovadosRows.forEach(tr => {
    const key = tr.dataset.key;
    const base = baseMOMap.get(key) || (Number(tr.dataset.valor || 0) || 0);
    const baseLiquida = Math.max(0, base - cotaDescontoIgual);
    baseLiquidaMap.set(key, baseLiquida);
    totalLiquidoGeral += baseLiquida;
  });

  // Serviços: em modo percentual, a base correta é totalLiquidoGeral (já com desconto aplicado),
  // pois o desconto impacta o pedido inteiro e de lá derivamos produtos e serviços.
  const servTotal = getModoServicos()==='percent'
    ? ((Number($srvPercent.value||0)/100) * totalLiquidoGeral)
    : vv_parseBRL($srvValor.value||'0');

  const servAplicavel = Math.max(0, Math.min(servTotal, totalLiquidoGeral));
  const totalProdutosDestino = Math.max(0, totalLiquidoGeral - servAplicavel);
  const totalProdutosDestinoC = toCents(totalProdutosDestino);

  const rowsProdutosOmie = aprovadosRows.filter(tr => {
    const kind = tr.dataset.kind;
    const isLabor = tr.dataset.islabor === '1';
    return kind !== 'servico' && !isLabor;
  });

  const baseProdutosParaRateio = rowsProdutosOmie.reduce((acc, tr) => {
    return acc + (baseLiquidaMap.get(tr.dataset.key) || 0);
  }, 0);

  const alocacaoProdutoC = new Map();
  if (rowsProdutosOmie.length > 0 && baseProdutosParaRateio > 0 && totalProdutosDestinoC > 0) {
    let totalAlocadoC = 0;
    const restos = [];

    rowsProdutosOmie.forEach(tr => {
      const key = tr.dataset.key;
      const baseLiquida = baseLiquidaMap.get(key) || 0;
      const brutoC = (baseLiquida / baseProdutosParaRateio) * totalProdutosDestinoC;
      const pisoC = Math.floor(brutoC);

      alocacaoProdutoC.set(key, pisoC);
      totalAlocadoC += pisoC;
      restos.push({ key, resto: brutoC - pisoC });
    });

    restos.sort((a, b) => b.resto - a.resto);

    let faltanteC = totalProdutosDestinoC - totalAlocadoC;
    while (faltanteC > 0 && restos.length > 0) {
      const item = restos.shift();
      alocacaoProdutoC.set(item.key, (alocacaoProdutoC.get(item.key) || 0) + 1);
      faltanteC -= 1;
    }
  }

  let catProdutoC = 0;
  let catServicoC = toCents(servAplicavel);
  let catVidroC = 0;

  aprovadosRows.forEach(tr => {
    const key = tr.dataset.key;
    const kind = tr.dataset.kind;
    const isLabor = tr.dataset.islabor === '1';

    const original = Number(tr.dataset.valor||0) || 0;
    const base = baseMOMap.get(key) || original;
    const baseLiquida = baseLiquidaMap.get(key) || 0;

    const part = totalBaseMO > 0 ? (base / totalBaseMO) * 100 : 0;
    tr.querySelector('[data-col="part"]').textContent = `${part.toFixed(2)}%`;

    tr.querySelector('[data-col="ajustado"]').textContent = vv_fmtBRL(baseLiquida);

    // REGRA ORIGINAL + TRAVA PARA NÃO NEGATIVAR
    const finalC = alocacaoProdutoC.get(key) || 0;
    const final = fromCents(finalC);

    tr.querySelector('[data-col="final"]').textContent = vv_fmtBRL(final);

    if (kind === 'vidro') {
      catVidroC += finalC;
    } else if (kind !== 'servico' && !isLabor) {
      catProdutoC += finalC;
    }
  });

  rows
    .filter(tr => isIgnoredKey(tr.dataset.key))
    .forEach(tr => {
      tr.querySelector('[data-col="part"]').textContent = '0%';
      tr.querySelector('[data-col="ajustado"]').textContent = vv_fmtBRL(Number(tr.dataset.valor||0));
      tr.querySelector('[data-col="final"]').textContent = vv_fmtBRL(0);
    });

  $totAprov.textContent = vv_fmtBRL(totalBaseMO);
  $totServ.textContent  = vv_fmtBRL(servAplicavel);
  $totDesc.textContent  = vv_fmtBRL(descontoAplicavel);

  const comDisplay = getModoComissao()==='percent'
    ? fromCents( toCents( (Number($comPercent.value||0)/100) * totalBaseMO ) )
    : fromCents( toCents( vv_parseBRL($comValor.value||'0') ) );

  // Total (Produto) = itens ignorados (faturamento direto) excluindo MO por Hora
  const ignoradosRows = rows.filter(tr => isIgnoredKey(tr.dataset.key));
  const totalIgnoradoSemMO = ignoradosRows.reduce((acc, tr) => {
    const isLabor = tr.dataset.islabor === '1';
    return acc + (isLabor ? 0 : (Number(tr.dataset.valor || 0) || 0));
  }, 0);

  $totCom.textContent   = vv_fmtBRL(comDisplay);
  $totAjust.textContent = vv_fmtBRL(fromCents(totalProdutosDestinoC));
  $catProduto.textContent = vv_fmtBRL(lerValorFinalTotal());
  $catServico.textContent = vv_fmtBRL(fromCents(catServicoC));
  $catVidro.textContent   = vv_fmtBRL(fromCents(catVidroC));

  _lastTotalBaseMO = totalBaseMO;
}

    controls.querySelectorAll('input[name="srvModo"]').forEach(r=> r.addEventListener('change', recalc));
    controls.querySelectorAll('input[name="discModo"]').forEach(r=> r.addEventListener('change', recalc));
    controls.querySelectorAll('input[name="comModo"]').forEach(r=> r.addEventListener('change', recalc));
    [$srvPercent,$srvValor,$discPercent,$discValor,$comPercent,$comValor].forEach(inp=>{
      inp.addEventListener('input', recalc);
      if (inp===$srvValor || inp===$discValor || inp===$comValor){
        inp.addEventListener('blur', ()=>{ inp.value = vv_fmtBRL(vv_parseBRL(inp.value||'0')); });
      }
    });

    footer.querySelector('#vv-marcar-todos').addEventListener('click', ()=>{
      [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.checked = true);
      recalc();
    });
    footer.querySelector('#vv-desmarcar-todos').addEventListener('click', ()=>{
      [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.checked = false);
      recalc();
    });
    [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.addEventListener('change', recalc));

    footer.querySelector('#vv-comissoes').addEventListener('click', async ()=>{
      await abrirPopupComissao();
    });

    footer.querySelector('#vv-cancelar').addEventListener('click', ()=>{
      document.body.removeChild(backdrop);
      resolve(null);
    });

    // ===== helper: envio com confirmação (toast) =====
  // ===== helper: envio com confirmação (toast) =====


async function tentarEnviarComissoes(payload){
  try {
    document.dispatchEvent(new CustomEvent('vv:comissoes:prontas', { detail: payload }));
  } catch(e){}

  if (typeof window.enviarComissoes !== 'function'){
    vvToast('Comissões preparadas, mas função enviarComissoes() não está disponível.', 'info');
    return { ok:false, resposta:null, erro:'Função enviarComissoes() ausente' };
  }

  vvToast('Enviando comissões…', 'info', 2000);

  try{
    const r = await Promise.resolve(window.enviarComissoes(payload));

    console.group("🚀 [COMISSÕES] Resultado final");
    console.log("Payload enviado:", JSON.parse(JSON.stringify(payload || {})));
    console.log("Retorno completo:", JSON.parse(JSON.stringify(r || {})));
    console.groupEnd();

    const ok = !!r?.ok;

    const arqInfo  = r?.resultados?.arquiteto || {};
    const vendInfo = r?.resultados?.vendedor || {};

    const arqV = Number(payload?.arquiteto?.valorCalculado || payload?.arquiteto?.valorManual || 0);
    const venV = Number(payload?.vendedor?.valorCalculado || payload?.vendedor?.valorManual || 0);

    const msgs = [];

    if (arqInfo.status === 'enviado') msgs.push(`Arquiteto enviado: ${vv_fmtBRL(arqV)}`);
    else if (arqInfo.status === 'ignorado') msgs.push(`Arquiteto ignorado`);
    else if (arqInfo.status === 'invalido') msgs.push(`Arquiteto inválido: ${arqInfo.erro || '-'}`);
    else if (arqInfo.status === 'erro') msgs.push(`Arquiteto com erro: ${arqInfo.erro || '-'}`);

    if (vendInfo.status === 'enviado') msgs.push(`Vendedor enviado: ${vv_fmtBRL(venV)}`);
    else if (vendInfo.status === 'ignorado') msgs.push(`Vendedor ignorado`);
    else if (vendInfo.status === 'invalido') msgs.push(`Vendedor inválido: ${vendInfo.erro || '-'}`);
    else if (vendInfo.status === 'erro') msgs.push(`Vendedor com erro: ${vendInfo.erro || '-'}`);

    if (ok){
      vvToast(`Comissões processadas.\n${msgs.join(' | ')}`, 'ok', 7000);
      try {
        document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', {
          detail: { ok:true, resposta:r, payload }
        }));
      } catch(_){}
      return { ok:true, resposta:r, erro:null };
    } else {
      const msg = r?.message || r?.erro || 'Nenhuma comissão foi enviada.';
      vvToast(`${msg}\n${msgs.join(' | ')}`, 'erro', 7000);
      try {
        document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', {
          detail: { ok:false, resposta:r, erro:msg, payload }
        }));
      } catch(_){}
      return { ok:false, resposta:r, erro:msg };
    }
  } catch(e){
    const msg = e?.message || 'Erro inesperado ao enviar comissões.';
    console.group("💥 [COMISSÕES] Exceção");
    console.error("Mensagem:", msg);
    console.error("Erro completo:", e);
    console.error("Payload:", JSON.parse(JSON.stringify(payload || {})));
    console.groupEnd();

    vvToast(msg, 'erro', 6000);

    try {
      document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', {
        detail: { ok:false, resposta:null, erro:msg, payload }
      }));
    } catch(_){}

    return { ok:false, resposta:null, erro:msg };
  }
}

function prepararComissoesAutomaticamente() {
  const parseBRL = (s) => {
    if (window.vv_parseBRL) return vv_parseBRL(s);
    return Number(
      String(s || '')
        .replace(/\u00A0/g, ' ')
        .replace(/[^\d,-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    ) || 0;
  };

  const toISODateLocal = (d) => {
    if (!d) return '';
    return vvDataISO(d);
  };

  const proximoDia15 = (base = new Date()) => {
    const y = base.getFullYear();
    const m = base.getMonth();
    const diaHoje = base.getDate();
    const alvo = (diaHoje <= 15) ? new Date(y, m, 15) : new Date(y, m + 1, 15);
    return toISODateLocal(alvo);
  };

  const primeiroDiaUtilProxMes = (base = new Date()) => {
    const y = base.getFullYear();
    const m = base.getMonth();
    let d = new Date(y, m + 1, 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return toISODateLocal(d);
  };

  const lerValorProdutoResumo = () => {
    const el = document.getElementById('vv-cat-produto');
    return parseBRL(el?.textContent || '0');
  };

  const lerComissaoArquitetoResumoVisual = () => {
    const cards = [...document.querySelectorAll('.col')];
    for (const card of cards) {
      const titulo = card.querySelector('.text-muted.small')?.textContent || '';
      if (/Comissão\s*Arquiteta/i.test(titulo.replace(/\s+/g, ' '))) {
        const bold = card.querySelector('.fw-bold')?.textContent || '0';
        return parseBRL(bold);
      }
    }
    return 0;
  };

  const resolverNomeVendedorTela = () => {
    return (
      document.getElementById('comVendNome')?.value?.trim() ||
      document.getElementById('vendedorResponsavel')?.value?.trim() ||
      _comVend?.nome ||
      ''
    );
  };

  const resolverCodigoVendedorTela = () => {
    const codigoDireto =
      document.getElementById('comVendCodigo')?.value?.trim() ||
      document.getElementById('codigoVendedor')?.value?.trim() ||
      '';

    if (codigoDireto) return codigoDireto;

    const nome = resolverNomeVendedorTela();
    if (typeof resolverCodigoVendedor === 'function' && nome) {
      const cod = resolverCodigoVendedor(nome);
      if (cod) return cod;
    }

    return _comVend?.codigo || '';
  };

  const resolverNomeArquitetoTela = () => {
    return (
      document.getElementById('comArqNome')?.value?.trim() ||
      _comArq?.nome ||
      ''
    );
  };

  const resolverCodigoArquitetoTela = () => {
    return (
      document.getElementById('comArqCodigo')?.value?.trim() ||
      _comArq?.codigo ||
      ''
    );
  };

  const numeroOrcamento =
    document.getElementById("numeroOrcamento")?.value?.trim() ||
    document.getElementById("numeroOrcamento")?.dataset?.valorOriginal?.trim() ||
    '';

  const obsPadrao = numeroOrcamento ? `Orçamento: ${numeroOrcamento}` : '';

  const hoje = new Date();
  const defaultArq = proximoDia15(hoje);
  const defaultVend = primeiroDiaUtilProxMes(hoje);

  if (typeof _comArq !== 'object' || !_comArq) _comArq = {};
  if (typeof _comVend !== 'object' || !_comVend) _comVend = {};

  // arquiteto
  const valorArquitetoResumo = lerComissaoArquitetoResumoVisual();
  _comArq.modo = _comArq.modo || 'valor';
  _comArq.percent = Number(_comArq.percent || 0);
  _comArq.valorManual = Number(_comArq.valorManual || valorArquitetoResumo || 0);
  _comArq.nome = resolverNomeArquitetoTela();
  _comArq.codigo = resolverCodigoArquitetoTela();
  _comArq.prev = _comArq.prev || defaultArq;
  _comArq.venc = _comArq.venc || defaultArq;
  _comArq.obs = _comArq.obs || obsPadrao;

  // vendedor = 1% do produto
  _comVend.modo = 'percent';
  _comVend.percent = 1;
  _comVend.valorManual = 0;
  _comVend.nome = resolverNomeVendedorTela();
  _comVend.codigo = resolverCodigoVendedorTela();
  _comVend.prev = _comVend.prev || defaultVend;
  _comVend.venc = _comVend.venc || defaultVend;
  _comVend.obs = _comVend.obs || obsPadrao;

  console.group("🛠️ [COMISSÕES] Estado preparado automaticamente");
  console.log("_comArq:", JSON.parse(JSON.stringify(_comArq || {})));
  console.log("_comVend:", JSON.parse(JSON.stringify(_comVend || {})));
  console.log("Base arquiteto (resumo):", valorArquitetoResumo);
  console.log("Base vendedor (produto):", lerValorProdutoResumo());
  console.groupEnd();
}

footer.querySelector('#vv-confirmar').addEventListener('click', async ()=>{
  const ignoradosKeys = new Set(
    [...tbody.querySelectorAll('.vv-ignorar')]
      .filter(c => c.checked)
      .map(c => c.dataset.key)
  );

  const aprovados = [];
  const ignorados = [];

  [...tbody.querySelectorAll('tr')].forEach(tr => {
    const key  = tr.dataset.key;
    const item = itens.find(i => i.key === key);
    const isIgn = ignoradosKeys.has(key);

    if (!item) return;

    if (isIgn){
      ignorados.push(item);
    } else {
      const finText = tr.querySelector('[data-col="final"]')?.textContent || '0';
      const finalValor = vv_parseBRL(finText);

      aprovados.push({
        ...item,
        valorOriginal: Number(item.valorTotalGrupo) || 0,
        valorAjustadoParaOmie: finalValor
      });
    }
  });

  const totalAprovadoBaseComMO = vv_parseBRL($totAprov.textContent || '0');
  const valorServicos          = vv_parseBRL($totServ.textContent || '0');
  const valorDesconto          = vv_parseBRL($totDesc.textContent || '0');
  const valorComissaoInfo      = vv_parseBRL($totCom.textContent || '0');
  const totalFinalProdutos     = vv_parseBRL($totAjust.textContent || '0');

  let parcelamentoProdutosServicos = null;
  let parcelamentoServicos = null;

  if (valorServicos > 0 && typeof abrirPopupParcelamentoProdutosServicos === 'function') {
    const parcelasProdutoAtuais = vvLerParcelasFormularioPrincipal();
    const parcelasProdutoSalvas =
      parcelasProdutoAtuais.length > 0
        ? parcelasProdutoAtuais
        : (Array.isArray(window.vvParcelasProdutoOmie) && window.vvParcelasProdutoOmie.length > 0)
          ? window.vvParcelasProdutoOmie
          : (
              window.propostaEmEdicao?.camposFormulario?.parcelas ||
              window.propostaAtual?.camposFormulario?.parcelas ||
              []
            );

    const parcelasServicoSalvas =
      (Array.isArray(window.vvParcelasServicoOmie) && window.vvParcelasServicoOmie.length > 0)
        ? window.vvParcelasServicoOmie
        : (
            window.propostaEmEdicao?.camposFormulario?.parcelasServico ||
            window.propostaAtual?.camposFormulario?.parcelasServico ||
            []
          );

  // Os alvos (totalFinalProdutos / valorServicos) já refletem desconto e
  // itens ignorados do popup anterior — são os valores corretos.
  // As parcelas existentes são carregadas apenas como ponto de partida;
  // o usuário ajusta se necessário antes de confirmar.
  parcelamentoProdutosServicos = await abrirPopupParcelamentoProdutosServicos({
    valorTotalProdutos: vv_parseBRL($catProduto.textContent || '0'),
    valorTotalServicos: valorServicos,
    parcelasProdutoExistentes: parcelasProdutoSalvas,
    parcelasServicoExistentes: parcelasServicoSalvas
  });

    if (!parcelamentoProdutosServicos) {
      vvToast('Controle de parcelas cancelado.', 'info');
      return;
    }
    parcelamentoServicos = parcelamentoProdutosServicos.parcelasServico || null;
  }

  prepararComissoesAutomaticamente();

  const calcFromState = (s, base) => {
    const modo = s?.modo || 'percent';
    if (modo === 'percent') {
      return (Number(s?.percent || 0) / 100) * Number(base || 0);
    }
    return Number(s?.valorManual || 0);
  };

  const arqCalc = calcFromState(_comArq, _lastTotalBaseMO);
  const baseVendFinalTotal = lerValorFinalTotal();
  const vendCalc = Number((baseVendFinalTotal * 0.01).toFixed(2));

  const comissoesParaEnvio = {
    baseConsiderada: baseVendFinalTotal,
    arquiteto: {
      nome: _comArq?.nome || '',
      codigo: _comArq?.codigo || '',
      modo: _comArq?.modo || 'percent',
      percent: Number(_comArq?.percent || 0),
      valorManual: Number(_comArq?.valorManual || 0),
      valorCalculado: Number(arqCalc || 0),
      previsao: _comArq?.prev || '',
      vencimento: _comArq?.venc || '',
      observacao: _comArq?.obs || '',
      codigo_categoria: "2.08.02"
    },
    vendedor: {
      nome: _comVend?.nome || '',
      codigo: _comVend?.codigo || '',
      modo: 'percent',
      percent: 1,
      valorManual: 0,
      valorCalculado: Number(vendCalc || 0),
      previsao: _comVend?.prev || '',
      vencimento: _comVend?.venc || '',
      observacao: _comVend?.obs || '',
      codigo_categoria: "2.07.99"
    }
  };

  console.group("🧾 [COMISSÕES] Antes do envio");
  console.log("_comArq:", JSON.parse(JSON.stringify(_comArq || {})));
  console.log("_comVend:", JSON.parse(JSON.stringify(_comVend || {})));
  console.log("_lastTotalBaseMO:", _lastTotalBaseMO);
  console.log("baseVendFinalTotal:", baseVendFinalTotal);
  console.log("comissoesParaEnvio:", JSON.parse(JSON.stringify(comissoesParaEnvio || {})));
  console.groupEnd();

  const totaisPayload = {
    totalAprovadoBaseComMO,
    valorServicos,
    valorDesconto,
    valorComissaoInfo,
    totalFinalProdutos,
    parcelamentoProdutosServicos,
    parcelamentoServicos,
    parcelasProduto: parcelamentoProdutosServicos?.parcelasProduto || [],
    parcelasServico: parcelamentoProdutosServicos?.parcelasServico || [],
    comissoes: {
      baseConsiderada: baseVendFinalTotal,
      arquiteto: { ...comissoesParaEnvio.arquiteto },
      vendedor: { ...comissoesParaEnvio.vendedor },
      total: Math.max(0, Number(arqCalc || 0)) + Math.max(0, Number(vendCalc || 0))
    },
    porCategoria: {
      produto: vv_parseBRL($catProduto.textContent || '0'),
      servico: vv_parseBRL($catServico.textContent || '0'),
      vidro: vv_parseBRL($catVidro.textContent || '0')
    }
  };

  window.vvUltimosTotaisSelecaoItensOmie = totaisPayload;
  window.vvUltimoTotalFinalProdutosOmie  = totalFinalProdutos;
  window.vvTotalAprovadoBaseMO           = totalAprovadoBaseComMO;
  window.vvTotalServicosAplicado         = valorServicos;
  window.vvTotalDescontoAplicado         = valorDesconto;
  window.vvTotalComissaoInfo             = valorComissaoInfo;
  window.vvTotalProdutoCategoria         = totaisPayload.porCategoria.produto;
  window.vvTotalServicoCategoria         = totaisPayload.porCategoria.servico;
  window.vvTotalVidroCategoria           = totaisPayload.porCategoria.vidro;
  window.vvParcelasProdutoOmie           = totaisPayload.parcelasProduto;
  window.vvParcelasServicoOmie           = totaisPayload.parcelasServico;
  window.vvParcelamentoServicosOmie      = parcelamentoServicos;
  window.vvParcelamentoProdutosServicosOmie = parcelamentoProdutosServicos;

  console.log('💾 Totais da seleção Omie gravados em window:', totaisPayload);

  await tentarEnviarComissoes(comissoesParaEnvio);

  if (backdrop && backdrop.parentNode) {
    backdrop.parentNode.removeChild(backdrop);
  }

  resolve({
    aprovadosParaOmie: aprovados,
    ignorados,
    totais: totaisPayload
  });
});

    recalc();
  });
}



/* ======================================================================
   FUNÇÃO GLOBAL DE ENVIO (usa seu backend /api/omie/comissao e
   respeita: codigo_cliente_fornecedor + observacao vindos do front,
   e força codigo_categoria conforme papel)
   ====================================================================== */
(function () {
  if (window.enviarComissoes && window.enviarComissoes.__vvFixCategoriasIndependenteFinal) return;

  const API_URL = "https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com/api/omie/comissao";

  const toISODate = (d) => {
    if (!d) return "";
    return vvDataISO(d);
  };

  function comissaoExiste(fonte) {
    const codigo = String(fonte?.codigo || '').trim();
    return !!codigo;
  }

  function montarLancamento(tipo, fonte, baseConsiderada) {
    const calc = Number(fonte?.valorCalculado || 0);
    const manual = Number(fonte?.valorManual || 0);
    const valor_documento = Number((calc > 0 ? calc : manual).toFixed(2));

    const data_previsao = toISODate(fonte?.previsao || "");
    const data_vencimento = toISODate(fonte?.vencimento || "");

    const tipoNorm = String(tipo || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const codigo_categoria = tipoNorm.includes("arquit")
      ? "2.08.02"
      : "2.07.99";

    return {
      valor_documento,
      data_previsao,
      data_vencimento,
      codigo_categoria,
      tipo: tipoNorm,
      papel: tipoNorm,
      ...(fonte?.codigo ? { codigo_cliente_fornecedor: String(fonte.codigo).trim() } : {}),
      observacao:
        (fonte?.observacao?.trim()
          || `Comissão ${tipo} — ${fonte?.nome || ""} (base: ${Number(baseConsiderada || 0).toFixed(2)})`)
    };
  }

  function validarLancamento(lanc, papel) {
    const erros = [];
    if (!(lanc?.valor_documento > 0)) erros.push("valor_documento inválido");
    if (!lanc?.data_previsao) erros.push("data_previsao ausente");
    if (!lanc?.data_vencimento) erros.push("data_vencimento ausente");
    if (!lanc?.codigo_cliente_fornecedor) erros.push("codigo_cliente_fornecedor ausente");
    if (!lanc?.codigo_categoria) erros.push("codigo_categoria ausente");
    return { valido: erros.length === 0, erros, papel };
  }

  async function postarLancamento(lanc, papel) {
    console.group(`📤 [COMISSÕES] POST ${papel}`);
    console.log("URL:", API_URL);
    console.log("Body:", JSON.parse(JSON.stringify(lanc || {})));
    console.groupEnd();

    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lanc)
      });

      const json = await r.json().catch(() => ({}));

      console.group(`📥 [COMISSÕES] RESPOSTA ${papel}`);
      console.log("HTTP status:", r.status);
      console.log("HTTP ok:", r.ok);
      console.log("JSON:", json);
      console.groupEnd();

      if (!r.ok || json?.ok === false) {
        const msg = json?.error || json?.message || `HTTP ${r.status}`;
        return { ok: false, papel, status: 'erro', erro: msg, resposta: json, enviado: lanc };
      }

      return { ok: true, papel, status: 'enviado', resposta: json, enviado: lanc };
    } catch (e) {
      return { ok: false, papel, status: 'erro', erro: e?.message || "Falha de rede", enviado: lanc };
    }
  }

  window.enviarComissoes = async function (payload) {
    const fonteArq = payload?.arquiteto || {};
    const fonteVend = payload?.vendedor || {};

    const existeArq = comissaoExiste(fonteArq);
    const existeVend = comissaoExiste(fonteVend);

    const lancArq = montarLancamento("arquiteto", fonteArq, payload?.baseConsiderada);
    const lancVend = montarLancamento("vendedor", fonteVend, payload?.baseConsiderada);

    console.group("🧾 [COMISSÕES] Pré-envio");
    console.log("Payload original:", JSON.parse(JSON.stringify(payload || {})));
    console.log("Existe arquiteto?", existeArq, "Código:", fonteArq?.codigo || "");
    console.log("Existe vendedor?", existeVend, "Código:", fonteVend?.codigo || "");
    console.log("Lançamento arquiteto:", JSON.parse(JSON.stringify(lancArq || {})));
    console.log("Lançamento vendedor:", JSON.parse(JSON.stringify(lancVend || {})));
    console.groupEnd();

    let resArq = {
      ok: false,
      status: 'ignorado',
      papel: 'arquiteto',
      erro: 'Comissão não existente (sem código).'
    };

    let resVend = {
      ok: false,
      status: 'ignorado',
      papel: 'vendedor',
      erro: 'Comissão não existente (sem código).'
    };

    if (existeArq) {
      const vArq = validarLancamento(lancArq, "arquiteto");
      if (vArq.valido) {
        resArq = await postarLancamento(lancArq, "arquiteto");
      } else {
        resArq = {
          ok: false,
          status: 'invalido',
          papel: 'arquiteto',
          erro: vArq.erros.join(", "),
          validacao: vArq
        };
      }
    }

    if (existeVend) {
      const vVend = validarLancamento(lancVend, "vendedor");
      if (vVend.valido) {
        resVend = await postarLancamento(lancVend, "vendedor");
      } else {
        resVend = {
          ok: false,
          status: 'invalido',
          papel: 'vendedor',
          erro: vVend.erros.join(", "),
          validacao: vVend
        };
      }
    }

    const okGeral = !!(resArq.ok || resVend.ok);

    const retorno = {
      ok: okGeral,
      resultados: {
        arquiteto: resArq,
        vendedor: resVend
      },
      resumo: {
        existeArquiteto: existeArq,
        existeVendedor: existeVend,
        enviadoArquiteto: !!resArq.ok,
        enviadoVendedor: !!resVend.ok
      }
    };

    console.group("📦 [COMISSÕES] Retorno final");
    console.log(JSON.parse(JSON.stringify(retorno || {})));
    console.groupEnd();

    return retorno;
  };

  window.enviarComissoes.__vvFixCategoriasIndependenteFinal = true;
})();







/* =========================================================
   4) ITENS IGNORADOS → "PRODUTOS FATURADOS DIRETO" (opcional)
   ========================================================= */


// helpers usados acima
function vv_getClienteNome() {
  const exato = document.querySelector(
    '#clientesWrapper > div > div.col-md-6.position-relative.d-flex.align-items-end.gap-2 > div > input.razaoSocial'
  );
  if (exato && exato.value?.trim()) return exato.value.trim();
  if (exato && exato.getAttribute('data-valor-original')) {
    const v = exato.getAttribute('data-valor-original')?.trim();
    if (v) return v;
  }
  const fallback = document.querySelector('#clientesWrapper .cliente-item .razaoSocial');
  return (fallback?.value?.trim() || fallback?.getAttribute('data-valor-original')?.trim() || 'Cliente não identificado');
}
function vv_getNumeroOrcamento() {
  const inp = document.getElementById('numeroOrcamento');
  return (inp?.value ?? inp?.textContent ?? '').toString().trim();
}
function vv_getPrimeiraDataParcelaISO() {
  const first = Array.from(document.querySelectorAll('.data-parcela'))
    .map(el => (el.value || '').trim())
    .find(Boolean);
  if (!first) return null;
  const d = new Date(first);
  if (isNaN(d)) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
}

/* =======================================
   5) GERAR PAYLOAD (estrutura antiga)
   ======================================= */
/* =======================================
   5) GERAR PAYLOAD (estrutura antiga)
   ======================================= */

   function normalizarAmbienteOmie(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function conferirTotalProdutosOmieComMarcador() {
  try {
    const payload = await gerarPayloadOmie();

    if (!payload || !Array.isArray(payload.det)) {
      alert("Não foi possível gerar o payload da Omie para conferência.");
      return;
    }

    const elTotalTela =
      document.getElementById("vv-total-ajustado") ||
      document.getElementById("vv-cat-produto");

    function parseMoedaBR(valor) {
      return Number(
        String(valor || "0")
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0;
    }

    function round2(n) {
      return Math.round((Number(n) || 0) * 100) / 100;
    }

    const itensConsiderados = [];
    let totalOmie = 0;

    payload.det.forEach((item, index) => {
      const produto = item?.produto || {};
      const descricao = produto.descricao || `Item ${index + 1}`;
      const quantidade = Number(produto.quantidade || 0);
      const valorUnitario = Number(produto.valor_unitario || 0);
      const totalItem = round2(quantidade * valorUnitario);

      // ignora zerados
      if (quantidade <= 0 || valorUnitario <= 0 || totalItem <= 0) {
        return;
      }

      totalOmie += totalItem;

      itensConsiderados.push({
        index: index + 1,
        descricao,
        quantidade,
        valorUnitario: round2(valorUnitario),
        totalItem
      });
    });

    totalOmie = round2(totalOmie);

    const totalTela = round2(
      Number(window.vvUltimoTotalFinalProdutosOmie ?? 0) ||
      parseMoedaBR(elTotalTela?.textContent || "0") ||
      (
        parseMoedaBR(document.getElementById("vv-cat-produto")?.textContent || "0") +
        parseMoedaBR(document.getElementById("vv-cat-vidro")?.textContent || "0")
      )
    );
    const bate = Math.abs(totalOmie - totalTela) < 0.01;

    let marcador = document.getElementById("vv-marcador-conferencia-omie");
    if (!marcador && elTotalTela?.parentNode) {
      marcador = document.createElement("div");
      marcador.id = "vv-marcador-conferencia-omie";
      marcador.style.marginTop = "8px";
      marcador.style.padding = "10px 14px";
      marcador.style.borderRadius = "10px";
      marcador.style.fontWeight = "700";
      marcador.style.fontSize = "14px";
      marcador.style.border = "1px solid transparent";
      marcador.style.display = "inline-block";
      marcador.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      elTotalTela.parentNode.appendChild(marcador);
    }

    if (marcador && bate) {
      marcador.style.background = "#e8f7ee";
      marcador.style.color = "#146c2e";
      marcador.style.borderColor = "#b7e4c7";
      marcador.innerHTML = `
        ✅ Total conferido com sucesso<br>
        Omie: <strong>R$ ${totalOmie.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><br>
        Tela: <strong>R$ ${totalTela.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      `;
    } else if (marcador) {
      marcador.style.background = "#fdecec";
      marcador.style.color = "#a61b1b";
      marcador.style.borderColor = "#f5b5b5";
      marcador.innerHTML = `
        ❌ Divergência encontrada no total<br>
        Omie: <strong>R$ ${totalOmie.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><br>
        Tela: <strong>R$ ${totalTela.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><br>
        Diferença: <strong>R$ ${round2(totalOmie - totalTela).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      `;
    }

    console.group("🔎 Conferência total produtos Omie");
    console.log("Payload gerado:", payload);
    console.table(itensConsiderados);
    console.log("Total Omie:", totalOmie);
    console.log("Total Tela (#vv-cat-produto):", totalTela);
    console.log("Bate?", bate ? "SIM" : "NÃO");
    console.groupEnd();

    return {
      bate,
      totalOmie,
      totalTela,
      diferenca: round2(totalOmie - totalTela),
      itensConsiderados
    };

  } catch (erro) {
    console.error("Erro ao conferir total da Omie:", erro);
    alert("Erro ao conferir total da Omie. Veja o console.");
  }
}

async function gerarPayloadOmie() {
  const pendencias = [];

  const vendedorSelectEl = document.getElementById("vendedorResponsavel");
  const textoSelecionado =
    vendedorSelectEl?.options?.[vendedorSelectEl.selectedIndex]?.text?.trim() ||
    vendedorSelectEl?.value?.trim() ||
    "";

  const clientes = document.querySelectorAll("#clientesWrapper .cliente-item");
  const codigoCliente = clientes[0]?.querySelector(".codigoCliente")?.value?.trim();

  if (!codigoCliente) pendencias.push("Código do cliente não preenchido.");

  if (!textoSelecionado || textoSelecionado.toUpperCase() === "SELECIONE") {
    pendencias.push("Selecione um Vendedor Responsável válido.");
  }

  let primeiraDataParcelaRaw = Array.from(document.querySelectorAll(".data-parcela"))
    .map(el => (el.value || "").trim())
    .find(Boolean);

  let primeiraDataParcela = typeof formatarDataBR === "function"
    ? formatarDataBR(primeiraDataParcelaRaw)
    : "";


  let linhasParcelas = document.querySelectorAll("#listaParcelas .row");

  const blocosContainer = document.getElementById("blocosProdutosContainer");
  const temProdutosNaTela =
    !!blocosContainer &&
    (
      blocosContainer.querySelectorAll("table tbody tr:not(.extra-summary-row)").length > 0 ||
      blocosContainer.querySelectorAll("tbody tr:not(.extra-summary-row)").length > 0
    );

  if (!temProdutosNaTela) {
    pendencias.push("Nenhum produto listado na proposta (blocosProdutosContainer vazio).");
  }

  if (pendencias.length > 0) {
    if (typeof mostrarPopupPendencias === "function") {
      mostrarPopupPendencias(pendencias);
    } else {
      alert("Pendências:\n- " + pendencias.join("\n- "));
    }
    return null;
  }

  async function esperarSelectCarregar(selectId, {
    minOptions = 2,
    timeoutMs = 15000,
    intervalMs = 200
  } = {}) {
    const inicio = Date.now();

    while (Date.now() - inicio < timeoutMs) {
      const sel = document.getElementById(selectId);
      if (sel && sel.options && sel.options.length >= minOptions) return sel;
      await new Promise(r => setTimeout(r, intervalMs));
    }

    return document.getElementById(selectId) || null;
  }

  function normalizarTexto(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function classificarTipoItem(item) {
    const desc = normalizarTexto(item?.descricao || "");
    if (/^vidros?\b/.test(desc)) return "vidro";
    if (desc.includes("mao de obra de instalacao") && desc.includes("(por hora)")) return "servico";
    return "produto";
  }

  function parseValorParcela(elValor) {
    const rawValor =
      (elValor?.value ??
        elValor?.textContent ??
        elValor?.innerText ??
        "")
        .toString()
        .trim();

    if (typeof vv_parseBRL === "function") {
      return vv_parseBRL(rawValor);
    }

    return Number(
      rawValor
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0;
  }

  function obterDataParcelaFormatada(linha) {
    const elData = linha.querySelector(".data-parcela") || linha.querySelector("input[type='date']");
    const dataISO = elData?.value || "";

    if (!dataISO) return "";

    return typeof formatarDataBR === "function"
      ? formatarDataBR(dataISO)
      : dataISO;
  }

  function round2(valor) {
    if (typeof vv_round2 === "function") return vv_round2(valor);
    return Math.round((Number(valor) || 0) * 100) / 100;
  }

  function parseMoedaBR(texto) {
    return Number(
      String(texto || "0")
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0;
  }

  function formatarMoedaBR(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function atualizarMarcadorConferencia(totalOmie, totalTela) {
    const bate = Math.abs(round2(totalOmie) - round2(totalTela)) < 0.01;

    const elTotalTela =
      document.getElementById("vv-total-ajustado") ||
      document.getElementById("vv-cat-produto");
    if (!elTotalTela || !elTotalTela.parentNode) {
      console.warn("⚠️ Elemento #vv-cat-produto não encontrado para marcador visual.");
      return { bate, totalOmie, totalTela, diferenca: round2(totalOmie - totalTela) };
    }

    let marcador = document.getElementById("vv-marcador-conferencia-omie");

    if (!marcador) {
      marcador = document.createElement("div");
      marcador.id = "vv-marcador-conferencia-omie";
      marcador.style.marginTop = "8px";
      marcador.style.padding = "10px 14px";
      marcador.style.borderRadius = "10px";
      marcador.style.fontWeight = "700";
      marcador.style.fontSize = "13px";
      marcador.style.lineHeight = "1.45";
      marcador.style.display = "inline-block";
      marcador.style.border = "1px solid transparent";
      marcador.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      elTotalTela.parentNode.appendChild(marcador);
    }

    if (bate) {
      marcador.style.background = "#eaf8ee";
      marcador.style.color = "#166534";
      marcador.style.borderColor = "#bbf7d0";
      marcador.innerHTML = `
        ✅ Total dos produtos confere com a Omie<br>
        Omie: <strong>R$ ${formatarMoedaBR(totalOmie)}</strong><br>
        Tela: <strong>R$ ${formatarMoedaBR(totalTela)}</strong>
      `;
    } else {
      marcador.style.background = "#fef0f0";
      marcador.style.color = "#b42318";
      marcador.style.borderColor = "#fecdca";
      marcador.innerHTML = `
        ❌ Divergência no total dos produtos<br>
        Omie: <strong>R$ ${formatarMoedaBR(totalOmie)}</strong><br>
        Tela: <strong>R$ ${formatarMoedaBR(totalTela)}</strong><br>
        Diferença: <strong>R$ ${formatarMoedaBR(round2(totalOmie - totalTela))}</strong>
      `;
    }

    return {
      bate,
      totalOmie: round2(totalOmie),
      totalTela: round2(totalTela),
      diferenca: round2(totalOmie - totalTela)
    };
  }

  async function pegarVendedorSelecionadoComCodigo(selectId = "vendedorResponsavel") {
    const select = await esperarSelectCarregar(selectId, { minOptions: 2, timeoutMs: 15000 });
    if (!select) return null;

    const opt = select.options?.[select.selectedIndex];
    const nomeSelecionado = (
      opt?.text ||
      select.value ||
      select.getAttribute("data-valor-original") ||
      ""
    ).trim();

    if (!nomeSelecionado || nomeSelecionado.toUpperCase() === "SELECIONE") {
      return null;
    }

    const normalizar = (s) =>
      (s ?? "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const nomeNorm = normalizar(nomeSelecionado);

    const lista = Array.isArray(VENDEDORES_FIXOS_FALLBACK?.cadastro)
      ? VENDEDORES_FIXOS_FALLBACK.cadastro
      : [];

    if (!lista.length) {
      console.warn("⚠️ VENDEDORES_FIXOS_FALLBACK.cadastro está vazio ou inexistente.");
      return null;
    }

    let match = lista.find(v => normalizar(v?.nome) === nomeNorm);

    if (!match) {
      const candidatos = lista.filter(v => {
        const nomeApi = normalizar(v?.nome);
        return nomeApi.includes(nomeNorm) || nomeNorm.includes(nomeApi);
      });

      if (candidatos.length === 1) {
        match = candidatos[0];
      } else if (candidatos.length > 1) {
        match = candidatos.find(v => String(v?.inativo || "").toUpperCase() === "N") || candidatos[0];
      }
    }

    if (!match) {
      const codigoDigitado = (document.getElementById("codigoVendedor")?.value || "").trim();
      if (codigoDigitado) {
        match = lista.find(v => String(v?.codigo || "").trim() === codigoDigitado);
      }
    }

    if (!match) {
      console.warn("⚠️ Não foi possível localizar vendedor na variável fixa.", {
        nomeSelecionado,
        nomeNorm,
        lista
      });
      return null;
    }

    return {
      nomeSelect: nomeSelecionado,
      nomeApi: match.nome,
      codigo: Number(match.codigo)
    };
  }

  const vendedorInfo = await pegarVendedorSelecionadoComCodigo("vendedorResponsavel");

  if (!vendedorInfo?.codigo) {
    alert("Selecione um Vendedor Responsável válido (não foi possível recuperar o código).");
    return null;
  }

  const ambientesMarcados = (typeof lerAmbientesMarcados === "function")
    ? lerAmbientesMarcados()
    : [];

  const candidatos = coletarItensPorGrupoParaOmie(ambientesMarcados);

  if (!candidatos.length) {
    alert("Nenhum item elegível encontrado nos ambientes marcados.");
    return null;
  }

  const selecao = await abrirPopupSelecaoItensOmie(candidatos);

  if (!selecao) {
    console.log("🚫 Seleção cancelada pelo usuário.");
    return null;
  }

  const { aprovadosParaOmie, ignorados, totais } = selecao;

  if (!aprovadosParaOmie.length) {
    alert("Selecione ao menos um item para enviar à Omie.");
    return null;
  }

  window.__vvUltimaSelecaoOmie = selecao;

  try {
    if (typeof produtosFaturadosParaOCliente === "function") {
      produtosFaturadosParaOCliente(ignorados);
    }
  } catch (e) {
    console.warn("produtosFaturadosParaOCliente falhou:", e);
  }

  const parcelasProdutoParaEnvio = vvObterParcelasProdutoParaEnvioOmie(totais?.parcelasProduto || null);
  const parcelasProdutoSemData = parcelasProdutoParaEnvio
    .map((parcela, index) => ({ parcela, index }))
    .filter(item => !formatarDataBR(item.parcela?.vencimento));

  if (!parcelasProdutoParaEnvio.length) {
    alert("Nenhuma parcela de produto valida foi informada para enviar a Omie.");
    return null;
  }

  if (parcelasProdutoSemData.length) {
    alert(
      "Preencha a data de vencimento das parcelas de produto antes de enviar a Omie.\n" +
      parcelasProdutoSemData.map(item => `Parcela ${item.index + 1}`).join(", ")
    );
    return null;
  }

  const parcelasProdutoPayloadOmie = vvMontarParcelasProdutoPayloadOmie(parcelasProdutoParaEnvio);
  primeiraDataParcela = parcelasProdutoPayloadOmie[0]?.data_vencimento || "";

  if (!primeiraDataParcela) {
    alert("Data da 1a parcela de produto nao preenchida.");
    return null;
  }

  const numeroPedido = (typeof gerarNumeroPedidoUnico === "function")
    ? gerarNumeroPedidoUnico()
    : ("PED-" + Date.now());

  const payload = {
    cabecalho: {
      codigo_cliente: codigoCliente,
      codigo_pedido_integracao: numeroPedido,
      data_previsao: primeiraDataParcela,
      etapa: "10",
      numero_pedido: numeroPedido,
      codigo_parcela: "999",
      quantidade_itens: 0
    },
    det: [],
    lista_parcelas: { parcela: [] },
    frete: { modalidade: "9" },
    informacoes_adicionais: {
      codigo_categoria: "1.01.01",
      codigo_conta_corrente: 2523861035,
      consumidor_final: "S",
      enviar_email: "S",
      codVend: vendedorInfo.codigo
    },
    agropecuario: {
      cNumReceita: "",
      cCpfResponsavel: "",
      nTipoGuia: 1,
      cUFGuia: "",
      cSerieGuia: "",
      nNumGuia: 1
    }
  };

  const aprovadosSomenteProdutos = aprovadosParaOmie.filter(item => {
    const tipo = classificarTipoItem(item);
    return tipo === "produto" || tipo === "vidro";
  });

  const itensConsideradosNoTotal = [];
  let totalProdutosOmie = 0;

  aprovadosSomenteProdutos.forEach((item, index) => {
    const codigo_produto = String(item.codigo || "").trim();

    if (!codigo_produto) {
      console.warn("⛔ Produto sem código Omie:", item);
      return;
    }

    const descricao = String(item.descricao || "Item sem descrição").trim();

    let quantidade = Number(item.quantidade || 1);
    if (!quantidade || quantidade <= 0) quantidade = 1;

    let valor_unitario = Number(item.valorUnitarioItem || 0);

    if ((!valor_unitario || valor_unitario <= 0) && Number(item.valorTotalItem || 0) > 0) {
      valor_unitario = quantidade > 0
        ? Number((Number(item.valorTotalItem) / quantidade).toFixed(2))
        : Number(Number(item.valorTotalItem).toFixed(2));
    }

    if ((!valor_unitario || valor_unitario <= 0) && Number(item.valorAjustadoParaOmie || 0) > 0) {
      valor_unitario = Number(item.valorAjustadoParaOmie || 0);
      quantidade = 1;
    }

    quantidade = round2(quantidade);
    valor_unitario = round2(valor_unitario);

    if (!valor_unitario || valor_unitario <= 0) {
      console.warn("⛔ Produto sem valor_unitario válido:", item);
      return;
    }

    const totalItem = round2(quantidade * valor_unitario);

    if (!totalItem || totalItem <= 0) {
      console.warn("⛔ Produto com total zerado ignorado:", item);
      return;
    }

    payload.det.push({
      ide: {
        codigo_item_integracao: `${numeroPedido}-${index + 1}`
      },
      inf_adic: {
        peso_bruto: 1,
        peso_liquido: 1
      },
      produto: {
        cfop: "5.102",
        codigo_produto,
        descricao,
        ncm: "9403.30.00",
        quantidade,
        tipo_desconto: "V",
        unidade: "UN",
        valor_desconto: 0,
        valor_unitario
      }
    });

    payload.cabecalho.quantidade_itens++;

    totalProdutosOmie += totalItem;

    itensConsideradosNoTotal.push({
      index: index + 1,
      codigo_produto,
      descricao,
      quantidade,
      valor_unitario,
      totalItem
    });
  });

  totalProdutosOmie = round2(totalProdutosOmie);

  if (!payload.det.length) {
    alert("Nenhum item válido foi montado para envio à Omie. Verifique código Omie e valor dos produtos.");
    return null;
  }

  // Garante que a soma dos itens bate com o Total parcelado (produtos) confirmado no popup de parcelas.
  // Se o usuário ajustou as parcelas (ex: faturamento direto, arredondamentos), o valor correto a
  // enviar é a soma das parcelas de produto — não o total calculado internamente.
  const totalParceladoProdutos = round2(
    (parcelasProdutoParaEnvio || [])
      .reduce((s, p) => s + Number(p?.valor || 0), 0)
  );

  if (totalParceladoProdutos > 0 && Math.abs(totalParceladoProdutos - totalProdutosOmie) >= 0.01) {
    const fator = totalParceladoProdutos / totalProdutosOmie;
    let acumulado = 0;

    payload.det.forEach((item, idx) => {
      if (idx < payload.det.length - 1) {
        const novoValor = round2(item.produto.valor_unitario * fator);
        acumulado = round2(acumulado + novoValor * item.produto.quantidade);
        item.produto.valor_unitario = novoValor;
      } else {
        // último item absorve o resíduo de arredondamento
        const restante = round2(totalParceladoProdutos - acumulado);
        item.produto.valor_unitario = round2(
          item.produto.quantidade > 0 ? restante / item.produto.quantidade : restante
        );
      }
    });

    console.log(
      `[payload] valor_unitario reescalado: ${totalProdutosOmie} → ${totalParceladoProdutos} (fator ${fator.toFixed(6)})`
    );
    totalProdutosOmie = totalParceladoProdutos;
  }

  payload.lista_parcelas.parcela = parcelasProdutoPayloadOmie;

  const totalTelaProdutos = round2(
    Number(window.vvUltimoTotalFinalProdutosOmie ?? 0) ||
    parseMoedaBR(document.getElementById("vv-total-ajustado")?.textContent || "0") ||
    (
      parseMoedaBR(document.getElementById("vv-cat-produto")?.textContent || "0") +
      parseMoedaBR(document.getElementById("vv-cat-vidro")?.textContent || "0")
    )
  );

  const resumoConferencia = atualizarMarcadorConferencia(totalProdutosOmie, totalTelaProdutos);

  window.__vvResumoPayloadOmie = {
    numeroPedido,
    totalProdutosOmie,
    totalTelaProdutos,
    diferenca: round2(totalProdutosOmie - totalTelaProdutos),
    itensConsideradosNoTotal,
    resumoConferencia
  };

  console.group("✅ Payload de produtos gerado");
  console.log("Payload:", payload);
  console.table(itensConsideradosNoTotal);
  console.log("Total produtos Omie:", totalProdutosOmie);
  console.log("Total tela (#vv-cat-produto):", totalTelaProdutos);
  console.log("Resumo conferência:", resumoConferencia);
  console.log("🛠️ Valor de serviços separado para OS:", totais?.valorServicos || 0);
  console.groupEnd();

  return payload;
}



/* =======================================
   6) ENVIAR PARA OMIE (botão/onclick)
   ======================================= */
async function atualizarNaOmie() {

  const botao =
    document.getElementById("btn-gerar-pedido") ||
    document.getElementById("btnEnviarOmie") ||
    document.getElementById("btn-editar");

  const spinner =
    document.getElementById("spinnerOmie") ||
    document.getElementById("loadingSpinner");

  const abrirStatus = (titulo, mensagem, tipo = "info") => {
    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado(titulo, mensagem, tipo);
    } else {
      console.log(`[${tipo}] ${titulo}: ${mensagem}`);
    }
  };

  const montarTextoResposta = (dataOrText) => {
    try {
      if (typeof dataOrText === "string") return dataOrText;
      return JSON.stringify(dataOrText, null, 2);
    } catch {
      return String(dataOrText || "");
    }
  };

  const alertServer = (titulo, status, dataOrText) => {
    const corpo = montarTextoResposta(dataOrText);
    alert(`${titulo}\nHTTP: ${status}\n\n${corpo}`);
  };

  const readJsonOrText = async (res) => {
    const raw = await res.text();
    try {
      return { parsed: JSON.parse(raw), raw };
    } catch {
      return { parsed: null, raw };
    }
  };

  try {
    if (typeof mostrarCarregando === "function") {
      mostrarCarregando();
    }

    if (spinner) spinner.style.display = "inline-block";
    if (botao) botao.disabled = true;

    abrirStatus(
      "⏳ Iniciando envio",
      "Estamos preparando o pedido de produtos e os serviços.",
      "info"
    );

    const payload = await gerarPayloadOmie();

    if (!payload) {
      throw new Error("Não foi possível gerar o payload para envio.");
    }

    console.log("📦 Payload gerado (produtos):", payload);

    // =========================================================
    // 1) ENVIO DE PRODUTOS
    // =========================================================
    abrirStatus(
      "📦 Enviando produtos",
      "Os produtos estão sendo enviados para a Omie.",
      "info"
    );

    const respostaProdutos = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/omie/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`
      },
      body: JSON.stringify(payload)
    });

    const retornoProdutos = await readJsonOrText(respostaProdutos);

    console.log("📥 Resposta /pedidos:", respostaProdutos.status, retornoProdutos.parsed ?? retornoProdutos.raw);

    if (!respostaProdutos.ok) {
      alertServer(
        "❌ ERRO AO ENVIAR PRODUTOS",
        respostaProdutos.status,
        retornoProdutos.parsed ?? retornoProdutos.raw
      );

      throw new Error(
        retornoProdutos?.parsed?.error ||
        retornoProdutos?.parsed?.erro ||
        retornoProdutos?.parsed?.message ||
        retornoProdutos?.raw ||
        "Erro ao incluir pedido na Omie."
      );
    }

    const numeroPedido =
      retornoProdutos?.parsed?.numeroPedido ||
      retornoProdutos?.parsed?.pedido?.numeroPedido ||
      retornoProdutos?.parsed?.nCodPed ||
      document.getElementById("numeroPedido")?.value ||
      "";

    alertServer(
      "✅ PRODUTOS ENVIADOS COM SUCESSO",
      respostaProdutos.status,
      retornoProdutos.parsed ?? retornoProdutos.raw
    );

    abrirStatus(
      "✅ Produtos enviados",
      `Produtos enviados com sucesso. Pedido nº ${numeroPedido}.`,
      "success"
    );

    // =========================================================
    // 2) OBTÉM TOTAIS / PARCELAS DE SERVIÇO
    // =========================================================
    const totais =
      window.vvUltimosTotaisSelecaoItensOmie ||
      payload?.totais ||
      null;

    const valorServicos = Number(
      totais?.valorServicos ||
      window.vvTotalServicosAplicado ||
      0
    );

    const parcelasServicoCorretas = obterParcelasServicoCorretas(
      totais?.parcelasServico || null
    );

    console.group("🔎 Dados recuperados para envio de serviços");
    console.log("totais:", totais);
    console.log("valorServicos:", valorServicos);
    console.log("parcelasServicoCorretas:", parcelasServicoCorretas);
    console.groupEnd();

    // =========================================================
    // 3) ENVIO DE SERVIÇOS
    // =========================================================
    let houveTentativaDeServico = false;
    let servicosEnviadosComSucesso = false;

    if (valorServicos > 0) {
      houveTentativaDeServico = true;

      abrirStatus(
        "🛠️ Enviando serviços",
        "Agora estamos enviando os serviços na estrutura própria da OS.",
        "info"
      );

      const osResp = await enviarOSServico({
        valorServicos,
        parcelasServico: parcelasServicoCorretas
      });

      console.log("📥 Resposta /os:", osResp);

      if (osResp?.ok) {
        servicosEnviadosComSucesso = true;

        alertServer(
          "✅ SERVIÇOS ENVIADOS COM SUCESSO",
          osResp?.status || 200,
          osResp
        );

        abrirStatus(
          "✅ Serviços enviados",
          "Os serviços foram enviados com sucesso na estrutura própria da OS.",
          "success"
        );
      } else {
        alertServer(
          "❌ ERRO AO ENVIAR SERVIÇOS",
          osResp?.status || "sem status",
          osResp
        );

        abrirStatus(
          "❌ Falha no envio dos serviços",
          osResp?.error ||
            osResp?.erro ||
            osResp?.message ||
            "Os serviços não puderam ser enviados.",
          "error"
        );
      }
    } else {
      abrirStatus(
        "ℹ️ Sem serviços para enviar",
        "Nenhum serviço foi selecionado para envio nesta operação.",
        "info"
      );
    }

    // =========================================================
    // 4) RESUMO FINAL
    // =========================================================
    if (!houveTentativaDeServico) {
      abrirStatus(
        "✅ Processo concluído",
        `Produtos enviados com sucesso. Pedido nº ${numeroPedido}.`,
        "success"
      );
    } else if (servicosEnviadosComSucesso) {
      abrirStatus(
        "✅ Processo concluído",
        `Produtos e serviços enviados com sucesso. Pedido nº ${numeroPedido}.`,
        "success"
      );
    } else {
      abrirStatus(
        "⚠️ Processo concluído parcialmente",
        `Produtos enviados com sucesso no pedido nº ${numeroPedido}, mas houve falha no envio dos serviços.`,
        "warning"
      );
    }

    console.info("[Omie] Proposta nao foi atualizada no Heroku apos o envio; parcelas usadas apenas para este envio.");

  } catch (erro) {
    console.error("❌ Erro em atualizarNaOmie:", erro);

    abrirStatus(
      "❌ Erro no processo",
      erro?.message || "Ocorreu um erro durante o envio.",
      "error"
    );

    alert(`❌ Erro no processo\n\n${erro?.message || erro}`);
  } finally {
    if (spinner) spinner.style.display = "none";
    if (botao) botao.disabled = false;

    if (typeof ocultarCarregando === "function") {
      ocultarCarregando();
    }
  }
}

const API_BASE_PRODUTOS = 'https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com'; 
// TROQUE isso pela URL real quando publicar o server.

// =============================
// 🔹 Função GLOBAL: primeiro insumo da tabela do grupo
// =============================
// =============================
// 🔹 GLOBAL: primeiro insumo do grupo (continua igual)
// =============================
// =============================
// 🔹 Função GLOBAL: primeiro insumo do grupo
// =============================
// =============================
// 🔹 Lista COMPLETA de insumos do grupo (linhas da tabela)
//     Pega coluna "Quantidade" e "Valor de Custo Final"
// =============================
// =============================
// 🔹 Pega o nome do grupo no accordion
//     <span id="titulo-accordion-bloco-0">Vidro</span>
// =============================
window.getNomeGrupo = function (grupoId) {
  if (!grupoId) return '';

  const span = document.querySelector(`#titulo-accordion-${grupoId}`);
  if (!span) {
    console.warn(
      `⚠️ Não encontrei #titulo-accordion-${grupoId} para pegar o nome do grupo.`
    );
    return '';
  }

  const nome = (span.textContent || '').trim();
  console.log(`🏷️ Nome do grupo (${grupoId}):`, nome);
  return nome;
};

// =============================
// 🔹 Lista COMPLETA de insumos do grupo (linhas da tabela)
//     Pega coluna "Quantidade" (6ª) e "Valor de Custo Final" (3ª)
// =============================
window.getListaInsumosGrupo = function (grupoId) {
  if (!grupoId) return [];

  const tabela = document.querySelector(`#tabela-${grupoId}`);
  if (!tabela) return [];

  const theadRow = tabela.querySelector('thead tr');
  const tbody    = tabela.querySelector('tbody');
  if (!theadRow || !tbody) return [];

  const ths = Array.from(theadRow.querySelectorAll('th'));

  let idxCodigo          = -1;
  let idxDescricao       = -1;
  let idxUnidade         = -1;
  let idxQuantidade      = -1;
  let idxValorCustoFinal = -1;

  // tenta detectar pelos textos (caso mude a ordem no futuro)
  ths.forEach((th, i) => {
    const txt = (th.textContent || '').trim().toLowerCase();

    if (txt.includes('código') || txt.includes('codigo'))   idxCodigo    = i;
    if (txt.includes('descrição') || txt.includes('descricao')) idxDescricao = i;
    if (txt.includes('unidade') || txt.includes('un.'))     idxUnidade   = i;
    if (txt.includes('quantidade'))                         idxQuantidade = i;
    if (txt.includes('valor de custo final'))               idxValorCustoFinal = i;
  });

  // 👇 Força os índices conforme você informou:
  // 3ª coluna = valor, 6ª coluna = quantidade
  if (ths.length >= 3) idxValorCustoFinal = 2;  // índice 2 = 3ª coluna
  if (ths.length >= 6) idxQuantidade      = 5;  // índice 5 = 6ª coluna

  if (idxQuantidade === -1) {
    console.warn(
      `⚠️ Não encontrei coluna "Quantidade" em #tabela-${grupoId}. Confere o texto do cabeçalho/ordem.`
    );
  }

  if (idxValorCustoFinal === -1) {
    console.warn(
      `⚠️ Não encontrei coluna "Valor de Custo Final" em #tabela-${grupoId}. Confere o texto do cabeçalho/ordem.`
    );
  }

  // helper para pegar valor atual da célula (input > span > texto)
  function extrairTextoCelula(td) {
    if (!td) return '';
    const input = td.querySelector('input');
    if (input) return input.value || '';
    const span = td.querySelector('span');
    if (span) return (span.textContent || '').trim();
    return (td.textContent || '').trim();
  }

  const linhas = Array.from(tbody.querySelectorAll('tr'));
  const insumos = [];

  linhas.forEach((tr, index) => {
    const tds = tr.querySelectorAll('td');

    insumos.push({
      ordem: index + 1,
      codigo:           idxCodigo          >= 0 ? extrairTextoCelula(tds[idxCodigo])          : '',
      descricao:        idxDescricao       >= 0 ? extrairTextoCelula(tds[idxDescricao])       : '',
      unidade:          idxUnidade         >= 0 ? extrairTextoCelula(tds[idxUnidade])         : '',
      quantidade:       idxQuantidade      >= 0 ? extrairTextoCelula(tds[idxQuantidade])      : '',
      valorCustoFinal:  idxValorCustoFinal >= 0 ? extrairTextoCelula(tds[idxValorCustoFinal]) : '',
    });
  });

  console.log(`🧾 Insumos lidos da tabela do grupo ${grupoId}:`, insumos);
  return insumos;
};

// =============================
// 🔹 Helper: converter número BR
//     "R$ 1.234,56"  → 1234.56
//     "159.698,78"   → 159698.78
//     "159698.78"    → 159698.78
// =============================
function parseNumeroBR(valor) {
  if (valor == null) return 0;
  if (typeof valor === 'number') return valor;

  let str = String(valor).trim();
  if (!str) return 0;

  // remove tudo que não é dígito, vírgula, ponto ou sinal
  str = str.replace(/[^\d.,-]/g, '');

  if (!str) return 0;

  const hasComma = str.includes(',');
  const hasDot   = str.includes('.');

  if (hasComma && hasDot) {
    // formato "1.234,56" → tira pontos de milhar e troca vírgula por ponto
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // formato "1234,56" → vírgula como decimal
    str = str.replace(',', '.');
  } else {
    // apenas ponto ou só números → deixa como está
  }

  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

// =============================
// 🔹 Função GLOBAL: valores vindos do popup do grupo
//    (Total produtos após ajuste / Total (Produto) / Total (Serviço))
// =============================
window.getValoresPopupGrupo = function (grupoId, valorGrupoFallback = 0) {
  const popupData =
    (window.groupPopupsData && window.groupPopupsData[grupoId]) || {};

  // 🟦 Total produtos após ajuste  → valorTotalPedido
  const rawTotalProdutosAjuste =
    popupData.totalProdutosAposAjuste ??
    popupData.totalProdutosAjustado ??
    popupData.totalProdutosAjuste ??
    popupData.totalPedidoComDesconto ??
    null;

  // 🟩 Total (Produto)
  const rawProdutos =
    popupData.totalProdutos ??
    popupData.totalProduto ??
    popupData.valorTotalNFProdutos ??
    0;

  // 🟥 Total (Serviço)
  const rawServicos =
    popupData.totalServicos ??
    popupData.totalServico ??
    popupData.valorTotalNFServicos ??
    0;

  const totalPedidoCalc =
    rawTotalProdutosAjuste != null
      ? Number(rawTotalProdutosAjuste)
      : Number(rawProdutos || 0) + Number(rawServicos || 0);

  return {
    valorTotalPedido:
      Number.isFinite(totalPedidoCalc) && totalPedidoCalc > 0
        ? totalPedidoCalc
        : Number(valorGrupoFallback) || 0,

    valorTotalNFProdutos: Number(rawProdutos) || 0,
    valorTotalNFServicos: Number(rawServicos) || 0,
  };
};

// =============================
// 🔹 Função principal: cada INSUMO vira um PRODUTO enviado
// =============================
window.produtosFaturadosParaOCliente = async function (ignorados) {
  try {
    if (!Array.isArray(ignorados) || !ignorados.length) return null;

    const clienteNome     = vv_getClienteNome?.() || '';
    const numeroOrcamento = vv_getNumeroOrcamento?.() || '';
    const previsaoISO     = vv_getPrimeiraDataParcelaISO?.() || null;

    const totaisSelecao = window.vvUltimosTotaisSelecaoItensOmie || null;

    const valorTotalPedidoAjustado =
      (typeof window.vvUltimoTotalFinalProdutosOmie === 'number'
        ? window.vvUltimoTotalFinalProdutosOmie
        : totaisSelecao?.totalFinalProdutos) || 0;

    console.log('💰 Valor total do pedido ajustado (usado nos docs):', valorTotalPedidoAjustado);
    console.log(
      '📊 Totais completos da seleção Omie disponíveis em window.vvUltimosTotaisSelecaoItensOmie:',
      totaisSelecao
    );

    const docs = [];

    // 🔁 Para cada GRUPO ignorado…
    ignorados.forEach((item) => {
      const valorGrupo = Number(item.valorTotalGrupo) || 0;

      // 🏷️ Nome do grupo (produto acabado)
      const nomeGrupo =
        (typeof window.getNomeGrupo === 'function'
          ? window.getNomeGrupo(item.grupoId)
          : '') || '';

      const nomePrimeiroInsumo =
        (typeof window.getPrimeiroInsumoDescricao === 'function'
          ? window.getPrimeiroInsumoDescricao(item.grupoId)
          : '') ||
        item.descricao ||
        '';

      const insumosGrupo =
        typeof window.getListaInsumosGrupo === 'function'
          ? window.getListaInsumosGrupo(item.grupoId)
          : [];

      let valorNFProdutosGrupo = 0;
      let valorNFServicosGrupo = 0;

      if (typeof window.getValoresPopupGrupo === 'function') {
        const r = window.getValoresPopupGrupo(item.grupoId, valorGrupo) || {};
        valorNFProdutosGrupo = Number(r.valorTotalNFProdutos) || 0;
        valorNFServicosGrupo = Number(r.valorTotalNFServicos) || 0;
      }

      const valorTotalNFProdutos =
        totaisSelecao?.porCategoria?.produto ?? valorNFProdutosGrupo;

      const valorTotalNFServicos =
        totaisSelecao?.porCategoria?.servico ?? valorNFServicosGrupo;

      // 🔸 Caso não haja linhas de insumo na tabela, cria doc único do grupo
      if (!insumosGrupo.length) {
        console.warn(
          `⚠️ Grupo ${item.grupoId} não tem linhas de insumos na tabela. Criando doc único do grupo.`
        );

        const docGrupoFallback = {
          numeroPedido: String(numeroOrcamento || ''),
          cliente: clienteNome || '',
          fornecedor: '',
          vidro: nomePrimeiroInsumo || nomeGrupo,
          tipo: '',
          quantidade: 1,

          grupoNome: nomeGrupo,
          grupoTipo: 'PRODUTO_ACABADO',
          produtoAcabadoCodigo: item.codigo || '',
          produtoAcabadoDescricao: nomeGrupo || nomePrimeiroInsumo,
          produtoAcabadoGrupoId: item.grupoId || '',
          produtoAcabadoAmbiente: item.ambiente || '',

          orcamentoEnviado: '',
          aprovacao: '',
          moldeEnviado: '',
          recebemosLinkPagamento: '',
          pagamento: 'Pendente',

          previsao: previsaoISO ? new Date(previsaoISO) : null,
          numeroPedidoFornecedor: '',
          vidrosProntos: null,
          naEmpresa: null,

          faturamento: 'Pendente',
          responsavelVendedor: '',
          numeroOrcFornecedor: '',

          valorTotalPedido: valorTotalPedidoAjustado,
          valorTotalFaturamentoDiretoOrcado: valorGrupo,
          valorAproximadoUF: 0,

          valorTotalNFProdutos,
          valorTotalNFServicos,

          valorReal: valorGrupo,
          residuoDiferencaFaturamentoServico: 0,

          numeroNotaFiscal: '',
          formaPagamento: '',

          observacao: `Ignorado no envio à Omie | Ambiente: ${item.ambiente || '-'} | Grupo: ${
            item.grupoId || '-'
          } | Código: ${item.codigo || '-'}`,

          meta: {
            origem: 'produtosFaturadosParaOCliente',
            numeroOrcamento: numeroOrcamento || null,
            chavePopup: item.key || null,
            totaisSelecaoOmie: totaisSelecao
              ? {
                  totalAprovadoBaseComMO: totaisSelecao.totalAprovadoBaseComMO ?? 0,
                  valorServicos:         totaisSelecao.valorServicos         ?? 0,
                  valorDesconto:         totaisSelecao.valorDesconto         ?? 0,
                  valorComissaoInfo:     totaisSelecao.valorComissaoInfo     ?? 0,
                  totalFinalProdutos:    totaisSelecao.totalFinalProdutos    ?? 0,
                  porCategoria: {
                    produto: totaisSelecao.porCategoria?.produto ?? 0,
                    servico: totaisSelecao.porCategoria?.servico ?? 0,
                    vidro:   totaisSelecao.porCategoria?.vidro   ?? 0,
                  },
                }
              : null,
            infoGrupo: {
              grupoId: item.grupoId || null,
              ambiente: item.ambiente || null,
              codigoGrupo: item.codigo || null,
              nomeGrupo,
            },
          },
        };

        console.log('📦 Documento (FALLBACK GRUPO) pronto para envio:', docGrupoFallback);
        docs.push(docGrupoFallback);
        return;
      }

      // 🔁 Para cada INSUMO da tabela, criamos um "produto" individual
      insumosGrupo.forEach((insumo) => {
        const valorTotalInsumo = parseNumeroBR(insumo.valorCustoFinal);
        const quantidadeInsumo = parseNumeroBR(insumo.quantidade) || 1;

        const valorUnitarioInsumo =
          valorTotalInsumo && quantidadeInsumo
            ? valorTotalInsumo / quantidadeInsumo
            : valorTotalInsumo;

        const doc = {
          numeroPedido: String(numeroOrcamento || ''),
          cliente: clienteNome || '',
          fornecedor: '',
          vidro: insumo.descricao || nomePrimeiroInsumo || nomeGrupo,
          tipo: '',
          quantidade: quantidadeInsumo,

          grupoNome: nomeGrupo,
          grupoTipo: 'PRODUTO_ACABADO',
          produtoAcabadoCodigo: item.codigo || '',
          produtoAcabadoDescricao: nomeGrupo || nomePrimeiroInsumo,
          produtoAcabadoGrupoId: item.grupoId || '',
          produtoAcabadoAmbiente: item.ambiente || '',

          orcamentoEnviado: '',
          aprovacao: '',
          moldeEnviado: '',
          recebemosLinkPagamento: '',
          pagamento: 'Pendente',

          previsao: previsaoISO ? new Date(previsaoISO) : null,
          numeroPedidoFornecedor: '',
          vidrosProntos: null,
          naEmpresa: null,

          faturamento: 'Pendente',
          responsavelVendedor: '',
          numeroOrcFornecedor: '',

          valorTotalPedido: valorTotalPedidoAjustado,
          valorTotalFaturamentoDiretoOrcado: valorTotalInsumo || valorGrupo,
          valorAproximadoUF: 0,

          valorTotalNFProdutos,
          valorTotalNFServicos,

          valorReal: valorTotalInsumo || valorGrupo,
          residuoDiferencaFaturamentoServico: 0,

          numeroNotaFiscal: '',
          formaPagamento: '',

          observacao:
            `Ignorado no envio à Omie | Ambiente: ${item.ambiente || '-'} | Grupo: ${
              item.grupoId || '-'
            } | Código grupo: ${item.codigo || '-'} | ` +
            `Insumo: ${insumo.descricao || '-'} (linha ${insumo.ordem})`,

          meta: {
            origem: 'produtosFaturadosParaOCliente',
            numeroOrcamento: numeroOrcamento || null,
            chavePopup: item.key || null,

            totaisSelecaoOmie: totaisSelecao
              ? {
                  totalAprovadoBaseComMO: totaisSelecao.totalAprovadoBaseComMO ?? 0,
                  valorServicos:         totaisSelecao.valorServicos         ?? 0,
                  valorDesconto:         totaisSelecao.valorDesconto         ?? 0,
                  valorComissaoInfo:     totaisSelecao.valorComissaoInfo     ?? 0,
                  totalFinalProdutos:    totaisSelecao.totalFinalProdutos    ?? 0,
                  porCategoria: {
                    produto: totaisSelecao.porCategoria?.produto ?? 0,
                    servico: totaisSelecao.porCategoria?.servico ?? 0,
                    vidro:   totaisSelecao.porCategoria?.vidro   ?? 0,
                  },
                }
              : null,

            insumo: {
              ordem: insumo.ordem,
              codigo: insumo.codigo,
              descricao: insumo.descricao,
              unidade: insumo.unidade,
              quantidadeTexto: insumo.quantidade,
              valorCustoFinalTexto: insumo.valorCustoFinal,
              quantidadeNumero: quantidadeInsumo,
              valorUnitarioNumero: valorUnitarioInsumo,
              valorTotalNumero: valorTotalInsumo,
            },

            infoGrupo: {
              grupoId: item.grupoId || null,
              ambiente: item.ambiente || null,
              codigoGrupo: item.codigo || null,
              valorTotalGrupo: valorGrupo,
              nomeGrupo,
            },
          },
        };

        console.log('📦 Documento (INSUMO → produto) pronto para envio:', doc);
        docs.push(doc);
      });
    });

    console.log('📦 docs prontos para envio a /api/produtos:', {
      totalDocs: docs.length,
      docs,
    });

    let inseridos = 0;
    const resultados = [];

    for (const doc of docs) {
      console.log('🚚 Enviando insumo como produto para /api/produtos:', doc);

      const res = await fetch(`${API_BASE_PRODUTOS}/api/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });

      const j = await res.json();
      console.log('📥 Resposta do POST /api/produtos:', j);

      if (!j.ok) {
        throw new Error(j.error || 'Falha ao salvar itens ignorados (insumos)');
      }

      inseridos++;
      resultados.push(j.data);
    }

    console.log(
      `✅ ${inseridos} produto(s)/insumo(s) criado(s) na "Aba de produtos faturados direto".`
    );
    alert(
      `✅ ${inseridos} produto(s)/insumo(s) foram criados na aba de Produtos Faturados Direto.\n` +
        `Eles não foram enviados para a Omie.`
    );

    if (typeof carregarProdutos === 'function') {
      carregarProdutos();
    }

    return resultados;
  } catch (err) {
    console.error('❌ produtosFaturadosParaOCliente() erro:', err);
    alert('Erro ao salvar itens ignorados: ' + err.message);
    return null;
  }
};


function obterParcelasServicoCorretas(parcelasServico = null) {
  console.group("🔎 [obterParcelasServicoCorretas] entrada");
  console.log("parcelasServico parâmetro:", JSON.parse(JSON.stringify(parcelasServico || null)));
  console.log("window.vvUltimosTotaisSelecaoItensOmie?.parcelasServico:", JSON.parse(JSON.stringify(window.vvUltimosTotaisSelecaoItensOmie?.parcelasServico || null)));
  console.log("window.vvParcelasServicoOmie:", JSON.parse(JSON.stringify(window.vvParcelasServicoOmie || null)));
  console.log("window.propostaEmEdicao?.camposFormulario?.parcelasServico:", JSON.parse(JSON.stringify(window.propostaEmEdicao?.camposFormulario?.parcelasServico || null)));
  console.log("window.propostaAtual?.camposFormulario?.parcelasServico:", JSON.parse(JSON.stringify(window.propostaAtual?.camposFormulario?.parcelasServico || null)));
  console.groupEnd();

  let parcelas = [];

  if (Array.isArray(parcelasServico) && parcelasServico.length > 0) {
    parcelas = parcelasServico;
    console.log("✅ Fonte usada: parâmetro parcelasServico");
  } else if (
    Array.isArray(window.vvUltimosTotaisSelecaoItensOmie?.parcelasServico) &&
    window.vvUltimosTotaisSelecaoItensOmie.parcelasServico.length > 0
  ) {
    parcelas = window.vvUltimosTotaisSelecaoItensOmie.parcelasServico;
    console.log("✅ Fonte usada: window.vvUltimosTotaisSelecaoItensOmie.parcelasServico");
  } else if (
    Array.isArray(window.vvParcelasServicoOmie) &&
    window.vvParcelasServicoOmie.length > 0
  ) {
    parcelas = window.vvParcelasServicoOmie;
    console.log("✅ Fonte usada: window.vvParcelasServicoOmie");
  } else if (
    Array.isArray(window.propostaEmEdicao?.camposFormulario?.parcelasServico) &&
    window.propostaEmEdicao.camposFormulario.parcelasServico.length > 0
  ) {
    parcelas = window.propostaEmEdicao.camposFormulario.parcelasServico;
    console.log("✅ Fonte usada: window.propostaEmEdicao.camposFormulario.parcelasServico");
  } else if (
    Array.isArray(window.propostaAtual?.camposFormulario?.parcelasServico) &&
    window.propostaAtual.camposFormulario.parcelasServico.length > 0
  ) {
    parcelas = window.propostaAtual.camposFormulario.parcelasServico;
    console.log("✅ Fonte usada: window.propostaAtual.camposFormulario.parcelasServico");
  } else {
    console.warn("⚠️ Nenhuma fonte de parcelas de serviço encontrada.");
  }

  const parcelasNormalizadas = parcelas.map((p) => {
    const dataServico = p?.vencimento || p?.data || p?.previsao || "";
    return {
      ...p,
      // Para OS, a data que o usuario define na parcela e o vencimento.
      // Evita usar uma previsao antiga que pode ter sido gerada um mes a frente.
      previsao: dataServico,
      vencimento: dataServico
    };
  });

  console.group("📦 [obterParcelasServicoCorretas] saída normalizada");
  console.log("parcelas originais:", JSON.parse(JSON.stringify(parcelas || [])));
  console.log("parcelas normalizadas:", JSON.parse(JSON.stringify(parcelasNormalizadas || [])));
  console.table(
    parcelasNormalizadas.map((p, i) => ({
      index: i,
      tipo_monetario: p?.tipo_monetario || "",
      condicao_pagto: p?.condicao_pagto || "",
      valor: p?.valor || 0,
      previsao: p?.previsao || "",
      vencimento: p?.vencimento || ""
    }))
  );
  console.groupEnd();

  return parcelasNormalizadas;
}


/* ================== CONFIG ================== */
const OS_SERVICOS_ENDPOINT = window.OS_SERVICOS_ENDPOINT
  || "https://ulhoa-servico-ec4e1aa95355.herokuapp.com/os";

/* Defaults (podem ser ajustados) */
const CCOD_LC116_DEFAULT = "7.01";
const CCOD_MUN_DEFAULT   = "0701-0/01-88";
const CCODPARC_DEFAULT   = "999";
const CETAPA_DEFAULT     = "20";
const CCODCATEG_DEFAULT  = "1.01.99";
const NCODCC_DEFAULT     = 10937506623;

/* Código e nome do vendedor de serviços selecionado */
let NCODVEND_SERVICO_DEFAULT = "";
let NOME_VENDEDOR_SERVICO_DEFAULT = "";

/* =========================================================
   Base de vendedores de serviços
   ========================================================= */
const VENDEDORES_SERVICOS_FERREIRA_ULHOA = {
  pagina: 1,
  total_de_paginas: 1,
  registros: 32,
  total_de_registros: 32,
  cadastro: [
    { codInt: "", codigo: 10922409030, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "Paulo Sergio Machado da Silva", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409032, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "DOUGLAS VITOR DA SILVA", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409035, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "GABRIEL JUNIOR DO COUTO NEPOMUCENO", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409037, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "MAURO FERREIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409049, comissao: 0, email: "felipe.ulhoa@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "FELIPE ULHOA FERREIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409051, comissao: 1, email: "joaomartins@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "JOAO CLEBER MARTINS", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409053, comissao: 0, email: "marilena.ulhoa@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "MARILENA DE ALMEIDA ULHOA", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409055, comissao: 0, email: "projetos@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "ANA FLAVIA RODRIGUES PRATES", visualiza_pedido: "N" },
    { codInt: "", codigo: 10922409059, comissao: 1, email: "rafael.angelo@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "RAFAEL ANGELO ARAUJO DA SILVA", visualiza_pedido: "N" },
    { codInt: "", codigo: 10985073333, comissao: 0, email: "lais.rabelo@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "S", nome: "LAIS MAGALHÃES RABELO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11059840338, comissao: 0, email: "servidor@ferreiraulhoa.com.br", fatura_pedido: "S", inativo: "S", nome: "VANESSA ULHOA", visualiza_pedido: "N" },
    { codInt: "Enviado via API", codigo: 11060014882, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "Enviado via API", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158319843, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "MAURO FERREIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376229, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "DAVIDSON JUNIO PEREIRA MACIEL", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376259, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "FERNANDO PEREIRA DE SOUZA JUNIOR", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376263, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "LEONARDO SOUSA OLIVEIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376268, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "MATHEUS HENRIQUE SOUZA BRAGA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376278, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "EDNALDO GOMES FILHO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376285, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "DIONATA ALAN SILVA COSTA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376293, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "JOSE CARLOS SOARES DA CRUZ", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376335, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "JOSE GILMAR PINHEIRO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376357, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "ERIVALDO AMARO DE ALMEIDA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376364, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "LUIZ FERNANDO LIMA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376367, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "OSVALDO PAURA OLIVEIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376374, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "JOSE CARLOS SOARES DA CRUZ", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376382, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "RENE GOMES DE OLIVEIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376392, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "ROBERTO MARTINS DO NASCIMENTO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376703, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "RONAN GOMES DE SOUZA LIMA", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376707, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "SERGIO RICARDO PIO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376710, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "RODRIGO NOBRE DOS SANTOS", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376713, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "RODRIGO BRITO CARDOSO", visualiza_pedido: "N" },
    { codInt: "", codigo: 11158376723, comissao: 0, email: "", fatura_pedido: "N", inativo: "N", nome: "SEBASTIAO DOS REIS DE MATOS", visualiza_pedido: "N" }
  ]
};

/* =========================================================
   Normalização para comparar nomes
   ========================================================= */
function normalizarTextoServico(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   Aliases de vendedores de serviços
   ========================================================= */
const ALIASES_VENDEDORES_SERVICOS_FERREIRA_ULHOA = {
  "PAULO SERGIO MACHADO DA SILVA": "PAULO SERGIO MACHADO DA SILVA",
  "DOUGLAS VITOR DA SILVA": "DOUGLAS VITOR DA SILVA",
  "GABRIEL JUNIOR DO COUTO NEPOMUCENO": "GABRIEL JUNIOR DO COUTO NEPOMUCENO",
  "FELIPE ULHOA FERREIRA": "FELIPE ULHOA FERREIRA",
  "JOAO CLEBER MARTINS": "JOAO CLEBER MARTINS",
  "MARILENA DE ALMEIDA ULHOA": "MARILENA DE ALMEIDA ULHOA",
  "ANA FLAVIA RODRIGUES PRATES": "ANA FLAVIA RODRIGUES PRATES",
  "RAFAEL ANGELO ARAUJO DA SILVA": "RAFAEL ANGELO ARAUJO DA SILVA",
  "LAIS MAGALHAES RABELO": "LAIS MAGALHÃES RABELO",
  "LAÍS MAGALHÃES RABELO": "LAIS MAGALHÃES RABELO",
  "VANESSA ULHOA": "VANESSA ULHOA",
  "MAURO LUCIO": "MAURO FERREIRA"
};

/* =========================================================
   Define código do vendedor de serviços selecionado
   ========================================================= */
function definirCodigoVendedorServicoSelecionado() {
  const selectVendedor = document.getElementById("vendedorResponsavel");

  if (!selectVendedor) {
    console.warn("⚠️ Select #vendedorResponsavel não encontrado.");
    NCODVEND_SERVICO_DEFAULT = "";
    NOME_VENDEDOR_SERVICO_DEFAULT = "";
    return;
  }

  const nomeSelecionado =
    selectVendedor.value?.trim() ||
    selectVendedor.options[selectVendedor.selectedIndex]?.text?.trim() ||
    selectVendedor.getAttribute("data-valor-original")?.trim() ||
    "";

  NOME_VENDEDOR_SERVICO_DEFAULT = nomeSelecionado;

  if (!nomeSelecionado) {
    console.warn("⚠️ Nenhum vendedor de serviço selecionado.");
    NCODVEND_SERVICO_DEFAULT = "";
    return;
  }

  const nomeNormalizado = normalizarTextoServico(nomeSelecionado);
  const nomeParaBusca =
    ALIASES_VENDEDORES_SERVICOS_FERREIRA_ULHOA[nomeNormalizado] || nomeSelecionado;

  const vendedoresServico = VENDEDORES_SERVICOS_FERREIRA_ULHOA.cadastro || [];

  const encontrados = vendedoresServico.filter(v =>
    normalizarTextoServico(v.nome) === normalizarTextoServico(nomeParaBusca)
  );

  if (!encontrados.length) {
    console.warn("⚠️ Vendedor de serviço não encontrado na base Ferreira Ulhoa Serviços:", {
      nomeSelecionado,
      nomeParaBusca
    });
    NCODVEND_SERVICO_DEFAULT = "";
    return;
  }

  if (encontrados.length > 1) {
    console.warn("⚠️ Mais de um vendedor de serviço encontrado com o mesmo nome. Usando o primeiro.", encontrados);
  }

  const vendedorServicoEncontrado = encontrados[0];

  NCODVEND_SERVICO_DEFAULT = Number(vendedorServicoEncontrado.codigo) || 0;

  console.log("✅ Vendedor de serviço localizado com sucesso:", {
    nomeSelecionado,
    nomeEncontrado: vendedorServicoEncontrado.nome,
    codigo: NCODVEND_SERVICO_DEFAULT
  });
}

/* =========================================================
   Atualiza ao carregar e ao trocar o vendedor
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  definirCodigoVendedorServicoSelecionado();

  const selectVendedor = document.getElementById("vendedorResponsavel");
  if (selectVendedor) {
    selectVendedor.addEventListener("change", definirCodigoVendedorServicoSelecionado);
  }
});
/* ================== UTILS ================== */
function toBR(valor) {
  if (!valor) return "";

  const v = String(valor).trim();

  // já está em BR
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    return v;
  }

  // ISO puro: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }

  // datetime ISO: YYYY-MM-DDTHH:mm:ss...
  const isoMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }

  // fallback — usa UTC para evitar deslocamento de fuso horário
  const d = new Date(v);
  if (isNaN(d)) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

function toISO(valor) {
  if (!valor) return "";

  const v = String(valor).trim();

  // já está em ISO puro
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v;
  }

  // BR -> ISO
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }

  // datetime ISO: YYYY-MM-DDTHH:mm:ss...
  const isoMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m}-${d}`;
  }

  // fallback — usa UTC para evitar deslocamento de fuso horário
  const d = new Date(v);
  if (isNaN(d)) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function vv_fmtBRL(n){
  return (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

/* ====== AJUSTE: BUSCA DE CÓDIGO DO CLIENTE PELO NOVO RETORNO DA API ====== */
/*
  Esperado da API /clientes:
  {
    "total": 3478,
    "ultimaAtualizacao": "2025-12-10T12:39:38.194Z",
    "clientes": [
      {
        "nome_fantasia": "PKO DO BRASIL IMP. E EXP. LTDA",
        "codigo_cliente_omie": 10922418046
      },
      ...
    ]
  }

  Em algum lugar do código você deve fazer algo como:
    const resp = await fetch("https://ulhoa-servico-ec4e1aa95355.herokuapp.com/clientes");
    const data = await resp.json();
    window.listaClientesServico = data.clientes || [];
*/

function normalizarTexto(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

window.listaClientesServico = window.listaClientesServico || [];

/**
 * Retorna o codigo_cliente_omie (número) a partir da razão social / nome fantasia.
 * Usada em ctxHeaderOS -> getCodigoClientePorRazao(razao)
 */
function getCodigoClientePorRazao(razaoBusca) {
  if (!razaoBusca) return "";

  const lista = window.listaClientesServico;
  if (!Array.isArray(lista) || !lista.length) {
    console.warn("⚠️ listaClientesServico ainda não carregada.");
    return "";
  }

  const alvo = normalizarTexto(razaoBusca);

  // 1) Match exato
  let cliente = lista.find(
    (c) => normalizarTexto(c.nome_fantasia) === alvo
  );

  // 2) Fallback: contém
  if (!cliente) {
    cliente = lista.find(
      (c) => normalizarTexto(c.nome_fantasia).includes(alvo)
    );
  }

  if (!cliente) {
    console.warn("⚠️ Cliente não encontrado na lista para:", razaoBusca);
    return "";
  }

  const codigo = cliente.codigo_cliente_omie;
  if (!codigo) {
    console.warn("⚠️ Cliente encontrado mas sem codigo_cliente_omie:", cliente);
    return "";
  }

  return Number(codigo);
}

/* ================== CONTEXTOS DA TELA ================== */
/* Caso você tenha inputs dedicados (inpCodInt, inpData, inpCli, inpParc, inpAdicNF),
   mapeie seus IDs aqui para captar valores com prioridade. */
function gerarCodigoOs7() {
  const now = new Date();

  // minutos, segundos e milissegundos do momento
  const baseTime =
    now.getMinutes() * 60 * 1000 +
    now.getSeconds() * 1000 +
    now.getMilliseconds();

  // "sal" aleatório para reduzir colisão
  const random = Math.floor(Math.random() * 36); // 0–35

  // base36 -> 0-9 + a-z, em maiúsculo
  const raw = (baseTime.toString(36) + random.toString(36)).toUpperCase();

  // garante no máximo 7 caracteres (pegando o final, mais variável)
  return raw.slice(-7);
}

function ctxFormOS() {
  const byId = (id) => document.getElementById(id);

  // gera código único se não houver valor digitado
  let codInt = byId("os-codint")?.value?.trim();
  if (!codInt) {
    codInt = gerarCodigoOs7();
    const inputCodInt = byId("os-codint");
    if (inputCodInt) inputCodInt.value = codInt; // opcional: já mostra na tela
  }

  const dataBr  = byId("os-data")?.value?.trim();       // se já vier em DD/MM/AAAA
  const dataIso = byId("os-data-iso")?.value?.trim();   // se vier ISO
  const codCli  = byId("os-codcli")?.value?.trim();     // ex: inpCli.value
  const qtParc  = byId("os-qtd-parc")?.value?.trim();   // ex: inpParc.value
  const dadosNF = byId("os-dados-adicnf")?.value?.trim(); // ex: inpAdicNF.value

  return {
    cCodIntOS_form: codInt || "",
    dDtPrevisao_form: dataBr || toBR(dataIso || "") || "",
    nCodCli_form: codCli ? Number(codCli) : undefined,
    nQtdeParc_form: qtParc ? Number(qtParc) : undefined,
    cDadosAdicNF_form: dadosNF || ""
  };
}

function ctxParcelasOS(parcelasServico = null) {
  const parcelasCorretas = obterParcelasServicoCorretas(parcelasServico);

  const nQtdeParc = parcelasCorretas.length || 1;

  const primeiraData = parcelasCorretas
    .map(p => String(p?.vencimento || p?.previsao || "").trim())
    .find(Boolean) || "";

  const dataPrevisaoOmie = vvDataPrevisaoServicoParaOmie(primeiraData);
  const dDtPrevisaoBR = toBR(dataPrevisaoOmie);
  const dDtPrevisaoISO = toISO(dataPrevisaoOmie);

  console.group("🧮 [ctxParcelasOS AJUSTADO]");
  console.table(
    parcelasCorretas.map((p, i) => ({
      index: i,
      previsao: p?.previsao || "",
      vencimento: p?.vencimento || "",
      valor: p?.valor || 0
    }))
  );
  console.log("vencimento escolhido na parcela:", primeiraData);
  console.log("dataPrevisaoOmie compensada:", dataPrevisaoOmie);
  console.log("dDtPrevisaoBR:", dDtPrevisaoBR);
  console.log("dDtPrevisaoISO:", dDtPrevisaoISO);
  console.groupEnd();

  return {
    nQtdeParc,
    dDtPrevisaoBR,
    dDtPrevisaoISO,
    vencimentoServicoOriginal: primeiraData
  };
}
function ctxHeaderOS() {
  const orc = document.getElementById("numeroOrcamento");
  const numeroOrcamento =
    (orc?.value && String(orc.value).trim())
    || (orc?.dataset?.valorOriginal && String(orc.dataset.valorOriginal).trim())
    || "";

  const cCodIntOS = gerarCodigoIntegracaoOmie("OS");

  const razaoEl = document.querySelector("input.form-control.razaoSocial");
  const razao =
    (razaoEl?.value && String(razaoEl.value).trim())
    || (razaoEl?.dataset?.valorOriginal && String(razaoEl.dataset.valorOriginal).trim())
    || "";

  const nCodCli = (typeof getCodigoClientePorRazao === "function")
    ? (getCodigoClientePorRazao(razao) || "")
    : "";

  return { cCodIntOS, nCodCli, razaoSocial: razao, numeroOrcamento };
}

/* =============== MONTAGEM DO PAYLOAD (FORMATO EXATO SOLICITADO) ===============
 Estrutura final enviada:
 {
   Cabecalho: {
     cCodIntOS, cCodParc, cEtapa, dDtPrevisao, nCodCli, nQtdeParc
   },
   Departamentos: [],
   Email: { cEnvBoleto, cEnvLink, cEnviarPara },
   InformacoesAdicionais: { cCodCateg, cDadosAdicNF, nCodCC },
   ServicosPrestados: [
     {
       cCodServLC116, cCodServMun, cRetemISS, cTribServ,
       impostos: { cRetemIRRF, cRetemPIS, nAliqIRRF, nAliqISS, nAliqPIS },
       nQtde, nValUnit
     }
   ]
 }
=========================================================================== */
function montarPayloadOS({
  cCodIntOS,
  nCodCli,
  dDtPrevisaoBR,
  dDtPrevisaoISO,
  valorServicos,
  nQtdeParc = 1
}) {
  const getVal = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return "";
    return (
      el.value?.trim?.() ||
      el.dataset?.valorOriginal?.trim?.() ||
      el.textContent?.trim?.() ||
      ""
    );
  };

  const numeroOrcamento =
    getVal("#numeroOrcamento") ||
    getVal('input[name="numeroOrcamento"]') ||
    "";

  const codigoIntegracaoOS = String(cCodIntOS || gerarCodigoIntegracaoOmie("OS")).trim();

  const cCodParc_form =
    getVal("#cCodParc") ||
    "999";

  const cEtapa_form =
    getVal("#cEtapa") ||
    "20";

  const cDadosAdicNF_form =
    getVal("#cDadosAdicNF") ||
    `OS incluída via API • Orçamento ${numeroOrcamento}`;

  const vendedorSelect =
    document.querySelector("#vendedorResponsavel") ||
    document.querySelector('select[name="vendedorResponsavel"]');

  let nCodVend = undefined;
  if (vendedorSelect) {
    nCodVend = Number(
      vendedorSelect.selectedOptions?.[0]?.dataset?.codigo ||
      vendedorSelect.value ||
      0
    ) || undefined;
  }

  const CCODCATEG_DEFAULT = "1.01.99";
  const NCODCC_DEFAULT = 10937506623;
  const CCOD_LC116_DEFAULT = "7.01";
  const CCOD_MUN_DEFAULT = "0701-0/01-88";

  const Cabecalho = {
    cCodIntOS: codigoIntegracaoOS,
    cCodParc: String(cCodParc_form || "999").trim(),
    cEtapa: String(cEtapa_form || "20").trim(),
    dDtPrevisao: String(dDtPrevisaoBR || "").trim()
  };

  if (nCodVend) {
    Cabecalho.nCodVend = Number(nCodVend);
  }

  if (nCodCli) {
    Cabecalho.nCodCli = Number(nCodCli);
  }

  Cabecalho.nQtdeParc = Number(nQtdeParc || 1);

  const nValUnitFinal = Number(valorServicos);
  if (!(nValUnitFinal > 0)) {
    throw new Error("Valor de Serviços inválido ou zero.");
  }

  const Departamentos = [];

  const emailsClientes = Array.from(document.querySelectorAll(".emailCliente"))
    .map(input =>
      input?.value?.trim() ||
      input?.dataset?.valorOriginal?.trim() ||
      ""
    )
    .filter(email => email);

  const Email = {
    cEnvBoleto: "S",
    cEnvLink: "S",
    cEnviarPara: emailsClientes.join(",")
  };

  const InformacoesAdicionais = {
    cCodCateg: CCODCATEG_DEFAULT,
    cDadosAdicNF: String(
      cDadosAdicNF_form || `OS incluída via API • Orçamento ${Cabecalho.cCodIntOS}`
    ).trim(),
    nCodCC: NCODCC_DEFAULT
  };

  const ServicosPrestados = [
    {
      cCodServLC116: CCOD_LC116_DEFAULT,
      cCodServMun: CCOD_MUN_DEFAULT,
      cRetemISS: "N",
      cTribServ: "01",
      impostos: {
        cRetemIRRF: "N",
        cRetemPIS: "N",
        nAliqIRRF: 0,
        nAliqISS: 0,
        nAliqPIS: 0
      },
      nQtde: 1,
      nValUnit: Number(nValUnitFinal.toFixed(2)),
      cDescServ: "Serviço"
    }
  ];

  const payload = {
    Cabecalho,
    Departamentos,
    Email,
    InformacoesAdicionais,
    ServicosPrestados
  };

  console.group("📦 [montarPayloadOS] FINAL");
  console.log("cCodIntOS:", cCodIntOS);
  console.log("nCodCli recebido de ctxHeaderOS:", nCodCli);
  console.log("dDtPrevisaoBR recebida:", dDtPrevisaoBR);
  console.log("dDtPrevisaoISO recebida:", dDtPrevisaoISO);
  console.log("valorServicos:", valorServicos);
  console.log("Cabecalho final:", JSON.parse(JSON.stringify(Cabecalho)));
  console.log("payload completo:", JSON.parse(JSON.stringify(payload)));
  console.log("payload JSON:", JSON.stringify(payload, null, 2));
  console.groupEnd();

  return payload;
}

/* ================== ENVIO PARA /os ================== */
async function enviarOSServico({
  valorServicos,
  parcelasServico = null,
  endpoint = OS_SERVICOS_ENDPOINT
}) {
  try {
    if (!(Number(valorServicos) > 0)) {
      const msg = "Valor de Serviços inválido ou zerado.";
      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
      } else {
        alert(msg);
      }
      return { ok: false, error: msg };
    }

    const parcelasServicoCorretas = obterParcelasServicoCorretas(parcelasServico);

    const { cCodIntOS, nCodCli } = ctxHeaderOS();
    const { dDtPrevisaoBR, dDtPrevisaoISO, nQtdeParc } = ctxParcelasOS(parcelasServicoCorretas);
    const parcelasServicoSemData = (parcelasServicoCorretas || [])
      .map((parcela, index) => ({ parcela, index }))
      .filter(item => !formatarDataBR(item.parcela?.vencimento || item.parcela?.previsao));

    if (!dDtPrevisaoBR || parcelasServicoSemData.length) {
      const msg = parcelasServicoSemData.length
        ? "Preencha a data de vencimento das parcelas de servico antes de enviar a Omie: " +
          parcelasServicoSemData.map(item => `Parcela ${item.index + 1}`).join(", ")
        : "Data de previsao das parcelas de servico nao preenchida.";

      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado("Erro ao enviar Servicos", msg, "error");
      } else {
        alert(msg);
      }

      return { ok: false, error: msg };
    }

    console.group("🧾 [SERVIÇOS] PARCELAS ANTES DO ENVIO");
    console.log("endpoint:", endpoint);
    console.log("valorServicos:", valorServicos);
    console.log("cCodIntOS:", cCodIntOS);
    console.log("nCodCli:", nCodCli);
    console.log("nQtdeParc:", nQtdeParc);
    console.log("dDtPrevisaoBR:", dDtPrevisaoBR);
    console.log("dDtPrevisaoISO:", dDtPrevisaoISO);
    console.log("parcelasServico parâmetro:", JSON.parse(JSON.stringify(parcelasServico || null)));
    console.log("parcelasServicoCorretas:", JSON.parse(JSON.stringify(parcelasServicoCorretas || [])));
    console.table(
      (parcelasServicoCorretas || []).map((p, i) => ({
        index: i,
        tipo_monetario: p?.tipo_monetario || "",
        condicao_pagto: p?.condicao_pagto || "",
        valor: p?.valor || 0,
        previsao: p?.previsao || "",
        vencimento: p?.vencimento || ""
      }))
    );
    console.groupEnd();

    const payload = montarPayloadOS({
      cCodIntOS,
      nCodCli,
      dDtPrevisaoBR,
      dDtPrevisaoISO,
      valorServicos,
      nQtdeParc
    });

    console.group("🚀 [SERVIÇOS] REQUEST FINAL PARA OMIE");
    console.log("URL:", endpoint);
    console.log("Método:", "POST");
    console.log("Payload objeto:", JSON.parse(JSON.stringify(payload)));
    console.log("Payload JSON stringify:", JSON.stringify(payload, null, 2));
    console.log("Cabecalho enviado:", JSON.parse(JSON.stringify(payload?.Cabecalho || {})));
    console.log("ServicosPrestados enviado:", JSON.parse(JSON.stringify(payload?.ServicosPrestados || [])));
    console.groupEnd();

    const headers = { "Content-Type": "application/json" };
    const token =
      localStorage.getItem("accessTokenServico") ||
      localStorage.getItem("accessToken");

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.group("📡 [SERVIÇOS] FETCH");
    console.log("headers:", JSON.parse(JSON.stringify(headers)));
    console.log("body cru:", JSON.stringify(payload));
    console.groupEnd();

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const raw = await resp.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = { ok: resp.ok, raw };
    }

    console.group("⬅️ [SERVIÇOS] RESPOSTA OMIE");
    console.log("status HTTP:", resp.status);
    console.log("ok HTTP:", resp.ok);
    console.log("resposta parseada:", data);
    console.log("resposta raw:", raw);
    console.groupEnd();

    if (!resp.ok || data?.ok === false) {
      const motivo = data?.detail
        ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
        : (data?.error || data?.message || data?.raw || `HTTP ${resp.status}`);

      const dicasHtml = [
        "- Confirme os campos exigidos pelo server (cCodParc, cEtapa, nQtdeParc etc.).",
        "- Garanta que dDtPrevisao esteja no formato aceito (DD/MM/AAAA se o server valida assim).",
        "- Verifique se nValUnit é número (sem vírgula).",
        "- Se exigir Authorization, valide o token."
      ].join("<br>");

      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado(
          "❌ Erro ao enviar OS de Serviços",
          `Status: ${resp.status}<br>Motivo: ${motivo}<br><br>${dicasHtml}`,
          "error"
        );
      } else {
        alert(`Erro ao enviar OS de Serviços:\n${motivo}`);
      }

      return { ok: false, error: motivo, data };
    }

    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado(
        "✅ OS de Serviços enviada",
        `OS criada com sucesso.<br>Valor: ${vv_fmtBRL(valorServicos)}.`,
        "success"
      );
    } else {
      alert("✅ OS de Serviços enviada com sucesso!");
    }

    return { ok: true, status: resp.status, data };
  } catch (err) {
    console.error("❌ enviarOSServico erro:", err);
    const msg = err?.message || String(err);

    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
    } else {
      alert("Erro ao enviar Serviços:\n" + msg);
    }

    return { ok: false, error: msg };
  }
}
/* Expor global */
window.enviarOSServico = enviarOSServico;
