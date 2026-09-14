/**
 * Rascunho temporário do wizard da receita — só existe pra sobreviver ao
 * desvio "Cadastrar outro Monstrinho" no meio do wizard (`ReceitaScreen`
 * salva antes de ir pra `/anamnese`, `AnamneseScreen` avisa que veio de lá,
 * `ReceitaScreen` recarrega ao voltar). `sessionStorage`, não
 * `localStorage`: é descartável, não é dado da conta do tutor, e não deve
 * sobreviver o fechamento da aba nem aparecer em "Baixar meus dados".
 */
import type { FormulationId, SupplementId } from '@papazilla/nutrition-engine';

const DRAFT_KEY = 'papazilla.recipeDraft';

export interface RecipeDraft {
  selectedPetIds: string[];
  formulation: FormulationId;
  proteins: string[];
  carbs: string[];
  vegetables: string[];
  organs: string[];
  supplement: SupplementId;
  days: number;
  format: string;
}

export function saveRecipeDraft(draft: RecipeDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

/**
 * Só lê — não apaga. Leitura precisa ser pura pra poder rodar direto no
 * corpo do componente (o React 18 StrictMode invoca a função do componente
 * duas vezes em desenvolvimento; um `removeItem` aqui faria a segunda
 * chamada não achar mais nada). Quem lê chama `clearRecipeDraft()` depois,
 * de dentro de um `useEffect` — aí sim roda só uma vez de verdade.
 */
export function peekRecipeDraft(): RecipeDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecipeDraft;
  } catch {
    return null;
  }
}

export function clearRecipeDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage indisponível — segue sem precisar limpar */
  }
}
