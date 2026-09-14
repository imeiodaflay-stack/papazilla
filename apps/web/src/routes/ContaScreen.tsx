import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import editarIcon from '../assets/icons/editar.png';
import patinhaIcon from '../assets/icons/patinha.png';
import perfilIcon from '../assets/icons/perfil.png';
import sucessoIcon from '../assets/icons/sucesso.png';
import notificacoesIcon from '../assets/icons/notificacoes.png';
import ajustesIcon from '../assets/icons/ajustes.png';
import mensagemIcon from '../assets/icons/mensagem.png';
import infoIcon from '../assets/icons/info.png';
import excluirIcon from '../assets/icons/excluir.png';
import { listPets } from '../lib/petsStore.js';
import { describePet, joinPt } from '../lib/petLabel.js';
import { getSubscription } from '../lib/subscription.js';
import { setAuthenticated } from '../lib/session.js';
import { getUserProfile } from '../lib/userProfile.js';

const PLAN_NAME = { annual: 'Papazilla Anual', monthly: 'Papazilla Mensal' } as const;
const PLAN_PAYMENT = {
  upfront: 'R$ 107,90 à vista',
  installments: '12 pagamentos de R$ 9,99',
  monthly: 'R$ 19,90 por mês',
} as const;

/**
 * Minha conta — fiel à tela "user-profile" de `papazilla-prototype`: identidade,
 * plano, conta e acesso, preferências, ajuda e privacidade, sair da conta.
 *
 * Sem provedor de login real ainda (Fase 0), então nome/e-mail só aparecem
 * se o próprio tutor os preencher em "Dados pessoais" (`UserProfileEditScreen`)
 * — sem isso, ficam genéricos em vez de um valor inventado (diferente do
 * protótipo, que mostra "Flávia Coelho" fixo). "Sair da conta" é real; "Dados
 * pessoais", "Acesso e segurança", "Termos e privacidade" e "Dados da conta"
 * agora abrem telas de verdade (ver rotas em `App.tsx`).
 */
export function ContaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = getSubscription();
  const pets = listPets();
  const userProfile = getUserProfile();
  const [notifications, setNotifications] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      toast(state.toast);
      navigate('.', { replace: true, state: null });
    }
  }, []);

  const petsLine =
    pets.length > 0
      ? `Tutor(a) de ${joinPt(pets.map((p) => describePet(p).displayName))}`
      : 'Ainda sem Monstrinhos cadastrados';

  const planName = subscription ? PLAN_NAME[subscription.plan] : 'Acesso gratuito';
  const planDescription = subscription
    ? 'Receitas personalizadas para toda a matilha, salvas e disponíveis em qualquer aparelho.'
    : 'Cadastre seus pets e explore os conteúdos. Assine para criar receitas personalizadas.';
  const valueLabel = subscription ? (subscription.plan === 'monthly' ? 'Renovação mensal' : 'Pagamento') : 'Receitas';
  const planValue = subscription ? PLAN_PAYMENT[subscription.payment] : 'Benefício premium';

  function goManagePlan() {
    if (subscription) navigate('/assinatura/gerenciar');
    else navigate('/assinatura', { state: { returnTo: 'conta' } });
  }

  function toggleNotifications() {
    setNotifications((prev) => {
      const next = !prev;
      toast(next ? 'Lembretes da matilha ativados.' : 'Lembretes da matilha desativados.');
      return next;
    });
  }

  function signOut() {
    toast('Você saiu da conta.');
    window.setTimeout(() => {
      setAuthenticated(false);
      navigate('/entrar', { replace: true });
    }, 700);
  }

  return (
    <div className="user-profile-view">
      <header className="user-profile-header">
        <button type="button" className="flow-header__back" aria-label="Voltar" onClick={() => navigate(-1)}>
          ←
        </button>
        <div>
          <p className="eyebrow">Seu espaço</p>
          <h1>Minha conta</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <div className="user-profile-content">
        <section className="user-identity-card">
          <button
            type="button"
            className="user-avatar-large"
            aria-label="Alterar foto do perfil"
            onClick={() => toast('A câmera ou a galeria será aberta aqui.')}
          >
            <span>F</span>
            <i aria-hidden="true">＋</i>
          </button>
          <div>
            <h2>{userProfile?.name || 'Tutor(a)'}</h2>
            <p>{userProfile?.email || 'Nome e e-mail ainda não cadastrados'}</p>
            <span>{petsLine}</span>
          </div>
          <button type="button" className="user-edit-button" onClick={() => navigate('/conta/editar')}>
            <img src={editarIcon} alt="" />
            Editar
          </button>
        </section>

        <section className="user-plan-card">
          <div className="user-plan-card__top">
            <span>
              <img src={patinhaIcon} alt="" />
            </span>
            <div>
              <small>Seu plano</small>
              <strong>{planName}</strong>
            </div>
            <b>{subscription ? 'Ativo' : 'Grátis'}</b>
          </div>
          <p>{planDescription}</p>
          <div className="user-plan-card__bottom">
            <span>
              <small>{valueLabel}</small>
              <strong>{planValue}</strong>
            </span>
            <button type="button" onClick={goManagePlan}>
              {subscription ? 'Gerenciar plano →' : 'Conhecer planos →'}
            </button>
          </div>
        </section>

        <section className="user-settings-group" aria-labelledby="account-settings-title">
          <h2 id="account-settings-title">Conta e acesso</h2>
          <button
            type="button"
            className="user-settings-row"
            onClick={() => navigate('/conta/editar')}
          >
            <span className="user-settings-row__icon">
              <img src={perfilIcon} alt="" />
            </span>
            <span>
              <strong>Dados pessoais</strong>
              <small>Nome, foto e e-mail</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
          <button
            type="button"
            className="user-settings-row"
            onClick={() => navigate('/conta/acesso')}
          >
            <span className="user-settings-row__icon">
              <img src={sucessoIcon} alt="" />
            </span>
            <span>
              <strong>Acesso e segurança</strong>
              <small>Como você entra na conta</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        </section>

        <section className="user-settings-group" aria-labelledby="preferences-title">
          <h2 id="preferences-title">Preferências</h2>
          <div className="user-settings-row user-settings-row--toggle">
            <span className="user-settings-row__icon">
              <img src={notificacoesIcon} alt="" />
            </span>
            <span>
              <strong>Lembretes da matilha</strong>
              <small>Fornalhas, avaliações e novidades</small>
            </span>
            <button
              type="button"
              className={`user-toggle${notifications ? ' is-on' : ''}`}
              role="switch"
              aria-checked={notifications}
              aria-label="Ativar lembretes"
              onClick={toggleNotifications}
            >
              <i aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="user-settings-row"
            onClick={() => toast('Papazilla usa sempre o visual oficial — sem tema alternativo por enquanto.')}
          >
            <span className="user-settings-row__icon">
              <img src={ajustesIcon} alt="" />
            </span>
            <span>
              <strong>Aparência</strong>
              <small>Visual oficial do Papazilla</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        </section>

        <section className="user-settings-group" aria-labelledby="support-title">
          <h2 id="support-title">Ajuda e privacidade</h2>
          <Link to="/ajuda" className="user-settings-row">
            <span className="user-settings-row__icon">
              <img src={mensagemIcon} alt="" />
            </span>
            <span>
              <strong>Central de Ajuda</strong>
              <small>Dúvidas e contato</small>
            </span>
            <b aria-hidden="true">›</b>
          </Link>
          <button
            type="button"
            className="user-settings-row"
            onClick={() => navigate('/conta/termos')}
          >
            <span className="user-settings-row__icon">
              <img src={infoIcon} alt="" />
            </span>
            <span>
              <strong>Termos e privacidade</strong>
              <small>Como cuidamos dos seus dados</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
          <button
            type="button"
            className="user-settings-row"
            onClick={() => navigate('/conta/dados')}
          >
            <span className="user-settings-row__icon">
              <img src={excluirIcon} alt="" />
            </span>
            <span>
              <strong>Dados da conta</strong>
              <small>Baixar ou solicitar exclusão</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        </section>

        <button type="button" className="user-signout" onClick={signOut}>
          Sair da conta
        </button>
        <p className="user-app-version">Papazilla · versão em desenvolvimento</p>
      </div>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
