// =========================
// UTILITÁRIOS
// =========================
function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .toLowerCase();
}

function normalizarNomeAmbiente(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function formatarNomeAmbiente(texto) {
  const valor = String(texto || "").trim();
  if (!valor) return "Ambiente não identificado";

  return valor
    .toLowerCase()
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function formatarMoedaBR(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/**
 * Converte texto monetário/numérico em número,
 * aceitando tanto pt-BR quanto formato com ponto decimal.
 *
 * Exemplos aceitos:
 * "20.550,42" => 20550.42
 * "20550.42"  => 20550.42
 * "20550,42"  => 20550.42
 * "R$ 20.550,42" => 20550.42
 * "15%" => 15
 */
function parseNumeroFlex(valor) {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === "number") return isNaN(valor) ? 0 : valor;

  let texto = String(valor).trim();
  if (!texto) return 0;

  texto = texto.replace(/\s/g, "").replace("R$", "").replace("%", "");

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  // Caso 1: tem ponto e vírgula => formato BR clássico: 20.550,42
  if (temVirgula && temPonto) {
    texto = texto.replace(/\./g, "").replace(",", ".");
    return parseFloat(texto) || 0;
  }

  // Caso 2: só vírgula => pode ser decimal BR: 20550,42
  if (temVirgula && !temPonto) {
    texto = texto.replace(",", ".");
    return parseFloat(texto) || 0;
  }

  // Caso 3: só ponto => assume ponto decimal normal: 20550.42
  return parseFloat(texto) || 0;
}

function parsePercentualFlex(valor) {
  return parseNumeroFlex(valor) / 100;
}


// =========================
// CÁLCULO FINANCEIRO POR BLOCO
// =========================
function calcularValoresFinanceirosDiretoDaTabela(blocoId) {
  const bloco = document.getElementById(blocoId);
  if (!bloco) return null;

  const buscarValorDoInput = (nome) => {
    const input = bloco.querySelector(`input[name='${nome}']`);
    if (!input) return 0;
    return parsePercentualFlex(input.value);
  };

  const buscarCustoMaterial = () => {
    const input = bloco.querySelector(`input[name='custoTotalMaterial']`);
    if (!input) return 0;
    return parseNumeroFlex(input.value);
  };

  const impostos = buscarValorDoInput("impostos");
  const margemLucro = buscarValorDoInput("margem_lucro");
  const gastosTotais = buscarValorDoInput("gasto_operacional");
  const negociacao = buscarValorDoInput("margem_negociacao");
  const miudezas = buscarValorDoInput("miudezas");
  const comissaoArquiteta = buscarValorDoInput("comissao_arquiteta");
  const margemSeguranca = buscarValorDoInput("margem_seguranca");
  const custoTotalMaterialInput = buscarCustoMaterial();

  const tabela = bloco.querySelector("table");
  if (!tabela) return null;

  let materialBase = 0;

  tabela.querySelectorAll("tbody tr").forEach(linha => {
    const texto = linha.querySelector(".custo-unitario")?.textContent || "0";
    const valor = parseNumeroFlex(texto);
    materialBase += valor;
  });

  const custoMaterialBaseCalculado = materialBase;
  const custoMaterial = custoMaterialBaseCalculado * (1 + miudezas);

  const divisor = 1 - (gastosTotais + margemLucro + impostos);
  if (divisor <= 0) return null;

  const precoMinimo =
    (custoMaterial / divisor) * (1 + comissaoArquiteta + margemSeguranca);

  const precoSugerido = precoMinimo * (1 + negociacao);

  const campoVAlorSegurancaDesperdicio =
    precoMinimo - precoMinimo / (1 + comissaoArquiteta + margemSeguranca);

  const campoValorGastosOperacionais =
    (precoMinimo - campoVAlorSegurancaDesperdicio) * gastosTotais;

  const campoValorImpostos = impostos * precoMinimo;

  const somaValores =
    campoValorImpostos +
    custoMaterial +
    campoValorGastosOperacionais;

  const campoValorMargemLucro =
    (precoMinimo - somaValores) - campoVAlorSegurancaDesperdicio;

  const campoValorMiudezas =
    custoMaterial - custoMaterial / (1 + miudezas);

  const campoNegociacao = precoSugerido - precoMinimo;

  const valorMargemSeguranca =
    (
      custoMaterial +
      campoValorGastosOperacionais +
      campoValorMargemLucro +
      campoValorImpostos
    ) * margemSeguranca;

  const valorComissaoArquiteta =
    (
      custoMaterial +
      campoValorGastosOperacionais +
      campoValorMargemLucro +
      campoValorImpostos
    ) * comissaoArquiteta;

  console.log("➡️ materialBase:", materialBase);
  console.log("➡️ custoMaterial:", custoMaterial);
  console.log("➡️ precoMinimo:", precoMinimo);
  console.log("➡️ precoSugerido:", precoSugerido);

  return {
    campoValorGastosOperacionais,
    campoValorMargemLucro,
    campoValorImpostos,
    campoValorMinimo: precoMinimo,
    campoVAlorSegurancaDesperdicio,
    campoValorMiudezas,
    campoNegociacao,
    campoValorFinal: precoSugerido,
    comissao_arquiteta: valorComissaoArquiteta,
    margem_seguranca: valorMargemSeguranca,
    custoTotalMaterial: custoTotalMaterialInput || custoMaterial
  };
}


// =========================
// HTML DO TOTALIZADOR
// =========================
function gerarHtmlTotalizador(nomeAmbiente, valores) {
  const base = Number(valores.campoValorMinimo) || 1;

  function porcentagem(valor) {
    return `${((Number(valor || 0) / base) * 100).toFixed(1)}%`;
  }

  const comissaoArquiteta = Number(valores.comissao_arquiteta) || 0;
  const custoTotalMaterial = Number(valores.custoTotalMaterial) || 0;
  const margemSeguranca = Number(valores.margem_seguranca) || 0;
  const campoNegociacao = Number(valores.campoNegociacao) || 0;

  return `
    <div class="row text-center gx-4 gy-3">
      <div class="col">
        <div class="text-muted small">Miudezas</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorMiudezas)}</div>
        <div class="text-secondary small">${porcentagem(valores.campoValorMiudezas)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Gastos <br>Operacionais</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorGastosOperacionais)}</div>
        <div class="text-secondary small">${porcentagem(valores.campoValorGastosOperacionais)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Impostos</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorImpostos)}</div>
        <div class="text-secondary small">${porcentagem(valores.campoValorImpostos)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Margem de <br>Segurança</div>
        <div class="fw-bold">${formatarMoedaBR(margemSeguranca)}</div>
        <div class="text-secondary small">${porcentagem(margemSeguranca)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Comissão <br>Arquiteta</div>
        <div class="fw-bold">${formatarMoedaBR(comissaoArquiteta)}</div>
        <div class="text-secondary small">${porcentagem(comissaoArquiteta)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Margem de <br>Negociação</div>
        <div class="fw-bold">${formatarMoedaBR(campoNegociacao)}</div>
        <div class="text-secondary small">${porcentagem(campoNegociacao)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Custo Total <br>de Material</div>
        <div class="fw-bold">${formatarMoedaBR(custoTotalMaterial)}</div>
        <div class="text-secondary small">–</div>
      </div>

      <div class="col">
        <div class="text-muted small">Valor <br>Mínimo</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorMinimo)}</div>
        <div class="text-secondary small">100%</div>
      </div>

      <div class="col">
        <div class="text-muted small">Valor <br>Sugerido</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorFinal)}</div>
        <div class="text-secondary small">${porcentagem(valores.campoValorFinal)}</div>
      </div>

      <div class="col">
        <div class="text-muted small">Margem de <br>Lucro</div>
        <div class="fw-bold">${formatarMoedaBR(valores.campoValorMargemLucro)}</div>
        <div class="text-secondary small">${porcentagem(valores.campoValorMargemLucro)}</div>
      </div>
    </div>
  `;
}


// =========================
// SOMA DE VALORES
// =========================
function somarValores(lista) {
  const total = {
    campoValorGastosOperacionais: 0,
    campoValorMargemLucro: 0,
    campoValorImpostos: 0,
    campoValorMinimo: 0,
    campoVAlorSegurancaDesperdicio: 0,
    campoValorMiudezas: 0,
    campoNegociacao: 0,
    campoValorFinal: 0,
    comissao_arquiteta: 0,
    custoTotalMaterial: 0,
    margem_seguranca: 0,
    campoValorMargemSeguranca: 0
  };

  lista.forEach(v => {
    for (const chave in total) {
      total[chave] += Number(v?.[chave]) || 0;
    }
  });

  return total;
}


// =========================
// TOTALIZADORES POR AMBIENTE
// =========================
function adicionarTotalizadoresPorAmbienteComAgrupamento() {
  const blocos = document.querySelectorAll("[id^='bloco-']");
  const mapaAmbientes = {};

  blocos.forEach(bloco => {
    const blocoId = bloco.id;
    const valores = calcularValoresFinanceirosDiretoDaTabela(blocoId);
    if (!valores) return;

    const inputAmbiente = document.querySelector(
      `input[placeholder='Ambiente'][data-id-grupo='${blocoId}']`
    );

    const nomeDigitado = inputAmbiente?.value?.trim() || "Ambiente não identificado";
    const chaveAmbiente = normalizarNomeAmbiente(nomeDigitado);
    const nomeExibicao = formatarNomeAmbiente(nomeDigitado);

    if (!mapaAmbientes[chaveAmbiente]) {
      mapaAmbientes[chaveAmbiente] = {
        nomeExibicao,
        valores: []
      };
    }

    mapaAmbientes[chaveAmbiente].valores.push(valores);

    bloco.querySelectorAll(".resumo-totalizador-interno").forEach(el => el.remove());

    const divInterna = document.createElement("div");
    divInterna.className = "resumo-totalizador resumo-totalizador-interno mt-4 p-4 border-top";
    divInterna.innerHTML = `
      <div class="fw-semibold mb-3">Resumo do grupo: ${nomeExibicao}</div>
      ${gerarHtmlTotalizador(nomeExibicao, valores)}
    `;

    bloco.appendChild(divInterna);
  });

  document.querySelectorAll("#totalizadoresExternosPorAmbiente").forEach(e => e.remove());

  const containerResumo = document.createElement("div");
  containerResumo.id = "totalizadoresExternosPorAmbiente";
  containerResumo.className = "mt-5";
  containerResumo.innerHTML = `<h4 class="mb-4">Totais Consolidados por Ambiente</h4>`;

  const checkboxes = {};

  for (const chaveAmbiente in mapaAmbientes) {
    const grupo = mapaAmbientes[chaveAmbiente];
    const ambiente = grupo.nomeExibicao;
    const ambienteId = `amb-${slugify(chaveAmbiente)}`;
    const valoresSomados = somarValores(grupo.valores);

    const divResumo = document.createElement("div");
    divResumo.className = "resumo-totalizador mb-4 p-4 border rounded bg-light";
    divResumo.innerHTML = `
      <div class="form-check mb-3">
        <input
          class="form-check-input ambiente-toggle"
          type="checkbox"
          id="toggle-${ambienteId}"
          checked
          data-ambiente="${ambienteId}"
        >
        <label class="form-check-label fw-semibold" for="toggle-${ambienteId}">
          Incluir "${ambiente}" no valor final
        </label>
      </div>
      ${gerarHtmlTotalizador(ambiente, valoresSomados)}
    `;

    containerResumo.appendChild(divResumo);
    checkboxes[ambienteId] = valoresSomados;
  }

  const listaAmbientes = Object.values(checkboxes);
  if (listaAmbientes.length) {
    const valoresGerais = somarValores(listaAmbientes);

    const blocoGeral = document.createElement("div");
    blocoGeral.className = "resumo-totalizador mb-4 p-4 border rounded bg-light";
    blocoGeral.innerHTML = `
      <div class="fw-semibold mb-3">Total da Proposta (soma de todos os ambientes)</div>
      ${gerarHtmlTotalizador("Proposta", valoresGerais)}
    `;

    containerResumo.appendChild(blocoGeral);
  }

  const inputDesconto = document.createElement("input");
  inputDesconto.type = "text";
  inputDesconto.className = "form-control w-auto mx-auto mb-3 text-center";
  inputDesconto.placeholder = "Desconto (R$ ou %)";
  inputDesconto.id = "campoDescontoFinal";
  inputDesconto.value = "";
  containerResumo.appendChild(inputDesconto);

  const final = document.createElement("div");
  final.className = "bg-white border border-2 rounded p-4 mb-5 text-center";
  final.innerHTML = `
    <h5 class="fw-bold mb-3">Valor Final do Pedido</h5>
    <div class="fs-4 fw-bold text-success" id="valorFinalTotal">R$ 0,00</div>
  `;
  containerResumo.appendChild(final);

  const finalValor = final.querySelector("#valorFinalTotal");

  const calcularTotalFinal = () => {
    let total = 0;

    for (const checkbox of containerResumo.querySelectorAll(".ambiente-toggle")) {
      if (checkbox.checked) {
        const ambienteId = checkbox.dataset.ambiente;
        total += Number(checkboxes[ambienteId]?.campoValorFinal) || 0;
      }
    }

    const desconto = inputDesconto.value.trim();

    if (desconto.endsWith("%")) {
      const percentual = parsePercentualFlex(desconto);
      if (!isNaN(percentual)) total -= total * percentual;
    } else if (desconto) {
      const valor = parseNumeroFlex(desconto);
      if (!isNaN(valor)) total -= valor;
    }

    if (total < 0) total = 0;

    finalValor.textContent = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    if (typeof atualizarValoresDasParcelas === "function") {
      atualizarValoresDasParcelas();
    }
  };

  inputDesconto.addEventListener("input", calcularTotalFinal);
  containerResumo.querySelectorAll(".ambiente-toggle").forEach(cb => {
    cb.addEventListener("change", calcularTotalFinal);
  });

  calcularTotalFinal();

  const form = document.querySelector("#novoOrcamentoForm");
  (form || document.body).appendChild(containerResumo);
}


// =========================
// MONITORAR MUDANÇAS NOS AMBIENTES
// =========================
function monitorarMudancasAmbientes() {
  document.addEventListener("input", (e) => {
    if (e.target.matches("input[placeholder='Ambiente'][data-id-grupo]")) {
      clearTimeout(window.__timeoutAmbienteTotalizador);
      window.__timeoutAmbienteTotalizador = setTimeout(() => {
        adicionarTotalizadoresPorAmbienteComAgrupamento();
      }, 300);
    }
  });
}


// =========================
// ATUALIZAR PARCELAS
// =========================
function atualizarValoresDasParcelas() {
  setTimeout(() => {
    const textoTotal =
      document.querySelector("#valorFinalTotal")?.textContent?.trim() || "R$ 0,00";

    const total = parseNumeroFlex(textoTotal);

    const linhas = document.querySelectorAll("#listaParcelas .row");
    const totalParcelasSpan = document.getElementById("totalParcelas");

    if (linhas.length === 0) {
      if (totalParcelasSpan) {
        totalParcelasSpan.textContent = formatarMoedaBR(total);
      }
      return;
    }

    const valorPorParcela = total / linhas.length;
    let soma = 0;

    linhas.forEach(() => {
      soma += valorPorParcela;
    });

    if (totalParcelasSpan) {
      totalParcelasSpan.textContent = formatarMoedaBR(soma);
    }
  }, 500);
}


// =========================
// INICIALIZAÇÃO
// =========================
document.addEventListener("DOMContentLoaded", () => {
  adicionarTotalizadoresPorAmbienteComAgrupamento();
  monitorarMudancasAmbientes();
});
