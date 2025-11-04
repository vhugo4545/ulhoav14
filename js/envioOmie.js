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
    width: min(860px);
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
  // fecha possível overlay de carregamento antes do popup
  if (typeof ocultarCarregando === 'function') ocultarCarregando();

  // helper para normalizar e identificar "Mão de Obra de Instalação (por Hora)"
  const normalize = (s) => (s || '')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const isMaoDeObraInstalPorHora = (desc) => {
    const n = normalize(desc);
    return n.includes('mao de obra de instalacao') && n.includes('(por hora)');
  };

  return new Promise(resolve => {
    // backdrop/modal
    const backdrop = document.createElement('div');
    backdrop.className = 'vv-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'vv-modal';

    const header = document.createElement('header');
    header.innerHTML = `<h3>Selecione os itens (Serviços será rateado nos aprovados)</h3>`;

    const body = document.createElement('div');
    body.className = 'vv-body';

    // controles (Serviços e Comissão)
    const controls = document.createElement('div');
    controls.style.cssText = "display:grid; gap:8px; margin-bottom:12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); align-items:end;";
    controls.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-weight:600;">Serviços (aplicado nos produtos aprovados)</label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <label><input type="radio" name="srvModo" value="percent" checked> % do total aprovado</label>
          <label><input type="radio" name="srvModo" value="valor"> Valor fixo (R$)</label>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="srvPercent" type="number" min="0" step="0.01" value="0" class="vv-input" style="width:120px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;" aria-label="Percentual de serviços (%)">
          <input id="srvValor"   type="text"   value="R$ 0,00" class="vv-input" style="width:160px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;" aria-label="Valor de serviços (R$)">
        </div>
        <small class="vv-help">Ignorados <b>não</b> entram no rateio de Serviços.</small>
      </div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-weight:600;">Comissão (informativa — não vai para a Omie)</label>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <label><input type="radio" name="comModo" value="percent" checked> % do total aprovado</label>
          <label><input type="radio" name="comModo" value="valor"> Valor fixo (R$)</label>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="comPercent" type="number" min="0" step="0.01" value="0" class="vv-input" style="width:120px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;" aria-label="Percentual de comissão (%)">
          <input id="comValor"   type="text"   value="R$ 0,00" class="vv-input" style="width:160px; padding:8px; border:1px solid #e2e8f0; border-radius:8px;" aria-label="Valor de comissão (R$)">
        </div>
        <small class="vv-help">Mantemos o payload <b>idêntico ao antigo</b>.</small>
      </div>
    `;

    // tabela
    const table = document.createElement('table');
    table.className = 'vv-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width:44px;">Ignorar</th>
          <th>Ambiente</th>
          <th>Produto</th>
          <th>Código</th>
          <th class="vv-right">% participação</th>
          <th class="vv-right">Valor original</th>
          <th class="vv-right">Valor ajustado</th>
          <th class="vv-right">Final p/ OMIE</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    // footer
    const footer = document.createElement('div');
    footer.className = 'vv-footer';
    footer.innerHTML = `
      <div class="totais">
        <div>Total aprovado: <b id="vv-total-aprovado">R$ 0,00</b></div>
        <div>Serviços aplicado: <b id="vv-total-servicos">R$ 0,00</b></div>
        <div>Comissão (info): <b id="vv-total-comissao">R$ 0,00</b></div>
        <div>Total produtos após ajuste: <b id="vv-total-ajustado">R$ 0,00</b></div>
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

    const help = document.createElement('div');
    help.className = 'vv-help';
    help.innerHTML = `
      Por padrão, todos os itens (1 por grupo) irão para a Omie. Marque "Ignorar" nos que <b>não</b> irão.<br>
      Defina "Serviços" por % ou R$: esse valor será <b>rateado proporcionalmente</b> entre os itens aprovados, reduzindo o valor final enviado à Omie.<br>
      "Comissão" é apenas informativa (não altera payload).
    `;

    // monta modal
    const bodyWrap = document.createElement('div');
    bodyWrap.appendChild(help);
    bodyWrap.appendChild(controls);
    bodyWrap.appendChild(table);
    body.appendChild(bodyWrap);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // popula linhas
    itens.forEach(item => {
      const tr = document.createElement('tr');
      const ehMOHora = isMaoDeObraInstalPorHora(item.descricao);
      tr.innerHTML = `
        <td><input type="checkbox" class="vv-ignorar" data-key="${item.key}"></td>
        <td>${item.ambiente}</td>
        <td>${item.descricao ? item.descricao : '<small>Sem descrição</small>'}${ehMOHora ? ' <small style="color:#2563eb;font-weight:600;">(MO Hora)</small>' : ''}</td>
        <td><span class="vv-mono">${item.codigo || '-'}</span></td>
        <td class="vv-right vv-mono" data-col="part">0%</td>
        <td class="vv-right vv-mono" data-col="original">${vv_fmtBRL(item.valorTotalGrupo)}</td>
        <td class="vv-right vv-mono" data-col="ajustado">R$ 0,00</td>
        <td class="vv-right vv-mono" data-col="final">R$ 0,00</td>
      `;
      tr.dataset.key = item.key;
      tr.dataset.valor = String(Number(item.valorTotalGrupo)||0);
      tr.dataset.islabor = ehMOHora ? '1' : '0'; // ⭐ marca Mão de Obra (por Hora)
      tbody.appendChild(tr);
    });

    // refs
    const chkAll      = [...tbody.querySelectorAll('.vv-ignorar')];
    const $totAprov   = footer.querySelector('#vv-total-aprovado');
    const $totServ    = footer.querySelector('#vv-total-servicos');
    const $totCom     = footer.querySelector('#vv-total-comissao');
    const $totAjust   = footer.querySelector('#vv-total-ajustado');
    const $srvPercent = controls.querySelector('#srvPercent');
    const $srvValor   = controls.querySelector('#srvValor');
    const $comPercent = controls.querySelector('#comPercent');
    const $comValor   = controls.querySelector('#comValor');

    const getModoServicos = () => (controls.querySelector('input[name="srvModo"]:checked')?.value) || 'percent';
    const getModoComissao = () => (controls.querySelector('input[name="comModo"]:checked')?.value) || 'percent';
    const isIgnoredKey    = (key) => !!chkAll.find(c => c.dataset.key===key)?.checked;

    const lerAprovados = () =>
      itens.filter(i => !isIgnoredKey(i.key));

   function recalc(){
  const rows = [...tbody.querySelectorAll('tr')];

  // 1) Quem está aprovado?
  const isIgnoredKey = (key) => !!chkAll.find(c => c.dataset.key===key)?.checked;
  const aprovadosRows = rows.filter(tr => !isIgnoredKey(tr.dataset.key));

  // 2) Soma dos aprovados (originais) — ainda sem MO e sem Serviços
  const somaAprovOriginal = aprovadosRows.reduce((acc, tr) => {
    return acc + (Number(tr.dataset.valor||0) || 0);
  }, 0);

  // 3) MO ignorada (total)
  const laborIgnoredTotal = rows.reduce((acc, tr) => {
    const isLab = tr.dataset.islabor === '1';
    const isIgn = isIgnoredKey(tr.dataset.key);
    if (isLab && isIgn) {
      return acc + (Number(tr.dataset.valor||0) || 0);
    }
    return acc;
  }, 0);

  // 4) Divisão igual da MO ignorada entre os aprovados
  const nRecebedores = aprovadosRows.length || 0;
  const parcelaIgual = (nRecebedores > 0) ? vv_round2(laborIgnoredTotal / nRecebedores) : 0;

  // 5) Base com MO (por item) e total da base com MO
  let totalBaseComMO = 0;
  const baseComMOByKey = new Map(); // key -> baseWithLabor
  aprovadosRows.forEach(tr => {
    const key = tr.dataset.key;
    const original = Number(tr.dataset.valor||0) || 0;
    const baseWithLabor = vv_round2(original + parcelaIgual);
    baseComMOByKey.set(key, baseWithLabor);
    totalBaseComMO += baseWithLabor;
  });
  totalBaseComMO = vv_round2(totalBaseComMO);

  // 6) Serviços (agora calculado SOBRE a base com MO)
  let valorServicos = 0;
  if (getModoServicos()==='percent'){
    const p = Number($srvPercent.value||0);
    valorServicos = vv_round2((p/100) * totalBaseComMO);
  } else {
    valorServicos = vv_round2(vv_parseBRL($srvValor.value||0));
  }
  // Cap nos aprovados (com MO)
  valorServicos = Math.min(Math.max(0, valorServicos), totalBaseComMO);

  // 7) Comissão (informativa; não altera valores)
  let valorComissao = 0;
  if (getModoComissao()==='percent'){
    const p = Number($comPercent.value||0);
    valorComissao = vv_round2((p/100) * totalBaseComMO);
  } else {
    valorComissao = vv_round2(vv_parseBRL($comValor.value||0));
  }
  valorComissao = Math.max(0, valorComissao);

  // 8) Distribuição por linha:
  //    - participação passa a ser baseada na base com MO (é essa base que gera o rateio dos Serviços)
  //    - "Valor ajustado" = baseWithLabor
  //    - "Final p/ OMIE" = baseWithLabor - (valorServicos * shareBaseMO)
  rows.forEach(tr => {
    const key      = tr.dataset.key;
    const original = Number(tr.dataset.valor||0) || 0;
    const ignorado = isIgnoredKey(key);

    const $part = tr.querySelector('[data-col="part"]');
    const $aj   = tr.querySelector('[data-col="ajustado"]');
    const $fin  = tr.querySelector('[data-col="final"]');

    if (ignorado || totalBaseComMO<=0){
      $part.textContent = '0%';
      $aj.textContent   = vv_fmtBRL(original); // referência visual
      $fin.textContent  = vv_fmtBRL(0);
      return;
    }

    const baseWithLabor = baseComMOByKey.get(key) || 0;
    const shareBaseMO   = baseWithLabor / totalBaseComMO; // participação sobre a base com MO
    const descontoServ  = vv_round2(valorServicos * shareBaseMO);
    const final         = vv_round2(baseWithLabor - descontoServ);

    $part.textContent = (shareBaseMO*100).toFixed(2) + '%';
    $aj.textContent   = vv_fmtBRL(baseWithLabor); // ✅ agora mostra a base com MO
    $fin.textContent  = vv_fmtBRL(final);         // ✅ após descontar serviços
  });

  // 9) Totais do rodapé
  const totalFinalProdutos = rows.reduce((acc, tr) => {
    const key = tr.dataset.key;
    if (isIgnoredKey(key)) return acc;
    const finText = tr.querySelector('[data-col="final"]').textContent || '0';
    return acc + vv_parseBRL(finText);
  }, 0);

  // "Total aprovado" passa a refletir a BASE COM MO (que é a base real para os Serviços)
  $totAprov.textContent = vv_fmtBRL(totalBaseComMO);
  $totServ.textContent  = vv_fmtBRL(valorServicos);
  $totCom.textContent   = vv_fmtBRL(valorComissao);
  $totAjust.textContent = vv_fmtBRL(vv_round2(totalFinalProdutos));
}


    // eventos
    controls.querySelectorAll('input[name="srvModo"]').forEach(r=> r.addEventListener('change', recalc));
    controls.querySelectorAll('input[name="comModo"]').forEach(r=> r.addEventListener('change', recalc));
    [$srvPercent, $srvValor, $comPercent, $comValor].forEach(inp=>{
      inp.addEventListener('input', recalc);
      if (inp=== $srvValor || inp=== $comValor){
        inp.addEventListener('blur', ()=> { inp.value = vv_fmtBRL(vv_parseBRL(inp.value)); });
      }
    });

    footer.querySelector('#vv-marcar-todos').addEventListener('click', ()=>{
      [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.checked = true);
      recalc();
    });
    footer.querySelector('#vv-desmarcar-todos').addEventListener('click',  ()=>{
      [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.checked = false);
      recalc();
    });
    [...tbody.querySelectorAll('.vv-ignorar')].forEach(c => c.addEventListener('change', recalc));

    footer.querySelector('#vv-cancelar').addEventListener('click', ()=>{
      document.body.removeChild(backdrop);
      resolve(null);
    });

    footer.querySelector('#vv-confirmar').addEventListener('click', async ()=>{
      const aprovados = [];
      const ignorados = [];

      const ignoradosKeys = new Set(
        [...tbody.querySelectorAll('.vv-ignorar')].filter(c => c.checked).map(c => c.dataset.key)
      );
      const aprovadosLista = itens.filter(i => !ignoradosKeys.has(i.key));
      const somaAprov = aprovadosLista.reduce((acc,i)=> acc + (Number(i.valorTotalGrupo)||0), 0);

      // Serviços (valor total final) — será enviado como OS separada (stub abaixo)
      let valorServicos = 0;
      if ((controls.querySelector('input[name="srvModo"]:checked')?.value) === 'percent'){
        const p = Number($srvPercent.value||0);
        valorServicos = vv_round2((p/100) * somaAprov);
      } else {
        valorServicos = vv_round2(vv_parseBRL($srvValor.value||0));
      }
      valorServicos = Math.min(Math.max(0, valorServicos), somaAprov);

      // Comissão (apenas info)
      let valorComissao = 0;
      if ((controls.querySelector('input[name="comModo"]:checked')?.value) === 'percent'){
        const p = Number($comPercent.value||0);
        valorComissao = vv_round2((p/100) * somaAprov);
      } else {
        valorComissao = vv_round2(vv_parseBRL($comValor.value||0));
      }

      // extrai valores finais da UI (já com redistribuição da MO ignorada)
      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        const key  = tr.dataset.key;
        const item = itens.find(i=> i.key===key);
        const isIgn = tr.querySelector('.vv-ignorar')?.checked;

        const partText = tr.querySelector('[data-col="part"]').textContent || '0%';
        const part = Number(partText.replace('%',''))/100;

        if (isIgn){
          ignorados.push(item);
        } else {
          const finText = tr.querySelector('[data-col="final"]').textContent || '0';
          const finalValor = vv_round2(vv_parseBRL(finText));
          aprovados.push({
            ...item,
            part,
            valorOriginal: Number(item.valorTotalGrupo)||0,
            valorAjustadoParaOmie: finalValor
          });
        }
      });

      // Envia OS de serviços (se > 0) e SEMPRE mostra popup de sucesso/erro (mantido):
      if (valorServicos > 0 && typeof enviarOSServico === 'function') {
        try {
          const resp = await enviarOSServico({ valorServicos });
          if (!resp || resp.ok !== true) {
            const msg = (resp && (resp.error || resp.message)) || "Falha desconhecida ao enviar OS de Serviços.";
            if (typeof mostrarPopupCustomizado === "function") {
              mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
            } else {
              alert("Erro ao enviar Serviços: " + msg);
            }
          } else {
            if (typeof mostrarPopupCustomizado === "function") {
              mostrarPopupCustomizado("✅ Serviços enviados", `OS de Serviços enviada em ${vv_fmtBRL(valorServicos)}.`, "success");
            }
          }
        } catch (e) {
          const msg = e?.message || String(e);
          if (typeof mostrarPopupCustomizado === "function") {
            mostrarPopupCustomizado("❌ Erro ao enviar Serviços", msg, "error");
          } else {
            alert("Erro ao enviar Serviços: " + msg);
          }
        }
      }

      document.body.removeChild(backdrop);
      resolve({
        aprovadosParaOmie: aprovados,
        ignorados,
        totais: { totalAprovado: somaAprov, valorServicos, valorComissao }
      });
    });

    // primeiro cálculo
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