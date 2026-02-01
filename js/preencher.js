let blocoIndex = 0;

// 🕓 Aguarda até que um elemento exista no DOM
function esperarElemento(seletor, tentativas = 20, intervalo = 300) {
  return new Promise((resolve, reject) => {
    const tentar = (vezesRestantes) => {
      const elemento = document.querySelector(seletor);
      if (elemento) return resolve(elemento);
      if (vezesRestantes <= 0) return reject(new Error(`Elemento "${seletor}" não encontrado.`));
      setTimeout(() => tentar(vezesRestantes - 1), intervalo);
    };
    tentar(tentativas);
  });
}

// 🔄 Exibe o loader
function mostrarLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "flex");
}

// ✅ Esconde o loader
function esconderLoader() {
  document.getElementById("loader-overlay")?.style.setProperty("display", "none");
}

// 📥 Extrai o ID da URL (?id=...)
function obterIdPropostaDaUrl() {
  
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
}



// 📦 Busca e carrega a proposta por ID
async function localizarECarregarPropostaPorId() {
   
  const estaEditandoModelo = window.location.pathname.includes("editarModelo.html");

  const idDesejado = estaEditandoModelo
    ? "68746e305b9691a7ed3b3f97" // ID fixo para modo de edição de modelo
    : obterIdPropostaDaUrl();

  if (!idDesejado) {
    if (!estaEditandoModelo) {
      alert("❌ Nenhum ID informado na URL.");
    }
    return;
  }

  try {
   

    const url = `https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${idDesejado}`;
    console.log("🔍 Buscando proposta por ID:", url);

    const resposta = await fetch(url);
    if (!resposta.ok) {
      const msg = `Erro ${resposta.status} - ${resposta.statusText}`;
      throw new Error(msg);
    }

    const proposta = await resposta.json();

    if (!proposta || typeof proposta !== "object") {
      alert("❌ Proposta não encontrada ou inválida.");
      return;
    }


    await esperarElemento("#clientesWrapper");
    await esperarElemento("#blocosProdutosContainer");

    await carregarPropostaEditavel(proposta);

  } catch (erro) {
    console.error("❌ Erro ao localizar proposta:", erro);
   
  } finally {
    esconderLoader();
  }
}





function arredondarCimaSeguro(valor, context = {}) {

  if (valor === undefined || valor === null) return 1;

  try {
    // Se for fórmula (contém # ou operadores), tenta avaliar
    if (typeof valor === "string" && /[#*/+\-()]/.test(valor)) {
      if (typeof evaluateFormula === "function") {
        valor = evaluateFormula(valor, context);
      } else {
        console.warn("⚠️ evaluateFormula não está disponível.");
        return 1;
      }
    }

    // Substitui vírgula por ponto se for string
    const normalizado = typeof valor === "string" ? valor.replace(",", ".") : valor;
    const numero = parseFloat(normalizado);

    return Number.isFinite(numero) ? Math.ceil(numero) : 1;
  } catch (e) {
    console.warn("Erro ao arredondar valor:", valor, e);
    return 1;
  }
}


async function carregarPropostaEditavel(proposta) {

  console.log(proposta)
  console.log(proposta.grupos[0].itens[0].formula_custo)
  console.log("🔍 Desconto informado:", proposta.camposFormulario.desconto);

  try {
    if (!proposta || typeof proposta !== "object") throw new Error("Proposta inválida.");
    const dados = proposta.camposFormulario || {};
    const setIfExists = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? "";
      else console.warn(`⚠️ Campo com ID '${id}' não encontrado no DOM.`);
    };

    // 🧾 Campos do formulário
    setIfExists("numeroOrcamento", dados.numeroOrcamento || proposta.numeroProposta);
    setIfExists("dataOrcamento", dados.dataOrcamento);
    setIfExists("origemCliente", dados.origemCliente);
    setIfExists("cep", dados.cep);
    setIfExists("rua", dados.rua);
    setIfExists("numero", dados.numero);
    setIfExists("complemento", dados.complemento);
    setIfExists("bairro", dados.bairro);
    setIfExists("cidade", dados.cidade);
    setIfExists("estado", dados.estado);

        // ✅ NOVOS CAMPOS (Acompanhamento do Pedido/Obra/Projeto)
    setIfExists("prazoEntrega",             dados.prazoEntrega);
    setIfExists("dataPedidoEnviadoCliente", dados.dataPedidoEnviadoCliente);
    setIfExists("meioEnvioPedido",          dados.meioEnvioPedido);
    setIfExists("dataPedidoAssinado",       dados.dataPedidoAssinado);
    setIfExists("obraLiberada",             dados.obraLiberada);
    setIfExists("itensLiberacaoObra",       dados.itensLiberacaoObra);
    setIfExists("dataLiberacaoObra",        dados.dataLiberacaoObra);
    setIfExists("dataProjetoEnviado",       dados.dataProjetoEnviado);
    setIfExists("dataProjetoAssinado",      dados.dataProjetoAssinado);
    setIfExists("dataMedicaoRealizada",     dados.dataMedicaoRealizada);

    
   // ✅ Lista fixa (fallback na 2ª tentativa)
const VENDEDORES_FIXOS_FALLBACK = {
  "pagina": 1,
  "total_de_paginas": 1,
  "registros": 12,
  "total_de_registros": 12,
  "cadastro": [
    {"codInt":"","codigo":2452905334,"comissao":1,"email":"joaomartins@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"JOAO CLEBER MARTINS","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905376,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"Paulo Sergio Machado da Silva","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905381,"comissao":0,"email":"marilena.ulhoa@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"MARILENA DE ALMEIDA ULHOA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905445,"comissao":1,"email":"rafael.angelo@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"RAFAEL ANGELO ARAUJO DA SILVA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905491,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"DOUGLAS VITOR DA SILVA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905509,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"GABRIEL JUNIOR DO COUTO NEPOMUCENO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452905682,"comissao":0,"email":"felipe.ulhoa@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"N","nome":"FELIPE ULHOA FERREIRA","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452911859,"comissao":0,"email":"","fatura_pedido":"N","inativo":"S","nome":"MAURO LUCIO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2452927579,"comissao":0,"email":"projetos@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"S","nome":"ANA FLAVIA RODRIGUES PRATES","visualiza_pedido":"N"},
    {"codInt":"","codigo":2618640819,"comissao":0,"email":"lais.rabelo@ferreiraulhoa.com.br","fatura_pedido":"N","inativo":"S","nome":"LAIS MAGALHÃES RABELO","visualiza_pedido":"N"},
    {"codInt":"","codigo":2698639092,"comissao":0,"email":"servidor@ferreiraulhoa.com.br","fatura_pedido":"S","inativo":"S","nome":"VANESSA ULHOA","visualiza_pedido":"N"},
   
  ]
};

/* =========================================================
   ✅ CORREÇÃO DE VENDEDOR VIA SELEÇÃO (SEM DIGITAR)
   - abrirModalSelecaoVendedor(): abre modal com <select> dos vendedores padrão
   - tentarPreencherVendedor(): valida/normaliza/força correção e seleciona no #vendedorResponsavel
   Requisitos:
   - const VENDEDORES_FIXOS_FALLBACK = { cadastro: [ { nome: ... } ] }
   ========================================================= */

// 1) Modal (retorna Promise<string|null>)
// - resolve com: nome escolhido (string), "" (vazio), ou null (cancelado)
function abrirModalSelecaoVendedor({ valorInvalido = "" } = {}) {
  return new Promise((resolve) => {
    // remove modal antigo se existir
    const antigo = document.getElementById("modal-correcao-vendedor");
    if (antigo) antigo.remove();

    const lista = (VENDEDORES_FIXOS_FALLBACK?.cadastro || [])
      .map((v) => String(v.nome || "").trim().toUpperCase())
      .filter(Boolean);

    const backdrop = document.createElement("div");
    backdrop.id = "modal-correcao-vendedor";
    backdrop.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; padding: 16px;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      width: 100%; max-width: 560px; background: #fff; border-radius: 14px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25); padding: 16px 16px 12px;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    `;

    const safeValor = String(valorInvalido || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    box.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
        <div>
          <div style="font-size:16px; font-weight:700; color:#111827;">Corrigir vendedor</div>
          <div style="margin-top:6px; font-size:13px; color:#6b7280;">
            Valor inválido encontrado: <b style="color:#111827;">${safeValor}</b>
          </div>
          <div style="margin-top:6px; font-size:12px; color:#6b7280;">
            Selecione um vendedor válido da lista padrão (ou deixe vazio).
          </div>
        </div>
        <button id="btn-fechar-modal-vend" type="button" aria-label="Fechar" style="
          border:0; background:transparent; font-size:22px; line-height:1; cursor:pointer; color:#6b7280;">×</button>
      </div>

      <div style="margin-top:14px;">
        <label style="display:block; font-size:12px; color:#6b7280; margin-bottom:6px;">Vendedor</label>
        <select id="select-correcao-vendedor" style="
          width:100%; padding:10px; border:1px solid #e5e7eb; border-radius:10px; font-size:14px;">
          <option value="">(deixar vazio / não selecionar)</option>
          ${lista.map((n) => `<option value="${n}">${n}</option>`).join("")}
        </select>
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:14px;">
        <button id="btn-cancelar-vend" type="button" style="
          padding:9px 12px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; cursor:pointer;">
          Cancelar
        </button>
        <button id="btn-confirmar-vend" type="button" style="
          padding:9px 12px; border-radius:10px; border:0; background:#2563eb; color:#fff; cursor:pointer; font-weight:600;">
          Confirmar
        </button>
      </div>
    `;

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    const fechar = (val) => {
      backdrop.remove();
      resolve(val);
    };

    // clicar fora cancela
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) fechar(null);
    });

    document.getElementById("btn-fechar-modal-vend").onclick = () => fechar(null);
    document.getElementById("btn-cancelar-vend").onclick = () => fechar(null);

    document.getElementById("btn-confirmar-vend").onclick = () => {
      const sel = document.getElementById("select-correcao-vendedor");
      fechar(sel?.value || "");
    };
  });
}


// 2) Preencher vendedor com validação rígida + correção por seleção
async function tentarPreencherVendedor({ vendedorNome, tentativas = 3, delay = 900 }) {
  let tentativaAtual = 0;

  const norm = (v) =>
    String(v || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  // IDs tipo ObjectId (24 hex) => inválido SEMPRE
  const isHex24 = (s) => /^[a-f0-9]{24}$/i.test(String(s || "").trim());

  // ✅ Aliases permitidos (pequenas variações)
  const ALIASES_VENDEDORES = {
    [norm("MARILENA")]: "MARILENA DE ALMEIDA ULHOA",
    [norm("MARILENA ULHOA")]: "MARILENA DE ALMEIDA ULHOA",
    [norm("RAFAEL ANGELO")]: "RAFAEL ANGELO ARAUJO DA SILVA",
    [norm("RAFAEL ÂNGELO")]: "RAFAEL ANGELO ARAUJO DA SILVA",
  };

  // ✅ Set de nomes válidos (somente os do fallback)
  const VALIDOS_SET = new Set(
    (VENDEDORES_FIXOS_FALLBACK?.cadastro || []).map((v) => norm(v.nome))
  );

  function preencherListaFixaNoSelect(select) {
    const atuais = new Set(Array.from(select.options || []).map((o) => norm(o.value)));
    (VENDEDORES_FIXOS_FALLBACK?.cadastro || []).forEach((v) => {
      const nome = String(v.nome || "").trim().toUpperCase();
      const key = norm(nome);
      if (!key || atuais.has(key)) return;
      select.appendChild(new Option(nome, nome));
      atuais.add(key);
    });
  }

  function buscarOpcao(select, nome) {
    const k = norm(nome);
    if (!k) return null;
    return (
      Array.from(select.options || []).find(
        (opt) => norm(opt.value) === k || norm(opt.text) === k
      ) || null
    );
  }

  // ✅ valida rígido + força correção por modal (seleção)
  async function validarOuSelecionar(valorAtual) {
    const bruto = String(valorAtual || "").trim();
    if (!bruto) return "";

    // aplica alias
    const alias = ALIASES_VENDEDORES[norm(bruto)];
    const candidato = (alias || bruto).trim().toUpperCase();

    // se válido, ok
    if (VALIDOS_SET.has(norm(candidato))) return candidato;

    // inválido => alerta e força seleção
    const motivo = isHex24(candidato) ? " (ID inválido)" : "";
    alert(`⚠️ Vendedor inválido encontrado${motivo}: "${bruto}".\nSelecione um vendedor válido para continuar.`);

    const escolhido = await abrirModalSelecaoVendedor({ valorInvalido: bruto });

    // cancelou -> sem seleção
    if (escolhido === null) return "";

    // vazio -> sem seleção
    if (!String(escolhido).trim()) return "";

    const finalNome = String(escolhido).trim().toUpperCase();

    if (!VALIDOS_SET.has(norm(finalNome))) {
      alert(`❌ Seleção inválida: "${finalNome}". Vou deixar vazio.`);
      return "";
    }

    return finalNome;
  }

  const tick = async () => {
    tentativaAtual++;

    const vendedorEl = document.getElementById("vendedorResponsavel");
    if (!vendedorEl) {
      if (tentativaAtual < tentativas) return setTimeout(() => tick(), delay);
      alert("❌ Falha ao preencher: campo #vendedorResponsavel não encontrado no DOM.");
      return;
    }

    // garante que o select tenha a lista padrão
    if ((vendedorEl.options?.length || 0) <= 1) {
      preencherListaFixaNoSelect(vendedorEl);
    }

    // ✅ valida/corrige via modal
    const corrigido = await validarOuSelecionar(vendedorNome);

    // se ficou vazio, limpa e sai
    if (!corrigido) {
      vendedorEl.value = "";
      vendedorEl.dispatchEvent(new Event("change", { bubbles: true }));
      vendedorEl.dispatchEvent(new Event("input", { bubbles: true }));
      console.log("ℹ️ Vendedor ficou vazio (sem seleção).");
      if (typeof ocultarCarregando === "function") ocultarCarregando();
      return;
    }

    // tenta achar option existente
    let opt = buscarOpcao(vendedorEl, corrigido);

    // se não achar, injeta fallback e tenta de novo
    if (!opt) {
      preencherListaFixaNoSelect(vendedorEl);
      opt = buscarOpcao(vendedorEl, corrigido);
    }

    // se achou, seleciona
    if (opt) {
      if (typeof mostrarCarregando === "function") mostrarCarregando();

      vendedorEl.value = opt.value;
      vendedorEl.dispatchEvent(new Event("change", { bubbles: true }));
      vendedorEl.dispatchEvent(new Event("input", { bubbles: true }));

      console.log("✅ Vendedor preenchido:", vendedorEl.value, `(tentativa ${tentativaAtual})`);

      if (typeof ocultarCarregando === "function") ocultarCarregando();
      return;
    }

    if (tentativaAtual < tentativas) return setTimeout(() => tick(), delay);

    alert(`❌ Não foi possível selecionar o vendedor após ${tentativas} tentativas.`);
    if (typeof ocultarCarregando === "function") ocultarCarregando();
  };

  await tick();
}


/* ====== COMO USAR NO SEU FLUXO ====== */
setTimeout(() => {
  if (typeof mostrarCarregando === "function") mostrarCarregando();

  tentarPreencherVendedor({
    vendedorNome: dados?.vendedorResponsavel,
    tentativas: 3,
    delay: 900
  });
}, 1000);



    setIfExists("operadorInterno", dados.operadorInterno);
    setIfExists("prazosArea", dados.prazosArea);
    setIfExists("condicaoPagamento", dados.condicaoPagamento);
    setIfExists("condicoesGerais", dados.condicoesGerais);
setTimeout(() => {
  const campo = document.getElementById("campoDescontoFinal");
  const campo2 = document.getElementById("vendedorResponsavel");


if (campo) {
  campo.value = dados.desconto ?? "";

  // 🔁 Dispara evento de 'input' e 'change' para acionar listeners
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.dispatchEvent(new Event("change", { bubbles: true }));

  // ✅ Chama funções específicas, se necessário
  if (typeof calcularSomaTotal === "function") calcularSomaTotal();
  if (typeof atualizarResumoFinanceiro === "function") atualizarResumoFinanceiro();
  if (typeof atualizarCamposReativos === "function") atualizarCamposReativos();
     ocultarCarregando() 
} else {
  console.warn("⚠️ Campo 'campoDescontoFinal' não encontrado.");
     ocultarCarregando() 
}


}, 4000);




     console.log(dados.desconto)
    // 👥 Clientes
 // 👥 Clientes
const containerClientes = document.getElementById("clientesWrapper");
const clienteBase = containerClientes?.querySelector(".cliente-item");

if (clienteBase) {
  containerClientes.querySelectorAll(".cliente-item:not(:first-child)").forEach(el => el.remove());

  (dados.clientes || []).forEach((cliente, i) => {
    const ref = i === 0 ? clienteBase : clienteBase.cloneNode(true);

    const razaoEl = ref.querySelector(".razaoSocial");
    if (razaoEl) razaoEl.value = cliente.nome_razao_social || "";

    const nomeContatoEl = ref.querySelector(".nomeContato");
    if (nomeContatoEl) {
      const valorNome = (cliente.nome ?? cliente.nome_contato ?? "").toString();
      nomeContatoEl.value = valorNome;
      nomeContatoEl.dataset.valorOriginal = valorNome;
    }

    const codEl = ref.querySelector(".codigoCliente");
    if (codEl) codEl.value = cliente.codigoOmie || "";

    const cpfEl = ref.querySelector(".cpfCnpj");
    if (cpfEl) cpfEl.value = cliente.cpfCnpj || "";

    const funcEl = ref.querySelector(".funcaoCliente");
    if (funcEl) funcEl.value = cliente.funcao || "";

    const telEl = ref.querySelector(".telefoneCliente");
    if (telEl) telEl.value = cliente.telefone || "";

    if (i > 0) containerClientes.appendChild(ref);
  });
}


    // 💳 Parcelas
    const containerParcelas = document.getElementById("listaParcelas");
    if (containerParcelas && Array.isArray(dados.parcelas)) {
      containerParcelas.innerHTML = "";
      const parcelamentoContainer = document.getElementById("parcelamentoContainer");
      if (parcelamentoContainer) parcelamentoContainer.style.display = "block";

      dados.parcelas.forEach((parcela, index) => {
        try {
          adicionarParcela();
          const todas = document.querySelectorAll("#listaParcelas .row");
          const ultima = todas[todas.length - 1];
          const inputValor = ultima.querySelector(".valor-parcela");
          const inputData = ultima.querySelector(".data-parcela");
          const selectTipo = ultima.querySelector(".tipo-monetario");
          const condSelect = ultima.querySelector("select.condicao-pagto");
          const condWrapper = ultima.querySelector(".condicao-wrapper");

          if (inputValor) inputValor.value = parcela.valor || "";
          if (inputData) inputData.value = parcela.data || "";
          if (selectTipo) selectTipo.value = parcela.tipo || "";

          if (parcela.condicao?.startsWith("Personalizado")) {
            condWrapper.innerHTML = "";
            const input = document.createElement("input");
            input.type = "text";
            input.className = "form-control condicao-pagto";
            input.placeholder = "Descreva a condição de pagamento...";
            input.value = parcela.condicao;
            condWrapper.appendChild(input);
          } else {
            if (condSelect) condSelect.value = parcela.condicao || "";
          }
        } catch (e) {
          console.error(`❌ Erro ao adicionar parcela #${index + 1}:`, e);
        }
      });
    }

    // 📦 Produtos por grupo
    const container = document.getElementById("blocosProdutosContainer");
    if (!container) throw new Error("Elemento #blocosProdutosContainer não encontrado.");
    container.innerHTML = "";
    blocoIndex = 0;

    for (let i = 0; i < proposta.grupos.length; i++) {
      const grupo = proposta.grupos[i];
      const nomeGrupo = grupo.nome || `Grupo ${i + 1}`;
      const nomeAmbiente = grupo.ambiente || "";
      console.log(" O grupo",proposta)

      await esperarElemento("#blocosProdutosContainer");
      const idSuffix = criarBlocoDeProposta(nomeGrupo, nomeAmbiente);
      await esperarElemento(`#${idSuffix}`);

      const bloco = document.getElementById(idSuffix);
      if (!bloco) continue;

      if (window.location.pathname.includes("editarModelo.html")) {
        const spanTitulo = bloco.querySelector(`#titulo-accordion-${idSuffix}`);
        if (spanTitulo) {
          const inputTitulo = document.createElement("input");
          inputTitulo.type = "text";
          inputTitulo.className = "form-control form-control-sm input-editar-nome-grupo";
          inputTitulo.value = spanTitulo.textContent.trim();
          inputTitulo.setAttribute("data-id", idSuffix);
          inputTitulo.addEventListener("input", (e) => {
            proposta.grupos[i].nome = e.target.value;
          });
          spanTitulo.replaceWith(inputTitulo);
        }
      }

      const inputAmbiente = bloco.querySelector(`input[placeholder="Ambientes"]`);
      if (inputAmbiente && nomeAmbiente) inputAmbiente.value = nomeAmbiente;

      for (const [chave, valor] of Object.entries(grupo.parametros || {})) {
        const input = bloco.querySelector(`input[name="${chave}"]`);
        if (input) {
          const deveZerar = window.location.pathname.includes("editarModelo.html") &&
            ["altura_montante", "numero_montantes", "numero_protecoes", "descricao"].includes(chave);
          input.value = deveZerar ? "0" : valor;
        }
      }

      const tbody = bloco.querySelector(`#tabela-${idSuffix} tbody`);
      tbody.innerHTML = "";

    const resumoEl = document.getElementById(`resumo-${idSuffix}`);
let resumoPreenchido = false;

grupo.itens.forEach(item => {
  const formula = item.formula_quantidade || "";
  const valorOriginal = window.location.pathname.includes("editarModelo.html") ? "0" : (item.quantidade_desejada || "");
  const context = { groupId: idSuffix };
  const quantidadeFinal = arredondarCimaSeguro(formula || valorOriginal, context);

  // Preenche o resumo APENAS UMA VEZ
  if (resumoEl && !resumoPreenchido) {
    resumoEl.value = `${item.formula_custo}`;
    resumoPreenchido = true;
    console.log("teste")
  }

  const tr = document.createElement("tr");
  console.log(item.formula_custo
)
  tr.innerHTML = `
 <td>
  <textarea class="form-control form-control-sm" rows="3">
${item.descricao_utilizacao|| "Utilização Preencher"}
  </textarea>
</td>

          <td>${item.nome_produto || ""}</td>
          <td class="custo-unitario">R$ ${parseFloat(item.custo || 0).toFixed(2)}</td>
          <td class="venda-unitaria">R$ ${parseFloat(item.preco || 0).toFixed(2)}</td>
          <td>${item.codigo_omie || ""}</td>
          <td>
            <input type="number" class="form-control form-control-sm quantidade" value="${window.location.pathname.includes("editarModelo.html") ? "0" : item.quantidade}">
          </td>
          <td class="quantidade-desejada">
            <input type="text" class="form-control form-control-sm quantidade-desejada"
              value="${valorOriginal}" data-formula="${formula}" data-group-id="${idSuffix}">
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove()">Remover</button>
            <button class="btn btn-secondary btn-sm mt-1" onclick="abrirSubstituirProduto(this)">Substituir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      if (typeof inicializarCamposDeFormulaQuantidade === "function") {
        inicializarCamposDeFormulaQuantidade(bloco, { groupId: idSuffix });
      }

      if (i === 0) {
        const collapse = bloco.querySelector(`#collapse-${idSuffix}`);
        if (collapse && !collapse.classList.contains("show")) {
          collapse.classList.add("show");
        }
      }
    }

    if (typeof renderizarTudo === "function") renderizarTudo();
    if (typeof ativarRecalculoEmTodasTabelas === "function") ativarRecalculoEmTodasTabelas();
    if (typeof simularFocusEBlurEmTodosCamposFormula === "function") simularFocusEBlurEmTodosCamposFormula();

    if (window.location.pathname.includes("editarModelo.html")) {
  const form = document.getElementById("novoOrcamentoForm");
  if (form) form.style.display = "none";

  // ⛔ Oculta campos de ambiente
  document.querySelectorAll('input[placeholder="Ambiente"]').forEach(input => {
    input.style.display = "none";
    
  });
  
}


      ocultarCarregando()
   
  } catch (erro) {
    console.error("❌ Erro ao carregar proposta:", erro);
    alert("Erro ao carregar proposta. Veja o console.");
  }
  
 
}

function aguardarTabelasEExecutar(callback, delay = 2000) {
  setTimeout(() => {
    const inputs = document.querySelectorAll('input[name="descricao"]');
    
    if (inputs.length === 0) {
      console.warn("⚠️ Nenhum campo 'descricao' encontrado.");
    } else {
      console.log(`✅ ${inputs.length} campos 'descricao' encontrados.`);
      inputs.forEach(callback);
    }
  }, delay);
}




function simularEventosInputsDosBlocos() {
  const blocos = document.querySelectorAll(".main-container");

  blocos.forEach(bloco => {
    const inputs = bloco.querySelectorAll("input[name]");

    inputs.forEach(input => {
      // Simula que o valor atual foi alterado
      const eventoInput = new Event("input", { bubbles: true });
      const eventoChange = new Event("change", { bubbles: true });
      const eventoBlur = new Event("blur", { bubbles: true });

      input.dispatchEvent(eventoInput);
      input.dispatchEvent(eventoChange);
      input.dispatchEvent(eventoBlur);
    });
  });

  console.log("✅ Todos os eventos simulados nos inputs dos blocos.");
}
simularEventosInputsDosBlocos() 

document.addEventListener("DOMContentLoaded", () => {
  localizarECarregarPropostaPorId();
});

