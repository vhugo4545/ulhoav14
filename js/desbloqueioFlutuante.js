// desbloqueioFlutuante.js — botão flutuante "Solicitar desbloqueio" no editar.
// Junta as duas travas: por etapa da Kommo (bloqueioKommo.js → window._kommoBloqueio)
// e por valor (bloqueioValor.js → window._lvBloqueio). Os pedidos vão para o
// aprovador definido em Ajustes, que decide na listagem (notificacoesAprovador.js).

(function () {
  const API_APROV = "https://ulhoa-0a02024d350a.herokuapp.com/api/aprovacoes-valor";
  const TICK_MS = 1000;
  const POLL_MS = 30000;

  const idProposta = new URLSearchParams(location.search).get("id");
  if (!idProposta) return;

  const emailUsuario = (localStorage.getItem("usuarioEmail") || "").toLowerCase();
  const nomeUsuario  = localStorage.getItem("usuarioNome") || "";

  const fmtBRL  = n => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = d => d ? new Date(d).toLocaleString("pt-BR") : "";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function cfgAprovador() {
    const lv = window.CFgAPI?.obter()?.limiteValor
      || (() => { try { return JSON.parse(localStorage.getItem("cfg_limite_valor")); } catch { return null; } })();
    return { id: lv?.aprovadorId || "", nome: lv?.aprovadorNome || "o aprovador" };
  }

  // ── Pedido de desbloqueio por etapa ───────────────────────────────────────
  async function solicitarEtapa(justificativa) {
    const k = window._kommoBloqueio;
    const proposta = window.propostaAtual || window.propostaEmEdicao || {};
    const r = await fetch(API_APROV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo:           "etapa",
        propostaId:     idProposta,
        numeroProposta: proposta.numeroProposta || proposta.camposFormulario?.numeroOrcamento || "",
        nomeCliente:    proposta.camposFormulario?.clientes?.[0]?.nome_razao_social || "",
        solicitante:    nomeUsuario || emailUsuario || "Usuário",
        email:          emailUsuario,
        justificativa,
        statusId:       k.statusId,
        nomeEtapa:      k.nomeEtapa,
      }),
    }).catch(() => null);
    if (!r?.ok) { alert("Não foi possível enviar o pedido de desbloqueio."); return; }
    k.pendente = await r.json();
    k.negado = null;
  }

  // Acompanha a decisão do pedido de etapa: aprovado → recarrega para destravar
  async function verificarDecisaoEtapa() {
    const k = window._kommoBloqueio;
    if (!k?.travado || !k.pendente) return;
    try {
      const r = await fetch(`${API_APROV}?propostaId=${idProposta}&tipo=etapa`);
      if (!r.ok) return;
      const docs = await r.json();
      const doc = docs.find(d => d._id === k.pendente._id);
      if (!doc || doc.status === "pendente") return;
      if (doc.status === "aprovado") { location.reload(); return; }
      k.pendente = null;
      k.negado = doc.status === "negado" ? doc : null;
    } catch (_) {}
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.id = "desbloqueio-flutuante";
  wrap.innerHTML = `
    <style>
      #dbf-btn{position:fixed;right:24px;bottom:84px;z-index:99990;display:none;align-items:center;gap:8px;
        border:none;border-radius:999px;padding:11px 18px;font-family:inherit;font-size:13px;font-weight:700;color:#fff;
        box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}
      #dbf-painel{position:fixed;right:24px;bottom:138px;z-index:99990;display:none;width:min(380px,calc(100vw - 48px));
        max-height:70vh;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;
        box-shadow:0 12px 32px rgba(0,0,0,.2);font-family:inherit;color:#1e293b}
      #dbf-painel header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:700;font-size:14px}
      .dbf-item{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px}
      .dbf-item:last-child{border-bottom:none}
      .dbf-tit{font-weight:700;margin-bottom:3px}
      .dbf-sub{color:#64748b;font-size:12px}
      .dbf-item textarea{width:100%;box-sizing:border-box;margin-top:8px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;
        font-family:inherit;font-size:12px;resize:vertical;min-height:54px}
      .dbf-item button{margin-top:8px;padding:8px 14px;border:none;border-radius:8px;background:#c2410c;color:#fff;
        font-family:inherit;font-size:12px;font-weight:700;cursor:pointer}
      .dbf-tag{display:inline-block;margin-top:8px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600}
    </style>
    <button type="button" id="dbf-btn"></button>
    <div id="dbf-painel" role="dialog" aria-label="Solicitar desbloqueio">
      <header>
        <span class="material-icons-outlined" style="font-size:18px;color:#c2410c;">lock_open</span>
        <span style="flex:1;">Solicitar desbloqueio</span>
        <button type="button" id="dbf-fechar" aria-label="Fechar" style="border:none;background:none;cursor:pointer;color:#64748b;display:flex;padding:0;">
          <span class="material-icons-outlined">close</span>
        </button>
      </header>
      <div id="dbf-lista"></div>
    </div>`;

  const ui = {};
  let assinatura = "";
  let enviando = false;

  function travas() {
    const lista = [];
    const k = window._kommoBloqueio;
    if (k?.travado) {
      lista.push({
        chave: "etapa",
        titulo: `🔒 Bloqueado pela etapa ${k.nomeEtapa}`,
        sub: "Pedido de liberação desta proposta nesta etapa da Kommo.",
        pendente: k.pendente, negado: k.negado,
        enviar: solicitarEtapa,
      });
    }
    const v = window._lvBloqueio;
    if (v?.travado) {
      lista.push({
        chave: "valor",
        titulo: "🔒 Bloqueado pelo valor",
        sub: `Total ${fmtBRL(v.total)} acima do limite de ${fmtBRL(v.limite)}.`,
        pendente: v.pendente, negado: v.negado,
        enviar: v.solicitar,
      });
    }
    return lista;
  }

  function render() {
    const lista = travas();
    const aprov = cfgAprovador();
    const sig = JSON.stringify([aprov.id, lista.map(t => [t.chave, t.titulo, t.pendente?._id, t.negado?._id])]);

    // Reativa os próprios botões: o bloqueioKommo desabilita todos os botões da página
    wrap.querySelectorAll("button, textarea").forEach(el => {
      if (el.dataset.ocupado) return;
      el.disabled = false; el.removeAttribute("readonly");
      el.style.pointerEvents = ""; el.style.opacity = ""; el.style.cursor = "";
    });

    if (!lista.length) { ui.btn.style.display = "none"; ui.painel.style.display = "none"; return; }

    const todosPendentes = lista.every(t => t.pendente);
    ui.btn.style.display = "inline-flex";
    ui.btn.style.background = todosPendentes ? "#b45309" : "#c2410c";
    ui.btn.innerHTML = `<span class="material-icons-outlined" style="font-size:18px;">${todosPendentes ? "hourglass_top" : "lock_open"}</span>
      ${todosPendentes ? "Aguardando desbloqueio" : "Solicitar desbloqueio"}`;

    if (sig === assinatura || enviando) return; // não apaga o que o usuário está digitando
    assinatura = sig;

    ui.lista.innerHTML = "";
    lista.forEach(t => {
      const item = document.createElement("div");
      item.className = "dbf-item";
      let corpo = `<div class="dbf-tit">${esc(t.titulo)}</div><div class="dbf-sub">${esc(t.sub)}</div>`;
      if (!aprov.id) {
        corpo += `<span class="dbf-tag" style="background:#f1f5f9;color:#475569;">Nenhum aprovador definido em Ajustes. Fale com o gestor.</span>`;
      } else if (t.pendente) {
        corpo += `<span class="dbf-tag" style="background:#fffbeb;color:#92400e;">⏳ Pedido enviado em ${fmtData(t.pendente.dataHora)} · aguardando ${esc(aprov.nome)}</span>`;
      } else {
        if (t.negado) {
          corpo += `<span class="dbf-tag" style="background:#fee2e2;color:#991b1b;">⛔ Negado por ${esc(t.negado.aprovador || aprov.nome)}${t.negado.observacao ? ": " + esc(t.negado.observacao) : ""}</span>`;
        }
        corpo += `<textarea placeholder="Justificativa para ${esc(aprov.nome)} (opcional)"></textarea>
          <button type="button">${t.negado ? "Pedir novamente" : `Enviar pedido para ${esc(aprov.nome)}`}</button>`;
      }
      item.innerHTML = corpo;
      const btn = item.querySelector("button");
      if (btn) {
        btn.addEventListener("click", async () => {
          enviando = true;
          btn.dataset.ocupado = "1"; btn.disabled = true; btn.textContent = "Enviando…";
          try { await t.enviar(item.querySelector("textarea")?.value.trim() || ""); }
          finally { delete btn.dataset.ocupado; enviando = false; assinatura = ""; render(); }
        });
      }
      ui.lista.appendChild(item);
    });
  }

  function iniciar() {
    document.body.appendChild(wrap);
    ui.btn    = wrap.querySelector("#dbf-btn");
    ui.painel = wrap.querySelector("#dbf-painel");
    ui.lista  = wrap.querySelector("#dbf-lista");
    ui.btn.addEventListener("click", () => {
      ui.painel.style.display = ui.painel.style.display === "block" ? "none" : "block";
    });
    wrap.querySelector("#dbf-fechar").addEventListener("click", () => { ui.painel.style.display = "none"; });

    render();
    setInterval(render, TICK_MS);
    setInterval(() => { if (document.visibilityState === "visible") verificarDecisaoEtapa(); }, POLL_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
