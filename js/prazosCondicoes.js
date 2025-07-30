// prazosCondicoes.js

function preencherCondicoesComInstalacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `
• A proposta inclui visita para medição técnica;
• A instalação será realizada por equipe especializada;
• O prazo de entrega será contado após aprovação do projeto;
• Garantia de 12 meses sobre defeitos de fabricação;
• Não inclui obras civis e pontos elétricos/hidráulicos;
• Condição sujeita à análise de local e viabilidade.
  `.trim();

  console.log("✅ Condições com instalação preenchidas.");
}

function preencherCondicoesSemInstalacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `
• Este orçamento não contempla instalação;
• Entrega no local definido pelo cliente;
• Garantia de 12 meses sobre defeitos de fabricação;
• Itens prontos para fixação, conforme especificado;
• Não inclui montagem, nivelamento ou ajustes em obra.
  `.trim();

  console.log("✅ Condições sem instalação preenchidas.");
}

function preencherCondicoesSemTampo() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `
• Este orçamento não contempla tampo (vidro/pedra);
• Espaços e ajustes devem ser confirmados pelo cliente;
• Fornecimento do tampo será de responsabilidade do cliente;
• Possíveis alterações de medidas devem ser previamente comunicadas.
  `.trim();

  console.log("✅ Condições sem tampo preenchidas.");
}

function preencherPrazosPadrao() {
  const textarea = document.getElementById("prazosArea");
  if (!textarea) {
    console.warn("⚠️ Campo 'prazosArea' não encontrado.");
    return;
  }

  textarea.value = `
Estrutura
Área ___: _____ dias úteis após aprovação do respectivo projeto

Vidro
Área ___: _____ dias úteis após instalação da respectiva estrutura
  `.trim();

  console.log("✅ Prazos por área preenchidos com o texto padrão.");
}
document.addEventListener("DOMContentLoaded", preencherPrazosPadrao);
