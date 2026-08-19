# M37-A — Premium Gameplay HUD

Assinatura: Tehkné Solutions

## Objetivo

Levar a linguagem premium já consolidada na Home para a atividade principal de Letras sem alterar reconhecimento, FSRS, Daily Challenge, revisão ou progressão curricular.

## Mudanças

- `GameplayHud` centraliza navegação, progresso, modo e contexto de missão/desafio.
- `GameplayResultActions` centraliza correção manual, retry, continuar e retorno ao mapa.
- `PlayGame` deixa de importar `Button` e `Link` diretamente.
- botão `Ouvir` passa por `GameActionButton`.
- feedback ⭐×2 usa material reward.
- removido o gradiente real legado do botão `Continuar`.
- novas classes premium do HUD preservam High Contrast via escopo `:not(.high-contrast)`.

## Não muda

- FSRS e cálculo de domínio;
- upload/IA e avaliação do desenho;
- persistência de progresso;
- targets Daily/Review;
- rotas canônicas;
- Session Quest;
- conteúdo pedagógico.

## Gates

- contrato M37-A;
- Typecheck UI/Core;
- build;
- Browser Layout QA;
- Daily Challenge Browser QA;
- Exact Review Browser QA;
- CI global e Critical E2E continuam obrigatórios no PR.
