/** Receitas salvas — lista com filtro por pet, foto do último preparo, avaliação e contador. */
export function ReceitasScreen() {
  return (
    <section className="pz-screen">
      <h1>Receitas salvas</h1>
      <div className="pz-card pz-screen">
        <p>Nenhuma receita salva ainda.</p>
        <p className="pz-note">
          Aparece aqui depois que o wizard gerar e persistir a primeira receita pela API da Vercel.
        </p>
      </div>
    </section>
  );
}
