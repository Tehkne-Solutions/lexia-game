export function speakText(text, options = {}) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'pt-BR';
  utterance.pitch = options.pitch ?? 1.25;
  utterance.rate = options.rate ?? 0.85;
  utterance.volume = options.volume ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(
    (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR')
  );
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakLetterPrompt(letter, exampleWord) {
  const cleanLetter = letter ? letter.toUpperCase() : '';
  const text = exampleWord 
    ? `Letra ${cleanLetter}! ${cleanLetter} de ${exampleWord}. Desenhe a letra ${cleanLetter}!`
    : `Desenhe a letra ${cleanLetter}!`;
  
  speakText(text, { pitch: 1.3, rate: 0.82 });
}
