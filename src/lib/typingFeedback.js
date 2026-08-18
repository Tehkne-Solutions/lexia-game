// Varied, specific, and encouraging voice feedback for typing (syllables/words)

const SUCCESS_MESSAGES = [
  'Muito bem! Você acertou!',
  'Isso aí! Mandou bem!',
  'Parabéns! Você conseguiu!',
  'Que maravilha! Acertou!',
  'Excelente! Você é demais!',
  'Isso! Cada vez melhor!',
  'Você está aprendendo rápido!',
  'Perfeito! Continue assim!',
];

const GENERIC_WRONG_MESSAGES = [
  'Não foi dessa vez, mas você consegue!',
  'Quase! Tente de novo!',
  'Não desanima! Vamos tentar mais uma vez!',
  'Errou, mas aprender é assim mesmo! Tente novamente!',
  'Tudo bem errar! Vamos de novo!',
];

// Analyze the typed answer vs the target and give a specific, encouraging hint
function getSpecificHint(typed, target) {
  const t = (typed || '').toUpperCase().trim();
  const tgt = target.toUpperCase().trim();

  if (t.length === 0) {
    return 'Você não digitou nada! Escreva as letrinhas!';
  }

  // Reversed letters (e.g., AB instead of BA)
  if (t.length === tgt.length && t === tgt.split('').reverse().join('')) {
    return `Você inverteu as letras! O certo é ${tgt}, não ${t}. Tente de novo!`;
  }

  // Only the last letter is missing
  if (t === tgt.slice(0, -1)) {
    return `Faltou a última letrinha! A resposta termina com "${tgt.slice(-1)}".`;
  }

  // Only the first letter is missing
  if (t === tgt.slice(1)) {
    return `Faltou a primeira letra! A resposta começa com "${tgt[0]}".`;
  }

  // Extra letters at the end
  if (t.length > tgt.length && t.startsWith(tgt)) {
    return `Você digitou letras a mais! O certo é só "${tgt}".`;
  }

  // Same length but some letters wrong
  if (t.length === tgt.length) {
    const wrong = [];
    for (let i = 0; i < tgt.length; i++) {
      if (t[i] !== tgt[i]) {
        wrong.push(`a letra ${i + 1} é "${tgt[i]}"`);
      }
    }
    if (wrong.length > 0 && wrong.length <= 2) {
      return `Quase lá! Lembre-se: ${wrong.join(' e ')}. Tente de novo!`;
    }
  }

  // Too short
  if (t.length < tgt.length) {
    return `Faltam letras! A resposta tem ${tgt.length} letrinhas. Começa com "${tgt[0]}".`;
  }

  // Too long
  if (t.length > tgt.length) {
    return `Você digitou letras demais! A resposta tem só ${tgt.length} letrinhas.`;
  }

  // Fallback: give the first letter as a hint
  return `A resposta começa com "${tgt[0]}". Tente de novo!`;
}

export function getTypingFeedback(typed, target, isCorrect) {
  if (isCorrect) {
    return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
  }

  const hint = getSpecificHint(typed, target);
  if (hint) return hint;

  return GENERIC_WRONG_MESSAGES[Math.floor(Math.random() * GENERIC_WRONG_MESSAGES.length)];
}

// Short version for the mascot speech bubble
export function getTypingMascotMessage(typed, target, isCorrect) {
  if (isCorrect) {
    const messages = ['Correto! 🎉', 'Mandou bem! ⭐', 'Isso aí! 🌟', 'Perfeito! ✨'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  const t = (typed || '').toUpperCase().trim();
  const tgt = target.toUpperCase().trim();

  if (t.length === 0) return 'Digite algo! 💪';
  if (t.length === tgt.length && t === tgt.split('').reverse().join('')) return 'Inverteu as letras!';
  if (t === tgt.slice(0, -1)) return `Faltou: "${tgt.slice(-1)}"`;
  if (t === tgt.slice(1)) return `Faltou: "${tgt[0]}" no início`;
  if (t.length < tgt.length) return `Faltam letras! 💪`;
  if (t.length > tgt.length) return `Letras demais!`;

  return `Era: ${tgt} 💪`;
}