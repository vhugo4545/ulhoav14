function formatarDataBR(dataISO) {
  if (!dataISO || !dataISO.includes("-")) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function mostrarPopupPendencias(pendencias) {
  const lista = document.getElementById("listaPendencias");
  lista.innerHTML = "";
  pendencias.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    lista.appendChild(li);
  });
  document.getElementById("popupPendencias").style.display = "block";
  document.getElementById("overlayPopup").style.display = "block";
}

function fecharPopupPendencias() {
  document.getElementById("popupPendencias").style.display = "none";
  document.getElementById("overlayPopup").style.display = "none";
}

function mostrarPopupCustomizado(titulo, mensagem, tipo = "info") {
  ocultarCarregando();
  const popupExistente = document.getElementById("popup-status-omie");
  if (popupExistente) popupExistente.remove();

  const overlay = document.createElement("div");
  overlay.id = "popup-status-omie";
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = 9999;

  const box = document.createElement("div");
  box.style.backgroundColor = "#fff";
  box.style.borderRadius = "8px";
  box.style.padding = "24px";
  box.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.2)";
  box.style.maxWidth = "500px";
  box.style.width = "90%";
  box.style.textAlign = "center";
  box.style.fontFamily = "Arial, sans-serif";

  const tituloEl = document.createElement("h2");
  tituloEl.textContent = titulo;
  tituloEl.style.color = tipo === "success" ? "green" : tipo === "error" ? "red" : "#333";
  tituloEl.style.marginBottom = "12px";

  const mensagemEl = document.createElement("p");
  mensagemEl.textContent = mensagem;
  mensagemEl.style.marginBottom = "20px";

  const botao = document.createElement("button");
  botao.textContent = "Fechar";
  botao.style.padding = "8px 20px";
  botao.style.border = "none";
  botao.style.backgroundColor = "#007BFF";
  botao.style.color = "#fff";
  botao.style.borderRadius = "4px";
  botao.style.cursor = "pointer";
  botao.addEventListener("click", () => overlay.remove());

  box.appendChild(tituloEl);
  box.appendChild(mensagemEl);
  box.appendChild(botao);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function gerarNumeroPedidoUnico() {
  const agora = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const ano = agora.getFullYear().toString().slice(-2);
  const mes = pad(agora.getMonth() + 1);
  const dia = pad(agora.getDate());
  const hora = pad(agora.getHours());
  const minuto = pad(agora.getMinutes());
  const segundo = pad(agora.getSeconds());
  return `${ano}${mes}${dia}${hora}${minuto}${segundo}001`;
}

async function atualizarNaOmie() {
  mostrarCarregando();

  const botao = document.getElementById("btnEnviarOmie");
  const spinner = document.getElementById("spinnerOmie");
  if (spinner) spinner.style.display = "inline-block";
  if (botao) botao.disabled = true;

  setTimeout(async () => {
    const payload = await gerarPayloadOmie();

    if (!payload) {
      ocultarCarregando();
      if (spinner) spinner.style.display = "none";
      if (botao) botao.disabled = false;
      return;
    }

    console.log("📦 Payload gerado:", payload);

    try {
      const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/omie/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`
        },
        body: JSON.stringify(payload)
      });

      const data = await resposta.json();

      if (resposta.ok) {
        mostrarPopupCustomizado("✅ Sucesso!", "Pedido enviado com sucesso à Omie.", "success");
        console.log("📤 Enviado à Omie:", data);

      } else {
        mostrarPopupCustomizado("❌ Erro ao enviar", data?.erro || "Erro desconhecido ao enviar pedido.", "error");
        console.error("❌ Erro:", data);
      }

    } catch (erro) {
      mostrarPopupCustomizado("❌ Erro na conexão", "Não foi possível enviar o pedido. Verifique a conexão com o servidor.", "error");
      console.error("❌ Erro de envio:", erro);
    }

    if (spinner) spinner.style.display = "none";
    if (botao) botao.disabled = false;
    ocultarCarregando();
  }, 300);
}

async function gerarPayloadOmie() {
  const pendencias = [];

  const clientes = document.querySelectorAll("#clientesWrapper .cliente-item");
  const codigoCliente = clientes[0]?.querySelector(".codigoCliente")?.value?.trim();
  if (!codigoCliente) pendencias.push("Código do cliente não preenchido.");

  const primeiraDataParcelaRaw = Array.from(document.querySelectorAll(".data-parcela"))
    .map(el => el.value?.trim())
    .find(v => !!v);
  const primeiraDataParcela = formatarDataBR(primeiraDataParcelaRaw);
  if (!primeiraDataParcela) pendencias.push("Data da 1ª parcela não preenchida.");

  const linhasParcelas = document.querySelectorAll("#listaParcelas .row");
  const blocos = document.querySelectorAll("[id^='bloco-']");

  if (pendencias.length > 0) {
    mostrarPopupPendencias(pendencias);
    return null;
  }

  const numeroPedido = gerarNumeroPedidoUnico();

  const payload = {
    cabecalho: {
      codigo_cliente: codigoCliente,
      codigo_pedido_integracao: numeroPedido,
      data_previsao: primeiraDataParcela,
      etapa: "10",
      numero_pedido: numeroPedido,
      codigo_parcela: "999",
      quantidade_itens: 0
    },
    det: [],
    lista_parcelas: { parcela: [] }
  };

  const ambientesMarcados = Array.from(document.querySelectorAll(".resumo-totalizador .ambiente-toggle:checked"))
    .map(cb => {
      const label = cb.closest(".form-check")?.querySelector("label")?.textContent || "";
      const match = label.match(/"([^"]+)"/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);

  let totalGrupos = 0;

  blocos.forEach(bloco => {
    const inputAmbiente = bloco.querySelector("input[placeholder='Ambiente'][data-id-grupo]");
    const nomeAmbiente = inputAmbiente?.value?.trim() || "Ambiente não identificado";

    if (!ambientesMarcados.includes(nomeAmbiente)) return;

    const tabela = bloco.querySelector("table");
    const linhas = tabela?.querySelectorAll("tbody tr");
    const totalGrupoEl = tabela?.querySelector("tfoot tr td:last-child strong");
    const totalTexto = totalGrupoEl?.textContent?.replace("R$", "").replace(/\./g, "").replace(",", ".") || "0";
    let valorTotal = parseFloat(totalTexto) || 0;
    valorTotal = parseFloat(valorTotal.toFixed(2));

    if (!linhas?.length) return;

    const primeiroProduto = linhas[0];
    const codigoProduto = primeiroProduto.querySelector("td:nth-child(5)")?.textContent?.trim() || "";
    const descricao = primeiroProduto.querySelector("td:nth-child(2)")?.textContent?.trim() || "";

    payload.det.push({
      ide: { codigo_item_integracao: numeroPedido },
      inf_adic: { peso_bruto: 1, peso_liquido: 1 },
      produto: {
        cfop: "5.102",
        codigo_produto: codigoProduto,
        descricao,
        ncm: "9403.30.00",
        quantidade: 1,
        tipo_desconto: "V",
        unidade: "UN",
        valor_desconto: 0,
        valor_unitario: valorTotal / 100
      }
    });

    totalGrupos += valorTotal;
    payload.cabecalho.quantidade_itens++;
  });

  // 💳 Parcelas
// 💳 Parcelas — percentuais garantidos = 100%
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const parseValor = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  const only = s.replace(/[^\d.,-]/g, "");
  if (only.includes(",") && only.includes(".")) {
    return parseFloat(only.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (only.includes(",")) {
    return parseFloat(only.replace(",", ".")) || 0;
  }
  return parseFloat(only) || 0;
};

const parcelasPayload = [];
const valores = [];

linhasParcelas.forEach((linha, i) => {
  const elValor = linha.querySelector(".valor-parcela");
  const rawValor =
    (elValor?.value && elValor.value.trim()) ||
    (elValor?.dataset?.valorOriginal && elValor.dataset.valorOriginal.trim()) ||
    "";

  const valor = round2(parseValor(rawValor));

  const dataISO = linha.querySelector(".data-parcela")?.value || "";
  const data_vencimento = formatarDataBR(dataISO);

  parcelasPayload.push({
    data_vencimento,
    numero_parcela: i + 1,
    percentual: "0.00", // vai ser calculado depois
    valor
  });

  valores.push(valor);
});

// soma de todos os valores informados
const somaParcelas = round2(valores.reduce((acc, v) => acc + v, 0));

// distribui percentuais
let somaPerc = 0;
parcelasPayload.forEach((p, idx) => {
  let pct = somaParcelas > 0 ? (p.valor / somaParcelas) * 100 : 0;
  pct = round2(pct);
  parcelasPayload[idx].percentual = pct.toFixed(2);
  somaPerc = round2(somaPerc + pct);
});

// ajuste final na última parcela para fechar 100%
if (parcelasPayload.length) {
  const diff = round2(100 - somaPerc);
  const last = parcelasPayload[parcelasPayload.length - 1];
  last.percentual = round2(parseFloat(last.percentual) + diff).toFixed(2);
}

payload.lista_parcelas.parcela = parcelasPayload;


  // ✅ Blocos adicionais obrigatórios
  payload.frete = {
    modalidade: "9"
  };

  payload.informacoes_adicionais = {
    codigo_categoria: "1.01.01",
    codigo_conta_corrente: 2523861035,
    consumidor_final: "S",
    enviar_email: "N"
  };

  payload.agropecuario = {
    cNumReceita: "",
    cCpfResponsavel: "",
    nTipoGuia: 1,
    cUFGuia: "",
    cSerieGuia: "",
    nNumGuia: 1
  };

  // ✅ Log final
  console.log("📦 Payload final gerado para Omie:", payload);

  return payload;
}

