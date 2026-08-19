# Lexia M31 — Handoff Pós-Revisão

**Tehkné Solutions**

## M31-A — Continuar missão depois das revisões

### Objetivo

Evitar uma quebra de ritmo quando o aluno termina a última revisão disponível. O sistema já retornava para `/?reviewComplete=1`; agora esse contexto também orienta a ação principal da Home.

### Regra canônica

A prioridade continua:

1. Fresh Start;
2. revisão vencida;
3. missão curricular.

O parâmetro `reviewComplete=1` só altera a apresentação do terceiro caso, quando não existe mais dívida de revisão.

### Comportamento

Antes:

- revisão termina;
- Home mostra `Revisões em dia`;
- CTA volta imediatamente ao texto curricular genérico, por exemplo `Continuar sílabas`.

M31-A:

- revisão termina;
- Home mostra `Revisões em dia`;
- CTA principal passa a `Continuar missão`;
- o destino continua exatamente o mesmo path retornado pelo `Journey Engine`.

Assim, o aluno entende que a revisão foi concluída e que a próxima ação é retomar sua aventura, sem criar uma rota curricular alternativa.

### Segurança de progressão

- `reviewComplete=1` nunca substitui uma revisão ainda vencida;
- `reviewComplete=1` nunca substitui o Fresh Start;
- nenhuma nova rota é criada;
- nenhum novo estado é persistido;
- nenhuma tabela, score, moeda, streak, scheduler ou threshold é criado;
- o path curricular não é reimplementado: continua vindo do `Journey Engine`.

### Contrato

`scripts/check-learner-next-action.mjs` cobre:

- soberania do Fresh Start;
- prioridade de revisão mesmo com contexto de conclusão;
- fallback curricular normal;
- CTA contextual `Continuar missão` depois das revisões;
- preservação do mesmo path curricular;
- leitura segura do contexto `reviewComplete=1`.

### Browser proof

`scripts/check-post-review-handoff-browser.mjs` executa o app real em Chrome no viewport 390×844 e prova, com o mesmo progresso:

1. Home normal → CTA `Continuar sílabas` → `/play-syllables`;
2. Home em `/?reviewComplete=1` → status `Revisões em dia`;
3. CTA contextual → `Continuar missão`;
4. destination continua `/play-syllables`;
5. ausência de overflow horizontal.

As evidências visuais e JSON são preservadas no artifact `lexia-m31a-post-review-handoff`.

### Gate dedicado

O workflow `Lexia Post Review Handoff` executa:

- dependency audit;
- contrato do Learner Next Action;
- `typecheck:core`;
- browser proof M31-A;
- upload de evidência.

CI geral, Critical E2E, Adaptive Home Browser e demais gates existentes permanecem como regressões bloqueantes.

— Tehkné Solutions
