
    function toggleForms() {
      const login = document.getElementById('loginForm');
      const cad = document.getElementById('cadastroForm');
      login.style.display = login.style.display === 'none' ? 'block' : 'none';
      cad.style.display = cad.style.display === 'none' ? 'block' : 'none';
    }
async function carregarVendedores({ incluirInativos = true } = {}) {
  try {
    const select = document.getElementById("vendedorResponsavel");
    if (!select) {
      console.warn("⚠️ Elemento #vendedorResponsavel não encontrado no DOM.");
      return;
    }

    // Placeholder
    select.innerHTML = '<option value="">Selecione</option>';

    const normalizar = (s) => String(s || "").trim().toUpperCase();
    const jaTem = new Set();

    (VENDEDORES_FIXOS_FALLBACK.cadastro || []).forEach((v) => {
      if (!incluirInativos && String(v.inativo).toUpperCase() === "S") return;

      const nomeMaiusculo = normalizar(v.nome);
      if (!nomeMaiusculo || jaTem.has(nomeMaiusculo)) return;

      const opt = new Option(nomeMaiusculo, nomeMaiusculo); // texto e valor
      select.appendChild(opt);
      jaTem.add(nomeMaiusculo);
    });

    // Dispara eventos para quem escuta change/input
    select.dispatchEvent(new Event("change", { bubbles: true }));
    select.dispatchEvent(new Event("input", { bubbles: true }));

    console.log(
      `%c✅ ${jaTem.size} vendedores fixos carregados com sucesso.`,
      "color: green; font-weight: bold;"
    );

  } catch (err) {
    console.error("❌ Erro ao carregar vendedores fixos:", err);
  }
}



    async function cadastrar() {
      const select = document.getElementById('cadastroNome');
      const nomesSelecionados = Array.from(select.selectedOptions).map(opt => opt.value);
      const nome = nomesSelecionados.join(', ');
      const email = document.getElementById('cadastroEmail').value;
      const senha = document.getElementById('cadastroSenha').value;
      const tipo = document.getElementById('cadastroTipo').value;

      const res = await fetch('https://ulhoa-0a02024d350a.herokuapp.com/api/auth/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, tipo })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Cadastro realizado! Faça login.');
        location.reload();
      } else {
        alert(data.erro || 'Erro no cadastro');
      }
    }

    async function login() {
      const email = document.getElementById('loginEmail').value;
      const senha = document.getElementById('loginSenha').value;

      const res = await fetch('https://ulhoa-0a02024d350a.herokuapp.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuarioId', data.usuario.id);
        localStorage.setItem('usuarioNome', data.usuario.nome);
        localStorage.setItem('usuarioTipo', data.usuario.tipo);

        console.log("✅ Login realizado:");
        console.log("🆔 ID:", data.usuario.id);
        console.log("👤 Nome:", data.usuario.nome);
        console.log("🔐 Tipo:", data.usuario.tipo);
        console.log("🪪 Token:", data.token);

        window.location.href = 'pages/listagem.html';
      } else {
        alert(data.erro || 'Erro no login');
      }
    }
    // ✅ 100% local (sem fetch) usando seus vendedores fixos
function carregarVendedoresCadastro({ incluirInativos = true } = {}) {
  const select = document.getElementById("cadastroNome");
  if (!select) return;

  const normalizar = (s) => String(s || "").trim().toUpperCase();

  // Mantém a primeira opção se parecer placeholder
  const primeira = select.options?.[0];
  const manterPrimeira =
    primeira && (primeira.value === "" || /selecione|escolha/i.test(primeira.textContent || ""));

  // Limpa options (mantendo placeholder se existir)
  select.innerHTML = "";
  if (manterPrimeira) select.appendChild(primeira);

  // Evita duplicados
  const jaTem = new Set(Array.from(select.options).map(o => normalizar(o.value)));

  (VENDEDORES_FIXOS_FALLBACK.cadastro || []).forEach(v => {
    if (!incluirInativos && String(v.inativo).toUpperCase() === "S") return;

    const nome = String(v.nome || "").trim();
    const key = normalizar(nome);
    if (!key || jaTem.has(key)) return;

    select.appendChild(new Option(nome, nome));
    jaTem.add(key);
  });

  // (Opcional) dispara change/input se você tiver listeners dependentes
  select.dispatchEvent(new Event("change", { bubbles: true }));
  select.dispatchEvent(new Event("input", { bubbles: true }));

  console.log(`✅ cadastroNome preenchido com fallback (${select.options.length} opções)`);
}



    document.addEventListener('DOMContentLoaded', carregarVendedoresCadastro);
