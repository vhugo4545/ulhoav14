// clienteAutocomplete.js

let listaCompletaClientes = [];

/**
 * Busca a lista de clientes apenas uma vez.
 */

async function carregarClientes() {
  if (listaCompletaClientes.length > 0) {
    return listaCompletaClientes.filter(cliente => cliente.inativo === "N");
  }

  try {
    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/clientes/visualizar");
    const dados = await resposta.json();
    if (!Array.isArray(dados)) throw new Error("Resposta inválida");

    listaCompletaClientes = dados;

    const ativos = dados.filter(cliente => cliente.inativo === "N");
    console.log(`✅ ${ativos.length} clientes ativos carregados.`);
    return ativos;
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error);
    return [];
  }
}


/**
 * Aplica o autocomplete a um campo de cliente dentro do container fornecido.
 */
async function aplicarAutocompleteCliente(container) {
  const input = container.querySelector(".razaoSocial");
  const codigoInput = container.querySelector(".codigoCliente");
  const cpfInput = container.querySelector(".cpfCnpj");
  const telefoneInput = container.querySelector(".telefoneCliente");

  let sugestoes = container.querySelector(".sugestoesCliente");

  if (!input || !codigoInput) {
    console.warn("⚠️ Campos obrigatórios de autocomplete não encontrados.");
    return;
  }

  // Cria a lista de sugestões se ainda não existir
  if (!sugestoes) {
    sugestoes = document.createElement("ul");
    sugestoes.className = "list-group sugestoesCliente position-absolute w-100 zindex-dropdown";
    sugestoes.style.display = "none";
    sugestoes.style.maxHeight = "200px";
    sugestoes.style.overflowY = "auto";
    input.parentElement.appendChild(sugestoes);
  }

  // Garante que os dados estejam carregados antes de ativar
  const clientesAtivos = await carregarClientes();

  // Função para filtrar e mostrar sugestões
  function mostrarSugestoes(termo) {
    const resultados = clientesAtivos.filter(c =>
      (c.nome_fantasia || "").toLowerCase().includes(termo.toLowerCase()) ||
      (c.razao_social || "").toLowerCase().includes(termo.toLowerCase())
    );

    sugestoes.innerHTML = "";

    resultados.forEach(cliente => {
      const item = document.createElement("li");
      item.className = "list-group-item list-group-item-action";
      item.textContent = cliente.nome_fantasia || cliente.razao_social;
      item.dataset.nome = cliente.nome_fantasia || cliente.razao_social;
      item.dataset.codigo = cliente.codigo_cliente_omie || "";
      item.dataset.cpfcnpj = cliente.cnpj_cpf || "";
      item.dataset.telefone = cliente.telefone1_numero || "";

      item.addEventListener("click", () => {
        input.value = item.dataset.nome;
        codigoInput.value = item.dataset.codigo;
        if (cpfInput) cpfInput.value = item.dataset.cpfcnpj;
        if (telefoneInput) telefoneInput.value = item.dataset.telefone;
        sugestoes.style.display = "none";
        input.dispatchEvent(new Event("input")); // Dispara para permitir novo filtro
        console.log(`✅ Cliente selecionado: ${item.dataset.nome}`);
      });

      sugestoes.appendChild(item);
    });

    sugestoes.style.display = resultados.length ? "block" : "none";
  }

  // Evento de digitação
  input.addEventListener("input", () => {
    const termo = input.value.trim();
    if (termo.length === 0) {
      sugestoes.innerHTML = "";
      sugestoes.style.display = "none";
      return;
    }
    mostrarSugestoes(termo);
  });

  // Reexibe sugestões ao focar, se já houver texto
  input.addEventListener("focus", () => {
    const termo = input.value.trim();
    if (termo.length >= 1) mostrarSugestoes(termo);
  });

  // Oculta sugestões ao clicar fora
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      sugestoes.style.display = "none";
    }
  });
}

/**
 * Adiciona um novo bloco de cliente relacionado ao formulário.
 */
function adicionarClienteRelacionado() {
  const wrapper = document.getElementById("clientesWrapper");
  if (!wrapper) {
    console.warn("⚠️ Wrapper de clientes não encontrado.");
    return;
  }

  const clienteBase = wrapper.querySelector(".cliente-item");
  if (!clienteBase) {
    console.warn("⚠️ Cliente base não encontrado para clonagem.");
    return;
  }

  // Clona o bloco .cliente-item completo
  const novo = clienteBase.cloneNode(true);

  // Limpa os valores dos campos de input
  novo.querySelectorAll("input").forEach(input => input.value = "");

  // Remove botão de incluir cliente (popup) se existir
  const botaoMais = novo.querySelector("button[onclick='abrirPopupIncluirCliente()']");
 

  // Remove sugestão de autocomplete duplicada, se houver
  const sugestoesAntigas = novo.querySelector(".sugestoesCliente");
  if (sugestoesAntigas) sugestoesAntigas.remove();

  // Recria a lista de sugestões vazia
  const novaLista = document.createElement("ul");
  novaLista.className = "sugestoesCliente list-group position-absolute w-100 shadow bg-white";
  novaLista.style.zIndex = "10";
  novaLista.style.maxHeight = "200px";
  novaLista.style.overflowY = "auto";
  novaLista.style.display = "none";

  // Reinsere a lista de sugestões abaixo do input de Razão Social
  const inputRazaoSocial = novo.querySelector(".razaoSocial");
  if (inputRazaoSocial) {
    inputRazaoSocial.insertAdjacentElement("afterend", novaLista);
  }

  // Reaplica autocomplete ao novo bloco
  aplicarAutocompleteCliente(novo);

  // Insere uma linha separadora visual
  wrapper.appendChild(document.createElement("hr"));

  // Adiciona o novo bloco ao wrapper
  wrapper.appendChild(novo);

  console.log("➕ Cliente relacionado adicionado.");
}

function abrirPopupExcluirClienteRelacionado() {
  const wrapper = document.getElementById("clientesWrapper");
  if (!wrapper) {
    console.warn("⚠️ Wrapper de clientes não encontrado.");
    return;
  }

  const itens = Array.from(wrapper.querySelectorAll(".cliente-item"));
  if (!itens.length) {
    alert("Nenhum cliente para excluir.");
    return;
  }

  // Injeta estilos do modal 1x (se você já tem vv-modal/vv-modal-backdrop, pode remover isso)
  if (!document.getElementById("vv-modal-style")) {
    const st = document.createElement("style");
    st.id = "vv-modal-style";
    st.textContent = `
      .vv-modal-backdrop{
        position:fixed; inset:0; background:rgba(0,0,0,.45);
        display:flex; align-items:center; justify-content:center; z-index:9999;
        padding:16px;
      }
      .vv-modal{
        width:min(720px, 100%); background:#fff; border-radius:14px;
        box-shadow:0 10px 30px rgba(0,0,0,.2); overflow:hidden;
      }
      .vv-modal header{ padding:14px 16px; border-bottom:1px solid #e5e7eb; }
      .vv-modal header h3{ margin:0; font-size:16px; }
      .vv-body{ padding:14px 16px; }
      .vv-footer{ padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; justify-content:flex-end; gap:8px; }
      .vv-help{ color:#6b7280; font-size:12px; }
      .vv-list{ display:grid; gap:8px; max-height:320px; overflow:auto; margin-top:10px; }
      .vv-item{ border:1px solid #e5e7eb; border-radius:12px; padding:10px; display:flex; gap:10px; align-items:flex-start; }
      .vv-item strong{ font-size:13px; }
      .vv-btn{ border:1px solid #cbd5e1; background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }
      .vv-btn.danger{ border-color:#ef4444; color:#ef4444; }
      .vv-btn.primary{ border-color:#2563eb; background:#2563eb; color:#fff; }
    `;
    document.head.appendChild(st);
  }

  // Helpers para ler "nome" do bloco
  function resumoDoCliente(el, idx) {
    const razao = el.querySelector(".razaoSocial")?.value?.trim()
      || el.querySelector('input[name="razao_social"]')?.value?.trim()
      || el.querySelector('input[name="nome_fantasia"]')?.value?.trim()
      || "";

    const doc = el.querySelector(".cnpjCpf")?.value?.trim()
      || el.querySelector('input[name="cnpj"]')?.value?.trim()
      || el.querySelector('input[name="cpf"]')?.value?.trim()
      || "";

    const titulo = razao || `Cliente ${idx + 1}`;
    const subt = doc ? `Documento: ${doc}` : "Sem documento";
    return { titulo, subt };
  }

  function removerComHr(el) {
    // remove <hr> "colado" ao bloco (preferência: o anterior; senão o próximo)
    const prev = el.previousElementSibling;
    const next = el.nextElementSibling;

    if (prev && prev.tagName === "HR") prev.remove();
    else if (next && next.tagName === "HR") next.remove();

    el.remove();
  }

  const bd = document.createElement("div");
  bd.className = "vv-modal-backdrop";

  const md = document.createElement("div");
  md.className = "vv-modal";

  const hd = document.createElement("header");
  hd.innerHTML = `<h3>Excluir cliente relacionado</h3>`;

  const by = document.createElement("div");
  by.className = "vv-body";

  const lista = itens.map((el, idx) => {
    const { titulo, subt } = resumoDoCliente(el, idx);
    return `
      <label class="vv-item">
        <input type="radio" name="vv-del-cli" value="${idx}" style="margin-top:2px;">
        <div>
          <strong>${titulo.replace(/</g,"&lt;")}</strong><br>
          <span class="vv-help">${subt.replace(/</g,"&lt;")}</span>
        </div>
      </label>
    `;
  }).join("");

  by.innerHTML = `
    <div class="vv-help">Selecione o cliente que deseja excluir e confirme.</div>
    <div class="vv-list">${lista}</div>
    <div class="vv-help" style="margin-top:10px;">
      Obs: se existir apenas 1 cliente, o sistema limpa os campos em vez de remover o bloco.
    </div>
  `;

  const ft = document.createElement("div");
  ft.className = "vv-footer";
  ft.innerHTML = `
    <button class="vv-btn" id="vv-del-cancel">Cancelar</button>
    <button class="vv-btn danger" id="vv-del-confirm">Excluir</button>
  `;

  md.appendChild(hd);
  md.appendChild(by);
  md.appendChild(ft);
  bd.appendChild(md);
  document.body.appendChild(bd);

  ft.querySelector("#vv-del-cancel").addEventListener("click", () => {
    document.body.removeChild(bd);
  });

  ft.querySelector("#vv-del-confirm").addEventListener("click", () => {
    const idx = Number(by.querySelector('input[name="vv-del-cli"]:checked')?.value);
    if (Number.isNaN(idx)) {
      alert("Selecione um cliente para excluir.");
      return;
    }

    const atuais = Array.from(wrapper.querySelectorAll(".cliente-item"));
    const alvo = atuais[idx];
    if (!alvo) {
      alert("Cliente não encontrado.");
      return;
    }

    if (atuais.length === 1) {
      // Se só tem 1, limpa ao invés de remover
      alvo.querySelectorAll("input").forEach(i => i.value = "");
      alvo.querySelectorAll("textarea").forEach(t => t.value = "");
      console.log("🧹 Único cliente: campos limpos.");
    } else {
      removerComHr(alvo);
      console.log("🗑️ Cliente removido.");
    }

    document.body.removeChild(bd);
  });
}


// Inicializa o autocomplete no cliente principal ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  const primeiro = document.querySelector(".cliente-item");
  if (primeiro) {
    await aplicarAutocompleteCliente(primeiro);
    console.log("✅ Autocomplete de cliente inicial aplicado.");
  } else {
    console.warn("⚠️ Nenhum cliente inicial encontrado.");
  }
});
