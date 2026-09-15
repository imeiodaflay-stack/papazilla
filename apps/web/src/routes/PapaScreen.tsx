import { useNavigate } from 'react-router-dom';
import zilla from '../assets/zilla-frente.png';

/**
 * Papá sem Monstrinho cadastrado — mostrada em `/papa` enquanto `hasPet()` é
 * falso (ver `PapaRoute`). Sem pet não dá pra calcular receita nenhuma (peso,
 * fase de vida e rotina entram direto na conta), então em vez de deixar a
 * aba acessível com um placeholder técnico, explicamos o porquê e levamos
 * direto pro cadastro — mesmo padrão de `ZillaScreen`, com o mascote e o
 * card centralizados em `.empty-state`, mas com o texto contextualizado
 * para "por que preciso saber quem vai comer" em vez de "matilha vazia".
 */
export function PapaScreen() {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state__mascot">
        <span className="speech-bubble">Au! Quem eu vou alimentar?</span>
        <img src={zilla} alt="Zilla esperando conhecer seu pet" />
      </div>
      <p className="eyebrow">Toda receita começa por um Monstrinho</p>
      <h1 className="pz-h1">Ainda não sei para quem cozinhar</h1>
      <p>
        Peso, fase de vida e rotina entram direto no cálculo — cadastre seu primeiro aumigo para eu montar a
        receita certa para ele.
      </p>
      <button type="button" className="pz-button pz-button--primary wide" onClick={() => navigate('/anamnese')}>
        Cadastrar um aumigo <span aria-hidden="true">＋</span>
      </button>
    </div>
  );
}
