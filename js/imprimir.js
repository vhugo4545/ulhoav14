let contadorGlobal = 1;

// 1. Função principal: chamada pelo botão "Visualizar Proposta"


function gerarOrcamentoParaImpressaoCompleta() {
  const idsObrigatorios = [
    "numeroOrcamento", "dataOrcamento", "origemCliente",
    "nomeOrigem", "telefoneOrigem", "emailOrigem",
    "operadorInterno", "vendedorResponsavel"
  ];

  const pendentes = [];
  idsObrigatorios.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const valor = (el.value || el.textContent || "").trim();
    if (!valor) {
      pendentes.push(el);
      el.classList.add("campo-pendente");
    } else {
      el.classList.remove("campo-pendente");
    }
  });

  if (pendentes.length) {
    const continuar = confirm(
      `Existem ${pendentes.length} campo(s) obrigatório(s) vazio(s).\nEles foram destacados em vermelho.\n\nDeseja continuar mesmo assim?`
    );
    if (!continuar) return;
  }

  // Captura lista de grupos/blocos para montar popup
  const grupos = [];
  document.querySelectorAll("table[id^='tabela-bloco-']").forEach(tabela => {
    const grupoId = tabela.id.replace("tabela-", "").trim(); // 🔹 aqui
    const inputAmbiente = document.querySelector(`input[data-id-grupo='${grupoId}'][placeholder='Ambiente']`);
    const nomeAmbiente = inputAmbiente?.value.trim() || "Sem Ambiente";
    const linhaProduto = tabela.querySelector("tbody tr");
    let nomeProduto = "";
    if (linhaProduto) {
      const colunas = linhaProduto.querySelectorAll("td");
      nomeProduto = (colunas[1]?.textContent || colunas[0]?.textContent || "").trim();
    }
    const totalGrupo = parseFloat(
      tabela.querySelector("tfoot td[colspan='6'] strong")?.textContent.replace(/[^\d,\.]/g, '').replace(',', '.') || "0"
    );
    grupos.push({
      grupoId, nomeAmbiente, totalGrupo, nomeProduto
    });
  });

  // Valor final com desconto (para mostrar no popup)
  const valorFinalComDescontoStr = document.getElementById("valorFinalTotal")?.textContent || "R$ 0,00";
  const valorFinalComDesconto = parseFloat(valorFinalComDescontoStr.replace(/[^\d,\.]/g, "").replace(",", "."));

  // Exibe popup e chama impressão quando confirmar
  mostrarPopupSelecaoGruposEstetico(grupos, valorFinalComDesconto, function(gruposOcultarProduto) {
    gerarHTMLParaImpressao(gruposOcultarProduto);
  });
}


// 2. Função de popup estético para ocultar produtos
function mostrarPopupSelecaoGruposEstetico(grupos, valorFinal, onConfirmar) {
  // CSS do popup (apenas uma vez)
  if (!document.getElementById("estetico-popup-style")) {
    const style = document.createElement("style");
    style.id = "estetico-popup-style";
    style.innerHTML = `
#popup-overlay-custom {
  position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;
  background:rgba(34,37,51,0.79);display:flex;align-items:center;justify-content:center;
  animation:popupfadein .12s;
}
@keyframes popupfadein{from{opacity:0}to{opacity:1}}
#popup-modal-custom {
  background:#fff;border-radius:15px;box-shadow:0 6px 38px #1118;
  padding:0;min-width:320px;max-width:430px;width:98%;overflow:hidden;max-height:96vh;display:flex;flex-direction:column;
}
#popup-modal-custom .header {
  background:linear-gradient(90deg,#377dff 0,#2a4d94 100%);
  color:#fff;padding:20px 25px 14px 25px;border-radius:15px 15px 0 0;
  font-size:1.22rem;font-weight:600;letter-spacing:.01em;box-shadow:0 2px 16px #2132;
}
#popup-modal-custom .body {
  padding:22px 18px 7px 22px;flex:1;overflow-y:auto;max-height:400px;
}
#popup-modal-custom .grupo-row {
  display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:9px;border-bottom:1px solid #f2f4f7;
  padding-bottom:10px;
}
#popup-modal-custom .grupo-row:last-child{border-bottom:0}
#popup-modal-custom .grupo-info strong{font-size:1.07em;}
#popup-modal-custom .grupo-info {flex:1;}
#popup-modal-custom .grupo-info .produto{color:#222;font-size:.96em;}
#popup-modal-custom .grupo-info .valor{color:#2a4d94;font-size:.99em;font-weight:600;}
#popup-modal-custom .grupo-checkbox {margin-left:8px;white-space:nowrap;min-width:125px;}
#popup-modal-custom .footer {
  border-top:1px solid #f4f6fa;padding:14px 22px 18px 22px;display:flex;flex-direction:column;align-items:flex-end;background:#f8fafb;
}
#popup-modal-custom .footer .total {
  font-weight:bold;font-size:1.09em;color:#345;letter-spacing:.01em;margin-bottom:5px;
}
#popup-modal-custom .btn-row {
  display:flex;gap:11px;margin-top:10px;
}
#popup-modal-custom button {
  padding:8px 24px;border-radius:8px;border:none;outline:none;font-size:1em;
  font-weight:500;cursor:pointer;transition:background .16s;
}
#popup-modal-custom .btn-cancelar {background:#f2f2f2;color:#234;}
#popup-modal-custom .btn-cancelar:hover {background:#ececec;}
#popup-modal-custom .btn-confirmar {background:#377dff;color:#fff;}
#popup-modal-custom .btn-confirmar:hover {background:#2656af;}
    `;
    document.head.appendChild(style);
  }

  // HTML do popup
  let overlay = document.getElementById("popup-overlay-custom");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "popup-overlay-custom";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div id="popup-modal-custom" tabindex="0">
      <div class="header">Opções de Impressão dos Ambientes</div>
      <form class="body" id="form-opcoes-grupos-custom">
        ${grupos.map(g => `
        <div class="grupo-row">
          <div class="grupo-info">
            <strong>${g.nomeAmbiente}</strong>
            <div class="valor">R$ ${g.totalGrupo.toFixed(2).replace('.', ',')}</div>
            <div class="produto">${g.nomeProduto ? `<span style="color:#375;">Produto:</span> ${g.nomeProduto}` : ''}</div>
          </div>
          <label class="grupo-checkbox">
            <input type="checkbox" name="ocultarProduto" data-grupoid="${g.grupoId}" checked>
            <span style="font-size:.99em;">Ocultar produto principal</span>
          </label>
        </div>`).join('')}
      </form>
      <div class="footer">
        <div class="total">Valor Final Geral: R$ ${valorFinal.toFixed(2).replace('.', ',')}</div>
        <div class="btn-row">
          <button type="button" class="btn-cancelar" id="btnCancelarModalCustom">Cancelar</button>
          <button type="button" class="btn-confirmar" id="btnConfirmarModalCustom">Visualizar</button>
        </div>
      </div>
    </div>
  `;

  overlay.style.display = "flex";
  overlay.querySelector("#popup-modal-custom").focus();
 overlay.querySelector("#btnCancelarModalCustom").onclick = function() {
    overlay.style.display = "none";
  };
 overlay.querySelector("#btnConfirmarModalCustom").onclick = function() {
  const checkboxes = overlay.querySelectorAll("input[name='ocultarProduto']");
  const opcoes = {};
  checkboxes.forEach(cb => {
    const key = (cb.dataset.grupoid || "").trim();
    // ✅ marcado = ocultar (false para exibir, true para ocultar – conforme sua lógica atual)
    opcoes[key] = !cb.checked;
  });
  overlay.style.display = "none";
  onConfirmar(opcoes);
};

}



// Função auxiliar para formatar valores em Real
function formatarReal(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function gerarHTMLParaImpressao(gruposOcultarProduto) {
  const getValue = id => document.getElementById(id)?.value || "-";

  // Helper seguro
  const getTextOrValue = (el) => {
    if (!el) return "";
    if (typeof el.value === "string" && el.value.trim()) return el.value.trim();
    if (typeof el.textContent === "string" && el.textContent.trim()) return el.textContent.trim();
    return "";
  };

  // Helpers BRL
  const parseBRL = (s) => {
    if (window.vv_parseBRL) return vv_parseBRL(s || "0");
    const str = String(s || "0").replace(/\u00A0/g, ' ');
    const limpo = str.replace(/[^\d,.-]/g, '').replace(/\./g,'').replace(',', '.');
    const n = Number(limpo);
    return isNaN(n) ? 0 : n;
  };

  const fmtBRL = (n) => {
    if (window.vv_fmtBRL) return vv_fmtBRL(Number(n) || 0);
    return `R$ ${(Number(n) || 0).toFixed(2)}`;
  };

  const formatarDataBR = (iso) => {
    if (!iso) return "-";
    const [y,m,d] = String(iso).split("-");
    if (!y || !m || !d) return "-";
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
  };

  // ✅ NORMALIZA CONDIÇÃO (vazia ou "Selecione..." => "")
  const normalizarCondicao = (txt) => {
    const t = String(txt || "").trim();
    if (!t) return "";
    if (/^selecione/i.test(t)) return ""; // "Selecione", "Selecione...", etc.
    return t;
  };

  // ✅ Helper: converte quebras de linha em <br>
  const multilineToBR = (txt) => {
    const t = String(txt || "").trim();
    if (!t) return "";
    return t.replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
  };

  // ✅ Helper fallback caso você tenha usado formatarReal em outro arquivo
  const formatarReal = (n) => {
    // tenta usar helpers globais, se existirem
    if (window.formatarReal) return window.formatarReal(n);
    if (window.vv_fmtBRL) return vv_fmtBRL(Number(n) || 0);
    // fallback simples
    try {
      return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch {
      return fmtBRL(Number(n) || 0);
    }
  };

  // 1) Dados gerais do orçamento
  const dados = {
    numero: getValue("numeroOrcamento"),
    data: new Date(getValue("dataOrcamento")).toLocaleDateString('pt-BR'),
    origem: getValue("origemCliente"),
    nomeOrigem: getValue("nomeOrigem"),
    codigoOrigem: getValue("codigoOrigem"),
    telefoneOrigem: getValue("telefoneOrigem"),
    emailOrigem: getValue("emailOrigem"),
    comissao: getValue("comissaoArquiteto"),
    operador: getValue("operadorInterno"),
    enderecoObra: `Rua/Avenida: ${getValue("rua")}, Número: ${getValue("numero")}, Bairro: ${getValue("bairro")} - Complemento: ${getValue("complemento")} - Cidade: ${getValue("cidade")}/${getValue("estado")} - CEP: ${getValue("cep")}`,
    prazos: getValue("prazosArea"),
    condicao: document.getElementById("condicaoPagamento")?.selectedOptions[0]?.textContent.trim() || "-",
    condicoesGerais: getValue("condicoesGerais"),
    vendedor: document.getElementById("vendedorResponsavel")?.selectedOptions[0]?.textContent || "-"
  };

  // ✅ AQUI: PRAZOS COM QUEBRAS DE LINHA (igual condições gerais)
  dados.prazos = (dados.prazos && dados.prazos !== "-") ? multilineToBR(dados.prazos) : "-";

  // 2) Coleta múltiplos clientes/contatos
  const clientes = Array.from(document.querySelectorAll('#clientesWrapper .cliente-item'))
    .map(row => ({
      nomeCliente:  getTextOrValue(row.querySelector('.nomeContato')),
      cpfCnpj:      getTextOrValue(row.querySelector('.cpfCnpj')),
      codigo:       getTextOrValue(row.querySelector('.codigoCliente')),
      nomeContato:  getTextOrValue(row.querySelector('.nomeContato')),
      funcao:       getTextOrValue(row.querySelector('.funcaoCliente')),
      telefone:     getTextOrValue(row.querySelector('.telefoneCliente')),
    }))
    .filter(c => c.nomeCliente || c.nomeContato || c.telefone || c.cpfCnpj);

  const principal = clientes[0] || {};
  dados.nomeCliente      = principal.nomeCliente || "-";
  dados.cpfCnpj          = principal.cpfCnpj || "-";
  dados.telefoneCliente  = principal.telefone || "-";

  dados.contatos = clientes.map((c, idx) => ({
    cliente:  idx === 0 ? `${c.nomeCliente || "-"} (Responsável)` : (c.nomeCliente || "-"),
    cpfCnpj:  c.cpfCnpj || "-",
    contato:  c.nomeContato || "-",
    funcao:   c.funcao || "-",
    telefone: c.telefone || "-",
  }));

  // 3) Monta lista de grupos
  let gruposDados = [];
  document.querySelectorAll("table[id^='tabela-bloco-']").forEach(tabela => {
    const grupoId = tabela.id.replace("tabela-", "").trim();
    const inputAmbiente = document.querySelector(`input[data-id-grupo='${grupoId}'][placeholder='Ambiente']`);
    const nomeAmbiente = inputAmbiente?.value.trim() || "Sem Ambiente";
    const linhaProduto = tabela.querySelector("tbody tr");

    let resumoGrupo = document.getElementById(`resumo-${grupoId}`)?.value?.trim() || "";
    resumoGrupo = resumoGrupo.replace(/\n/g, "<br>");

    const totalGrupo = parseFloat(
      tabela.querySelector("tfoot td[colspan='6'] strong")?.textContent
        .replace(/[^\d,\.]/g, '')
        .replace(',', '.') || "0"
    );

    let colunas = linhaProduto?.querySelectorAll("td");
    let descricao = colunas?.[1]?.textContent.trim() || "-";
    let qtd = linhaProduto?.querySelector("input.quantidade")?.value || "1";

    const ocultar = !!(gruposOcultarProduto && gruposOcultarProduto[grupoId]);

    gruposDados.push({ grupoId, nomeAmbiente, totalGrupo, descricao, qtd, resumoGrupo, ocultar });
  });

  // 4) Agrupa por ambiente
  let ambientes = {};
  gruposDados.forEach(g => {
    if (!ambientes[g.nomeAmbiente]) ambientes[g.nomeAmbiente] = [];
    ambientes[g.nomeAmbiente].push(g);
  });

  let totalGeral = 0;
  let corpoHTML = "";
  let contadorGlobal = 1;

  Object.entries(ambientes).forEach(([nomeAmbiente, grupos]) => {
    const valorTotalAmbiente = grupos.reduce((soma, x) => soma + x.totalGrupo, 0);
    totalGeral += valorTotalAmbiente;

    const gruposVisiveis = grupos.filter(g => !g.ocultar);
    gruposVisiveis.forEach(g => {
      corpoHTML += `
        <div class="mt-4 border">
          <div class="fw-bold border p-2 bg-light text-center">
            AMBIENTE: ${nomeAmbiente.toUpperCase()} 
          </div>
          <table class="table table-sm table-bordered w-100">
            <thead class="table-light">
              <tr>
                <th style="width:40px;">#</th>
                <th>Descrição</th>
                <th style="width:120px;">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${contadorGlobal++}</td>
                <td>${g.descricao}</td>
                <td>${g.qtd}</td>
              </tr>
              ${g.resumoGrupo ? `<tr><td colspan="3"><em>${g.resumoGrupo}</em></td></tr>` : ""}
            </tbody>
          </table>
        </div>`;
    });

    corpoHTML += `
      <div class="border p-2 mt-2 text-end bg-light">
        <strong>Total do Ambiente ${nomeAmbiente.toUpperCase()}:</strong> 
        ${formatarReal(valorTotalAmbiente)}
      </div>
    `;
  });

  // 4.5) ✅ PARCELAS (depois dos produtos)
  const parcelas = Array.from(document.querySelectorAll('#listaParcelas .row'))
    .map((row, idx) => {
      const selTipo = row.querySelector('select.tipo-monetario');
      const tipo = selTipo?.selectedOptions?.[0]?.textContent?.trim()
                || selTipo?.value?.trim()
                || "-";

      const wrapCond = row.querySelector('.condicao-wrapper');
      const selCond = wrapCond?.querySelector('select.condicao-pagto');
      const inputCond = wrapCond?.querySelector('input, textarea');

      // ✅ pega texto e normaliza (vazio/"Selecione..." => "")
      let condicaoRaw = "";
      if (inputCond && getTextOrValue(inputCond)) {
        condicaoRaw = getTextOrValue(inputCond);
      } else {
        condicaoRaw = selCond?.selectedOptions?.[0]?.textContent?.trim()
                  || selCond?.value?.trim()
                  || "";
      }
      const condicao = normalizarCondicao(condicaoRaw);

      const valorRaw = (row.querySelector('input.valor-parcela')?.value || "").trim();
      let valorExib = valorRaw || "-";

      // se for número puro tipo "1000" mostra em BRL; se for "30%" mantém
      if (valorRaw && !valorRaw.includes('%')) {
        const num = parseBRL(valorRaw);
        valorExib = fmtBRL(num);
      }

      const vencISO = (row.querySelector('input.data-parcela')?.value || "").trim();
      const venc = vencISO ? formatarDataBR(vencISO) : "-";

      // ✅ ignora linha 100% vazia (condição vazia conta como vazia mesmo)
      const temAlgo = (tipo !== "-" || condicao !== "" || valorExib !== "-" || venc !== "-");
      if (!temAlgo) return null;

      return { idx: idx + 1, tipo, condicao, valorExib, venc };
    })
    .filter(Boolean);

  const totalParcelasTxt = document.getElementById('totalParcelas')?.textContent?.trim() || "";

  const parcelasHTML = (parcelas.length)
    ? `
      <div class="mt-4">
        <h6 class="text-center fw-bold">Parcelas</h6>
        <table class="table table-bordered table-sm w-100">
          <thead class="table-light">
            <tr>
              <th style="width:40px;">#</th>
              <th style="width:140px;">Tipo</th>
              <th>Condição</th>
              <th style="width:140px;">Valor</th>
              <th style="width:130px;">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${parcelas.map(p => `
              <tr>
                <td>${p.idx}</td>
                <td>${p.tipo}</td>
                <td>${p.condicao || ""}</td>
                <td>${p.valorExib}</td>
                <td>${p.venc}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

     
      </div>
    `
    : ``;

  // 5) Totais gerais
  const valorFinalComDescontoStr = document.getElementById("valorFinalTotal")?.textContent || "R$ 0,00";
  const valorFinalComDesconto = parseFloat(
    valorFinalComDescontoStr.replace(/[^\d,\.]/g, "").replace(",", ".")
  );

  const campoDesconto = document.getElementById("campoDescontoFinal")?.value?.trim();
  const temDescontoValido = campoDesconto && valorFinalComDesconto > 0 && valorFinalComDesconto < totalGeral;
  const descontoAplicado = temDescontoValido ? totalGeral - valorFinalComDesconto : 0;

  let totalizadoresHTML = temDescontoValido ? `
    <div class="border p-2 text-end mt-4 bg-light">
      <div><strong>Total Bruto:</strong> ${formatarReal(totalGeral)}</div>
      <div><strong>Desconto Aplicado:</strong> ${formatarReal(descontoAplicado)}</div>
      <div class="fw-bold fs-5 text-success"><strong>Total com Desconto:</strong> ${formatarReal(valorFinalComDesconto)}</div>
    </div>` : `
    <div class="border p-2 text-end mt-4 bg-light">
      <div class="fw-bold">Total Geral: ${formatarReal(totalGeral)}</div>
    </div>`;

  // 6) Tabela de contatos
  const tabelaContatosHTML = (dados.contatos && dados.contatos.length)
    ? `
      <h6 class="mt-3 text-center fw-bold">Clientes & Contatos</h6>
      <table class="table table-bordered table-sm w-100">
        <thead class="table-light">
          <tr>
            <th>Cliente</th>
            <th>Função</th>
            <th>Telefone</th>
          </tr>
        </thead>
        <tbody>
          ${dados.contatos.map(c => `
            <tr>
              <td>${c.cliente}</td>
              <td>${c.funcao}</td>
              <td>${c.telefone}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '';

  // 7) HTML completo
  const condicoesGeraisFormatada = multilineToBR(dados.condicoesGerais || "");

  const htmlCompleto = `
    <html>
      <head>
        <title>Orçamento ${dados.numero}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { padding: 40px; font-family: Arial, sans-serif; font-size: 13px; }
          em { color: #444; font-style: italic; }
        </style>
      </head>
      <body>
        <div style="margin-bottom:40px;">
          <table class="table table-bordered table-sm w-100">
            <tr>
              <td style="width:40%;text-align:center;vertical-align:middle;">
                <img src="../js/logo.jpg" style="max-height:65px;"><br>
                <br> (31) 98457-7573<br>
              </td>
              <td style="width:40%;">
                <table class="table table-sm w-100">
                  <tr><td><strong>Orçamento:</strong></td><td>${dados.numero}</td></tr>
                  <tr><td><strong>Data:</strong></td><td>${dados.data}</td></tr>
                  <tr><td colspan="2"><strong>Proposta válida por 7 dias úteis</strong></td></tr>
                </table>
              </td>
            </tr>
          </table>

          <table class="table table-bordered table-sm w-100 mt-2">
            <tr>
              <td><strong>Cliente (Responsável):</strong></td>
              <td>${(document.querySelector("input.razaoSocial")?.value || document.querySelector("input.razaoSocial")?.dataset?.valorOriginal || "-")}</td>
            </tr>
            <tr><td><strong>CPF/CNPJ:</strong></td><td>${dados.cpfCnpj}</td></tr>
            <tr><td><strong>Endereço da Obra:</strong></td><td>${dados.enderecoObra}</td></tr>
            <tr><td><strong>Vendedor:</strong></td><td>${dados.vendedor}</td></tr>
          </table>

          ${tabelaContatosHTML}
        </div>

        ${corpoHTML}

        <!-- ✅ PARCELAS AQUI (depois dos produtos) -->
        ${parcelasHTML}

        ${totalizadoresHTML}

        <div class="border p-2 mt-3">
          <strong>Prazo:</strong><br>${dados.prazos}<br><br>
          <strong>Condições de Pagamento:</strong><br>${dados.condicao}<br><br>
          <strong>Condições Gerais:</strong><br>${condicoesGeraisFormatada}
        </div>

        <br><br>
        <center>
          Assinatura Contratante:
          <br><br>
          _______________________________________________________________
        </center>

        <br><br>
        <center>
          Assinatura Contratada:
          <br><br>
          _______________________________________________________________
        </center>

      </body>
    </html>`;

  // 8) Impressão
  async function abrirJanelaParaImpressao(htmlCompleto) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(htmlCompleto);
    printWindow.document.close();
    printWindow.onload = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      printWindow.focus();
      printWindow.print();
    };
  }

  abrirJanelaParaImpressao(htmlCompleto);
}


function gerarOrdemDeServicoParaImpressao(gruposOcultarProduto) {
  const getValue = (id) => document.getElementById(id)?.value?.trim() || "-";

  const getTextOrValue = (el) => {
    if (!el) return "";
    const v = (typeof el.value === "string" ? el.value : "").trim();
    if (v) return v;
    const t = (typeof el.textContent === "string" ? el.textContent : "").trim();
    if (t) return t;
    return "";
  };

  const multilineToBR = (txt) => {
    const t = String(txt || "").trim();
    if (!t) return "-";
    return t.replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
  };

  const formatarDataBR = (iso) => {
    if (!iso) return "-";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    }
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString("pt-BR");
  };

  const padVisual = (txt, minLen = 18) => {
    const t = String(txt || "").trim();
    if (t.length >= minLen) return t;
    const faltam = Math.max(0, minLen - t.length);
    return (t || "-") + "&nbsp;".repeat(faltam);
  };

  // ================== 1) DADOS CABEÇALHO (DINÂMICO) ==================
  const numeroPedido = getValue("numeroOrcamento"); // no seu layout atual é o "pedido"
  const dataOrc = getValue("dataOrcamento");
  const data = dataOrc !== "-" ? formatarDataBR(dataOrc) : "-";

  // ✅ se você tiver um campo real de orçamento separado, use aqui
  const numeroOrcamento = getValue("numeroOrcamento2") !== "-" ? getValue("numeroOrcamento2") : numeroPedido;

  const vendedorEl = document.getElementById("vendedorResponsavel");
  const vendedor =
    vendedorEl?.selectedOptions?.[0]?.textContent?.trim() ||
    getTextOrValue(vendedorEl) ||
    "-";

  const operador = getValue("operadorInterno");
  const origem = getValue("origemCliente");

  const nomeClienteResponsavel =
    (document.querySelector("input.razaoSocial")?.value || "")?.trim() ||
    (document.querySelector("input.razaoSocial")?.dataset?.valorOriginal || "")?.trim() ||
    "-";

  const enderecoObra = `Rua/Avenida: ${getValue("rua")}, Número: ${getValue("numero")}, Bairro: ${getValue("bairro")} - Complemento: ${getValue("complemento")} - Cidade: ${getValue("cidade")}/${getValue("estado")} - CEP: ${getValue("cep")}`;

  // ================== 2) CLIENTES/CONTATOS ==================
  const clientes = Array.from(document.querySelectorAll("#clientesWrapper .cliente-item"))
    .map((row) => ({
      nomeCliente:
        getTextOrValue(row.querySelector(".nomeContato")) ||
        getTextOrValue(row.querySelector(".razaoSocial")),
      cpfCnpj: getTextOrValue(row.querySelector(".cpfCnpj")),
      nomeContato: getTextOrValue(row.querySelector(".nomeContato")),
      funcao: getTextOrValue(row.querySelector(".funcaoCliente")),
      telefone: getTextOrValue(row.querySelector(".telefoneCliente")),
      email: getTextOrValue(row.querySelector(".emailCliente")),
    }))
    .filter((c) => c.nomeCliente || c.nomeContato || c.telefone || c.cpfCnpj || c.email || c.funcao);

  const principal = clientes[0] || {};
  const cpfCnpj = principal.cpfCnpj || "-";

  const contatosHTML = clientes.length
    ? clientes
        .map((c, idx) => {
          const label = idx === 0 ? "Contato (Responsável)" : `Contato ${idx + 1}`;
          const nome = padVisual(c.nomeContato || c.nomeCliente || "-", 22);
          const funcao = padVisual(c.funcao || "-", 18);
          const tel = padVisual(c.telefone || "-", 16);
          const email = padVisual(c.email || "-", 22);

          return `
            <tr>
              <td class="k">${label}:</td>
              <td class="v">${nome}</td>
              <td class="k">Função:</td>
              <td class="v">${funcao}</td>
            </tr>
            <tr>
              <td class="k">Telefone:</td>
              <td class="v">${tel}</td>
              <td class="k">E-mail:</td>
              <td class="v">${email}</td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td class="k">Contato:</td><td class="v">${padVisual("-", 22)}</td>
        <td class="k">Função:</td><td class="v">${padVisual("-", 18)}</td>
      </tr>
      <tr>
        <td class="k">Telefone:</td><td class="v">${padVisual("-", 16)}</td>
        <td class="k">E-mail:</td><td class="v">${padVisual("-", 22)}</td>
      </tr>
    `;

  // ================== 3) PRAZOS ==================
  const prazosRaw = getValue("prazosArea");
  const prazosHTML = prazosRaw !== "-" ? multilineToBR(prazosRaw) : "-";

  // ================== 4) COLETA ITENS (GRUPOS) ==================
  const gruposDados = [];

  document.querySelectorAll("table[id^='tabela-bloco-']").forEach((tabela) => {
    const grupoId = tabela.id.replace("tabela-", "").trim();

    const ocultar = !!(gruposOcultarProduto && gruposOcultarProduto[grupoId]);
    if (ocultar) return;

    const inputAmbiente = document.querySelector(
      `input[data-id-grupo='${grupoId}'][placeholder='Ambiente']`
    );
    const nomeAmbiente = inputAmbiente?.value?.trim() || "Sem Ambiente";

    let resumoGrupo = document.getElementById(`resumo-${grupoId}`)?.value?.trim() || "";
    resumoGrupo = resumoGrupo ? resumoGrupo.replace(/\r\n/g, "\n").replace(/\n/g, "<br>") : "";

    const linhas = Array.from(tabela.querySelectorAll("tbody tr"))
      .filter((tr) => {
        if (tr.querySelector("td[colspan]")) return false;
        if (tr.classList.contains("extra-summary-row")) return false;
        const tds = tr.querySelectorAll("td");
        return tds && tds.length >= 2;
      })
      .map((tr) => {
        const tds = Array.from(tr.querySelectorAll("td"));

        let descricao = (tds[1]?.textContent || "").trim();
        if (!descricao) {
          const candidato = tds
            .map((td) => (td.textContent || "").trim())
            .sort((a, b) => b.length - a.length)[0];
          descricao = candidato || "-";
        }

        const qtdInput =
          tr.querySelector("input.quantidade") ||
          tr.querySelector("input.quantidade_sugerida") ||
          tr.querySelector("input[name='quantidade']") ||
          tr.querySelector("input[data-campo='quantidade']");

        let qtd = (qtdInput?.value || "").trim();
        if (!qtd) qtd = "1";

        return { descricao, qtd };
      })
      .filter((x) => x.descricao && x.descricao !== "-");

    gruposDados.push({
      grupoId,
      nomeAmbiente,
      resumoGrupo,
      itens: linhas,
    });
  });

  const qtdLinhas = Math.max(1, gruposDados.length);

  // ================== 5) ITENS P1 (COM QTD) ==================
  let contadorGrupo = 1;
  const itensHTML_ComQtd = gruposDados
    .map((g) => {
      let contadorInsumo = 1;

      const linhasHTML = g.itens?.length
        ? g.itens.map((it) => `
            <tr>
              <td class="num">${contadorInsumo++}</td>
              <td>${it.descricao}</td>
              <td class="qtd">${it.qtd}</td>
            </tr>
          `).join("")
        : `
          <tr>
            <td class="num">1</td>
            <td>-</td>
            <td class="qtd">-</td>
          </tr>
        `;

      const resumoHTML = g.resumoGrupo
        ? `<div class="obs"><strong>Observações:</strong><br>${g.resumoGrupo}</div>`
        : "";

      return `
        <div class="item">
          <div class="item-head">
            <div class="item-title">ITEM ${contadorGrupo++}</div>
            <div class="item-sub">AMBIENTE: ${String(g.nomeAmbiente || "").toUpperCase()}</div>
          </div>

          <table class="tbl">
            <thead>
              <tr>
                <th style="width:44px;">#</th>
                <th>Descrição</th>
                <th style="width:110px;">Quantidade</th>
              </tr>
            </thead>
            <tbody>${linhasHTML}</tbody>
          </table>

          ${resumoHTML}
        </div>
      `;
    })
    .join("");

  // ================== 6) ITENS P3 (SEM QTD) ==================
  let contadorGrupoP3 = 1;
  const itensHTML_SemQtd = gruposDados
    .map((g) => {
      let c = 1;
      const linhasHTML = g.itens?.length
        ? g.itens.map((it) => `
            <tr>
              <td class="num">${c++}</td>
              <td>${it.descricao}</td>
            </tr>
          `).join("")
        : `
            <tr>
              <td class="num">1</td>
              <td>-</td>
            </tr>
          `;

      const obs = g.resumoGrupo
        ? `<div class="obs"><strong>Observações:</strong><br>${g.resumoGrupo}</div>`
        : "";

      return `
        <div class="item">
          <div class="item-head">
            <div class="item-title">ITEM ${contadorGrupoP3++}</div>
            <div class="item-sub">AMBIENTE: ${String(g.nomeAmbiente || "").toUpperCase()}</div>
          </div>

          <table class="tbl">
            <thead>
              <tr>
                <th style="width:44px;">#</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>${linhasHTML}</tbody>
          </table>

          ${obs}
        </div>
      `;
    })
    .join("");

  // ================== CABEÇALHOS ==================

  const cabecalhoCompletoSemPrazosHTML = (titulo) => `
  <div class="topbar">
    <div class="logoBox"><img src="../js/logo.jpg" alt="Logo"></div>
    <div class="opBox">
      <div class="opTitle">${titulo}</div>
      <div class="opRow">
    <div>
          Nº do Pedido
          <div class="numeroPedidoGigante"><span class="muted">${numeroPedido}</span></div>
        </div>
        <div class="metaRight">
          <div><strong>Nº do orçamento:</strong> <span class="muted">${numeroOrcamento}</span></div>
          <div><strong>Data:</strong> <span class="muted">${data}</span></div>
        </div>
      </div>
    </div>
  </div>

  <table class="tblInfo">
    <tr>
      <td class="k">Nome / Razão social:</td>
      <td class="v">${padVisual(nomeClienteResponsavel, 30)}</td>
      <td class="k">CPF / CNPJ:</td>
      <td class="vSmall">${padVisual(cpfCnpj, 18)}</td>
      <td class="k">Origem:</td>
      <td class="vSmall">${padVisual(origem, 18)}</td>
    </tr>
    <tr>
      <td class="k">Endereço da obra:</td>
      <td colspan="5">${enderecoObra}</td>
    </tr>
    ${contatosHTML}
  </table>

  <div class="line2col">
    <div class="miniBox">Operador: <span class="muted">${padVisual(operador, 18)}</span></div>
    <div class="miniBox">Vendedor: <span class="muted">${padVisual(vendedor, 18)}</span></div>
  </div>
`;

  const cabecalhoCompletoHTML = (titulo) => `
    <div class="topbar">
      <div class="logoBox"><img src="../js/logo.jpg" alt="Logo"></div>
      <div class="opBox">
        <div class="opTitle">${titulo}</div>
        <div class="opRow">
      <div>
          Nº do Pedido
          <div class="numeroPedidoGigante"><span class="muted">${numeroPedido}</span></div>
        </div>
          <div class="metaRight">
            <div><strong>Nº do orçamento:</strong> <span class="muted">${numeroOrcamento}</span></div>
            <div><strong>Data:</strong> <span class="muted">${data}</span></div>
          </div>
        </div>
      </div>
    </div>

    <table class="tblInfo">
      <tr>
        <td class="k">Nome / Razão social:</td>
        <td class="v">${padVisual(nomeClienteResponsavel, 30)}</td>
        <td class="k">CPF / CNPJ:</td>
        <td class="vSmall">${padVisual(cpfCnpj, 18)}</td>
        <td class="k">Origem:</td>
        <td class="vSmall">${padVisual(origem, 18)}</td>
      </tr>
      <tr>
        <td class="k">Endereço da obra:</td>
        <td colspan="5">${enderecoObra}</td>
      </tr>
      ${contatosHTML}
    </table>

    <div class="line2col">
      <div class="miniBox">Operador: <span class="muted">${padVisual(operador, 18)}</span></div>
      <div class="miniBox">Vendedor: <span class="muted">${padVisual(vendedor, 18)}</span></div>
    </div>

    <div class="prazos">
      <div class="t">Prazo por Área:</div>
      <div class="c">${prazosHTML}</div>
    </div>
  `;

  const cabecalhoBasicoHTML = (titulo) => `
    <div class="topbar">
      <div class="logoBox"><img src="../js/logo.jpg" alt="Logo"></div>
      <div class="opBox">
        <div class="opTitle">${titulo}</div>
        <div class="opRow">
          <div>
          Nº do Pedido
          <div class="numeroPedidoGigante"><span class="muted">${numeroPedido}</span></div>
        </div>
          <div class="metaRight">
            <div><strong>Data:</strong> <span class="muted">${data}</span></div>
            <div><strong>Nº do orçamento:</strong> <span class="muted">${numeroOrcamento}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ================== PÁGINA 2: FAT DIRETO + TERCEIROS ==================
  const faturamentoDiretoHTML = `
    <div class="fullBox">
      <div class="gridTitle">Faturamento Direto</div>
      <table class="bigTbl">
        <thead>
          <tr>
            <th style="width:44px;">Item</th>
            <th style="width:110px;">Data Compra</th>
            <th>Fornecedor</th>
            <th style="width:110px;">Previsto</th>
            <th style="width:110px;">Tipo</th>
            <th style="width:90px;">Quant.</th>
            <th style="width:120px;">Na Empresa</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 6 }).map((_, i) => `
            <tr>
              <td class="cItem">${i + 1}</td>
              <td class="cData"></td>
              <td></td>
              <td class="cData"></td>
              <td></td>
              <td class="cQtd"></td>
              <td></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  const servicosTerceirosHTML = `
    <div class="fullBox">
      <div class="gridTitle">Serviço(s) de Terceiros</div>
      <table class="bigTbl">
        <thead>
          <tr>
            <th style="width:44px;">Item</th>
            <th>Fornecedor</th>
            <th>Nome do Contato</th>
            <th style="width:120px;">Telefone do Contato</th>
            <th style="width:100px;">Data Saída</th>
            <th style="width:100px;">Previsão</th>
            <th style="width:110px;">Data Retorno</th>
            <th style="width:140px;">Retorno Conferido por</th>
            <th style="width:120px;">Assinatura Interno</th>
            <th style="width:120px;">Assinatura Terceiro</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: Math.max(3, qtdLinhas) }).map((_, i) => `
            <tr>
              <td class="cItem">${i + 1}</td>
              <td></td>
              <td></td>
              <td></td>
              <td class="cData"></td>
              <td class="cData"></td>
              <td class="cData"></td>
              <td class="cResp">&nbsp;</td>
              <td></td>
              <td></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  const pagina2HTML = `
    <!-- ======================= PAGINA 2 ======================= -->
    <div class="page-break"></div>
    ${cabecalhoBasicoHTML("ORDEM DE SERVIÇO / PRODUÇÃO")}
    ${faturamentoDiretoHTML}
    ${servicosTerceirosHTML}
  `;

  // ================== PÁGINA 4: PROCESSOS + INSTALAÇÃO ==================
  const linhasProcessoHTML = (titulo) => {
    const corpo = Array.from({ length: qtdLinhas }).map((_, i) => `
      <tr>
        <td class="cItem">${i + 1}</td>
        <td class="cData"></td>
        <td class="cData"></td>
        <td class="cResp">&nbsp;</td>
      </tr>
    `).join("");

    return `
      <div class="gridBox">
        <div class="gridTitle">${titulo}</div>
        <table class="gridTbl">
          <thead>
            <tr>
              <th style="width:44px;">Item</th>
              <th style="width:92px;">Inicio</th>
              <th style="width:92px;">Final</th>
              <th>Responsáveis</th>
            </tr>
          </thead>
          <tbody>${corpo}</tbody>
        </table>
      </div>
    `;
  };

  const tabelaInstalacaoHTML = (titulo, startIndex = 1) => {
    const corpo = Array.from({ length: qtdLinhas }).map((_, i) => `
      <tr>
        <td class="cItem">${startIndex + i}</td>
        <td class="cData"></td>
        <td class="cData"></td>
        <td class="cResp">&nbsp;</td>
      </tr>
    `).join("");

    return `
      <div class="instCol">
        <div class="instSub">${titulo}</div>
        <table class="gridTbl">
          <thead>
            <tr>
              <th style="width:44px;">Item</th>
              <th style="width:92px;">Inicio</th>
              <th style="width:92px;">Final</th>
              <th>Responsáveis</th>
            </tr>
          </thead>
          <tbody>${corpo}</tbody>
        </table>
      </div>
    `;
  };

  const pagina4ProcessosInstalacaoHTML = `
    <!-- ======================= PAGINA 4 (PROCESSOS + INSTALAÇÃO) ======================= -->
    <div class="page-break"></div>
    ${cabecalhoBasicoHTML("RELATÓRIO DE ENTREGA / INSTALAÇÃO")}

    <div class="procGrid">
      <div class="procRow">
        ${linhasProcessoHTML("Desenho")}
        ${linhasProcessoHTML("Corte")}
      </div>
      <div class="procRow">
        ${linhasProcessoHTML("Pré-Solda")}
        ${linhasProcessoHTML("Acabamento")}
      </div>
      <div class="procRow">
        ${linhasProcessoHTML("Montagem")}
        ${linhasProcessoHTML("Finalização do Acabamento")}
      </div>
    </div>

    <div class="linhaInstalacao">Instalação</div>

    <div class="instGrid">
      ${tabelaInstalacaoHTML("Estrutura", 1)}
      ${tabelaInstalacaoHTML("Vidro", Math.max(1, qtdLinhas))} 
    </div>
  `;

  // ================== PÁGINA 5: HISTÓRICO (DATA 15% / HIST 85%) ==================
const pagina5HistoricoHTML = `
  <div class="page-break"></div>

  <div class="page5">
    ${cabecalhoBasicoHTML("RELATÓRIO DE ENTREGA / INSTALAÇÃO")}

    <div class="fullBox relFull">
      <table class="relTbl">
        <thead>
          <tr>
            <th class="relData">Data</th>
            <th class="relHist">Histórico de Instalação</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 8 }).map(() => `
            <tr>
              <td class="relDataCell"></td>
              <td class="relHistCell"></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>
`;



 const etapasDoProcessoHTML = `
  <div class="etapas-box vv-etapas">
    <div class="etapas-title">Etapas do Processo</div>

    <table class="etapas-grid">
      <tr>
        <!-- PEDIDO -->
        <td class="etapas-col">
          <div class="etapas-col-title">Pedido</div>
          <table class="etapas-inner">
            <tr>
              <td class="etapas-cell">Enviado</td>
              <td class="etapas-cell">Assinado</td>
            </tr>

            <tr>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
          </table>
        </td>

        <!-- PROJETO -->
        <td class="etapas-col">
          <div class="etapas-col-title">Projeto</div>
          <table class="etapas-inner">
            <tr>
              <td class="etapas-cell w-item">Item</td>
              <td class="etapas-cell">Enviado</td>
              <td class="etapas-cell">Assinado</td>
            </tr>

            <tr>
              <td class="etapas-cell w-item center">1</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell w-item center">2</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell w-item center">3</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
          </table>
        </td>

        <!-- OBRA / MEDIÇÃO -->
        <td class="etapas-col">
          <div class="etapas-col-title">Obra / Medição</div>
          <table class="etapas-inner">
            <tr>
              <td class="etapas-cell w-item">Item</td>
              <td class="etapas-cell">Liberação Obra</td>
              <td class="etapas-cell">Medição Realizada</td>
              <td class="etapas-cell">Medidor</td>
            </tr>

            <tr>
              <td class="etapas-cell w-item center">1</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell w-item center">2</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
            <tr>
              <td class="etapas-cell w-item center">3</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
              <td class="etapas-cell blank">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="etapas-obs"><strong>Observações:</strong></div>
    <div class="etapas-obs-area">&nbsp;</div>
  </div>
`;


  // ================== PÁGINA 1 e 3 (CONTEÚDO) ==================
 const pagina1HTML = `
  <!-- ======================= PAGINA 1 ======================= -->
  <div class="vv-page">
    <div>
      ${cabecalhoCompletoHTML("ORDEM DE SERVIÇO / PRODUÇÃO")}
      ${itensHTML_ComQtd || `<div class="item" style="padding:10px;"><strong>Nenhum item encontrado para impressão.</strong></div>`}
    </div>

    <!-- 🔻 bloco da foto no final da página 1 -->
    <div class="vv-page-footer">
      ${etapasDoProcessoHTML}
    </div>
  </div>

  <!-- força que a próxima página comece depois da página 1 -->
  <div class="vv-break-after"></div>
`;


// ================== PÁGINA 3 (RELATÓRIO) — SEM ITENS / SEM INSUMOS ==================
// ================== PÁGINA 3 (RELATÓRIO) — ITEM + AMBIENTE + OBSERVAÇÕES (SEM INSUMOS) ==================
const observacoesPorItemHTML = (() => {
  let n = 1;

  return (gruposDados || []).map((g) => {
    const ambienteUpper = String(g.nomeAmbiente || "Sem Ambiente").toUpperCase();
    const obs = String(g.resumoGrupo || "").trim();

    return `
      <div class="item item-obs-only">
        <div class="item-head item-obs-head">
          <div class="item-title">ITEM ${n++}</div>
          <div class="item-sub">AMBIENTE: ${ambienteUpper}</div>
        </div>

        <div class="obs obs-only">
          <div class="obs-label">Observações:</div>
          <div class="obs-text">${obs || "&nbsp;"}</div>
        </div>
      </div>
    `;
  }).join("") || `
    <div class="item item-obs-only">
      <div class="item-head item-obs-head">
        <div class="item-title">ITEM 1</div>
        <div class="item-sub">AMBIENTE: -</div>
      </div>

      <div class="obs obs-only">
        <div class="obs-label">Observações:</div>
        <div class="obs-text">&nbsp;</div>
      </div>
    </div>
  `;
})();

const pagina3HTML = `
  <!-- ======================= PAGINA 3 ======================= -->
  <div class="page-break"></div>

  ${cabecalhoCompletoSemPrazosHTML("RELATÓRIO DE ENTREGA / INSTALAÇÃO")}


  ${observacoesPorItemHTML}
`;


  // ================== HTML FINAL ==================
  const htmlCompleto = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>OS / Relatório - ${numeroPedido}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; }
body { padding: 40px; font-family: Arial, sans-serif; font-size: 13px; }
  em { color: #444; font-style: italic; }

  /* ======= PRIMEIRA PÁGINA (rodapé fixo no fim da página 1) ======= */
  .vv-page {
    min-height: 100vh;           /* ocupa a altura de 1 página */
    display: flex;
    flex-direction: column;
  }
  .vv-page-footer {
    margin-top: auto;            /* empurra pro final da página */
  }
  .vv-break-after {
    page-break-after: always;
    break-after: page;
  }

  /* ======= ETAPAS DO PROCESSO (igual a imagem) ======= */
  .etapas-box {
    border: 2px solid #000;
    padding: 0;
  }
  .etapas-title {
    text-align: center;
    font-weight: 700;
    padding: 6px 0;
    border-bottom: 2px solid #000;
  }
  .etapas-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
  }
  .etapas-table th,
  .etapas-table td {
    border: 1px solid #000;
    padding: 6px 6px;
    vertical-align: middle;
  }
  .etapas-table th {
    text-align: center;
    font-weight: 700;
  }
  .etapas-sub th {
    font-weight: 600;
  }
  .obs-row {
    border-top: 1px solid #000;
    padding: 6px 8px;
    font-size: 12px;
  }

  @media print {
    body { padding: 25px; }
  }
        .print-scale {
          transform: scale(0.8);
          transform-origin: top left;
          width: 125%;
        }

        .wrap {
          border: 2px solid #111;
          padding: 10px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #111;
        }

        .page-break { page-break-before: always; }

        /* ====== HEADER ====== */
        .topbar { display: flex; align-items: stretch; gap: 10px; margin-bottom: 10px; }
        .logoBox {
          flex: 1;
          border: 2px solid #111;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 64px;
        }
        .logoBox img { max-height: 52px; }

        .opBox { width: 520px; border: 2px solid #111; padding: 8px 10px; }
        .opTitle { font-weight: 900; font-size: 14px; text-align: center; margin-bottom: 6px; }

        .opRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-weight: 700;
          align-items: flex-start;
        }
        .metaRight { text-align: right; line-height: 1.25; }

      .numeroPedidoGigante {
  font-size: 20px;
  font-weight: 900; /* ✅ negrito */
  margin: 4px 0 0;
  line-height: 1;
}
.numeroPedidoGigante span{
  font-weight: 900; /* garante no texto interno */
}

        .muted { color: #333; font-weight: 400; }

        /* ====== INFO TABLE ====== */
        .tblInfo { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .tblInfo td { border: 1px solid #111; padding: 6px 8px; vertical-align: top; }
        .k { width: 160px; font-weight: 700; white-space: nowrap; }
        .v { min-width: 220px; }
        .vSmall { min-width: 160px; }

        .line2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; }
        .miniBox { border: 1px solid #111; padding: 8px; font-weight: 700; }

        .prazos { border: 1px solid #111; padding: 8px; margin-top: 8px; }
        .prazos .t { font-weight: 800; margin-bottom: 6px; }
        .prazos .c { font-weight: 400; line-height: 1.35; }

        /* ====== ITENS ====== */
        .item { border: 2px solid #111; margin-top: 12px; page-break-inside: avoid; }
        .item-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #111;
          padding: 8px 10px;
          font-weight: 900;
        }
        .item-title { font-size: 14px; }
        .item-sub { font-size: 12px; }

        .tbl { width: 100%; border-collapse: collapse; }
        .tbl th, .tbl td { border: 1px solid #111; padding: 6px 8px; }
        .tbl thead th { background: #f2f2f2; font-weight: 900; }
        .num { text-align: center; width: 44px; }
        .qtd { text-align: right; width: 110px; }

        .obs {
          border-top: 1px solid #111;
          padding: 8px 10px;
          font-style: italic;
          color: #333;
          line-height: 1.35;
        }

        /* ====== BIG TABLES ====== */
        .fullBox { border: 1px solid #111; margin-top: 10px; }
        .bigTbl { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        .bigTbl th, .bigTbl td { border: 1px solid #111; padding: 10px 6px; line-height: 1.6; }
        .bigTbl thead th { background: #fafafa; font-weight: 900; }

        .cItem { text-align: center; }
        .cData { text-align: center; white-space: nowrap; }
        .cQtd { text-align: right; }
        .cResp { color: #111; }

        /* ====== PROCESSOS (2 colunas, 3 linhas) ====== */
        .procGrid { margin-top: 10px; }
        .procRow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .gridBox { border: 1px solid #111; }
        .gridTitle {
          font-weight: 900;
          text-align: center;
          padding: 6px;
          border-bottom: 1px solid #111;
          background: #f2f2f2;
        }
        .gridTbl { width: 100%; border-collapse: collapse; font-size: 11px; }
        .gridTbl th, .gridTbl td { border: 1px solid #111; padding: 10px 6px; }
        .gridTbl thead th { background: #fafafa; font-weight: 900; }

        /* ====== LINHA INSTALAÇÃO (ponta a ponta) ====== */
        .linhaInstalacao{
          margin: 10px 0 6px;
          border: 2px solid #111;
          background: #f2f2f2;
          font-weight: 900;
          text-align: center;
          letter-spacing: 1px;
          padding: 10px 0;
        }

        /* ====== INSTALAÇÃO (2 colunas) ====== */
        .instGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .instCol { border: 1px solid #111; }
        .instSub {
          font-weight: 900;
          text-align: center;
          padding: 6px;
          border-bottom: 1px solid #111;
          background: #f2f2f2;
        }

        /* ====== HISTÓRICO (Data 15% / Histórico 85%) ====== */
        .relFull { margin-top: 10px; }
        .relTbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .relTbl th, .relTbl td { border: 2px solid #111; padding: 10px; vertical-align: top; }
        .relTbl thead th { background: #f2f2f2; font-weight: 900; }
        .relData { width: 15%; }
        .relHist { width: 85%; }
        .relTbl tbody tr { height: 92px; }

        @media print { .no-print { display: none !important; } }

        /* ===== Página 3: bloco como na imagem (sem tabela) ===== */
.item-obs-only { page-break-inside: avoid; }

.item-obs-head{
  border-bottom: 2px solid #111;
  padding: 8px 10px;
}

.item-obs-head .item-title{ font-size: 13px; font-weight: 900; }
.item-obs-head .item-sub{ font-size: 13px; font-weight: 900; }

.obs-only{
  border-top: 0;
  padding: 10px;
  font-style: normal;
  color: #111;
}

.obs-label{
  font-weight: 700;
  margin-bottom: 6px;
}

.obs-text{
  line-height: 1.35;
  min-height: 70px;
}

/* ======= PRIMEIRA PÁGINA (rodapé no final) ======= */
.vv-page{
  min-height: 100vh;
  display:flex;
  flex-direction:column;
}
.vv-page-footer{ margin-top:auto; }
.vv-break-after{ page-break-after: always; break-after: page; }

/* ======= ETAPAS DO PROCESSO (igual a imagem) ======= */
.vv-etapas{ margin-top: 10px; }

.etapas-box{
  border: 2px solid #000;
  padding: 0;
}

.etapas-title{
  text-align:center;
  font-weight:700;
  padding: 6px 0;
  border-bottom: 2px solid #000;
}

.etapas-grid{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
}

.etapas-col{
  vertical-align: top;
  border-right: 1px solid #000;
  padding: 0;
}
.etapas-col:last-child{ border-right:0; }

.etapas-col-title{
  text-align:center;
  font-weight:700;
  padding: 6px 0;
  border-bottom: 1px solid #000;
}

.etapas-inner{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  font-size:12px;
}

.etapas-cell{
  border: 1px solid #000;
  padding: 6px 6px;
  text-align:center;
  vertical-align:middle;
}

.etapas-cell.blank{ height: 26px; }
.etapas-cell.w-item{ width: 52px; }
.etapas-cell.center{ text-align:center; }

.etapas-obs{
  border-top: 1px solid #000;
  padding: 6px 8px;
  font-size:12px;
}
.etapas-obs-area{
  height: 38px;
  border-top: 1px solid #000;
}
/* =========================
   NÃO QUEBRAR TABELAS NA IMPRESSÃO
   ========================= */
@media print {

  /* evita quebra dentro de qualquer tabela e seus blocos */
  table, thead, tbody, tfoot, tr, td, th {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* seus blocos principais (evita quebrar o item e as tabelas grandes) */
  .item,
  .fullBox,
  .gridBox,
  .instCol,
  .relFull,
  .vv-etapas,
  .prazos,
  .tblInfo,
  .topbar,
  .line2col {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
/* =======================
   PÁGINA 5 MAIS "ALTA"
   (na prática: linhas bem maiores + mais área útil)
   ======================= */
.page5 .relFull{
  margin-top: 10px;
}

.page5 .relTbl tbody tr{
  height: 180px; /* antes era 92px -> aqui você "dobra" */
}

.page5 .relTbl td{
  padding: 14px; /* aumenta espaço pra escrita */
}

/* opcional: dá ainda mais área útil na folha (menos "respiro") */
@media print{
  body{ padding: 18px !important; } /* antes 25/40 -> mais área útil */
}
/* ====== Página 5 preenchendo a folha (sem ficar gigante) ====== */
.page5{
  height: 277mm;              /* altura útil aproximada do A4 com margem 10mm */
  display: flex;
  flex-direction: column;
}

.page5 .relFull{
  flex: 1;                    /* ocupa o espaço restante abaixo do cabeçalho */
  display: flex;
}

.page5 .relTbl{
  width: 100%;
  height: 100%;
  table-layout: fixed;
}

.page5 .relTbl tbody tr{
  height: calc(100% / 8);     /* 8 linhas preenchendo igualmente */
}

      </style>
    </head>

    <body>
      <div class="print-scale">
        <div class="wrap">

          ${pagina1HTML}

          ${pagina2HTML}

        
          ${pagina3HTML}

          ${pagina4ProcessosInstalacaoHTML}

          ${pagina5HistoricoHTML}

        </div>
      </div>

      <script>
        window.onload = function () {
          setTimeout(function () {
            window.focus();
            window.print();
          }, 250);
        };
      </script>
    </body>
  </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(htmlCompleto);
  printWindow.document.close();
}
