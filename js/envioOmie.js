function formatarDataBR(dataISO) {
  if (!dataISO || !dataISO.includes("-")) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
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
  return `${ano}${mes}${dia}${hora}${minuto}${segundo}001`;
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
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const aaaa = d.getFullYear();
    return `${dd}/${mm}/${aaaa}`;
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
    return Array.from(document.querySelectorAll(".resumo-totalizador .ambiente-toggle:checked"))
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
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   2) COLETAR ITENS (1º produto por grupo + total por grupo)
   ========================================================= */
function coletarItensPorGrupoParaOmie(ambientesMarcados = []) {
  const itens = [];
  const blocos = document.querySelectorAll("[id^='bloco-']");

  blocos.forEach((bloco) => {
    const grupoId = bloco.id || "(sem-id)";
    const inputAmb = bloco.querySelector("input[placeholder='Ambiente'][data-id-grupo]");
    const nomeAmbiente = (inputAmb?.value || inputAmb?.getAttribute("value") || "").trim() || "Ambiente não identificado";

    if (Array.isArray(ambientesMarcados) && ambientesMarcados.length > 0) {
      if (!ambientesMarcados.includes(nomeAmbiente)) return;
    }

    const tabela =
      bloco.querySelector("table") ||
      bloco.querySelector(".tabela-grupo table") ||
      bloco.querySelector(".table");

    if (!tabela) return;

    const linhas = tabela.querySelectorAll("tbody tr");
    if (!linhas || !linhas.length) return;

    // total do grupo
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

    // primeiro produto
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
  });

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
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${dt.getFullYear()}-${m}-${day}`;
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

    const lancArq  = montarLancamento("arquiteto", payload?.arquiteto, payload?.baseConsiderada);
    const lancVend = montarLancamento("vendedor",  payload?.vendedor,  payload?.baseConsiderada);

    const vArq  = validarLancamento(lancArq,  "arquiteto");
    const vVend = validarLancamento(lancVend, "vendedor");

    if (!vArq.valido || !vVend.valido) {
      const msgs = []
        .concat(!vArq.valido ? [`Arquiteto: ${vArq.erros.join(", ")}`] : [])
        .concat(!vVend.valido ? [`Vendedor: ${vVend.erros.join(", ")}`] : []);
      const erro = "Dados incompletos para enviar comissões.\n" + msgs.join("\n");
      toast(erro, false);
      try {
        document.dispatchEvent(
          new CustomEvent("vv:comissoes:enviadas", {
            detail: { ok: false, erro, resultados: { vArq, vVend } }
          })
        );
      } catch {}
      return { ok: false, erro, resultados: { vArq, vVend } };
    }

    const [resArq, resVend] = await Promise.all([
      postarLancamento(lancArq,  "arquiteto"),
      postarLancamento(lancVend, "vendedor"),
    ]);

    const okGeral = !!(resArq?.ok && resVend?.ok);

    if (okGeral) {
      toast("Comissões enviadas com sucesso (arquiteto + vendedor).");
    } else {
      let msg = "Falha ao enviar comissões.\n";
      if (!resArq.ok)  msg += `Arquiteto: ${resArq.erro || "erro"}\n`;
      if (!resVend.ok) msg += `Vendedor: ${resVend.erro || "erro"}\n`;
      toast(msg.trim(), false);
    }

    try {
      document.dispatchEvent(
        new CustomEvent("vv:comissoes:enviadas", {
          detail: {
            ok: okGeral,
            resultados: { arquiteto: resArq, vendedor: resVend }
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
async function abrirPopupSelecaoItensOmie(itens){
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
  function abrirPopupComissao(){
    return new Promise((resolveC)=>{
      const ARQUITETOS = coletarArquitetosCadastrados();
      const valorComissaoResumo = lerComissaoArquitetoDoResumo();

      const bd = document.createElement('div'); bd.className = 'vv-modal-backdrop';
      const md = document.createElement('div'); md.className = 'vv-modal';
      const hd = document.createElement('header');
      hd.innerHTML = `<h3>Comissões — base: Total aprovado (base + MO)</h3>`;

      const by = document.createElement('div'); by.className = 'vv-body';

      const optsArq = ARQUITETOS.map(a=>{
        const txt = a.codigo ? `${a.nome} — ${a.codigo}` : a.nome;
        const sel = (a.nome && a.nome === (_comArq?.nome||'')) ? 'selected' : '';
        return `<option value="${a.nome.replace(/"/g,'&quot;')}" data-codigo="${(a.codigo||'').replace(/"/g,'&quot;')}" ${sel}>${txt}</option>`;
      }).join('');

      by.innerHTML = `
        <div style="display:grid; gap:16px;">
          <div style="display:grid; gap:8px;">
            <div class="vv-help">Base atual para cálculo: <b id="vv-com-base">${vv_fmtBRL(_lastTotalBaseMO||0)}</b></div>
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
                <label><input type="radio" name="comArqModo" value="percent" ${_comArq?.modo!=='valor'?'checked':''}> % do total aprovado</label>
                <label><input type="radio" name="comArqModo" value="valor" ${_comArq?.modo==='valor'?'checked':''}> Valor fixo (R$)</label>
              </div>

              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <label class="form-label" style="min-width:90px;">Valor</label>
                <input id="comArqPercent" type="number" min="0" step="0.01" value="${_comArq?.percent||0}" class="form-control" style="max-width:140px;">
                <input id="comArqValor"   type="text"   value="${vv_fmtBRL(_comArq?.valorManual ?? valorComissaoResumo ?? 0)}" class="form-control" style="max-width:180px;">
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
                <label><input type="radio" name="comVendModo" value="percent" ${_comVend?.modo!=='valor'?'checked':''}> % do total aprovado</label>
                <label><input type="radio" name="comVendModo" value="valor" ${_comVend?.modo==='valor'?'checked':''}> Valor fixo (R$)</label>
              </div>

              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <label class="form-label" style="min-width:90px;">Valor</label>
                <input id="comVendPercent" type="number" min="0" step="0.01" value="${_comVend?.percent||0}" class="form-control" style="max-width:140px;">
                <input id="comVendValor"   type="text"   value="${vv_fmtBRL(_comVend?.valorManual||0)}" class="form-control" style="max-width:180px;">
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

      const ft = document.createElement('div'); ft.className = 'vv-footer';
      ft.innerHTML = `
        <div class="vv-help">Informativo — não altera valores enviados à Omie.</div>
        <div style="display:flex; gap:8px;">
          <button class="vv-btn" id="commCancel">Cancelar</button>
          <button class="vv-btn primary" id="commSave">Salvar</button>
        </div>
      `;

      md.appendChild(hd); md.appendChild(by); md.appendChild(ft);
      bd.appendChild(md); document.body.appendChild(bd);

      const $selArq       = by.querySelector('#comArqSelect');
      const $comArqNome   = by.querySelector('#comArqNome');
      const $comArqCodigo = by.querySelector('#comArqCodigo');
      const $comArqPercent= by.querySelector('#comArqPercent');
      const $comArqValor  = by.querySelector('#comArqValor');
      const $arqPrev      = by.querySelector('#arqPrev');
      const $arqVenc      = by.querySelector('#arqVenc');
      const $arqObs       = by.querySelector('#arqObs');

      const $comVendNome   = by.querySelector('#comVendNome');
      const $comVendCodigo = by.querySelector('#comVendCodigo');
      const $comVendPercent= by.querySelector('#comVendPercent');
      const $comVendValor  = by.querySelector('#comVendValor');
      const $vendPrev      = by.querySelector('#vendPrev');
      const $vendVenc      = by.querySelector('#vendVenc');
      const $vendObs       = by.querySelector('#vendObs');

      const $comArqCalc = by.querySelector('#comArqCalc');
      const $comVendCalc= by.querySelector('#comVendCalc');
      const $sumArq = by.querySelector('#sumArq');
      const $sumVend= by.querySelector('#sumVend');
      const $sumTot = by.querySelector('#sumTot');

      const getModoArq  = ()=> by.querySelector('input[name="comArqModo"]:checked')?.value || 'percent';
      const getModoVend = ()=> by.querySelector('input[name="comVendModo"]:checked')?.value || 'percent';
      const parseBRL = (s)=> (window.vv_parseBRL ? vv_parseBRL(s) : Number(String(s).replace(/[^\d,-]/g,'').replace(/\./g,'').replace(',','.'))||0);
      const fmtBRL   = (n)=> (window.vv_fmtBRL   ? vv_fmtBRL(n)   : `R$ ${Number(n||0).toFixed(2)}`);

      if ($selArq){
        $selArq.addEventListener('change', ()=>{
          const opt = $selArq.selectedOptions[0];
          if (!opt) return;
          $comArqNome.value   = opt.value || '';
          $comArqCodigo.value = opt.getAttribute('data-codigo') || '';
          $comArqNome.dispatchEvent(new Event('change'));
        });
      }

      function recalcComm(){
        const base = _lastTotalBaseMO || 0;

        const arq = (getModoArq()==='percent')
          ? (Number($comArqPercent.value||0)/100) * base
          : parseBRL($comArqValor.value||'0');

        const vend = (getModoVend()==='percent')
          ? (Number($comVendPercent.value||0)/100) * base
          : parseBRL($comVendValor.value||'0');

        $comArqCalc.textContent = fmtBRL(arq);
        $comVendCalc.textContent= fmtBRL(vend);
        $sumArq.textContent = fmtBRL(arq);
        $sumVend.textContent= fmtBRL(vend);
        $sumTot.textContent = fmtBRL(Math.max(0,arq)+Math.max(0,vend));
      }

      by.querySelectorAll('input[name="comArqModo"]').forEach(r=> r.addEventListener('change', recalcComm));
      by.querySelectorAll('input[name="comVendModo"]').forEach(r=> r.addEventListener('change', recalcComm));
      [$comArqPercent,$comArqValor,$comVendPercent,$comVendValor].forEach(inp=>{
        inp.addEventListener('input', recalcComm);
        if (inp===$comArqValor || inp===$comVendValor){
          inp.addEventListener('blur', ()=>{ inp.value = fmtBRL(parseBRL(inp.value||'0')); });
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
          percent: Number($comArqPercent.value||0),
          valorManual: parseBRL($comArqValor.value||'0'),
          nome: $comArqNome.value||'',
          codigo: $comArqCodigo.value||'',
          prev: $arqPrev.value||'',
          venc: $arqVenc.value||'',
          obs: $arqObs.value||''
        };
        _comVend = {
          modo: getModoVend(),
          percent: Number($comVendPercent.value||0),
          valorManual: parseBRL($comVendValor.value||'0'),
          nome: $comVendNome.value||'',
          codigo: $comVendCodigo.value||'',
          prev: $vendPrev.value||'',
          venc: $vendVenc.value||'',
          obs: $vendObs.value||''
        };

        atualizarComissaoArquitetoNoResumo(_comArq.modo==='percent'
          ? (_lastTotalBaseMO * (Number(_comArq.percent||0)/100))
          : _comArq.valorManual
        );

        const arqCalc  = vv_parseBRL($sumArq.textContent||'0');
        const venCalc  = vv_parseBRL($sumVend.textContent||'0');

        document.body.removeChild(bd);
        resolveC({
          baseConsiderada: _lastTotalBaseMO,
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
    { nome:"JOAO CLEBER MARTINS",   codigo:"2458334366", aliases:["JOAO CLEBER","JOÃO CLEBER","JOAO C MARTINS","J C MARTINS","JOAO MARTINS"] },
    { nome:"RAFAEL ANGELO ARAUJO DA SILVA", codigo:"2458334372", aliases:["RAFAEL ANGELO","RAFAEL A A SILVA","RAFAEL ARAUJO","RAFAEL SILVA"] }
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
          <div>🔹 Total (Vidro): <b id="vv-cat-vidro">R$ 0,00</b></div>
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
      Ordem: <b>Desconto</b> sobre TODOS → <b>Ignorar</b> → <b>MO</b> redistribuída entre aprovados → <b>Serviços</b> proporcional. Arredonda só no final.
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
        rows.forEach(tr=>{
          tr.querySelector('[data-col="part"]').textContent = '0%';
          tr.querySelector('[data-col="ajustado"]').textContent = vv_fmtBRL(Number(tr.dataset.valor||0));
          tr.querySelector('[data-col="final"]').textContent = vv_fmtBRL(0);
        });
        $totAprov.textContent = vv_fmtBRL(0);
        $totServ.textContent  = vv_fmtBRL(0);
        $totDesc.textContent  = vv_fmtBRL(descontoTotal);
        $totCom.textContent   = vv_fmtBRL(0);
        $totAjust.textContent = vv_fmtBRL(0);
        $catProduto.textContent = vv_fmtBRL(0);
        $catServico.textContent = vv_fmtBRL(0);
        $catVidro.textContent   = vv_fmtBRL(fromCents(catVidroC_all));
        _lastTotalBaseMO = 0;
        return;
      }

      const laborIgnoredTotal = rows.reduce((acc, tr) => {
        const isLab = tr.dataset.islabor === '1';
        const isIgn = isIgnoredKey(tr.dataset.key);
        return acc + (isLab && isIgn ? (Number(tr.dataset.valor||0) || 0) : 0);
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

      let servicosTotal = 0;
      if (getModoServicos()==='percent'){
        const p = Number($srvPercent.value||0);
        servicosTotal = (p/100) * totalBaseMO;
      } else {
        servicosTotal = vv_parseBRL($srvValor.value||'0');
      }
      servicosTotal = Math.max(0, Math.min(servicosTotal, totalBaseMO));

      const descontoAplicavel = Math.min(descontoTotal, totalBaseMO);
      const cotaDescontoIgual = nAprov > 0 ? (descontoAplicavel / nAprov) : 0;

      const linhas = [];
      aprovadosRows.forEach(tr => {
        const key = tr.dataset.key;
        const base = baseMOMap.get(key) || 0;
        const share = totalBaseMO > 0 ? (base / totalBaseMO) : 0;
        const servAbat = servicosTotal * share;
        const final = Math.max(0, base - servAbat - cotaDescontoIgual);
        linhas.push({ key, baseFloat: base, servFloat: servAbat, finalFloat: final });
      });

      const targetTotalFinal = totalBaseMO - servicosTotal - descontoAplicavel;
      const targetCents = toCents(targetTotalFinal);

      let finalsCents = linhas.map(l => toCents(l.finalFloat));
      let somaCents   = sum(finalsCents);
      let delta = targetCents - somaCents;

      let i = 0;
      while (delta !== 0 && linhas.length > 0){
        finalsCents[i % linhas.length] += (delta > 0 ? 1 : -1);
        delta += (delta > 0 ? -1 : 1);
        i++;
      }

      rows.forEach(tr => {
        const key = tr.dataset.key;
        const $part = tr.querySelector('[data-col="part"]');
        const $aj   = tr.querySelector('[data-col="ajustado"]');
        const $fin  = tr.querySelector('[data-col="final"]');

        const ignorado = !!chkAll.find(c => c.dataset.key===key)?.checked;
        if (ignorado || !baseMOMap.has(key)){
          $part.textContent = '0%';
          $aj.textContent   = vv_fmtBRL(Number(tr.dataset.valor||0));
          $fin.textContent  = vv_fmtBRL(0);
          return;
        }

        const base = baseMOMap.get(key);
        const share = totalBaseMO>0 ? (base / totalBaseMO) : 0;
        const idx = linhas.findIndex(l => l.key === key);
        const finCents = finalsCents[idx] ?? 0;

        $part.textContent = (share*100).toFixed(2) + '%';
        $aj.textContent   = vv_fmtBRL(fromCents(toCents(base)));
        $fin.textContent  = vv_fmtBRL(fromCents(finCents));
      });

      const totAprovCents = toCents(totalBaseMO);
      const totServCents  = toCents(servicosTotal);
      const totDescCents  = toCents(descontoTotal);
      const totFinalCents = targetCents;

      let catProdutoC = 0;
      const kindByKey = new Map();
      rows.forEach(tr => { kindByKey.set(tr.dataset.key, tr.dataset.kind); });

      linhas.forEach((l, idx) => {
        const finC = finalsCents[idx] || 0;
        const kind = kindByKey.get(l.key) || "produto";
        if (kind !== "vidro") catProdutoC += finC;
      });

      const catServicoC = totServCents;
      const catVidroC   = rows.reduce((acc, tr) => {
        if (tr.dataset.kind === "vidro") {
          const original = Number(tr.dataset.valor || 0) || 0;
          return acc + toCents(original);
        }
        return acc;
      }, 0);

      $totAprov.textContent = vv_fmtBRL(fromCents(totAprovCents));
      $totServ.textContent  = vv_fmtBRL(fromCents(totServCents));
      $totDesc.textContent  = vv_fmtBRL(fromCents(totDescCents));

      const comDisplay = getModoComissao()==='percent'
        ? fromCents( toCents( (Number($comPercent.value||0)/100) * totalBaseMO ) )
        : fromCents( toCents( vv_parseBRL($comValor.value||'0') ) );
      $totCom.textContent   = vv_fmtBRL(comDisplay);

      $totAjust.textContent = vv_fmtBRL(fromCents(totFinalCents));
      $catProduto.textContent = vv_fmtBRL(fromCents(catProdutoC));
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
    async function tentarEnviarComissoes(payload){
      try { document.dispatchEvent(new CustomEvent('vv:comissoes:prontas', { detail: payload })); } catch(e){}
      if (typeof window.enviarComissoes !== 'function'){
        vvToast('Comissões preparadas, mas função enviarComissoes() não está disponível.', 'info');
        return { ok:false, resposta:null, erro:'Função enviarComissoes() ausente' };
      }
      vvToast('Enviando comissões…', 'info', 2000);
      try{
        const r = await Promise.resolve(window.enviarComissoes(payload));
        const ok = (typeof r?.ok === 'boolean') ? r.ok : true;
        if (ok){
          const arqV = payload?.arquiteto?.valorCalculado || 0;
          const venV = payload?.vendedor?.valorCalculado || 0;
          const arqPrev = payload?.arquiteto?.previsao || payload?.arquiteto?.prev || '';
          const arqVenc = payload?.arquiteto?.vencimento || payload?.arquiteto?.venc || '';
          const venPrev = payload?.vendedor?.previsao || payload?.vendedor?.prev || '';
          const venVenc = payload?.vendedor?.vencimento || payload?.vendedor?.venc || '';
          vvToast(
            `Comissões enviadas com sucesso — Arquiteto: ${vv_fmtBRL(arqV)} (Prev: ${arqPrev || '-'} | Venc: ${arqVenc || '-'}) · Vendedor: ${vv_fmtBRL(venV)} (Prev: ${venPrev || '-'} | Venc: ${venVenc || '-'})`,
            'ok',
            6000
          );
          try { document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', { detail: { ok:true, resposta:r, payload } })); } catch(_){}
          return { ok:true, resposta:r, erro:null };
        } else {
          const msg = r?.message || r?.erro || 'Falha ao enviar comissões.';
          vvToast(msg, 'erro', 6000);
          try { document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', { detail: { ok:false, resposta:r, erro:msg, payload } })); } catch(_){}
          return { ok:false, resposta:r, erro:msg };
        }
      } catch(e){
        const msg = e?.message || 'Erro inesperado ao enviar comissões.';
        vvToast(msg, 'erro', 6000);
        try { document.dispatchEvent(new CustomEvent('vv:comissoes:enviadas', { detail: { ok:false, resposta:null, erro:msg, payload } })); } catch(_){}
        return { ok:false, resposta:null, erro:msg };
      }
    }

    footer.querySelector('#vv-confirmar').addEventListener('click', async ()=>{
      const ignoradosKeys = new Set(
        [...tbody.querySelectorAll('.vv-ignorar')].filter(c => c.checked).map(c => c.dataset.key)
      );

      const aprovados = [];
      const ignorados = [];
      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        const key  = tr.dataset.key;
        const item = itens.find(i=> i.key===key);
        const isIgn = ignoradosKeys.has(key);
        if (isIgn){
          ignorados.push(item);
        } else {
          const finText = tr.querySelector('[data-col="final"]').textContent || '0';
          const finalValor = vv_parseBRL(finText);
          aprovados.push({
            ...item,
            valorOriginal: Number(item.valorTotalGrupo)||0,
            valorAjustadoParaOmie: finalValor
          });
        }
      });

      const totalAprovadoBaseComMO = vv_parseBRL($totAprov.textContent||'0');
      const valorServicos          = vv_parseBRL($totServ.textContent||'0');
      const valorDesconto          = vv_parseBRL($totDesc.textContent||'0');
      const totalFinalProdutos     = vv_parseBRL($totAjust.textContent||'0');

      const calcFromState = (s, base)=> s.modo==='percent'
        ? (Number(s.percent||0)/100) * base
        : Number(s.valorManual||0);

      const arqCalc  = calcFromState(_comArq, _lastTotalBaseMO);
      const vendCalc = calcFromState(_comVend, _lastTotalBaseMO);

      const comissoesParaEnvio = {
        baseConsiderada: _lastTotalBaseMO,
        // OBS: nome, codigo (fornecedor), previsao, vencimento e observacao vão para o backend
        arquiteto: {
          nome: _comArq?.nome||'',
          codigo: _comArq?.codigo||'',
          modo: _comArq?.modo||'percent',
          percent: Number(_comArq?.percent||0),
          valorManual: Number(_comArq?.valorManual||0),
          valorCalculado: arqCalc,
          previsao: _comArq?.prev||'',
          vencimento: _comArq?.venc||'',
          observacao: _comArq?.obs||'',
          codigo_categoria: "2.08.02" // força categoria do ARQUITETO no front
        },
        vendedor: {
          nome: _comVend?.nome||'',
          codigo: _comVend?.codigo||'',
          modo: _comVend?.modo||'percent',
          percent: Number(_comVend?.percent||0),
          valorManual: Number(_comVend?.valorManual||0),
          valorCalculado: vendCalc,
          previsao: _comVend?.prev||'',
          vencimento: _comVend?.venc||'',
          observacao: _comVend?.obs||'',
          codigo_categoria: "2.07.99" // força categoria do VENDEDOR no front
        }
      };

      // envia comissões (com confirmação visual)
      await tentarEnviarComissoes(comissoesParaEnvio);

      // fecha modal e resolve payload principal
      document.body.removeChild(backdrop);
      resolve({
        aprovadosParaOmie: aprovados,
        ignorados,
        totais: {
          totalAprovadoBaseComMO,
          valorServicos,
          valorDesconto,
          totalFinalProdutos,
          comissoes: {
            baseConsiderada: _lastTotalBaseMO,
            arquiteto: { ...comissoesParaEnvio.arquiteto },
            vendedor:  { ...comissoesParaEnvio.vendedor },
            total: Math.max(0, arqCalc) + Math.max(0, vendCalc)
          },
          porCategoria: {
            produto: vv_parseBRL($catProduto.textContent||'0'),
            servico: vv_parseBRL($catServico.textContent||'0'),
            vidro:   vv_parseBRL($catVidro.textContent||'0')
          }
        }
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
  if (window.enviarComissoes) return; // evita redefinir

  const API_URL = "https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com/api/omie/comissao";

  const toISODate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${dt.getFullYear()}-${m}-${day}`;
    } catch { return ""; }
  };

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

  // tipo: "arquiteto" | "vendedor"
  function montarLancamento(tipo, fonte, baseConsiderada) {
    const calc = Number(fonte?.valorCalculado || 0);
    const manual = Number(fonte?.valorManual || 0);
    const valor_documento = Number((calc > 0 ? calc : manual).toFixed(2));

    const data_previsao   = toISODate(fonte?.previsao || "");
    const data_vencimento = toISODate(fonte?.vencimento || "");

    // categoria forçada no front, mas se vier vazia tenta inferir
    let codigo_categoria = String(fonte?.codigo_categoria || "").trim();
    if (!codigo_categoria) {
      codigo_categoria = (String(tipo).toLowerCase() === "arquiteto") ? "2.08.02" : "2.07.99";
    }

    // payload para a sua rota (back usa exatamente estes campos)
    const payload = {
      valor_documento,
      data_previsao,
      data_vencimento,
      codigo_categoria, // envia já definido: vendedor 2.07.99 | arquiteto 2.08.02
      // importantíssimo: fornecedor e observação vindos do front
      ...(fonte?.codigo ? { codigo_cliente_fornecedor: String(fonte.codigo).trim() } : {}),
      ...(fonte?.observacao ? { observacao: String(fonte.observacao).trim() } : {}),
      // se quiser sobrepor a conta, descomente e informe:
      // id_conta_corrente: "2523861035",
    };

    return payload;
  }

  function validarLancamento(lanc, papel) {
    const erros = [];
    if (!(lanc?.valor_documento > 0)) erros.push("valor_documento inválido");
    if (!lanc?.data_previsao)  erros.push("data_previsao ausente");
    if (!lanc?.data_vencimento) erros.push("data_vencimento ausente");
    if (!lanc?.codigo_cliente_fornecedor) erros.push("codigo_cliente_fornecedor ausente");
    if (!lanc?.codigo_categoria) erros.push("codigo_categoria ausente");
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

  // expõe para o popup
  window.enviarComissoes = async function (payload) {
    try { document.dispatchEvent(new CustomEvent("vv:comissoes:prontas", { detail: { payload } })); } catch {}

    const lancArq  = montarLancamento("arquiteto", payload?.arquiteto, payload?.baseConsiderada);
    const lancVend = montarLancamento("vendedor",  payload?.vendedor,  payload?.baseConsiderada);

    const vArq = validarLancamento(lancArq, "arquiteto");
    const vVend = validarLancamento(lancVend, "vendedor");

    if (!vArq.valido || !vVend.valido) {
      const msgs = []
        .concat(!vArq.valido ? [`Arquiteto: ${vArq.erros.join(", ")}`] : [])
        .concat(!vVend.valido ? [`Vendedor: ${vVend.erros.join(", ")}`] : []);
      const erro = "Dados incompletos para enviar comissões.\n" + msgs.join("\n");
      toast(erro, false);
      try {
        document.dispatchEvent(new CustomEvent("vv:comissoes:enviadas", {
          detail: { ok: false, erro, resultados: { vArq, vVend } }
        }));
      } catch {}
      return { ok: false, erro, resultados: { vArq, vVend } };
    }

    const [resArq, resVend] = await Promise.all([
      postarLancamento(lancArq, "arquiteto"),
      postarLancamento(lancVend, "vendedor"),
    ]);

    const okGeral = !!(resArq?.ok && resVend?.ok);

    if (okGeral) {
      toast("Comissões enviadas com sucesso (arquiteto + vendedor).");
    } else {
      let msg = "Falha ao enviar comissões.\n";
      if (!resArq.ok) msg += `Arquiteto: ${resArq.erro || "erro"}\n`;
      if (!resVend.ok) msg += `Vendedor: ${resVend.erro || "erro"}\n`;
      toast(msg.trim(), false);
    }

    try {
      document.dispatchEvent(new CustomEvent("vv:comissoes:enviadas", {
        detail: { ok: okGeral, resultados: { arquiteto: resArq, vendedor: resVend } }
      }));
    } catch {}

    return { ok: okGeral, resultados: { arquiteto: resArq, vendedor: resVend } };
  };
})();










/* =========================================================
   4) ITENS IGNORADOS → "PRODUTOS FATURADOS DIRETO" (opcional)
   ========================================================= */
async function produtosFaturadosParaOCliente(ignorados) {
  try {
    if (!Array.isArray(ignorados) || !ignorados.length) return null;

    const clienteNome = vv_getClienteNome();
    const numeroOrcamento = vv_getNumeroOrcamento();
    const previsaoISO = vv_getPrimeiraDataParcelaISO();

    const docs = ignorados.map(item => ({
      numeroPedido: numeroOrcamento || '',
      cliente: clienteNome,
      fornecedor: '',
      vidro: item.descricao || '',
      tipo: '',
      quantidade: 1,
      orcamentoEnviado: '',
      aprovacao: '',
      moldeEnviado: '',
      recebemosLinkPagamento: '',
      pagamento: 'Pendente',
      previsao: previsaoISO || undefined,
      numeroPedidoFornecedor: '',
      vidrosProntos: '',
      naEmpresa: '',
      faturamento: 'Pendente',
      responsavelVendedor: '',
      numeroOrcFornecedor: '',
      valorReal: Number(item.valorTotalGrupo) || 0,
      numeroNotaFiscal: '',
      formaPagamento: '',
      observacao: `Ignorado no envio à Omie | Ambiente: ${item.ambiente || '-'} | Grupo: ${item.grupoId || '-'} | Código: ${item.codigo || '-'}`,
      meta: {
        origem: 'produtosFaturadosParaOCliente',
        numeroOrcamento: numeroOrcamento || null,
        chavePopup: item.key || null
      }
    }));

    const res = await fetch('https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com/api/produtos/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: docs })
    });
    const j = await res.json();
    if (!j.ok) throw new Error(j.error || 'Falha ao salvar itens ignorados');

    console.log(`✅ ${j.inserted} item(ns) criado(s) na "Aba de produtos faturados direto".`);
    alert(`✅ ${j.inserted} produto(s) foram criados na aba de Produtos Faturados Direto.\nEles não foram enviados para a Omie.`);

    if (typeof carregarProdutos === 'function') carregarProdutos();
    return j.data;
  } catch (err) {
    console.error('❌ produtosFaturadosParaOCliente() erro:', err);
    alert('Erro ao salvar itens ignorados: ' + err.message);
    return null;
  }
}

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
async function gerarPayloadOmie(){
  const pendencias = [];

  // validações
  const clientes = document.querySelectorAll("#clientesWrapper .cliente-item");
  const codigoCliente = clientes[0]?.querySelector(".codigoCliente")?.value?.trim();
  if (!codigoCliente) pendencias.push("Código do cliente não preenchido.");

  const primeiraDataParcelaRaw = Array.from(document.querySelectorAll(".data-parcela"))
    .map(el => (el.value || "").trim())
    .find(Boolean);

  const primeiraDataParcela = typeof formatarDataBR === "function"
    ? formatarDataBR(primeiraDataParcelaRaw)
    : "";

  if (!primeiraDataParcela) pendencias.push("Data da 1ª parcela não preenchida.");

  const linhasParcelas = document.querySelectorAll("#listaParcelas .row");
  if (!linhasParcelas.length) pendencias.push("Nenhuma parcela informada.");

  if (pendencias.length > 0) {
    if (typeof mostrarPopupPendencias === 'function') {
      mostrarPopupPendencias(pendencias);
    } else {
      alert("Pendências:\n- " + pendencias.join("\n- "));
    }
    return null;
  }

  // 1) ambientes
  const ambientesMarcados = (typeof lerAmbientesMarcados === "function")
    ? lerAmbientesMarcados()
    : [];

  // 2) candidatos
  const candidatos = coletarItensPorGrupoParaOmie(ambientesMarcados);
  if (!candidatos.length){
    alert("Nenhum item elegível encontrado nos ambientes marcados.");
    return null;
  }

  // 3) popup seleção
  const selecao = await abrirPopupSelecaoItensOmie(candidatos);
  if (!selecao){
    console.log("🚫 Seleção cancelada pelo usuário.");
    return null;
  }
  const { aprovadosParaOmie, ignorados } = selecao;
  if (!aprovadosParaOmie.length){
    alert("Selecione ao menos um item para enviar à Omie.");
    return null;
  }

  // 🔸 MÍNIMA ALTERAÇÃO: guardar a última seleção (inclui Total (Serviço))
  window.__vvUltimaSelecaoOmie = selecao;

  // 4) ignorados → produtos faturados direto (opcional)
  try {
    if (typeof produtosFaturadosParaOCliente === "function") {
      produtosFaturadosParaOCliente(ignorados);
    }
  } catch(e){
    console.warn("produtosFaturadosParaOCliente falhou:", e);
  }

  // 5) payload base (produtos)
  const numeroPedido = (typeof gerarNumeroPedidoUnico === "function")
    ? gerarNumeroPedidoUnico()
    : ("PED-" + Date.now());

  const payload = {
    cabecalho: {
      codigo_cliente: codigoCliente,
      codigo_pedido_integracao: numeroPedido,
      data_previsao: primeiraDataParcela, // DD/MM/AAAA
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
      enviar_email: "N"
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

  // 6) detalhes (somente aprovados) com valor AJUSTADO
  aprovadosParaOmie.forEach(item => {
    const valorFinal = vv_round2(Number(item.valorAjustadoParaOmie) || 0);
    const codigo_produto = item.codigo || "SEM-CODIGO";
    const descricao = item.descricao || "Item sem descrição";
    payload.det.push({
      ide: { codigo_item_integracao: numeroPedido },
      inf_adic: { peso_bruto: 1, peso_liquido: 1 },
      produto: {
        cfop: "5.102",
        codigo_produto,
        descricao,
        ncm: "9403.30.00",
        quantidade: 1,
        tipo_desconto: "V",
        unidade: "UN",
        valor_desconto: 0,
        valor_unitario: valorFinal
      }
    });
    payload.cabecalho.quantidade_itens++;
  });

  // 7) parcelas
  const parcelasPayload = [];
  const valores = [];

  linhasParcelas.forEach((linha, i) => {
    const elValor = linha.querySelector(".valor-parcela");
    const rawValor =
      (elValor?.value && elValor.value.trim()) ||
      (elValor?.dataset?.valorOriginal && elValor.dataset.valorOriginal.trim()) ||
      "";

    const valor = vv_round2(vv_parseBRL(rawValor));

    const dataISO = linha.querySelector(".data-parcela")?.value || "";
    const data_vencimento = (typeof formatarDataBR === "function")
      ? formatarDataBR(dataISO)
      : "";

    parcelasPayload.push({
      data_vencimento,
      numero_parcela: i + 1,
      percentual: "0.00",
      valor
    });

    valores.push(valor);
  });

  const somaParcelas = vv_round2(valores.reduce((acc, v) => acc + v, 0));
  let somaPerc = 0;
  parcelasPayload.forEach((p, idx) => {
    let pct = somaParcelas > 0 ? (p.valor / somaParcelas) * 100 : 0;
    pct = vv_round2(pct);
    parcelasPayload[idx].percentual = pct.toFixed(2);
    somaPerc = vv_round2(somaPerc + pct);
  });
  if (parcelasPayload.length) {
    const diff = vv_round2(100 - somaPerc);
    const last = parcelasPayload[parcelasPayload.length - 1];
    last.percentual = vv_round2(parseFloat(last.percentual) + diff).toFixed(2);
  }
  payload.lista_parcelas.parcela = parcelasPayload;

  console.log("📦 Payload final (estrutura antiga; valores ajustados):", payload);
  return payload;
}

/* =======================================
   6) ENVIAR PARA OMIE (botão/onclick)
   ======================================= */
async function atualizarNaOmie() {
  try{
    mostrarCarregando();

    const botao = document.getElementById("btn-gerar-pedido") 
               || document.getElementById("btnEnviarOmie");
    const spinner = document.getElementById("spinnerOmie");
    if (spinner) spinner.style.display = "inline-block";
    if (botao) botao.disabled = true;

    setTimeout(async () => {
      const payload = await gerarPayloadOmie();

      if (!payload) {
        if (spinner) spinner.style.display = "none";
        if (botao) botao.disabled = false;
        ocultarCarregando();
        return;
      }

      console.log("📦 Payload gerado (produtos):", payload);

      let sucessoProdutos = false;
      try {
        const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/omie/pedidos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`
          },
          body: JSON.stringify(payload)
        });

        const data = await resposta.json();

        if (resposta.ok) {
          sucessoProdutos = true;
          if (typeof mostrarPopupCustomizado === "function") {
            mostrarPopupCustomizado("✅ Sucesso!", "Pedido de PRODUTOS enviado com sucesso à Omie.", "success");
          }
          console.log("📤 Enviado à Omie (produtos):", data);
        } else {
          if (typeof mostrarPopupCustomizado === "function") {
            mostrarPopupCustomizado("❌ Erro ao enviar produtos", data?.erro || "Erro desconhecido ao enviar.", "error");
          }
          console.error("❌ Erro (produtos):", data);
        }
      } catch (erro) {
        if (typeof mostrarPopupCustomizado === "function") {
          mostrarPopupCustomizado("❌ Erro na conexão", "Falha ao enviar PRODUTOS. Verifique o servidor.", "error");
        }
        console.error("❌ Erro de envio (produtos):", erro);
      }

      // 🔸 MÍNIMA ALTERAÇÃO: após sucesso dos produtos, tenta enviar a OS de Serviços
      if (sucessoProdutos) {
        try {
          const selecao = window.__vvUltimaSelecaoOmie || null;
          const valorServicos = selecao?.totais?.valorServicos || 0; // 🛠️ Total (Serviço) do popup

          if (valorServicos > 0 && typeof enviarOSServico === "function") {
            console.log("🛠️ Enviando OS de Serviços. Valor:", valorServicos);
            const osResp = await enviarOSServico({ valorServicos });
            if (osResp?.ok) {
              if (typeof mostrarPopupCustomizado === "function") {
                mostrarPopupCustomizado(
                  "✅ Serviços enviados",
                  `OS de Serviços criada com sucesso.<br>Valor: ${vv_fmtBRL(valorServicos)}.`,
                  "success"
                );
              }
            } else {
              if (typeof mostrarPopupCustomizado === "function") {
                mostrarPopupCustomizado(
                  "⚠️ Serviços não enviados",
                  `Não foi possível criar a OS de Serviços agora.<br>Motivo: ${osResp?.error || "desconhecido"}`,
                  "warning"
                );
              }
            }
          } else {
            console.log("ℹ️ Sem serviços para enviar (valor 0) ou função enviarOSServico indisponível.");
          }
        } catch (err) {
          console.error("❌ Falha ao enviar OS de Serviços:", err);
          if (typeof mostrarPopupCustomizado === "function") {
            mostrarPopupCustomizado("⚠️ Serviços não enviados", "Ocorreu um erro ao criar a OS de Serviços.", "warning");
          }
        }
      }

      if (spinner) spinner.style.display = "none";
      if (botao) botao.disabled = false;
      ocultarCarregando();
    }, 300);
  } catch(e){
    console.error(e);
    ocultarCarregando();
  }
}


/* ================== CONFIG ================== */
const OS_SERVICOS_ENDPOINT = window.OS_SERVICOS_ENDPOINT
  || "https://ulhoa-servico-ec4e1aa95355.herokuapp.com/os";

/* Defaults (podem ser ajustados) */
const CCOD_LC116_DEFAULT = "7.01";
const CCOD_MUN_DEFAULT   = "0701-0/01-88";
const CCODPARC_DEFAULT   = "999";
const CETAPA_DEFAULT     = "20";
const CCODCATEG_DEFAULT  = "1.02.02";
const NCODCC_DEFAULT     = 10937506623;

/* ================== UTILS ================== */
function toBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}
function toISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const y  = d.getFullYear();
  const m  = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function vv_fmtBRL(n){ return (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

/* ================== CONTEXTOS DA TELA ================== */
/* Caso você tenha inputs dedicados (inpCodInt, inpData, inpCli, inpParc, inpAdicNF),
   mapeie seus IDs aqui para captar valores com prioridade. */
function ctxFormOS() {
  const byId = (id) => document.getElementById(id);

  const codInt  = byId("os-codint")?.value?.trim();           // ex: inpCodInt.value
  const dataBr  = byId("os-data")?.value?.trim();             // se já vier em DD/MM/AAAA
  const dataIso = byId("os-data-iso")?.value?.trim();         // se vier ISO
  const codCli  = byId("os-codcli")?.value?.trim();           // ex: inpCli.value
  const qtParc  = byId("os-qtd-parc")?.value?.trim();         // ex: inpParc.value
  const dadosNF = byId("os-dados-adicnf")?.value?.trim();     // ex: inpAdicNF.value

  return {
    cCodIntOS_form: codInt || "",
    dDtPrevisao_form: dataBr || toBR(dataIso || "") || "",
    nCodCli_form: codCli ? Number(codCli) : undefined,
    nQtdeParc_form: qtParc ? Number(qtParc) : undefined,
    cDadosAdicNF_form: dadosNF || ""
  };
}

function ctxParcelasOS() {
  const linhas = Array.from(document.querySelectorAll("#listaParcelas .row"));
  const nQtdeParc = linhas.length || 1;
  const primeiraISO = linhas.map(l => l.querySelector(".data-parcela")?.value?.trim())
                            .find(Boolean) || "";
  return {
    nQtdeParc,
    dDtPrevisaoBR: toBR(primeiraISO),
    dDtPrevisaoISO: toISO(primeiraISO)
  };
}

function ctxHeaderOS() {
  const orc = document.getElementById("numeroOrcamento");
  const cCodIntOS =
    (orc?.value && String(orc.value).trim())
    || (orc?.dataset?.valorOriginal && String(orc.dataset.valorOriginal).trim())
    || ("PED-" + Date.now());

  const razaoEl = document.querySelector("input.form-control.razaoSocial");
  const razao =
    (razaoEl?.value && String(razaoEl.value).trim())
    || (razaoEl?.dataset?.valorOriginal && String(razaoEl.dataset.valorOriginal).trim())
    || "";

  const nCodCli = (typeof getCodigoClientePorRazao === "function")
    ? (getCodigoClientePorRazao(razao) || "")
    : "";

  return { cCodIntOS, nCodCli, razaoSocial: razao };
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
  cCodIntOS, nCodCli, dDtPrevisaoBR, dDtPrevisaoISO, valorServicos
}) {
  // Prioridade: valores dos inputs dedicados (se existirem)
  const {
    cCodIntOS_form,
    dDtPrevisao_form,
    nCodCli_form,
    nQtdeParc_form,
    cDadosAdicNF_form
  } = ctxFormOS();

  // Cabeçalho
  const Cabecalho = {
    cCodIntOS: String(cCodIntOS_form || cCodIntOS || ""),
    cCodParc:  CCODPARC_DEFAULT,
    cEtapa:    CETAPA_DEFAULT,
    dDtPrevisao: String(
      dDtPrevisao_form || dDtPrevisaoBR || dDtPrevisaoISO || ""
    ).trim()
  };

  // nCodCli é aceito como vazio pelo seu server; inclua se tiver (form tem prioridade)
  const resolvedCodCli = (typeof nCodCli_form === "number" && nCodCli_form > 0)
    ? nCodCli_form
    : (nCodCli ? Number(nCodCli) : undefined);
  if (resolvedCodCli) Cabecalho.nCodCli = resolvedCodCli;

  // nQtdeParc: prioridade form, senão tenta derivar do contexto de parcelas
  const { nQtdeParc } = ctxParcelasOS();
  Cabecalho.nQtdeParc = Number(nQtdeParc_form || nQtdeParc || 1);

  // Se valorServicos não for válido, aborta antes de montar
  const nValUnitFinal = Number(valorServicos);
  if (!(nValUnitFinal > 0)) {
    throw new Error("Valor de Serviços inválido ou zero.");
  }

  const Departamentos = []; // sem uso por enquanto

  const Email = {
    cEnvBoleto: "N",
    cEnvLink:   "N",
    cEnviarPara:""
  };

  const InformacoesAdicionais = {
    cCodCateg:   CCODCATEG_DEFAULT,
    cDadosAdicNF: String(cDadosAdicNF_form || `OS incluída via API • Orçamento ${Cabecalho.cCodIntOS}`).trim(),
    nCodCC:      NCODCC_DEFAULT
  };

  const ServicosPrestados = [
    {
      cCodServLC116: CCOD_LC116_DEFAULT,
      cCodServMun:   CCOD_MUN_DEFAULT,
      cRetemISS:     "N",
      cTribServ:     "01",
      impostos: {
        cRetemIRRF: "N",
        cRetemPIS:  "N",
        nAliqIRRF:  0,
        nAliqISS:   0,
        nAliqPIS:   0
      },
      nQtde: 1,
      nValUnit: Number(nValUnitFinal.toFixed(2))
    }
  ];

  return {
    Cabecalho,
    Departamentos,
    Email,
    InformacoesAdicionais,
    ServicosPrestados
  };
}

/* ================== ENVIO PARA /os ================== */
async function enviarOSServico({ valorServicos, endpoint = OS_SERVICOS_ENDPOINT }) {
  try {
    if (!(Number(valorServicos) > 0)) {
      const msg = "Valor de Serviços inválido ou zerado.";
      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
      } else { alert(msg); }
      return { ok:false, error: msg };
    }

    // Contextos
    const { cCodIntOS, nCodCli } = ctxHeaderOS();
    const { dDtPrevisaoBR, dDtPrevisaoISO } = ctxParcelasOS();

    // Campos mínimos
    const faltas = [];
    if (!cCodIntOS && !ctxFormOS().cCodIntOS_form) faltas.push("cCodIntOS");
    const temData = (ctxFormOS().dDtPrevisao_form || dDtPrevisaoBR || dDtPrevisaoISO);
    if (!temData) faltas.push("dDtPrevisao");
    if (faltas.length) {
      const msg = "Campos obrigatórios ausentes: " + faltas.join(", ");
      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
      } else { alert(msg); }
      return { ok:false, error: msg };
    }

    // Payload final no formato solicitado
    const payload = montarPayloadOS({
      cCodIntOS, nCodCli, dDtPrevisaoBR, dDtPrevisaoISO, valorServicos
    });

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessTokenServico") || localStorage.getItem("accessToken");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    console.log("➡️ POST /os payload:", payload);
    const resp = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
    const raw = await resp.text();
    let data; try { data = JSON.parse(raw); } catch { data = { ok: resp.ok, raw }; }
    console.log("⬅️ /os status:", resp.status, data);

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
      return { ok:false, error: motivo, data };
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
    return { ok:true, data };
  } catch (err) {
    console.error("❌ enviarOSServico erro:", err);
    const msg = err?.message || String(err);
    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
    } else { alert("Erro ao enviar Serviços:\n" + msg); }
    return { ok:false, error: msg };
  }
}

/* Expor global */
window.enviarOSServico = enviarOSServico;