// prazosCondicoes.js

function preencherCondicoesComInstalacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `Condições Gerais:
    • A validade deste orçamento é de 7 dias.
    • Os valores podem sofrer alterações caso haja mudanças nas medidas ou especificações informadas pelo cliente.
    • A instalação será realizada em horário comercial (7h às 17h); serviços fora desse período terão custo adicional.
    • Caso o orçamento inclua vidros, calhas e/ou chapas, o pagamento e o faturamento deverão ser realizados pela contratante, sendo que a contratada atuará apenas na intermediação e instalação do pedido.
    • O valor indicado para materiais faturados diretamente ao cliente constitui mera estimativa. O valor total do pedido permanecerá inalterado. Caso o valor final pago ao fornecedor seja inferior ao valor estimado, a diferença deverá ser paga à contratada. Caso seja superior, a diferença será compensada no saldo do pedido, salvo exceções previstas em contrato.
    • Este orçamento integra o contrato firmado entre as partes, aplicando-se a ele todas as condições gerais previstas no respectivo instrumento contratual.
    • O início da produção e/ou instalação está condicionado à aprovação do orçamento, assinatura do contrato e pagamento da entrada, quando aplicável. `.trim();

  console.log("✅ Condições com instalação preenchidas.");
}

function preencherCondicoesSemInstalacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `Condições Gerais:
    • A validade deste orçamento é de 7 dias.
    • Os valores podem sofrer alterações caso haja mudanças nas medidas ou especificações informadas pelo cliente.
    • Não incluso medição, transporte e instalação. As peças deverão ser retiradas na empresa.
    • Caso o orçamento inclua vidros, calhas e/ou chapas, o pagamento e o faturamento deverão ser realizados pela contratante, sendo que a contratada atuará apenas na intermediação e produção do pedido.
    • O valor indicado para materiais faturados diretamente ao cliente constitui mera estimativa. O valor total do pedido permanecerá inalterado. Caso o valor final pago ao fornecedor seja inferior ao valor estimado, a diferença deverá ser paga à contratada. Caso seja superior, a diferença será compensada no saldo do pedido, salvo exceções previstas em contrato.
    • Este orçamento integra o contrato firmado entre as partes, aplicando-se a ele todas as condições gerais previstas no respectivo instrumento contratual.
    • O início da produção e/ou instalação está condicionado à aprovação do orçamento, assinatura do contrato e pagamento da entrada, quando aplicável.
 `.trim();

  console.log("✅ Condições sem instalação preenchidas.");
}

function preencherCondicoesSemTampo() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  textarea.value = `Condições Gerais:
    • A validade deste orçamento é de 7 dias.
    • Os valores podem sofrer alterações caso haja mudanças nas medidas ou especificações informadas pelo cliente.
    • Não incluso medição, transporte e instalação. As peças deverão ser retiradas na empresa.
    • Não incluso tampo.
    • Caso o orçamento inclua vidros, calhas e/ou chapas, o pagamento e o faturamento deverão ser realizados pela contratante, sendo que a contratada atuará apenas na intermediação e produção do pedido.
    • O valor indicado para materiais faturados diretamente ao cliente constitui mera estimativa. O valor total do pedido permanecerá inalterado. Caso o valor final pago ao fornecedor seja inferior ao valor estimado, a diferença deverá ser paga à contratada. Caso seja superior, a diferença será compensada no saldo do pedido, salvo exceções previstas em contrato.
    • Este orçamento integra o contrato firmado entre as partes, aplicando-se a ele todas as condições gerais previstas no respectivo instrumento contratual.
    • O início da produção e/ou instalação está condicionado à aprovação do orçamento, assinatura do contrato e pagamento da entrada, quando aplicável. `.trim();

  console.log("✅ Condições sem tampo preenchidas.");
}

function preencherCondicoesGeraisComDiagramacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

const linhas = [
  "CONTRATADA",
  "──────────",
  "FERREIRA ULHOA METAIS LTDA, inscrita no CNPJ nº 02.836.048/0001-60, doravante denominada FERREIRA ULHOA METAIS; e",
  "FERREIRA ULHOA SERVIÇOS LTDA, inscrita no CNPJ nº 61.730.562/0001-85, doravante denominada FERREIRA ULHOA SERVIÇOS;",
  "quando mencionadas em conjunto, doravante denominadas simplesmente CONTRATADA.",
  "",

  "INFORMAÇÕES GERAIS",
  "──────────────────",
  "1. Validade da proposta: 3 dias.",
  "2. Os valores acima mencionados estão sujeitos a alterações caso ocorram mudanças nas medidas ou especificações dos produtos discriminados e/ou informados pelo contratante.",
  "3. Caso ocorra atraso em qualquer um dos pagamentos, será cobrado juros no valor de 0,033% ao dia de atraso.",
  "4. O cancelamento deste contrato após a assinatura e/ou autorização por e-mail acarretará em uma multa de 50% (cinquenta por cento) sobre o valor total acordado, exceto nos casos de eventos fortuitos ou de força maior. Além disso, ficam ressalvados quaisquer outros danos causados à parte inocente.",
  "5. As medições e instalações inclusas neste contrato serão realizadas somente durante o horário comercial.",
  "   5.1. Se for necessário realizar instalações fora do horário comercial (das 7:00 às 17:00) e/ou em finais de semana/feriados, os custos adicionais serão negociados e repassados ao cliente.",
  "6. Os vidros estão sujeitos a quebras durante o processo de fabricação, transporte e instalação. Caso isso ocorra, a reposição dependerá do prazo estipulado pela distribuidora, com o que o Contratante desde já anui.",
  "7. Após a assinatura deste instrumento contratual, a Contratante deverá liberar, em até 30 dias corridos, o espaço em que será realizada a instalação para medição técnica. Após este período, poderá haver alteração no valor devido a possíveis aumentos no custo da matéria-prima, como aço inox, aço carbono, vidro, entre outros.",
  "8. A contratante tem a responsabilidade de informar à contratada a localização exata das tubulações e manta, além de entregar as plantas de todas tubulações quando da medição ou, no mais tardar, antes da instalação.",
  "9. Fica excluída a responsabilidade da contratada por danos às tubulações elétricas, hidráulicos e manta.",
  "10. Não estão inclusos no orçamento trabalhos extras de serralheria, elétrica, pintura, alvenaria, gesso, marcenaria, andaimes, içamento.",
  "11. A contratada não se responsabiliza pela qualidade física e resistência dos materiais utilizados na obra civil.",
  "   11.1. O contratante declara que foi devidamente orientado pela contratada acerca das normas técnicas aplicáveis aos produtos e instalações objeto deste contrato. Caso, por sua livre e exclusiva escolha, opte por especificações que não atendam integralmente às normas técnicas vigentes (tais como tipo de vidro, espessura, altura ou demais características), assume integral responsabilidade por tal decisão, isentando a contratada de qualquer responsabilidade por eventuais acidentes, danos ou consequências decorrentes dessa opção.",
  "12. A contratada não se responsabiliza por contaminações posteriores resultantes da utilização de produtos ácidos aplicados nos pisos ou em estruturas de aço (por exemplo: ácido clorídrico, ácidos clorados).",
  "   12.1. A contratada fornecerá ao contratante orientações e manual de limpeza e conservação dos produtos instalados, contendo a indicação dos produtos permitidos e dos produtos proibidos. O uso de produtos químicos inadequados, corrosivos ou não recomendados pela contratada, especialmente por terceiros (tais como zeladores, empresas de limpeza ou funcionários do condomínio), poderá acarretar danos aos materiais, perda da garantia e isenção de responsabilidade da contratada por tais ocorrências.",
  "13. O contratante autoriza a contratada a realizar o registro fotográfico da instalação realizada descrita no presente contrato, durante ou após a sua conclusão, para finalidades de utilização como material de marketing e propaganda exclusivamente nos canais de comunicação da contratada.",
  "14. Não é de responsabilidade da contratada a confecção e faturamento dos vidros e calhas, tendo liberalidade do contratante que a empresa faça o pedido e faturamento para ele.",
  "15. O contratante declara estar ciente de que o faturamento do presente orçamento/pedido poderá ser realizado parte como Produto (NF-e), emitido pela FERREIRA ULHOA METAIS, e parte como Serviço (NFS-e), emitido pela FERREIRA ULHOA SERVIÇOS, conforme a natureza da operação e por razões operacionais, fiscais e tributárias, podendo as notas fiscais serem emitidas em CNPJs distintos, sem que isso implique alteração no valor total contratado, que permanece único e indivisível para fins de pagamento, de acordo com a legislação vigente.",
  "",

  "OBRIGAÇÕES DA CONTRATADA",
  "────────────────────────",
  "16. Utilizar mão de obra especializada contratada de acordo com a legislação vigente, responsabilizando-se pelos encargos trabalhistas, fiscais e previdenciários, prestando contas ao contratante do cumprimento das obrigações mencionadas, entre outras.",
  "17. Entregar, instalar e montar os produtos objeto deste contrato sem quaisquer danos ou avarias.",
  "18. Oferecer assistência técnica gratuita e garantia total da instalação e materiais utilizados pelo período de 12 (doze) meses, incluindo a responsabilidade por erro de projeto, instalação, montagem e qualidade dos produtos, exceto por quebra, arranhões, mau uso, utilização de produtos químicos inadequados ou falta de manutenção conforme manual de limpeza fornecido pela contratada.",
  "19. Assumir responsabilidade civil e técnica pela instalação e produtos utilizados, bem como por danos causados ao contratante, suas unidades habitacionais, condôminos e terceiros durante a execução do contrato e nos prazos fixados no item anterior.",
  "20. Entregar os produtos no prazo estipulado nos anexos, exceto em casos de força maior (atraso na entrega do material pelos fornecedores ou intempéries naturais, como chuva). Tais eventos serão registrados em ata entre as partes, detalhando os fatos, atrasos e novas previsões para entrega e conclusão da instalação, sendo parte integrante do contrato.",
  "",

  "OBRIGAÇÕES DA CONTRATANTE",
  "─────────────────────────",
  "21. Liberar a área de trabalho e os vãos dentro do prazo acordado. Caso a obra não esteja liberada para instalação, a empresa poderá entregar o material, ficando sob responsabilidade do cliente.",
  "   21.1. As escadas precisam ter o piso dos degraus instalado para que possa ser realizada a medição técnica e prosseguir com a fabricação do guarda-corpo.",
  "   21.2. Informar à contratada sobre quaisquer desnivelamentos de piso nos locais onde a instalação será executada antes da assinatura do contrato; o descumprimento pode acarretar custos adicionais, os quais serão negociados e repassados ao cliente.",
  "22. Fornecer energia elétrica para que a contratada possa utilizar o maquinário necessário.",
  "23. Disponibilizar local seguro para guardar maquinário e matéria-prima.",
  "24. Entregar as plantas de todas as tubulações, conforme itens 8 e 9 das “Informações Gerais”, quando da medição ou, no mais tardar, antes da instalação.",
  "25. Fornecer e instalar andaimes, equipamentos de içamento ou outros, caso seja necessário para a execução da instalação contratada.",
  "26. Se for necessário remover um guarda-corpo existente, a Ferreira Ulhoa poderá fazê-lo se estiver parafusado. No caso de estar chumbado, o contratante é responsável por providenciar a retirada.",
  "27. Remover e reinstalar redes de segurança, sempre que necessário para a execução da instalação contratada.",
  "28. Fornecer e executar todos os trabalhos não explicitados no escopo da proposta.",
  "29. Permitir o acesso dos funcionários da contratada às dependências da unidade habitacional para execução da instalação, desde que devidamente identificados, portando crachá e/ou uniforme.",
  "30. Pagar nas datas acordadas o preço dos produtos conforme cronograma de pagamento localizado no quadro inicial da proposta em “Pagamento”.",
  "31. Receber e verificar os produtos para identificação de vícios visíveis, para que possam ser solucionados imediatamente pela contratada, ressalvando-se a responsabilidade desta por vícios ocultos.",
  "32. Não modificar total ou parcialmente o objeto do contrato, salvo por acordo entre as partes.",
  "33. Cumprir as obrigações contratuais, sob pena de pagamento da multa de 50% (item 4 das Informações Gerais) e ressarcimento, especialmente na confecção dos produtos encomendados.",
  "34. É de inteira responsabilidade do contratante, engenheiros e arquitetos respeitar as normas da prefeitura, principalmente no que diz respeito ao Habite-se, isentando a contratada de qualquer responsabilidade acerca dessas situações. A contratada não possui responsabilidade de averiguação ou autorização de projetos e liberações junto à prefeitura ou normas de condomínio que porventura pertençam ao imóvel do contratante, sendo responsável apenas pela instalação dos produtos adquiridos conforme contrato.",
  "",

  "PRAZO",
  "─────",
  "35. O descumprimento das obrigações da contratada descritas acima pode resultar em atrasos na conclusão e/ou instalação dentro do prazo estabelecido.",
  "   35.1. Esse atraso por culpa do contratante não exime o mesmo de quitar a(s) parcela(s) dentro da(s) data(s) prevista(s).",
  "36. O prazo de entrega e instalação poderá ser alterado devido a fatores externos e alheios ao controle da contratada, tais como:",
  "   • Condições climáticas adversas (por exemplo, chuva), que impossibilitam a realização de qualquer tipo de instalação ao ar livre;",
  "   • Atrasos por parte dos fornecedores de materiais e insumos necessários para a fabricação e instalação dos produtos, desde que informado pela contratada;",
  "   • Atrasos na liberação de todas as áreas da obra por parte do contratante, necessárias para a execução da(s) instalação(ões). Essa liberação só pode ocorrer quando todo acabamento e piso final da obra já tiver sido colocado, especialmente em áreas que contêm inclinação.",
  "37. A contratada não se responsabiliza por quaisquer danos, prejuízos ou custos adicionais decorrentes de atrasos ocasionados pelos fatores mencionados no item 36.",
  "38. O prazo de entrega é contado apenas a partir do dia útil subsequente à aprovação do projeto pelo contratante, desde que tenha sido feito o pagamento da entrada e a medição definitiva no local."
];

  const texto = linhas.join("\n");

  textarea.value = texto;
  console.log("✅ Condições gerais com diagramação preenchidas.");

  // Pré-visualização FIEL ao texto do contrato
  const preview = document.getElementById("condicoesPreview");
  if (preview) {
    // garante que as quebras e alinhamentos sejam respeitados
    preview.style.whiteSpace = "pre-wrap";
    preview.style.fontFamily = "monospace";
    preview.textContent = texto;
  }
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
