# Lexia M30 — Plano de Aventura do Dia

**Tehkné Solutions**

## M30-A — Plano derivado da jornada

A Home passa a explicar a sessão como uma sequência curta e coerente, derivada exclusivamente dos sistemas canônicos já existentes.

### Ordem canônica

1. revisão vencida, quando existir e nunca no primeiro acesso;
2. missão curricular atual;
3. desafio diário como bônus opcional, quando disponível.

### Fontes de verdade

O plano não cria lógica curricular paralela:

- revisão vem de `Learner Review Quest` e reutiliza o exact review path;
- missão vem do `Journey Engine`;
- bônus vem do `Journey Daily Challenge`;
- Fresh Start mantém a primeira missão como início absoluto;
- quando qualquer um desses estados muda, o plano é recalculado sem persistência própria.

### UX

O antigo card isolado de missão vira **Plano de aventura**, preservando o capítulo, a missão atual e a barra de progresso no mesmo espaço visual.

O aluno recebe uma leitura curta da ordem, por exemplo:

`Revisão curta → missão atual → bônus opcional`

Quando não há revisão, a sequência reduz naturalmente para:

`Missão atual → bônus opcional`

Quando não há desafio disponível, o bônus não é anunciado.

Cards detalhados, CTA adaptativo, Prática Livre, mapa e demais superfícies continuam funcionando de forma independente. O plano orienta; não cria outra navegação.

### Não cria

- nova tabela;
- nova moeda;
- novo score;
- novo streak;
- novo scheduler;
- novo threshold de domínio;
- nova fila de revisão;
- persistência de checklist diário.

### Gates

`scripts/check-learner-daily-plan.mjs` valida:

- proteção do primeiro acesso;
- revisão antes da missão em contas retornantes;
- retorno à missão quando não há revisão;
- desafio como bônus opcional;
- remoção do bônus da mensagem quando não existe desafio;
- progresso diário já existente;
- integração compacta na Home.

O workflow `Lexia Learner Daily Plan` executa o contrato, dependency audit e `typecheck:core` como gate próprio, enquanto os gates gerais continuam cobrindo lint, build, Critical E2E e browser QA.

— Tehkné Solutions
