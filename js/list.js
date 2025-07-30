document.addEventListener("DOMContentLoaded", async () => {
  mostrarCarregando();

  const tableBody     = document.querySelector("#data-table tbody");
  const prevPageBtn   = document.getElementById("prev-page");
  const nextPageBtn   = document.getElementById("next-page");
  const pageInfo      = document.getElementById("page-info");
  const searchInput   = document.getElementById("search");
  const filterSeller  = document.getElementById("filter-seller");
  const filterStatus  = document.getElementById("filter-status");
  const loadingDiv    = document.getElementById("loading");
  const table         = document.getElementById("data-table");
  const alertaVencimento = document.getElementById("alerta-vencimento");

  const API_BASE = "https://ulhoa-0a02024d350a.herokuapp.com";
  const TOKEN = localStorage.getItem("accessToken");

  let data = [];
  let sellers = [];
  let currentPage = 1;
  const rowsPerPage = 50;

  // Filtros atuais (evita recalcular tudo)
  let searchText = "";
  let selectedSeller = "";
  let selectedStatus = "";

  try {
    loadingDiv.style.display = "block";
    table.style.display = "none";

    const res = await fetch(`${API_BASE}/api/propostas`, {
      headers: { "Authorization": `Bearer ${TOKEN}` },
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`Erro ${res.status}: ${await res.text()}`);

    const propostas = await res.json();
    const hoje = new Date();
    const vencidas = [];
    const prestesAVencer = [];
    const sellerSet = new Set();

   data = propostas
  .filter(p => p.tipoProposta === "editavel")
// <-- adiciona isso para inverter
  .map(p => {
        const campos = p.camposFormulario || {};
        const grupos = p.grupos || [];

        const total = grupos.reduce((soma, grupo) => (
          soma + grupo.itens.reduce((subtotal, item) => (
            subtotal + ((parseFloat(item.preco) || 0) * (parseFloat(item.quantidade) || 1))
          ), 0)
        ), 0);

        const clienteObj = (campos.clientes && campos.clientes[0]) || {};
        const nomeCliente = clienteObj.nome_razao_social || "Cliente sem nome";
        const cnpjCpf     = clienteObj.cpfCnpj || "--";  // AJUSTE AQUI!
        const vendedor    = campos.vendedorResponsavel || "Indefinido";
        const status      = p.statusOrcamento || "Sem status";
        const tipoProposta= p.tipoProposta || "--";
        const nomeEvento  = campos.nomeEvento || "--";
        const numeroProposta = p.numeroProposta || "--";

        const createdAt = new Date(p.criado_em || p.createdAt);
        const dataCriacao = createdAt.toLocaleDateString("pt-BR");
        const validade = calcularValidade(createdAt, 5);
        const isVencida = validade < hoje;
        const diasParaVencer = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
        const isPrestes = !isVencida && diasParaVencer <= 2;

        if (isVencida) vencidas.push({ nomeCliente, validade });
        if (isPrestes) prestesAVencer.push({ nomeCliente, validade });

        sellerSet.add(vendedor);

        return {
          _id: p._id,
          numeroProposta,
          cliente: nomeCliente,
          cnpjCpf, // NOVO
          vendedor,
        
       
          status,
          date: dataCriacao,
          value: `R$ ${total.toFixed(2)}`,
          validade: validade.toLocaleDateString("pt-BR"),
          vencida: isVencida
        };
      });

    data.forEach((item, index) => item.id = index + 1);

    // Gera as opções dos vendedores só uma vez
    sellers = Array.from(sellerSet).sort();
    const sellerOptions = ['<option value="">Todos</option>'].concat(
      sellers.map(v => `<option value="${v}">${v}</option>`)
    ).join('');
    filterSeller.innerHTML = sellerOptions;

    renderTable(data);
    renderAlertas(vencidas, prestesAVencer);
  } catch (err) {
    console.error("Erro ao buscar propostas:", err);
    loadingDiv.innerHTML = "❌ Erro ao carregar propostas.";
    return;
  } finally {
    loadingDiv.style.display = "none";
    table.style.display = "table";
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

  function renderTable(filteredData) {
    ocultarCarregando();
    const tipoUsuario = localStorage.getItem("usuarioTipo");
    const nomeUsuario = localStorage.getItem("usuarioNome");

    // Só filtra vendedor se não for admin (mantém performance)
    if (tipoUsuario !== "admin") {
      filteredData = filteredData.filter(item => item.vendedor === nomeUsuario);
    }

    tableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    let html = "";
    filteredData.slice(start, end).forEach((item, index) => {
      html += `
        <tr>
          <td>${start + index + 1}</td>
          <td>${item.numeroProposta}</td>
          <td>${item.date}</td>
          <td>${item.vendedor}</td>
          <td>${item.cliente}</td>
          <td>${item.cnpjCpf}</td>
     
          <td><span class="status ${item.status.toLowerCase().replace(/\s/g, "-")}">${item.status}</span></td>
          <td>
            <span title="Validade da proposta">${item.validade}</span>
            ${item.vencida ? '<br><span style="color:red; font-weight:bold;">VENCIDA</span>' : ''}
          </td>
          <td class="actions">
            <button class="edit-btn" data-id="${item._id}">
              <span class="material-icons-outlined">edit</span>
            </button>
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = html;

    pageInfo.textContent = `Página ${currentPage}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = end >= filteredData.length;

    addActionEventListeners(filteredData.slice(start, end));
  }

  function renderAlertas(vencidas, prestesAVencer) {
    if (!alertaVencimento) return;
    alertaVencimento.innerHTML = "";

    if (vencidas.length) {
      alertaVencimento.innerHTML += `<div><h4>Propostas Vencidas:</h4>` +
        vencidas.map(p =>
          `<div class="alert-item vencida">⚠️ ${p.nomeCliente} — ${new Date(p.validade).toLocaleDateString("pt-BR")}</div>`
        ).join("") + `</div>`;
    }
    if (prestesAVencer.length) {
      alertaVencimento.innerHTML += `<div><h4>Próximas a Vencer:</h4>` +
        prestesAVencer.map(p =>
          `<div class="alert-item prestes">⏳ ${p.nomeCliente} — ${new Date(p.validade).toLocaleDateString("pt-BR")}</div>`
        ).join("") + `</div>`;
    }
  }

  function addActionEventListeners(filteredData) {
    tableBody.querySelectorAll(".edit-btn").forEach(button => {
      button.addEventListener("click", event => {
        const itemId = event.currentTarget.getAttribute("data-id");
        if (itemId) window.location.href = `editar.html?id=${itemId}`;
        else alert("❌ ID não encontrado.");
      });
    });
    // Mantido caso queira ativar duplicação ou delete, mas removido aqui para performance.
  }

  function filterTable() {
    const filteredData = data.filter(item => {
      // Checagem rápida dos filtros
      if (selectedSeller && item.vendedor !== selectedSeller) return false;
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (!searchText) return true;

      // Pesquisa agora nos campos principais + cnpjCpf
      return (
        (item.numeroProposta && item.numeroProposta.toLowerCase().includes(searchText)) ||
        (item.cliente && item.cliente.toLowerCase().includes(searchText)) ||
        (item.cnpjCpf && item.cnpjCpf.toLowerCase().includes(searchText)) || // INCLUÍDO!
        (item.evento && item.evento.toLowerCase().includes(searchText)) ||
        (item.vendedor && item.vendedor.toLowerCase().includes(searchText)) ||
        (item.tipoProposta && item.tipoProposta.toLowerCase().includes(searchText)) ||
        (item.status && item.status.toLowerCase().includes(searchText))
      );
    });

    currentPage = 1;
    renderTable(filteredData);
  }

  // Filtros (mais rápidos, sem re-filtrar tudo a cada vez)
  searchInput.addEventListener("input", e => {
    searchText = e.target.value.trim().toLowerCase();
    filterTable();
  });
  filterSeller.addEventListener("change", e => {
    selectedSeller = e.target.value;
    filterTable();
  });
  filterStatus.addEventListener("change", e => {
    selectedStatus = e.target.value;
    filterTable();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterTable();
    }
  });
  nextPageBtn.addEventListener("click", () => {
    currentPage++;
    filterTable();
  });
});

function irParaPagina(pagina, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${pagina}?${query}` : pagina;
  window.location.href = url;
}


