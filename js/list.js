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

  const API_BASE = "http://localhost:3000";
  const TOKEN = localStorage.getItem("accessToken");

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

    let html = "";
    list.forEach((item, index) => {
      const total = calcularTotalFinalProposta(item.campos, item.grupos);
      const value = `R$ ${total.toFixed(2)}`;
      const numeroExibido = (currentPage - 1) * rowsPerPage + index + 1;

      html += `
        <tr>
          <td>${numeroExibido}</td>
          <td>${item.numeroProposta}</td>
          <td>${item.numeroPedido}</td>
          <td>${item.date}</td>
          <td>${item.vendedor}</td>
          <td>${item.cliente}</td>
          <td>${item.cnpjCpf}</td>
          <td><span class="status ${String(item.status).toLowerCase().replace(/\s/g, "-")}">${item.status}</span></td>
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
