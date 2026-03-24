export const speak = (text: string) => {
  // Cancela qualquer narração em andamento para não encavalar
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR'; // Define o idioma para português do Brasil
  utterance.rate = 1.0;     // Velocidade da fala (1.0 é o normal)
  utterance.pitch = 1.1;    // Tom da fala (ligeiramente mais agudo para crianças)

  window.speechSynthesis.speak(utterance);
};
