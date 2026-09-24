import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import aniversarioIcon from '../assets/icons/aniversario.png';
import digestaoIcon from '../assets/icons/digestao.png';
import escovacaoIcon from '../assets/icons/escovacao.png';
import pesoIcon from '../assets/icons/peso.png';
import zillaFallback from '../assets/icons/zilla.png';
import { getActivePet, listPets, type StoredPet } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';
import { findOriginalRecipe } from '../lib/originalRecipes.js';
import { getSubscription, hasActiveAccess, loadSubscriptionForOwner } from '../lib/subscription.js';
import { getUserId } from '../lib/session.js';
import { AccountAvatarLink } from '../components/AccountAvatarLink.js';

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
  const [searchParams] = useSearchParams();
  const [continuing, setContinuing] = useState(false);
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
  const requestedReturnTo = searchParams.get('returnTo') ?? 'recipe';
  const originalSlug = requestedReturnTo.startsWith('original:') ? requestedReturnTo.slice('original:'.length) : '';
  const original = findOriginalRecipe(originalSlug);
  const returnTo = original ? `original:${original.slug}` : 'recipe';
  const destination = original ? `/papa/original/${encodeURIComponent(original.slug)}` : '/receita';
  const primaryLabel = original ? `Preparar ${original.title}` : 'Criar minha receita personalizada';

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

  async function continueToRecipe() {
    if (continuing) return;
    setContinuing(true);
    await loadSubscriptionForOwner(getUserId());
    if (hasActiveAccess(getSubscription())) {
      navigate(destination);
      return;
    }
    navigate(`/assinatura?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <div className="beneficios-view">
      <header className="app-header app-header--papa beneficios-header">
        <div className="app-header__title">
          <small>PAPÁ</small>
          <strong>O que vamos papá?</strong>
        </div>
        <AccountAvatarLink />
      </header>

      <main className="beneficios-letter">
        <section className="beneficios-greeting">
          <div>
            <h1>
              Querido humano {ownerPreposition} {petNames}, <span aria-hidden="true">♥</span>
            </h1>
            <p>Antes de ir pra cozinha, deixa eu te contar por que essa troca vale tanto a pena.</p>
          </div>

          <figure className={`beneficios-pet-photo${activePet?.photoPath ? '' : ' is-placeholder'}`}>
            <img
              src={petPhoto}
              alt={activePet ? `Foto cadastrada de ${activePet.name}` : ''}
              onError={(event) => {
                const image = event.currentTarget;
                image.onerror = null;
                image.src = zillaFallback;
                image.alt = '';
                image.closest('figure')?.classList.add('is-placeholder');
              }}
            />
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
          onClick={() => { void continueToRecipe(); }}
          disabled={continuing}
        >
          {continuing ? 'Verificando acesso…' : primaryLabel} <span aria-hidden="true">›</span>
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
