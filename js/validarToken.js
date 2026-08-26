async function verificarTokenOuRedirecionar() {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  try {
    const resposta = await fetch("https://ulhoa-0a02024d350a.herokuapp.com/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resposta.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      window.location.href = "../index.html";
      return;
    }

    const dados = await resposta.json();
    if (dados.tipo) localStorage.setItem("usuarioTipo", dados.tipo);
    if (dados.nome) localStorage.setItem("usuarioNome", dados.nome);

  } catch (erro) {
    console.error("Erro ao validar token:", erro);
    window.location.href = "../index.html";
  }
}
verificarTokenOuRedirecionar();