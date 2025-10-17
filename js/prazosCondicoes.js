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

function preencherCondicoesGeraisComDiagramacao() {
  const textarea = document.getElementById("condicoesGerais");
  if (!textarea) {
    console.warn("⚠️ Campo 'condicoesGerais' não encontrado.");
    return;
  }

  const texto = `
INFORMAÇÕES GERAIS
──────────────────
1. Validade da proposta: 3 dias.
2. Os valores acima mencionados estão sujeitos a alterações caso ocorram mudanças nas medidas ou especificações dos produtos discriminados e/ou informados pelo contratante.
3. Caso ocorra atraso em qualquer um dos pagamentos, será cobrado juros no valor de 0,033% ao dia de atraso.
4. O cancelamento deste contrato após a assinatura e/ou autorização por e-mail acarretará em uma multa de 50% (cinquenta por cento) sobre o valor total acordado, exceto nos casos de eventos fortuitos ou de força maior. Além disso, ficam ressalvados quaisquer outros danos causados à parte inocente.
5. As medições e instalações inclusas neste contrato serão realizadas somente durante o horário comercial.
   5.1. Se for necessário realizar instalações fora do horário comercial (das 7:00 às 17:00) e/ou em finais de semana/feriados, os custos adicionais serão negociados e repassados ao cliente.
6. Os vidros estão sujeitos a quebras durante o processo de fabricação, transporte e instalação. Caso isso ocorra, a reposição dependerá do prazo estipulado pela distribuidora, com o que o Contratante desde já anui.
7. Após a assinatura deste instrumento contratual, a Contratante deverá liberar, em até 30 dias, o espaço em que será realizada a instalação para medição técnica. Após este período, poderá haver alteração no valor devido a possíveis aumentos no custo da matéria-prima, como aço inox, aço carbono, vidro, entre outros.
8. A contratante tem a responsabilidade de informar à contratada a localização exata das tubulações e manta, além de entregar as plantas de todas tubulações quando da medição ou, no mais tardar, antes da instalação.
9. Fica excluída a responsabilidade da contratada por danos às tubulações elétricas, hidráulicos e manta.
10. Não estão inclusos no orçamento trabalhos extras de serralheria, elétrica, pintura, alvenaria, gesso, marcenaria, andaimes, içamento.
11. A contratada não se responsabiliza pela qualidade física e resistência dos materiais utilizados na obra civil.
12. A contratada não se responsabiliza por contaminações posteriores resultantes da utilização de produtos ácidos aplicados nos pisos ou em estruturas de aço (por exemplo: ácido clorídrico, ácidos clorados).
13. O contratante autoriza a contratada a realizar o registro fotográfico da instalação realizada descrita no presente contrato, durante ou após a sua conclusão, para finalidades de utilização como material de marketing e propaganda exclusivamente nos canais de comunicação da contratada.
14. Não é de responsabilidade da contratada a confecção e faturamento dos vidros e calhas, tendo liberalidade do contratante que a empresa faça o pedido e faturamento para ele.
15. O contratante declara estar ciente de que o faturamento do presente orçamento/pedido poderá ser realizado parte como Produto (NF-e), emitido pela FERREIRA ULHOA METAIS, e parte como Serviço (NFS-e), emitido pela FERREIRA ULHOA SERVIÇOS, conforme a natureza da operação, podendo as notas fiscais serem emitidas em CNPJs distintos da contratada, de acordo com a legislação vigente.

OBRIGAÇÕES DA CONTRATADA
────────────────────────
16. Utilizar mão de obra especializada contratada de acordo com a legislação vigente, responsabilizando-se pelos encargos trabalhistas, fiscais e previdenciários, prestando contas ao contratante do cumprimento das obrigações mencionadas, entre outras.
17. Entregar, instalar e montar os produtos objeto deste contrato sem quaisquer danos ou avarias.
18. Oferecer assistência técnica gratuita e garantia total da instalação e materiais utilizados pelo período de 6 (seis) meses, incluindo a responsabilidade por erro de projeto, instalação, montagem e qualidade dos produtos, exceto por quebra e arranhões.
19. Assumir responsabilidade civil e técnica pela instalação e produtos utilizados, bem como por danos causados ao contratante, suas unidades habitacionais, condôminos e terceiros durante a execução do contrato e nos prazos fixados no item anterior.
20. Entregar os produtos no prazo estipulado nos anexos, exceto em casos de força maior (atraso na entrega do material pelos fornecedores ou intempéries naturais, como chuva). Tais eventos serão registrados em ata entre as partes, detalhando os fatos, atrasos e novas previsões para entrega e conclusão da instalação, sendo parte integrante do contrato.

OBRIGAÇÕES DA CONTRATANTE
─────────────────────────
21. Liberar a área de trabalho e os vãos dentro do prazo acordado. Caso a obra não esteja liberada para instalação, a empresa poderá entregar o material, ficando sob responsabilidade do cliente.
   21.1. As escadas precisam ter o piso dos degraus instalado para que possa ser realizada a medição técnica e prosseguir com a fabricação do guarda-corpo.
   21.2. Informar à contratada sobre quaisquer desnivelamentos de piso nos locais onde a instalação será executada antes da assinatura do contrato; o descumprimento pode acarretar custos adicionais, os quais serão negociados e repassados ao cliente.
22. Fornecer energia elétrica para que a contratada possa utilizar o maquinário necessário.
23. Disponibilizar local seguro para guardar maquinário e matéria-prima.
24. Entregar as plantas de todas as tubulações, conforme itens 8 e 9 das “Informações Gerais”, quando da medição ou, no mais tardar, antes da instalação.
25. Fornecer e instalar andaimes, equipamentos de içamento ou outros, caso seja necessário para a execução da instalação contratada.
26. Se for necessário remover um guarda-corpo existente, a Ferreira Ulhoa poderá fazê-lo se estiver parafusado. No caso de estar chumbado, o contratante é responsável por providenciar a retirada.
27. Remover e reinstalar redes de segurança, sempre que necessário para a execução da instalação contratada.
28. Fornecer e executar todos os trabalhos não explicitados no escopo da proposta.
29. Permitir o acesso dos funcionários da contratada às dependências da unidade habitacional para execução da instalação, desde que devidamente identificados, portando crachá e/ou uniforme.
30. Pagar nas datas acordadas o preço dos produtos conforme cronograma de pagamento localizado no quadro inicial da proposta em “Pagamento”.
31. Receber e verificar os produtos para identificação de vícios visíveis, para que possam ser solucionados imediatamente pela contratada, ressalvando-se a responsabilidade desta por vícios ocultos.
32. Não modificar total ou parcialmente o objeto do contrato, salvo por acordo entre as partes.
33. Cumprir as obrigações contratuais, sob pena de pagamento da multa de 50% (item 4 das Informações Gerais) e ressarcimento, especialmente na confecção dos produtos encomendados.
34. É de inteira responsabilidade do contratante, engenheiros e arquitetos respeitar as normas da prefeitura, principalmente no que diz respeito ao Habite-se, isentando a contratada de qualquer responsabilidade acerca dessas situações. A contratada não possui responsabilidade de averiguação ou autorização de projetos e liberações junto à prefeitura ou normas de condomínio que porventura pertençam ao imóvel do contratante, sendo responsável apenas pela instalação dos produtos adquiridos conforme contrato.

PRAZO
─────
35. O descumprimento das obrigações da contratada descritas acima pode resultar em atrasos na conclusão e/ou instalação dentro do prazo estabelecido.
   35.1. Esse atraso por culpa do contratante não exime o mesmo de quitar a(s) parcela(s) dentro da(s) data(s) prevista(s).
36. O prazo de entrega e instalação poderá ser alterado devido a fatores externos e alheios ao controle da contratada, tais como:
   • Condições climáticas adversas (por exemplo, chuva), que impossibilitam a realização de qualquer tipo de instalação ao ar livre;
   • Atrasos por parte dos fornecedores de materiais e insumos necessários para a fabricação e instalação dos produtos, desde que informado pela Contratada;
   • Atrasos na liberação de todas as áreas da obra por parte do Contratante, necessárias para a execução da(s) instalação(ões). Essa liberação só pode ocorrer quando todo acabamento e piso final da obra já tiver sido colocado, especialmente em áreas que contêm inclinação.
37. A contratada não se responsabiliza por quaisquer danos, prejuízos ou custos adicionais decorrentes de atrasos ocasionados pelos fatores mencionados no item 36.
38. O prazo de entrega é contado apenas a partir do dia útil subsequente à aprovação do projeto pelo contratante, desde que tenha sido feito o pagamento da entrada e a medição definitiva no local.
  `.trim();

  textarea.value = texto;
  console.log("✅ Condições gerais com diagramação preenchidas.");

  // Pré-visualização HTML opcional (títulos em negrito)
  const preview = document.getElementById("condicoesPreview");
  if (preview) {
    preview.innerHTML = `
      <h3 style="margin:8px 0;">INFORMAÇÕES GERAIS</h3>
      <ol start="1" style="padding-left:20px;">
        <li>Validade da proposta: 3 dias.</li>
        <li>Os valores acima mencionados estão sujeitos a alterações caso ocorram mudanças nas medidas ou especificações dos produtos discriminados e/ou informados pelo contratante.</li>
        <li>Caso ocorra atraso em qualquer um dos pagamentos, será cobrado juros no valor de 0,033% ao dia de atraso.</li>
        <li>O cancelamento deste contrato após a assinatura e/ou autorização por e-mail acarretará em uma multa de 50% (cinquenta por cento) sobre o valor total acordado, exceto nos casos de eventos fortuitos ou de força maior. Além disso, ficam ressalvados quaisquer outros danos causados à parte inocente.</li>
        <li>As medições e instalações inclusas neste contrato serão realizadas somente durante o horário comercial.
          <ul style="margin-top:6px;">
            <li>5.1. Se for necessário realizar instalações fora do horário comercial (das 7:00 às 17:00) e/ou em finais de semana/feriados, os custos adicionais serão negociados e repassados ao cliente.</li>
          </ul>
        </li>
        <li>Os vidros estão sujeitos a quebras durante o processo de fabricação, transporte e instalação. Caso isso ocorra, a reposição dependerá do prazo estipulado pela distribuidora, com o que o Contratante desde já anui.</li>
        <li>Após a assinatura deste instrumento contratual, a Contratante deverá liberar, em até 30 dias, o espaço em que será realizada a instalação para medição técnica. Após este período, poderá haver alteração no valor devido a possíveis aumentos no custo da matéria-prima, como aço inox, aço carbono, vidro, entre outros.</li>
        <li>A contratante tem a responsabilidade de informar à contratada a localização exata das tubulações e manta, além de entregar as plantas de todas tubulações quando da medição ou, no mais tardar, antes da instalação.</li>
        <li>Fica excluída a responsabilidade da contratada por danos às tubulações elétricas, hidráulicos e manta.</li>
        <li>Não estão inclusos no orçamento trabalhos extras de serralheria, elétrica, pintura, alvenaria, gesso, marcenaria, andaimes, içamento.</li>
        <li>A contratada não se responsabiliza pela qualidade física e resistência dos materiais utilizados na obra civil.</li>
        <li>A contratada não se responsabiliza por contaminações posteriores resultantes da utilização de produtos ácidos aplicados nos pisos ou em estruturas de aço (por exemplo: ácido clorídrico, ácidos clorados).</li>
        <li>O contratante autoriza a contratada a realizar o registro fotográfico da instalação realizada descrita no presente contrato, durante ou após a sua conclusão, para finalidades de utilização como material de marketing e propaganda exclusivamente nos canais de comunicação da contratada.</li>
        <li>Não é de responsabilidade da contratada a confecção e faturamento dos vidros e calhas, tendo liberalidade do contratante que a empresa faça o pedido e faturamento para ele.</li>
        <li>O contratante declara estar ciente de que o faturamento do presente orçamento/pedido poderá ser realizado parte como Produto (NF-e), emitido pela FERREIRA ULHOA METAIS, e parte como Serviço (NFS-e), emitido pela FERREIRA ULHOA SERVIÇOS, conforme a natureza da operação, podendo as notas fiscais serem emitidas em CNPJs distintos da contratada, de acordo com a legislação vigente.</li>
      </ol>

      <h3 style="margin:12px 0 8px;">OBRIGAÇÕES DA CONTRATADA</h3>
      <ol start="16" style="padding-left:20px;">
        <li>Utilizar mão de obra especializada contratada de acordo com a legislação vigente, responsabilizando-se pelos encargos trabalhistas, fiscais e previdenciários, prestando contas ao contratante do cumprimento das obrigações mencionadas, entre outras.</li>
        <li>Entregar, instalar e montar os produtos objeto deste contrato sem quaisquer danos ou avarias.</li>
        <li>Oferecer assistência técnica gratuita e garantia total da instalação e materiais utilizados pelo período de 6 (seis) meses, incluindo a responsabilidade por erro de projeto, instalação, montagem e qualidade dos produtos, exceto por quebra e arranhões.</li>
        <li>Assumir responsabilidade civil e técnica pela instalação e produtos utilizados, bem como por danos causados ao contratante, suas unidades habitacionais, condôminos e terceiros durante a execução do contrato e nos prazos fixados no item anterior.</li>
        <li>Entregar os produtos no prazo estipulado nos anexos, exceto em casos de força maior (atraso na entrega do material pelos fornecedores ou intempéries naturais, como chuva). Tais eventos serão registrados em ata entre as partes, detalhando os fatos, atrasos e novas previsões para entrega e conclusão da instalação, sendo parte integrante do contrato.</li>
      </ol>

      <h3 style="margin:12px 0 8px;">OBRIGAÇÕES DA CONTRATANTE</h3>
      <ol start="21" style="padding-left:20px;">
        <li>Liberar a área de trabalho e os vãos dentro do prazo acordado. Caso a obra não esteja liberada para instalação, a empresa poderá entregar o material, ficando sob responsabilidade do cliente.
          <ul style="margin-top:6px;">
            <li>21.1. As escadas precisam ter o piso dos degraus instalado para que possa ser realizada a medição técnica e prosseguir com a fabricação do guarda-corpo.</li>
            <li>21.2. Informar à contratada sobre quaisquer desnivelamentos de piso antes da assinatura do contrato; o descumprimento pode acarretar custos adicionais, os quais serão negociados e repassados ao cliente.</li>
          </ul>
        </li>
        <li>Fornecer energia elétrica para que a contratada possa utilizar o maquinário necessário.</li>
        <li>Disponibilizar local seguro para guardar maquinário e matéria-prima.</li>
        <li>Entregar as plantas de todas as tubulações, conforme itens 8 e 9 das “Informações Gerais”.</li>
        <li>Fornecer e instalar andaimes, equipamentos de içamento ou outros, caso necessário.</li>
        <li>Se for necessário remover um guarda-corpo existente, a Ferreira Ulhoa poderá fazê-lo se estiver parafusado. Se estiver chumbado, a retirada é de responsabilidade do contratante.</li>
        <li>Remover e reinstalar redes de segurança, sempre que necessário.</li>
        <li>Executar trabalhos não explicitados no escopo da proposta, quando aplicável.</li>
        <li>Permitir o acesso dos funcionários da contratada, devidamente identificados.</li>
        <li>Pagar nas datas acordadas conforme cronograma de “Pagamento”.</li>
        <li>Receber e verificar os produtos para vícios visíveis, ressalvados os vícios ocultos.</li>
        <li>Não modificar o objeto do contrato sem acordo entre as partes.</li>
        <li>Cumprir as obrigações contratuais, sob pena de multa (item 4 das Informações Gerais) e ressarcimentos.</li>
        <li>Responsabilizar-se por normas da prefeitura (Habite-se) e de condomínio; a contratada não responde por averiguações/autorizações junto a órgãos públicos.</li>
      </ol>

      <h3 style="margin:12px 0 8px;">PRAZO</h3>
      <ol start="35" style="padding-left:20px;">
        <li>O descumprimento das obrigações da contratada pode resultar em atrasos na conclusão e/ou instalação.</li>
        <li>35.1. Atraso por culpa do contratante não o exime de quitar parcelas nas datas previstas.</li>
        <li>O prazo de entrega/instalação pode ser alterado por fatores externos (clima, fornecedores, liberação de áreas da obra).</li>
        <li>A contratada não se responsabiliza por danos/prejuízos/custos adicionais decorrentes desses atrasos.</li>
        <li>O prazo conta a partir do dia útil subsequente à aprovação do projeto, com entrada paga e medição definitiva realizada.</li>
      </ol>
    `.trim();
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
