export const LEARNER_NEXT_ACTION_KIND = Object.freeze({
  CURRICULUM: 'curriculum',
  REVIEW: 'review',
});

function resolveReviewCompleted(options = {}) {
  if (typeof options?.reviewCompleted === 'boolean') return options.reviewCompleted;
  try {
    const search = globalThis?.location?.search || '';
    return new URLSearchParams(search).get('reviewComplete') === '1';
  } catch {
    return false;
  }
}

function buildCurriculumAction(journey, options = {}) {
  const reviewCompleted = resolveReviewCompleted(options);
  return {
    kind: LEARNER_NEXT_ACTION_KIND.CURRICULUM,
    path: journey.path,
    cta: reviewCompleted ? 'Continuar missão' : journey.cta,
    title: journey.title,
    description: reviewCompleted
      ? `Revisões concluídas. ${journey.description}`
      : journey.description,
    reviewCompleted,
  };
}

export function getLearnerNextAction(journey, reviewQuest, options = {}) {
  if (!journey?.path || !journey?.cta) {
    throw new Error('Learner next action requires a valid journey path and CTA');
  }

  if (journey.firstRun) {
    return buildCurriculumAction(journey, { reviewCompleted: false });
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
    };
  }

  return buildCurriculumAction(journey, options);
}
