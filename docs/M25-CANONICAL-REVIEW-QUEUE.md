# M25 — Canonical Review Queue

## Objetivo

Garantir que a fila whole-journey de revisão só possa apontar para conteúdos que existem nos catálogos oficiais do produto, impedindo registros legados, removidos ou malformados de se tornarem destinos jogáveis e prenderem uma sessão due-only.

## Risco encontrado

Até M24, `learnerReviewQuestEngine` reconhecia capítulos apenas por prefixo (`SYL_`, `SYLC_`, `WORD_`, `SENT_`). Isso permitia que qualquer registro persistido com um prefixo conhecido fosse aceito como revisão válida, mesmo quando o alvo já não existia no catálogo atual.

Um registro obsoleto mais antigo poderia então:

- vencer a ordenação global por `next_review`;
- gerar um `reviewTarget` inexistente;
- abrir uma mecânica que faria fallback para outro item;
- permanecer vencido no storage;
- voltar a ser escolhido na continuação e criar um loop.

## Contrato M25

- existe um catálogo canônico único de 106 alvos jogáveis;
- catálogo é derivado diretamente de `ALPHABET`, `BASIC_SYLLABLES`, `COMPLEX_SYLLABLES`, `BASIC_WORDS` e `BASIC_SENTENCES`;
- letras: 26 alvos;
- sílabas simples: 20;
- sílabas complexas: 20;
- palavras: 20;
- frases: 20;
- chaves canônicas são únicas;
- a fila de Review consulta o catálogo e não apenas prefixos;
- registros desconhecidos permanecem no histórico, mas são ignorados pela fila jogável;
- um registro obsoleto não pode vencer um alvo real mesmo com `next_review` mais antigo;
- uma fila formada somente por registros obsoletos é considerada vazia e encerra em `/?reviewComplete=1`;
- regras de domínio, relatórios legados, Daily, Practice e FSRS permanecem inalteradas.

## Arquitetura

`src/game/reviewTargetCatalog.js` fornece:

- `CANONICAL_REVIEW_TARGETS`;
- `REVIEW_CHAPTER_IDS`;
- `getCanonicalReviewTarget(entityKey)`;
- `getCanonicalReviewChapterId(entityKey)`;
- `isCanonicalReviewTarget(entityKey)`.

`learnerReviewQuestEngine` usa `getCanonicalReviewChapterId(record?.letter)` como única entrada para transformar progresso persistido em item jogável de revisão.

## Reforço dos testes históricos

O contrato M20 foi migrado de fixtures artificiais `*_TEST_*` para os catálogos reais, cobrindo os 106 itens oficiais. Isso impede que os próprios testes tratem chaves obsoletas como se fossem conteúdo válido.

## Gate

- `scripts/check-canonical-review-queue.mjs`;
- contratos M01–M24 preservados;
- Supabase, lint e build obrigatórios;
- nove browser suites M14–M23 obrigatórias;
- sem nova superfície visual: permanecem as 84 evidências acumuladas de regressão.

— Tehkné Solutions
