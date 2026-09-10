import { Link } from 'react-router-dom';

/**
 * Anamnese do Monstrinho — placeholder. A próxima fatia traz as 20 seções fiéis
 * ao questionário canônico (`Claude outputs/questionario-cadastro-pet.md`) com
 * persistência no Supabase.
 */
export function AnamneseScreen() {
  return (
    <section className="pz-screen" style={{ padding: '1.5rem 1.25rem' }}>
      <h1>Cadastro do Monstrinho</h1>
      <p>A anamnese completa em 20 seções entra na próxima fatia.</p>
      <Link to="/zilla" className="pz-button pz-button--outline">
        ← Voltar
      </Link>
    </section>
  );
}
