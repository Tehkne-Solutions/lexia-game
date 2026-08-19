# M34-B — Audio Assets Layer

## Objetivo

Transformar a fundação M34-A em uma camada pronta para **SFX produzidos e voz canônica em arquivos reais**, sem interromper a experiência enquanto o pack profissional ainda não estiver no repositório.

## Arquitetura

- `audioAssetManifest.js` define IDs lógicos estáveis e caminhos oficiais;
- `audioAssetPlayer.js` resolve, pré-carrega, toca e cacheia assets;
- OGG é a primeira opção e MP3 é fallback de formato;
- fontes ausentes são memorizadas por sessão para não gerar novas tentativas/404 a cada clique;
- `sounds.js` usa asset produzido primeiro e mantém o SFX procedural como fallback;
- a camada de voz suporta arquivo canônico e recua para `speakNatural` quando necessário;
- volumes continuam governados por `lexia.audio.v1`.

## IDs iniciais

- `sfx.click`
- `sfx.correct`
- `sfx.wrong`
- `sfx.celebration`
- `sfx.draw`
- `sfx.star`
- `sfx.level-up`
- `voice.owl.preview`

## O que esta fase não faz

M34-B **não inventa arquivos de áudio**. Os caminhos estão registrados, porém o pack produzido deverá ser inserido em `public/audio/` seguindo `public/audio/README.md`.

Enquanto o pack não existir:

1. o runtime tenta os formatos registrados;
2. registra a falha uma vez por sessão;
3. usa o fallback atual;
4. nenhuma tela quebra.

Quando os arquivos reais forem adicionados nos caminhos oficiais, o jogo passa a usá-los automaticamente, sem refactor das páginas.

## Próxima fase

O próximo passo de áudio deve ser produção e integração do **Audio Pack 01**: SFX de UI, acerto, erro, estrela, desenho, level-up e celebração, seguido pela voz canônica PT-BR da Corujinha e pelo catálogo de pronúncias pedagógicas.

## Assinatura

Tehkné Solutions
