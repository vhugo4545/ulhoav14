// 📁 formulaQuantidadeHandler.js

// ✅ Função para avaliar fórmula com segurança
// 📁 formulaQuantidadeHandler.js

// ✅ Função para avaliar fórmula com segurança
function evaluateFormula(formula, grupo) {
  if (!formula || typeof formula !== "string") return "";

  // Extrair o ID do grupo
  let groupId = "";
  if (typeof grupo === "string") {
    groupId = grupo;
  } else if (typeof grupo === "object") {
    groupId = grupo.groupId || grupo.id || "";
  }

  if (!groupId || typeof groupId !== "string") {
    console.warn("groupId inválido em evaluateFormula:", grupo);
    return "";
  }

  try {
    // Substituir funções personalizadas
    formula = formula.replace(/#arredondarCima\s*\(([^)]+)\)/g, (_, expr) => `Math.ceil(${expr})`);
    formula = formula.replace(/#arredondarBaixo\s*\(([^)]+)\)/g, (_, expr) => `Math.floor(${expr})`);

    // Substitui #popup_nome por input[name="nome"]
    formula = formula.replace(/#popup_([a-zA-Z0-9_]+)/g, (_, key) => {
      const input = document.querySelector(`#${groupId} input[name="${key}"]`);
      if (!input) return 0;
      const val = input.value.replace(",", ".");
      return isNaN(val) ? `"${val}"` : Number(val);
    });

    // Substitui #descricao especificamente
    formula = formula.replace(/#descricao/g, () => {
      const input = document.querySelector(`#${groupId} input[name="descricao"]`);
      if (!input) return 0;
      const val = input.value.replace(",", ".");
      return isNaN(val) ? `"${val}"` : Number(val);
    });

    // Substitui qualquer #variavel por input[name="variavel"]
    formula = formula.replace(/#([a-zA-Z0-9_]+)/g, (_, key) => {
      const input = document.querySelector(`#${groupId} input[name="${key}"]`);
      if (!input) return 0;
      const val = input.value.replace(",", ".");
      return isNaN(val) ? `"${val}"` : Number(val);
    });

    // Avaliação segura
    return new Function(`return ${formula}`)();
  } catch (err) {
    console.warn("Erro ao avaliar fórmula:", formula, err);
    return "";
  }
}



// ✅ Função para calcular o valor da fórmula de quantidade desejada
function calcularQuantidadeDesejada(item, context = {}) {
  let formula = (item.formula_quantidade || "").toString().trim();
  if (formula.startsWith("=")) formula = formula.slice(1);
  formula = formula.replace(/[,;]/g, ".");

  try {
    return evaluateFormula(formula, context);
  } catch (err) {
    console.warn("Erro ao calcular fórmula da quantidade desejada:", formula, err);
    return item.qtd_desejada || 1;
  }
}

// ✅ Configura um campo input com fórmula reativa de quantidade desejada
function configurarCampoQuantidadeDesejada(inputEl, item, context = {}) {
  // Salva a fórmula atual (do atributo data-formula)
  let formulaOriginal = inputEl.dataset.formula || item.formula_quantidade || "";

  // Exibir a fórmula ao focar
  inputEl.addEventListener("focus", () => {
    if (formulaOriginal) {
      inputEl.value = formulaOriginal;
    }
  });

  // Avaliar e salvar nova fórmula ao sair do campo
  inputEl.addEventListener("blur", () => {
    const novaFormula = inputEl.value.trim();
    if (novaFormula && novaFormula !== formulaOriginal) {
      inputEl.dataset.formula = novaFormula;
      formulaOriginal = novaFormula;
    }

    const formula = novaFormula.replace(/^=/, "").replace(/[,;]/g, ".");
    const valor = evaluateFormula(formula, context);
    inputEl.value = Number.isFinite(valor) ? valor : 0;
  });
}


// ✅ Inicializa todos os inputs com atributo data-formula dentro de um container
function inicializarCamposDeFormulaQuantidade(container, context = {}) {
  const inputs = container.querySelectorAll('input[data-formula]');
  inputs.forEach(input => {
    const formula = input.dataset.formula || "";
    if (formula) {
      configurarCampoQuantidadeDesejada(input, { formula_quantidade: formula }, context);
    }
  });
}

function simularFocusEBlurEmTodosCamposFormula() {
  const campos = document.querySelectorAll('input[data-formula]');

  campos.forEach(input => {
    if (input.dataset.manual === "true") return; // pula campos manuais

    // Dispara focus e blur artificialmente
    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));
  });
}



function calcularQuantidadeDesejada(item, context = {}) {
  let formula = (item.formula_quantidade || "").toString().trim();
  if (formula.startsWith("=")) formula = formula.slice(1);
  formula = formula.replace(/[,;]/g, ".");

  try {
    return evaluateFormula(formula, context);
  } catch (err) {
    console.warn("Erro ao calcular fórmula da quantidade desejada:", formula, err);
    return item.qtd_desejada || 1;
  }
}

function configurarCampoQuantidadeDesejada(inputEl, item, context = {}) {
  const formulaOriginal = item.formula_quantidade || "";

  inputEl.addEventListener("focus", () => {
    if (formulaOriginal) {
      inputEl.value = formulaOriginal;
    }
  });

  inputEl.addEventListener("blur", () => {
    const formula = (formulaOriginal || "").toString().replace(/^=/, "").replace(/[,;]/g, ".");
    const valor = evaluateFormula(formula, context);
    inputEl.value = Number.isFinite(valor) ? valor : 0;
  });
}

function inicializarCamposDeFormulaQuantidade(container, context = {}) {
  const inputsFormula = container.querySelectorAll('input[data-formula]');

  // Inicializa os campos que contêm fórmulas
  inputsFormula.forEach(input => {
    const formula = input.dataset.formula || "";
    if (formula) {
      configurarCampoQuantidadeDesejada(input, { formula_quantidade: formula }, context);
    }
  });

  // Adiciona reatividade: quando qualquer input[name] muda, reavalia os campos com fórmula
  const groupId = context.groupId || container.id;
  const inputsReativos = container.querySelectorAll('input[name]');

inputsReativos.forEach(input => {
  input.addEventListener("input", () => {
    // Atualiza todos os campos com fórmula dentro do grupo
    inputsFormula.forEach(campo => {
      const formula = campo.dataset.formula || "";
      if (formula) {
        const valor = evaluateFormula(formula, context);
        campo.value = Number.isFinite(valor) ? valor : 0;

        // ⚠️ Se o campo for quantidade-desejada, atualiza o campo .quantidade
        if (campo.classList.contains("quantidade-desejada")) {
          const linha = campo.closest("tr");
          const inputQuantidade = linha?.querySelector("input.quantidade");
          if (inputQuantidade) {
            inputQuantidade.value = Math.ceil(valor || 1);
          }
        }
      }
    });

    // Recalcular custos totais (caso necessário)
    ativarRecalculoEmTodasTabelas();
  });
});


}





