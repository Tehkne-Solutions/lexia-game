import { ALPHABET } from '../lib/alphabetData.js';
import { calculateMastery } from '../learning/mastery.js';
import { getInitialLearningLetter, pickNextLearningLetter } from '../learning/engine.js';

export const JOURNEY_STAGES = Object.freeze({
  LETTERS: 'letters',
  SYLLABLES: 'syllables',
  COMPLEX_SYLLABLES: 'complex-syllables',
  WORDS: 'words',
  SENTENCES: 'sentences',
  MASTERY: 'mastery',
});

function isLetterKey(key) {
  return /^[A-Z]$/.test(String(key || '').toUpperCase());
}

function isSimpleMastered(record) {
  const attempts = Number(record?.total_attempts || 0);
  const correct = Number(record?.correct_attempts || 0);
  return attempts > 0 && correct >= 3 && (correct / attempts) >= 0.6;
}

export function summarizeJourneyProgress(allProgress = []) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const letterRecords = records.filter((record) => isLetterKey(record?.letter));
  const basicSyllableRecords = records.filter((record) => String(record?.letter || '').startsWith('SYL_'));
  const complexSyllableRecords = records.filter((record) => String(record?.letter || '').startsWith('SYLC_'));
  const wordRecords = records.filter((record) => String(record?.letter || '').startsWith('WORD_'));
  const sentenceRecords = records.filter((record) => String(record?.letter || '').startsWith('SENT_'));

  const lettersMastered = letterRecords.filter((record) => calculateMastery(record) >= 80).length;
  const syllablesMastered = basicSyllableRecords.filter(isSimpleMastered).length;
  const complexSyllablesMastered = complexSyllableRecords.filter(isSimpleMastered).length;
  const wordsMastered = wordRecords.filter(isSimpleMastered).length;
  const sentencesMastered = sentenceRecords.filter(isSimpleMastered).length;
  const totalStars = records.reduce((sum, record) => sum + Number(record?.stars_earned || 0), 0);

  return {
    totalRecords: records.length,
    lettersMastered,
    syllablesMastered,
    complexSyllablesMastered,
    wordsMastered,
    sentencesMastered,
    totalStars,
  };
}

export function getJourneyState(allProgress = [], alphabet = ALPHABET) {
  const records = Array.isArray(allProgress) ? allProgress : [];
  const summary = summarizeJourneyProgress(records);
  const letterProgress = records.filter((record) => isLetterKey(record?.letter));

  if (summary.lettersMastered < 26) {
    const firstRun = letterProgress.length === 0;
    const targetLetter = firstRun
      ? getInitialLearningLetter(alphabet)
      : pickNextLearningLetter(letterProgress, null, alphabet);

    return {
      stage: JOURNEY_STAGES.LETTERS,
      worldId: 'alphabet',
      path: '/play',
      target: targetLetter,
      title: firstRun ? 'Primeira descoberta' : `Missão: letra ${targetLetter}`,
      description: firstRun
        ? `Comece sua jornada descobrindo a letra ${targetLetter}.`
        : `Continue o Mundo das Letras com a letra ${targetLetter}.`,
      cta: firstRun ? 'Começar jornada' : `Continuar com ${targetLetter}`,
      current: summary.lettersMastered,
      total: 26,
      completed: false,
      firstRun,
      summary,
    };
  }

  if (summary.syllablesMastered < 20) {
    return {
      stage: JOURNEY_STAGES.SYLLABLES,
      worldId: 'syllables_basic',
      path: '/play-syllables',
      target: null,
      title: 'Missão: Sílabas Simples',
      description: 'Combine as letras dominadas e avance pelas primeiras sílabas.',
      cta: 'Continuar sílabas',
      current: Math.min(summary.syllablesMastered, 20),
      total: 20,
      completed: false,
      firstRun: false,
      summary,
    };
  }

  if (summary.complexSyllablesMastered < 20) {
    return {
      stage: JOURNEY_STAGES.COMPLEX_SYLLABLES,
      worldId: 'syllables_complex',
      path: '/play-syllables?mode=complex',
      target: null,
      title: 'Missão: Sílabas Complexas',
      description: 'Atravesse encontros como BRA, CRA e TRA para dominar combinações mais avançadas.',
      cta: 'Explorar combinações',
      current: Math.min(summary.complexSyllablesMastered, 20),
      total: 20,
      completed: false,
      firstRun: false,
      summary,
    };
  }

  if (summary.wordsMastered < 20) {
    return {
      stage: JOURNEY_STAGES.WORDS,
      worldId: 'words_basic',
      path: '/play-syllables?mode=words',
      target: null,
      title: 'Missão: Primeiras Palavras',
      description: 'Use letras e sílabas para conquistar palavras completas.',
      cta: 'Continuar palavras',
      current: Math.min(summary.wordsMastered, 20),
      total: 20,
      completed: false,
      firstRun: false,
      summary,
    };
  }

  if (summary.sentencesMastered < 20) {
    return {
      stage: JOURNEY_STAGES.SENTENCES,
      worldId: 'sentences',
      path: '/play-sentences',
      target: null,
      title: 'Missão: Frases Mágicas',
      description: 'Organize palavras para transformar ideias simples em frases completas.',
      cta: 'Montar frases',
      current: Math.min(summary.sentencesMastered, 20),
      total: 20,
      completed: false,
      firstRun: false,
      summary,
    };
  }

  return {
    stage: JOURNEY_STAGES.MASTERY,
    worldId: 'mastery',
    path: '/play?mode=practice',
    target: null,
    title: 'Jornada dominada',
    description: 'Todos os marcos principais foram conquistados. Continue treinando e explorando.',
    cta: 'Treinar livremente',
    current: 1,
    total: 1,
    completed: true,
    firstRun: false,
    summary,
  };
}
