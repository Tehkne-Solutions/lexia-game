# M18 — Adaptive Journey Review

## Objetivo

Levar a repetição espaçada e a seleção adaptativa que já existiam em Letras para os capítulos seguintes da jornada:

- Sílabas simples;
- Sílabas complexas;
- Palavras;
- Frases.

Antes do M18, essas atividades persistiam os campos de scheduler, mas não os atualizavam de fato; além disso, o próximo alvo normal era escolhido aleatoriamente.

## Scheduler canônico

M18 não cria um novo algoritmo de memória.

`journeyReviewEngine.js` reutiliza:

- `reviewCard()` e `createNewCard()` do FSRS já usado em Letras;
- `calculateMastery()` como score compartilhado de domínio.

### Mapeamento de resultado

- acerto → FSRS `Good` (`grade = 3`);
- erro → FSRS `Again` (`grade = 1`).

A cada tentativa curricular, passam a ser atualizados de verdade:

- `stability`;
- `difficulty`;
- `interval`;
- `repetitions`;
- `next_review`;
- `last_grade`.

Tentativas de **Prática Livre** continuam fora da persistência e, portanto, não alteram o scheduler.

## Fila adaptativa

A seleção de um alvo normal segue quatro buckets determinísticos:

1. **Revisão vencida** — o `next_review` mais antigo primeiro;
2. **Dificuldade** — item já iniciado com acurácia baixa ou domínio abaixo de 50;
3. **Não iniciado** — preserva a ordem do catálogo;
4. **Revisão saudável** — menor domínio primeiro.

O item que acabou de ser respondido é excluído da escolha de “Próximo”, evitando loops imediatos quando há alternativas.

## Primeiro alvo da sessão

Sílabas/Palavras e Frases não começam mais em um alvo curricular aleatório.

Após o carregamento do progresso, o primeiro alvo também vem da fila adaptativa.

Exceção: quando existe `dailyTarget`, o **Desafio Diário mantém precedência absoluta** e abre exatamente o alvo definido pelo M16.

## Compatibilidade com milestones anteriores

### M16 — Journey Daily Challenge

O fluxo diário continua:

1. abrir `dailyTarget` exato;
2. percorrer os alvos restantes do desafio;
3. somente depois usar a fila adaptativa caso a sessão continue.

### M17 — Journey Free Practice

Prática Livre continua sem chamar persistência nos fluxos de acerto e erro. Ela pode consumir a fila adaptativa para escolher conteúdo útil, mas não altera progresso, FSRS ou missão.

## Contrato M18

`scripts/check-adaptive-journey-review.mjs` valida:

- primeiro acerto cria estado FSRS real e agenda revisão futura;
- primeiro erro cria estado FSRS e permanece imediatamente devido;
- repetições avançam em reviews posteriores;
- ordem `vencido → dificuldade → novo → saudável`;
- entre vencidos, o mais antigo vem primeiro;
- item atual é excluído da próxima seleção;
- Sílabas/Palavras e Frases usam o mesmo engine;
- seleção curricular aleatória foi removida;
- Daily Challenge mantém precedência;
- Practice continua persistence-free;
- engine reutiliza FSRS e `calculateMastery()` canônicos.

## Evidência visual

M18 não cria uma nova superfície visual; muda a inteligência de seleção e agendamento.

Por isso, o gate mantém as quatro suítes de navegador de M14–M17 e preserva o artifact consolidado de **54 screenshots** como regressão visual obrigatória.

## Critério de conclusão

M18 só pode ser promovido quando:

- `typecheck:core` estiver verde;
- contratos M01–M18 estiverem verdes;
- lint e build estiverem verdes;
- as quatro suítes de browser regressão permanecerem verdes.

— Tehkné Solutions
