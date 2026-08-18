# M24 — Review Retry Integrity

## Objetivo

Alinhar a semântica visual de Letras com o agendamento FSRS durante uma sessão due-only: uma tentativa que a própria UI considera incompleta não pode encerrar a revisão como se tivesse sido consolidada.

## Lacuna encontrada

Em Letras, o avaliador usa quatro grades:

- 1 — `Vamos tentar de novo!`;
- 2 — `Quase lá!`;
- 3 — `Muito bom!`;
- 4 — `Perfeito!`.

A regra curricular considera acerto apenas `grade >= 3`. Porém, o FSRS padrão interpreta grade 2 como `Hard` e agenda +1 dia. Em Review, isso permitia que uma tentativa exibida como `Quase lá!` saísse da fila vencida e contribuísse para o encerramento `Revisões em dia`.

## Contrato M24

- somente em `review=1` due-only, grades 1 e 2 usam semântica FSRS `Again`;
- grade 2 permanece imediatamente vencido (`interval = 0`);
- grades 3 e 4 mantêm a semântica FSRS normal;
- Daily continua soberano: `daily=1` preserva grade 2 como `Hard`;
- campanha normal preserva grade 2 como `Hard` (+1 dia no primeiro agendamento);
- o grade bruto da IA continua persistido em `last_grade: gradeValue` para diagnóstico e histórico;
- a UI mantém `Quase lá!` para grade 2;
- nenhum threshold de domínio, estrela ou Session Quest é alterado.

## Implementação

`src/lib/fsrs.js` centraliza a política com:

- `isDueOnlyReviewScheduling(search)`;
- `getSchedulingGrade(grade, search)`;
- `reviewCard()` usando o grade de agendamento normalizado, sem exigir lógica duplicada nas telas.

## Gate

- contrato `scripts/check-review-retry-integrity.mjs` prova Review, Campaign e Daily;
- contratos M01–M23 permanecem obrigatórios;
- as nove suítes de navegador M14–M23 continuam obrigatórias;
- como não há superfície visual nova, M24 reutiliza as 84 evidências visuais acumuladas e adiciona apenas o gate determinístico da política de scheduler.

— Tehkné Solutions
