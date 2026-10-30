// 📦 carregarProdutosModelo.js






const loadingOverlay = document.createElement("div");
loadingOverlay.id = "loadingOverlay";
loadingOverlay.style.position = "fixed";
loadingOverlay.style.top = 0;
loadingOverlay.style.left = 0;
loadingOverlay.style.width = "100%";
loadingOverlay.style.height = "100%";
loadingOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
loadingOverlay.style.zIndex = 9999;
loadingOverlay.style.display = "flex";
loadingOverlay.style.justifyContent = "center";
loadingOverlay.style.alignItems = "center";
loadingOverlay.innerHTML = `
  <div class="text-center">
    <div class="spinner-border text-primary mb-3" role="status"></div>
    <p class="text-primary fw-semibold">Carregando proposta modelo...</p>
  </div>`;
document.body.appendChild(loadingOverlay);

let grupos = [];
carregarPropostaModelo();

async function carregarPropostaModelo() {
  //68746e305b9691a7ed3b3f97
  const id = "68746e305b9691a7ed3b3f97"; // ID fixo da proposta
  const url = `https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${id}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao buscar proposta por ID");

    const proposta = await res.json();
    console.log(proposta)
    console.log("proposta")
    if (!proposta?.grupos) {
      console.warn("❌ Proposta com ID não encontrada ou sem grupos.");
      return;
    }

    grupos = proposta.grupos;
    requestIdleCallback(() => renderLista());
  } catch (err) {
    console.error("❌ Erro ao carregar proposta por ID:", err);
  } finally {
    loadingOverlay.remove();
  }
}

function formatarNome(nome) {
  if (!nome || typeof nome !== "string") return "";
  return nome
    .toLowerCase()
    .split(" ")
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}


function renderLista(filtro = "") {

  const searchInput = document.getElementById("buscaProduto");
  const grupoList = document.getElementById("sugestoesProdutos");
  grupoList.innerHTML = "";
  const nomesUnicos = new Set();

  grupos
    .filter(grupo => grupo.nome?.toLowerCase().includes(filtro.toLowerCase()))
    .forEach(grupo => {
      if (!nomesUnicos.has(grupo.nome)) {
        nomesUnicos.add(grupo.nome);

        const li = document.createElement("li");
        const nomeFormatado = formatarNome(grupo.nome);
        li.textContent = nomeFormatado;
        li.className = "list-group-item list-group-item-action";
        li.style.cursor = "pointer";

        li.addEventListener("click", () => {
          const grupoSelecionado = grupos.find(g => g.nome === grupo.nome);
          if (!grupoSelecionado) return;

          searchInput.value = "";
          grupoList.style.display = "none";

          criarBlocoDeProposta(nomeFormatado);

          setTimeout(() => {
            const ultimoBloco = document.querySelector("#blocosProdutosContainer .main-container:last-child");
            if (!ultimoBloco) return;

            const parametros = grupoSelecionado.parametros || {};
            console.log("os paramentros",grupoSelecionado.itens[0].formula_custo)
            const inputs = ultimoBloco.querySelectorAll(`input[name]`);
            inputs.forEach(input => {
              const param = input.name;
              if (parametros[param] !== undefined) {
                input.value = parametros[param];
              }
            });

            const tabela = ultimoBloco.querySelector(`table tbody`);
            const totalTd = ultimoBloco.querySelector(`table tfoot td[colspan="8"], table tfoot td:last-child`);
            tabela.innerHTML = "";

            let total = 0;
           (grupoSelecionado.itens || []).forEach(item => {
  const quantidadeCalculada = calcularQuantidadeDesejada(item, { groupId: ultimoBloco.id });
  const quantidadeArredondada = Math.ceil(quantidadeCalculada || item.quantidade || 1);
  const custoUnitario = parseFloat(item.custo) || 0;

  // ✅ Agora usa a quantidade ARREDONDADA no cálculo
  const valorTotal = custoUnitario * quantidadeArredondada;

  const tr = document.createElement("tr");
  tr.dataset.idSuffix = ultimoBloco.id;

 const unidadeItem = item.unidade || (window._produtosUnidadeMap && window._produtosUnidadeMap[String(item.codigo_omie || "").trim()]) || "—";

 tr.innerHTML = `
 <td>
  <textarea class="form-control form-control-sm" rows="3">
${item.descricao_utilizacao|| "Utilização Barra de pesquisa"}
  </textarea>
</td>


  <td>${item.nome_produto || item.nome || ""}</td>
  <td class="custo-unitario">R$ ${valorTotal.toFixed(2)}</td>
  <td class="venda-unitaria">R$ ${custoUnitario.toFixed(2)}</td>
  <td>${item.codigo_omie || ""}</td>
  <td class="unidade-medida">${unidadeItem}</td>
  <td>
    <input type="number" class="form-control form-control-sm quantidade"
           value="${quantidadeArredondada}" min="1">
  </td>
  <td>
    <input type="text" class="form-control form-control-sm quantidade-desejada"
           value="${quantidadeCalculada}"
           data-formula="${item.formula_quantidade || ""}">
  </td>
  <td>
    <button class="btn btn-sm btn-danger d-block mb-1" onclick="this.closest('tr').remove()">Remover</button>
    <button class="btn btn-sm btn-secondary d-block" onclick="abrirSubstituirProduto(this)">Substituir</button>
  </td>`;


  // resumo 
  const resumoTextarea = ultimoBloco.querySelector(`textarea[id^="resumo-"]`);

if (resumoTextarea) {
  const texto = grupoSelecionado?.itens?.[0]?.formula_custo || "";
  resumoTextarea.value = texto;
  resumoTextarea.dataset.valorOriginal = texto; // opcional
}


  
  tabela.appendChild(tr);
  total += valorTotal;
});


            if (totalTd) {
              totalTd.innerHTML = `<strong>R$ ${total.toFixed(2)}</strong>`;
            }

            new Sortable(tabela, {
              animation: 100,
              handle: "td",
              ghostClass: "bg-warning-subtle"
            });

            inicializarCamposDeFormulaQuantidade(ultimoBloco, { groupId: ultimoBloco.id });

          }, 100);
        });

        grupoList.appendChild(li);
      }
    });

  grupoList.style.display = (filtro.trim() && grupoList.children.length > 0) ? "block" : "none";
}



document.addEventListener("DOMContentLoaded", () => {
  carregarMapaUnidades();

  const searchInput = document.getElementById("buscaProduto");
  const grupoList = document.getElementById("sugestoesProdutos");

  searchInput.addEventListener("input", () => renderLista(searchInput.value));

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#sugestoesProdutos") && e.target.id !== "buscaProduto") {
      grupoList.style.display = "none";
    }
  });

  new Sortable(document.getElementById("blocosProdutosContainer"), {
    animation: 200,
    handle: ".accordion-header",
    ghostClass: "bg-light"
  });
});

window.blocoIndex ??= 1;

// 💾 Cache global dos produtos da Omie
window._produtosOmieCache = null;

async function carregarMapaUnidades() {
  try {
    if (!window._produtosOmieCache) {
      const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/produtos/visualizar");
      if (!res.ok) return;
      window._produtosOmieCache = await res.json();
    }
    if (!window._produtosUnidadeMap) window._produtosUnidadeMap = {};
    window._produtosOmieCache.forEach((p) => {
      const codigo = String(p.codigo_produto || p.codigo || "").trim();
      if (codigo) window._produtosUnidadeMap[codigo] = p.unidade || "";
    });
  } catch (e) { /* silent */ }
}
window.carregarMapaUnidades = carregarMapaUnidades;

function _mostrarUltimaAtualizacaoOmie() {
  const btn = document.getElementById("btn-omie-preco-atualizacao");
  if (!btn) return;
  const ts = window.CFgAPI?.obter()?.ultimaAtualizacaoOmie;
  if (!ts) return;

  const tipoUsuario = localStorage.getItem("usuarioTipo") || "usuario";
  const isGestor = ["admin", "gestor"].includes(tipoUsuario);
  if (!isGestor) { btn.style.display = "none"; return; }

  const aprovado = !!window.propostaAtual?.aprovadoPeloGestor;
  const cur = "pointer";

  btn.innerHTML =
    `<span>Atualização de valores Omie: ${new Date(ts).toLocaleString("pt-BR")}</span>` +
    `<span style="margin-left:10px;display:inline-flex;border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.25);">` +
      `<span id="badge-nao-aprovado" data-val="false" style="padding:2px 9px;font:600 11px Inter,Arial;user-select:none;cursor:${cur};` +
        `background:${!aprovado ? "rgba(255,255,255,.25)" : "transparent"};` +
        `color:${!aprovado ? "#fff" : "rgba(255,255,255,.45)"};border-right:1px solid rgba(255,255,255,.2);">` +
        `${!aprovado ? "✓" : "○"} não aprovado</span>` +
      `<span id="badge-aprovado" data-val="true" style="padding:2px 9px;font:600 11px Inter,Arial;user-select:none;cursor:${cur};` +
        `background:${aprovado ? "rgba(255,255,255,.25)" : "transparent"};` +
        `color:${aprovado ? "#fff" : "rgba(255,255,255,.45)"};">` +
        `${aprovado ? "✓" : "○"} aprovado pelo gestor</span>` +
    `</span>`;

  btn.style.display = "";
  btn.style.pointerEvents = "auto";

  if (isGestor) {
    ["badge-nao-aprovado", "badge-aprovado"].forEach(badgeId => {
      document.getElementById(badgeId)?.addEventListener("click", async e => {
        e.stopPropagation();
        const novoValor = e.currentTarget.dataset.val === "true";
        if (novoValor === !!window.propostaAtual?.aprovadoPeloGestor) return;
        const label = novoValor ? "aprovado pelo gestor" : "não aprovado";
        if (!confirm(`Confirmar alteração para "${label}"?`)) return;
        await _salvarAprovadoGestor(novoValor);
      });
    });
  }
}
window.atualizarPillOmie = _mostrarUltimaAtualizacaoOmie;

async function validarOmieAtualizado() {
  const ts = window.CFgAPI?.obter()?.ultimaAtualizacaoOmie;
  if (!ts) return true; // sem registro de atualização, não bloqueia

  const aprovado = !!window.propostaAtual?.aprovadoPeloGestor;
  if (aprovado) return true; // gestor aprovou, libera

  try {
    const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/server-time");
    if (!res.ok) return true; // se backend falhar, não bloqueia
    const { now } = await res.json();
    const diasDesde = (new Date(now) - new Date(ts)) / (1000 * 60 * 60 * 24);
    if (diasDesde > 30) {
      alert(
        `⚠️ Os preços da Omie foram atualizados há ${Math.floor(diasDesde)} dias.\n\n` +
        `Propostas com preços desatualizados (mais de 30 dias) precisam ser aprovadas pelo gestor ou ter os preços atualizados antes de gerar o PDF.`
      );
      return false;
    }
  } catch (e) {
    return true; // erro de rede não bloqueia
  }
  return true;
}
window.validarOmieAtualizado = validarOmieAtualizado;

// Regra de atualização de produto (Ajustes): bloqueia o PDF para vendedores se algum produto
// da proposta tiver a data de alteração na Omie (coluna Dt. Alt.) com mais de N dias.
async function validarDtAltProdutos() {
  const regra = window.CFgAPI?.obter()?.regraAtualizacaoProduto;
  if (!regra?.ativo) return true;
  const tipo = localStorage.getItem("usuarioTipo") || "";
  if (tipo === "admin" || tipo === "gestor") return true;
  if (window.propostaAtual?.aprovadoPeloGestor) return true;
  const limiteDias = Number(regra.dias) || 30;

  // A lista de produtos da Omie (tabelas.js) pode ainda estar carregando: espera até 15s
  for (let i = 0; i < 30 && !window.todosProdutos?.length; i++) {
    await new Promise(r => setTimeout(r, 500));
  }
  if (!window.todosProdutos?.length) return true; // sem a lista, não bloqueia

  let agora = new Date();
  try {
    const res = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/server-time");
    if (res.ok) agora = new Date((await res.json()).now);
  } catch (e) { /* usa a hora local */ }

  const porCodigo = new Map(window.todosProdutos.map(p => [String(p.codigo_produto || p.codigo || ""), p]));
  const vencidos = new Map(); // codigo -> { codigo, descricao, dataAlt, dias }
  document.querySelectorAll("td.data-alt-omie[data-codigo]").forEach(td => {
    const codigo = String(td.dataset.codigo || "");
    if (vencidos.has(codigo)) return;
    const p = porCodigo.get(codigo);
    const dAlt = p?.data_alt || p?.info?.dAlt || "";
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dAlt);
    if (!m) return;
    const diasDesde = Math.floor((agora - new Date(+m[3], +m[2] - 1, +m[1])) / 86400000);
    if (diasDesde > limiteDias) {
      const descricao = td.closest("tr")?.children[1]?.textContent.trim() || codigo;
      vencidos.set(codigo, { codigo, descricao, dataAlt: dAlt, dias: diasDesde });
    }
  });

  if (!vencidos.size) return true;

  // O gestor pode ter autorizado depois que a página abriu: confere a proposta no servidor
  if (await _aprovadoPeloGestorAgora()) return true;

  _popupAutorizacaoProduto([...vencidos.values()], limiteDias);
  return false;
}
window.validarDtAltProdutos = validarDtAltProdutos;

// ── Pedido de autorização (produtos desatualizados) ─────────────────────────
// O vendedor pede pelo popup; o gestor decide no sino da listagem (notificacoesGestor.js).
// Aprovado → a proposta fica "aprovado pelo gestor" e o PDF libera.
const API_APROV_PRODUTO = "https://ulhoa-0a02024d350a.herokuapp.com/api/aprovacoes-produto";

async function _aprovadoPeloGestorAgora() {
  const id = new URLSearchParams(window.location.search).get("id") || window.propostaAtual?._id;
  if (!id) return false;
  try {
    const r = await fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${id}`);
    if (!r.ok) return false;
    const p = await r.json();
    if (p?.aprovadoPeloGestor && window.propostaAtual) window.propostaAtual.aprovadoPeloGestor = true;
    return !!p?.aprovadoPeloGestor;
  } catch (e) {
    return false;
  }
}

async function _popupAutorizacaoProduto(produtos, limiteDias) {
  const idProposta = new URLSearchParams(window.location.search).get("id") || window.propostaAtual?._id;
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtData = d => d ? new Date(d).toLocaleString("pt-BR") : "";
  document.getElementById("aut-prod-overlay")?.remove();

  const ov = document.createElement("div");
  ov.id = "aut-prod-overlay";
  ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;";
  ov.innerHTML = `
    <div style="background:#fff;border-radius:14px;width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,.3);overflow:hidden;font-family:inherit;color:#1e293b;">
      <div style="display:flex;align-items:flex-start;gap:12px;padding:16px 20px;background:#fff7ed;border-bottom:1px solid #fed7aa;">
        <span class="material-icons-outlined" style="font-size:22px;color:#c2410c;background:#ffedd5;border-radius:10px;padding:8px;">inventory_2</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:16px;font-weight:700;color:#7c2d12;">Produtos desatualizados na Omie</div>
          <div style="font-size:12px;color:#9a3412;margin-top:2px;">${produtos.length} produto(s) com a data de alteração na Omie há mais de ${limiteDias} dias. Para gerar o PDF, peça a autorização do gestor ou atualize os produtos na Omie.</div>
        </div>
        <button type="button" data-acao="fechar" title="Fechar" style="border:none;background:none;cursor:pointer;color:#9a3412;padding:2px;"><span class="material-icons-outlined" style="pointer-events:none;">close</span></button>
      </div>
      <div style="padding:12px 20px;overflow:auto;flex:1;">
        ${produtos.map(p => `
          <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">
            <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;">${esc(p.descricao)}</span>
            <span style="white-space:nowrap;color:#b45309;font-size:12px;font-weight:600;">${esc(p.dataAlt)} · ${p.dias} dias</span>
          </div>`).join("")}
      </div>
      <div data-area-pedido style="padding:14px 20px;border-top:1px solid #e2e8f0;background:#fcfcfd;">
        <div style="font-size:12px;color:#94a3b8;">Verificando pedidos…</div>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener("click", e => {
    if (e.target === ov || e.target.closest('[data-acao="fechar"]')) ov.remove();
  });

  const area = ov.querySelector("[data-area-pedido]");
  const btnCss = cor => `padding:9px 16px;border:none;border-radius:8px;background:${cor};color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;`;
  const tag = (bg, cor, txt) => `<div style="padding:8px 12px;border-radius:8px;background:${bg};color:${cor};font-size:12px;font-weight:600;margin-bottom:10px;">${txt}</div>`;

  const formulario = negado => {
    area.innerHTML =
      (negado ? tag("#fee2e2", "#991b1b", `⛔ Negado por ${esc(negado.aprovador || "gestor")}${negado.observacao ? ": " + esc(negado.observacao) : ""}`) : "") +
      `<textarea placeholder="Justificativa para o gestor (opcional)" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:13px;resize:vertical;min-height:56px;"></textarea>
       <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
         <button type="button" data-acao="fechar" style="padding:9px 16px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;font-family:inherit;">Cancelar</button>
         <button type="button" data-acao="enviar" style="${btnCss("#c2410c")}">${negado ? "Pedir novamente" : "Solicitar autorização ao gestor"}</button>
       </div>`;
    area.querySelector('[data-acao="enviar"]').addEventListener("click", async e => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = "Enviando…";
      const proposta = window.propostaAtual || {};
      const r = await fetch(API_APROV_PRODUTO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propostaId:     idProposta,
          numeroProposta: proposta.numeroProposta || proposta.camposFormulario?.numeroOrcamento || "",
          nomeCliente:    proposta.camposFormulario?.clientes?.[0]?.nome_razao_social || "",
          solicitante:    localStorage.getItem("usuarioNome") || localStorage.getItem("usuarioEmail") || "Usuário",
          email:          (localStorage.getItem("usuarioEmail") || "").toLowerCase(),
          justificativa:  area.querySelector("textarea").value.trim(),
          limiteDias,
          produtos,
        }),
      }).catch(() => null);
      if (!r?.ok) {
        alert("Não foi possível enviar o pedido de autorização.");
        btn.disabled = false; btn.textContent = negado ? "Pedir novamente" : "Solicitar autorização ao gestor";
        return;
      }
      aguardando(await r.json());
    });
  };

  const aguardando = pedido => {
    area.innerHTML =
      tag("#fffbeb", "#92400e", `⏳ Pedido enviado em ${fmtData(pedido.dataHora)}. Aguardando o gestor autorizar.`) +
      `<div style="font-size:12px;color:#64748b;margin-bottom:10px;">Quando o gestor aprovar, clique de novo no botão para gerar o PDF.</div>
       <div style="display:flex;justify-content:flex-end;"><button type="button" data-acao="fechar" style="${btnCss("#475569")}">Fechar</button></div>`;
  };

  // Último pedido desta proposta: pendente → aguardando; negado → mostra o motivo e permite pedir de novo
  let ultimo = null;
  try {
    const r = await fetch(`${API_APROV_PRODUTO}?propostaId=${encodeURIComponent(idProposta)}`);
    if (r.ok) ultimo = (await r.json()).find(d => d.status !== "cancelado") || null;
  } catch (e) { /* sem histórico, mostra o formulário */ }
  if (ultimo?.status === "pendente") aguardando(ultimo);
  else formulario(ultimo?.status === "negado" ? ultimo : null);
}

async function _salvarAprovadoGestor(novoValor) {
  const id = new URLSearchParams(window.location.search).get("id") || window.propostaAtual?._id;
  if (!id) { alert("ID da proposta não encontrado."); return; }
  try {
    const res = await fetch(
      `https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprovadoPeloGestor: novoValor })
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (window.propostaAtual) window.propostaAtual.aprovadoPeloGestor = novoValor;
    _mostrarUltimaAtualizacaoOmie();
  } catch (err) {
    console.error("Erro ao salvar aprovadoPeloGestor:", err);
    alert("Erro ao salvar. Tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.CFgAPI?.obter()?.ultimaAtualizacaoOmie) {
    _mostrarUltimaAtualizacaoOmie();
  } else {
    document.addEventListener("cfgapi:pronto", _mostrarUltimaAtualizacaoOmie, { once: true });
    setTimeout(() => _mostrarUltimaAtualizacaoOmie(), 2000);
    setTimeout(() => _mostrarUltimaAtualizacaoOmie(), 5000);
  }
});

async function atualizarPrecosOmieNaDOM() {
  const ENDPOINT = "https://ulhoa-0a02024d350a.herokuapp.com/produtos/visualizar";

  const toNumber = (v) => {
    if (v === undefined || v === null) return 0;
    let s = String(v).replace(/\s+/g, "").replace("R$", "");
    const hasDot = s.includes(".");
    const hasComma = s.includes(",");
    if (hasDot && hasComma) s = s.replace(/\./g, "").replace(",", ".");
    else if (!hasDot && hasComma) s = s.replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  try {
    // ⚡ Usa cache se já estiver carregado
    if (!window._produtosOmieCache) {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`Erro ao buscar produtos: ${res.status}`);
      const listaAPI = await res.json();
      window._produtosOmieCache = listaAPI;
    }

    const listaAPI = window._produtosOmieCache;

    // Monta dicionários por código: preço e unidade de medida
    const lookup = {};
    if (!window._produtosUnidadeMap) window._produtosUnidadeMap = {};
    listaAPI.forEach((p) => {
      const codigo = String(p.codigo_produto || p.codigo || "").trim();
      const preco = p.preco_unitario ?? p.valor_unitario ?? p.preco ?? p.price ?? 0;
      if (codigo) {
        lookup[codigo] = toNumber(preco);
        window._produtosUnidadeMap[codigo] = p.unidade || "";
      }
    });

    const linhasCorrigidas = [];

    document.querySelectorAll("table[id^='tabela-'] tbody tr").forEach((tr) => {
      const codigoCell = tr.querySelector("td:nth-child(5)");
      const custoTd = tr.querySelector("td:nth-child(3)");
      const unitarioTd = tr.querySelector("td:nth-child(4)");
      const inputQtd = tr.querySelector("td:nth-child(7) input");

      if (!codigoCell || !unitarioTd || !custoTd || !inputQtd) return;

      const codigo = String(codigoCell.textContent || "").trim();
      const precoAPI = lookup[codigo];
      if (!precoAPI) return;

      const precoAtual = toNumber(unitarioTd?.textContent);
      if (Math.abs(precoAtual - precoAPI) > 0.009) {
        const qtd = parseFloat(inputQtd?.value?.replace(",", ".") || "1") || 1;
        const novoCustoFinal = precoAPI * qtd;

        unitarioTd.textContent = `R$ ${precoAPI.toFixed(2)}`;
        custoTd.textContent = `R$ ${novoCustoFinal.toFixed(2)}`;

        tr.style.backgroundColor = "#e5ffe5";
        unitarioTd.style.color = "green";
        custoTd.style.color = "green";

        linhasCorrigidas.push(codigo);
      }
    });

    // ⏳ Aguarda DOM se estabilizar antes de reativar sanfonas
    setTimeout(() => {
      document.querySelectorAll(".accordion-collapse").forEach(el => {
        const instance = bootstrap.Collapse.getOrCreateInstance(el);
        if (!el.classList.contains("show")) {
          instance.hide();
        } else {
          instance.show();
        }
      });
    }, 500); // ⏱️ Ajuste o tempo se necessário

    // Preenche células de unidade que estão vazias ou "—" (propostas antigas sem o campo salvo)
    document.querySelectorAll("table[id^='tabela-'] tbody tr").forEach((tr) => {
      const codigoCell = tr.querySelector("td:nth-child(5)");
      const unidadeCell = tr.querySelector(".unidade-medida");
      if (!codigoCell || !unidadeCell) return;
      const codigo = String(codigoCell.textContent || "").trim();
      if (!codigo) return;
      const unidade = window._produtosUnidadeMap[codigo];
      if (unidade && (!unidadeCell.textContent.trim() || unidadeCell.textContent.trim() === "—")) {
        unidadeCell.textContent = unidade;
      }
    });

    // Recalcula totais
    if (typeof ativarRecalculoEmTodasTabelas === "function") {
      ativarRecalculoEmTodasTabelas();
    }

    const mensagem = `${linhasCorrigidas.length} produto(s) com preço atualizado com sucesso.`;

    if (!window.location.pathname.includes("criar.html")) {
      if (linhasCorrigidas.length > 0) {
        mostrarPopupCustomizado("✅ Preços Atualizados", mensagem, "success");
        
        mostrarPopupCustomizado("⚠️ Ajustes Realizados", "Os preços foram atualizados com a Omie. Por conta disso, os campos de desconto e parcelas foram resetados para garantir consistência nos valores.", "warning");
        ativarEventosDescricao()
      } else {
        alert("✔️ Todos os preços já estavam atualizados.");
      }
    }

    // Salva timestamp no servidor (MongoDB via CFgAPI)
    if (window.CFgAPI) {
      const cfgAtual = window.CFgAPI.obter() || {};
      cfgAtual.ultimaAtualizacaoOmie = new Date().toISOString();
      window.CFgAPI.salvar(cfgAtual).catch(() => {});
    }
    _mostrarUltimaAtualizacaoOmie();

  } catch (err) {
    console.error("❌ Erro ao atualizar preços:", err);
    if (!window.location.pathname.includes("criar.html")) {
      alert("Erro ao atualizar preços com a Omie.");
    }
  }
}

function ativarEventosDescricao() {
  setTimeout(() => {
    console.log("Campos Ajustados")
    const campos = document.querySelectorAll('input[name="descricao"]');

    campos.forEach(campo => {
      campo.dispatchEvent(new Event('focus',  { bubbles: true }));
      campo.dispatchEvent(new Event('input',  { bubbles: true }));
      campo.dispatchEvent(new Event('change', { bubbles: true }));
      campo.dispatchEvent(new Event('blur',   { bubbles: true }));
    });
  }, 2000); // 2 segundos de espera
}



function forcarEventosDescricao(input) {
  if (!input) return;

  const valorOriginal = input.value;
  
  // Foco
  input.focus();

  // Simula digitação (sem mudar valor)
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  
  // Foco perdido
  input.blur();

  // Força DOM reatividade (alguns sistemas precisam disso)
  input.value = valorOriginal + " ";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.value = valorOriginal;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
