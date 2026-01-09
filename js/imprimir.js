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
      ${totalParcelasTxt ? `<div class="text-end ocultar-total-parcelas"><strong>Total das parcelas:</strong> ${totalParcelasTxt}</div>` : ``}

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



