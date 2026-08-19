# M36-B — Home Semantic Migration

Assinatura: Tehkné Solutions

## Objetivo
Migrar as principais superfícies da Home para as primitivas premium introduzidas no M36-A sem alterar currículo, FSRS, progressão, rotas ou prioridade pedagógica.

## Migração
- Plano de aventura → `GamePanel` `paper`.
- Pós-revisão concluída → `GamePanel` `success`.
- Revisão vencida → `GamePanel` `review`.
- Lançador do desafio diário → superfície semântica `reward`.
- CTA principal → `GameActionButton` `primary`.
- Prática livre → `GameActionButton` `secondary`.
- Ação de revisão → `GameActionButton` `neutral`.

## Compatibilidade
O marcador legado `bg-gradient-to-r` permanece encapsulado em `GameActionButton` somente para manter os browser proofs antigos que ainda localizam a ação primária por essa classe. A camada premium continua anulando `background-image`, portanto não há gradiente visual reintroduzido.

## Gates
- contrato M36-B;
- contrato M36-A;
- contrato M35-A;
- Typecheck UI/Core;
- build;
- Adaptive Home browser regression;
- Premium UI browser regression;
- Post Review browser regression;
- CI e Critical E2E globais continuam bloqueantes no PR.

## Resultado esperado
A Home passa a consumir uma linguagem de componentes de jogo reutilizável, reduzindo dependência de combinações utilitárias específicas e preparando a expansão premium para as demais telas.
