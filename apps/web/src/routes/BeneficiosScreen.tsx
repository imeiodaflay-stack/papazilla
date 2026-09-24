import { useNavigate } from 'react-router-dom';
import aniversarioIcon from '../assets/icons/aniversario.png';
import digestaoIcon from '../assets/icons/digestao.png';
import escovacaoIcon from '../assets/icons/escovacao.png';
import pesoIcon from '../assets/icons/peso.png';
import zillaFallback from '../assets/icons/zilla.png';
import zillaFront from '../assets/zilla-frente-transparent.png';
import { getActivePet, listPets, type StoredPet } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';

function petArticle(pet: StoredPet): string {
  return `${describePet(pet).article} ${pet.name}`;
}

/**
 * Carta de benefícios exibida depois do cadastro do pet. O conteúdo segue a
 * proposta aprovada por Flay; nomes, artigos e pronomes acompanham a matilha
 * real, enquanto a fotografia usa o pet ativo (normalmente o recém-cadastrado).
 */
export function BeneficiosScreen() {
  const navigate = useNavigate();
  const pets = listPets();
  const activePet = getActivePet() ?? pets[0] ?? null;
  const activeDescription = describePet(activePet);
  const isPack = pets.length > 1;
  const petNames = pets.length > 0 ? joinPt(pets.map((pet) => pet.name)) : activeDescription.displayName;
  const petNamesWithArticles = pets.length > 0
    ? joinPt(pets.map(petArticle))
    : `${activeDescription.article} ${activeDescription.displayName}`;
  const ownerPreposition = isPack ? 'de' : activeDescription.preposition;
  const pronoun = isPack ? 'deles' : activeDescription.isFemale ? 'dela' : 'dele';
  const subjectPronoun = isPack ? 'eles' : activeDescription.isFemale ? 'ela' : 'ele';
  const subscriberVerb = isPack ? 'são assinantes' : 'já é assinante';
  const petPhoto = activePet?.photoPath || zillaFallback;

  const benefits = [
    {
      icon: aniversarioIcon,
      title: `Mais anos ao lado ${pronoun}`,
      text: 'Comida de verdade cuida por dentro.',
      tone: 'green',
    },
    {
      icon: escovacaoIcon,
      title: 'Pelo brilhando, energia sobrando',
      text: 'Pra brincar até cansar.',
      tone: 'peach',
    },
    {
      icon: digestaoIcon,
      title: 'Barriguinha mais tranquila',
      text: 'Sem ultraprocessado pra incomodar.',
      tone: 'cream',
    },
    {
      icon: pesoIcon,
      title: `Na medida certinha ${pronoun}`,
      text: 'Nunca uma tabela genérica.',
      tone: 'green',
    },
  ];

  return (
    <div className="beneficios-view">
      <div className="beneficios-top" aria-hidden="true">
        <p>
          Um bilhete da Zilla pra quem cuida {ownerPreposition} {petNames} <span>♥</span>
        </p>
        <img src={zillaFront} alt="" />
        <b>♥</b>
        <i>● ●</i>
      </div>

      <main className="beneficios-letter">
        <section className="beneficios-greeting">
          <div>
            <h1>
              Querido humano {ownerPreposition} {petNames}, <span aria-hidden="true">♥</span>
            </h1>
            <p>Antes de ir pra cozinha, deixa eu te contar por que essa troca vale tanto a pena.</p>
          </div>

          <figure className={`beneficios-pet-photo${activePet?.photoPath ? '' : ' is-placeholder'}`}>
            <img src={petPhoto} alt={activePet ? `Foto cadastrada de ${activePet.name}` : ''} />
            <span aria-hidden="true">♡</span>
          </figure>
        </section>

        <section className="beneficios-grid" aria-label="Benefícios da alimentação natural">
          {benefits.map((benefit) => (
            <article className={`beneficios-benefit beneficios-benefit--${benefit.tone}`} key={benefit.title}>
              <img src={benefit.icon} alt="" />
              <div>
                <h2>{benefit.title}</h2>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="beneficios-divider" aria-hidden="true"><span>♥</span></div>

        <p className="beneficios-promise">
          Você não quer só alimentar {petNamesWithArticles}.<br />
          Você quer cuidar {pronoun} do jeito que {subjectPronoun} merece{isPack ? 'm' : ''}.
        </p>

        <div className="beneficios-signoff">
          <p>
            P.S. Se {petNamesWithArticles} {subscriberVerb}, essa carta é só pra lembrar: toda receita nova continua
            calculada assim, com esse mesmo carinho.
          </p>
          <strong>Com carinho,<br /><b>Zilla</b> 🐾</strong>
        </div>
      </main>

      <div className="beneficios-actions">
        <button
          type="button"
          className="pz-button pz-button--primary wide"
          onClick={() => navigate('/receita', { replace: true })}
        >
          Criar minha receita personalizada <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="pz-button pz-button--text beneficios-secondary wide"
          onClick={() => navigate('/papa', { replace: true })}
        >
          Agora não, quero só olhar
        </button>
      </div>

      <div className="beneficios-garden" aria-hidden="true"><span /><b>♥</b><span /></div>
    </div>
  );
}
