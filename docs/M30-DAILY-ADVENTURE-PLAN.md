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

## M30-B — Foco e transição do plano

O plano passa a expor semanticamente o estado de cada passo sem criar estado persistido adicional:

- `current` — o que deve receber atenção agora;
- `next` — próximo passo obrigatório;
- `optional` — bônus disponível, mas não bloqueante;
- `complete` — bônus já concluído.

Com revisão vencida, `currentStep` é a revisão e `nextRequiredStep` é a missão curricular. Assim que a dívida de revisão desaparece, o plano é recalculado e a missão curricular torna-se imediatamente o `currentStep`.

O Fresh Start continua protegido: mesmo que exista estado inconsistente de revisão, a primeira missão permanece como passo atual.

### Browser proof

`scripts/check-daily-plan-focus-browser.mjs` executa o app real em Chrome com a fixture canônica e prova no viewport 390×844:

1. uma letra vencida faz a Home mostrar `Primeiro relembrar, depois avançar` e `Revisão curta → missão atual`;
2. ao mover essa revisão para o futuro, a Home recalcula para `Seu caminho de hoje está pronto` e `Missão atual`;
3. nenhum dos dois estados gera overflow horizontal;
4. screenshots e JSON de evidência são preservados no artifact `lexia-m30b-daily-plan-focus`.

O workflow `Lexia Learner Daily Plan` executa dependency audit, contrato M30, `typecheck:core` e o browser proof como gate próprio, enquanto CI geral, Critical E2E e Adaptive Home Browser permanecem como regressões obrigatórias.

— Tehkné Solutions
