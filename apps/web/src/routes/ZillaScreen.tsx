import { EmptyState } from '../components/EmptyState.js';

/** Área Zilla — cadastro/atualização de pets. Estado inicial: matilha vazia. */
export function ZillaScreen() {
  return (
    <section className="pz-screen">
      <h1>Sua matilha</h1>
      <EmptyState
        title="Nenhum Monstrinho por aqui ainda"
        description="Cadastre seu primeiro cão para começar a anamnese e criar receitas."
      >
        <button type="button" className="pz-btn" disabled>
          Cadastrar Monstrinho
        </button>
        <p className="pz-note">
          Fluxo de cadastro + anamnese em 20 seções entra na próxima fatia (precisa de
          persistência no Supabase).
        </p>
      </EmptyState>
    </section>
  );
}
