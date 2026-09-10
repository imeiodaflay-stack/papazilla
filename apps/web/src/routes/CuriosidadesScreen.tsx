/** Curiosidades — biblioteca editorial pequena e manual (sem automação no MVP). */
export function CuriosidadesScreen() {
  return (
    <section className="pz-screen">
      <h1>Curiosidades</h1>
      <p>Conteúdo sobre nutrição e preparo, com fonte primária.</p>
      <div className="pz-card">
        <p className="pz-note">
          Biblioteca inicial (conjunto pequeno previamente aprovado) + filtros por tema entram
          quando o conteúdo estiver no Supabase.
        </p>
      </div>
    </section>
  );
}
