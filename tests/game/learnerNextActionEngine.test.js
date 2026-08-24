import { describe, it, expect } from 'vitest';
import {
  getLearnerNextAction,
  LEARNER_NEXT_ACTION_KIND,
} from '@/game/learnerNextActionEngine';

describe('Learner Next Action Engine', () => {
  it('recommends curriculum on first run', () => {
    const journey = {
      firstRun: true,
      path: '/play',
      cta: 'Começar',
      title: 'Primeira letra',
      description: 'Aprenda a primeira letra do alfabeto.',
    };

    const action = getLearnerNextAction(journey, null);
    expect(action.kind).toBe(LEARNER_NEXT_ACTION_KIND.CURRICULUM);
    expect(action.path).toBe('/play');
    expect(action.cta).toBe('Começar');
  });

  it('prioritizes due reviews when review quest has due reviews', () => {
    const journey = {
      firstRun: false,
      path: '/play',
      cta: 'Continuar jornada',
      title: 'Mundo 1',
      description: 'Explorando novas letras',
    };

    const reviewQuest = {
      hasDueReviews: true,
      nextPath: '/play?review=1&reviewTarget=A',
      totalDue: 3,
      nextChapter: { title: 'Revisão das vogais' },
      nextEntityKey: 'A',
    };

    const action = getLearnerNextAction(journey, reviewQuest);
    expect(action.kind).toBe(LEARNER_NEXT_ACTION_KIND.REVIEW);
    expect(action.path).toBe('/play?review=1&reviewTarget=A');
    expect(action.cta).toBe('Revisar agora');
    expect(action.totalDue).toBe(3);
  });

  it('returns curriculum action with completion handoff context when reviews or daily challenges are done', () => {
    const journey = {
      firstRun: false,
      path: '/play-syllables',
      cta: 'Formar sílabas',
      title: 'Mundo 2',
      description: 'Vamos juntar as letras!',
    };

    const action = getLearnerNextAction(journey, null, { reviewCompleted: true, dailyCompleted: false });
    expect(action.kind).toBe(LEARNER_NEXT_ACTION_KIND.CURRICULUM);
    expect(action.cta).toBe('Continuar missão');
    expect(action.reviewCompleted).toBe(true);
  });
});

