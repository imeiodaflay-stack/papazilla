import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import zillaLendo from '../assets/zilla-lendo.png';
import buscaIcon from '../assets/icons/busca.png';
import { AppNav } from '../components/AppNav.js';
import { ART_ICON, CATEGORY_LABELS, CURIOSITIES, type CuriosityCategory } from '../lib/curiosities.js';

type FilterValue = 'all' | CuriosityCategory;
const FILTERS: FilterValue[] = ['all', 'preparo', 'seguranca', 'nutricao'];

/**
 * Curiosidades — fiel à tela "curiosities" de `papazilla-prototype`. Cabeçalho
 * próprio ("Descobertas do Zilla" / "Curiosidades"), por isso não usa
 * `AppShell` (mesmo motivo de `PetsListScreen`).
 *
 * Biblioteca pequena e manual (`escopo-mvp.md`): só "Comida pronta na
 * geladeira" tem artigo completo, igual no protótipo — os outros 5 cards
 * avisam por toast que o formato de leitura ainda vai chegar.
 */
export function CuriosidadesScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  function toast(message: string) {
    window.clearTimeout(toastTimer.current);
    setToastMsg(message);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }

  const visible = filter === 'all' ? CURIOSITIES : CURIOSITIES.filter((c) => c.category === filter);

  function openCuriosity(id: string, hasArticle: boolean) {
    if (hasArticle) navigate(`/artigos/${id}`);
    else toast('Este exemplo terá a mesma estrutura de leitura e fontes.');
  }

  return (
    <div className="app-view">
      <header className="app-header curiosities-header">
        <div>
          <p className="eyebrow">Descobertas do Zilla</p>
          <h1>Artigos</h1>
        </div>
        <button
          type="button"
          className="curiosity-search"
          aria-label="Buscar conteúdos"
          onClick={() => toast('A busca por tema ou fonte será aberta aqui.')}
        >
          <img src={buscaIcon} alt="" />
        </button>
      </header>

      <main className="app-view__main">
        <div className="curiosities-content">
          <section className="curiosity-welcome">
            <div>
              <span className="pz-badge pz-badge--success">Para sua matilha</span>
              <h2>Uma pitada de conhecimento por dia</h2>
              <p>Informação confiável para cozinhar e cuidar com mais segurança.</p>
            </div>
            <img src={zillaLendo} alt="Zilla lendo e trazendo uma curiosidade" />
          </section>

          <div className="curiosity-filters" role="group" aria-label="Filtrar artigos">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={f === filter ? 'is-selected' : undefined}
                onClick={() => setFilter(f)}
              >
                {CATEGORY_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="curiosity-list">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`curiosity-card${item.featured ? ' curiosity-card--featured' : ''}`}
                onClick={() => openCuriosity(item.id, Boolean(item.article))}
              >
                <span className={`curiosity-art curiosity-art--${item.art}`}>
                  <img src={ART_ICON[item.art]} alt="" />
                  {item.art === 'cool' ? (
                    <>
                      <i />
                      <i />
                      <i />
                    </>
                  ) : null}
                </span>
                <span className="curiosity-card__copy">
                  <small>{item.sourceLabel}</small>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                  <b>
                    {item.readTime} <em aria-hidden="true">›</em>
                  </b>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <AppNav />

      {toastMsg ? (
        <div className="pz-toast is-visible" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
