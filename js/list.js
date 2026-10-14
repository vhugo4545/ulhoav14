document.addEventListener("DOMContentLoaded", async () => {
  mostrarCarregando();

  const tableBody        = document.querySelector("#data-table tbody");
  const prevPageBtn      = document.getElementById("prev-page");
  const nextPageBtn      = document.getElementById("next-page");
  const pageInfo         = document.getElementById("page-info");
  const searchInput      = document.getElementById("search");
  const filterSeller     = document.getElementById("filter-seller");
  const filterStatus     = document.getElementById("filter-status");
  const loadingDiv       = document.getElementById("loading");
  const table            = document.getElementById("data-table");
  const alertaVencimento = document.getElementById("alerta-vencimento");

  const API_BASE = "https://ulhoa-0a02024d350a.herokuapp.com";
  const TOKEN = localStorage.getItem("accessToken");

  const KOMMO_SERVER = "https://kommo-server-9f1243cbe450.herokuapp.com";
  let _kommoPipelines = null; // cache local de pipelines

  async function getKommoPipelines() {
    if (_kommoPipelines) return _kommoPipelines;
    try {
      const r = await fetch(`${KOMMO_SERVER}/kommo/pipelines`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      _kommoPipelines = r.ok ? await r.json() : [];
    } catch { _kommoPipelines = []; }
    return _kommoPipelines;
  }

  function kommoEtapaInfo(statusId, pipelines) {
    for (const p of (pipelines || [])) {
      const etapa = (p.etapas || []).find(e => String(e.status_id) === String(statusId));
      if (etapa) return { nome: etapa.nome, cor: etapa.cor || "#94a3b8" };
    }
    return null;
  }

  async function carregarBadgesKommo(ids) {
    if (!ids.length) return;
    const pipelines = await getKommoPipelines();

    await Promise.allSettled(ids.map(async id => {
      try {
        const r = await fetch(`${KOMMO_SERVER}/proposta/${id}/lead`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const cell = document.querySelector(`td[data-kommo-id="${id}"]`);
        if (!cell) return;

        if (!r.ok) { cell.innerHTML = kommoSemBadge(); return; }
        const lead = await r.json();
        if (!lead || !lead.status_id) { cell.innerHTML = kommoSemBadge(); return; }

        const etapa = kommoEtapaInfo(lead.status_id, pipelines);
        const nome  = etapa?.nome || `ID ${lead.status_id}`;
        const cor   = etapa?.cor  || "#94a3b8";
        cell.innerHTML = `
          <span title="${nome}" style="
            display:inline-flex;align-items:center;gap:4px;
            padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;
            background:${cor}22;color:${cor};border:1px solid ${cor}55;white-space:nowrap;
          ">
            <span style="width:6px;height:6px;border-radius:50%;background:${cor};flex-shrink:0;"></span>
            ${nome}
          </span>`;
      } catch {
        const cell = document.querySelector(`td[data-kommo-id="${id}"]`);
        if (cell) cell.innerHTML = kommoSemBadge();
      }
    }));
  }

  function kommoSemBadge() {
    return `<span style="font-size:10px;color:#cbd5e1;">—</span>`;
  }

  // ===== Estado =====
  let currentPage = 1;
  let totalPages = 1;
  let totalRegistros = 0;
  const rowsPerPage = 50;

  let searchText = "";
  let selectedSeller = "";
  let selectedStatus = "";

  let dataAtual = [];          // propostas da página atual (já mapeadas)
  let abortController = null;  // cancela request anterior

  // ===== Helpers =====
  function extrairNumero(valor) {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === "number") return isNaN(valor) ? 0 : valor;
    const texto = String(valor).trim();
    if (!texto) return 0;
    const limpo = texto
      .replace(/\u00A0/g, " ")
      .replace(/\s/g, "")
      .replace("R$", "")
      .replace("%", "")
      .replace(/\./g, "")
      .replace(",", ".");
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
  }

  function calcularTotalFinalProposta(campos, grupos) {
    const subtotal = (grupos || []).reduce((soma, grupo) => {
      const valorGrupo = extrairNumero(grupo?.itens?.[0]?.valor_total_produto);
      return soma + valorGrupo;
    }, 0);

    const descontoTexto = String(campos?.desconto || "").trim();
    let totalFinal = subtotal;

    if (descontoTexto) {
      if (descontoTexto.includes("%")) {
        const percentual = extrairNumero(descontoTexto);
        totalFinal = subtotal - (subtotal * percentual / 100);
      } else {
        totalFinal = subtotal - extrairNumero(descontoTexto);
      }
    }
    return totalFinal < 0 ? 0 : totalFinal;
  }

  function calcularValidade(dataInicial, diasUteis) {
    const result = new Date(dataInicial);
    let adicionados = 0;
    while (adicionados < diasUteis) {
      result.setDate(result.getDate() + 1);
      const dia = result.getDay();
      if (dia !== 0 && dia !== 6) adicionados++;
    }
    return result;
  }

  function debounce(fn, ms = 400) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  // ===== Mapeamento de proposta =====
  function mapProposta(p) {
    const campos = p.camposFormulario || {};
    const grupos = p.grupos || [];

    const clienteObj   = (campos.clientes && campos.clientes[0]) || {};
    const nomeCliente  = clienteObj.nome_razao_social || "Cliente sem nome";
    const cnpjCpf      = clienteObj.cpfCnpj || "--";
    const vendedor     = campos.vendedorResponsavel || "Indefinido";
    const status       = p.statusOrcamento || "Sem status";
    const tipoProposta = p.tipoProposta || "--";
    const nomeEvento   = campos.nomeEvento || "--";
    const numeroProposta = p.numeroProposta || "--";
    const numeroPedido = p.numeroPedido || campos.numeroPedido || "--";

    const createdAt   = new Date(p.criado_em || p.createdAt);
    const validade    = calcularValidade(createdAt, 5);
    const hoje        = new Date();
    const isVencida   = validade < hoje;
    const diasParaVencer = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
    const isPrestes   = !isVencida && diasParaVencer <= 2;

    return {
      _id: p._id,
      numeroProposta, numeroPedido,
      cliente: nomeCliente, cnpjCpf,
      vendedor, status, tipoProposta,
      evento: nomeEvento,
      date: createdAt.toLocaleDateString("pt-BR"),
      createdAt,
      validade: validade.toLocaleDateString("pt-BR"),
      validadeRaw: validade,
      vencida: isVencida,
      prestesAVencer: isPrestes,
      campos, grupos
    };
  }

  // ===== Request paginada (com cancelamento) =====
  async function fetchPropostasPaginadas() {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", rowsPerPage);
    params.append("tipoProposta", "editavel"); // filtro fixo
    if (searchText)     params.append("search", searchText);
    if (selectedStatus) params.append("status", selectedStatus);
    if (selectedSeller) params.append("vendedor", selectedSeller);

    const res = await fetch(`${API_BASE}/api/propostas?${params}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
      signal: abortController.signal
    });

    if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  // ===== Request "leve" para alertas + lista de vendedores =====
  // Pega TODAS as propostas, mas só os campos mínimos (rápido por causa do .lean() + .select())
  async function fetchResumoGlobal() {
    const params = new URLSearchParams();
    params.append("page", 1);
    params.append("limit", 10000); // teto alto pra trazer tudo
    params.append("tipoProposta", "editavel");
    params.append(
      "campos",
      "criado_em camposFormulario.clientes camposFormulario.vendedorResponsavel statusOrcamento tipoProposta"
    );

    const res = await fetch(`${API_BASE}/api/propostas?${params}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store"
    });

    if (!res.ok) return { propostas: [] };
    return await res.json();
  }

  // ===== Carrega página da tabela =====
  async function carregarPagina() {
    try {
      loadingDiv.style.display = "block";
      table.style.display = "none";

      const resp = await fetchPropostasPaginadas();

      // Compatibilidade: aceita resposta nova (objeto) ou antiga (array)
      let propostas, total, totalPag;
      if (Array.isArray(resp)) {
        propostas = resp;
        total = resp.length;
        totalPag = 1;
      } else {
        propostas = resp.propostas || [];
        total     = resp.total       ?? propostas.length;
        totalPag  = resp.totalPaginas ?? 1;
      }

      totalRegistros = total;
      totalPages = Math.max(1, totalPag);

      dataAtual = propostas
        .filter(p => p.tipoProposta === "editavel") // segurança extra
        .map(mapProposta);

      renderTable(dataAtual);
    } catch (err) {
      if (err.name === "AbortError") return; // request anterior cancelada
      console.error("Erro ao buscar propostas:", err);
      loadingDiv.innerHTML = "❌ Erro ao carregar propostas.";
    } finally {
      loadingDiv.style.display = "none";
      table.style.display = "table";
    }
  }

  // ===== Carrega resumo (vendedores + alertas), uma vez só =====
  async function carregarResumoGlobal() {
    try {
      const resp = await fetchResumoGlobal();
      const lista = (resp.propostas || resp || []).filter(p => p.tipoProposta === "editavel");

      const sellerSet = new Set();
      const vencidas = [];
      const prestesAVencer = [];
      const hoje = new Date();

      lista.forEach(p => {
        const campos = p.camposFormulario || {};
        const cliente = (campos.clientes && campos.clientes[0]?.nome_razao_social) || "Cliente sem nome";
        const vendedor = campos.vendedorResponsavel || "Indefinido";
        sellerSet.add(vendedor);

        const createdAt = new Date(p.criado_em || p.createdAt);
        const validade = calcularValidade(createdAt, 5);
        const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

        if (validade < hoje) vencidas.push({ nomeCliente: cliente, validade });
        else if (dias <= 2) prestesAVencer.push({ nomeCliente: cliente, validade });
      });

      // Popula filtro de vendedores
      const sellers = Array.from(sellerSet).sort();
      filterSeller.innerHTML = ['<option value="">Todos</option>']
        .concat(sellers.map(v => `<option value="${v}">${v}</option>`))
        .join("");

      renderAlertas(vencidas, prestesAVencer);
    } catch (err) {
      console.warn("Não foi possível carregar resumo global:", err);
    }
  }

  // ===== Renderização =====
  function renderTable(list) {
    ocultarCarregando();
    tableBody.innerHTML = "";

    // Detecta numeroProposta repetido nos resultados atuais
    // Para cada número duplicado, ordena por createdAt asc e atribui ORIGINAL / CÓPIA N
    const labelMap = {};
    const grupos = {};
    list.forEach(item => {
      const n = String(item.numeroProposta ?? "");
      if (!n || n === "--") return;
      if (!grupos[n]) grupos[n] = [];
      grupos[n].push(item);
    });
    Object.entries(grupos).forEach(([n, items]) => {
      if (items.length < 2) return;
      const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
      sorted.forEach((item, i) => {
        labelMap[item._id] = i === 0
          ? `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700;background:#dcfce7;color:#15803d;margin-left:5px;vertical-align:middle;">ORIGINAL</span>`
          : `<span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700;background:#fee2e2;color:#991b1b;margin-left:5px;vertical-align:middle;">CÓPIA ${i}</span>`;
      });
    });

    let html = "";
    list.forEach((item, index) => {
      const total = calcularTotalFinalProposta(item.campos, item.grupos);
      const value = `R$ ${total.toFixed(2)}`;
      const numeroExibido = (currentPage - 1) * rowsPerPage + index + 1;
      const dupBadge = labelMap[item._id] || "";

      html += `
        <tr>
          <td>${numeroExibido}</td>
          <td>${item.numeroProposta}${dupBadge}</td>
          <td>${item.numeroPedido}</td>
          <td>${item.date}</td>
          <td>${item.vendedor}</td>
          <td>${item.cliente}</td>
          <td>${item.cnpjCpf}</td>
          <td><span class="status ${String(item.status).toLowerCase().replace(/\s/g, "-")}">${item.status}</span></td>
          <td data-kommo-id="${item._id}" style="white-space:nowrap;">
            <span style="font-size:10px;color:#cbd5e1;">⋯</span>
          </td>
          <td>
            <span title="Validade da proposta">${item.validade}</span>
            ${item.vencida ? '<br><span style="color:red; font-weight:bold;">VENCIDA</span>' : ""}
          </td>
          <td>${value}</td>
          <td class="actions">
            <button class="edit-btn" data-id="${item._id}">
              <span class="material-icons-outlined">edit</span>
            </button>
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = html;

    pageInfo.textContent = `Página ${currentPage} de ${totalPages} — ${totalRegistros} registro(s)`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    addActionEventListeners();

    // Carrega badges Kommo em background (não bloqueia render)
    carregarBadgesKommo(list.map(i => i._id));
  }

  function renderAlertas(vencidas, prestesAVencer) {
    if (!alertaVencimento) return;
    alertaVencimento.innerHTML = "";

    if (vencidas.length) {
      alertaVencimento.innerHTML +=
        `<div><h4>Propostas Vencidas:</h4>` +
        vencidas.map(p =>
          `<div class="alert-item vencida">⚠️ ${p.nomeCliente} — ${new Date(p.validade).toLocaleDateString("pt-BR")}</div>`
        ).join("") +
        `</div>`;
    }
    if (prestesAVencer.length) {
      alertaVencimento.innerHTML +=
        `<div><h4>Próximas a Vencer:</h4>` +
        prestesAVencer.map(p =>
          `<div class="alert-item prestes">⏳ ${p.nomeCliente} — ${new Date(p.validade).toLocaleDateString("pt-BR")}</div>`
        ).join("") +
        `</div>`;
    }
  }

  function addActionEventListeners() {
    tableBody.querySelectorAll(".edit-btn").forEach(button => {
      button.addEventListener("click", event => {
        const itemId = event.currentTarget.getAttribute("data-id");
        if (itemId) window.location.href = `editar.html?id=${itemId}`;
        else alert("❌ ID não encontrado.");
      });
    });
  }

  // ===== Eventos =====
  const aplicarBuscaDebounced = debounce(() => {
    currentPage = 1;
    carregarPagina();
  }, 400);

  searchInput.addEventListener("input", e => {
    searchText = e.target.value.trim().toLowerCase();
    aplicarBuscaDebounced();
  });

  filterSeller.addEventListener("change", e => {
    selectedSeller = e.target.value;
    currentPage = 1;
    carregarPagina();
  });

  filterStatus.addEventListener("change", e => {
    selectedStatus = e.target.value;
    currentPage = 1;
    carregarPagina();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      carregarPagina();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      carregarPagina();
    }
  });

  // ===== Início =====
  await Promise.all([
    carregarPagina(),       // tabela
    carregarResumoGlobal()  // alertas + dropdown vendedores
  ]);
});

function irParaPagina(pagina, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${pagina}?${query}` : pagina;
  window.location.href = url;
}
