// permissoes.js — matriz "quem pode o quê" (Ajustes → Perfis).
// Perfis: usuario (Vendedor), gestor (Gestora), admin (Diretor), visualizacao (só leitura).
// Config salva em CFG.permissoes = { [acao]: { usuario, gestor, admin, visualizacao } }.
// Sem config (ou ação sem valor), vale o PADRÃO, que reproduz exatamente as regras de antes da matriz.
// Uso: Permissoes.pode("aprovarOrcamento")  ·  Permissoes.pode("semTravas", cfg)  ·  Permissoes.perfil()

(function () {
  const PERFIS = [
    { id: "usuario",      nome: "Vendedor" },
    { id: "gestor",       nome: "Gestor" },
    { id: "admin",        nome: "Admin (Diretor)" },
    { id: "visualizacao", nome: "Visualização" },
  ];

  // [usuario, gestor, admin, visualizacao]
  const ACOES = [
    { grupo: "Orçamentos" },
    { id: "editarSalvar",     padrao: [1, 1, 1, 0], nome: "Editar e salvar orçamento",
      dica: "Desligado: o botão Salvar some e o orçamento abre só para consulta." },
    { id: "criarDuplicar",    padrao: [1, 1, 1, 0], nome: "Criar e duplicar orçamento",
      dica: "Botões de novo orçamento e Duplicar." },
    { id: "semTravas",        padrao: [0, 1, 1, 0], nome: "Não sofre as travas", onde: "Etapas · Trava por valor · Produto desatualizado",
      dica: "Ligado: a pessoa não é bloqueada pela etapa da Kommo, pela trava por valor, por produto desatualizado nem por campos obrigatórios." },
    { id: "verCustos",        padrao: [0, 0, 1, 0], nome: "Ver custo, valor mínimo e sugerido dos produtos",
      dica: "Campos financeiros dentro de cada produto." },
    { id: "verTodosBotoes",   padrao: [0, 0, 1, 0], nome: "Ver todos os botões do orçamento", onde: "Botões por status",
      dica: "Ligado: ignora a tabela de botões por status e mostra todos, mesmo com o orçamento pendente de aprovação." },
    { grupo: "Aprovações" },
    { id: "aprovarOrcamento", padrao: [0, 0, 1, 0], nome: "Aprovar o orçamento (status \"Aprovado pelo gestor\")",
      dica: "Botão Aprovar (Gestor) e os orçamentos com status pendente na central de aprovações." },
    { id: "liberarExcecoes",  padrao: [0, 0, 1, 0], nome: "Liberar produto desatualizado e desconto abaixo do mínimo",
      dica: "Decide esses pedidos na central de aprovações e no quadro do valor final." },
    { grupo: "Configuração" },
    { id: "editarConfig",     padrao: [0, 0, 1, 0], nome: "Editar fórmulas, modelo e Ajustes", travadoAdmin: true,
      dica: "Botões Editar Modelo, Fórmulas e Ajustes na listagem. O admin sempre mantém este acesso." },
  ];

  // Tipo salvo no login. "user", "usuario" ou vazio = Vendedor
  function perfil(tipo) {
    const t = String(tipo ?? localStorage.getItem("usuarioTipo") ?? "").trim().toLowerCase();
    if (t === "admin" || t === "gestor" || t === "visualizacao") return t;
    return "usuario";
  }

  function configAtual() {
    if (window.CFG?.permissoes) return window.CFG.permissoes;
    try { return JSON.parse(localStorage.getItem("ulhoa_cfg_v1"))?.permissoes || null; } catch { return null; }
  }

  // cfg: o objeto de configuração completo (opcional); sem ele, usa window.CFG ou o cache local
  function pode(acaoId, cfg, tipo) {
    const acao = ACOES.find(a => a.id === acaoId);
    if (!acao) return false;
    const p = perfil(tipo);
    if (acao.travadoAdmin && p === "admin") return true;
    const mapa = cfg ? cfg.permissoes : configAtual();
    const v = mapa?.[acaoId]?.[p];
    if (typeof v === "boolean") return v;
    return !!acao.padrao[PERFIS.findIndex(x => x.id === p)];
  }

  // Matriz completa já resolvida (padrão + config), para a tela de Ajustes
  function matriz(cfgPermissoes) {
    const out = {};
    ACOES.filter(a => a.id).forEach(a => {
      out[a.id] = {};
      PERFIS.forEach((pf, i) => {
        const v = cfgPermissoes?.[a.id]?.[pf.id];
        out[a.id][pf.id] = a.travadoAdmin && pf.id === "admin" ? true : typeof v === "boolean" ? v : !!a.padrao[i];
      });
    });
    return out;
  }

  window.Permissoes = { PERFIS, ACOES, perfil, pode, matriz };
})();
