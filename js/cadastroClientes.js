// ---------- Controle de fechamento do modal ----------

function confirmarFecharModalCliente() {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;";
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 28px 22px;width:min(380px,92vw);box-shadow:0 16px 48px rgba(0,0,0,.22);">
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px;">Deseja sair sem salvar?</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:24px;">As informações preenchidas serão perdidas.</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="_cfm_ficar" style="padding:9px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#f1f5f9;font-family:inherit;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">Ficar</button>
        <button id="_cfm_sair" style="padding:9px 20px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">Sair sem salvar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById("_cfm_ficar").onclick = () => document.body.removeChild(overlay);
  document.getElementById("_cfm_sair").onclick = () => {
    document.body.removeChild(overlay);
    const modal = bootstrap.Modal.getInstance(document.getElementById("popupClienteModal"));
    if (modal) modal.hide();
  };
}

// ---------- Helpers básicos ----------

// Gera um código de integração aleatório (interno)
function gerarCodigoClienteIntegracao() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  for (let i = 0; i < 7; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log("📦 Código de integração gerado:", codigo);
  return codigo;
}

// Remove qualquer coisa que não seja número
function limparNumero(valor) {
  const limpo = (valor || "").replace(/\D/g, "");
  return limpo;
}

// Aplica máscara dinâmica para CPF/CNPJ (visual)
function aplicarMascaraCnpjCpf(valor) {
  valor = limparNumero(valor);
  if (valor.length <= 11) {
    // CPF: 000.000.000-00
    return valor
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else {
    // CNPJ: 00.000.000/0000-00
    return valor
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
  }
}

// Validação de CPF (valor SEM pontuação)
function validarCPF(cpf) {
  cpf = limparNumero(cpf);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += +cpf[i] * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== +cpf[9]) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += +cpf[i] * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === +cpf[10];
}

// Validação de CNPJ (valor SEM pontuação)
function validarCNPJ(cnpj) {
  cnpj = limparNumero(cnpj);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return resultado === parseInt(digitos.charAt(1), 10);
}

// Validação simples de CEP (8 dígitos)
function validarCEP(cep) {
  const limpo = limparNumero(cep);
  return limpo.length === 8;
}

// Validação simples de UF
function validarEstado(uf) {
  uf = (uf || "").trim().toUpperCase();
  return uf.length === 2;
}

// ---------- Abertura do popup ----------

function abrirPopupIncluirCliente() {
  console.log("🟢 abrirPopupIncluirCliente()");
  const form = document.getElementById("popupCliente_form");
  const modalEl = document.getElementById("popupClienteModal");
  if (!form || !modalEl) {
    console.warn("⚠️ Popup ou formulário não encontrado.");
    return;
  }

  form.reset();
  _ultimoDocConsultado = "";
  const avisoAnterior = document.getElementById("_cnpjcpf_aviso");
  if (avisoAnterior) { avisoAnterior.textContent = ""; }
  const campoDoc = document.getElementById("popupCliente_cnpjcpf");
  if (campoDoc) campoDoc.style.borderColor = "";

  // Gera e preenche o código de integração
  const codigoInput = document.getElementById("popupCliente_codigo");
  if (codigoInput) {
    const codigo = gerarCodigoClienteIntegracao();
    codigoInput.value = codigo;
  }

  new bootstrap.Modal(modalEl).show();
}

// ---------- Envio para o servidor ----------

async function enviarClienteParaAPI() {
  console.log("🟢 enviarClienteParaAPI()");

  const form = document.getElementById("popupCliente_form");
  if (!form) {
    console.error("❌ Formulário popupCliente_form não encontrado!");
    return;
  }

  // Garante que todos os campos do modal existem
  const idsObrigatorios = [
    "popupCliente_razao",
    "popupCliente_fantasia",
    "popupCliente_email",
    "popupCliente_cnpjcpf",
    "popupCliente_endereco",
    "popupCliente_bairro",
    "popupCliente_cidade",
    "popupCliente_estado",
    "popupCliente_cep"
  ];

  for (const id of idsObrigatorios) {
    if (!document.getElementById(id)) {
      console.error("❌ Campo obrigatório não encontrado no DOM:", id);
      return;
    }
  }

  // Validação nativa HTML5
  if (!form.checkValidity()) {
    form.reportValidity();
    console.warn("⚠️ Formulário inválido.");
    return;
  }

  // Coleta valores
  const codigo_cliente_integracao =
    (document.getElementById("popupCliente_codigo")?.value || "").trim() ||
    gerarCodigoClienteIntegracao();

  const razao_social = document.getElementById("popupCliente_razao").value.trim();
  const nome_fantasia = document.getElementById("popupCliente_fantasia").value.trim();
  const email = document.getElementById("popupCliente_email").value.trim();
  const cnpjCpfRaw = document.getElementById("popupCliente_cnpjcpf").value.trim();
  const endereco = document.getElementById("popupCliente_endereco").value.trim();
  const bairro = document.getElementById("popupCliente_bairro").value.trim();
  const cidade = document.getElementById("popupCliente_cidade").value.trim();
  const estado = document.getElementById("popupCliente_estado").value.trim().toUpperCase();
  const cepRaw = document.getElementById("popupCliente_cep").value.trim();
  const contato = (document.getElementById("popupCliente_contato")?.value || "").trim();
  const inscricao_municipal = (document.getElementById("popupCliente_inscricao_municipal")?.value || "").trim();
  const inscricao_estadual = (document.getElementById("popupCliente_inscricao_estadual")?.value || "").trim();
  const telefone1_numero = (document.getElementById("popupCliente_telefone1_numero")?.value || "").trim();
  const chave_pix = (document.getElementById("popupCliente_chave_pix")?.value || "").trim();
  const observacao = (document.getElementById("popupCliente_observacao")?.value || "").trim();

  const tagsSelecionadas = [...document.querySelectorAll("#popupCliente_tags_container input[type=checkbox]:checked")]
    .map(cb => ({ tag: cb.value }));

  // Validações extras

  // E-mail simples
  if (!email.includes("@")) {
    alert("⚠️ Informe um e-mail válido.");
    return;
  }

  // CPF / CNPJ
  const cnpj_cpf = limparNumero(cnpjCpfRaw);
  let docValido = false;
  if (cnpj_cpf.length === 11) docValido = validarCPF(cnpj_cpf);
  else if (cnpj_cpf.length === 14) docValido = validarCNPJ(cnpj_cpf);

  if (!docValido) {
    alert("⚠️ CPF ou CNPJ inválido.");
    return;
  }

  // CEP e UF
  if (!validarCEP(cepRaw)) {
    alert("⚠️ CEP inválido. Informe um CEP com 8 dígitos.");
    return;
  }

  if (!validarEstado(estado)) {
    alert("⚠️ Informe uma UF válida (ex: MG, SP, RJ).");
    return;
  }

  const cep = limparNumero(cepRaw);

  // ── Verifica se já existe cliente com mesmo CNPJ/CPF na Omie ────────────
  try {
    const buscaResp = await fetch(
      `https://ulhoa-0a02024d350a.herokuapp.com/clientes/buscar?cnpj_cpf=${cnpj_cpf}`
    );
    if (buscaResp.ok) {
      const buscaData = await buscaResp.json();
      if (buscaData.encontrado && buscaData.clientes && buscaData.clientes.length > 0) {
        const existente = buscaData.clientes[0];
        const nomeExistente = existente.razao_social || existente.nome_fantasia || "cliente existente";
        const confirmou = await new Promise(resolve => {
          const ov = document.createElement("div");
          ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;";
          ov.innerHTML = `
            <div style="background:#fff;border-radius:14px;padding:28px;width:min(400px,92vw);box-shadow:0 16px 48px rgba(0,0,0,.25);">
              <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px;">Cliente já cadastrado na Omie</div>
              <div style="font-size:13px;color:#64748b;margin-bottom:6px;">Já existe um cliente com este CPF/CNPJ:</div>
              <div style="font-size:14px;font-weight:600;color:#0f172a;background:#f1f5f9;border-radius:8px;padding:10px 14px;margin-bottom:20px;">${nomeExistente}</div>
              <div style="font-size:13px;color:#64748b;margin-bottom:24px;">Deseja continuar e cadastrar mesmo assim?</div>
              <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button id="_dup_cancelar" style="padding:9px 20px;border:1px solid #e2e8f0;border-radius:8px;background:#f1f5f9;font-family:inherit;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">Cancelar</button>
                <button id="_dup_continuar" style="padding:9px 20px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">Cadastrar mesmo assim</button>
              </div>
            </div>`;
          document.body.appendChild(ov);
          document.getElementById("_dup_cancelar").onclick = () => { document.body.removeChild(ov); resolve(false); };
          document.getElementById("_dup_continuar").onclick = () => { document.body.removeChild(ov); resolve(true); };
        });
        if (!confirmou) return;
      }
    }
  } catch (err) {
    console.warn("⚠️ Não foi possível verificar duplicidade na Omie:", err.message);
  }

  // Objeto exato enviado para o server -> Omie
  const cliente = {
    codigo_cliente_integracao,
    razao_social,
    nome_fantasia,
    email,
    cnpj_cpf,
    contato,
    endereco,
    endereco_numero: "",
    bairro,
    complemento: "",
    estado,
    cidade,
    cep,
    inscricao_municipal,
    inscricao_estadual,
    telefone1_numero,
    ...(chave_pix ? { cChavePix: chave_pix } : {}),
    ...(observacao ? { observacao } : {}),
    ...(tagsSelecionadas.length ? { tags: tagsSelecionadas } : {})
  };

  console.log("➡️ Enviando cliente para o servidor:", cliente);

  // Se você tiver loading global, pode descomentar:
  // if (typeof mostrarCarregando === "function") mostrarCarregando();

  try {
    const resposta = await fetch("https://utils-b488312867a6.herokuapp.com/omie/clientes/incluir", {
      // ajuste a URL se o server estiver em outro host (ex: Heroku)
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente)
    });

    const resultado = await resposta.json().catch(() => null);
    console.log("📨 Resposta do servidor:", resultado);

    if (!resultado || !resultado.sucesso) {
      const detalhe =
        resultado?.omieErro?.faultstring ||
        resultado?.mensagem ||
        "Erro ao incluir cliente na Omie.";
      console.error("❌ Erro ao incluir cliente:", detalhe);
      if (typeof mostrarPopupCustomizado === "function") {
        mostrarPopupCustomizado("❌ Erro ao incluir cliente", detalhe, "danger");
      } else {
        alert(detalhe);
      }
      return;
    }

    const codigoOmie = resultado?.cliente?.codigo_cliente_omie || null;
    console.log("✅ Cliente incluído com sucesso na Omie! Código:", codigoOmie);

    // Fecha modal
    const modalEl = document.getElementById("popupClienteModal");
    if (modalEl) {
      const instancia = bootstrap.Modal.getInstance(modalEl);
      instancia?.hide();
    }

    // Preenche o formulário principal (ajuste os seletores conforme seu layout)
    preencherCamposCliente({
      nome_razao_social: razao_social,
      codigoOmie: codigoOmie,
      cpfCnpj: cnpj_cpf,
      nome_contato: nome_fantasia,
      funcao: "",
      telefone: ""
    });

    const msgSucesso = `Cliente <b>${razao_social} foi cadastrado com sucesso e está disponível para seleção."}`;
    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado("✅ Cliente incluído com sucesso!", msgSucesso, "success");
    } else {
      alert("Cliente incluído com sucesso!");
    }

    // if (typeof ocultarCarregando === "function") ocultarCarregando();
    return codigoOmie;
  } catch (err) {
    console.error("❌ Erro inesperado ao incluir cliente:", err);
    if (typeof mostrarPopupCustomizado === "function") {
      mostrarPopupCustomizado(
        "❌ Erro ao incluir cliente",
        "Erro de comunicação com o servidor.",
        "danger"
      );
    } else {
      alert("Erro de comunicação com o servidor.");
    }
    // if (typeof ocultarCarregando === "function") ocultarCarregando();
    return;
  }
}

let _ultimoDocConsultado = "";

// Máscara visual ao digitar
document.addEventListener("input", function (e) {
  if (e.target.id !== "popupCliente_cnpjcpf") return;
  e.target.value = aplicarMascaraCnpjCpf(e.target.value);
});

// Validação de CNPJ/CPF assim que completa 11 ou 14 dígitos
document.addEventListener("input", async function (e) {
  if (e.target.id !== "popupCliente_cnpjcpf") return;

  const cnpj_cpf = limparNumero(e.target.value);

  // Só age quando está completo (CPF=11 ou CNPJ=14)
  if (cnpj_cpf.length !== 11 && cnpj_cpf.length !== 14) return;
  // Evita consulta duplicada se o usuário apaga e redigita o mesmo valor
  if (cnpj_cpf === _ultimoDocConsultado) return;
  _ultimoDocConsultado = cnpj_cpf;

  let docValido = false;
  if (cnpj_cpf.length === 11) docValido = validarCPF(cnpj_cpf);
  else if (cnpj_cpf.length === 14) docValido = validarCNPJ(cnpj_cpf);

  let aviso = document.getElementById("_cnpjcpf_aviso");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "_cnpjcpf_aviso";
    aviso.style.cssText = "font-size:12px;margin-top:5px;font-family:'Poppins',sans-serif;min-height:18px;";
    e.target.parentNode.appendChild(aviso);
  }

  if (cnpj_cpf.length > 0 && !docValido) {
    aviso.style.color = "#ef4444";
    aviso.textContent = cnpj_cpf.length <= 11 ? "⚠️ CPF inválido" : "⚠️ CNPJ inválido";
    e.target.style.borderColor = "#ef4444";
    return;
  }

  if (!docValido) { aviso.textContent = ""; return; }

  e.target.style.borderColor = "";
  aviso.style.color = "#64748b";
  aviso.textContent = "Verificando…";

  try {
    const resp = await fetch(
      `https://ulhoa-0a02024d350a.herokuapp.com/clientes/buscar?cnpj_cpf=${cnpj_cpf}`
    );
    if (!resp.ok) { aviso.textContent = ""; return; }
    const data = await resp.json();

    if (data.encontrado && data.clientes?.length > 0) {
      aviso.textContent = "";
      const cliente = data.clientes[0];
      const nome = cliente.razao_social || cliente.nome_fantasia || "cliente";

      const acao = await new Promise(resolve => {
        const ov = document.createElement("div");
        ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;";
        ov.innerHTML = `
          <div style="background:#fff;border-radius:14px;padding:28px;width:min(420px,92vw);box-shadow:0 16px 48px rgba(0,0,0,.25);">
            <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:8px;">Cliente já cadastrado</div>
            <div style="font-size:13px;color:#64748b;margin-bottom:6px;">Este CPF/CNPJ já pertence a:</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;background:#f1f5f9;border-radius:8px;padding:10px 14px;margin-bottom:20px;">${nome}</div>
            <div style="font-size:13px;color:#64748b;margin-bottom:24px;">O que deseja fazer?</div>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button id="_doc_incluir" style="padding:9px 20px;border:none;border-radius:8px;background:#475569;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">Incluir no orçamento</button>
            </div>
          </div>`;
        document.body.appendChild(ov);
        document.getElementById("_doc_incluir").onclick  = () => { document.body.removeChild(ov); resolve("incluir"); };
      });

      if (acao === "incluir") {
        // Fecha o modal
        const modalEl = document.getElementById("popupClienteModal");
        if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

        // Preenche o formulário principal
        const ddd = cliente.telefone1_ddd || "";
        const tel = cliente.telefone1_numero || "";
        preencherCamposCliente({
          nome_razao_social: cliente.razao_social || cliente.nome_fantasia || "",
          codigoOmie: cliente.codigo_cliente_omie || "",
          cpfCnpj: cliente.cnpj_cpf || cnpj_cpf,
          nome_contato: cliente.nome_fantasia || "",
          funcao: "",
          telefone: ddd ? `(${ddd}) ${tel}` : tel
        });
      }
    } else {
      aviso.style.color = "#16a34a";
      aviso.textContent = "✓ Documento disponível";
      setTimeout(() => { if (aviso) aviso.textContent = ""; }, 3000);
    }
  } catch {
    aviso.textContent = "";
  }
}, true);

// Preenche campos no formulário principal (após inclusão do cliente)
// Ajuste os seletores .cliente-item, .razaoSocial, etc. de acordo com a sua tela
function preencherCamposCliente(cliente) {
  console.log("🟢 preencherCamposCliente()", cliente);
  const container = document.querySelector(".cliente-item");
  if (!container) {
    console.warn("⚠️ Container .cliente-item não encontrado para preenchimento.");
    return;
  }
  container.querySelector(".razaoSocial").value = cliente.nome_razao_social || "";
  container.querySelector(".codigoCliente").value = cliente.codigoOmie || "";
  container.querySelector(".cpfCnpj").value = cliente.cpfCnpj || "";
  container.querySelector(".nomeContato").value = cliente.nome_contato || "";
  container.querySelector(".funcaoCliente").value = cliente.funcao || "";
  container.querySelector(".telefoneCliente").value = cliente.telefone || "";
}
