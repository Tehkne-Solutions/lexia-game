# M21 — Exact Review Handoff

## Objetivo

Fechar a lacuna entre a fila global de revisão do M20 e o alvo realmente aberto pela mecânica, garantindo que `Revisar agora` entregue exatamente o conteúdo vencido escolhido pelo scheduler.

## Problema encontrado

O M20 já selecionava corretamente o capítulo da revisão mais antiga. Em Sílabas/Palavras e Frases, a seleção adaptativa interna normalmente convergia para o item vencido mais antigo. Em Letras, porém, o carregamento da jornada ainda podia substituir a letra de revisão pelo alvo da missão principal.

Além disso, a tela de Letras mantinha a faixa visual `Missão atual/recomendada` durante revisão, embora o `SessionQuest` estivesse desativado.

## Contrato M21

- toda rota de revisão pode carregar `reviewTarget=<entityKey>`;
- o engine gera `reviewPath` exato para o item vencido mais antigo de cada capítulo;
- `nextPath` global inclui o alvo exato;
- `reviewTarget` só é interpretado quando `review=1`;
- Letras dá precedência a `reviewTarget` sobre o alvo da campanha;
- Letras em revisão não é tratada como missão guiada;
- a faixa `Missão atual/recomendada` não aparece em revisão;
- a revisão continua persistindo FSRS e continua sem avançar `SessionQuest`;
- o Practice Hub usa `reviewPath`, sem perder o alvo ao entrar por um capítulo específico.

## Compatibilidade

- Daily Challenge continua usando `dailyTarget` e sua própria sequência;
- Prática Livre continua sem persistência de progresso;
- rotas M20 sem `reviewTarget` continuam válidas e usam o scheduler como fallback;
- nenhum threshold de domínio ou desbloqueio foi alterado.

## Gates

- contrato M20 atualizado para rota enriquecida;
- `scripts/check-exact-review-handoff.mjs`;
- browser QA com `/play?review=1&reviewTarget=Z` em 360×640, 390×844 e 1440×900;
- browser exige `Desenhe a letra Z!` e rejeita `Missão atual`, `Missão recomendada` e a antiga letra padrão `I`;
- regressões M14–M20 continuam obrigatórias;
- artifact consolidado M14–M21: 69 screenshots quando a suíte completa fecha verde.

— Tehkné Solutions
