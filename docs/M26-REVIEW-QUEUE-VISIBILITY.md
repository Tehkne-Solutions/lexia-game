# M26 — Review Queue Visibility

## Objetivo

Dar à criança uma noção clara do tamanho da sessão de revisão sem criar um segundo estado curricular nem alterar as rotas canônicas M20–M25.

## Problema encontrado

Após M23, a sessão de revisão tornou-se finita e due-only, mas o banner durante a atividade mostrava apenas `Revisão inteligente`. A criança não sabia se havia uma única revisão ou várias ainda aguardando na fila whole-journey.

## Regra M26

O banner passa a mostrar:

- `N restantes`;
- `N revisões na fila` quando N > 1;
- `1 restante` + `Última revisão pronta` quando N = 1;
- a mensagem genérica anterior quando a contagem ainda não está disponível.

## Fonte de verdade

A contagem não controla navegação, scheduler, desbloqueio ou conclusão.

1. `SessionQuestBar` observa a query canônica `childProgress` já compartilhada pelas telas;
2. calcula `buildLearnerReviewQuest(reviewProgress)`;
3. quando há uma fila persistida válida, `reviewQuest.totalDue` é a contagem preferida;
4. durante handoffs que usam `location.assign`, `learnerReviewRuntime` grava apenas um snapshot visual em `sessionStorage` para evitar que o banner pisque sem número antes da consulta remota terminar;
5. assim que a fila canônica retorna uma contagem vencida, ela tem precedência sobre o snapshot;
6. ao concluir a sessão, o snapshot é removido.

## Compatibilidade

- URLs de revisão permanecem exatamente iguais (`review=1&reviewTarget=...`);
- M20–M25 continuam sendo a fonte de verdade para fila e destino;
- snapshot aceita apenas inteiros de 1 a 106;
- nenhum snapshot é usado para decidir o próximo item;
- Daily, Practice, Campaign e Session Quest permanecem inalterados.

## Evidência

Novo browser gate cobre:

- `4 revisões na fila` + `4 restantes`;
- `Última revisão pronta` + `1 restante`;
- 360×640;
- 390×844;
- 1440×900.

São 6 screenshots M26 e **90 evidências visuais acumuladas M14–M26**.

## Gate de promoção

Promover somente com contratos M01–M26, Supabase, lint, build, dez browser suites verdes e inspeção visual dos dois estados do banner em mobile-short e desktop.

— Tehkné Solutions
