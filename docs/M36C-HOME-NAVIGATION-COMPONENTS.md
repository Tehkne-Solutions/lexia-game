# M36-C — Home Navigation Components

Assinatura: Tehkné Solutions

## Objetivo
Completar a migração semântica da Home removendo dependência direta do `Button` genérico nas ações de navegação.

## Mudanças
- Mapa → `GameActionButton neutral`.
- Perfil → `GameActionButton neutral`.
- Pais → `GameActionButton neutral`.
- Desafio → `GameActionButton neutral`.
- História → `GameActionButton neutral`.
- Configurações/Acessar → `GameActionButton neutral`.
- import direto de `@/components/ui/button` removido da Home.

## Preservado
- rotas;
- textos;
- hierarquia pedagógica;
- ação principal;
- prática livre;
- revisão adaptativa;
- desafio diário;
- High Contrast e reduced motion.

## Gates
Contrato M36-C, contrato M36-B, Typecheck UI/Core, build, Adaptive Home browser proof, Premium UI browser proof, CI global e Critical E2E.
