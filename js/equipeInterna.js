// equipeInterna.js

/**
 * Coleta os dados da equipe interna (vendedor e operador) do formulário.
 * Mostra os dados no console como confirmação visual.
 */

function capturarEquipeInterna() {
  const vendedorEl = document.getElementById("selectVendedor");
  const operadorEl = document.getElementById("operadorInterno");

  const vendedor = vendedorEl?.value || vendedorEl?.selectedOptions?.[0]?.textContent || "-";
  const operador = operadorEl?.value || operadorEl?.selectedOptions?.[0]?.textContent || "-";

  const dadosEquipe = {
    vendedor,
    operador
  };

  console.table(dadosEquipe);
  console.log("%c✅ Dados da equipe interna capturados com sucesso.", "color: green; font-weight: bold;");

  return dadosEquipe;
}

// ✅ Lista fixa (sem backend)
const VENDEDORES_FIXOS = {
  "pagina": 1,
  "total_de_paginas": 1,
  "registros": 19,
  "total_de_registros": 19,
  "cadastros": [
    {
      "cCelular": "(31)98416-0846",
      "cEmail": "vendas2@ferreiraulhoa.com.br",
      "cNome": "Felipe Ulhoa Ferreira",
      "cTelefone": "(31)98416-0851",
      "nCodigo": 2443633956,
      "nMetaAnual": 0
    },
    {
      "cCelular": "",
      "cEmail": "rafael.lopes@norteare.com.br",
      "cNome": "Rafael Lopes 3",
      "cTelefone": "(31) 98243-0412",
      "nCodigo": 2445317399,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31)99137-2615",
      "cEmail": "jessica.monteiro@norteare.com.br",
      "cNome": "Jéssica Monteiro",
      "cTelefone": "(31)99137-2615",
      "nCodigo": 2445369496,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 97131-6202",
      "cEmail": "vitorjose.contato@gmail.com",
      "cNome": "Vitor Rodrigues",
      "cTelefone": "(31) 97131-6202",
      "nCodigo": 2445954915,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31)98488-7974",
      "cEmail": "izabel.ferreira@omie.com.vc",
      "cNome": "Izabel Ferreira",
      "cTelefone": "(31)98488-7974",
      "nCodigo": 2454511483,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31)99470-6034",
      "cEmail": "victor.nunes@norteare.com.br",
      "cNome": "Victor Nunes",
      "cTelefone": "(31)99470-6034",
      "nCodigo": 2485024757,
      "nMetaAnual": 0
    },
    {
      "cCelular": "",
      "cEmail": "ajuda@omie.com.br",
      "cNome": "Ajuda Omie",
      "cTelefone": "(11) 3775-7888",
      "nCodigo": 2485046605,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 97116-6758",
      "cEmail": "jessica.torres@norteare.com.br",
      "cNome": "Jessica Torres",
      "cTelefone": "(31) 97116-6758",
      "nCodigo": 2489989243,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 98416-0811",
      "cEmail": "servidor@ferreiraulhoa.com.br",
      "cNome": "Vanessa Ulhoa",
      "cTelefone": "(31) 98416-0811",
      "nCodigo": 2490332136,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 99454-1665",
      "cEmail": "compras@ferreiraulhoa.com.br",
      "cNome": "Luis Fernando Batista",
      "cTelefone": "(31) 99454-1665",
      "nCodigo": 2502770160,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(41)98403-3853",
      "cEmail": "ajuda@imuv.me",
      "cNome": "Ajuda Imuv",
      "cTelefone": "(41)98403-3853",
      "nCodigo": 2543063796,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31)98852-8844",
      "cEmail": "raiane.vieira@norteare.com.br",
      "cNome": "Raiane Vieira",
      "cTelefone": "(31)98852-8844",
      "nCodigo": 2551877374,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(34) 99684-9523",
      "cEmail": "barbara.nasser@norteare.com.br",
      "cNome": "Barbara Nasser",
      "cTelefone": "(34) 99684-9523",
      "nCodigo": 2566006439,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 98441-9990",
      "cEmail": "marilena.ulhoa@ferreiraulhoa.com.br",
      "cNome": "Marilena de Almeida Ulhoa",
      "cTelefone": "(31) 98441-9990",
      "nCodigo": 2568860426,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 98416-0851",
      "cEmail": "felipe.ulhoa@ferreiraulhoa.com.br",
      "cNome": "Felipe Ulhoa Ferreira",
      "cTelefone": "(31) 98416-0851",
      "nCodigo": 2575300579,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 99937-5826",
      "cEmail": "sararibeiroloiola@gmail.com",
      "cNome": "Sara Ribeiro",
      "cTelefone": "(31) 99937-5826",
      "nCodigo": 2585579772,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 98364-1554",
      "cEmail": "vhugo7751@gmail.com",
      "cNome": "Victor",
      "cTelefone": "(31) 98364-1554",
      "nCodigo": 2594393087,
      "nMetaAnual": 0
    },
    {
      "cCelular": "",
      "cEmail": "pedrobrum@assescont.com.br",
      "cNome": "PEDRO AUGUSTO RUAS BRUM",
      "cTelefone": "+55 (31)3078-8249",
      "nCodigo": 2602824619,
      "nMetaAnual": 0
    },
    {
      "cCelular": "(31) 99751-8886",
      "cEmail": "lais.rabelo@ferreiraulhoa.com.br",
      "cNome": "Laís Rabelo",
      "cTelefone": "(31) 99751-8886",
      "nCodigo": 2621693292,
      "nMetaAnual": 0
    }
  ]
}
;

async function carregarVendedores() {
  const TOKEN = localStorage.getItem('accessToken'); // mantém como estava

  try {
    // ✅ agora usa a lista fixa
    const vendedores = VENDEDORES_FIXOS; // contém { cadastros: [...] }

    const select = document.getElementById('vendedorResponsavel');
    if (!select) {
      console.warn('⚠️ Elemento #vendedorResponsavel não encontrado no DOM.');
      return;
    }

    select.innerHTML = '<option value="">Selecione</option>';

    (vendedores.cadastros || []).forEach(v => {
      const nomeMaiusculo = String(v.cNome || '').toUpperCase().trim();
      if (!nomeMaiusculo) return;

      const opt = new Option(nomeMaiusculo, nomeMaiusculo); // nome como texto e valor
      select.appendChild(opt);
    });

    console.log(
      `%c✅ ${vendedores.cadastros?.length || 0} vendedores carregados com sucesso.`,
      'color: green; font-weight: bold;'
    );

  } catch (err) {
    console.error('❌ Erro ao carregar vendedores:', err);
  }
}




// Inicializa ao carregar o DOM
document.addEventListener("DOMContentLoaded", carregarVendedores);

// Exemplo de uso ao clicar em salvar
const botaoSalvar = document.getElementById("save-proposal");
if (botaoSalvar) {
  botaoSalvar.addEventListener("click", capturarEquipeInterna);
} else {
  console.warn("⚠️ Botão de salvar proposta não encontrado para vincular captura da equipe interna.");
}
