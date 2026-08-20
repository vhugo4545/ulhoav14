// notificacoesGestor.js — balão de aprovações pendentes para admins

(function () {
  const API = "https://ulhoa-0a02024d350a.herokuapp.com/api/propostas";
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
          width: 320px;
          max-height: 420px;
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
        }
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
        .ng-item-top {
          font-weight: 700;
          color: #111827;
          margin-bottom: 2px;
        }
        .ng-item-sub {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .ng-btn {
          width: 100%;
          background: #1e40af;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .ng-btn:hover { background: #1d4ed8; }
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
          <span>Aguardando aprovação</span>
          <span id="ng-count-label">0</span>
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
      if (!painel.contains(e.target) && !bell.contains(e.target)) {
        painel.classList.remove("aberto");
      }
    });
  }

  // ── Atualiza o painel com as propostas pendentes ────────────────────
  function renderizar(pendentes) {
    const lista  = document.getElementById("ng-lista");
    const badge  = document.getElementById("ng-badge");
    const label  = document.getElementById("ng-count-label");
    if (!lista) return;

    const total = pendentes.length;
    label.textContent = total;

    if (total === 0) {
      badge.style.display = "none";
      lista.innerHTML = '<div id="ng-vazio">Nenhuma solicitação pendente.</div>';
      return;
    }

    badge.style.display = "flex";
    badge.textContent   = total;

    lista.innerHTML = pendentes.map(p => {
      const numero  = p.camposFormulario?.numero || p.numero || "—";
      const cliente = p.camposFormulario?.nomeCliente || p.nomeCliente || "Cliente não informado";
      const data    = p.updatedAt
        ? new Date(p.updatedAt).toLocaleDateString("pt-BR")
        : "—";
      return `
        <div class="ng-item">
          <div class="ng-item-top">Proposta ${numero}</div>
          <div class="ng-item-sub">${cliente} · ${data}</div>
          <button class="ng-btn" onclick="window.location.href='editar.html?id=${p._id}'">
            Ver e aprovar
          </button>
        </div>
      `;
    }).join("");
  }

  // ── Polling ─────────────────────────────────────────────────────────
  async function buscarPendentes() {
    try {
      const token = localStorage.getItem("accessToken") || "";
      const resp  = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) return;
      const lista = await resp.json();
      const pendentes = (Array.isArray(lista) ? lista : [])
        .filter(p => p.statusOrcamento === STATUS_PENDENTE);
      renderizar(pendentes);
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
