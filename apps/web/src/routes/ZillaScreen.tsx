import { Link, useNavigate } from 'react-router-dom';
import wordmark from '../assets/papazilla-wordmark.png';
import zilla from '../assets/zilla-frente.png';
import { AppNav } from '../components/AppNav.js';

/**
 * Sem Monstrinhos — fiel à tela "empty" de `papazilla-prototype`.
 * Estado inicial da área Pets: matilha vazia, com o Zilla convidando o cadastro.
 *
 * Tela cheia própria (não usa `AppShell`): assim como no protótipo, esta e a
 * lista da matilha (`PetsListScreen`) têm cabeçalhos diferentes por trás do
 * mesmo `/zilla` — ver `ZillaRoute`.
 */
export function ZillaScreen() {
  const navigate = useNavigate();

  return (
    <div className="app-view">
      <header className="app-header">
        <img src={wordmark} alt="Papazilla" />
        <Link to="/conta" className="avatar-button" aria-label="Abrir Minha conta">
          F
        </Link>
      </header>
      <main className="app-view__main">
        <div className="empty-state">
          <div className="empty-state__mascot">
            <span className="speech-bubble">Au! Quem mora por aí?</span>
            <img src={zilla} alt="Zilla esperando conhecer seu pet" />
          </div>
          <p className="eyebrow">A matilha começa aqui</p>
          <h1 className="pz-h1">Ainda não conheço seus Monstrinhos</h1>
          <p>Cadastre seu primeiro aumigo para prepararmos uma receita feita para ele.</p>
          <button
            type="button"
            className="pz-button pz-button--primary wide"
            onClick={() => navigate('/anamnese')}
          >
            Cadastrar um aumigo <span aria-hidden="true">＋</span>
          </button>
        </div>
      </main>
      <AppNav />
    </div>
  );
}
