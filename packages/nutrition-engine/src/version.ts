/**
 * Versão das regras do motor nutricional.
 *
 * Toda receita salva grava a versão usada no cálculo (`arquitetura-tecnica.md`),
 * para que uma mudança futura no motor não altere silenciosamente receitas antigas.
 *
 * Incrementar quando qualquer tabela, fator ou fórmula deste pacote mudar de forma
 * que altere um resultado numérico.
 *
 * `1.0.0` = port fiel do motor de `calculadora-an-cozida.html`
 * (metodologia pública da Dra. Sylvia Angélico, cachorroverde.com.br).
 * `1.1.0` = objetivo "Ganhar peso" passa a usar o peso meta (`idealWeightKg`)
 * como peso usado no cálculo, mesma alavanca de "Emagrecer" em sentido
 * oposto — nenhuma tabela/fator mudou, só a condição que decide qual peso
 * entra na fórmula já existente.
 */
export const ENGINE_VERSION = '1.1.0';
