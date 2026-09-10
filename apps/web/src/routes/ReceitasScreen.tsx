import { EmptyState } from '../components/EmptyState.js';

/** Receitas salvas — lista com filtro por pet, foto do último preparo, avaliação e contador. */
export function ReceitasScreen() {
  return (
    <section className="pz-screen">
      <h1>Receitas salvas</h1>
      <EmptyState
        title="Nenhuma receita salva ainda"
        description="Depois que o wizard gerar a primeira receita, ela aparece aqui com foto do preparo, avaliação e contador de fornalhas."
      />
    </section>
  );
}
