export const LEARNER_NEXT_ACTION_KIND = Object.freeze({
  CURRICULUM: 'curriculum',
  REVIEW: 'review',
});

function resolveCompletionContext(options = {}) {
  if (typeof options?.reviewCompleted === 'boolean' || typeof options?.dailyCompleted === 'boolean') {
    return {
      reviewCompleted: Boolean(options?.reviewCompleted),
      dailyCompleted: Boolean(options?.dailyCompleted),
    };
  }

  try {
    const search = globalThis?.location?.search || '';
    const params = new URLSearchParams(search);
    return {
      reviewCompleted: params.get('reviewComplete') === '1',
      dailyCompleted: params.get('dailyComplete') === '1',
    };
  } catch {
    return { reviewCompleted: false, dailyCompleted: false };
  }
}

function buildCurriculumAction(journey, options = {}) {
  const completion = resolveCompletionContext(options);
  const hasCompletionHandoff = completion.reviewCompleted || completion.dailyCompleted;
  const title = completion.dailyCompleted
    ? 'BÃ´nus concluÃ­do!'
    : journey.title;
  const description = completion.reviewCompleted
    ? `RevisÃµes concluÃ­das. ${journey.description}`
    : completion.dailyCompleted
      ? `Desafio diÃ¡rio concluÃ­do. ${journey.description}`
      : journey.description;

  return {
    kind: LEARNER_NEXT_ACTION_KIND.CURRICULUM,
    path: journey.path,
    cta: hasCompletionHandoff ? 'Continuar missão' : journey.cta,
    title,
    description,
    reviewCompleted: completion.reviewCompleted,
    dailyCompleted: completion.dailyCompleted,
  };
}

export function getLearnerNextAction(journey, reviewQuest, options = {}) {
  if (!journey?.path || !journey?.cta) {
    return { kind: 'curriculum', path: '/journey', cta: 'Continuar missão', title: 'Sua jornada', description: 'Continue aprendendo.' };
  }

  if (journey.firstRun) {
    return buildCurriculumAction(journey, { reviewCompleted: false, dailyCompleted: false });
  }

  if (reviewQuest?.hasDueReviews && reviewQuest?.nextPath) {
    const totalDue = Number(reviewQuest.totalDue || 0);
    const reviewLabel = totalDue === 1 ? '1 revisÃ£o pronta' : `${totalDue} revisÃµes prontas`;

    return {
      kind: LEARNER_NEXT_ACTION_KIND.REVIEW,
      path: reviewQuest.nextPath,
      cta: 'Revisar agora',
      title: reviewQuest.nextChapter?.title || 'RevisÃ£o inteligente',
      description: `${reviewLabel} antes de continuar sua missÃ£o.`,
      totalDue,
      entityKey: reviewQuest.nextEntityKey || null,
      reviewCompleted: false,
      dailyCompleted: false,
    };
  }

  return buildCurriculumAction(journey, options);
}

