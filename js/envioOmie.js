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
/* ============================================
   3) POPUP DE SELEÇÃO + RATEIO DE SERVIÇOS
   ============================================ */
async function abrirPopupSelecaoItensOmie(itens){
  if (typeof ocultarCarregando === 'function') ocultarCarregando();

  // --- helpers de normalização e identificação ---
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

  // Vidro: começa com "vidro" ou "vidros"
  if (/^vidros?\b/.test(n)) return "vidro";

  // Serviço: "Mão de Obra de Instalação (por Hora)"
  if (isMaoDeObraInstalPorHora(desc)) return "servico";

  // Caso padrão
  return "produto";
};


  return new Promise(resolve => {
    // ======== UI (modal) ========
    const backdrop = document.createElement('div'); backdrop.className = 'vv-modal-backdrop';
    const modal    = document.createElement('div'); modal.className    = 'vv-modal';

    const header = document.createElement('header');
    header.innerHTML = `<h3>Selecione os itens (Desconto primeiro → Ignorar → MO → Serviços)</h3>`;

    const body  = document.createElement('div'); body.className = 'vv-body';

    // --------- controles (Serviços / Desconto / Comissão) ---------
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

      <!-- Desconto (calculado primeiro) -->
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

      <!-- Comissão (informativa) -->
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
        <small class="vv-help">Mantemos o payload idêntico ao antigo.</small>
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
        <div>🟡 Desconto total (sobre TODOS): <b id="vv-total-desconto">R$ 0,00</b></div>
        <div>Comissão (info): <b id="vv-total-comissao">R$ 0,00</b></div>
        <div>Total produtos após ajuste: <b id="vv-total-ajustado">R$ 0,00</b></div>

        <!-- Totais por categoria (FINAIS p/ OMIE) -->
        <div style="margin-top:10px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px; padding-top:8px; border-top:1px dashed #e5e7eb;">
          <div>🔹 Total (Produto): <b id="vv-cat-produto">R$ 0,00</b></div>
          <div>🛠️ Total (Serviço): <b id="vv-cat-servico">R$ 0,00</b></div>
          <div>🪟 Total (Vidro): <b id="vv-cat-vidro">R$ 0,00</b></div>
        </div>

        <small class="vv-help" style="display:block; margin-top:6px;">
          <b>Regra especial:</b> se "Mão de Obra de Instalação (por Hora)" for <i>ignorado</i>, seu valor é dividido em partes iguais entre os itens não ignorados.
        </small>
      </div>
      <div class="acoes" style="display:flex; gap:8px;">
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

    // --------- helpers numéricos ---------
    const sum = (arr) => arr.reduce((a,b)=>a+b,0);
    const toCents = (v) => Math.round(v * 100);      // materializa centavos só no fim
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

  // -------- 0) Aux: total de VIDRO (sempre, mesmo ignorados) --------
  const catVidroC_all = rows.reduce((acc, tr) => {
    if (tr.dataset.kind === "vidro") {
      const original = Number(tr.dataset.valor || 0) || 0;
      return acc + toCents(original);
    }
    return acc;
  }, 0);

  // -------- 1) DESCONTO (primeiro) sobre o TOTAL de TODOS os itens (originais) --------
  const totalTodos = rows.reduce((acc, tr) => acc + (Number(tr.dataset.valor||0) || 0), 0);

  let descontoTotal = 0;
  if (getModoDesconto()==='percent'){
    const p = Number($discPercent.value||0);
    descontoTotal = (p/100) * totalTodos;
  } else {
    descontoTotal = vv_parseBRL($discValor.value||'0');
  }
  // clamp entre 0 e total
  descontoTotal = Math.max(0, Math.min(descontoTotal, totalTodos));

  // -------- 2) Ignorados / Aprovados --------
  const aprovadosRows = rows.filter(tr => !isIgnoredKey(tr.dataset.key));
  const nAprov = aprovadosRows.length;

  // Se nada aprovado, pinta UI básica e mantém Vidro somando todos os vidros
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
    $catVidro.textContent   = vv_fmtBRL(fromCents(catVidroC_all)); // vidros sempre aparecem
    return;
  }

  // -------- 3) MO ignorada total (divisão IGUAL entre aprovados) --------
  const laborIgnoredTotal = rows.reduce((acc, tr) => {
    const isLab = tr.dataset.islabor === '1';
    const isIgn = isIgnoredKey(tr.dataset.key);
    return acc + (isLab && isIgn ? (Number(tr.dataset.valor||0) || 0) : 0);
  }, 0);
  const cotaMO = laborIgnoredTotal > 0 ? (laborIgnoredTotal / nAprov) : 0;

  // -------- 4) Base + MO por item aprovado (sem arredondar) --------
  const baseMOMap = new Map(); // key -> baseWithMO
  let totalBaseMO = 0;
  aprovadosRows.forEach(tr => {
    const original = Number(tr.dataset.valor||0) || 0;
    const base = original + cotaMO;
    baseMOMap.set(tr.dataset.key, base);
    totalBaseMO += base;
  });

  // -------- 5) Serviços sobre a base+MO (apenas aprovados) --------
  let servicosTotal = 0;
  if (getModoServicos()==='percent'){
    const p = Number($srvPercent.value||0);
    servicosTotal = (p/100) * totalBaseMO;
  } else {
    servicosTotal = vv_parseBRL($srvValor.value||'0');
  }
  // serviços não pode ultrapassar a base aprovada
  servicosTotal = Math.max(0, Math.min(servicosTotal, totalBaseMO));

  // -------- 6) Aplicação do DESCONTO nos aprovados (igual por item) --------
  // o desconto foi calculado sobre TODOS; só a parte que cabe aos aprovados pode ser aplicada
  const descontoAplicavel = Math.min(descontoTotal, totalBaseMO);
  const cotaDescontoIgual = nAprov > 0 ? (descontoAplicavel / nAprov) : 0;

  // -------- 7) Finais por item (sem arredondar) --------
  const linhas = []; // { key, baseFloat, servFloat, finalFloat }
  aprovadosRows.forEach(tr => {
    const key = tr.dataset.key;
    const base = baseMOMap.get(key) || 0;
    const share = totalBaseMO > 0 ? (base / totalBaseMO) : 0;
    const servAbat = servicosTotal * share; // abatimento proporcional de serviços
    const final = Math.max(0, base - servAbat - cotaDescontoIgual);
    linhas.push({ key, baseFloat: base, servFloat: servAbat, finalFloat: final });
  });

  // -------- 8) Arredonda só no final + corrige resíduo de centavos --------
  const sumCents  = (arr) => arr.reduce((a,b)=>a+b,0);

  const targetTotalFinal = totalBaseMO - servicosTotal - descontoAplicavel;
  const targetCents = toCents(targetTotalFinal);

  let finalsCents = linhas.map(l => toCents(l.finalFloat));
  let somaCents   = sumCents(finalsCents);
  let delta = targetCents - somaCents;

  // distribui o resíduo centavo a centavo
  let i = 0;
  while (delta !== 0 && linhas.length > 0){
    finalsCents[i % linhas.length] += (delta > 0 ? 1 : -1);
    delta += (delta > 0 ? -1 : 1);
    i++;
  }

  // -------- 9) Render por linha --------
  rows.forEach(tr => {
    const key = tr.dataset.key;
    const $part = tr.querySelector('[data-col="part"]');
    const $aj   = tr.querySelector('[data-col="ajustado"]');
    const $fin  = tr.querySelector('[data-col="final"]');

    const ignorado = isIgnoredKey(key);
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
    $aj.textContent   = vv_fmtBRL(fromCents(toCents(base))); // exibe base+MO (sem desconto/serv)
    $fin.textContent  = vv_fmtBRL(fromCents(finCents));      // final p/ Omie
  });

  // -------- 10) Totais --------
  const totAprovCents = toCents(totalBaseMO);
  const totServCents  = toCents(servicosTotal);
  const totDescCents  = toCents(descontoTotal); // desconto sobre TODOS
  const totFinalCents = targetCents;

  // === Totais por categoria ===
  // Produto = finais aprovados que NÃO são vidro
  // Serviço = total de serviços calculado (apenas aprovados)
  // Vidro   = soma dos valores ORIGINAIS de TODOS os itens classificados como vidro (mesmo ignorados)
  let catProdutoC = 0;

  const kindByKey = new Map();
  rows.forEach(tr => { kindByKey.set(tr.dataset.key, tr.dataset.kind); });

  linhas.forEach((l, idx) => {
    const finC = finalsCents[idx] || 0;
    const kind = kindByKey.get(l.key) || "produto";
    if (kind !== "vidro") catProdutoC += finC;
  });

  const catServicoC = totServCents;   // serviços (controle)
  const catVidroC   = catVidroC_all;  // vidros (originais de todos)

  // Pinta totais
  $totAprov.textContent = vv_fmtBRL(fromCents(totAprovCents));
  $totServ.textContent  = vv_fmtBRL(fromCents(totServCents));
  $totDesc.textContent  = vv_fmtBRL(fromCents(totDescCents));

  // Comissão (apenas display; não entra no final)
  const comDisplay = getModoComissao()==='percent'
    ? fromCents( toCents( (Number($comPercent.value||0)/100) * totalBaseMO ) )
    : fromCents( toCents( vv_parseBRL($comValor.value||'0') ) );
  $totCom.textContent   = vv_fmtBRL(comDisplay);

  $totAjust.textContent = vv_fmtBRL(fromCents(totFinalCents));
  $catProduto.textContent = vv_fmtBRL(fromCents(catProdutoC));
  $catServico.textContent = vv_fmtBRL(fromCents(catServicoC));
  $catVidro.textContent   = vv_fmtBRL(fromCents(catVidroC));
}



    // eventos
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

    footer.querySelector('#vv-cancelar').addEventListener('click', ()=>{
      document.body.removeChild(backdrop);
      resolve(null);
    });

    footer.querySelector('#vv-confirmar').addEventListener('click', ()=>{
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

      document.body.removeChild(backdrop);
      resolve({
        aprovadosParaOmie: aprovados,
        ignorados,
        totais: {
          totalAprovadoBaseComMO,
          valorServicos,
          valorDesconto,
          totalFinalProdutos,
          porCategoria: {
            produto: vv_parseBRL($catProduto.textContent||'0'),
            servico: vv_parseBRL($catServico.textContent||'0'),
            vidro:   vv_parseBRL($catVidro.textContent||'0')
          }
        }
      });
    });

    // primeira pintura
    recalc();
  });
}






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

  // 4) ignorados → produtos faturados direto
  try {
    if (typeof produtosFaturadosParaOCliente === "function") {
      produtosFaturadosParaOCliente(ignorados);
    }
  } catch(e){
    console.warn("produtosFaturadosParaOCliente falhou:", e);
  }

  // 5) payload base
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

  // 7) parcelas (sua regra)
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

    // pequeno debounce visual
    setTimeout(async () => {
      const payload = await gerarPayloadOmie();

      if (!payload) {
        if (spinner) spinner.style.display = "none";
        if (botao) botao.disabled = false;
        ocultarCarregando();
        return;
      }

      console.log("📦 Payload gerado:", payload);

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
          mostrarPopupCustomizado("✅ Sucesso!", "Pedido enviado com sucesso à Omie.", "success");
          console.log("📤 Enviado à Omie:", data);
        } else {
          mostrarPopupCustomizado("❌ Erro ao enviar", data?.erro || "Erro desconhecido ao enviar pedido.", "error");
          console.error("❌ Erro:", data);
        }
      } catch (erro) {
        mostrarPopupCustomizado("❌ Erro na conexão", "Não foi possível enviar o pedido. Verifique a conexão com o servidor.", "error");
        console.error("❌ Erro de envio:", erro);
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