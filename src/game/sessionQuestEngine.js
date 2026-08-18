import { JOURNEY_STAGES } from './journeyEngine.js';

const QUEST_CONFIG = Object.freeze({
  [JOURNEY_STAGES.LETTERS]: Object.freeze({
    id: 'letters-expedition',
    title: 'Expedição das Letras',
    shortTitle: '3 descobertas',
    goal: 3,
    unit: 'descobertas',
    startMessage: 'Complete três descobertas para fechar esta expedição.',
    completionMessage: 'Expedição concluída! O mapa já mostra o próximo caminho.',
  }),
  [JOURNEY_STAGES.SYLLABLES]: Object.freeze({
    id: 'syllables-expedition',
    title: 'Expedição das Sílabas',
    shortTitle: '4 combinações',
    goal: 4,
    unit: 'combinações',
    startMessage: 'Complete quatro combinações para fechar esta expedição.',
    completionMessage: 'Expedição concluída! Novas combinações esperam no mapa.',
  }),
  [JOURNEY_STAGES.COMPLEX_SYLLABLES]: Object.freeze({
    id: 'complex-syllables-expedition',
    title: 'Expedição dos Encontros',
    shortTitle: '4 encontros',
    goal: 4,
    unit: 'encontros',
    startMessage: 'Atravesse quatro combinações complexas para fechar esta expedição.',
    completionMessage: 'Expedição concluída! O labirinto dos encontros ficou mais claro.',
  }),
  [JOURNEY_STAGES.WORDS]: Object.freeze({
    id: 'words-expedition',
    title: 'Expedição das Palavras',
    shortTitle: '4 conquistas',
    goal: 4,
    unit: 'conquistas',
    startMessage: 'Conquiste quatro palavras para fechar esta expedição.',
    completionMessage: 'Expedição concluída! Sua rota de palavras avançou.',
  }),
  [JOURNEY_STAGES.SENTENCES]: Object.freeze({
    id: 'sentences-expedition',
    title: 'Expedição das Histórias',
    shortTitle: '4 frases',
    goal: 4,
    unit: 'frases',
    startMessage: 'Monte quatro frases para fechar esta expedição.',
    completionMessage: 'Expedição concluída! O Jardim das Histórias ganhou novas vozes.',
  }),
  [JOURNEY_STAGES.MASTERY]: Object.freeze({
    id: 'mastery-expedition',
    title: 'Expedição de Maestria',
    shortTitle: '5 desafios',
    goal: 5,
    unit: 'desafios',
    startMessage: 'Complete cinco desafios livres nesta expedição.',
    completionMessage: 'Expedição concluída! Continue explorando para manter sua maestria.',
  }),
});

export function createSessionQuest(journey, { enabled = true } = {}) {
  if (!enabled || !journey?.stage) {
    return {
      enabled: false,
      completed: false,
      progress: 0,
      goal: 0,
      stars: 0,
      encounterIds: [],
    };
  }

  const config = QUEST_CONFIG[journey.stage] || QUEST_CONFIG[JOURNEY_STAGES.LETTERS];
  return {
    enabled: true,
    stage: journey.stage,
    worldId: journey.worldId,
    id: config.id,
    title: config.title,
    shortTitle: config.shortTitle,
    unit: config.unit,
    startMessage: config.startMessage,
    completionMessage: config.completionMessage,
    progress: 0,
    goal: config.goal,
    stars: 0,
    completed: false,
    encounterIds: [],
  };
}

/**
 * Advance one in-memory expedition checkpoint after a persisted learning result.
 * @param {any} quest
 * @param {{ isCorrect?: boolean, starsEarned?: number, encounterId?: string | number }} [event]
 */
export function advanceSessionQuest(quest, event = {}) {
  const { isCorrect, starsEarned = 0, encounterId } = event;
  if (!quest?.enabled || quest.completed || !isCorrect) return quest;

  const id = String(encounterId || '').trim();
  if (!id || quest.encounterIds.includes(id)) return quest;

  const progress = Math.min(quest.goal, quest.progress + 1);
  return {
    ...quest,
    progress,
    stars: quest.stars + Math.max(0, Number(starsEarned) || 0),
    completed: progress >= quest.goal,
    encounterIds: [...quest.encounterIds, id],
  };
}

export function getSessionQuestPercent(quest) {
  if (!quest?.enabled || !quest.goal) return 0;
  return Math.max(0, Math.min(100, Math.round((quest.progress / quest.goal) * 100)));
}

export function getSessionQuestLabel(quest) {
  if (!quest?.enabled) return '';
  if (quest.completed) return `${quest.title} concluída`;
  return `${quest.progress}/${quest.goal} ${quest.unit}`;
}
