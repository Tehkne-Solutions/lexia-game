// Story chapters — unlocked as the child masters more letters

export const STORY_CHAPTERS = [
  {
    id: 'ch1',
    title: 'A Floresta Encantada',
    emoji: '🌲',
    unlockLetters: 0,
    pages: [
      { text: 'Era uma vez, numa floresta encantada, uma corujinha sábia chamada Lexia.', emoji: '🦉' },
      { text: 'Lexia vivia numa árvore oca, cheia de livros mágicos.', emoji: '📚' },
      { text: 'Um dia, Lexia encontrou a letra A perdida na floresta!', emoji: '🐝' },
      { text: 'A letra A estava chorando porque tinha se perdido das amigas.', emoji: '😢' },
      { text: 'Lexia prometeu ajudar a letra A a encontrar todas as outras!', emoji: '🤝' },
    ],
  },
  {
    id: 'ch2',
    title: 'A Casa na Árvore',
    emoji: '🏠',
    unlockLetters: 5,
    pages: [
      { text: 'Lexia e a letra A caminharam até uma casa na árvore.', emoji: '🏠' },
      { text: 'Lá dentro, encontraram as letras B, C e D brincando!', emoji: '🎉' },
      { text: 'A letra B era redonda como uma bola. A C era curva como uma casa.', emoji: '⚽' },
      { text: 'A letra D parecia um dado que sempre caía em pé!', emoji: '🎲' },
      { text: 'Juntos, eles formaram a primeira palavra: CASA!', emoji: '✨' },
    ],
  },
  {
    id: 'ch3',
    title: 'O Lago das Estrelas',
    emoji: '⭐',
    unlockLetters: 10,
    pages: [
      { text: 'O grupo chegou a um lago que brilhava como estrelas.', emoji: '⭐' },
      { text: 'No lago, encontraram as letras E, F e G nadando.', emoji: '🏊' },
      { text: 'A letra E era uma estrela! A F era uma flor perfumada.', emoji: '🌸' },
      { text: 'A letra G era um gato curioso que fazia "grrr"!', emoji: '🐱' },
      { text: 'Juntos, formaram a palavra GATO!', emoji: '😺' },
    ],
  },
  {
    id: 'ch4',
    title: 'A Montanha dos Sons',
    emoji: '🏔️',
    unlockLetters: 15,
    pages: [
      { text: 'A jornada levou os amigos a uma montanha cheia de ecos.', emoji: '🏔️' },
      { text: 'No topo, as letras H, I, J, K e L faziam sons estranhos.', emoji: '🔊' },
      { text: 'O H era um helicóptero: hel-hel-hel! O I morava num iglu.', emoji: '🚁' },
      { text: 'O J era um jacaré sorridente. O K comia kiwi o dia todo.', emoji: '🐊' },
      { text: 'A letra L era a lua que brilhava à noite.', emoji: '🌙' },
    ],
  },
  {
    id: 'ch5',
    title: 'O Grande Encontro',
    emoji: '🎉',
    unlockLetters: 20,
    pages: [
      { text: 'Finalmente, todas as letras se encontraram num campo verde.', emoji: '🌳' },
      { text: 'As letras M, N, O, P, Q, R, S, T, U, V, W, X, Y e Z chegaram!', emoji: '🎊' },
      { text: 'O macaco M, a nuvem N, o ovo O, o pássaro P... todos lá!', emoji: '🐒' },
      { text: 'O queijo Q, o rato R, o sol S, a tartaruga T... que festa!', emoji: '☀️' },
      { text: 'A uva U, a vaca V, o waffle W, a xícara X, o yoga Y e a zebra Z!', emoji: '🦓' },
      { text: 'E assim, as 26 letras formaram o ALFABETO MÁGICO! Fim! 🎉', emoji: '✨' },
    ],
  },
];

export function getUnlockedChapters(lettersMastered) {
  return STORY_CHAPTERS.filter(ch => lettersMastered >= ch.unlockLetters);
}