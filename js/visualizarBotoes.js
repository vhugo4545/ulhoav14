async function controlarBotoesSidebar() {
  const tipoUsuario = localStorage.getItem("usuarioTipo") || "usuario";
  const paginaAtual = window.location.pathname.split("/").pop();

  const botoes = {
    criar: document.getElementById("btn-criar"),
    editarModelo: document.getElementById("btn-editar-modelo"),
    atualizar: document.getElementById("btn-atualizar"),
    solicitar: document.getElementById("btn-solicitar"),
    autorizar: document.getElementById("btn-autorizar"),
    enviarCliente: document.getElementById("btn-enviar-cliente"),
    aprovadoCliente: document.getElementById("btn-aprovado-cliente"),
    gerarPedido: document.getElementById("btn-gerar-pedido"),
    atualizarPrecos: document.getElementById("btn-atualizar-precos"),
    auditar: document.getElementById("btn-auditar-valores")
  };


  function esconderTodos() {
    Object.values(botoes).forEach(btn => btn && (btn.style.display = "none"));
  }

  esconderTodos();

  // 📝 Página de criação
  if (paginaAtual === "criar.html" || paginaAtual === "criarPropostaV2.html") {
    if (botoes.criar) botoes.criar.style.display = "block";
    return;
  }

  // 🔄 Carrega proposta se não estiver em window
  if (!window.proposta && !window.propostaEmEdicao && !window.propostaAtual) {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return;

    try {
      const resposta = await fetch(`https://ulhoa-0a02024d350a.herokuapp.com/api/propostas/${id}`);
      const dados = await resposta.json();
      window.proposta = dados;
    } catch (erro) {
      console.error("❌ Erro ao carregar proposta:", erro);
      return;
    }
  }

  const status = (
    window.proposta?.statusOrcamento ||
    window.propostaEmEdicao?.statusOrcamento ||
    window.propostaAtual?.statusOrcamento ||
    ""
  );

  // 🔒 Botões que exigem aprovação do gestor ou superior
  const statusBloqueado = ["Orçamento Iniciado", "Pendente de aprovação"].includes(status);
  const idsBloqueados = [
    "btn-visualizar-proposta", "btn-folhas-impressao", "btn-pedido-finalizado",
    "btn-enviar-cliente", "btn-aprovado-cliente",
    "btn-gerar-pedido", "btn-gerar-pedido-kommo"
  ];
  idsBloqueados.forEach(id => {
    document.querySelectorAll(`#${id}`).forEach(btn => {
      btn.classList.toggle("btn-bloqueado", statusBloqueado);
    });
  });

  // Na página de edição: sempre mostra todos os botões — o 🚫 faz o papel de restrição visual
  if (paginaAtual === "editar.html") {
    Object.values(botoes).forEach(btn => btn && (btn.style.display = "block"));
    if (tipoUsuario !== "admin" && botoes.autorizar) botoes.autorizar.style.display = "none";
    return;
  }

  // 👑 Admin fora da edição: mostra auditar
  if (tipoUsuario === "admin") {
    if (botoes.auditar) botoes.auditar.style.display = "block";
  }

  if (status === "Orçamento Iniciado") {
    if (botoes.editar) botoes.editar.style.display = "block";
    if (botoes.solicitar) botoes.solicitar.style.display = "block";
    return;
  }
}

document.addEventListener("DOMContentLoaded", controlarBotoesSidebar);

document.addEventListener("DOMContentLoaded", function () {
  const btnAjuste = document.getElementById("btn-ajuste-nomenclatura");
  if (!btnAjuste) return;

  const tipoUsuario = localStorage.getItem("usuarioTipo") || "usuario";
  const idProposta = new URLSearchParams(location.search).get("id");
  const paginaAtual = window.location.pathname.split("/").pop();

  if (
    paginaAtual !== "editar.html" ||
    idProposta !== "68746e305b9691a7ed3b3f97" ||
    !["gestor", "admin"].includes(tipoUsuario)
  ) return;

  btnAjuste.style.display = "";

  function tornarEditavel(span) {
    if (span.contentEditable === "true") return;
    span.contentEditable = "true";
    span.style.cssText += ";cursor:text;border-bottom:1px dashed #94a3b8;padding:2px 6px;border-radius:2px;min-width:60px;display:inline-block;outline:none;";

    // impede que o clique no span abra/feche o accordion
    span.addEventListener("click", e => e.stopPropagation());
    span.addEventListener("mousedown", e => e.stopPropagation());

    span.addEventListener("focus", () => span.style.borderBottom = "1px solid #475569");
    span.addEventListener("blur",  () => span.style.borderBottom = "1px dashed #94a3b8");
    span.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); span.blur(); } });
  }

  let observer = null;

  btnAjuste.addEventListener("click", function () {
    // torna editáveis todos os spans existentes
    document.querySelectorAll("span[id^='titulo-accordion-bloco-']").forEach(tornarEditavel);

    // observa novos blocos adicionados ao container
    if (!observer) {
      const container = document.getElementById("blocosProdutosContainer");
      if (container) {
        observer = new MutationObserver(mutations => {
          mutations.forEach(m => m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            node.querySelectorAll("span[id^='titulo-accordion-bloco-']").forEach(tornarEditavel);
          }));
        });
        observer.observe(container, { childList: true, subtree: false });
      }
    }

    // feedback visual no botão
    btnAjuste.innerHTML = '<span class="material-icons-outlined" style="font-size:16px;">edit</span> Edição ativa';
    btnAjuste.style.opacity = "0.7";
    btnAjuste.disabled = true;
  });
});

document.addEventListener("click", function (e) {
  const btn = e.target.closest("button, a");
  if (btn && btn.classList.contains("btn-bloqueado")) {
    e.preventDefault();
    e.stopImmediatePropagation();
    alert("⚠️ Esta ação só está disponível após a proposta ser aprovada pelo gestor.");
  }
}, true);
