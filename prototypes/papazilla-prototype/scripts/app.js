(() => {
  const screens = [...document.querySelectorAll('[data-screen]')];
  const track = document.querySelector('#onboarding-track');
  const dots = [...document.querySelectorAll('[data-go-slide]')];
  const count = document.querySelector('#slide-count');
  const next = document.querySelector('#next-slide');
  const toast = document.querySelector('#prototype-toast');
  const previewLinks = [...document.querySelectorAll('[data-preview]')];
  const storage = { auth: 'papazilla.authenticated', onboarding: 'papazilla.seenOnboarding', pet: 'papazilla.hasPet', subscription: 'papazilla.subscription' };
  let activeSlide = 0;
  let splashTimer;
  let toastTimer;
  let profileStep = 0;
  let recipeStep = 0;
  let profileHealth = new Set(['Nenhuma']);
  let authMode = 'options';
  let profileMode = 'create';
  let profileReturn = 'empty';
  let selectedPet = 'mel';
  let featuredCookCount = 4;
  let recipeDays = 7;
  let recipePreset = 'padrao';
  let recipeSupplement = 'foodDog';
  let userProfileReturn = 'home';
  let paywallReturn = 'recipe';
  let selectedPlan = 'annual';
  let annualPayment = 'upfront';
  let selectedRecipePets = new Set(['mel']);
  let profileSingles = {};
  let profileInputs = {};
  let profileMulti = {};
  let profileConsent = true;

  const curiosityHeroes = [
    ['assets/curiosities/zilla-01-lendo.png', 'Zilla lendo um livro'],
    ['assets/curiosities/zilla-02-ingredientes.png', 'Zilla conhecendo ingredientes frescos'],
    ['assets/curiosities/zilla-03-potinho.png', 'Zilla segurando um potinho de comida'],
    ['assets/curiosities/zilla-04-lupa.png', 'Zilla investigando uma cenoura com uma lupa'],
    ['assets/curiosities/zilla-05-anotando.png', 'Zilla anotando uma descoberta'],
    ['assets/curiosities/zilla-06-geladeira.png', 'Zilla conferindo alimentos na geladeira'],
    ['assets/curiosities/zilla-07-vegetais.png', 'Zilla apresentando vegetais'],
    ['assets/curiosities/zilla-08-balanca.png', 'Zilla observando uma balança'],
    ['assets/curiosities/zilla-09-lavando-potinho.png', 'Zilla lavando o potinho'],
    ['assets/curiosities/zilla-10-descoberta.png', 'Zilla celebrando uma descoberta']
  ];

  function chooseCuriosityHero() {
    const image = document.querySelector('#curiosity-hero-image');
    if (!image) return;
    const last = Number(localStorage.getItem('papazilla.curiosityHeroLast'));
    const choices = curiosityHeroes.map((_, index) => index).filter((index) => index !== last);
    const index = choices[Math.floor(Math.random() * choices.length)];
    image.src = curiosityHeroes[index][0];
    image.alt = curiosityHeroes[index][1];
    localStorage.setItem('papazilla.curiosityHeroLast', String(index));
  }

  const petProfiles = {
    mel: { name: 'Mel', badge: 'Monstrinha da casa', identity: 'Sem raça definida · Fêmea · Castrada', breed: 'Sem raça definida', age: '5 anos', weight: '10', activity: '40–60 min', goal: 'Melhorar a qualidade da alimentação', updated: 'Atualizada hoje' },
    bento: { name: 'Bento', badge: 'Veterano da matilha', identity: 'Golden Retriever · Macho · Castrado', breed: 'Golden Retriever', age: '8 anos', weight: '29', activity: '20–40 min', goal: 'Manter o peso e a disposição', updated: 'Atualizada há 12 dias' }
  };

  const recipePetData = {
    mel: { name: 'Mel', possessive: 'da Mel', meta: '10 kg · adulta · ativa', daily: 320, meal: 160, oil: '1 col. sobremesa/dia', omega: '1 cápsula de 1 g', portraitClass: '' },
    bento: { name: 'Bento', possessive: 'do Bento', meta: '29 kg · adulto · moderado', daily: 800, meal: 400, oil: '1 col. sopa · 2×/dia', omega: '2 cápsulas de 1 g', portraitClass: 'is-bento' }
  };

  function resetProfileAnswers() {
    profileSingles = {
      sex: 'Fêmea', neutered: 'Sim', goal: 'Melhorar a qualidade da alimentação', bodyTop: 'Corpo proporcional, com cintura visível', ribs: 'Consigo sentir facilmente', belly: 'Levemente recolhida', muscleChange: 'Não sei', weightChange: 'Ficou praticamente igual', previousWeightKnown: 'Não sei', activityTime: '40 a 60 minutos', activityType: 'Brincadeiras ativas', appetite: 'Come normalmente', currentFood: 'Ração seca', currentMeals: '2', currentAmountKnown: 'Não sei', treats: '1 a 2 por dia', familyFood: 'Às vezes', stool: 'Firmes e bem formadas', stoolFrequency: '2 vezes por dia', pancreatitisHistory: 'Não sei', urinaryType: 'Não sei', renalStage: 'Não sei', medication: 'Não', supplementsUse: 'Não', lastVet: 'Há menos de 6 meses', bloodTests: 'Sim, estavam normais', avoidProtein: 'Não', intolerance: 'Não', avoidVegetable: 'Não', cookingMethod: 'Panela com água', recipeFormat: 'Os dois', preferredMeals: 'Quero que o Papazilla recomende'
    };
    profileInputs = { name: 'Mel', breed: 'Sem raça definida', age: '5 anos', weight: '10', idealWeight: '', previousWeight: '', currentAmount: '', otherHealth: '', medicationName: '', otherSupplement: '', bloodNotes: '', avoidProteinName: '', intoleranceName: '', avoidVegetableName: '', finalNotes: '' };
    profileHealth = new Set(['Nenhuma']);
    profileMulti = {
      muscle: new Set(['Nenhuma dessas mudanças']), digestion: new Set(['Nenhuma dessas']), health: profileHealth,
      supplements: new Set(), proteins: new Set(['Todas']), carbs: new Set(['Tanto faz (escolham por mim)']), vegetableFavorites: new Set(['Cenoura'])
    };
    profileConsent = true;
  }

  resetProfileAnswers();

  function profileSingleCards(key, options, compact = false) {
    return `<div class="option-stack ${compact ? 'compact-options' : ''}">${options.map((option) => `<button class="select-card" data-profile-choice="${key}" data-profile-value="${option}"><span class="select-card__radio"></span><span>${option}</span></button>`).join('')}</div>`;
  }

  function profilePills(key, options) {
    return `<div class="choice-grid">${options.map((option) => `<button class="choice-pill" data-profile-choice="${key}" data-profile-value="${option}">${option}</button>`).join('')}</div>`;
  }

  function profileMultiCards(key, options) {
    return `<div class="health-grid">${options.map((option) => `<button class="check-card" data-profile-multi="${key}" data-profile-value="${option}"><span>✓</span>${option}</button>`).join('')}</div>`;
  }

  function profileField(key, label, placeholder = '', suffix = '') {
    const inputMode = ['weight', 'idealWeight', 'previousWeight', 'currentAmount'].includes(key) ? 'decimal' : 'text';
    return `<label class="profile-field profile-field--full"><span>${label}</span><div class="${suffix ? 'input-suffix' : ''}"><input data-profile-input="${key}" placeholder="${placeholder}" inputmode="${inputMode}" autocomplete="off">${suffix ? `<span>${suffix}</span>` : ''}</div></label>`;
  }

  function profileTextarea(key, label, placeholder = '') {
    return `<label class="profile-textarea"><span>${label}</span><textarea data-profile-input="${key}" placeholder="${placeholder}"></textarea></label>`;
  }

  const recipeSupplementData = {
    foodDog: { name: 'Food Dog Adulto / Basic', rate: .008, reference: '0,8 g para cada 100 g de comida pronta' },
    nutroplus: { name: 'Nutroplus Manutenção', rate: .006, reference: '0,6 g para cada 100 g de comida pronta' }
  };

  function formatDose(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function recipePetFinalizersMarkup(pets, supplementKey) {
    const product = recipeSupplementData[supplementKey];
    return pets.map((pet, index) => `<details class="pet-finalizer-card" ${pets.length === 1 || index === 0 ? 'open' : ''}>
      <summary><span class="pet-finalizer-card__pet"><i class="recipe-pet-avatar ${pet.portraitClass}"><img src="../papazilla-design-system/assets/icons/zilla.png" alt=""></i><span><strong>${pet.name}</strong><small>${pet.daily} g/dia · ${pet.meal} g por refeição</small></span></span><b>⌄</b></summary>
      <div class="pet-finalizer-card__doses">
        <p><span><strong>${product.name}</strong><small>Vitamínico-mineral · ${product.reference}</small></span><b>${formatDose(pet.daily * product.rate)} g/dia<small>≈ ${formatDose(pet.meal * product.rate)} g/refeição</small></b></p>
        <p><span><strong>Óleo vegetal</strong><small>Azeite, coco ou linhaça dourada</small></span><b>${pet.oil}</b></p>
        <p><span><strong>Óleo de peixe ou krill</strong><small>Diário ou 3× por semana</small></span><b>${pet.omega}</b></p>
        <p class="pet-finalizer-card__salt"><span><strong>Sal integral</strong><small>Somente com dose definida</small></span><b>Orientação individual</b></p>
      </div>
    </details>`).join('');
  }

  function recipePreparationMarkup() {
    return `<details class="recipe-preparation" open>
      <summary><span><img src="../papazilla-design-system/assets/icons/receita.png" alt="">Modo de preparo</span><b>⌄</b></summary>
      <div class="recipe-preparation__body">
        <p class="recipe-preparation__intro">Passo a passo para esta combinação. Os tempos consideram cortes pequenos e são aproximados.</p>
        <ol class="prep-steps">
          <li><span>1</span><div><strong>Organize uma bancada limpa</strong><p>Lave as mãos por 20 segundos. Separe tábua e faca usadas na carne crua, não lave o frango e pese todos os ingredientes ainda crus.</p></div></li>
          <li><span>2</span><div><strong>Faça cortes uniformes</strong><p>Frango em cubos de 2–3 cm; fígado em pedaços de 1,5–2 cm; batata-doce e cenoura em cubos de 1,5–2 cm. Tamanhos parecidos cozinham por igual.</p></div></li>
          <li><span>3</span><div><strong>Cozinhe sem temperos</strong><p>Cozinhe cada grupo separadamente, em água ou no vapor. Não use cebola, alho, molhos ou temperos prontos.</p><div class="prep-times"><span><b>Frango</b>12–18 min*</span><span><b>Fígado</b>8–12 min*</span><span><b>Batata-doce</b>12–18 min</span><span><b>Cenoura</b>8–12 min</span></div></div></li>
          <li class="prep-step--temperature"><span><img src="../papazilla-design-system/assets/icons/info.png" alt=""></span><div><strong>Confirme 74&nbsp;°C no frango e no fígado</strong><p>Meça no centro da parte mais espessa. Cor e tempo sozinhos não confirmam um cozimento seguro.</p></div></li>
          <li><span>4</span><div><strong>Escorra, espere amornar e misture</strong><p>Desfie ou pique o frango depois de cozido. Misture tudo até os ingredientes ficarem bem distribuídos; não ofereça a comida quente.</p></div></li>
          <li><span>5</span><div><strong>Divida a fornalha</strong><p data-prep-portions>Monte 7 porções diárias de 320 g ou 14 refeições de 160 g. Use recipientes rasos, limpos e identificados com a data.</p></div></li>
          <li><span>6</span><div><strong>Finalize somente na hora de servir</strong><p>Adicione suplemento, óleos e qualquer dose individual indicada à porção já fria ou morna. Não tempere a receita por conta própria.</p></div></li>
          <li><span>7</span><div><strong>Guarde com segurança</strong><p>Refrigere em até 2 horas e use as porções refrigeradas em 3–4 dias. Congele o restante e descongele dentro da geladeira.</p></div></li>
        </ol>
        <p class="prep-footnote">*Estimativa para cubos de 2–3 cm em fervura suave. Quantidade, panela e fogão alteram o tempo; o termômetro define o ponto seguro.</p>
        <div class="prep-sources"><span>Segurança alimentar</span><a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noopener">Temperatura ↗</a><a href="https://ask.fsis.usda.gov/article/Is-it-necessary-to-rinse-soak-or-brine-chicken-to-make-it-safe" target="_blank" rel="noopener">Frango ↗</a><a href="https://www.fda.gov/animal-veterinary/animal-health-literacy/tips-safe-handling-pet-food-and-treats" target="_blank" rel="noopener">Higiene ↗</a></div>
      </div>
    </details>`;
  }

  const profileSteps = [
    {
      eyebrow: '1 · Sobre o seu cão', title: 'Quem é esse Monstrinho?', intro: 'Comece pelas informações que ajudam a gente a reconhecer e calcular o perfil dele.',
      content: () => '<button class="photo-picker" type="button"><span><img src="../papazilla-design-system/assets/icons/adicionar.png" alt=""></span><strong>Adicionar uma fotinho</strong><small>Opcional · JPG ou PNG</small></button>' +
        '<div class="form-grid">' + profileField('name', 'Nome do cão') + profileField('breed', 'Raça') + profileField('age', 'Data de nascimento ou idade') + profileField('weight', 'Peso atual', '', 'kg') + '</div>' +
        '<div class="profile-question"><h3>Sexo</h3>' + profilePills('sex', ['Macho','Fêmea']) + '</div>' +
        '<div class="profile-question"><h3>É castrado?</h3>' + profilePills('neutered', ['Sim','Não']) + '</div>'
    },
    {
      eyebrow: '2 · Objetivo', title: 'Qual é o principal objetivo da alimentação?', intro: 'O que você gostaria de alcançar com a alimentação do seu cão?',
      content: () => profileSingleCards('goal', ['Manter o peso atual','Emagrecer','Ganhar peso','Melhorar a qualidade da alimentação','Ajudar a preservar músculos e disposição com a idade','Apoiar uma condição de saúde']) +
        '<div class="conditional-panel conditional-panel--goal" data-profile-condition="goal" data-profile-condition-value="Emagrecer">' + profileField('idealWeight', 'Qual é o peso ideal do seu cão?', 'Ex.: 8,5', 'kg') + '<p class="profile-question__hint">Essa meta será usada como referência para montar o plano de emagrecimento.</p></div>'
    },
    {
      eyebrow: '3 · Condição corporal', title: 'Como está o corpo dele?', intro: 'Olhe por cima, passe as mãos pelas laterais do peito e depois observe a barriga de lado.',
      content: () => '<div class="profile-question profile-question--first"><h3>Olhando seu cão de cima, qual opção mais parece com ele?</h3>' + profileSingleCards('bodyTop', ['Muito magro','Magro','Corpo proporcional, com cintura visível','Um pouco acima do peso','Bem acima do peso'], true) + '</div>' +
        '<div class="profile-question"><h3>Passe as mãos pelas laterais do peito dele. Como você sente as costelas?</h3>' + profileSingleCards('ribs', ['Ficam muito aparentes','Consigo sentir facilmente','Consigo sentir, mas há uma camada de gordura','Preciso pressionar para sentir','Quase não consigo sentir'], true) + '</div>' +
        '<div class="profile-question"><h3>Olhando de lado, como é a barriga?</h3>' + profileSingleCards('belly', ['Bem recolhida','Levemente recolhida','Quase reta','Arredondada','Bem arredondada ou caída'], true) + '</div>'
    },
    {
      eyebrow: '4 · Musculatura', title: 'Como está a musculatura?', intro: 'Você percebe alguma dessas mudanças no corpo do seu cão? Pode selecionar mais de uma.',
      content: () => profileMultiCards('muscle', ['Laterais da cabeça mais fundas ou cavadas','Coluna mais aparente','Ossos do quadril mais aparentes','Coxas ou patas traseiras mais finas','Parece ter perdido músculos recentemente','Nenhuma dessas mudanças','Não sei avaliar']) +
        '<div class="profile-question" data-muscle-severity><h3>Se percebeu alguma mudança, ela parece:</h3>' + profilePills('muscleChange', ['Pequena','Moderada','Bem evidente','Não sei']) + '</div>'
    },
    {
      eyebrow: '5 · Histórico de peso', title: 'O peso mudou recentemente?', intro: 'Considere os últimos 3 a 6 meses.',
      content: () => '<div class="profile-question profile-question--first"><h3>Nos últimos 3 a 6 meses, o peso dele:</h3>' + profileSingleCards('weightChange', ['Ficou praticamente igual','Aumentou um pouco','Aumentou bastante','Diminuiu um pouco','Diminuiu bastante','Não sei'], true) + '</div>' +
        '<div class="profile-question"><h3>Você sabe quanto ele pesava antes?</h3>' + profilePills('previousWeightKnown', ['Sim','Não sei']) + '<div class="conditional-panel" data-profile-condition="previousWeightKnown" data-profile-condition-value="Sim">' + profileField('previousWeight', 'Peso anterior', '', 'kg') + '</div></div>'
    },
    {
      eyebrow: '6 · Atividade', title: 'Como é a rotina de atividade?', intro: 'Considere a média de uma semana comum.',
      content: () => '<div class="profile-question profile-question--first"><h3>Em um dia comum, quanto tempo ele passa caminhando, correndo ou brincando ativamente?</h3>' + profileSingleCards('activityTime', ['Menos de 20 minutos','20 a 40 minutos','40 a 60 minutos','1 a 2 horas','Mais de 2 horas'], true) + '</div>' +
        '<div class="profile-question"><h3>Como é essa atividade na maior parte do tempo?</h3>' + profileSingleCards('activityType', ['Quase nenhuma atividade','Passeios bem tranquilos','Caminhadas','Brincadeiras ativas','Corridas ou atividade intensa','Esporte ou trabalho'], true) + '</div>'
    },
    {
      eyebrow: '7 · Apetite', title: 'Como é a fome?', intro: 'Como é o apetite do seu cão?',
      content: () => profileSingleCards('appetite', ['Come pouco ou é seletivo','Come normalmente','Gosta bastante de comer','Parece estar sempre com fome','Procura ou pede comida o tempo todo'])
    },
    {
      eyebrow: '8 · Alimentação atual', title: 'Como ele se alimenta hoje?', intro: 'Isso ajuda a planejar uma transição mais tranquila.',
      content: () => '<div class="profile-question profile-question--first"><h3>O que ele come atualmente?</h3>' + profileSingleCards('currentFood', ['Ração seca','Ração úmida','Alimentação natural pronta','Alimentação natural caseira','Mistura de mais de uma opção'], true) + '</div>' +
        '<div class="profile-question"><h3>Quantas refeições ele faz por dia?</h3>' + profilePills('currentMeals', ['1','2','3','4 ou mais','A comida fica disponível o dia inteiro']) + '</div>' +
        '<div class="profile-question"><h3>Você sabe aproximadamente quanto ele come por dia?</h3>' + profilePills('currentAmountKnown', ['Sim','Não sei']) + '<div class="conditional-panel" data-profile-condition="currentAmountKnown" data-profile-condition-value="Sim">' + profileField('currentAmount', 'Quantidade aproximada por dia', '', 'g') + '</div></div>'
    },
    {
      eyebrow: '9 · Petiscos', title: 'E os petiscos?', intro: 'Eles também fazem parte do que o seu cão consome no dia.',
      content: () => '<div class="profile-question profile-question--first"><h3>Com que frequência ele recebe petiscos?</h3>' + profileSingleCards('treats', ['Quase nunca','1 a 2 por dia','3 a 5 por dia','Muitos ao longo do dia','Não sei'], true) + '</div>' +
        '<div class="profile-question"><h3>Ele recebe comida da família?</h3>' + profilePills('familyFood', ['Nunca','Às vezes','Frequentemente']) + '</div>'
    },
    {
      eyebrow: '10 · Digestão', title: 'Como é a digestão?', intro: 'Conte como costuma ser a rotina intestinal dele.',
      content: () => '<div class="profile-question profile-question--first"><h3>Como são as fezes normalmente?</h3>' + profileSingleCards('stool', ['Muito secas e duras','Firmes e bem formadas','Macias, mas ainda formadas','Muito moles','Líquidas'], true) + '</div>' +
        '<div class="profile-question"><h3>Com que frequência ele evacua?</h3>' + profilePills('stoolFrequency', ['Menos de 1 vez por dia','1 vez por dia','2 vezes por dia','3 ou mais vezes por dia']) + '</div>' +
        '<div class="profile-question"><h3>Alguma destas situações acontece com frequência?</h3><p class="profile-question__hint">Pode selecionar mais de uma.</p>' + profileMultiCards('digestion', ['Muitos gases','Constipação','Vômitos','Regurgitação ou refluxo','Diarreia recorrente','Muco nas fezes','Nenhuma dessas']) + '</div>'
    },
    {
      eyebrow: '11 · Saúde', title: 'Saúde', intro: 'Seu cão já foi diagnosticado por um veterinário com alguma destas condições? Pode selecionar mais de uma.',
      content: () => profileMultiCards('health', ['Doença renal','Doença cardíaca','Doença hepática','Pancreatite','Diabetes','Colesterol ou triglicérides elevados','Cálculos ou cristais urinários','Alergia ou intolerância alimentar','Doença gastrointestinal','Artrose ou doença ortopédica','Câncer','Problema hormonal ou endócrino','Outra','Nenhuma']) +
        '<div class="conditional-panel" data-profile-condition="health" data-profile-condition-value="Outra" data-profile-condition-mode="multi">' + profileField('otherHealth', 'Se marcou “Outra”, qual?') + '</div>' +
        '<div class="clinical-warning"><img src="../papazilla-design-system/assets/icons/info.png" alt=""><p><strong>Vale revisar a receita com o veterinário.</strong><span>Você informou: <b data-clinical-conditions></b>. O perfil será salvo normalmente. Antes de oferecer uma receita, recomendamos compartilhá-la com o veterinário que acompanha seu cão.</span></p></div>'
    },
    {
      eyebrow: '12 · Saúde complementar', title: 'Perguntas complementares de saúde', intro: 'Mostramos apenas o que corresponde às condições informadas.',
      content: () => {
        let html = '';
        if (profileHealth.has('Pancreatite')) html += '<div class="profile-question profile-question--first"><h3>Se houver histórico de pancreatite — a pancreatite aconteceu:</h3>' + profileSingleCards('pancreatitisHistory', ['Uma vez','Mais de uma vez','Não sei'], true) + '</div>';
        if (profileHealth.has('Cálculos ou cristais urinários')) html += '<div class="profile-question profile-question--first"><h3>Se houver histórico de cálculo ou cristal urinário — você sabe qual era o tipo?</h3>' + profileSingleCards('urinaryType', ['Estruvita','Oxalato','Urato','Outro','Não sei'], true) + '</div>';
        if (profileHealth.has('Doença renal')) html += '<div class="profile-question profile-question--first"><h3>Se houver doença renal — seu veterinário já informou o estágio da doença?</h3>' + profilePills('renalStage', ['Sim','Não','Não sei']) + '</div>';
        return html;
      }
    },
    {
      eyebrow: '13 · Medicamentos', title: 'Medicamentos e suplementos', intro: 'Registre somente o que ele usa atualmente.',
      content: () => '<div class="profile-question profile-question--first"><h3>Seu cão usa algum medicamento continuamente?</h3>' + profilePills('medication', ['Não','Sim']) + '<div class="conditional-panel" data-profile-condition="medication" data-profile-condition-value="Sim">' + profileField('medicationName', 'Qual medicamento?') + '</div></div>' +
        '<div class="profile-question"><h3>Ele usa algum suplemento?</h3>' + profilePills('supplementsUse', ['Não','Sim']) + '<div class="conditional-panel" data-profile-condition="supplementsUse" data-profile-condition-value="Sim"><p class="profile-question__hint">Selecione todos os que ele usa.</p>' + profileMultiCards('supplements', ['Ômega-3','Suplemento vitamínico e mineral','Suplemento articular','Probiótico','Outro']) + '<div class="conditional-panel" data-profile-condition="supplements" data-profile-condition-value="Outro" data-profile-condition-mode="multi">' + profileField('otherSupplement', 'Qual outro suplemento?') + '</div></div></div>'
    },
    {
      eyebrow: '14 · Veterinário', title: 'Acompanhamento veterinário', intro: 'Essas informações ajudam a identificar quando vale revisar a alimentação com o profissional.',
      content: () => '<div class="profile-question profile-question--first"><h3>Quando foi a última consulta veterinária?</h3>' + profileSingleCards('lastVet', ['Há menos de 6 meses','Entre 6 e 12 meses','Há mais de 1 ano','Nunca ou não lembro'], true) + '</div>' +
        '<div class="profile-question"><h3>Seu cão fez exames de sangue nos últimos 12 meses?</h3>' + profileSingleCards('bloodTests', ['Sim, estavam normais','Sim, houve alguma alteração','Não','Não sei'], true) + '<div class="conditional-panel" data-profile-condition="bloodTests" data-profile-condition-value="Sim, houve alguma alteração">' + profileTextarea('bloodNotes', 'Se houve alguma alteração e você quiser contar para a gente:', 'Conte somente o que considerar importante') + '</div></div>'
    },
    {
      eyebrow: '15 · Preferências', title: 'Preferências alimentares', intro: 'Conte o que costuma funcionar e o que deve ficar fora do potinho.',
      content: () => '<div class="profile-question profile-question--first"><h3>Quais proteínas seu cão come bem?</h3><p class="profile-question__hint">Pode selecionar mais de uma.</p>' + profileMultiCards('proteins', ['Frango','Carne bovina','Carne suína','Peixe','Ovo','Peru','Todas','Tanto faz']) + '</div>' +
        '<div class="profile-question"><h3>Existe alguma proteína que você prefere evitar?</h3>' + profilePills('avoidProtein', ['Não','Sim']) + '<div class="conditional-panel" data-profile-condition="avoidProtein" data-profile-condition-value="Sim">' + profileField('avoidProteinName', 'Qual proteína?') + '</div></div>' +
        '<div class="profile-question"><h3>Existe algum alimento que você sabe que faz mal para ele ou que ele não tolera bem?</h3>' + profilePills('intolerance', ['Não','Sim']) + '<div class="conditional-panel" data-profile-condition="intolerance" data-profile-condition-value="Sim">' + profileField('intoleranceName', 'Qual alimento?') + '</div></div>'
    },
    {
      eyebrow: '16 · Carboidratos', title: 'Carboidratos', intro: 'Quais carboidratos você gostaria de usar? Pode selecionar mais de uma.',
      content: () => profileMultiCards('carbs', ['Arroz','Batata-doce','Batata','Mandioca','Inhame','Aveia','Tanto faz (escolham por mim)'])
    },
    {
      eyebrow: '17 · Vegetais', title: 'Vegetais', intro: 'Preferências ajudam o Zilla a sugerir combinações mais fáceis para a rotina.',
      content: () => '<div class="profile-question profile-question--first"><h3>Existe algum vegetal que você prefere não usar?</h3>' + profilePills('avoidVegetable', ['Não','Sim']) + '<div class="conditional-panel" data-profile-condition="avoidVegetable" data-profile-condition-value="Sim">' + profileField('avoidVegetableName', 'Qual vegetal?') + '</div></div>' +
        '<div class="profile-question"><h3>Se quiser, selecione alguns favoritos do seu cão:</h3>' + profileMultiCards('vegetableFavorites', ['Abóbora','Abobrinha','Cenoura','Chuchu','Brócolis','Vagem','Outro','Tanto faz']) + '</div>'
    },
    {
      eyebrow: '18 · Preparo', title: 'Preferências de preparo', intro: 'Essas respostas viram o padrão sugerido nas próximas receitas.',
      content: () => '<div class="profile-question profile-question--first"><h3>Como você costuma cozinhar?</h3>' + profileSingleCards('cookingMethod', ['Panela com água','Vapor','Panela de pressão','Forno','Air fryer','Varia conforme o alimento'], true) + '</div>' +
        '<div class="profile-question"><h3>Como você gostaria de receber sua receita?</h3>' + profileSingleCards('recipeFormat', ['Quantidade dos alimentos crus','Quantidade dos alimentos prontos','Os dois'], true) + '</div>'
    },
    {
      eyebrow: '19 · Refeições', title: 'Quantas refeições por dia?', intro: 'Quantas refeições você prefere oferecer?',
      content: () => profileSingleCards('preferredMeals', ['1','2','3','4','Quero que o Papazilla recomende'])
    },
    {
      eyebrow: '20 · Observações', title: 'Observações finais', intro: 'Última etapa. Depois disso, você poderá revisar e atualizar tudo pela área Pets.',
      content: () => profileTextarea('finalNotes', 'Existe alguma coisa importante sobre seu cão que você acha que deveríamos saber?', 'Escreva aqui, se quiser') +
        '<div class="profile-review profile-review--compact"><div class="profile-review__pet"><span><img src="../papazilla-design-system/assets/icons/zilla.png" alt=""></span><div><strong data-review-name>Mel</strong><small data-review-identity>SRD · 5 anos · 10 kg</small></div><button data-jump-profile="0">Editar</button></div><div class="review-list"><span><small>Objetivo</small><strong data-review-goal>Melhorar a qualidade da alimentação</strong></span><span><small>Atividade</small><strong data-review-activity>40 a 60 minutos por dia</strong></span><span><small>Preparo preferido</small><strong data-review-prep>Panela com água · os dois pesos</strong></span><span><small>Saúde informada</small><strong data-review-health>Nenhuma condição</strong></span></div></div>' +
        `<label class="consent-card"><input type="checkbox" data-profile-consent ${profileConsent ? 'checked' : ''}><span>Li e entendi</span><div><p>Importante: o Papazilla é uma ferramenta de apoio à alimentação e não substitui consulta, diagnóstico, prescrição clínica ou acompanhamento veterinário.</p><p>As receitas são criadas com base nas informações fornecidas pelo tutor e em referências nutricionais publicadas na literatura veterinária. Cães com doenças, sintomas, alterações importantes de peso, uso contínuo de medicamentos ou necessidades específicas podem precisar de ajustes individualizados.</p><p>Recomendamos compartilhar a receita com o médico-veterinário que acompanha seu cão.</p></div></label>`
    }
  ];

  const recipeSteps = [
    {
      eyebrow: 'A matilha à mesa', title: 'Para quem vamos cozinhar?', intro: 'Escolha um ou mais Monstrinhos. A base pode ser preparada junta; porções e finalizadores continuam individuais.',
      content: `<div class="recipe-pet-list">
        <button class="recipe-pet-choice is-selected" data-recipe-pet-choice="mel" aria-pressed="true"><span class="recipe-pet-avatar"><img src="../papazilla-design-system/assets/icons/zilla.png" alt=""></span><span><strong>Mel</strong><small>10 kg · adulta · ativa</small><b>320 g por dia · 2 refeições</b></span><i>✓</i></button>
        <button class="recipe-pet-choice" data-recipe-pet-choice="bento" aria-pressed="false"><span class="recipe-pet-avatar is-bento"><img src="../papazilla-design-system/assets/icons/zilla.png" alt=""></span><span><strong>Bento</strong><small>29 kg · adulto · moderado</small><b>800 g por dia · 2 refeições</b></span><i>✓</i></button>
      </div>
      <div class="shared-recipe-note" data-shared-recipe-note><img src="../papazilla-design-system/assets/icons/info.png" alt=""><p><strong>Uma receita para a Mel</strong>Você também pode incluir o Bento nesta fornalha.</p></div>
      <button class="add-recipe-pet" data-add-recipe-pet><span>＋</span><div><strong>Cadastrar outro Monstrinho</strong><small>Ele aparecerá aqui nas próximas receitas</small></div></button>`
    },
    {
      eyebrow: 'Composição do potinho', title: 'Qual proporção você prefere?', intro: 'Escolha como dividir a quantidade diária entre carnes, vísceras, carboidratos e vegetais.',
      content: `<div class="recipe-preset-list">
        <button class="recipe-preset-card" data-recipe-preset="padrao"><span><strong>Padrão</strong><small>35% carnes · 5% vísceras · 35% carboidratos · 25% vegetais</small></span><i><b style="--preset-size:35%;--preset-color:var(--pz-coral)"></b><b style="--preset-size:5%;--preset-color:var(--pz-chocolate)"></b><b style="--preset-size:35%;--preset-color:#d3a038"></b><b style="--preset-size:25%;--preset-color:var(--pz-verde)"></b></i></button>
        <button class="recipe-preset-card" data-recipe-preset="proteina"><span><strong>Mais proteína</strong><small>45% carnes · 5% vísceras · 25% carboidratos · 25% vegetais</small></span><i><b style="--preset-size:45%;--preset-color:var(--pz-coral)"></b><b style="--preset-size:5%;--preset-color:var(--pz-chocolate)"></b><b style="--preset-size:25%;--preset-color:#d3a038"></b><b style="--preset-size:25%;--preset-color:var(--pz-verde)"></b></i></button>
        <button class="recipe-preset-card" data-recipe-preset="intermediaria"><span><strong>Intermediária</strong><small>40% carnes · 5% vísceras · 30% carboidratos · 25% vegetais</small></span><i><b style="--preset-size:40%;--preset-color:var(--pz-coral)"></b><b style="--preset-size:5%;--preset-color:var(--pz-chocolate)"></b><b style="--preset-size:30%;--preset-color:#d3a038"></b><b style="--preset-size:25%;--preset-color:var(--pz-verde)"></b></i></button>
        <button class="recipe-preset-card" data-recipe-preset="visceras"><span><strong>Mais vísceras</strong><small>40% carnes · 10% vísceras · 25% carboidratos · 25% vegetais</small></span><i><b style="--preset-size:40%;--preset-color:var(--pz-coral)"></b><b style="--preset-size:10%;--preset-color:var(--pz-chocolate)"></b><b style="--preset-size:25%;--preset-color:#d3a038"></b><b style="--preset-size:25%;--preset-color:var(--pz-verde)"></b></i></button>
      </div><div class="preset-legend"><span><i class="is-meat"></i>Carnes</span><span><i class="is-organ"></i>Vísceras</span><span><i class="is-carb"></i>Carboidratos</span><span><i class="is-veg"></i>Vegetais</span></div>`
    },
    {
      eyebrow: 'Base da receita', title: 'Escolha a proteína', intro: 'Primeiro a proteína: é o que mais importa para alergias e digestão. Pode escolher mais de uma; a gente divide em partes iguais.',
      content: ingredientCards([
        ['Peito de frango','Vai bem para a Mel'],['Coxa/sobrecoxa de frango desossada',''],['Moela de frango','Víscera muscular'],['Coração de frango','Víscera muscular'],['Músculo bovino',''],['Lagarto bovino',''],['Patinho bovino',''],['Coxão mole ou duro bovino',''],['Pulmão bovino','Víscera muscular'],['Coração bovino','Víscera muscular'],['Bucho bovino (dobradinha)','Víscera muscular'],['Língua bovina','Alto teor de gordura'],['Lombo suíno',''],['Filé mignon suíno',''],['Pulmão suíno','Víscera muscular'],['Coração suíno','Víscera muscular'],['Peixe pequeno com espinha (ex. sardinha)','Fonte de ômega-3'],['Ovo cozido',''],['Coelho',''],['Cordeiro',''],['Peru','']
      ], 'protein', 0)
    },
    {
      eyebrow: 'Energia', title: 'Escolha os carboidratos', intro: 'Pode escolher mais de um; a gente divide em partes iguais.',
      content: ingredientCards([['Batata-doce','Preferida da Mel'],['Mandioquinha (batata-baroa)',''],['Inhame',''],['Cará',''],['Mandioca',''],['Arroz integral',''],['Arroz branco',''],['Aveia',''],['Quinoa',''],['Lentilha','']], 'carb', 0)
    },
    {
      eyebrow: 'Cores no potinho', title: 'Escolha os vegetais', intro: 'Pode escolher mais de um; a gente divide em partes iguais.',
      content: ingredientCards([['Espinafre','Atenção aos oxalatos'],['Repolho',''],['Aipo (talo do salsão)',''],['Ervilha',''],['Cenoura',''],['Abóbora','Máx. 5% dos vegetais'],['Pepino',''],['Abobrinha',''],['Chuchu',''],['Berinjela','Máx. 5% dos vegetais'],['Brócolis',''],['Couve-flor',''],['Vagem',''],['Quiabo','Máx. 5% dos vegetais'],['Jiló','Máx. 5% dos vegetais']], 'vegetable', 4)
    },
    {
      eyebrow: 'Parte pequena, papel importante', title: 'Escolha as vísceras', intro: 'Pode pular esta etapa. Se não usar vísceras hoje, o valor delas é somado à proteína escolhida.',
      content: ingredientCards([['Fígado (frango, boi ou porco)',''],['Rim (boi ou porco)',''],['Baço bovino',''],['Cérebro (boi ou porco)','']], 'organ', 0) + `<button class="skip-card" data-skip-recipe><span>Hoje não vou usar vísceras</span><small>A porção será somada à proteína</small></button>`
    },
    {
      eyebrow: 'Finalização individual', title: 'Qual suplemento você vai usar?', intro: 'Escolha o vitamínico-mineral que entrará nesta receita. A dose final muda conforme o produto.',
      content: `<div class="recipe-preset-list supplement-choice-list">
        <button class="recipe-preset-card supplement-choice-card" data-recipe-supplement="foodDog"><span><strong>Food Dog Adulto / Basic</strong><small>0,8 g para cada 100 g de comida pronta</small></span><em>Usado como exemplo atual</em></button>
        <button class="recipe-preset-card supplement-choice-card" data-recipe-supplement="nutroplus"><span><strong>Nutroplus Manutenção</strong><small>0,6 g para cada 100 g de comida pronta</small></span><em>6 g por 1.000 kcal ≈ 1 kg de alimento</em></button>
      </div><div class="shared-recipe-note supplement-choice-note"><img src="../papazilla-design-system/assets/icons/info.png" alt=""><p><strong>Versões para cães adultos</strong>Na implementação final, fase de vida e rótulo do produto definirão a opção e a dose adequada.</p></div>`
    },
    {
      eyebrow: 'Sua fornalha', title: 'Para quantos dias é a receita?', intro: 'Quanto você vai preparar de uma vez? Se cozinha porções para a semana toda, por exemplo, escolha 7 dias — a gente multiplica as quantidades pra você.',
      content: `<div class="batch-choices">${[['1','1 dia'],['3','3 dias'],['7','7 dias']].map((x,i)=>`<button class="batch-card ${i===2?'is-selected':''}" data-choice="days" data-batch-days="${x[0]}"><strong>${x[0]}</strong><span>${x[1]}</span></button>`).join('')}</div>
        <label class="custom-days-field" data-custom-days-field><span><strong>Outro período</strong><small>Escolha de 1 a 30 dias</small></span><span class="custom-days-input"><input id="custom-recipe-days" type="number" min="1" max="30" inputmode="numeric" placeholder="Ex.: 14"><b>dias</b></span></label>
        <div class="question-block"><h3>Como você gostaria de receber sua receita?</h3><div class="option-stack compact-options">${['Quantidade dos alimentos crus','Quantidade dos alimentos prontos','Os dois'].map((x,i)=>`<button class="select-card ${i===2?'is-selected':''}" data-choice="format"><span class="select-card__radio"></span><span>${x}</span></button>`).join('')}</div></div>`
    },
    {
      eyebrow: 'Porção na medida', title: 'A fornalha está pronta!', intro: 'Receita pronta para a matilha.', result: true,
      content: `<div class="recipe-result-card"><div class="recipe-result-card__total"><span><small>Total da receita</small><strong data-recipe-batch-total>2.240 g</strong><small>prontos</small></span><img src="../papazilla-design-system/assets/icons/potinho.png" alt=""></div>
        <div class="recipe-preset-result" data-recipe-preset-result></div>
        <div class="pet-portion-breakdown" data-pet-portion-breakdown hidden></div>
        <div class="result-group"><h3>O que pesar cru</h3><div><span>Peito de frango</span><strong data-base-group="meat">≈ 1.045 g</strong></div><div><span>Fígado</span><strong data-base-group="organ">≈ 145 g</strong></div><div><span>Batata-doce</span><strong data-base-group="carb">≈ 745 g</strong></div><div><span>Cenoura</span><strong data-base-group="vegetable">≈ 616 g</strong></div></div>
        <div class="supplement-result"><div class="supplement-result__title"><img src="../papazilla-design-system/assets/icons/adicionar.png" alt=""><span><small>Também entra no potinho</small><h3>Suplementos e finalização</h3></span></div>
          <p class="supplement-context" data-supplement-context>Doses individuais para a Mel.</p>
          <div class="pet-finalizers" data-pet-finalizers></div>
          <aside class="shared-finalizer-warning" data-shared-finalizer-warning hidden><img src="../papazilla-design-system/assets/icons/info.png" alt=""><span>Separe as porções de cada pet antes de adicionar suplementos, óleos e doses individuais.</span></aside>
        </div>
        ${recipePreparationMarkup()}
        <div class="portion-row" data-portion-row><span><small>Por dia</small><strong>320 g</strong></span><span><small>Por refeição</small><strong>160 g</strong></span></div>
      </div><div class="prototype-value-note"><strong>Valores ilustrativos</strong> Esta tela valida a experiência. O resultado final será calculado pelo motor nutricional existente.</div>`
    }
  ];

  function ingredientCards(items, group, selectedIndex) {
    return `<div class="ingredient-browser"><label class="ingredient-search"><img src="../papazilla-design-system/assets/icons/busca.png" alt=""><input data-ingredient-search placeholder="Buscar entre ${items.length} opções" autocomplete="off"></label><span class="ingredient-count" data-ingredient-count>${items.length} opções</span></div><div class="ingredient-grid">${items.map((item,i)=>`<button class="ingredient-card ${i===selectedIndex?'is-selected':''}" data-multi="${group}" data-ingredient-name="${item[0].toLocaleLowerCase('pt-BR')}"><strong>${item[0]}</strong>${item[1]?`<small>${item[1]}</small>`:''}<i>✓</i></button>`).join('')}</div>`;
  }

  function renderAuth(mode = authMode) {
    authMode = mode;
    const body = document.querySelector('#auth-body');
    const templates = {
      options: `
        <div class="auth-hero">
          <img class="auth-hero__lockup" src="../papazilla-design-system/assets/papazilla-lockup-hero-transparent.png" alt="Papazilla">
          <h1>Entre para começar</h1>
          <p>Guarde os perfis dos seus Monstrinhos e acesse suas receitas em qualquer aparelho.</p>
        </div>
        <div class="auth-actions">
          <button class="social-button social-button--google" id="login-google"><span class="google-mark">G</span>Continuar com Google</button>
          <button class="social-button social-button--apple" id="login-apple"><span class="apple-mark"></span>Continuar com Apple</button>
          <div class="auth-divider"><span>ou</span></div>
          <button class="social-button social-button--email" id="login-email"><span>@</span>Continuar com e-mail</button>
        </div>
        <p class="auth-reassurance"><span>✓</span> Conta gratuita · seus dados ficam protegidos</p>`,
      email: `
        <button class="auth-inline-back" data-auth-back>← Voltar</button>
        <div class="auth-step-art"><span>@</span></div>
        <div class="auth-step-copy"><p class="eyebrow">Entrar com e-mail</p><h1>Qual é o seu e-mail?</h1><p>Vamos enviar um código. Você não precisa criar nem lembrar de senha.</p></div>
        <label class="auth-field"><span>Seu e-mail</span><input id="auth-email" type="email" value="flavia@exemplo.com" autocomplete="email"></label>
        <button class="pz-button pz-button--primary wide auth-main-action" id="send-code">Enviar código →</button>`,
      code: `
        <button class="auth-inline-back" data-auth-back>← Alterar e-mail</button>
        <div class="auth-step-art auth-step-art--mail"><img src="../papazilla-design-system/assets/icons/mensagem.png" alt=""></div>
        <div class="auth-step-copy"><p class="eyebrow">Confira sua caixa de entrada</p><h1>Digite o código</h1><p>Enviamos seis números para <strong>flavia@exemplo.com</strong>.</p></div>
        <label class="auth-field auth-field--code"><span>Código de acesso</span><input id="auth-code" inputmode="numeric" maxlength="6" value="123456" aria-describedby="code-hint"></label>
        <p class="code-hint" id="code-hint">O código expira em 10 minutos.</p>
        <button class="pz-button pz-button--primary wide auth-main-action" id="verify-code">Confirmar código →</button>
        <button class="pz-button pz-button--text auth-resend" id="resend-code">Reenviar código</button>`,
      name: `
        <button class="auth-inline-back" data-auth-back>← Voltar</button>
        <div class="auth-step-art auth-step-art--hello"><img src="../papazilla-design-system/assets/icons/perfil.png" alt=""></div>
        <div class="auth-step-copy"><p class="eyebrow">Só mais uma coisinha</p><h1>Como podemos te chamar?</h1><p>Esse nome aparece nas boas-vindas. Você poderá mudar depois.</p></div>
        <label class="auth-field"><span>Seu nome</span><input id="auth-name" value="Flávia" autocomplete="name"></label>
        <button class="pz-button pz-button--primary wide auth-main-action" id="finish-auth">Conhecer o Zilla →</button>`
    };
    body.innerHTML = templates[mode];
    body.scrollTop = 0;
    body.querySelector('#login-google')?.addEventListener('click', (event) => simulateProvider(event.currentTarget, 'Google'));
    body.querySelector('#login-apple')?.addEventListener('click', () => renderAuth('name'));
    body.querySelector('#login-email')?.addEventListener('click', () => renderAuth('email'));
    body.querySelector('#send-code')?.addEventListener('click', () => renderAuth('code'));
    body.querySelector('#verify-code')?.addEventListener('click', () => renderAuth('name'));
    body.querySelector('#resend-code')?.addEventListener('click', () => showToast('Um novo código foi enviado.'));
    body.querySelector('#finish-auth')?.addEventListener('click', finishAuth);
    body.querySelector('[data-auth-back]')?.addEventListener('click', () => renderAuth(mode === 'code' ? 'email' : 'options'));
  }

  function simulateProvider(button, provider) {
    button.disabled = true;
    button.innerHTML = `<span class="auth-spinner"></span>Conectando com ${provider}…`;
    setTimeout(finishAuth, 650);
  }

  function finishAuth() {
    localStorage.setItem(storage.auth, 'true');
    showScreen('onboarding');
  }

  function subscriptionState() {
    try { return JSON.parse(localStorage.getItem(storage.subscription) || 'null'); }
    catch { return null; }
  }

  function startRecipe() {
    recipeStep = 0;
    recipeDays = 7;
    recipePreset = 'padrao';
    recipeSupplement = 'foodDog';
    selectedRecipePets = new Set([selectedPet]);
    showScreen('recipe');
  }

  function updatePaywall() {
    document.querySelectorAll('[data-plan-card]').forEach((card) => {
      const active = card.dataset.planCard === selectedPlan;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-checked', String(active));
      card.querySelector('[data-select-plan]')?.setAttribute('aria-checked', String(active));
    });
    document.querySelectorAll('[data-annual-payment]').forEach((option) => {
      const active = option.dataset.annualPayment === annualPayment;
      option.classList.toggle('is-selected', active);
      option.setAttribute('aria-checked', String(active));
    });
    const annualTerms = document.querySelector('#annual-terms');
    const disclosure = document.querySelector('#paywall-disclosure');
    const cta = document.querySelector('#subscribe-now');
    if (selectedPlan === 'monthly') {
      cta.textContent = 'Assinar por R$ 19,90/mês';
      disclosure.textContent = 'Cobrança recorrente mensal. Cancele quando quiser; depois do cancelamento, não haverá novas cobranças e o acesso continua até o fim do período já pago.';
    } else if (annualPayment === 'installments') {
      cta.textContent = 'Assinar em 12 pagamentos';
      annualTerms.textContent = 'Compromisso de 12 meses. Você pode cancelar a renovação a qualquer momento; os pagamentos do período contratado continuam até o final.';
      disclosure.textContent = '12 pagamentos de R$ 9,99 · total de R$ 119,88. A renovação inicia um novo período de compromisso.';
    } else {
      cta.textContent = 'Assinar anual por R$ 107,90';
      annualTerms.textContent = 'Pagamento anual antecipado. A assinatura renova por mais 12 meses até você cancelar a renovação.';
      disclosure.textContent = 'R$ 107,90 cobrados por 12 meses de acesso. Renovação anual automática; cancele a próxima renovação quando quiser.';
    }
  }

  function openPaywall(returnTo = 'recipe') {
    paywallReturn = returnTo;
    selectedPlan = 'annual';
    annualPayment = 'upfront';
    updatePaywall();
    showScreen('paywall');
  }

  function updateSubscriptionUI() {
    const subscription = subscriptionState();
    const planName = document.querySelector('#user-plan-name');
    const planStatus = document.querySelector('#user-plan-status');
    const planDescription = document.querySelector('#user-plan-description');
    const valueLabel = document.querySelector('#user-plan-value-label');
    const planValue = document.querySelector('#user-plan-value');
    const manageButton = document.querySelector('#manage-plan');
    if (!subscription) {
      planName.textContent = 'Acesso gratuito';
      planStatus.textContent = 'Grátis';
      planDescription.textContent = 'Cadastre seus pets e explore os conteúdos. Assine para criar receitas personalizadas.';
      valueLabel.textContent = 'Receitas';
      planValue.textContent = 'Benefício premium';
      manageButton.textContent = 'Conhecer planos →';
      return;
    }
    const monthly = subscription.plan === 'monthly';
    const installments = subscription.payment === 'installments';
    planName.textContent = monthly ? 'Papazilla Mensal' : 'Papazilla Anual';
    planStatus.textContent = 'Ativo';
    planDescription.textContent = 'Receitas para toda a matilha, histórico de fornalhas e acesso em qualquer aparelho.';
    valueLabel.textContent = monthly ? 'Renovação mensal' : 'Pagamento';
    planValue.textContent = monthly ? 'R$ 19,90/mês' : installments ? '12 pagamentos de R$ 9,99' : 'R$ 107,90 à vista';
    manageButton.textContent = 'Gerenciar plano →';
    document.querySelector('#subscription-plan-name').textContent = monthly ? 'Papazilla Mensal' : 'Papazilla Anual';
    document.querySelector('#subscription-payment').textContent = monthly ? 'R$ 19,90 por mês' : installments ? '12 pagamentos de R$ 9,99' : 'R$ 107,90 à vista';
    document.querySelector('#subscription-renewal-copy').textContent = monthly
      ? 'A próxima cobrança mensal acontece na data indicada acima.'
      : installments ? 'Depois dos 12 pagamentos, a assinatura inicia um novo período até você cancelar a renovação.' : 'A próxima cobrança anual acontece na data indicada acima.';
  }

  function showScreen(name, options = {}) {
    clearTimeout(splashTimer);
    screens.forEach((screen) => screen.classList.toggle('is-active', screen.dataset.screen === name));
    previewLinks.forEach((link) => link.classList.toggle('is-current', link.dataset.preview === name));
    if (name === 'auth') renderAuth('options');
    if (name === 'onboarding') goToSlide(0, false);
    if (name === 'profile') renderProfile();
    if (name === 'recipe') renderRecipe();
    if (name === 'paywall') updatePaywall();
    if (name === 'user-profile' || name === 'subscription') updateSubscriptionUI();
    if (name === 'splash' && options.auto !== false) {
      splashTimer = setTimeout(() => {
        if (localStorage.getItem(storage.auth) !== 'true') showScreen('auth');
        else if (localStorage.getItem(storage.pet) === 'true') showScreen('home');
        else if (localStorage.getItem(storage.onboarding) === 'true') showScreen('empty');
        else showScreen('onboarding');
      }, 1350);
    }
  }

  function goToSlide(index, smooth = true) {
    activeSlide = Math.max(0, Math.min(3, index));
    track.scrollTo({ left: activeSlide * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-current', i === activeSlide);
      dot.setAttribute('aria-selected', i === activeSlide ? 'true' : 'false');
    });
    count.textContent = `${activeSlide + 1} de 4`;
    next.innerHTML = activeSlide === 3 ? 'Conhecer a matilha <span aria-hidden="true">→</span>' : 'Continuar <span aria-hidden="true">→</span>';
  }

  function finishOnboarding() {
    localStorage.setItem(storage.onboarding, 'true');
    showScreen('empty');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function applyPetContext(key = selectedPet) {
    selectedPet = petProfiles[key] ? key : 'mel';
    const pet = petProfiles[selectedPet];
    document.querySelectorAll('[data-pet-copy]').forEach((node) => { node.textContent = pet[node.dataset.petCopy]; });
    document.querySelectorAll('[data-pet-stat]').forEach((node) => {
      const value = pet[node.dataset.petStat];
      node.textContent = node.dataset.petStat === 'weight' ? `${value} kg` : value;
    });
    document.querySelectorAll('[data-pet-input]').forEach((input) => { input.value = pet[input.dataset.petInput]; });
    document.querySelectorAll('[data-pet-portrait]').forEach((portrait) => portrait.classList.toggle('is-bento', selectedPet === 'bento'));
    const switcher = document.querySelector('#pet-switcher');
    if (switcher) switcher.value = selectedPet;
  }

  function openPet(key) {
    applyPetContext(key);
    showScreen('pet-detail');
  }

  function startAdditionalPet(returnScreen) {
    profileStep = 0;
    resetProfileAnswers();
    profileMode = 'create';
    profileReturn = returnScreen;
    showScreen('profile');
  }

  function bindSingleChoices(root) {
    root.querySelectorAll('[data-choice]').forEach((button) => button.addEventListener('click', () => {
      root.querySelectorAll(`[data-choice="${button.dataset.choice}"]`).forEach((item) => item.classList.remove('is-selected'));
      button.classList.add('is-selected');
    }));
    root.querySelectorAll('[data-multi]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.multi === 'health') {
        const value = button.textContent.replace('✓', '').trim();
        if (value === 'Nenhuma') profileHealth = new Set(['Nenhuma']);
        else {
          profileHealth.delete('Nenhuma');
          profileHealth.has(value) ? profileHealth.delete(value) : profileHealth.add(value);
          if (profileHealth.size === 0) profileHealth.add('Nenhuma');
        }
        root.querySelectorAll('[data-multi="health"]').forEach((item) => item.classList.toggle('is-selected', profileHealth.has(item.textContent.replace('✓', '').trim())));
      } else button.classList.toggle('is-selected');
      const warning = root.querySelector('.clinical-warning');
      if (warning) warning.hidden = profileHealth.has('Nenhuma');
    }));
  }

  const profileExclusiveMulti = {
    muscle: ['Nenhuma dessas mudanças', 'Não sei avaliar'],
    digestion: ['Nenhuma dessas'],
    health: ['Nenhuma'],
    proteins: ['Todas', 'Tanto faz'],
    carbs: ['Tanto faz (escolham por mim)'],
    vegetableFavorites: ['Tanto faz']
  };

  const profileMultiFallback = {
    muscle: 'Nenhuma dessas mudanças',
    digestion: 'Nenhuma dessas',
    health: 'Nenhuma',
    proteins: 'Tanto faz',
    carbs: 'Tanto faz (escolham por mim)'
  };

  function updateProfileNextState() {
    const missingIdealWeight = profileStep === 1 && profileSingles.goal === 'Emagrecer' && !profileInputs.idealWeight.trim();
    const missingConsent = profileStep === profileSteps.length - 1 && !profileConsent;
    document.querySelector('#profile-next').disabled = missingIdealWeight || missingConsent;
  }

  function syncProfileControls(root) {
    root.querySelectorAll('[data-profile-choice]').forEach((button) => {
      const selected = profileSingles[button.dataset.profileChoice] === button.dataset.profileValue;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    root.querySelectorAll('[data-profile-multi]').forEach((button) => {
      const selected = profileMulti[button.dataset.profileMulti]?.has(button.dataset.profileValue) || false;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    root.querySelectorAll('[data-profile-condition]').forEach((panel) => {
      const key = panel.dataset.profileCondition;
      panel.hidden = panel.dataset.profileConditionMode === 'multi'
        ? !profileMulti[key]?.has(panel.dataset.profileConditionValue)
        : profileSingles[key] !== panel.dataset.profileConditionValue;
    });
    const hasMuscleChange = [...(profileMulti.muscle || [])].some((value) => !profileExclusiveMulti.muscle.includes(value));
    root.querySelector('[data-muscle-severity]')?.toggleAttribute('hidden', !hasMuscleChange);
    root.querySelector('.clinical-warning')?.toggleAttribute('hidden', profileHealth.has('Nenhuma'));
    const clinicalConditions = root.querySelector('[data-clinical-conditions]');
    if (clinicalConditions) clinicalConditions.textContent = [...profileHealth].filter((condition) => condition !== 'Nenhuma').join(', ');
    const healthReview = root.querySelector('[data-review-health]');
    if (healthReview) healthReview.textContent = profileHealth.has('Nenhuma') ? 'Nenhuma condição' : [...profileHealth].join(', ');
    const nameReview = root.querySelector('[data-review-name]');
    if (nameReview) nameReview.textContent = profileInputs.name || 'Seu Monstrinho';
    const identityReview = root.querySelector('[data-review-identity]');
    if (identityReview) identityReview.textContent = [profileInputs.breed, profileInputs.age, profileInputs.weight ? `${profileInputs.weight} kg` : ''].filter(Boolean).join(' · ');
    const goalReview = root.querySelector('[data-review-goal]');
    if (goalReview) goalReview.textContent = profileSingles.goal === 'Emagrecer' && profileInputs.idealWeight
      ? `Emagrecer · peso ideal ${profileInputs.idealWeight} kg`
      : profileSingles.goal;
    const activityReview = root.querySelector('[data-review-activity]');
    if (activityReview) activityReview.textContent = `${profileSingles.activityTime} por dia · ${profileSingles.activityType.toLocaleLowerCase('pt-BR')}`;
    const prepReview = root.querySelector('[data-review-prep]');
    if (prepReview) prepReview.textContent = `${profileSingles.cookingMethod} · ${profileSingles.recipeFormat.toLocaleLowerCase('pt-BR')}`;
    updateProfileNextState();
  }

  function bindProfileControls(root) {
    root.querySelectorAll('[data-profile-input]').forEach((input) => {
      input.value = profileInputs[input.dataset.profileInput] || '';
      input.addEventListener('input', () => {
        profileInputs[input.dataset.profileInput] = input.value;
        updateProfileNextState();
      });
    });
    root.querySelectorAll('[data-profile-choice]').forEach((button) => button.addEventListener('click', () => {
      profileSingles[button.dataset.profileChoice] = button.dataset.profileValue;
      syncProfileControls(root);
    }));
    root.querySelectorAll('[data-profile-multi]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.profileMulti;
      const value = button.dataset.profileValue;
      const values = profileMulti[key] || new Set();
      profileMulti[key] = values;
      const exclusives = profileExclusiveMulti[key] || [];
      if (exclusives.includes(value)) {
        values.clear();
        values.add(value);
      } else {
        exclusives.forEach((exclusive) => values.delete(exclusive));
        values.has(value) ? values.delete(value) : values.add(value);
        if (values.size === 0 && profileMultiFallback[key]) values.add(profileMultiFallback[key]);
      }
      if (key === 'health') profileHealth = values;
      syncProfileControls(root);
    }));
    root.querySelector('[data-jump-profile]')?.addEventListener('click', () => { profileStep = 0; renderProfile(); });
    root.querySelector('.photo-picker')?.addEventListener('click', () => showToast('A seleção de foto abrirá a câmera ou a galeria.'));
    root.querySelector('[data-profile-consent]')?.addEventListener('change', (event) => {
      profileConsent = event.currentTarget.checked;
      document.querySelector('#profile-next').disabled = !profileConsent;
    });
  }

  function hasHealthComplements() {
    return ['Pancreatite', 'Cálculos ou cristais urinários', 'Doença renal'].some((condition) => profileHealth.has(condition));
  }

  function adjacentProfileStep(direction) {
    let target = profileStep + direction;
    if (target === 11 && !hasHealthComplements()) target += direction;
    return Math.max(0, Math.min(profileSteps.length - 1, target));
  }

  function renderProfile() {
    const step = profileSteps[profileStep];
    document.querySelector('#profile-step-label').textContent = `Etapa ${profileStep + 1} de ${profileSteps.length}`;
    document.querySelector('#profile-progress').style.width = `${((profileStep + 1) / profileSteps.length) * 100}%`;
    const body = document.querySelector('#profile-body');
    const content = typeof step.content === 'function' ? step.content() : step.content;
    body.innerHTML = `<div class="flow-intro"><p class="eyebrow">${step.eyebrow}</p><h1>${step.title}</h1><p>${step.intro}</p></div>${content}`;
    body.scrollTop = 0;
    document.querySelector('#profile-back').disabled = profileStep === 0;
    document.querySelector('#profile-next').textContent = profileStep === profileSteps.length - 1 ? (profileMode === 'edit' ? 'Salvar alterações' : 'Confirmar cadastro') : 'Continuar →';
    updateProfileNextState();
    bindProfileControls(body);
    syncProfileControls(body);
  }

  function renderRecipe() {
    const step = recipeSteps[recipeStep];
    const pets = [...selectedRecipePets].map((key) => recipePetData[key]);
    const totalDaily = pets.reduce((total, pet) => total + pet.daily, 0);
    const petNames = pets.map((pet) => pet.name);
    document.querySelector('#recipe-step-label').textContent = step.result ? 'Receita pronta' : `Etapa ${recipeStep + 1} de ${recipeSteps.length - 1}`;
    document.querySelector('#recipe-progress').style.width = `${((recipeStep + 1) / recipeSteps.length) * 100}%`;
    document.querySelector('#recipe-pet-context').textContent = pets.length > 1 ? `Receita de ${petNames.join(' e ')}` : `Receita ${pets[0].possessive}`;
    const body = document.querySelector('#recipe-body');
    const resultTitle = pets.length > 1 ? 'A fornalha da matilha está pronta!' : `A fornalha ${pets[0].possessive} está pronta!`;
    const recipeIntro = step.result
      ? (pets.length > 1 ? `Receita compartilhada para ${petNames.join(' e ')} · ${recipeDays} ${recipeDays === 1 ? 'dia' : 'dias'} · ${totalDaily.toLocaleString('pt-BR')} g prontos por dia.` : `Receita para ${recipeDays} ${recipeDays === 1 ? 'dia' : 'dias'} · ${totalDaily.toLocaleString('pt-BR')} g prontos por dia · divididos em 2 refeições.`)
      : step.intro;
    body.innerHTML = `<div class="flow-intro"><p class="eyebrow">${step.eyebrow}</p><h1>${step.result ? resultTitle : step.title}</h1><p>${recipeIntro}</p></div>${step.content}`;
    body.scrollTop = 0;
    document.querySelector('#recipe-back').textContent = recipeStep === 0 ? 'Cancelar' : 'Voltar';
    document.querySelector('#recipe-next').textContent = step.result ? 'Salvar receita' : recipeStep === recipeSteps.length - 2 ? 'Ver receita →' : 'Continuar →';
    bindSingleChoices(body);
    const recipePresetData = {
      padrao: { name: 'Padrão', summary: '35% carnes · 5% vísceras · 35% carboidratos · 25% vegetais', shares: { meat: .35, organ: .05, carb: .35, vegetable: .25 } },
      proteina: { name: 'Mais proteína', summary: '45% carnes · 5% vísceras · 25% carboidratos · 25% vegetais', shares: { meat: .45, organ: .05, carb: .25, vegetable: .25 } },
      intermediaria: { name: 'Intermediária', summary: '40% carnes · 5% vísceras · 30% carboidratos · 25% vegetais', shares: { meat: .40, organ: .05, carb: .30, vegetable: .25 } },
      visceras: { name: 'Mais vísceras', summary: '40% carnes · 10% vísceras · 25% carboidratos · 25% vegetais', shares: { meat: .40, organ: .10, carb: .25, vegetable: .25 } }
    };
    const syncRecipePreset = () => body.querySelectorAll('[data-recipe-preset]').forEach((button) => {
      const selected = button.dataset.recipePreset === recipePreset;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    body.querySelectorAll('[data-recipe-preset]').forEach((button) => button.addEventListener('click', () => {
      recipePreset = button.dataset.recipePreset;
      syncRecipePreset();
    }));
    syncRecipePreset();
    const syncRecipeSupplement = () => body.querySelectorAll('[data-recipe-supplement]').forEach((button) => {
      const selected = button.dataset.recipeSupplement === recipeSupplement;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    body.querySelectorAll('[data-recipe-supplement]').forEach((button) => button.addEventListener('click', () => {
      recipeSupplement = button.dataset.recipeSupplement;
      syncRecipeSupplement();
    }));
    syncRecipeSupplement();
    const syncRecipePetChoices = () => {
      body.querySelectorAll('[data-recipe-pet-choice]').forEach((button) => {
        const selected = selectedRecipePets.has(button.dataset.recipePetChoice);
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      const chosen = [...selectedRecipePets].map((key) => recipePetData[key]);
      const note = body.querySelector('[data-shared-recipe-note] p');
      if (note) note.innerHTML = chosen.length > 1
        ? `<strong>Uma base, porções separadas</strong>Vamos somar os ingredientes e marcar quanto pertence a ${chosen.map((pet) => pet.name).join(' e ')}.`
        : `<strong>Uma receita para ${chosen[0].name}</strong>Você também pode incluir outro Monstrinho nesta fornalha.`;
      document.querySelector('#recipe-pet-context').textContent = chosen.length > 1 ? `Receita de ${chosen.map((pet) => pet.name).join(' e ')}` : `Receita ${chosen[0].possessive}`;
    };
    body.querySelectorAll('[data-recipe-pet-choice]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.recipePetChoice;
      if (selectedRecipePets.has(key) && selectedRecipePets.size === 1) {
        showToast('Escolha pelo menos um Monstrinho para continuar.');
        return;
      }
      selectedRecipePets.has(key) ? selectedRecipePets.delete(key) : selectedRecipePets.add(key);
      syncRecipePetChoices();
    }));
    body.querySelector('[data-add-recipe-pet]')?.addEventListener('click', () => startAdditionalPet('recipe'));
    syncRecipePetChoices();
    const ingredientSearch = body.querySelector('[data-ingredient-search]');
    if (ingredientSearch) ingredientSearch.addEventListener('input', () => {
      const query = ingredientSearch.value.trim().toLocaleLowerCase('pt-BR');
      const cards = [...body.querySelectorAll('[data-ingredient-name]')];
      let visible = 0;
      cards.forEach((card) => { card.hidden = query && !card.dataset.ingredientName.includes(query); if (!card.hidden) visible += 1; });
      body.querySelector('[data-ingredient-count]').textContent = `${visible} ${visible === 1 ? 'opção' : 'opções'}`;
    });
    body.querySelectorAll('[data-batch-days]').forEach((button) => button.addEventListener('click', () => {
      recipeDays = Number(button.dataset.batchDays);
      const field = body.querySelector('[data-custom-days-field]');
      field?.classList.remove('is-selected');
      const input = body.querySelector('#custom-recipe-days');
      if (input) input.value = '';
    }));
    const customDays = body.querySelector('#custom-recipe-days');
    if (customDays) customDays.addEventListener('input', () => {
      const value = Math.max(1, Math.min(30, Number(customDays.value) || 1));
      recipeDays = value;
      body.querySelectorAll('[data-batch-days]').forEach((button) => button.classList.remove('is-selected'));
      body.querySelector('[data-custom-days-field]').classList.add('is-selected');
    });
    if (step.result) {
      const presetResult = body.querySelector('[data-recipe-preset-result]');
      presetResult.innerHTML = `<small>Proporção escolhida</small><strong>${recipePresetData[recipePreset].name}</strong><span>${recipePresetData[recipePreset].summary}</span>`;
      body.querySelector('[data-recipe-batch-total]').textContent = `${(totalDaily * recipeDays).toLocaleString('pt-BR')} g`;
      const rawFactors = { meat: 1 / .75, organ: 1 / .77, carb: .95, vegetable: 1.10 };
      body.querySelectorAll('[data-base-group]').forEach((amount) => {
        const group = amount.dataset.baseGroup;
        const rawAmount = totalDaily * recipeDays * recipePresetData[recipePreset].shares[group] * rawFactors[group];
        amount.textContent = `≈ ${Math.round(rawAmount).toLocaleString('pt-BR')} g`;
      });
      const breakdown = body.querySelector('[data-pet-portion-breakdown]');
      breakdown.hidden = pets.length === 1;
      breakdown.innerHTML = pets.length > 1 ? `<div><small>Uma base para</small><strong>${petNames.join(' + ')}</strong></div>${pets.map((pet) => `<span><b>${pet.name}</b><small>${pet.daily} g/dia · ${pet.meal} g/ref.</small></span>`).join('')}` : '';
      const chosenSupplement = recipeSupplementData[recipeSupplement];
      body.querySelector('[data-supplement-context]').textContent = pets.length > 1
        ? `${chosenSupplement.name}: a base é compartilhada; as doses continuam separadas por pet.`
        : `${chosenSupplement.name}: dose calculada sobre a porção pronta de ${pets[0].name}.`;
      body.querySelector('[data-pet-finalizers]').innerHTML = recipePetFinalizersMarkup(pets, recipeSupplement);
      body.querySelector('[data-shared-finalizer-warning]').hidden = pets.length === 1;
      body.querySelector('[data-portion-row]').innerHTML = pets.length > 1
        ? pets.map((pet) => `<span><small>${pet.name}</small><strong>${pet.daily} g/dia</strong><b>${pet.meal} g/refeição</b></span>`).join('')
        : `<span><small>Por dia</small><strong>${pets[0].daily} g</strong></span><span><small>Por refeição</small><strong>${pets[0].meal} g</strong></span>`;
      const portions = body.querySelector('[data-prep-portions]');
      if (portions) portions.textContent = pets.length > 1
        ? `Depois de misturar, separe ${pets.map((pet) => `${recipeDays} ${recipeDays === 1 ? 'porção' : 'porções'} de ${pet.daily} g para ${pet.name}`).join(' e ')}. Cada porção diária rende duas refeições. Identifique os recipientes com nome e data.`
        : `Monte ${recipeDays} ${recipeDays === 1 ? 'porção diária' : 'porções diárias'} de ${pets[0].daily} g ou ${recipeDays * 2} refeições de ${pets[0].meal} g. Use recipientes rasos, limpos e identificados com a data.`;
    }
    body.querySelector('[data-skip-recipe]')?.addEventListener('click', () => { recipeStep += 1; renderRecipe(); });
  }

  let settleTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => goToSlide(Math.round(track.scrollLeft / track.clientWidth), false), 80);
  }, { passive: true });
  window.addEventListener('resize', () => goToSlide(activeSlide, false));
  dots.forEach((dot) => dot.addEventListener('click', () => goToSlide(Number(dot.dataset.goSlide))));
  next.addEventListener('click', () => activeSlide < 3 ? goToSlide(activeSlide + 1) : finishOnboarding());
  document.querySelector('#skip-onboarding').addEventListener('click', finishOnboarding);
  document.querySelector('#start-pet').addEventListener('click', () => {
    localStorage.setItem(storage.onboarding, 'true');
    profileStep = 0;
    resetProfileAnswers();
    profileMode = 'create';
    profileReturn = 'empty';
    showScreen('profile');
  });
  document.querySelector('#go-eat').addEventListener('click', () => {
    localStorage.setItem(storage.pet, 'true');
    showScreen('home');
  });
  document.querySelector('#add-another').addEventListener('click', () => startAdditionalPet('success'));
  document.querySelector('#create-recipe').addEventListener('click', () => subscriptionState() ? startRecipe() : openPaywall('recipe'));
  document.querySelector('#paywall-close').addEventListener('click', () => showScreen(paywallReturn === 'subscription' ? 'user-profile' : 'home'));
  document.querySelectorAll('[data-select-plan]').forEach((button) => button.addEventListener('click', () => {
    selectedPlan = button.dataset.selectPlan;
    updatePaywall();
  }));
  document.querySelectorAll('[data-annual-payment]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    selectedPlan = 'annual';
    annualPayment = button.dataset.annualPayment;
    updatePaywall();
  }));
  document.querySelector('#subscribe-now').addEventListener('click', () => {
    localStorage.setItem(storage.subscription, JSON.stringify({ plan: selectedPlan, payment: selectedPlan === 'annual' ? annualPayment : 'monthly' }));
    updateSubscriptionUI();
    showToast(selectedPlan === 'annual' ? 'Plano anual ativado. Boa fornalha!' : 'Plano mensal ativado. Boa fornalha!');
    if (paywallReturn === 'recipe') startRecipe();
    else showScreen('subscription');
  });
  document.querySelector('#restore-purchase').addEventListener('click', () => showToast('Nenhuma compra anterior foi encontrada nesta demonstração.'));
  document.querySelectorAll('[data-open-pet]').forEach((card) => card.addEventListener('click', () => openPet(card.dataset.openPet)));
  document.querySelector('#add-pet-from-list').addEventListener('click', () => startAdditionalPet('pets'));
  document.querySelector('#add-pet-from-detail').addEventListener('click', () => startAdditionalPet('pet-detail'));
  document.querySelector('#pet-detail-close').addEventListener('click', () => showScreen('pets'));
  document.querySelector('#pet-switcher').addEventListener('change', (event) => { applyPetContext(event.target.value); showToast(`Agora você está vendo ${petProfiles[selectedPet].name}.`); });
  document.querySelector('#edit-pet-stats').addEventListener('click', () => showScreen('pet-edit'));
  document.querySelector('#view-anamnesis').addEventListener('click', () => showScreen('anamnesis-detail'));
  document.querySelector('.pet-more').addEventListener('click', () => showToast(`Mais opções de ${petProfiles[selectedPet].name} aparecerão aqui.`));
  document.querySelector('#pet-edit-close').addEventListener('click', () => showScreen('pet-detail'));
  document.querySelector('#pet-edit-cancel').addEventListener('click', () => showScreen('pet-detail'));
  document.querySelector('#pet-edit-save').addEventListener('click', () => { showScreen('pet-detail'); showToast('Dados principais atualizados.'); });
  document.querySelector('.pet-photo-editor').addEventListener('click', () => showToast('A câmera ou a galeria será aberta aqui.'));
  document.querySelector('#anamnesis-close').addEventListener('click', () => showScreen('pet-detail'));
  document.querySelector('#edit-anamnesis').addEventListener('click', () => { profileStep = 0; profileMode = 'edit'; profileReturn = 'anamnesis-detail'; showScreen('profile'); });
  document.querySelector('.curiosity-search').addEventListener('click', () => showToast('A busca por tema ou fonte será aberta aqui.'));
  document.querySelectorAll('[data-curiosity-filter]').forEach((filter) => filter.addEventListener('click', () => {
    document.querySelectorAll('[data-curiosity-filter]').forEach((item) => item.classList.toggle('is-selected', item === filter));
    document.querySelectorAll('[data-curiosity-category]').forEach((card) => { card.hidden = filter.dataset.curiosityFilter !== 'all' && card.dataset.curiosityCategory !== filter.dataset.curiosityFilter; });
  }));
  document.querySelectorAll('[data-open-curiosity]').forEach((card) => card.addEventListener('click', () => {
    if (card.dataset.openCuriosity === 'storage') showScreen('curiosity-detail');
    else showToast('Este exemplo terá a mesma estrutura de leitura e fontes.');
  }));
  document.querySelector('#curiosity-detail-close').addEventListener('click', () => showScreen('curiosities'));
  document.querySelector('#curiosity-bookmark').addEventListener('click', (event) => {
    const saved = event.currentTarget.classList.toggle('is-saved');
    showToast(saved ? 'Curiosidade salva para ler depois.' : 'Curiosidade removida dos salvos.');
  });
  document.querySelector('.recipe-search').addEventListener('click', () => showToast('A busca por nome ou ingrediente será aberta aqui.'));
  document.querySelectorAll('[data-recipe-filter]').forEach((filter) => filter.addEventListener('click', () => {
    document.querySelectorAll('[data-recipe-filter]').forEach((item) => item.classList.toggle('is-selected', item === filter));
    document.querySelectorAll('[data-recipe-pet]').forEach((card) => { card.hidden = filter.dataset.recipeFilter !== 'all' && card.dataset.recipePet !== filter.dataset.recipeFilter; });
  }));
  document.querySelectorAll('[data-open-recipe]').forEach((card) => card.addEventListener('click', () => {
    if (card.dataset.openRecipe === 'frango') showScreen('recipe-detail');
    else showToast('O detalhe desta receita seguirá o mesmo modelo da receita da Mel.');
  }));
  document.querySelector('#recipe-detail-close').addEventListener('click', () => showScreen('saved-recipes'));
  document.querySelector('.recipe-detail-menu').addEventListener('click', () => showToast('Aqui entram renomear, favoritar e excluir.'));
  document.querySelector('#see-cook-history').addEventListener('click', () => showToast('O histórico completo entra na próxima rodada.'));
  document.querySelector('#cook-again').addEventListener('click', () => showScreen('cook-log'));
  document.querySelector('#cook-log-close').addEventListener('click', () => showScreen('recipe-detail'));
  document.querySelector('#cook-log-cancel').addEventListener('click', () => showScreen('recipe-detail'));
  document.querySelector('#finished-photo-picker').addEventListener('click', (event) => {
    event.currentTarget.classList.add('has-photo');
    event.currentTarget.querySelector('strong').textContent = 'Foto adicionada';
    event.currentTarget.querySelector('small').textContent = 'Toque para trocar';
  });
  document.querySelectorAll('.cook-pet').forEach((pet) => pet.addEventListener('click', () => pet.classList.toggle('is-selected')));
  document.querySelectorAll('.recipe-rating button').forEach((heart, index, hearts) => heart.addEventListener('click', () => {
    hearts.forEach((item, itemIndex) => item.classList.toggle('is-on', itemIndex <= index));
    document.querySelector('.rating-caption').textContent = index >= 4 ? 'Amaram! Essa vai voltar para o potinho.' : index >= 2 ? 'Curtiram a fornalha.' : 'Não foi a favorita desta vez.';
  }));
  document.querySelector('#save-cook-log').addEventListener('click', () => {
    featuredCookCount += 1;
    document.querySelector('#detail-times').textContent = `${featuredCookCount} vezes`;
    document.querySelectorAll('[data-recipe-times]').forEach((node) => { node.textContent = `Feita ${featuredCookCount} vezes`; });
    showScreen('recipe-detail');
    showToast(`Fornalha nº ${featuredCookCount} salva com sucesso!`);
  });
  document.querySelectorAll('[data-open-user-profile]').forEach((button) => button.addEventListener('click', () => {
    const activeScreen = screens.find((screen) => screen.classList.contains('is-active'));
    userProfileReturn = activeScreen?.dataset.screen || 'home';
    showScreen('user-profile');
  }));
  document.querySelector('#user-profile-close').addEventListener('click', () => showScreen(userProfileReturn));
  document.querySelector('#change-user-photo').addEventListener('click', () => showToast('A câmera ou a galeria será aberta aqui.'));
  document.querySelector('#edit-user-profile').addEventListener('click', () => showToast('A edição de nome, foto e e-mail será aberta aqui.'));
  document.querySelector('#manage-plan').addEventListener('click', () => subscriptionState() ? showScreen('subscription') : openPaywall('subscription'));
  document.querySelector('#subscription-close').addEventListener('click', () => showScreen('user-profile'));
  document.querySelector('#change-subscription').addEventListener('click', () => openPaywall('subscription'));
  document.querySelector('#restore-from-account').addEventListener('click', () => showToast('Sua compra está ativa neste aparelho.'));
  document.querySelector('#cancel-renewal').addEventListener('click', () => showToast('A confirmação de cancelamento será exibida antes de concluir.'));
  document.querySelectorAll('[data-user-action]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.userAction)));
  document.querySelector('#user-notifications').addEventListener('click', (event) => {
    const enabled = event.currentTarget.getAttribute('aria-checked') !== 'true';
    event.currentTarget.setAttribute('aria-checked', String(enabled));
    event.currentTarget.classList.toggle('is-on', enabled);
    showToast(enabled ? 'Lembretes da matilha ativados.' : 'Lembretes da matilha desativados.');
  });
  document.querySelector('#user-signout').addEventListener('click', () => {
    localStorage.removeItem(storage.auth);
    showScreen('auth');
    showToast('Você saiu da conta.');
  });
  document.querySelector('#profile-close').addEventListener('click', () => showScreen(profileReturn));
  document.querySelector('#profile-back').addEventListener('click', () => { if (profileStep > 0) { profileStep = adjacentProfileStep(-1); renderProfile(); } });
  document.querySelector('#profile-next').addEventListener('click', () => {
    if (profileStep < profileSteps.length - 1) { profileStep = adjacentProfileStep(1); renderProfile(); }
    else if (profileMode === 'edit') { showScreen('pet-detail'); showToast('Respostas da anamnese atualizadas.'); }
    else if (profileReturn === 'pets' || profileReturn === 'pet-detail') { showScreen('pets'); showToast('Novo Monstrinho cadastrado.'); }
    else if (profileReturn === 'recipe') { recipeStep = 0; showScreen('recipe'); showToast('Novo Monstrinho cadastrado. Ele entrará na lista da próxima versão.'); }
    else showScreen('success');
  });
  document.querySelector('#recipe-close').addEventListener('click', () => showScreen('home'));
  document.querySelector('#recipe-back').addEventListener('click', () => {
    if (recipeStep > 0) { recipeStep -= 1; renderRecipe(); } else showScreen('home');
  });
  document.querySelector('#recipe-next').addEventListener('click', () => {
    if (recipeStep < recipeSteps.length - 1) { recipeStep += 1; renderRecipe(); }
    else { showToast('Receita salva para futuras fornalhas!'); setTimeout(() => showScreen('saved-recipes'), 900); }
  });
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.nav === 'papa' && localStorage.getItem(storage.pet) === 'true') showScreen('home');
    else if (button.dataset.nav === 'zilla' && localStorage.getItem(storage.pet) === 'true') showScreen('pets');
    else if (button.dataset.nav === 'zilla') showScreen('empty');
    else if (button.dataset.nav === 'curiosidades') showScreen('curiosities');
    else if (button.dataset.nav === 'salvas') showScreen('saved-recipes');
    else showToast('Essa área entra nas próximas telas do protótipo.');
  }));
  document.querySelectorAll('[data-legal]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.legal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'} será aberta aqui.`)));
  previewLinks.forEach((link) => link.addEventListener('click', () => showScreen(link.dataset.preview, { auto: false })));
  document.querySelector('#reset-demo').addEventListener('click', () => {
    localStorage.removeItem(storage.onboarding);
    localStorage.removeItem(storage.pet);
    localStorage.removeItem(storage.auth);
    localStorage.removeItem(storage.subscription);
    resetProfileAnswers();
    showScreen('splash');
  });

  const params = new URLSearchParams(location.search);
  if (params.has('reset')) {
    localStorage.removeItem(storage.onboarding);
    localStorage.removeItem(storage.pet);
    localStorage.removeItem(storage.auth);
    localStorage.removeItem(storage.subscription);
    history.replaceState({}, '', location.pathname);
  }
  chooseCuriosityHero();
  showScreen('splash');
})();
