# Lexia Game

Um jogo gamificado para alfabetização em português brasileiro, utilizando repetição espaçada (FSRS), reconhecimento de escrita manual e síntese de voz.

## Funcionalidades do MVP

- **Cenário RPG**: O jogador ajuda um guardião a ler um mapa desenhando letras.
- **Reconhecimento de Escrita**: Desenho de letras no canvas (validação básica no MVP).
- **Síntese de Voz**: Pronúncia das letras em português brasileiro.
- **Repetição Espaçada**: Algoritmo FSRS para agendamento de revisões (implementação básica).

## Como executar

1. Instale as dependências: `npm install`
2. Execute o servidor de desenvolvimento: `npm run dev`
3. Abra o navegador em `http://localhost:5173`

## Estrutura do Projeto

- `src/App.tsx`: Componente principal do jogo.
- `src/fsrs.ts`: Implementação básica do algoritmo FSRS.
- `src/App.css`: Estilos da aplicação.

## Próximos Passos

- Implementar reconhecimento de escrita completo usando uma biblioteca HWR.
- Adicionar mais cenários RPG.
- Sistema de login para pais.
- Dashboard de progresso.

## Tecnologias

- React
- TypeScript
- Vite
- Canvas API
- Web Speech API