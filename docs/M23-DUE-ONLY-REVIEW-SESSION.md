# M23 — Due-Only Review Session

## Objetivo

Transformar `Revisar agora` em uma sessão finita composta exclusivamente por revisões realmente vencidas, impedindo que a criança seja desviada silenciosamente para conteúdo fraco, novo ou apenas adaptativo quando a fila FSRS termina.

## Problema encontrado

Após M20–M22, a entrada da revisão estava correta e determinística. Porém, ao concluir um item:

- Letras voltava para `pickNextLetter()`;
- Sílabas/Palavras e Frases voltavam para `pickNextJourneyItemIndex()`.

Esses schedulers sempre conseguem sugerir algum conteúdo, mesmo quando não há nenhuma revisão vencida. Assim, uma sessão iniciada como revisão poderia se transformar em prática adaptativa infinita.

## Contrato M23

- a continuação de Review nunca usa conteúdo fraco/novo como fallback;
- depois de cada write FSRS, o jogo relê `progress.list()` do provider persistido;
- somente após essa releitura a fila whole-journey é recalculada;
- o próximo item pode estar em qualquer capítulo já desbloqueado;
- a navegação carrega a rota exata com `reviewTarget`;
- quando a fila zera, a continuação passa para `/?reviewComplete=1`;
- o Welcome mostra `Revisões em dia` e `Você terminou tudo que estava pronto para hoje.`;
- Daily Challenge continua com primeira precedência quando ativo;
- Prática Livre continua separada e sem persistência curricular;
- Session Quest permanece desativado em Review;
- Letras não expõe seletor arbitrário nem launcher do Daily durante uma sessão de revisão;
- os CTAs avançados usam `Próxima revisão` durante Review;
- uma falha ao reler a fila não inventa próximo conteúdo: permanece na tela com feedback de erro recuperável.

## Runtime centralizado

`src/game/learnerReviewRuntime.js` concentra:

- `loadLearnerReviewContinuation(progressProvider)` — relê a fonte persistida e calcula a continuação;
- `navigateLearnerReviewContinuation(continuation)` — navega por `location.assign`, garantindo reavaliação completa de rota/modo quando a revisão cruza capítulos.

## Evidência

- contrato determinístico prova sequência `Z` → `WORD_VACA` → conclusão;
- itens futuros não mantêm a sessão viva;
- itens vencidos de capítulos bloqueados não entram na fila;
- browser QA valida o estado final em 360×640, 390×844 e 1440×900;
- artifact consolidado M14–M23: 84 screenshots quando toda a suíte fecha verde.

## Gate de promoção

Promover somente com contratos M01–M23, Supabase, lint, build, nove browser suites verdes e inspeção visual da confirmação `Revisões em dia` em mobile-short e desktop.

— Tehkné Solutions
