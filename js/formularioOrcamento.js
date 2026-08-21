// formularioOrcamento.js


// Chame após o DOM estar carregado
document.addEventListener("DOMContentLoaded", carregarVendedores);


// Adiciona uma nova parcela com suporte a % e R$
function adicionarParcela() {
  
  const lista = document.getElementById("listaParcelas");

  const div = document.createElement("div");
  div.style.cssText = "background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:14px 16px;display:grid;grid-template-columns:1fr 1.5fr 0.8fr 0.8fr auto;gap:10px;align-items:end;font-family:'Poppins',sans-serif;";
  div.className = "parcela-row";

  const labelStyle = "display:block;font-size:11px;font-weight:600;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em;";
  const inputStyle = "border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-family:'Poppins',sans-serif;padding:7px 10px;width:100%;background:#fff;";
  const selectStyle = inputStyle + "appearance:auto;";

  div.innerHTML = `
    <div>
      <label style="${labelStyle}">Tipo Monetário</label>
      <select class="tipo-monetario" style="${selectStyle}">
        <option value="" disabled selected>Selecione…</option>
        <option value="03">Cartão de Crédito</option>
        <option value="01">Dinheiro</option>
        <option value="15">Boleto Bancário</option>
        <option value="17">Pix</option>
        <option value="18">TED</option>
        <option value="99">Outros</option>
      </select>
    </div>
    <div class="condicao-wrapper">
      <label style="${labelStyle}">Condição de Pagto</label>
      <select class="condicao-pagto" style="${selectStyle}" onchange="verificarCondicaoPersonalizada(this)">
        <option value="" disabled selected>Selecione…</option>
        <option value="avista">3 dias após finalizar instalação completa.</option>
        <option value="na-retirada">3 dias após finalizar instalação da estrutura.</option>
        <option value="30-dias">3 dias após finalizar instalação dos vidros.</option>
        <option value="entrada+30">Na retirada/entrega do produto.</option>
        <option value="personalizado">Personalizado</option>
      </select>
    </div>
    <div>
      <label style="${labelStyle}">Valor</label>
      <input type="text" class="valor-parcela" placeholder="Ex: 1000 ou 30%" style="${inputStyle}">
    </div>
    <div>
      <label style="${labelStyle}">Vencimento</label>
      <input type="date" class="data-parcela" style="${inputStyle}">
    </div>
    <div style="display:flex;align-items:flex-end;">
      <button type="button" onclick="this.closest('[data-parcela-row]').remove(); atualizarValoresParcelas()" style="padding:7px 12px;border:1px solid #fecaca;border-radius:8px;background:#fff;color:#ef4444;font-family:'Poppins',sans-serif;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">Remover</button>
    </div>
  `;
  div.dataset.parcelaRow = "1";

  lista.appendChild(div);
  setTimeout(() => aplicarEventosParcela(div), 200);
}


function aplicarEventosParcela(div) {
  const input = div.querySelector(".valor-parcela");

  input.addEventListener("focus", () => {
    const valorAtual = input.dataset.percentual;
    if (valorAtual) input.value = valorAtual + "%";
  });

  input.addEventListener("blur", () => {
    const raw = input.value.trim();
    const totalGrupos = calcularTotalDosGrupos();
    const parcelasAtuais = document.querySelectorAll(".valor-parcela");
    const index = [...parcelasAtuais].indexOf(input);
    const totalParcelas = parcelasAtuais.length;

    if (!raw || totalGrupos <= 0 || totalParcelas <= 0) return;

    let valorNumerico = 0;

    if (raw.includes("%")) {
      const percentual = parseFloat(raw.replace("%", "").replace(",", ".")) || 0;
      if (percentual > 100) return;
      valorNumerico = (percentual / 100) * totalGrupos;
      input.dataset.percentual = percentual;
      input.value = `R$ ${valorNumerico.toFixed(2).replace(".", ",")}`;
    } else {
      valorNumerico = parseFloat(raw.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
      delete input.dataset.percentual;
    }
  });
}


function recalcularParcelasComPercentual() {
  const totalGrupos = calcularTotalDosGrupos();
  const linhas = document.querySelectorAll("#listaParcelas .parcela-row");

  linhas.forEach(linha => {
    const input = linha.querySelector(".valor-parcela");
    const percentual = parseFloat(input.dataset.percentual);
    if (!isNaN(percentual)) {
      const novoValor = (percentual / 100) * totalGrupos;
      input.value = `R$ ${novoValor.toFixed(2).replace(".", ",")}`;
    }
  });
}


function calcularTotalDosGrupos() {
  const texto = (document.querySelector("#valorFinalTotal")?.textContent || "").trim();
  // Parse formato BR (ex: R$ 162.782,72 → 162782.72)
  const limpo = texto
    .replace(/R\$\s?/g, "")
    .replace(/ /g, "")
    .trim()
    .replace(/\./g, "")   // remove separador de milhar
    .replace(",", ".");   // vírgula decimal → ponto
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}


function validarSomatorioParcelas() {
  const totalGrupos = calcularTotalDosGrupos();
  let soma = 0;
  const parcelas = document.querySelectorAll(".valor-parcela");

  parcelas.forEach(input => {
    let valor = 0;
    const raw = input.value.trim();

    if (raw.includes("%")) {
      const percentual = parseFloat(raw.replace("%", "").replace(",", ".")) || 0;
      valor = (percentual / 100) * totalGrupos;
    } else {
      valor = parseFloat(raw.replace("R$", "").replace(/\./g, "").replace(",", ".")) || 0;
    }

    soma += valor;
  });

  return Math.abs(soma - totalGrupos) < 1;
}



/* ─────────────── HELPERS ─────────────── */

function verificarCondicaoPersonalizada(select) {
  if (select.value === "personalizado") {
    const wrapper = select.parentElement;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control condicao-pagto";
    input.placeholder = "Descreva a condição de pagamento...";
    input.value = "Personalizado – ";

    wrapper.innerHTML = "";
    wrapper.appendChild(input);
  }
}

/* troca o placeholder quando muda de Valor ↔ Percentual */
function atualizarPlaceholder(selectEl) {
  const input = (selectEl.closest("[data-parcela-row]") || selectEl.closest(".row"))?.querySelector(".valor-parcela");
  input.placeholder = selectEl.value === "percentual" ? "% 0,00" : "R$ 0,00";
}

/* soma de todos os .formula-result (valor total dos produtos) */
function valorTotalProdutos() {
  return Array.from(document.querySelectorAll(".formula-result")).reduce((total, el) => {
    const num = parseFloat(el.textContent.replace(/\./g, "").replace(",", ".")) || 0;
    return total + num;
  }, 0);
}

/* recalcula automaticamente cada parcela e mostra o total */
function atualizarValoresParcelas() {
  const totalProdutos = valorTotalProdutos();
  let totalParcelas   = 0;

  document.querySelectorAll("#listaParcelas .parcela-row").forEach(row => {
    const tipo   = row.querySelector(".tipo-parcela").value;
    const entrada = row.querySelector(".valor-parcela").value.trim();

    /* normaliza separador decimal */
    const num = parseFloat(entrada.replace(/\./g, "").replace(",", ".")) || 0;

    const valorCalculado = tipo === "percentual"
      ? (totalProdutos * num / 100)        // % do total
      : num;                               // valor direto

    /* armazena para eventual uso em salvamento */
    row.dataset.valorFinal = valorCalculado.toFixed(2);

    totalParcelas += valorCalculado;
  });

  /* exibe a soma em R$ */
  document.getElementById("totalParcelas").textContent =
    totalParcelas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* se o total dos produtos mudar em outro ponto do sistema,
   chame simplesmente atualizarValoresParcelas() para recálculo */


function obterDadosFormularioOrcamento() {
  const getValue = (id) => document.getElementById(id)?.value || "-";

  const dados = {
    numero: getValue("numeroOrcamento"),
    data: getValue("dataOrcamento"),
    origem: getValue("origemCliente"),
    nomeOrigem: getValue("nomeOrigem"),
    codigoOrigem: getValue("codigoOrigem"),
    telefoneOrigem: getValue("telefoneOrigem"),
    emailOrigem: getValue("emailOrigem"),
    comissao: getValue("comissaoArquiteto"),
    condicao: getValue("condicaoPagamento"),
    prazos: getValue("prazosArea"),
    condicoesGerais: getValue("condicoesGerais"),
    operador: getValue("operadorInterno"),
    vendedor: document.getElementById("vendedorResponsavel")?.selectedOptions[0]?.textContent || "-"
  };

  const clienteWrapper = document.querySelector(".cliente-item");
  dados.nomeCliente = clienteWrapper?.querySelector(".razaoSocial")?.value || "-";
  dados.cpfCnpj = clienteWrapper?.querySelector(".cpfCnpj")?.value || "-";
  dados.telefoneCliente = clienteWrapper?.querySelector(".telefone")?.value || "-";
  dados.emailCliente = clienteWrapper?.querySelector(".email")?.value || "-";

  const endereco = {
    cep: getValue("cep"),
    rua: getValue("rua"),
    numero: getValue("numeroEndereco"),
    bairro: getValue("bairro"),
    cidade: getValue("cidade"),
    estado: getValue("estado")
  };

  dados.enderecoObra = endereco;

  console.log("%c📄 Dados do formulário de orçamento:", "color: navy; font-weight: bold");

  return dados;
}

// Atribui ao botão de salvar se existir
window.addEventListener("DOMContentLoaded", () => {
  const btnSalvar = document.getElementById("save-proposal");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      obterDadosFormularioOrcamento();
    });
    console.log("%c✅ Evento de salvar proposta ativado.", "color: green");
  } else {
    console.warn("⚠️ Botão 'save-proposal' não encontrado.");
  }
});

 function preencherOperadorInterno() {
    const nomeSalvo = localStorage.getItem("nomeUsuario");
    if (!nomeSalvo) return;                        // nada salvo ➜ sai

    const campoOperador = document.getElementById("operadorInterno");
    if (campoOperador) campoOperador.value = nomeSalvo;
  }
function preencherDataOrcamentoSeVazio() {
  const input = document.getElementById("dataOrcamento");
  if (!input) {
    console.warn("#dataOrcamento não encontrado.");
    return;
  }

  if (!input.value) {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    input.value = `${yyyy}-${mm}-${dd}`;
  }
}
preencherDataOrcamentoSeVazio()
   // Executa assim que o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", preencherOperadorInterno);
