# M20 — Learner Review Quest

## Objetivo

Transformar a fila adaptativa whole-journey do M18 em uma ação clara para a criança, conectando revisões vencidas à experiência principal sem confundir revisão com Prática Livre, Desafio Diário ou avanço da expedição.

## Regras consolidadas

- Revisões consideram apenas conteúdos já tentados e com `next_review` válido e vencido.
- Conteúdos de capítulos ainda bloqueados não aparecem na fila do aluno.
- A prioridade global é o `next_review` mais antigo entre todos os capítulos já alcançados.
- O CTA `Revisar agora` abre o capítulo correto em `review=1`.
- O modo de revisão continua persistindo tentativas e atualização FSRS.
- O modo de revisão não é Prática Livre: ele atualiza memória e agenda.
- O modo de revisão não avança `SessionQuest` nem conclui checkpoints de campanha.
- Daily Challenge continua independente e não é usado como atalho para revisão.
- Dentro das mecânicas, `SessionQuestBar` se transforma em um banner explícito de `Revisão inteligente`.
- Welcome e Practice Hub usam o mesmo `learnerReviewQuestEngine`, evitando uma segunda verdade de fila.

## Capítulos cobertos

1. Letras — `/play?review=1`
2. Sílabas simples — `/play-syllables?review=1`
3. Sílabas complexas — `/play-syllables?mode=complex&review=1`
4. Palavras — `/play-syllables?mode=words&review=1`
5. Frases — `/play-sentences?review=1`

## Gates

- `typecheck:core`
- contratos M01–M19 preservados
- `scripts/check-learner-review-quest.mjs`
- lint
- build
- Browser Layout M14
- Side Modes M15
- Daily Challenge M16
- Practice Hub M17
- Review Insights M19
- Learner Review Browser M20
- artifact consolidado M14–M20 com 66 screenshots quando todos os gates de navegador concluem

## Critério de promoção

Promover somente se a fila global, bloqueio de capítulos, exclusão de Session Quest, build e todas as regressões existentes estiverem verdes, com inspeção visual do banner de revisão nos viewports mobile-short e desktop.

— Tehkné Solutions
