export const LEARNER_DAILY_PLAN_KIND = Object.freeze({
  REVIEW: 'review',
  CURRICULUM: 'curriculum',
  DAILY_BONUS: 'daily-bonus',
});

function normalizeCount(value) {
  const count = Number(value || 0);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function buildLearnerDailyPlan({ journey, reviewQuest, dailyChallenge, dailyCompletedCount = 0 }) {
  if (!journey?.path || !journey?.cta || !journey?.title) {
    throw new Error('Learner daily plan requires a valid journey');
  }

  const steps = [];
  const totalDue = normalizeCount(reviewQuest?.totalDue);

  if (!journey.firstRun && reviewQuest?.hasDueReviews && reviewQuest?.nextPath) {
    steps.push({
      kind: LEARNER_DAILY_PLAN_KIND.REVIEW,
      required: true,
      path: reviewQuest.nextPath,
      title: totalDue === 1 ? 'Revisão rápida' : `${totalDue} revisões rápidas`,
      description: 'Reforce o que já aprendeu antes de seguir viagem.',
      progressCurrent: 0,
      progressTotal: Math.max(1, totalDue),
    });
  }

  steps.push({
    kind: LEARNER_DAILY_PLAN_KIND.CURRICULUM,
    required: true,
    path: journey.path,
    title: journey.title,
    description: journey.description,
    progressCurrent: normalizeCount(journey.current),
    progressTotal: normalizeCount(journey.total),
  });

  if (dailyChallenge?.playPath) {
    const completed = Math.min(3, normalizeCount(dailyCompletedCount));
    steps.push({
      kind: LEARNER_DAILY_PLAN_KIND.DAILY_BONUS,
      required: false,
      path: dailyChallenge.playPath,
      title: dailyChallenge.completed ? 'Bônus do dia concluído' : 'Bônus do dia',
      description: dailyChallenge.completed
        ? 'Desafio diário completo. Volte amanhã para uma nova surpresa.'
        : `${dailyChallenge.typeLabel || 'Desafio diário'} · 3 alvos · ⭐×2`,
      progressCurrent: completed,
      progressTotal: 3,
      completed: Boolean(dailyChallenge.completed || completed >= 3),
    });
  }

  const requiredSteps = steps.filter((step) => step.required);
  const hasReviewFirst = requiredSteps[0]?.kind === LEARNER_DAILY_PLAN_KIND.REVIEW;

  return {
    steps,
    requiredCount: requiredSteps.length,
    hasReviewFirst,
    headline: journey.firstRun
      ? 'Sua primeira aventura começa aqui'
      : hasReviewFirst
        ? 'Primeiro relembrar, depois avançar'
        : 'Seu caminho de hoje está pronto',
    summary: hasReviewFirst
      ? 'Revisão curta → missão atual → bônus opcional'
      : 'Missão atual → bônus opcional',
  };
}
