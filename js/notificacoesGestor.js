// notificacoesGestor.js — balão de aprovações pendentes para admins

(function () {
  const API          = "https://ulhoa-0a02024d350a.herokuapp.com/api/propostas";
  const API_APROV    = "https://ulhoa-0a02024d350a.herokuapp.com/api/aprovacoes-minimo";
  // Pedidos de autorização para gerar o PDF com produtos desatualizados na Omie (BarraPesquisa.js)
  const API_PRODUTO  = "https://ulhoa-0a02024d350a.herokuapp.com/api/aprovacoes-produto";
  const STATUS_PENDENTE = "Pendente de aprovação";
  const POLL_INTERVAL = 30000; // 30s

  function isAdmin() {
    return (localStorage.getItem("usuarioTipo") || "") === "admin";
  }

  // ── Cria o painel ──────────────────────────────────────────────────
  function criarPainel() {
    if (document.getElementById("ng-container")) return;

    const container = document.createElement("div");
    container.id = "ng-container";
    container.innerHTML = `
      <style>
        #ng-bell {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 52px;
          height: 52px;
          background: #1e40af;
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          z-index: 99998;
          transition: background .2s;
        }
        #ng-bell:hover { background: #1d4ed8; }
        #ng-bell .material-icons-outlined { font-size: 26px; }
        #ng-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        #ng-painel {
          position: fixed;
          bottom: 88px;
          right: 24px;
          width: 340px;
          max-height: 500px;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          z-index: 99997;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }
        #ng-painel.aberto { display: flex; }
        #ng-header {
          background: #1e40af;
          color: #fff;
          padding: 14px 16px;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        #ng-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .ng-tab {
          flex: 1;
          padding: 8px 0;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all .15s;
        }
        .ng-tab.ativo { color: #1e40af; border-bottom-color: #1e40af; }
        #ng-lista {
          overflow-y: auto;
          flex: 1;
          padding: 8px;
        }
        .ng-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .ng-item.ng-item--min { border-left: 3px solid #f59e0b; }
        .ng-item.ng-item--prod { border-left: 3px solid #c2410c; }
        .ng-prod-lista { font-size: 11px; color: #6b7280; margin: 0 0 6px; padding-left: 14px; }
        .ng-item.ng-item--aprovado { border-left: 3px solid #22c55e; }
        .ng-item.ng-item--negado { border-left: 3px solid #ef4444; }
        .ng-item-top { font-weight: 700; color: #111827; margin-bottom: 2px; }
        .ng-item-sub { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
        .ng-item-valores { font-size: 12px; color: #374151; margin-bottom: 8px; }
        .ng-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .ng-pill--pendente { background:#fffbeb; color:#92400e; }
        .ng-pill--aprovado { background:#f0fdf4; color:#166534; }
        .ng-pill--negado   { background:#fef2f2; color:#991b1b; }
        .ng-btns { display: flex; gap: 6px; }
        .ng-btn {
          flex: 1;
          border: none;
          border-radius: 8px;
          padding: 7px 0;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .ng-btn--aprovar { background: #16a34a; color: #fff; }
        .ng-btn--aprovar:hover { background: #15803d; }
        .ng-btn--negar   { background: #ef4444; color: #fff; }
        .ng-btn--negar:hover { background: #dc2626; }
        .ng-btn--ver     { background: #1e40af; color: #fff; }
        .ng-btn--ver:hover { background: #1d4ed8; }
        #ng-vazio {
          text-align: center;
          color: #9ca3af;
          padding: 32px 16px;
          font-size: 13px;
        }
      </style>

      <button id="ng-bell">
        <span class="material-icons-outlined">notifications</span>
        <span id="ng-badge"></span>
      </button>

      <div id="ng-painel">
        <div id="ng-header">
          <span>Aprovações</span>
          <span id="ng-count-label">0</span>
        </div>
        <div id="ng-tabs">
          <div class="ng-tab ativo" data-tab="pendentes">Pendentes</div>
          <div class="ng-tab" data-tab="historico">Histórico</div>
          <div class="ng-tab" data-tab="status">Status PDV</div>
        </div>
        <div id="ng-lista">
          <div id="ng-vazio">Nenhuma solicitação pendente.</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById("ng-bell").addEventListener("click", () => {
      document.getElementById("ng-painel").classList.toggle("aberto");
    });

    document.addEventListener("click", (e) => {
      const painel = document.getElementById("ng-painel");
      const bell   = document.getElementById("ng-bell");
      if (painel && bell && !painel.contains(e.target) && !bell.contains(e.target)) {
        painel.classList.remove("aberto");
      }
    });

    // Tab switching
    document.getElementById("ng-tabs").addEventListener("click", e => {
      const tab = e.target.closest(".ng-tab");
      if (!tab) return;
      document.querySelectorAll(".ng-tab").forEach(t => t.classList.remove("ativo"));
      tab.classList.add("ativo");
      renderizarAba(tab.dataset.tab);
    });
  }

  // ── Estado global ────────────────────────────────────────────────────
  let _todasPropostas  = [];
  let _todasAprovacoes = []; // coleção dedicada aprovacoes_minimo
  let _todasProduto    = []; // coleção aprovacoes_produto (produtos desatualizados na Omie)

  const _esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Card do pedido de produto desatualizado (pendente ou já decidido)
  function _itemProduto(s) {
    const dt = new Date(s.dataHora).toLocaleString("pt-BR");
    const prods = s.produtos || [];
    const lista = prods.slice(0, 3).map(p => `<li>${_esc(p.descricao)} · ${_esc(p.dataAlt)} (${p.dias} dias)</li>`).join("")
      + (prods.length > 3 ? `<li>… e mais ${prods.length - 3}</li>` : "");
    const pendente = s.status === "pendente";
    const aprovado = s.status === "aprovado";
    const ver = `<button class="ng-btn ng-btn--ver" onclick="window.location.href='editar.html?id=${_esc(s.propostaId)}'">Ver</button>`;
    return `
      <div class="ng-item ${pendente ? "ng-item--prod" : aprovado ? "ng-item--aprovado" : "ng-item--negado"}">
        <div class="ng-item-top">Proposta ${_esc(s.numeroProposta || "—")}</div>
        <div class="ng-item-sub">${_esc(s.nomeCliente || "Cliente não informado")}</div>
        <div class="ng-item-valores">📦 ${prods.length} produto(s) desatualizado(s) na Omie (mais de ${s.limiteDias || "—"} dias) · pede liberação do PDF</div>
        <ul class="ng-prod-lista">${lista}</ul>
        ${s.justificativa ? `<div class="ng-item-sub" style="color:#374151;">💬 ${_esc(s.justificativa)}</div>` : ""}
        <div class="ng-item-sub">Solicitante: ${_esc(s.solicitante)} · ${dt}</div>
        ${pendente
          ? `<span class="ng-pill ng-pill--pendente">⏳ Pendente</span>
             <div class="ng-btns">
               <button class="ng-btn ng-btn--aprovar" onclick="_ngProduto('${_esc(s._id)}','aprovado')">✓ Aprovar</button>
               <button class="ng-btn ng-btn--negar"   onclick="_ngProduto('${_esc(s._id)}','negado')">✗ Negar</button>
               ${ver}
             </div>`
          : `<span class="ng-pill ${aprovado ? "ng-pill--aprovado" : "ng-pill--negado"}">${aprovado ? "✓ Aprovado" : "✗ Negado"}</span>
             <div class="ng-item-sub">Por: ${_esc(s.aprovador || "—")} · ${s.dataAprovacao ? new Date(s.dataAprovacao).toLocaleString("pt-BR") : "—"}${s.observacao ? " · " + _esc(s.observacao) : ""}</div>
             <div class="ng-btns">${ver}</div>`}
      </div>`;
  }

  // ── Renderiza a aba ativa ───────────────────────────────────────────
  function renderizarAba(aba) {
    const lista = document.getElementById("ng-lista");
    if (!lista) return;

    if (aba === "pendentes") {
      const pendentes = _todasAprovacoes.filter(s => s.status === "pendente");
      const pendProduto = _todasProduto.filter(s => s.status === "pendente");

      if (pendentes.length === 0 && pendProduto.length === 0) {
        lista.innerHTML = '<div id="ng-vazio">Nenhuma solicitação pendente.</div>';
        return;
      }
      const fmtBRL = n => (n||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      lista.innerHTML = pendProduto.map(_itemProduto).join("") + pendentes.map(s => {
        const dt = new Date(s.dataHora).toLocaleString("pt-BR");
        return `
          <div class="ng-item ng-item--min">
            <div class="ng-item-top">Proposta ${s.numeroProposta || "—"}</div>
            <div class="ng-item-sub">${s.nomeCliente || "Cliente não informado"}</div>
            <div class="ng-item-valores">Final: <strong style="color:#dc2626;">${fmtBRL(s.valorFinal)}</strong> · Mín: ${fmtBRL(s.valorMinimo)}</div>
            <div class="ng-item-sub">Solicitante: ${s.solicitante} · ${dt}</div>
            <span class="ng-pill ng-pill--pendente">⏳ Pendente</span>
            <div class="ng-btns">
              <button class="ng-btn ng-btn--aprovar" onclick="_ngAprovar('${s._id}')">✓ Aprovar</button>
              <button class="ng-btn ng-btn--negar"   onclick="_ngNegar('${s._id}')">✗ Negar</button>
              <button class="ng-btn ng-btn--ver"     onclick="window.location.href='modelo.html?id=${s.propostaId}'">Ver</button>
            </div>
          </div>`;
      }).join("");

    } else if (aba === "historico") {
      const historico = [..._todasAprovacoes, ..._todasProduto.map(s => ({ ...s, _produto: true }))]
        .filter(s => s.status === "aprovado" || s.status === "negado")
        .sort((a, b) => new Date(b.dataAprovacao || b.dataHora) - new Date(a.dataAprovacao || a.dataHora));

      if (historico.length === 0) {
        lista.innerHTML = '<div id="ng-vazio">Nenhum histórico.</div>';
        return;
      }
      const fmtBRL = n => (n||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      lista.innerHTML = historico.map(s => {
        if (s._produto) return _itemProduto(s);
        const dtSolic  = new Date(s.dataHora).toLocaleString("pt-BR");
        const dtAp     = s.dataAprovacao ? new Date(s.dataAprovacao).toLocaleString("pt-BR") : "—";
        const aprovado = s.status === "aprovado";
        return `
          <div class="ng-item ${aprovado ? 'ng-item--aprovado' : 'ng-item--negado'}">
            <div class="ng-item-top">Proposta ${s.numeroProposta || "—"}</div>
            <div class="ng-item-sub">${s.nomeCliente || "Cliente não informado"}</div>
            <div class="ng-item-valores">Final: ${fmtBRL(s.valorFinal)} · Mín: ${fmtBRL(s.valorMinimo)}</div>
            <span class="ng-pill ${aprovado ? 'ng-pill--aprovado' : 'ng-pill--negado'}">${aprovado ? '✓ Aprovado' : '✗ Negado'}</span>
            <div class="ng-item-sub">Por: ${s.aprovador || '—'} · ${dtAp}</div>
            <div class="ng-item-sub">Solicitante: ${s.solicitante} · ${dtSolic}</div>
            <button class="ng-btn ng-btn--ver" style="width:100%;" onclick="window.location.href='modelo.html?id=${s.propostaId}'">Ver proposta</button>
          </div>`;
      }).join("");

    } else if (aba === "status") {
      const pendentes = _todasPropostas.filter(p => p.statusOrcamento === STATUS_PENDENTE);
      if (pendentes.length === 0) {
        lista.innerHTML = '<div id="ng-vazio">Nenhuma proposta aguardando aprovação de status.</div>';
        return;
      }
      lista.innerHTML = pendentes.map(p => {
        const numero  = p.camposFormulario?.numero || p.numero || "—";
        const cliente = _nomeCliente(p);
        const data    = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("pt-BR") : "—";
        return `
          <div class="ng-item">
            <div class="ng-item-top">Proposta ${numero}</div>
            <div class="ng-item-sub">${cliente} · ${data}</div>
            <button class="ng-btn ng-btn--ver" style="width:100%;margin-top:4px;" onclick="window.location.href='modelo.html?id=${p._id}'">
              Ver e aprovar
            </button>
          </div>`;
      }).join("");
    }
  }

  function _nomeCliente(p) {
    return p.camposFormulario?.clientes?.[0]?.nome_razao_social ||
           p.camposFormulario?.nomeCliente ||
           p.nomeCliente ||
           "Cliente não informado";
  }

  // ── Aprovar / Negar ─────────────────────────────────────────────────
  window._ngAprovar = async function(aprovacaoId) {
    await _resolverSolicitacao(aprovacaoId, "aprovado");
  };
  window._ngNegar = async function(aprovacaoId) {
    await _resolverSolicitacao(aprovacaoId, "negado");
  };

  async function _resolverSolicitacao(aprovacaoId, novoStatus) {
    const aprovador = localStorage.getItem("usuarioNome") || "Gestor";
    const token     = localStorage.getItem("accessToken") || "";

    const put = await fetch(`${API_APROV}/${aprovacaoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: novoStatus, aprovador })
    }).catch(() => null);

    if (!put || !put.ok) { alert("Erro ao salvar decisão."); return; }
    const doc = await put.json();

    // Atualiza estado local
    const idx = _todasAprovacoes.findIndex(s => s._id === aprovacaoId);
    if (idx >= 0) _todasAprovacoes[idx] = doc;

    // Se estamos dentro da proposta afetada, atualiza o badge dela
    if (new URLSearchParams(location.search).get("id") === doc.propostaId?.toString()) {
      window._solicitacoesAprovacaoMinimo = _todasAprovacoes.filter(
        s => s.propostaId?.toString() === doc.propostaId?.toString()
      );
      if (typeof adicionarTotalizadoresPorAmbienteComAgrupamento === "function") {
        adicionarTotalizadoresPorAmbienteComAgrupamento();
      }
    }

    atualizarBadge();
    renderizarAba("pendentes");
  }

  // Decide o pedido de produto desatualizado; aprovado → a proposta fica "aprovado pelo gestor"
  window._ngProduto = async function(id, status) {
    let observacao = "";
    if (status === "negado") {
      const motivo = prompt("Motivo da negativa (opcional):");
      if (motivo === null) return;
      observacao = motivo;
    } else if (!confirm("Autorizar o PDF desta proposta? Ela ficará como \"aprovado pelo gestor\".")) {
      return;
    }
    const token = localStorage.getItem("accessToken") || "";
    const put = await fetch(`${API_PRODUTO}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, observacao, aprovador: localStorage.getItem("usuarioNome") || "Gestor" })
    }).catch(() => null);
    if (!put?.ok) {
      const err = await put?.json().catch(() => null);
      alert(err?.error || "Erro ao salvar decisão.");
      return;
    }
    const doc = await put.json();
    const idx = _todasProduto.findIndex(s => s._id === id);
    if (idx >= 0) _todasProduto[idx] = doc;
    atualizarBadge();
    renderizarAba("pendentes");
  };

  // ── Atualiza badge ─────────────────────────────────────────────────
  function atualizarBadge() {
    const badge = document.getElementById("ng-badge");
    const label = document.getElementById("ng-count-label");
    if (!badge || !label) return;

    const pendentesMin   = _todasAprovacoes.filter(s => s.status === "pendente").length;
    const pendentesStatus = _todasPropostas.filter(p => p.statusOrcamento === STATUS_PENDENTE).length;
    const pendentesProduto = _todasProduto.filter(s => s.status === "pendente").length;
    const total = pendentesMin + pendentesStatus + pendentesProduto;

    label.textContent   = total;
    badge.style.display = total > 0 ? "flex" : "none";
    badge.textContent   = total > 0 ? total : "";
  }

  // ── Polling ─────────────────────────────────────────────────────────
  async function buscarPendentes() {
    try {
      const token = localStorage.getItem("accessToken") || "";

      const [respostaPropostas, respostaAprovacoes, respostaProduto] = await Promise.all([
        fetch(API,        { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(API_APROV,  { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(API_PRODUTO, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      if (respostaPropostas?.ok) {
        const lista = await respostaPropostas.json();
        _todasPropostas = Array.isArray(lista) ? lista : [];
      }
      if (respostaAprovacoes?.ok) {
        const lista = await respostaAprovacoes.json();
        _todasAprovacoes = Array.isArray(lista) ? lista : [];
      }
      if (respostaProduto?.ok) {
        const lista = await respostaProduto.json();
        _todasProduto = Array.isArray(lista) ? lista : [];
      }

      atualizarBadge();
      const abaAtiva = document.querySelector(".ng-tab.ativo")?.dataset?.tab || "pendentes";
      renderizarAba(abaAtiva);
    } catch (_) {}
  }

  // ── Init ─────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    if (!isAdmin()) return;
    criarPainel();
    buscarPendentes();
    setInterval(buscarPendentes, POLL_INTERVAL);
  });
})();
