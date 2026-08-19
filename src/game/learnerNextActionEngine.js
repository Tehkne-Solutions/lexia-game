export const LEARNER_NEXT_ACTION_KIND = Object.freeze({
  CURRICULUM: 'curriculum',
  REVIEW: 'review',
});

function buildCurriculumAction(journey) {
  return {
    kind: LEARNER_NEXT_ACTION_KIND.CURRICULUM,
    path: journey.path,
    cta: journey.cta,
    title: journey.title,
    description: journey.description,
  };
}

export function getLearnerNextAction(journey, reviewQuest) {
  if (!journey?.path || !journey?.cta) {
    throw new Error('Learner next action requires a valid journey path and CTA');
  }

  if (journey.firstRun) {
    return buildCurriculumAction(journey);
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
    };
  }

  return buildCurriculumAction(journey);
}
