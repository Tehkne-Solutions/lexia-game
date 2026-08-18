// Motivational audio phrases library for the owl mascot
// Provides varied, human, and encouraging phrases for correct/wrong answers

const CORRECT_PHRASES = [
  'Mandou bem! Você é muito inteligente!',
  'Isso aí! Acertou de primeira!',
  'Que legal! Você está aprendendo rápido demais!',
  'Parabéns! A corujinha ficou muito feliz com você!',
  'Muito bem! Continue assim que você vai longe!',
  'Isso! Você está ficando craque nisso!',
  'Que maravilha! Acertou com muita confiança!',
  'Perfeito! A corujinha está orgulhosa de você!',
  'Isso aí! Seu cérebro está trabalhando direitinho!',
  'Muito bom! Você está indo muito bem!',
  'Arrasou! A corujinha sabia que você conseguia!',
  'Que beleza! Você é uma estrela!',
];

const CORRECT_AFTER_RETRY = [
  'Você conseguiu! Não desistir é o segredo!',
  'Isso! A persistência valeu a pena!',
  'Mandou bem! Você não desistiu e acertou!',
  'Viu só? Com paciência você consegue tudo!',
  'Isso aí! Tentar de novo sempre ajuda!',
  'Muito bem! Você aprendeu com o erro e acertou!',
];

const WRONG_PHRASES = [
  'Não tem problema! Errar faz parte de aprender!',
  'Quase lá! A próxima você acerta, eu sei!',
  'Não desanima! A corujinha acredita em você!',
  'Tudo bem errar! Vamos tentar de novo juntos!',
  'Você está tentando, e isso já é maravilhoso!',
  'Calma! Respire fundo e tente de novo!',
  'Não foi desta vez, mas você está melhorando a cada dia!',
  'A corujinha erra às vezes também! Vamos de novo!',
  'Não desista! Você é mais esperto do que imagina!',
  'Tudo bem! Os grandes aprendizes também erram!',
  'Hey, não fica triste! Errar é como a gente aprende!',
  'A corujinha está aqui com você! Vamos tentar mais uma vez!',
];

const STREAK_PHRASES = [
  'Que sequência incrível! Você está pegando o jeito!',
  'Tantos acertos seguidos! Você é demais!',
  'Você está arrasando! Continue assim!',
  'Que impressionante! A corujinha está boquiaberta!',
  'Sua sequência está pegando fogo! 🔥',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCorrectPhrase(afterRetry = false) {
  return afterRetry
    ? pickRandom([...CORRECT_AFTER_RETRY, ...CORRECT_PHRASES])
    : pickRandom(CORRECT_PHRASES);
}

export function getWrongPhrase() {
  return pickRandom(WRONG_PHRASES);
}

export function getStreakPhrase() {
  return pickRandom(STREAK_PHRASES);
}

// Randomly choose between a specific educational hint and a motivational phrase
// This adds variety and makes the owl feel more human
export function getSpokenFeedback(isCorrect, specificHint, { afterRetry = false, motivationalChance = 0.5 } = {}) {
  if (Math.random() < motivationalChance) {
    return isCorrect ? getCorrectPhrase(afterRetry) : getWrongPhrase();
  }
  return specificHint;
}