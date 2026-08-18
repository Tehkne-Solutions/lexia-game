# M22 — Exact Review Handoff Advanced

## Objetivo

Completar o contrato M21 nos quatro capítulos avançados, garantindo que o `reviewTarget` escolhido pela fila whole-journey seja consumido explicitamente por Sílabas simples, Sílabas complexas, Palavras e Frases.

## Lacuna encontrada

O M21 tornou o handoff de Letras determinístico e passou a enriquecer todas as rotas com `reviewTarget`. Porém, PlaySyllables e PlaySentences ainda ignoravam esse parâmetro e dependiam do scheduler local chegar ao mesmo item. Isso podia funcionar por coincidência quando o alvo explícito também era o mais vencido, mas não constituía um contrato de handoff.

## Contrato M22

- Daily mantém primeira precedência em todas as mecânicas;
- Review usa segunda precedência somente quando `review=1` e o `reviewTarget` pertence ao catálogo/modo atual;
- scheduler adaptativo continua sendo fallback quando não há alvo explícito válido;
- Sílabas simples consome chaves `SYL_*`;
- Sílabas complexas consome chaves `SYLC_*`;
- Palavras consome chaves `WORD_*`;
- Frases consome chaves `SENT_*`;
- Session Quest continua desativado em Review pelo contrato M20;
- a faixa de capítulo de PlaySyllables/Palavras não compete com o banner de revisão;
- nenhum threshold de domínio, desbloqueio, bônus diário ou regra de Prática Livre muda.

## Evidência deliberadamente não-default

O browser gate abre alvos afastados do primeiro item para impedir falso positivo por inicialização padrão:

- Sílabas simples: `SYL_VO` → `VO`;
- Sílabas complexas: `SYLC_TRI` → `TRI`;
- Palavras: `WORD_VACA` → `VACA`;
- Frases: `SENT_20` → pista `Ela ilumina o céu.`.

Cada superfície é validada em 360×640, 390×844 e 1440×900, totalizando 12 screenshots M22 e 81 evidências acumuladas M14–M22.

## Gate de promoção

Promover somente com contratos M01–M22, Supabase, lint, build, oito browser suites verdes e inspeção visual dos quatro alvos exatos em mobile-short e desktop.

— Tehkné Solutions
