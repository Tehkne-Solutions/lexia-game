// Personalized TTS hints per letter for correct and incorrect attempts
const LETTER_HINTS = {
  A: {
    correct: ['Perfeito! O A tem dois traços inclinados e um tracinho no meio!', 'Que A lindo! Você acertou!'],
    wrong: ['O A tem dois traços que se encontram no topo e um tracinho no meio. Tente de novo!', 'Junte os dois traços no alto e coloque um risquinho no centro!'],
  },
  B: {
    correct: ['Muito bem! O B tem um traço reto e duas barriguinhas!', 'O B ficou lindo!'],
    wrong: ['O B tem um traço reto em pé e duas curvas do lado. Tente curvar mais as barriguinhas!', 'Coloque o traço reto à esquerda e duas curvas arredondadas à direita!'],
  },
  C: {
    correct: ['Excelente! O C é uma curva aberta para a direita!', 'Que C bonito!'],
    wrong: ['O C é como uma lua crescente. A abertura fica do lado direito. Tente curvar mais!', 'Faça uma curva bem redondinha com a abertura para o lado direito!'],
  },
  D: {
    correct: ['Perfeito! O D tem um traço reto e uma curva grande!', 'O D ficou maravilhoso!'],
    wrong: ['O D tem um traço reto em pé e uma curva grande como uma barriga. Tente arredondar mais!', 'Coloque um traço reto e faça uma curva bem grande do lado direito!'],
  },
  E: {
    correct: ['Ótimo! O E tem um traço vertical e três tracinhos horizontais!', 'Que E perfeito!'],
    wrong: ['O E tem um traço reto e três risquinhos para o lado: um em cima, um no meio e um embaixo!', 'Não se esqueça dos três tracinhos! Um no topo, um no meio e um embaixo!'],
  },
  F: {
    correct: ['Muito bem! O F tem um traço reto e dois tracinhos no topo!', 'O F ficou excelente!'],
    wrong: ['O F é parecido com o E, mas sem o tracinho de baixo. Tente colocar dois risquinhos na parte de cima!', 'Dois tracinhos em cima, nenhum embaixo — esse é o F!'],
  },
  G: {
    correct: ['Perfeito! O G tem uma curva e um tracinho horizontal no meio!', 'Que G bonito!'],
    wrong: ['O G é como o C, mas com um risquinho entrando no meio. Tente adicionar o tracinho horizontal!', 'Faça uma curva como o C e coloque um tracinho no centro para completar o G!'],
  },
  H: {
    correct: ['Ótimo! O H tem dois traços em pé e um tracinho no meio!', 'O H ficou incrível!'],
    wrong: ['O H tem dois traços verticais e um risquinho horizontal no meio conectando os dois. Tente de novo!', 'Dois traços em pé com um tracinho no centro — esse é o H!'],
  },
  I: {
    correct: ['Muito bem! O I é um traço reto em pé!', 'Que I perfeito!'],
    wrong: ['O I é um traço reto bem direitinho de cima para baixo. Tente fazer mais reto!', 'Só um traço reto, vertical. Você consegue!'],
  },
  J: {
    correct: ['Perfeito! O J desce e se curva para a esquerda no final!', 'O J ficou lindo!'],
    wrong: ['O J desce reto e faz uma curvilinha para a esquerda embaixo, como um anzolzinho. Tente de novo!', 'Desce e curva para a esquerda no final — esse é o J!'],
  },
  K: {
    correct: ['Excelente! O K tem um traço em pé e dois tracinhos diagonais!', 'Que K bonito!'],
    wrong: ['O K tem um traço reto e dois traços em V deitado saindo do meio. Tente as diagonais!', 'Um traço em pé e dois risquinhos diagonais no meio — esse é o K!'],
  },
  L: {
    correct: ['Muito bem! O L tem um traço vertical e um tracinho horizontal embaixo!', 'O L ficou perfeito!'],
    wrong: ['O traço vertical do L precisa ser mais reto! E não se esqueça do risquinho horizontal no final, embaixo!', 'Um traço reto para baixo e um risquinho para o lado na base — esse é o L!'],
  },
  M: {
    correct: ['Perfeito! O M tem dois traços em pé e dois tracinhos em V no meio!', 'Que M incrível!'],
    wrong: ['O M começa com dois traços em pé e tem dois picos no meio como uma montanha. Tente os dois picos!', 'Dois traços em pé e dois picos no centro — sobe e desce duas vezes!'],
  },
  N: {
    correct: ['Ótimo! O N tem dois traços em pé e um traço diagonal no meio!', 'O N ficou maravilhoso!'],
    wrong: ['O N tem dois traços retos em pé com um traço diagonal de cima para baixo conectando os dois. Tente a diagonal!', 'Dois traços em pé e um traço inclinado conectando de um lado ao outro!'],
  },
  O: {
    correct: ['Excelente! O O é um círculo bem redondinho!', 'Que O perfeito!'],
    wrong: ['O O é um círculo fechado bem redondinho. Tente arredondar mais as bordas!', 'Faça um círculo bem redondo, fechado dos dois lados — esse é o O!'],
  },
  P: {
    correct: ['Muito bem! O P tem um traço reto e uma barriguinha só em cima!', 'O P ficou lindo!'],
    wrong: ['O P tem um traço reto em pé e uma curva só na parte de cima. Feche a curva em cima!', 'Um traço reto e uma barriguinha em cima — não esquece de fechar a curva no topo!'],
  },
  Q: {
    correct: ['Perfeito! O Q é como o O com um risquinho na ponta!', 'Que Q bonito!'],
    wrong: ['O Q é um círculo com um risquinho pequeno embaixo à direita. Não se esqueça do rabinho!', 'Faça um círculo fechado e coloque um traçinho diagonal embaixo — esse é o Q!'],
  },
  R: {
    correct: ['Ótimo! O R tem um traço reto, uma barriguinha e uma perninha!', 'O R ficou excelente!'],
    wrong: ['O R tem um traço em pé, uma curva em cima e uma perna diagonal saindo dela. Tente a perninha!', 'Como o P, mas com uma perna diagonal saindo da barriguinha — esse é o R!'],
  },
  S: {
    correct: ['Muito bem! O S tem duas curvinhas em sentidos opostos!', 'Que S perfeito!'],
    wrong: ['O S tem duas curvas: uma vai para a direita em cima e outra para a esquerda embaixo. Tente as duas curvas!', 'Uma curva para cada lado — como uma serpente! Esse é o S!'],
  },
  T: {
    correct: ['Perfeito! O T tem um traço reto em pé e um tracinho horizontal no topo!', 'O T ficou incrível!'],
    wrong: ['O T tem um traço vertical e um risquinho horizontal bem no topo. O tracinho precisa estar em cima!', 'Um traço para baixo e um risquinho cruzando no topo — esse é o T!'],
  },
  U: {
    correct: ['Excelente! O U desce, curva e sobe de novo!', 'Que U bonito!'],
    wrong: ['O U começa em pé, desce, faz uma curvinha redonda embaixo e sobe de volta. Tente arredondar mais o fundo!', 'Desce, curva suavemente no fundo e sobe de volta — esse é o U!'],
  },
  V: {
    correct: ['Muito bem! O V desce para o centro e sobe de novo!', 'O V ficou perfeito!'],
    wrong: ['O V tem dois traços em diagonal que se encontram num ponto em baixo. Tente um V mais pontiagudo!', 'Dois traços se encontrando numa ponta embaixo — esse é o V!'],
  },
  W: {
    correct: ['Ótimo! O W tem quatro traços em diagonal como dois V juntos!', 'Que W incrível!'],
    wrong: ['O W é como dois V juntos: desce, sobe, desce e sobe de novo. Tente os quatro traços!', 'Como dois V unidos — desce e sobe duas vezes!'],
  },
  X: {
    correct: ['Perfeito! O X tem dois traços diagonais se cruzando no meio!', 'O X ficou maravilhoso!'],
    wrong: ['O X tem dois traços diagonais que se cruzam bem no centro. Tente cruzar os traços no meio!', 'Dois traços inclinados se cruzando no meio — esse é o X!'],
  },
  Y: {
    correct: ['Muito bem! O Y tem dois traços que descem para um único traço!', 'Que Y bonito!'],
    wrong: ['O Y tem dois traços diagonais em cima que se encontram no meio, e depois desce um traço para baixo. Tente!', 'Dois traços se encontram em cima e um traço desce no centro — esse é o Y!'],
  },
  Z: {
    correct: ['Excelente! O Z tem dois tracinhos horizontais e um traço diagonal!', 'Que Z perfeito!'],
    wrong: ['O Z tem um traço horizontal em cima, um traço diagonal e um traço horizontal embaixo. Tente os três traços!', 'Um risquinho em cima, um traço diagonal e um risquinho embaixo — esse é o Z!'],
  },
};

export function getLetterFeedbackSpeech(letter, isCorrect, aiGrade) {
  const hints = LETTER_HINTS[letter.toUpperCase()];
  if (!hints) {
    return isCorrect ? 'Muito bem! Você acertou!' : 'Tente de novo! Você consegue!';
  }

  const pool = isCorrect ? hints.correct : hints.wrong;
  const phrase = pool[Math.floor(Math.random() * pool.length)];

  // For grade 2 (hard/partial), prefix with encouragement
  if (!isCorrect && aiGrade === 2) {
    return `Quase lá! ${phrase}`;
  }

  return phrase;
}