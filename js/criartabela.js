let blocoIndex = 0;

function criarBlocoDeProposta() {
  const idSuffix = `bloco-${blocoIndex++}`;

  const main = document.createElement("main");
  main.className = "content";

  main.innerHTML = `
    <div class="main-container" id="${idSuffix}">

      <div class="accordion" id="accordionCamposProdutos-${idSuffix}">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <div class="d-flex align-items-center justify-content-between px-2">
              <button class="accordion-button flex-grow-1" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCamposProdutos-${idSuffix}" aria-expanded="true" aria-controls="collapseCamposProdutos-${idSuffix}">
                Parâmetros e Produtos (${idSuffix})
              </button>
              <input type="text" class="form-control form-control-sm ms-2" placeholder="Ambiente">
            </div>
          </h2>
          <div id="collapseCamposProdutos-${idSuffix}" class="accordion-collapse collapse show">
            <div class="accordion-body">
              <div class="row g-3">
                <div class="col-lg-4">
                  <ul class="nav nav-tabs">
                    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#${idSuffix}-aba1">Parâmetros</button></li>
                    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#${idSuffix}-aba2">Valores %</button></li>
                    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#${idSuffix}-aba3">Valores R$</button></li>
                  </ul>
                  <div class="tab-content pt-3">
                    ${["", "A", "B"].map((prefix, idx) => `
                      <div class="tab-pane fade ${idx === 0 ? "show active" : ""}" id="${idSuffix}-aba${idx + 1}">
                        <form class="row g-2">
                          ${[...Array(10)].map((_, i) => `
                            <div class="col-6">
                              <label class="form-label">Campo ${prefix}${i + 1}</label>
                              <input type="text" class="form-control form-control-sm">
                            </div>
                          `).join("")}
                        </form>
                      </div>
                    `).join("")}
                  </div>
                </div>

                <div class="col-lg-8 grupo-tabela">
                  <div class="input-group mb-3">
                    <input id="input-${idSuffix}" type="text" class="form-control form-control-sm" list="lista-produtos" placeholder="Pesquisar e incluir produto...">
                    <button class="btn btn-primary btn-sm" onclick="incluirProduto('${idSuffix}')">Incluir</button>
                  </div>
                  <div class="table-responsive">
                    <table id="tabela-${idSuffix}" class="table table-sm table-bordered">
                      <thead class="table-light">
                        <tr>
                          <th>Utilização</th>
                          <th>Descrição</th>
                          <th>Valor de Custo Final</th>
                          <th>Custo Unitário</th>
                          <th>Código Omie</th>
                          <th>Quantidade</th>
                          <th>Qtd. Desejada</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                      <tfoot>
                        <tr><td colspan="2"><strong>Total</strong></td><td colspan="6"><strong>R$ 0,00</strong></td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <datalist id="lista-produtos">
        <option value="Mesa de Escritório">
        <option value="Cadeira Presidente">
        <option value="Monitor 27'' 4K">
        <option value="Teclado Mecânico RGB">
        <option value="Mouse Sem Fio Logitech">
        <option value="Notebook i7 16GB SSD">
        <option value="Impressora HP Multifuncional">
        <option value="Armário de Aço 2 Portas">
        <option value="Luminária de Mesa LED">
        <option value="Telefone IP Intelbras">
      </datalist>

    </div>
  `;

  document.body.appendChild(main);
}

