# M19 — Journey Review Insights

## Objetivo

Transformar os dados de repetição espaçada consolidados no M18 em informação útil para responsáveis, sem alterar os critérios curriculares já conquistados pelo aluno.

M19 responde três perguntas simples:

1. **Há algo importante para revisar agora?**
2. **Quantos conteúdos já possuem agenda adaptativa?**
3. **Quando acontece a próxima revisão futura?**

## Compatibilidade curricular

M19 não muda regras de desbloqueio nem reclassifica domínio.

Essa decisão é deliberada: registros avançados criados antes do M18 podem ter estabilidade FSRS igual a zero. Trocar imediatamente o critério de domínio para um score dependente de estabilidade poderia rebaixar progresso legado.

Portanto:

- FSRS passa a organizar revisões em toda a jornada;
- critérios de domínio atuais continuam preservados;
- revisão e domínio são mostrados como conceitos diferentes.

## Review readiness

`parentInsightsEngine.js` agora resume, globalmente e por capítulo:

- `dueReviews` — revisões com horário vencido/pronto;
- `scheduledReviews` — itens praticados com `next_review` válido;
- `upcomingReviews` — revisões futuras;
- `nextReviewAt` — próxima revisão futura;
- `averageStability` — estabilidade média dos registros que já possuem estabilidade positiva.

Regras de segurança:

- item sem tentativa não entra na agenda, mesmo que possua timestamp residual;
- timestamp inválido não é convertido em revisão fictícia;
- estabilidade zero de registro legado não distorce a média;
- o relógio pode ser injetado em testes via `{ now }`.

## Área dos Pais

Nova seção **Ritmo de Revisão** mostra:

- Prontas agora;
- Com agenda;
- Futuras;
- Estabilidade média;
- Próxima revisão futura;
- quantidade de revisões prontas/futuras por capítulo.

Os capítulos também destacam quando possuem revisões prontas.

A explicação inferior foi atualizada: não afirma mais que FSRS existe apenas em Letras. Ela esclarece que o scheduler cobre letras, sílabas, palavras e frases, enquanto o domínio curricular legado permanece preservado.

## Recomendações

Quando há revisão vencida, `Próximo foco em casa` passa a incluir uma recomendação objetiva para realizar uma sessão curta de consolidação.

O sistema mantém no máximo três recomendações para não transformar o painel em uma lista excessiva.

## Relatório semanal

O relatório enviado por e-mail agora inclui:

- revisões prontas agora;
- itens com agenda FSRS;
- próxima revisão futura;
- revisões prontas por capítulo.

## Gates

### Contrato M19

`scripts/check-journey-review-insights.mjs` valida com relógio determinístico:

- revisão vencida vs. futura;
- agenda apenas para itens tentados;
- descarte de timestamps inválidos;
- estabilidade média sem zeros legados;
- próxima revisão global e por capítulo;
- recomendação gerada por revisões vencidas;
- relatório semanal atualizado;
- preservação explícita do domínio avançado legado.

### Browser QA

`scripts/check-review-insights-browser.mjs` abre `/parent`, localiza **Ritmo de Revisão**, rola a seção para a viewport e captura:

- `360×640`;
- `390×844`;
- `1440×900`.

Total M19: **3 screenshots**.

Artifact consolidado M14–M19: **57 screenshots**.

## Critério de conclusão

M19 só pode ser promovido quando:

- `typecheck:core` estiver verde;
- contratos M01–M19 estiverem verdes;
- lint e build estiverem verdes;
- todas as cinco suítes de navegador estiverem verdes;
- a evidência visual do bloco Ritmo de Revisão estiver aprovada.

— Tehkné Solutions
