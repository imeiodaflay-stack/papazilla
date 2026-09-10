/** Área Zilla — cadastro/atualização de pets. Estado inicial: matilha vazia. */
export function ZillaScreen() {
  return (
    <section className="pz-screen">
      <h1>Sua matilha</h1>
      <div className="pz-card pz-screen">
        <p>Ainda não há nenhum Monstrinho cadastrado.</p>
        <button type="button" className="pz-btn" disabled>
          Cadastrar Monstrinho
        </button>
        <p className="pz-note">
          Fluxo de cadastro + anamnese em 20 seções entra na próxima fatia (precisa de
          persistência no Supabase).
        </p>
      </div>
    </section>
  );
}
