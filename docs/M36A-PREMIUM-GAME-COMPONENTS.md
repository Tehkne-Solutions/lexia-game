# M36-A — Premium Game Components

Assinatura: Tehkné Solutions.

## Objetivo

Transformar a linguagem premium validada nos M35-A/M35-B em primitivas reutilizáveis, reduzindo dependência de combinações Tailwind específicas e evitando que cada tela reconstrua sua própria aparência.

## Componentes

### GamePanel

Superfície material reutilizável com tons semânticos:

- `paper` — painel neutro de jogo;
- `review` — revisão/aprendizado adaptativo;
- `reward` — bônus, desafio e recompensa;
- `success` — conclusão/sucesso.

### GameActionButton

Ação de jogo reutilizável com variantes:

- `primary` — CTA físico principal;
- `secondary` — ação complementar;
- `neutral` — ação discreta/adiamento.

A variante primária permanece sem gradiente e sem glow.

## Primeira migração

`DailyChallengeCard` passa a consumir as duas primitivas. Isso permite validar os componentes em um fluxo real sem reescrever toda a Home de uma vez.

## Guardrails

- contrato estático M36-A;
- contrato premium M35-A;
- Typecheck UI/Core;
- browser regression completa do Desafio Diário;
- browser regression do Premium UI proof em 360×640 e 390×844;
- High Contrast continua soberano.

## Próximo passo

Após esta base, a migração pode avançar para `Welcome.jsx`, superfícies de revisão, Practice Hub, World Map e HUDs, mantendo o mesmo vocabulário visual e os mesmos testes.
