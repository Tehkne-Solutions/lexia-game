export const WORLD_EXPERIENCES = Object.freeze({
  alphabet: Object.freeze({
    chapter: 'Capítulo I',
    title: 'O Bosque dos Símbolos',
    briefing: 'Vinte e seis sinais antigos dormem pelo bosque. Cada letra dominada acende uma nova trilha para a Corujinha.',
    completion: 'Todas as vinte e seis vozes despertaram. O caminho agora conduz às pontes formadas pelos sons.',
    relic: Object.freeze({
      id: 'relic-alphabet-quill',
      name: 'Pena das 26 Vozes',
      description: 'Símbolo de domínio do alfabeto completo.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.lettersMastered || 0) >= 26,
  }),
  syllables_basic: Object.freeze({
    chapter: 'Capítulo II',
    title: 'As Pontes do Som',
    briefing: 'As letras despertas começam a se chamar umas às outras. Una os sons para construir pontes entre os símbolos.',
    completion: 'As primeiras pontes estão firmes. Agora os sons conseguem viajar juntos até formar palavras inteiras.',
    relic: Object.freeze({
      id: 'relic-syllable-shell',
      name: 'Concha das Sílabas',
      description: 'Guarda o eco das primeiras combinações sonoras.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.syllablesBasicMastered || 0) >= 20,
  }),
  syllables_complex: Object.freeze({
    chapter: 'Capítulo III',
    title: 'O Labirinto dos Encontros',
    briefing: 'Alguns sons só aparecem quando três caminhos se cruzam. Explore combinações mais raras e encontre suas saídas.',
    completion: 'O labirinto dos encontros foi mapeado. As combinações complexas já não escondem seus caminhos.',
    relic: Object.freeze({
      id: 'relic-complex-compass',
      name: 'Bússola dos Encontros',
      description: 'Marca caminhos entre combinações sonoras complexas.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.syllablesComplexDone || 0) >= 20,
  }),
  words_basic: Object.freeze({
    chapter: 'Capítulo IV',
    title: 'A Biblioteca Desperta',
    briefing: 'As pontes de som chegam a uma biblioteca silenciosa. Cada palavra conquistada devolve uma história às suas estantes.',
    completion: 'As primeiras estantes voltaram a falar. As palavras agora podem se encontrar para formar ideias completas.',
    relic: Object.freeze({
      id: 'relic-word-key',
      name: 'Chave das Primeiras Palavras',
      description: 'Abre as primeiras estantes da Biblioteca Desperta.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.wordsMastered || 0) >= 20,
  }),
  sentences: Object.freeze({
    chapter: 'Capítulo V',
    title: 'O Jardim das Histórias',
    briefing: 'Palavras soltas começam a procurar companhia. Organize-as para fazer nascer frases, ideias e pequenas histórias.',
    completion: 'O jardim ganhou voz própria. As palavras agora vivem juntas em histórias que podem continuar crescendo.',
    relic: Object.freeze({
      id: 'relic-sentence-seed',
      name: 'Semente das Histórias',
      description: 'Representa a passagem das palavras para ideias completas.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.sentencesDone || 0) >= 20,
  }),
  mastery: Object.freeze({
    chapter: 'Epílogo',
    title: 'A Torre da Maestria',
    briefing: 'O caminho principal foi percorrido. Agora cada retorno fortalece o que foi descoberto e abre espaço para novas aventuras.',
    completion: 'A jornada não termina aqui: conhecimento dominado vira ferramenta para explorar qualquer novo mundo.',
    relic: Object.freeze({
      id: 'relic-mastery-lantern',
      name: 'Lanterna da Maestria',
      description: 'Brilha quando letras, sílabas e primeiras palavras foram dominadas.',
    }),
    isRelicUnlocked: (stats) => Number(stats?.lettersMastered || 0) >= 26
      && Number(stats?.syllablesBasicMastered || 0) >= 20
      && Number(stats?.wordsMastered || 0) >= 20,
  }),
});

export function getWorldExperience(worldId, stats = {}) {
  const experience = WORLD_EXPERIENCES[worldId] || WORLD_EXPERIENCES.alphabet;
  const relicUnlocked = Boolean(experience.isRelicUnlocked(stats));
  return {
    chapter: experience.chapter,
    title: experience.title,
    briefing: experience.briefing,
    completion: experience.completion,
    relic: experience.relic,
    relicUnlocked,
  };
}

export function getUnlockedWorldRelics(stats = {}) {
  return Object.entries(WORLD_EXPERIENCES)
    .map(([worldId, experience]) => ({
      worldId,
      ...experience.relic,
      unlocked: Boolean(experience.isRelicUnlocked(stats)),
    }))
    .filter((relic) => relic.unlocked);
}

export function getJourneyWorldExperience(journey, stats = {}) {
  return getWorldExperience(journey?.worldId || 'alphabet', stats);
}
