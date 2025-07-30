function setupCepAutocomplete() {
  const cepInput = document.getElementById("cep");

  // Mapeia chaves da resposta do ViaCEP → IDs dos seus inputs
  const fieldMap = {
    logradouro: "rua",
    bairro: "bairro",
    localidade: "cidade",
    uf: "estado",
  };

  // Limpa campos se CEP inválido/erro
  const clearFields = () =>
    Object.values(fieldMap).forEach(id => (document.getElementById(id).value = ""));

  // Preenche campos com os dados retornados
  const fillFields = data =>
    Object.entries(fieldMap).forEach(([apiKey, id]) => {
      document.getElementById(id).value = data[apiKey] || "";
    });

  // Consulta o ViaCEP
  const fetchCep = async cepRaw => {
    const cep = cepRaw.replace(/\D/g, ""); // só dígitos

    // só consulta se houver 8 dígitos
    if (cep.length !== 8) {
      clearFields();
      return;
    }

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("CEP não encontrado");
      fillFields(data);
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
      clearFields();
    }
  };

  // Dispara busca ao sair do campo ou pressionar Enter
  cepInput.addEventListener("blur", e => fetchCep(e.target.value));
  cepInput.addEventListener("keyup", e => {
    if (e.key === "Enter") fetchCep(e.target.value);
  });

  /* ——--- Opcional: máscara 99999-999 enquanto digita ---—— */
  cepInput.addEventListener("input", e => {
    e.target.value = e.target.value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  });
}

/* Ativa assim que a página terminar de carregar */
document.addEventListener("DOMContentLoaded", setupCepAutocomplete);