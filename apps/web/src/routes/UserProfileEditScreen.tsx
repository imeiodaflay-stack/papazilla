import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import perfilIcon from '../assets/icons/perfil.png';
import { getUserProfile, setUserProfile } from '../lib/userProfile.js';
import { fileToDataUrl, PhotoUploadError, uploadPhoto } from '../lib/photoUpload.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dados pessoais — sem tela equivalente no protótipo (lá "Editar" só mostrava
 * um toast). Nome, e-mail e foto são reais: gravados em `userProfile.ts` e
 * refletidos no card de identidade de Minha conta.
 */
export function UserProfileEditScreen() {
  const navigate = useNavigate();
  const current = getUserProfile();
  const [name, setName] = useState(current?.name ?? '');
  const [email, setEmail] = useState(current?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(current?.avatarUrl ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    try {
      setAvatarUrl(await fileToDataUrl(file));
      setAvatarUrl(await uploadPhoto('avatars', file));
    } catch (err) {
      toast(err instanceof PhotoUploadError ? err.message : 'Não foi possível carregar a foto.');
    } finally {
      setAvatarUploading(false);
    }
  }

  const emailValid = !email.trim() || EMAIL_PATTERN.test(email.trim());
  const saveDisabled = !name.trim() || !email.trim() || !emailValid;

  function save() {
    setUserProfile({ name: name.trim(), email: email.trim(), avatarUrl: avatarUrl || undefined });
    navigate('/conta', { state: { toast: 'Dados pessoais atualizados.' } });
  }

  return (
    <div className="flow-screen">
      <header className="flow-header">
        <button type="button" className="flow-header__back" aria-label="Voltar para Minha conta" onClick={() => navigate('/conta')}>
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">Minha conta</span>
          <strong>Dados pessoais</strong>
        </div>
        <span className="flow-header__avatar">
          <img src={perfilIcon} alt="" />
        </span>
      </header>

      <div className="flow-body">
        <div className="flow-intro">
          <p className="eyebrow">Seu perfil</p>
          <h1>Como podemos te chamar?</h1>
          <p>Nome e e-mail aparecem em Minha conta e nas comunicações do Papazilla.</p>
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <button
          type="button"
          className="pet-photo-editor"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading}
        >
          <span>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="photo-picker__preview" />
            ) : (
              <img src={perfilIcon} alt="" />
            )}
          </span>
          <strong>{avatarUploading ? 'Enviando...' : 'Alterar foto'}</strong>
          <small>Opcional</small>
        </button>

        <div className="form-grid">
          <label className="profile-field profile-field--full">
            <span>Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Seu nome" />
          </label>
          <label className="profile-field profile-field--full">
            <span>E-mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="voce@exemplo.com"
            />
            {!emailValid ? <small className="field-error">Digite um e-mail válido.</small> : null}
          </label>
        </div>
      </div>

      <footer className="flow-footer">
        <button type="button" className="pz-button pz-button--outline" onClick={() => navigate('/conta')}>
          Cancelar
        </button>
        <button type="button" className="pz-button pz-button--primary" disabled={saveDisabled} onClick={save}>
          Salvar
        </button>
      </footer>

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
