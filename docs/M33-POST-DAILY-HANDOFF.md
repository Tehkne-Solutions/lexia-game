# M33 — Post Daily Handoff

## Objetivo

Fechar a continuidade depois do bônus opcional do Plano de Aventura. Ao terminar o Desafio Diário, o aluno retorna à Home por `/?dailyComplete=1`; a Home deve reconhecer esse contexto sem alterar a progressão curricular.

## Regra de prioridade

1. Fresh Start continua soberano.
2. Revisões vencidas continuam soberanas.
3. Quando não há revisão vencida e `dailyComplete=1`, a ação principal continua curricular, mas usa o CTA contextual `Continuar missão`.
4. O destino continua exatamente o `journey.path` produzido pelo Journey Engine.
5. O contexto visível da Corujinha passa a `Bônus concluído!`.
6. Fora do contexto de conclusão, o CTA curricular original permanece intacto.

## Arquitetura

A regra fica em `learnerNextActionEngine.js`, junto ao handoff pós-revisão. Não existe nova rota de gameplay, persistência, tabela, moeda, score ou threshold.

O M32 continua responsável apenas por devolver o aluno do modo diário para `/?dailyComplete=1`. O M33 interpreta esse retorno e devolve o foco à missão canônica.

## Validação

- contrato `check-learner-next-action.mjs` cobrindo Fresh Start, revisão vencida, fallback curricular, pós-revisão e pós-desafio;
- browser proof Chrome 390×844 comparando Home normal e `/?dailyComplete=1`;
- prova de que `Continuar sílabas` muda para `Continuar missão` sem mudar `/play-syllables`;
- evidência visual e JSON em `artifacts/m33`;
- gate dedicado `Lexia Post Daily Handoff`.

## Assinatura

Tehkné Solutions
