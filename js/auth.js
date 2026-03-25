// ✅ Lista fixa (fallback)
const VENDEDORES_FIXOS_FALLBACK = {
  pagina: 1,
  total_de_paginas: 1,
  registros: 12,
  total_de_registros: 12,
  cadastro: [
    { codInt: "", codigo: 2452905334, comissao: 1, email: "joaomartins@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "JOAO CLEBER MARTINS", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905376, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "Paulo Sergio Machado da Silva", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905381, comissao: 0, email: "marilena.ulhoa@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "MARILENA DE ALMEIDA ULHOA", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905445, comissao: 1, email: "rafael.angelo@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "RAFAEL ANGELO ARAUJO DA SILVA", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905491, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "DOUGLAS VITOR DA SILVA", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905509, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "GABRIEL JUNIOR DO COUTO NEPOMUCENO", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452905682, comissao: 0, email: "felipe.ulhoa@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "N", nome: "FELIPE ULHOA FERREIRA", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452911859, comissao: 0, email: "", fatura_pedido: "N", inativo: "S", nome: "MAURO LUCIO", visualiza_pedido: "N" },
    { codInt: "", codigo: 2452927579, comissao: 0, email: "projetos@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "S", nome: "ANA FLAVIA RODRIGUES PRATES", visualiza_pedido: "N" },
    { codInt: "", codigo: 2618640819, comissao: 0, email: "lais.rabelo@ferreiraulhoa.com.br", fatura_pedido: "N", inativo: "S", nome: "LAIS MAGALHÃES RABELO", visualiza_pedido: "N" },
    { codInt: "", codigo: 2698639092, comissao: 0, email: "servidor@ferreiraulhoa.com.br", fatura_pedido: "S", inativo: "S", nome: "VANESSA ULHOA", visualiza_pedido: "N" }
  ]
};

const API_BASE = "http://localhost:3000";

function toggleForms() {
  const login = document.getElementById("loginForm");
  const cad = document.getElementById("cadastroForm");

  if (!login || !cad) {
    console.warn("⚠️ loginForm ou cadastroForm não encontrados.");
    return;
  }

  login.style.display = login.style.display === "none" ? "block" : "none";
  cad.style.display = cad.style.display === "none" ? "block" : "none";
}

async function carregarVendedores({ incluirInativos = true } = {}) {
  try {
    const select = document.getElementById("vendedorResponsavel");
    if (!select) {
      console.warn("⚠️ Elemento #vendedorResponsavel não encontrado no DOM.");
      return;
    }

    select.innerHTML = '<option value="">Selecione</option>';

    const normalizar = (s) => String(s || "").trim().toUpperCase();
    const jaTem = new Set();

    (VENDEDORES_FIXOS_FALLBACK.cadastro || []).forEach((v) => {
      if (!incluirInativos && String(v.inativo).toUpperCase() === "S") return;

      const nomeMaiusculo = normalizar(v.nome);
      if (!nomeMaiusculo || jaTem.has(nomeMaiusculo)) return;

      const opt = new Option(nomeMaiusculo, nomeMaiusculo);
      select.appendChild(opt);
      jaTem.add(nomeMaiusculo);
    });

    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input", { bubbles: true }));

    console.log(`✅ ${jaTem.size} vendedores carregados em #vendedorResponsavel.`);
  } catch (err) {
    console.error("❌ Erro ao carregar vendedores:", err);
  }
}

function carregarVendedoresCadastro({ incluirInativos = true } = {}) {
  const select = document.getElementById("cadastroNome");
  if (!select) {
    console.warn("⚠️ Elemento #cadastroNome não encontrado.");
    return;
  }

  const normalizar = (s) => String(s || "").trim().toUpperCase();

  const primeira = select.options?.[0];
  const manterPrimeira =
    primeira && (primeira.value === "" || /selecione|escolha/i.test(primeira.textContent || ""));

  select.innerHTML = "";
  if (manterPrimeira) select.appendChild(primeira);

  const jaTem = new Set(Array.from(select.options).map((o) => normalizar(o.value)));

  (VENDEDORES_FIXOS_FALLBACK.cadastro || []).forEach((v) => {
    if (!incluirInativos && String(v.inativo).toUpperCase() === "S") return;

    const nome = String(v.nome || "").trim();
    const key = normalizar(nome);
    if (!key || jaTem.has(key)) return;

    select.appendChild(new Option(nome, nome));
    jaTem.add(key);
  });

  select.dispatchEvent(new Event("change", { bubbles: true }));
  select.dispatchEvent(new Event("input", { bubbles: true }));

  console.log(`✅ cadastroNome preenchido com fallback (${select.options.length} opções)`);
}

async function cadastrar() {
  try {
    const select = document.getElementById("cadastroNome");
    const emailInput = document.getElementById("cadastroEmail");
    const senhaInput = document.getElementById("cadastroSenha");
    const tipoInput = document.getElementById("cadastroTipo");

    const nomesSelecionados = Array.from(select?.selectedOptions || []).map((opt) => opt.value.trim()).filter(Boolean);
    const nome = nomesSelecionados.join(", ");
    const email = emailInput?.value?.trim() || "";
    const password = senhaInput?.value || "";
    const tipo = tipoInput?.value || "user";

    console.log("🟦 [FRONT.cadastrar] Dados capturados:", {
      nome,
      email,
      tipo,
      passwordInformada: !!password
    });

    if (!nome || !email || !password) {
      alert("Preencha nome, e-mail e senha.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, password, tipo })
    });

    const data = await res.json().catch(() => null);

    console.log("🟦 [FRONT.cadastrar] Status HTTP:", res.status);
    console.log("🟦 [FRONT.cadastrar] Resposta:", data);

    if (res.ok) {
      alert("Cadastro realizado com sucesso. Faça login.");
      location.reload();
      return;
    }

    alert(data?.msg || data?.erro || "Erro no cadastro");
  } catch (err) {
    console.error("❌ [FRONT.cadastrar] Erro:", err);
    alert("Erro ao cadastrar usuário.");
  }
}

async function login() {
  try {
    const email = document.getElementById("loginEmail")?.value?.trim() || "";
    const password = document.getElementById("loginSenha")?.value || "";

    console.log("🟦 [FRONT.login] Dados capturados:", {
      email,
      passwordInformada: !!password
    });

    if (!email || !password) {
      alert("Preencha e-mail e senha.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: email,
        password
      })
    });

    const data = await res.json().catch(() => null);

    console.log("🟦 [FRONT.login] Status HTTP:", res.status);
    console.log("🟦 [FRONT.login] Resposta:", data);

    if (res.ok) {
      localStorage.setItem("token", data.accessToken || "");
      localStorage.setItem("refreshToken", data.refreshToken || "");
      localStorage.setItem("usuarioNome", data.nome || "");
      localStorage.setItem("usuarioEmail", data.email || "");
      localStorage.setItem("usuarioTipo", data.tipo || "");

      console.log("✅ Login realizado com sucesso");
      console.log("👤 Nome:", data.nome);
      console.log("📧 Email:", data.email);
      console.log("🔐 Tipo:", data.tipo);

      window.location.href = "pages/listagem.html";
      return;
    }

    alert(data?.msg || data?.erro || "Erro no login");
  } catch (err) {
    console.error("❌ [FRONT.login] Erro:", err);
    alert("Erro ao tentar login.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarVendedoresCadastro();
  carregarVendedores();

  console.log("✅ DOM carregado. Funções de vendedores inicializadas.");
});
