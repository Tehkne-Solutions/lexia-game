# M35-B — Premium UI Visual Proof

Assinatura: Tehkné Solutions.

## Objetivo

Fechar a validação visual da fundação premium introduzida no M35-A antes de expandir a linguagem visual para outras telas do Lexia.

## O que o proof valida

- Home renderizada em Chrome real nos viewports 360×640 e 390×844;
- `Plano de aventura` preservado e tratado como superfície material/autoral;
- CTA principal continua funcional e não usa `background-image`/gradiente;
- CTA e painel apresentam profundidade por borda/sombra física, sem glow;
- nenhum overflow horizontal nos dois viewports;
- modo High Contrast continua soberano sobre a paleta premium;
- tokens High Contrast esperados voltam a dominar após reload.

## Evidências

O workflow `Lexia Premium UI Visual Proof` gera o artifact `m35b-premium-ui-proof` com:

- `01-premium-home-360x640.png`;
- `02-high-contrast-home-360x640.png`;
- `01-premium-home-390x844.png`;
- `02-high-contrast-home-390x844.png`;
- `premium-ui-proof.json`.

## Limite desta etapa

M35-B não redesenha novas telas. Ele torna a fundação visual do M35-A comprovável e bloqueante. A expansão seguinte pode então trabalhar componentes, HUD, mapas, cards e microinterações premium sem perder os guardrails de acessibilidade e viewport.
