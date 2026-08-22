# M16 — Journey Daily Challenge

## Objetivo

O Desafio Diário deixa de ser uma mecânica exclusiva do alfabeto e passa a acompanhar a jornada real de alfabetização do Lexia Game, reutilizando as atividades canônicas de cada capítulo.

A missão diária continua curta: **3 alvos por dia**, com **⭐×2 no primeiro acerto de cada alvo**.

## Regra canônica

O tipo do desafio é derivado do `Journey Engine`; o M16 não mantém thresholds próprios de domínio.

| Estágio atual | Tipo diário | Mecânica usada | Entity key |
| --- | --- | --- | --- |
| Letras | Letras | Escrita/desenho | `A`…`Z` |
| Sílabas simples | Sílabas simples | Digitação | `SYL_*` |
| Sílabas complexas | Sílabas complexas | Digitação | `SYLC_*` |
| Palavras | Primeiras palavras | Digitação | `WORD_*` |
| Frases | Frases mágicas | Composição | `SENT_*` |

Depois da maestria da jornada, o desafio diário continua útil por rotação determinística entre as cinco famílias.

## Seleção dos 3 alvos

- O desafio é determinístico para a mesma data e o mesmo estágio.
- São priorizados itens com menor desempenho/pressão de domínio dentro do catálogo aplicável.
- Letras continuam respeitando o currículo de desbloqueio do Learning Engine.
- Cada definição contém `targetKeys`, metadados visuais e a rota da mecânica real.
- O contrato persistido é `lexia.daily-challenge.v2`.

## Bônus e segurança de persistência

O bônus não é implementado separadamente em cada página.

`lexiaPlatform.progress` é decorado por `dailyChallengeProgressDecorator`, portanto o runtime Supabase recebe exatamente a mesma regra:

1. a página calcula e grava a recompensa base;
2. a camada de plataforma detecta um primeiro acerto de alvo diário;
3. acrescenta a estrela adicional de ×2;
4. executa o write remoto;
5. somente depois do write remoto bem-sucedido marca o alvo diário como concluído.

Consequências:

- repetir o mesmo alvo não gera novo bônus;
- tentativa incorreta não gera bônus nem conclusão;
- falha remota não produz uma conclusão local falsa;
- o `level` de letras é recalculado caso o bônus atravesse um limite de estrelas.

## UX

O Welcome é o ponto global de descoberta da missão e só cria o desafio depois de o progresso real terminar de carregar.

O card mostra:

- capítulo/tipo do dia;
- três alvos;
- progresso `0/3` a `3/3`;
- indicação `⭐×2`;
- CTA para o próximo alvo ainda não concluído.

O CTA inclui `dailyTarget` na rota. Cada atividade abre exatamente esse alvo e, após um acerto persistido, avança para o próximo alvo diário restante.

As atividades exibem uma faixa discreta `Desafio diário · alvo novo vale ⭐×2` sem criar uma segunda interface de jogo.

## Gates

### Contrato M16

`scripts/check-journey-daily-challenge.mjs` valida:

- os cinco estágios;
- três alvos por desafio;
- rotas e entity keys corretas;
- determinismo;
- rotação pós-maestria;
- bônus ×2 idempotente;
- erro sem bônus;
- falha remota sem conclusão local;
- conclusão somente após três alvos distintos;
- ausência de thresholds curriculares duplicados;
- uso do decorator por todos os providers.

### Browser QA

`scripts/check-daily-challenge-browser.mjs` valida em:

- `360×640`;
- `390×844`;
- `1440×900`.

Estados M16:

- card diário no Welcome;
- Letras;
- Sílabas simples;
- Sílabas complexas;
- Palavras;
- Frases.

Total M16: **18 screenshots**.

Com as evidências preservadas de M14 (24) e M15 (6), o artifact de CI reúne **48 screenshots** de regressão + novidade.

## Critério de conclusão

M16 só pode ser promovido quando `typecheck:core`, contratos M01–M16, lint, build e os três browser gates estiverem verdes.

— Tehkné Solutions
