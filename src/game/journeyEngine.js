export const JOURNEY_STAGES = Object.freeze({
  LETTERS: 'LETTERS',
  SYLLABLES_BASIC: 'SYLLABLES_BASIC',
  WORDS_BASIC: 'WORDS_BASIC',
  SENTENCES_BASIC: 'SENTENCES_BASIC'
});

export function getJourneyState(progress = {}) {
  const stats = getMapWorldStats();
  return {
    stage: JOURNEY_STAGES.LETTERS,
    masteredLetters: stats.masteredLetters,
    masteredCount: stats.masteredCount,
    percentage: stats.percentage,
    ...progress
  };
}

export function updateMasteryAndGetProgress(completedLetter, currentProgress = {}) {
  const masteredSet = new Set(currentProgress.masteredLetters || []);
  
  if (completedLetter) {
    masteredSet.add(completedLetter.toUpperCase());
  }

  const masteredCount = masteredSet.size;
  const totalLetters = 26;
  const percentage = Math.min(100, Math.round((masteredCount / totalLetters) * 100));

  const updatedProgress = {
    ...currentProgress,
    masteredLetters: Array.from(masteredSet),
    masteredCount,
    percentage,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem('lexia_journey_progress', JSON.stringify(updatedProgress));
  } catch (e) {
    console.warn('Erro ao salvar progresso localmente:', e);
  }

  return updatedProgress;
}

export function getMapWorldStats() {
  try {
    const saved = localStorage.getItem('lexia_journey_progress');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        masteredCount: data.masteredCount || 0,
        percentage: data.percentage || 0,
        masteredLetters: data.masteredLetters || []
      };
    }
  } catch (e) {
    console.error(e);
  }

  return { masteredCount: 0, percentage: 0, masteredLetters: [] };
}
