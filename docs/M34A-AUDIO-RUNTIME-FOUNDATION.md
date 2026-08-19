# M34-A — Audio Runtime Foundation

## Objetivo

Criar a fundação técnica para o áudio premium do Lexia sem quebrar a API usada pelas atividades atuais.

## Mudanças

- `AudioContext` passa a ser criado de forma lazy, após interação, reduzindo problemas de autoplay e inicialização prematura.
- configurações de áudio persistidas em `lexia.audio.v1`;
- canais lógicos para efeitos e voz com volumes independentes;
- narração pode ser ligada/desligada;
- seleção de voz prioriza PT-BR e vozes conhecidas de melhor qualidade quando disponíveis no sistema;
- ritmo de fala ajustado para 0.92 e pitch natural 1.0;
- `src/lib/sounds.js` mantém a API existente e delega ao novo runtime;
- tela Configurações ganha controles de efeitos, voz, narração e prévia da Corujinha.

## Limite desta fase

M34-A não declara que o áudio final já é profissional. Os SFX ainda são procedurais e a fala ainda depende das vozes disponíveis no navegador/sistema. Esta fase prepara a arquitetura para M34-B/M35, quando assets sonoros produzidos e voz canônica pré-gerada poderão substituir os fallbacks atuais sem reescrever as telas.

## Guardrails

- volumes sempre normalizados entre 0 e 1;
- sem `AudioContext` no carregamento do módulo;
- sem pitch infantil artificial;
- PT-BR tem prioridade;
- configurações permanecem locais ao dispositivo;
- nenhuma mudança em currículo, FSRS, progressão ou persistência pedagógica.

## Validação

- contrato Node para defaults, persistência, clamp e seleção de voz;
- typecheck UI + core;
- browser proof Chrome 390×844 na tela Configurações;
- prova de persistência do volume de efeitos em `lexia.audio.v1`;
- artifact visual/JSON em `artifacts/m34a`.

## Assinatura

Tehkné Solutions
