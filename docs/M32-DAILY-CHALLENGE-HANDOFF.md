# Lexia M32 — Handoff do Desafio Diário

**Tehkné Solutions**

## Objetivo

Fechar a continuidade depois do bônus opcional do Plano de Aventura.

O Desafio Diário já possui progresso canônico e bônus de estrelas no `dailyChallengeProgressDecorator`, aplicado somente depois de write remoto bem-sucedido. O M32 não altera essa responsabilidade.

## Problema corrigido

Quando o terceiro alvo diário era concluído, as atividades reconheciam `challenge.completed`, mas continuavam dentro da rota `daily=1` e podiam selecionar conteúdo curricular normal sob o banner de Desafio Diário.

Isso deixava o aluno preso semanticamente no bônus mesmo depois de concluí-lo.

## Regra M32

A continuação compartilhada passa a seguir esta ordem:

1. se ainda existe alvo diário pendente, retornar o próximo alvo exato;
2. se não existe alvo pendente e o challenge está concluído;
3. somente se a rota atual contém `daily=1`, navegar para `/?dailyComplete=1`;
4. em Home, revisão ou currículo normal, nunca executar handoff automático.

As três superfícies existentes — Letras, Sílabas/Palavras e Frases — já consomem `getNextChallengeTarget(challenge)`, portanto recebem o mesmo comportamento sem duplicação de regras.

## Separação de responsabilidades

- `dailyChallengeEngine.js`: permanece puro e determina definição, tipo, ranking, multiplicador e próximo alvo;
- `dailyChallengeProgressDecorator.js`: continua registrando progresso apenas após persistência confirmada;
- `dailyChallenge.js`: wrapper/runtime responsável pela continuação e handoff de rota;
- páginas de jogo: continuam pedindo apenas o próximo alvo compartilhado.

## Guardrails

O M32 não cria:

- nova tabela;
- nova moeda;
- novo score;
- novo streak;
- novo scheduler;
- novo threshold curricular;
- nova cópia de progresso diário;
- lógica diferente por atividade.

## Gates

`scripts/check-daily-challenge-handoff.mjs` valida:

- alvo pendente sempre vence o handoff;
- Letras, Sílabas/Palavras e Frases continuam usando o wrapper compartilhado;
- challenge completo em `daily=1` volta para Home;
- Home não redireciona sozinha;
- revisão não é afetada;
- currículo normal não é afetado;
- ausência de `location.assign` falha de forma segura.

`scripts/check-daily-challenge-handoff-browser.mjs` prova em Chrome 390×844:

- origem em contexto `daily=1`;
- conclusão do bônus;
- navegação real para `/?dailyComplete=1`;
- Home renderizada após o handoff;
- ausência de overflow horizontal.

O workflow `Lexia Daily Challenge Handoff` executa audit, contrato, core typecheck, browser proof e publica as evidências em artifact próprio.

— Tehkné Solutions
