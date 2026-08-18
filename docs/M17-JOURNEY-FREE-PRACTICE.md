# M17 — Journey Free Practice

## Objetivo

A **Prática Livre** deixa de ser um atalho exclusivo para Letras e passa a representar toda a jornada de alfabetização do Lexia Game.

O aluno pode revisar conteúdos já alcançados sem pressão, sem alterar a missão atual e sem avançar a expedição curricular.

## Regra canônica

O desbloqueio das práticas é derivado exclusivamente do `Journey Engine`.

O M17 não replica thresholds de domínio.

| Etapa alcançada | Práticas disponíveis |
| --- | --- |
| Letras | Letras |
| Sílabas simples | Letras + Sílabas simples |
| Sílabas complexas | + Sílabas complexas |
| Palavras | + Palavras |
| Frases | + Frases |
| Maestria | Todas as 5 |

## Practice Hub

Nova rota: `/practice`.

O hub apresenta cinco práticas canônicas:

1. **Ateliê das Letras** — `/play?mode=practice`
2. **Pontes do Som** — `/play-syllables?practice=true`
3. **Labirinto dos Encontros** — `/play-syllables?mode=complex&practice=true`
4. **Biblioteca Desperta** — `/play-syllables?mode=words&practice=true`
5. **Jardim das Histórias** — `/play-sentences?practice=true`

A etapa atual é destacada e etapas futuras permanecem visíveis, porém bloqueadas com a mensagem **Continue a jornada para liberar**.

## Semântica de “sem pressão”

Prática Livre reutiliza as mecânicas reais; não cria versões paralelas do jogo.

Em modo prática:

- o aluno recebe feedback local;
- pode manter sequência/score visual temporário durante a sessão;
- não persiste tentativa curricular;
- não persiste estrela curricular;
- não conclui Desafio Diário;
- não avança Session Quest/expedição;
- não altera a ordem da jornada.

Letras e Sílabas/Palavras já respeitavam essa regra. M17 fecha a lacuna de **Frases**, que agora também bloqueia os caminhos de persistência correto e incorreto e cria a Session Quest com `enabled: false` em prática.

## Welcome

O CTA **Prática Livre (sem pressão)** agora abre `/practice` em vez de `/play?mode=practice`.

A mensagem principal também deixa de reduzir o produto ao alfabeto:

- anterior: `Aprenda o Alfabeto com Magia!`
- M17: `Aprenda a ler com magia!`

## Gates

### Contrato M17

`scripts/check-journey-free-practice.mjs` valida:

- desbloqueio sequencial 1/5 → 5/5;
- recomendação da prática correspondente ao estágio atual;
- Maestria com as cinco práticas liberadas;
- rotas explícitas em modo prática;
- ausência de thresholds duplicados;
- Welcome apontando para o hub;
- Letras, Sílabas/Palavras e Frases sem persistência em prática;
- Session Quest de Frases desabilitada em prática.

### Browser QA

`scripts/check-practice-hub-browser.mjs` valida em:

- `360×640`;
- `390×844`;
- `1440×900`.

Estados M17:

- Practice Hub em Fresh Start, com exatamente 1/5 prática disponível;
- Frases em `practice=true`, com badge de Prática e sem UI de Desafio Diário.

Total M17: **6 screenshots**.

Com as evidências anteriores:

- M14: 24;
- M15: 6;
- M16: 18;
- M17: 6;

Artifact consolidado: **54 screenshots**.

## Critério de conclusão

M17 só pode ser promovido quando `typecheck:core`, contratos M01–M17, lint, build e os quatro browser gates estiverem verdes e a evidência visual do Practice Hub estiver aprovada.

— Tehkné Solutions
