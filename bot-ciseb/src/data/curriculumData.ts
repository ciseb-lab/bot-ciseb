/**
 * Catálogo local de registros curriculares e sugestões pedagógicas.
 * Estes registros não foram necessariamente conferidos nos PDFs disponíveis.
 * Use curriculumVerification.ts antes de apresentar qualquer registro como confirmado.
 */

export interface CurriculumSkill {
  code: string;
  verbatimText: string;
  sourceDocument: string;
  stage: string; // ex: "1º ano EF", "6º ao 9º ano EF", "1º ao 3º ano EM"
  component: string; // ex: "Computação", "Ciências", "Matemática", "Língua Portuguesa"
  axisOrThematicUnit: string; // ex: "Pensamento Computacional", "Mundo Digital", "Cultura Digital", "Terra e Universo"
  objectsOfKnowledge: string;
  dinovGuidelines?: string; // Diretriz prática CISEB / Contexto Amazônico
}

export const CURRICULUM_CATALOG_RECORDS: CurriculumSkill[] = [
  // ==========================================
  // COMPUTAÇÃO - EDUCAÇÃO BÁSICA (MEC 2022 / RESOLUÇÃO CNE/CP Nº 1/2022)
  // EIXO: PENSAMENTO COMPUTACIONAL
  // ==========================================
  {
    code: "EF01CO01",
    verbatimText: "Identificar e seguir instruções passo a passo (algoritmos) para realizar tarefas do cotidiano, brincadeiras ou desafios lúdicos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Algoritmos na vida cotidiana; Sequenciamento lógico simples",
    dinovGuidelines: "Abordagem desplugada através de cantigas de roda e trajetos espaciais na escola ou no quintal."
  },
  {
    code: "EF01CO02",
    verbatimText: "Criar e representar pequenos conjuntos de instruções ordenadas usando linguagem natural, desenhos, gestos ou símbolos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Representação de instruções; Simbolização de comandos",
    dinovGuidelines: "Cartões de setas de direção em papel craft e caminhos demarcados no chão da sala."
  },
  {
    code: "EF02CO01",
    verbatimText: "Identificar padrões e repetições em sequências visuais, sonoras, temporais ou corporais e usá-los para prever os próximos passos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "2º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Reconhecimento de padrões; Estruturas repetitivas simples",
    dinovGuidelines: "Conexão com os ritmos tradicionais paraenses (carimbó, siriá) e grafismos marajoaras e tapajônicos."
  },
  {
    code: "EF03CO01",
    verbatimText: "Decompor problemas simples em subproblemas menores e resolver cada um de forma ordenada para alcançar o objetivo final.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "3º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Decomposição; Estruturação de etapas",
    dinovGuidelines: "Resolução colaborativa de desafios do dia a dia da comunidade escolar e separação de resíduos sólidos."
  },
  {
    code: "EF04CO01",
    verbatimText: "Construir e testar algoritmos que utilizem estruturas condicionais simples ('se... então') para tomada de decisão em situações práticas.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "4º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Lógica condicional; Tomada de decisões em algoritmos",
    dinovGuidelines: "Jogos de tabuleiro pedagógicos criados com papelão reciclável nos Laboratórios Maker CISEB."
  },
  {
    code: "EF05CO01",
    verbatimText: "Desenvolver pequenos programas utilizando blocos visuais, aplicando sequências, laços de repetição e variáveis para criar narrativas ou jogos interativos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "5º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Programação visual em blocos; Criação de animações e jogos",
    dinovGuidelines: "Projetos no Scratch com lendas amazônicas (Curupira, Vitória-Régia, Boto) e fauna paraense."
  },
  {
    code: "EF06CO01",
    verbatimText: "Compreender e aplicar o conceito de abstração para filtrar detalhes irrelevantes e focar nas características essenciais para modelar um problema computacional.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "6º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Abstração e modelagem conceitual de dados",
    dinovGuidelines: "Mapeamento dos rios, igarapés e rotas fluviais de transporte escolar no Pará."
  },
  {
    code: "EF07CO01",
    verbatimText: "Elaborar algoritmos eficientes empregando laços condicionais ('enquanto', 'repita até') e depurar erros de lógica por meio de testes sistemáticos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "7º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Laços condicionais; Depuração (debugging); Eficiência algorítmica",
    dinovGuidelines: "Automação de rega sustentável para hortas escolares utilizando placas de prototipagem e sensores de umidade."
  },
  {
    code: "EF08CO01",
    verbatimText: "Desenvolver soluções computacionais que envolvam modularização (funções/procedimentos) e passagem de parâmetros para resolver problemas complexos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "8º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Modularização; Sub-rotinas e reutilização de código",
    dinovGuidelines: "Sistemas modulares de monitoramento de temperatura e qualidade do ar em salas de aula públicas."
  },
  {
    code: "EF09CO01",
    verbatimText: "Modelar e implementar algoritmos para coleta, tratamento, armazenamento e análise de dados tabulares voltados à investigação científica ou cidadã.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "9º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Tratamento de dados; Análise computacional; Investigação científica",
    dinovGuidelines: "Coleta e tabulação de dados climáticos locais e pluviosidade em municípios paraenses."
  },

  // ==========================================
  // COMPUTAÇÃO - EIXO: MUNDO DIGITAL (HARDWARE, REDES, DADOS)
  // ==========================================
  {
    code: "EF01CO03",
    verbatimText: "Reconhecer diferentes dispositivos computacionais presentes no cotidiano (celulares, computadores, tablets, periféricos) e suas funções básicas.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Mundo Digital",
    objectsOfKnowledge: "Dispositivos digitais e seus usos na vida pessoal e social",
    dinovGuidelines: "Apresentação tátil de periféricos e desmontagem orientada de peças limpas e seguras."
  },
  {
    code: "EF03CO03",
    verbatimText: "Diferenciar hardware (parte física) e software (programas e aplicativos), identificando dispositivos de entrada, processamento, saída e armazenamento de dados.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "3º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Mundo Digital",
    objectsOfKnowledge: "Arquitetura básica de computadores; Hardware versus Software",
    dinovGuidelines: "Classificação lúdica dos componentes de um computador reaproveitado em kits maker CISEB."
  },
  {
    code: "EF06CO03",
    verbatimText: "Compreender como a informação é codificada, digitalizada e transmitida em formato binário (bits e bytes) através de redes de comunicação.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "6º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Mundo Digital",
    objectsOfKnowledge: "Representação binária; Codificação de texto, imagens e sons",
    dinovGuidelines: "Cartões de bits desplugados e criptografia simples com desafios entre equipes de estudantes."
  },
  {
    code: "EF08CO03",
    verbatimText: "Compreender a estrutura de redes de computadores, a internet, o funcionamento dos protocolos de comunicação e as medidas de segurança de dados e privacidade.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "8º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Mundo Digital",
    objectsOfKnowledge: "Redes de computadores; Topologias; Roteamento; Segurança da informação",
    dinovGuidelines: "Simulação do caminho de um pacote de dados da Amazônia até um servidor central na nuvem."
  },

  // ==========================================
  // COMPUTAÇÃO - EIXO: CULTURA DIGITAL
  // ==========================================
  {
    code: "EF02CO03",
    verbatimText: "Reconhecer a importância do respeito mútuo, da privacidade e do cuidado com o tempo de uso de telas e tecnologias digitais.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "2º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Uso consciente de telas; Convivência saudável e empática nos ambientes digitais",
    dinovGuidelines: "Roda de conversa mediada sobre brincadeiras ao ar livre e rotina equilibrada de tecnologia."
  },
  {
    code: "EF05CO03",
    verbatimText: "Identificar fontes confiáveis de informação na internet, exercitando o senso crítico quanto a boatos e conteúdos desinformativos (fake news).",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "5º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Letramento informacional; Verificação de fontes; Combate à desinformação",
    dinovGuidelines: "Oficina 'Detetives da Notícia' avaliando notícias sobre preservação ambiental e queimadas no Pará."
  },
  {
    code: "EF07CO03",
    verbatimText: "Avaliar os impactos sociais, culturais, econômicos e ambientais da tecnologia digital, incluindo a geração e o descarte de lixo eletrônico.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "7º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Lixo eletrônico (e-waste); Economia circular; Pegada ecológica digital",
    dinovGuidelines: "Campanha escolar de coleta e recondicionamento de lixo eletrônico alinhada ao ODS 12."
  },
  {
    code: "EF09CO03",
    verbatimText: "Analisar criticamente o papel dos algoritmos de recomendação, o tratamento de dados pessoais segundo a LGPD e o combate ao cyberbullying e discursos de ódio.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "9º ano EF",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Algoritmos e modulação de comportamento; LGPD; Direitos humanos na rede",
    dinovGuidelines: "Debate estruturado sobre bolhas sociais digitais e respeito à diversidade cultural paraense."
  },

  // ==========================================
  // ENSINO MÉDIO - COMPUTAÇÃO (MEC 2022 / RESOLUÇÃO CNE/CP Nº 1/2022)
  // ==========================================
  {
    code: "EM13CO01",
    verbatimText: "Compreender e aplicar técnicas avançadas de decomposição, reconhecimento de padrões, abstração e algoritmos na formulação de soluções para problemas complexos de diversas áreas do conhecimento.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ao 3º ano EM",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Resolução computacional de problemas complexos; Modelagem interdisciplinar",
    dinovGuidelines: "Projetos integradores conectando bioeconomia paraense e modelos de previsão agrícola sustentável."
  },
  {
    code: "EM13CO02",
    verbatimText: "Implementar algoritmos utilizando linguagens de programação textuais, aplicando estruturas de dados lineares e não-lineares para manipular dados estruturados.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ao 3º ano EM",
    component: "Computação",
    axisOrThematicUnit: "Pensamento Computacional",
    objectsOfKnowledge: "Linguagem de programação textual (ex: Python, JavaScript); Estruturas de dados",
    dinovGuidelines: "Desenvolvimento de aplicações web comunitárias para feirantes e cooperativas agroextrativistas."
  },
  {
    code: "EM13CO07",
    verbatimText: "Analisar os princípios de funcionamento dos sistemas operacionais, arquitetura em nuvem, computação ubíqua e dispositivos da Internet das Coisas (IoT).",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ao 3º ano EM",
    component: "Computação",
    axisOrThematicUnit: "Mundo Digital",
    objectsOfKnowledge: "IoT (Internet das Coisas); Sistemas embarcados; Sensores e nuvem",
    dinovGuidelines: "Prototipagem de estações meteorológicas escolares para monitoramento do microclima amazônico."
  },
  {
    code: "EM13CO13",
    verbatimText: "Avaliar criticamente o impacto da Inteligência Artificial, do aprendizado de máquina e da automação no mundo do trabalho, na sociedade e nos direitos humanos.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ao 3º ano EM",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Inteligência Artificial Ética; Viés algorítmico; Futuro do trabalho",
    dinovGuidelines: "Análise de vieses algorítmicos em relação a comunidades ribeirinhas, quilombolas e indígenas da Amazônia."
  },
  {
    code: "EM13CO14",
    verbatimText: "Exercer a cidadania digital com autonomia, responsabilidade, ética e respeito à legislação vigente sobre propriedade intelectual, direitos autorais e licenças abertas.",
    sourceDocument: "Computação: Complemento à BNCC (MEC 2022)",
    stage: "1º ao 3º ano EM",
    component: "Computação",
    axisOrThematicUnit: "Cultura Digital",
    objectsOfKnowledge: "Propriedade intelectual; Creative Commons; Software livre; Cidadania digital",
    dinovGuidelines: "Criação de repositórios de Recursos Educacionais Abertos (REA) com foco na cultura e saberes paraenses."
  },

  // ==========================================
  // CURRÍCULO PARAENSE - CIÊNCIAS DA NATUREZA (SEDUC-PA)
  // ==========================================
  {
    code: "EF06CI04PA",
    verbatimText: "Classificar diferentes ecossistemas paraenses e suas bacias hidrográficas, analisando as relações entre os seres vivos e os fatores abióticos locais.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "6º ano EF",
    component: "Ciências da Natureza",
    axisOrThematicUnit: "Vida e Evolução",
    objectsOfKnowledge: "Ecossistemas amazônicos; Igarapés, várzeas e terra firme no Pará",
    dinovGuidelines: "Construção de sensores de turbidez e pH da água utilizando Arduíno/sucata eletrônica no CISEB."
  },
  {
    code: "EF07CI08PA",
    verbatimText: "Avaliar o impacto das atividades humanas (desmatamento, queimadas, mineração e expansão agropecuária) sobre a biodiversidade amazônica e propor ações sustentáveis mitigadoras.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "7º ano EF",
    component: "Ciências da Natureza",
    axisOrThematicUnit: "Vida e Evolução",
    objectsOfKnowledge: "Impactos socioambientais na Amazônia; Desenvolvimento sustentável",
    dinovGuidelines: "Visualização e análise de dados de satélite públicos (INPE/Prodes) em salas de informática."
  },
  {
    code: "EF09CI13PA",
    verbatimText: "Discutir a importância das Unidades de Conservação e dos Territórios Indígenas e Quilombolas para a preservação climática global e o equilíbrio ecológico do Pará.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "9º ano EF",
    component: "Ciências da Natureza",
    axisOrThematicUnit: "Terra e Universo",
    objectsOfKnowledge: "Mudanças climáticas; Governança territorial; COP30 e justiça climática",
    dinovGuidelines: "Criação de mapas interativos comunitários com ferramentas de georreferenciamento aberto."
  },
  {
    code: "EM13CNT302PA",
    verbatimText: "Comunicar, para públicos diversificados, em contextos variados, resultados de investigações científicas sobre a transição ecológica e os biomas paraenses, considerando as tecnologias socioambientais.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "1º ao 3º ano EM",
    component: "Ciências da Natureza",
    axisOrThematicUnit: "Matéria e Energia / Vida e Evolução",
    objectsOfKnowledge: "Tecnologias socioambientais; Transição justa; Divulgação científica",
    dinovGuidelines: "Produção de podcasts e infográficos digitais escolares sobre bioeconomia paraense."
  },

  // ==========================================
  // CURRÍCULO PARAENSE - MATEMÁTICA (SEDUC-PA)
  // ==========================================
  {
    code: "EF04MA02PA",
    verbatimText: "Mostrar, por decomposição e composição, que todo número natural pode ser escrito por meio de adições e multiplicações por potências de dez, para compreender o sistema de numeração decimal e sua relação com sistemas de contagem tradicionais.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "4º ano EF",
    component: "Matemática",
    axisOrThematicUnit: "Números",
    objectsOfKnowledge: "Sistema de numeração decimal; Decomposição de ordens e classes",
    dinovGuidelines: "Abordagem com ábaco paraense e relação com o sistema binário computacional."
  },
  {
    code: "EF07MA04PA",
    verbatimText: "Resolver e elaborar problemas que envolvam operações com números inteiros e racionais, contextualizados na economia local (produção de açaí, cacau, pesca artesanal e mandioca no Pará).",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "7º ano EF",
    component: "Matemática",
    axisOrThematicUnit: "Números",
    objectsOfKnowledge: "Operações com racionais; Cadeias produtivas agroextrativistas paraenses",
    dinovGuidelines: "Planilhas eletrônicas e algoritmos de cálculo de custos e precificação justa solidária."
  },
  {
    code: "EM13MAT301PA",
    verbatimText: "Resolver e elaborar problemas do cotidiano, da matemática e de outras áreas do conhecimento, que envolvem conceitos de estatística e probabilidade, utilizando recursos tecnológicos e planilhas dinâmicas.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "1º ao 3º ano EM",
    component: "Matemática",
    axisOrThematicUnit: "Estatística e Probabilidade",
    objectsOfKnowledge: "Análise de dados estatísticos; Amostragem; Modelagem computacional",
    dinovGuidelines: "Pesquisa quantitativa sobre hábitos de consumo de energia e resíduos na escola com dashboard dinâmico."
  },

  // ==========================================
  // CURRÍCULO PARAENSE - LINGUAGENS (SEDUC-PA)
  // ==========================================
  {
    code: "EF15LP01PA",
    verbatimText: "Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente e nas mídias digitais, considerando a situação comunicativa e o tema.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "1º ao 5º ano EF",
    component: "Língua Portuguesa",
    axisOrThematicUnit: "Leitura/Escuta",
    objectsOfKnowledge: "Reconstrução das condições de produção e recepção de textos digitais",
    dinovGuidelines: "Leitura orientada de murais virtuais escolares e postagens institucionais da SEDUC."
  },
  {
    code: "EF69LP06PA",
    verbatimText: "Produzir e publicar notícias, fotorreportagens, podcasts e videominutos em ambientes digitais escolares, com ética e respeito aos direitos humanos e à diversidade cultural do Pará.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "6º ao 9º ano EF",
    component: "Língua Portuguesa",
    axisOrThematicUnit: "Produção de Textos",
    objectsOfKnowledge: "Jornalismo escolar digital; Multimodalidade; Ética na publicação",
    dinovGuidelines: "Criação de canal de comunicação escolar para relatar projetos de sustentabilidade."
  },
  {
    code: "EM13LGG303PA",
    verbatimText: "Debater questões controversas de relevância social e ambiental da Amazônia, utilizando mídias digitais para expressar argumentos fundamentados, refutando a desinformação.",
    sourceDocument: "Currículo Paraense (SEDUC-PA)",
    stage: "1º ao 3º ano EM",
    component: "Língua Portuguesa",
    axisOrThematicUnit: "Campo Jornalístico-Midiático",
    objectsOfKnowledge: "Argumentação em ambientes digitais; Checagem de fatos; Cidadania crítica",
    dinovGuidelines: "Círculos de checagem de notícias falsas sobre o clima e a floresta amazônica."
  },

  // ==========================================
  // DIRETRIZES CISEB/DINOV - ROBÓTICA E SUSTENTABILIDADE
  // ==========================================
  {
    code: "DINOV-ROB-01",
    verbatimText: "Projetar protótipos automatizados utilizando sucata eletrônica e materiais recicláveis regionais, aplicando princípios de robótica sustentável de baixo custo para solucionar demandas da comunidade escolar.",
    sourceDocument: "Diretrizes de Robótica Educacional e Sustentabilidade CISEB (DINOV/SEDUC-PA)",
    stage: "Ensino Fundamental e Médio",
    component: "Robótica Educacional",
    axisOrThematicUnit: "Cultura Maker e Robótica Sustentável",
    objectsOfKnowledge: "Circuitos básicos; Sensores acessíveis; Upcycling de lixo eletrônico",
    dinovGuidelines: "Reutilização de coolers de computadores desativados para ventiladores e pequenos geradores didáticos."
  },
  {
    code: "DINOV-ECO-02",
    verbatimText: "Integrar ferramentas digitais e pensamento computacional aos Objetivos de Desenvolvimento Sustentável (ODS) da Agenda 2030, fortalecendo a vocação bioeconômica e a conservação da Amazônia Paraense.",
    sourceDocument: "Diretrizes de Inovação Pedagógica CISEB (DINOV/SEDUC-PA)",
    stage: "Ensino Fundamental e Médio",
    component: "Tecnologia e Sustentabilidade",
    axisOrThematicUnit: "Educação Ambiental e Inovação",
    objectsOfKnowledge: "ODS 4 (Educação de Qualidade), ODS 12 (Consumo Responsável) e ODS 13 (Ação Climática)",
    dinovGuidelines: "Projetos práticos apresentados na Feira Estadual de Ciência, Tecnologia e Inovação da SEDUC."
  }
];

/**
 * Busca exata ou por similaridade no catálogo curricular local
 */
export function findCatalogRecords(query: {
  code?: string;
  stage?: string;
  component?: string;
  theme?: string;
}): CurriculumSkill[] {
  return CURRICULUM_CATALOG_RECORDS.filter(skill => {
    if (query.code) {
      if (skill.code.toLowerCase() === query.code.toLowerCase()) return true;
    }

    let matchStage = true;
    if (query.stage && query.stage.trim()) {
      const qStage = query.stage.toLowerCase().trim();
      const sStage = skill.stage.toLowerCase();
      // Match 1º, 2º, 6º, EF, EM, etc.
      matchStage = sStage.includes(qStage) || qStage.includes(sStage);
    }

    let matchComponent = true;
    if (query.component && query.component.trim()) {
      const qComp = query.component.toLowerCase().trim();
      const sComp = skill.component.toLowerCase();
      matchComponent = sComp.includes(qComp) || qComp.includes(sComp);
    }

    let matchTheme = true;
    if (query.theme && query.theme.trim()) {
      const qTheme = query.theme.toLowerCase().trim();
      const haystack = (
        skill.objectsOfKnowledge + " " +
        skill.verbatimText + " " +
        skill.axisOrThematicUnit + " " +
        (skill.dinovGuidelines || "")
      ).toLowerCase();
      // Split into keywords
      const keywords = qTheme.split(/\s+/).filter(k => k.length > 2);
      matchTheme = keywords.length === 0 || keywords.some(k => haystack.includes(k));
    }

    return (query.code ? false : (matchStage && (matchComponent || matchTheme)));
  });
}

/**
 * Busca exata de um registro no catálogo local, sem validação documental
 */
export function findCatalogRecord(code: string): CurriculumSkill | undefined {
  return CURRICULUM_CATALOG_RECORDS.find(
    s => s.code.trim().toUpperCase() === code.trim().toUpperCase()
  );
}
