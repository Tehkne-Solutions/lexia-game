# Lexia — Audio Pack Contract

Este diretório é o ponto de entrada dos **assets de áudio produzidos** do Lexia. O runtime não exige arquivos falsos: enquanto um asset ainda não existir, o jogo usa automaticamente o fallback procedural/voz do sistema.

## Estrutura canônica

```text
public/audio/
  sfx/
    ui-click.ogg
    ui-click.mp3
    correct.ogg
    correct.mp3
    wrong.ogg
    wrong.mp3
    celebration.ogg
    celebration.mp3
    draw-soft.ogg
    draw-soft.mp3
    star.ogg
    star.mp3
    level-up.ogg
    level-up.mp3
  voice/
    pt-BR/
      corujinha-preview.ogg
      corujinha-preview.mp3
```

Os IDs lógicos e caminhos oficiais ficam em `src/audio/audioAssetManifest.js`. Novos arquivos devem ser registrados no manifesto antes de serem usados pelas telas.

## Direção de produção

### SFX

- estética orgânica, lúdica e delicada;
- evitar beeps genéricos de aplicativo, sons agressivos e frequências cansativas;
- resposta correta deve transmitir descoberta e confiança, não cassino;
- resposta incorreta deve orientar sem sensação de punição;
- clique deve ser quase tátil e muito curto;
- draw deve funcionar em repetição sem fadiga;
- celebrações podem ter mais corpo, mas não devem mascarar a voz.

### Voz PT-BR

- voz canônica consistente para a Corujinha;
- dicção brasileira natural e clara;
- ritmo infantil compreensível sem caricatura;
- sem pitch artificial;
- pronúncia pedagógica revisada para letras, fonemas, sílabas, palavras e frases;
- manter pequenas pausas naturais quando melhorarem compreensão.

## Entrega técnica recomendada

- principal: OGG/Vorbis;
- fallback: MP3;
- SFX curtos, preferencialmente mono quando espacialidade não for necessária;
- remover silêncio excessivo no início/fim;
- evitar clipping;
- normalizar loudness de forma consistente entre a mesma família de sons;
- arquivos de voz devem usar o mesmo padrão de captação/processamento em todo o catálogo.

## Comportamento de runtime

1. O Lexia tenta o primeiro source registrado.
2. Se falhar, tenta o próximo formato.
3. Falhas são memorizadas durante a sessão para evitar 404 repetitivo.
4. Se nenhum arquivo estiver disponível, o fallback atual continua funcionando.
5. Assim que o pack real for adicionado nos caminhos oficiais, as telas passam a usá-lo sem refactor.

**Tehkné Solutions**
