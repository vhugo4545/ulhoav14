// Utilitário para gerar slugs (IDs válidos)
function slugify(text) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();
}

function calcularValoresFinanceirosDiretoDaTabela(blocoId) {
  const bloco = document.getElementById(blocoId);
  if (!bloco) return null;

  const buscarValorDoInput = (nome) => {
    const input = bloco.querySelector(`input[name='${nome}']`);
    if (!input) return 0;
    const valor = input.value.trim().replace(',', '.').replace('%', '').replace('R$', '');
    return parseFloat(valor) / 100 || 0;
  };

  const buscarCustoMaterial = () => {
    const input = bloco.querySelector(`input[name='custoTotalMaterial']`);
    if (!input) return 0;
    const valor = input.value.trim().replace(',', '.').replace('R$', '');
    return parseFloat(valor) || 0;
  };

  const impostos = buscarValorDoInput("impostos");
  const margemLucro = buscarValorDoInput("margem_lucro");
  const gastosTotais = buscarValorDoInput("gasto_operacional");
  const negociacao = buscarValorDoInput("margem_negociacao");
  const miudezas = buscarValorDoInput("miudezas");
  const comissaoArquiteta = buscarValorDoInput("comissao_arquiteta");
  const margemSeguranca = buscarValorDoInput("margem_seguranca");
  const custoTotalMaterial = buscarCustoMaterial();

  const tabela = bloco.querySelector("table");
  if (!tabela) return null;

  let materialBase = 0;
  tabela.querySelectorAll("tbody tr").forEach(linha => {
    const valorStr = linha.querySelector(".custo-unitario")?.textContent?.replace("R$", "").replace(",", ".");
    const valor = parseFloat(valorStr || 0);
    materialBase += valor;
  });

  const custoMaterial = materialBase * (1 + miudezas);
  const divisor = 1 - (gastosTotais + margemLucro + impostos);
  if (divisor <= 0) return null;

  const precoMinimo = (custoMaterial / divisor) * (1 + comissaoArquiteta + margemSeguranca);
  const precoSugerido = precoMinimo * (1 + negociacao);
  const campoVAlorSegurancaDesperdicio = precoMinimo - precoMinimo / (1 + comissaoArquiteta + margemSeguranca); // MARGEM SEGURANÇA
  const campoValorGastosOperacionais = (precoMinimo - campoVAlorSegurancaDesperdicio) * gastosTotais;
  const campoValorImpostos = impostos * precoMinimo;
  const somaValores = campoValorImpostos + custoMaterial + campoValorGastosOperacionais;
  const campoValorMargemLucro = (precoMinimo - somaValores) - campoVAlorSegurancaDesperdicio;
  const campoValorMiudezas = custoMaterial - custoMaterial / (1 + miudezas);
  const campoNegociacao = precoSugerido - precoMinimo; // MARGEM NEGOCIAÇÃO

  // Variáveis para totalizadores (adicionadas)
  const valorMargemSeguranca =  (custoMaterial + campoValorGastosOperacionais + campoValorMargemLucro + campoValorImpostos) 
  * (margemSeguranca );
  

console.log("➡️ ok Custo Total de Material:", custoMaterial);
console.log("➡️ ok Gastos Operacionais:", campoValorGastosOperacionais);
console.log("➡️ ok Margem de Lucro:", campoValorMargemLucro);
console.log("➡️ ok Impostos:", campoValorImpostos);
console.log("➡️ Comissão Arquiteta (%):", comissaoArquiteta);

const valorComissaoArquiteta = 
  (custoMaterial + campoValorGastosOperacionais + campoValorMargemLucro + campoValorImpostos) 
  * (comissaoArquiteta );




console.log("➡️ Valor Final Comissão Arquiteta:", valorComissaoArquiteta);

  console.log("Valor arquiteto",valorComissaoArquiteta)

  return {
    campoValorGastosOperacionais,
    campoValorMargemLucro,
    campoValorImpostos,
    campoValorMinimo: precoMinimo,
    campoVAlorSegurancaDesperdicio, // Margem de segurança (desperdício)
    campoValorMiudezas,
    campoNegociacao,
    campoValorFinal: precoSugerido,
    comissao_arquiteta: valorComissaoArquiteta,    // novo, direto para totalizador
    margem_seguranca: valorMargemSeguranca,       // novo, direto para totalizador
    custoTotalMaterial
  };
}


function gerarHtmlTotalizador(nomeAmbiente, valores) {
  const base = Number(valores.campoValorMinimo) || 1;

  function porcentagem(valor) {
    return `${((Number(valor) / base) * 100).toFixed(1)}%`;
  }

  const comissaoArquiteta = Number(valores.comissao_arquiteta) || 0;
  const custoTotalMaterial = Number(valores.custoTotalMaterial) || 0;
  const margemSeguranca = Number(valores.margem_seguranca) || 0;
  const campoNegociacao = Number(valores.campoNegociacao) || 0;

return `
  <div class="row text-center gx-4 gy-3">
    <div class="col">
      <div class="text-muted small">Miudezas</div>
      <div class="fw-bold">${valores.campoValorMiudezas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(valores.campoValorMiudezas)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Gastos <br>Operacionais</div>
      <div class="fw-bold">${valores.campoValorGastosOperacionais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(valores.campoValorGastosOperacionais)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Impostos</div>
      <div class="fw-bold">${valores.campoValorImpostos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(valores.campoValorImpostos)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Margem de <br>Segurança</div>
      <div class="fw-bold">${margemSeguranca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(margemSeguranca)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Comissão <br>Arquiteta</div>
      <div class="fw-bold">${comissaoArquiteta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(comissaoArquiteta)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Margem de <br>Negociação</div>
      <div class="fw-bold">${campoNegociacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(campoNegociacao)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Custo Total <br>de Material</div>
      <div class="fw-bold">${custoTotalMaterial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">–</div>
    </div>
    <div class="col">
      <div class="text-muted small">Valor <br>Mínimo</div>
      <div class="fw-bold">${valores.campoValorMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">100%</div>
    </div>
    <div class="col">
      <div class="text-muted small">Valor <br>Sugerido</div>
      <div class="fw-bold">${valores.campoValorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(valores.campoValorFinal)}</div>
    </div>
    <div class="col">
      <div class="text-muted small">Margem de <br>Lucro</div>
      <div class="fw-bold">${valores.campoValorMargemLucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      <div class="text-secondary small">${porcentagem(valores.campoValorMargemLucro)}</div>
    </div>
  </div>
`;


}


// Soma listas de valores por campo
// Soma listas de valores por campo, incluindo comissão do arquiteto
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
    margem_seguranca: 0,        // <--- Incluído!
    campoValorMargemSeguranca: 0 // Se tiver esse campo novo também
  };

  lista.forEach(v => {
    for (const chave in total) {
      total[chave] += Number(v[chave]) || 0;
    }
  });
  return total;
}





function adicionarTotalizadoresPorAmbienteComAgrupamento() {
  const blocos = document.querySelectorAll("[id^='bloco-']");
  const mapaAmbientes = {};

  // 1) Calcula os valores de cada bloco e agrupa por ambiente
  blocos.forEach(bloco => {
    const blocoId = bloco.id;
    const valores = calcularValoresFinanceirosDiretoDaTabela(blocoId);
    if (!valores) return;

    const inputAmbiente = document.querySelector(`input[placeholder='Ambiente'][data-id-grupo='${blocoId}']`);
    const nomeAmbiente = inputAmbiente?.value?.trim() || "Ambiente não identificado";

    if (!mapaAmbientes[nomeAmbiente]) mapaAmbientes[nomeAmbiente] = [];
    mapaAmbientes[nomeAmbiente].push(valores);

    // Remove e re-renderiza o totalizador interno do bloco
    bloco.querySelectorAll(".resumo-totalizador").forEach(el => el.remove());
    const div = document.createElement("div");
    div.className = "resumo-totalizador mt-4 p-4 border-top";
    div.innerHTML = gerarHtmlTotalizador(nomeAmbiente, valores);
    bloco.appendChild(div);
  });

  // 2) Limpa container externo e recria
  document.querySelectorAll("#totalizadoresExternosPorAmbiente")?.forEach(e => e.remove());

  const containerResumo = document.createElement("div");
  containerResumo.id = "totalizadoresExternosPorAmbiente";
  containerResumo.className = "mt-5";
  containerResumo.innerHTML = `<h4 class="mb-4">Totais Consolidados por Ambiente</h4>`;

  const checkboxes = {};

  // 3) Cria um bloco externo por ambiente (consolidado)
  for (const ambiente in mapaAmbientes) {
    const ambienteId = slugify(ambiente);
    const valores = somarValores(mapaAmbientes[ambiente]); // soma todos os blocos desse ambiente

    const divResumo = document.createElement("div");
    divResumo.className = "resumo-totalizador mb-4 p-4 border rounded bg-light";
    divResumo.innerHTML = `
      <div class="form-check mb-3">
        <input class="form-check-input ambiente-toggle" type="checkbox" id="toggle-${ambienteId}" checked data-ambiente="${ambienteId}">
        <label class="form-check-label fw-semibold" for="toggle-${ambienteId}">Incluir "${ambiente}" no valor final</label>
      </div>
      ${gerarHtmlTotalizador(ambiente, valores)}
    `;
    containerResumo.appendChild(divResumo);
    checkboxes[ambienteId] = valores; // guarda para cálculo do final
  }

  // 4) TOTAL DA PROPOSTA (SOMA DE TODOS OS AMBIENTES) — fixo, sem desconto/checkbox
  const listaAmbientes = Object.values(checkboxes);
  if (listaAmbientes.length) {
    const valoresGerais = somarValores(listaAmbientes);

    // Mini-resumo compacto (opcional)
    const mini = document.createElement("div");
    mini.className = "bg-white border rounded p-3 mb-3 text-center";

    containerResumo.appendChild(mini);

    // Bloco completo com o mesmo layout dos ambientes
    const blocoGeral = document.createElement("div");
    blocoGeral.className = "resumo-totalizador mb-4 p-4 border rounded bg-light";
    blocoGeral.innerHTML = `
      <div class="fw-semibold mb-3">Total da Proposta (soma de todos os ambientes)</div>
      ${gerarHtmlTotalizador("Proposta", valoresGerais)}
    `;
    containerResumo.appendChild(blocoGeral);
  }

  // 5) Campo de desconto
  const inputDesconto = document.createElement("input");
  inputDesconto.type = "text";
  inputDesconto.className = "form-control w-auto mx-auto mb-3 text-center";
  inputDesconto.placeholder = "Desconto (R$ ou %)";
  inputDesconto.id = "campoDescontoFinal";
  inputDesconto.value = "";
  containerResumo.appendChild(inputDesconto);

  // 6) Card do Valor Final (considera seleção via checkboxes + desconto)
  const final = document.createElement("div");
  final.className = "bg-white border border-2 rounded p-4 mb-5 text-center";
  final.innerHTML = `
    <h5 class="fw-bold mb-3">Valor Final do Pedido</h5>
    <div class="fs-4 fw-bold text-success" id="valorFinalTotal">R$ 0,00</div>
  `;
  containerResumo.appendChild(final);

  const finalValor = final.querySelector("#valorFinalTotal");

  const calcularTotalFinal = () => {
    if (typeof atualizarValoresDasParcelas === "function") atualizarValoresDasParcelas();

    let total = 0;
    for (const checkbox of containerResumo.querySelectorAll(".ambiente-toggle")) {
      if (checkbox.checked) {
        const ambienteId = checkbox.dataset.ambiente;
        total += checkboxes[ambienteId]?.campoValorFinal || 0; // soma Valor Sugerido dos ambientes marcados
      }
    }

    const desconto = inputDesconto.value.trim();
    if (desconto.endsWith("%")) {
      const percentual = parseFloat(desconto.replace("%", "").replace(",", ".")) / 100;
      if (!isNaN(percentual)) total -= total * percentual;
    } else if (desconto) {
      const valor = parseFloat(desconto.replace("R$", "").replace(/\./g, "").replace(",", ".").replace(/\s/g, ""));
      if (!isNaN(valor)) total -= valor;
    }

    finalValor.textContent = `R$ ${total.toFixed(2)}`;
  };

  // 7) Eventos
  inputDesconto.addEventListener("input", calcularTotalFinal);
  containerResumo.querySelectorAll(".ambiente-toggle").forEach(cb => {
    cb.addEventListener("change", calcularTotalFinal);
  });

  // 8) Inicializa
  calcularTotalFinal();

  const form = document.querySelector("#novoOrcamentoForm");
  (form || document.body).appendChild(containerResumo);
}



function monitorarMudancasAmbientes() {
  document.addEventListener("input", (e) => {
    if (e.target.matches("input[placeholder='Ambiente'][data-id-grupo]")) {
      setTimeout(() => adicionarTotalizadoresPorAmbienteComAgrupamento(), 300);
      
    }
  });
}


function atualizarValoresDasParcelas() {
  setTimeout(() => {
    const textoTotal = document.querySelector("#valorFinalTotal")?.textContent?.trim() || "R$ 0.00";

    // ✅ Remove apenas "R$" e espaços
    const valorLimpo = textoTotal.replace("R$", "").trim();
    const total = parseFloat(valorLimpo) || 0;

    const linhas = document.querySelectorAll("#listaParcelas .row");
    const totalParcelasSpan = document.getElementById("totalParcelas");

    if (linhas.length === 0) {
      if (totalParcelasSpan) totalParcelasSpan.textContent = "R$ 0.00";
      return;
    }

    const valorPorParcela = total / linhas.length;
    let soma = 0;

    linhas.forEach((linha) => {
      const inputValor = linha.querySelector(".valor-parcela");
      if (!inputValor) return;

      const valor = parseFloat(valorPorParcela.toFixed(2));
      soma += valor;

      // Mantém formato com ponto decimal
      inputValor.value = `R$ ${valor.toFixed(2)}`;
      inputValor.setAttribute("data-percentual", ((valor / total) * 100).toFixed(2));
    });

    // Atualiza total das parcelas
    if (totalParcelasSpan) {
      totalParcelasSpan.textContent = `R$ ${soma.toFixed(2)}`;
    }
  }, 500);
}



document.addEventListener("DOMContentLoaded", () => {
  adicionarTotalizadoresPorAmbienteComAgrupamento();
  monitorarMudancasAmbientes();

});
