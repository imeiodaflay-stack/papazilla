import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import excluirIcon from '../assets/icons/excluir.png';
import infoIcon from '../assets/icons/info.png';
import { deleteAccountData, downloadAccountData } from '../lib/accountData.js';
import { setAuthenticated } from '../lib/session.js';

/**
 * Dados da conta — sem tela equivalente no protótipo (lá era um toast "as
 * opções para baixar ou excluir os dados terão uma confirmação antes de
 * continuar"). As duas ações são reais: baixar gera um .json com tudo que o
 * Papazilla guarda no aparelho (`accountData.ts`); excluir apaga esses
 * mesmos dados de verdade — por isso pede confirmação explícita antes.
 */
export function AccountDataScreen() {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  function download() {
    downloadAccountData();
    toast('Seus dados foram baixados.');
  }

  function confirmDelete() {
    deleteAccountData();
    setAuthenticated(false);
    navigate('/entrar', { replace: true });
  }

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button type="button" className="flow-header__back" aria-label="Voltar para Minha conta" onClick={() => navigate('/conta')}>
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Minha conta</span>
          <strong>Dados da conta</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={excluirIcon} alt="" />
        </span>
      </header>

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Seus dados, com você</p>
          <h1>Baixar ou excluir seus dados</h1>
          <p>Tudo o que o Papazilla guarda neste aparelho: pets, respostas, receitas e assinatura simulada.</p>
        </div>

        <section className="pet-section">
          <div className="pet-section__heading">
            <div>
              <p className="eyebrow">Exportar</p>
              <h2>Baixar meus dados</h2>
            </div>
          </div>
          <p className="profile-question__hint">Gera um arquivo .json com tudo cadastrado neste aparelho.</p>
          <button type="button" className="pz-button pz-button--outline wide" onClick={download}>
            Baixar meus dados
          </button>
        </section>

        <section className="pet-section">
          <div className="pet-section__heading">
            <div>
              <p className="eyebrow">Irreversível</p>
              <h2>Excluir meus dados</h2>
            </div>
          </div>
          <p className="profile-question__hint">
            Apaga pets, respostas, receitas e assinatura simulada deste aparelho e volta para a tela de entrada.
          </p>

          {confirming ? (
            <div className="clinical-warning">
              <img src={infoIcon} alt="" />
              <p>
                <strong>Tem certeza?</strong>
                <span>Essa ação não pode ser desfeita. Considere baixar seus dados antes de continuar.</span>
              </p>
            </div>
          ) : null}

          {confirming ? (
            <div className="confirm-actions">
              <button type="button" className="pz-button pz-button--outline" onClick={() => setConfirming(false)}>
                Cancelar
              </button>
              <button type="button" className="pz-button pz-button--primary" onClick={confirmDelete}>
                Sim, excluir tudo
              </button>
            </div>
          ) : (
            <button type="button" className="pz-button pz-button--outline wide" onClick={() => setConfirming(true)}>
              Excluir meus dados
            </button>
          )}
        </section>
      </div>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
