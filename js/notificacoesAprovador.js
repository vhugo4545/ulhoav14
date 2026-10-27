// notificacoesAprovador.js — popup de aprovações por valor-limite na listagem.
// Aprovador (definido em Ajustes): popup com os pedidos pendentes, abre sozinho
//   quando chega pedido novo e permite liberar/negar ali mesmo.
// Quem pediu: popup avisando quando o pedido foi aprovado ou negado.

(function () {
  const CFG_URL   = "https://utils-b488312867a6.herokuapp.com/api/configuracoes";
  const API_APROV = "https://ulhoa-0a02024d350a.herokuapp.com/api/aprovacoes-valor";
  const POLL_INTERVAL = 20000;
  const LS_VISTOS    = "lv_aprov_vistos";     // ids de pendentes já mostrados ao aprovador
  const LS_DECISOES  = "lv_decisoes_vistas";  // ids de decisões já mostradas ao solicitante

  const emailUsuario = (localStorage.getItem("usuarioEmail") || "").toLowerCase();
  const nomeUsuario  = localStorage.getItem("usuarioNome") || "";
  const idUsuario    = (() => {
    try {
      const t = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
      const p = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return p?.id ? String(p.id) : "";
    } catch { return ""; }
  })();
  if (!emailUsuario && !idUsuario) return;

  const fmtBRL = n => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtData = d => d ? new Date(d).toLocaleString("pt-BR") : "";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lerSet = k => { try { return new Set(JSON.parse(localStorage.getItem(k)) || []); } catch { return new Set(); } };
  const gravarSet = (k, set) => { try { localStorage.setItem(k, JSON.stringify([...set].slice(-300))); } catch {} };

  async function obterConfig() {
    try {
      const r = await fetch(CFG_URL);
      if (r.ok) return await r.json();
    } catch (_) {}
    try { return JSON.parse(localStorage.getItem("ulhoa_cfg_v1")); } catch { return null; }
  }

  async function listar(query) {
    const r = await fetch(`${API_APROV}?${query}`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return (await r.json()) || [];
  }

  // ── Avisos fora da página (aba em segundo plano) ──────────────────────────
  const tituloOriginal = document.title;
  function marcarTitulo(n) {
    document.title = n ? `(${n}) ${tituloOriginal}` : tituloOriginal;
  }

  function notificarSistema(titulo, corpo, url) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification(titulo, { body: corpo, tag: "lv-aprov" });
      n.onclick = () => { window.focus(); if (url) location.href = url; n.close(); };
    } catch (_) {}
  }

  function bip() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.08;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch (_) {}
  }

  // ── Popup ────────────────────────────────────────────────────────────────
  function criarUI() {
    const wrap = document.createElement("div");
    wrap.id = "lv-aprov";
    wrap.innerHTML = `
      <style>
        #lv-aprov-pill{position:fixed;left:24px;bottom:24px;z-index:99997;display:none;align-items:center;gap:8px;
          background:#c2410c;color:#fff;border:none;border-radius:999px;padding:10px 16px;font-family:inherit;font-size:13px;font-weight:600;
          box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}
        #lv-aprov-overlay{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;
          background:rgba(15,23,42,.5);padding:16px}
        #lv-aprov-modal{background:#fff;border-radius:14px;width:min(620px,100%);max-height:85vh;display:flex;flex-direction:column;
          box-shadow:0 20px 50px rgba(0,0,0,.3);font-family:inherit;color:#1e293b;overflow:hidden}
        #lv-aprov-modal header{display:flex;align-items:center;gap:10px;padding:16px 20px;background:#fff7ed;border-bottom:1px solid #fed7aa}
        #lv-aprov-modal header h3{margin:0;font-size:16px;font-weight:700;color:#7c2d12;flex:1}
        #lv-aprov-lista{overflow:auto;padding:12px 20px;display:flex;flex-direction:column;gap:10px}
        .lv-item{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
        .lv-item.novo{border-color:#fb923c;box-shadow:0 0 0 2px #ffedd5}
        .lv-item .lv-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}
        .lv-item .lv-nome{font-weight:700;font-size:14px}
        .lv-item .lv-valor{font-weight:700;color:#c2410c;font-size:15px}
        .lv-item .lv-meta{color:#64748b;font-size:12px;margin-top:3px}
        .lv-acoes{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
        .lv-acoes button,.lv-acoes a{padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
          font-family:inherit;border:1px solid transparent;text-decoration:none;display:inline-flex;align-items:center}
        .lv-motivo{display:none;margin-top:8px;gap:6px}
        .lv-motivo input{flex:1;padding:7px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:inherit}
        #lv-aprov-modal footer{display:flex;align-items:center;gap:10px;padding:12px 20px;border-top:1px solid #f1f5f9;flex-wrap:wrap}
        #lv-aprov-modal footer .lv-dica{flex:1;font-size:11px;color:#64748b}
      </style>
      <button type="button" id="lv-aprov-pill">
        <span class="material-icons-outlined" style="font-size:18px;">price_check</span>
        <span id="lv-aprov-pill-txt"></span>
      </button>
      <div id="lv-aprov-overlay" role="dialog" aria-modal="true" aria-labelledby="lv-aprov-titulo">
        <div id="lv-aprov-modal">
          <header>
            <span class="material-icons-outlined" style="color:#c2410c;">price_check</span>
            <h3 id="lv-aprov-titulo"></h3>
            <button type="button" id="lv-aprov-fechar" aria-label="Fechar"
              style="border:none;background:none;cursor:pointer;color:#64748b;display:flex;">
              <span class="material-icons-outlined">close</span>
            </button>
          </header>
          <div id="lv-aprov-lista"></div>
          <footer>
            <span class="lv-dica" id="lv-aprov-dica"></span>
            <button type="button" id="lv-aprov-notif" style="display:none;padding:7px 12px;border:1px solid #fdba74;border-radius:8px;background:#fff7ed;color:#c2410c;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">
              Ativar avisos no computador
            </button>
          </footer>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const ui = {
      pill: wrap.querySelector("#lv-aprov-pill"),
      pillTxt: wrap.querySelector("#lv-aprov-pill-txt"),
      overlay: wrap.querySelector("#lv-aprov-overlay"),
      titulo: wrap.querySelector("#lv-aprov-titulo"),
      lista: wrap.querySelector("#lv-aprov-lista"),
      dica: wrap.querySelector("#lv-aprov-dica"),
      notif: wrap.querySelector("#lv-aprov-notif"),
    };
    ui.abrir  = () => { ui.overlay.style.display = "flex"; };
    ui.fechar = () => { ui.overlay.style.display = "none"; ui.aoFechar?.(); };
    ui.pill.addEventListener("click", ui.abrir);
    wrap.querySelector("#lv-aprov-fechar").addEventListener("click", ui.fechar);
    ui.overlay.addEventListener("click", e => { if (e.target === ui.overlay) ui.fechar(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && ui.overlay.style.display === "flex") ui.fechar(); });

    if ("Notification" in window && Notification.permission === "default") {
      ui.notif.style.display = "";
      ui.notif.addEventListener("click", async () => {
        const p = await Notification.requestPermission();
        if (p !== "default") ui.notif.style.display = "none";
      });
    }
    return ui;
  }

  // ── Aprovador ───────────────────────────────────────────────────────────
  function iniciarAprovador() {
    const ui = criarUI();
    const vistos = lerSet(LS_VISTOS);
    let pendentes = [];
    let novosIds = new Set();

    ui.aoFechar = () => { pendentes.forEach(d => vistos.add(d._id)); gravarSet(LS_VISTOS, vistos); novosIds = new Set(); render(); };

    async function decidir(id, status, modo, observacao) {
      const r = await fetch(`${API_APROV}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, modo, observacao, aprovador: nomeUsuario || emailUsuario }),
      }).catch(() => null);
      if (!r?.ok) {
        const err = await r?.json().catch(() => null);
        alert(err?.error || "Erro ao salvar a decisão.");
        return;
      }
      vistos.add(id); gravarSet(LS_VISTOS, vistos);
      await atualizar();
    }

    function render() {
      const n = pendentes.length;
      ui.pill.style.display = n ? "inline-flex" : "none";
      ui.pillTxt.textContent = n === 1 ? "1 aprovação pendente" : `${n} aprovações pendentes`;
      marcarTitulo(n);
      ui.titulo.textContent = n
        ? (n === 1 ? "1 orçamento aguardando sua aprovação" : `${n} orçamentos aguardando sua aprovação`)
        : "Nenhuma aprovação pendente";
      ui.dica.textContent = "Valor: \"até o valor\" trava de novo se o total subir. Etapa: \"só nesta etapa\" trava de novo se o lead mudar para outra etapa bloqueada.";

      if (!n) {
        ui.lista.innerHTML = `<div style="padding:24px;text-align:center;color:#64748b;font-size:13px;">Tudo em dia ✅</div>`;
        return;
      }
      ui.lista.innerHTML = "";
      pendentes.forEach(d => {
        const item = document.createElement("div");
        item.className = "lv-item" + (novosIds.has(d._id) ? " novo" : "");
        const url = `editar.html?id=${encodeURIComponent(d.propostaId)}`;
        const etapa = d.tipo === "etapa";
        item.innerHTML = `
          <div class="lv-top">
            <span class="lv-nome">${esc(d.numeroProposta || "Sem número")} · ${esc(d.nomeCliente || "Cliente")}${novosIds.has(d._id) ? ' <span style="font-size:10px;background:#c2410c;color:#fff;border-radius:999px;padding:1px 7px;vertical-align:middle;">NOVO</span>' : ""}</span>
            <span class="lv-valor">${etapa ? "Etapa: " + esc(d.nomeEtapa || d.statusId) : fmtBRL(d.valorTotal)}</span>
          </div>
          <div class="lv-meta">${etapa ? "Desbloqueio da etapa da Kommo" : `Valor acima do limite de ${fmtBRL(d.valorLimite)}`} · pedido por ${esc(d.solicitante)} em ${fmtData(d.dataHora)}</div>
          ${d.justificativa ? `<div class="lv-meta" style="color:#334155;">💬 ${esc(d.justificativa)}</div>` : ""}
          <div class="lv-acoes">
            <button type="button" data-a="sempre" style="background:#16a34a;color:#fff;">Liberar para sempre</button>
            ${etapa
              ? `<button type="button" data-a="etapa" style="background:#0f766e;color:#fff;">Liberar só nesta etapa</button>`
              : `<button type="button" data-a="valor" style="background:#0f766e;color:#fff;">Liberar até ${fmtBRL(d.valorTotal)}</button>`}
            <button type="button" data-a="negar" style="background:#fff;color:#b91c1c;border-color:#fca5a5;">Negar</button>
            <a href="${url}" style="background:#f1f5f9;color:#334155;margin-left:auto;">Abrir orçamento</a>
          </div>
          <div class="lv-motivo">
            <input type="text" placeholder="Motivo da negativa (opcional)">
            <button type="button" data-a="confirmar-negar" style="padding:7px 12px;border-radius:8px;border:none;background:#b91c1c;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Confirmar</button>
          </div>`;
        const motivo = item.querySelector(".lv-motivo");
        item.addEventListener("click", async e => {
          const btn = e.target.closest("button[data-a]");
          if (!btn) return;
          const a = btn.dataset.a;
          if (a === "negar") { motivo.style.display = "flex"; motivo.querySelector("input").focus(); return; }
          item.querySelectorAll("button").forEach(b => b.disabled = true);
          if (a === "confirmar-negar") await decidir(d._id, "negado", undefined, motivo.querySelector("input").value.trim());
          else await decidir(d._id, "aprovado", a);
          item.querySelectorAll("button").forEach(b => b.disabled = false);
        });
        ui.lista.appendChild(item);
      });
    }

    async function atualizar() {
      try { pendentes = await listar("status=pendente"); } catch (_) { return; }
      const novos = pendentes.filter(d => !vistos.has(d._id));
      novos.forEach(d => novosIds.add(d._id));
      render();
      if (novos.length) {
        ui.abrir();
        bip();
        const d = novos[0];
        notificarSistema(
          novos.length === 1 ? "Novo pedido de aprovação" : `${novos.length} novos pedidos de aprovação`,
          `${d.numeroProposta || ""} ${d.nomeCliente || ""} · ${d.tipo === "etapa" ? "etapa " + (d.nomeEtapa || "") : fmtBRL(d.valorTotal)} · por ${d.solicitante}`.trim(),
          location.href
        );
      }
    }

    atualizar();
    setInterval(atualizar, POLL_INTERVAL);
  }

  // ── Solicitante: avisa quando o pedido foi decidido ───────────────────────
  function iniciarSolicitante() {
    let ui = null;
    const vistas = lerSet(LS_DECISOES);
    let primeira = !localStorage.getItem(LS_DECISOES);

    async function atualizar() {
      let docs = [];
      try {
        docs = [...await listar("status=aprovado"), ...await listar("status=negado")];
      } catch (_) { return; }
      const minhas = docs.filter(d => (d.email || "").toLowerCase() === emailUsuario);

      // Primeiro uso: não despeja o histórico inteiro, só marca como visto
      if (primeira) {
        minhas.forEach(d => vistas.add(d._id)); gravarSet(LS_DECISOES, vistas); primeira = false;
        return;
      }
      const novas = minhas.filter(d => !vistas.has(d._id));
      if (!novas.length) return;

      if (!ui) {
        ui = criarUI();
        ui.aoFechar = () => { marcarTitulo(0); };
      }
      novas.forEach(d => vistas.add(d._id)); gravarSet(LS_DECISOES, vistas);
      ui.titulo.textContent = novas.length === 1 ? "Seu pedido de aprovação foi respondido" : `${novas.length} pedidos de aprovação respondidos`;
      ui.dica.textContent = "";
      ui.lista.innerHTML = novas.map(d => {
        const ok = d.status === "aprovado";
        const escopo = d.tipo === "etapa"
          ? (d.modo === "sempre" ? "em qualquer etapa" : `na etapa ${esc(d.nomeEtapa || "")}`)
          : (d.modo === "sempre" ? "para qualquer valor" : `até ${fmtBRL(d.valorAprovado)}`);
        return `
          <div class="lv-item" style="border-color:${ok ? "#86efac" : "#fca5a5"};">
            <div class="lv-top">
              <span class="lv-nome">${esc(d.numeroProposta || "Sem número")} · ${esc(d.nomeCliente || "Cliente")}</span>
              <span class="lv-valor" style="color:${ok ? "#16a34a" : "#b91c1c"};">${ok ? "✅ Liberado" : "⛔ Negado"}</span>
            </div>
            <div class="lv-meta">${ok ? `Liberado ${escopo}` : `Negado${d.observacao ? ": " + esc(d.observacao) : ""}`} · por ${esc(d.aprovador || "aprovador")} em ${fmtData(d.dataAprovacao)}</div>
            <div class="lv-acoes">
              <a href="editar.html?id=${encodeURIComponent(d.propostaId)}" style="background:#f1f5f9;color:#334155;">Abrir orçamento</a>
            </div>
          </div>`;
      }).join("");
      marcarTitulo(novas.length);
      ui.abrir();
      bip();
      notificarSistema(
        novas.length === 1 ? `Pedido ${novas[0].status === "aprovado" ? "liberado" : "negado"}` : `${novas.length} pedidos respondidos`,
        `${novas[0].numeroProposta || ""} ${novas[0].nomeCliente || ""}`.trim(),
        location.href
      );
    }

    atualizar();
    setInterval(atualizar, POLL_INTERVAL);
  }

  async function iniciar() {
    const cfg = await obterConfig();
    const lv = cfg?.limiteValor;
    // Sem aprovador definido não há para quem pedir (vale para trava por valor e por etapa)
    if (!lv?.aprovadorId && !lv?.aprovadorEmail) return;
    // Reconhece o aprovador pelo id do login (token); o e-mail fica como alternativa
    const ehAprovador = (!!idUsuario && String(lv.aprovadorId || "") === idUsuario)
      || (!!emailUsuario && (lv.aprovadorEmail || "").toLowerCase() === emailUsuario);
    if (ehAprovador) iniciarAprovador();
    else iniciarSolicitante();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
