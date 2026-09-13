import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import infoIcon from '../assets/icons/info.png';
import salvarIcon from '../assets/icons/salvar.png';
import { ART_ICON, findCuriosity } from '../lib/curiosities.js';

/** "PREPARO · USDA" -> "Preparo · USDA" (só a categoria fica em title case; a sigla da fonte permanece como está). */
function titleCaseCategory(sourceLabel: string): string {
  const [category, source] = sourceLabel.split(' · ');
  const cased = category ? category[0] + category.slice(1).toLowerCase() : category;
  return source ? `${cased} · ${source}` : (cased ?? sourceLabel);
}


/**
 * Artigo de curiosidade — fiel à tela "curiosity-detail" de
 * `papazilla-prototype`. Só existe conteúdo completo para "storage" hoje
 * (mesma limitação do protótipo); qualquer outro id volta para a lista.
 *
 * "Salvar" fica só na sessão (sem `localStorage`): ainda não existe uma
 * lista de curiosidades salvas para mostrar o resultado, então persistir
 * criaria estado sem tela nenhuma pra consumi-lo.
 */
export function CuriosidadeDetalheScreen() {
  const navigate = useNavigate();
  const { curiosidadeId } = useParams();
  const curiosity = curiosidadeId ? findCuriosity(curiosidadeId) : undefined;
  const [saved, setSaved] = useState(false);

  if (!curiosity || !curiosity.article) return <Navigate to="/curiosidades" replace />;
  const { article } = curiosity;

  return (
    <div className="flow-screen curiosity-detail-view">
      <header className="flow-header">
        <button
          type="button"
          className="flow-header__back"
          aria-label="Voltar para curiosidades"
          onClick={() => navigate('/curiosidades')}
        >
          ←
        </button>
        <div>
          <span className="flow-header__eyebrow">{article.headerEyebrow}</span>
          <strong>{curiosity.readTime}</strong>
        </div>
        <button
          type="button"
          className={`flow-header__avatar curiosity-bookmark${saved ? ' is-saved' : ''}`}
          aria-label="Salvar conteúdo"
          onClick={() => setSaved((v) => !v)}
        >
          <img src={salvarIcon} alt="" />
        </button>
      </header>

      <div className="flow-body curiosity-article">
        <div className={`curiosity-article-art curiosity-art--${curiosity.art}`}>
          <img src={ART_ICON[curiosity.art]} alt="" />
          {curiosity.art === 'cool' ? (
            <>
              <i />
              <i />
              <i />
            </>
          ) : null}
        </div>
        <p className="eyebrow">{titleCaseCategory(curiosity.sourceLabel)}</p>
        <h1>{curiosity.title}</h1>
        <p className="curiosity-lead">{article.lead}</p>
        <div className="article-fact">
          <strong>{article.fact.value}</strong>
          <span>{article.fact.text}</span>
        </div>
        {article.sections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </div>
        ))}
        <aside className="article-scope">
          <img src={infoIcon} alt="" />
          <p>
            <strong>Escopo desta curiosidade</strong>
            {article.scope}
          </p>
        </aside>
        <a className="article-source" href={article.source.url} target="_blank" rel="noopener noreferrer">
          <span>
            <small>{article.source.label}</small>
            <strong>{article.source.name}</strong>
            <em>{article.source.updated}</em>
          </span>
          <b aria-hidden="true">↗</b>
        </a>
      </div>
    </div>
  );
}
