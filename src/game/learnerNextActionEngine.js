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
    ? 'Bônus concluído!'
    : journey.title;
  const description = completion.reviewCompleted
    ? `Revisões concluídas. ${journey.description}`
    : completion.dailyCompleted
      ? `Desafio diário concluído. ${journey.description}`
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
    throw new Error('Learner next action requires a valid journey path and CTA');
  }

  if (journey.firstRun) {
    return buildCurriculumAction(journey, { reviewCompleted: false, dailyCompleted: false });
  }

  if (reviewQuest?.hasDueReviews && reviewQuest?.nextPath) {
    const totalDue = Number(reviewQuest.totalDue || 0);
    const reviewLabel = totalDue === 1 ? '1 revisão pronta' : `${totalDue} revisões prontas`;

    return {
      kind: LEARNER_NEXT_ACTION_KIND.REVIEW,
      path: reviewQuest.nextPath,
      cta: 'Revisar agora',
      title: reviewQuest.nextChapter?.title || 'Revisão inteligente',
      description: `${reviewLabel} antes de continuar sua missão.`,
      totalDue,
      entityKey: reviewQuest.nextEntityKey || null,
      reviewCompleted: false,
      dailyCompleted: false,
    };
  }

  return buildCurriculumAction(journey, options);
}
