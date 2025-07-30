async function carregarProdutos() {
  try {
    const response = await fetch('https://ulhoa-0a02024d350a.herokuapp.com/produtos/visualizar');
    const produtos = await response.json();

    const datalist = document.getElementById('lista-produtos');
    datalist.innerHTML = ''; // limpa

    produtos.forEach(prod => {
      const option = document.createElement('option');
      option.value = prod.nome; // ou `prod.nome_fantasia` se preferir
      option.setAttribute('data-produto', JSON.stringify(prod)); // opcional para uso posterior
      datalist.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

