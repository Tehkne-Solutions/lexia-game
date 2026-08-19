export const LEARNER_DAILY_PLAN_KIND = Object.freeze({
  REVIEW: 'review',
  CURRICULUM: 'curriculum',
  DAILY_BONUS: 'daily-bonus',
});

export const LEARNER_DAILY_PLAN_STATE = Object.freeze({
  CURRENT: 'current',
  NEXT: 'next',
  OPTIONAL: 'optional',
  COMPLETE: 'complete',
});

function normalizeCount(value) {
  const count = Number(value || 0);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

function withFocusState(steps) {
  let foundCurrent = false;
  return steps.map((step) => {
    if (!step.required) {
      return {
        ...step,
        state: step.completed ? LEARNER_DAILY_PLAN_STATE.COMPLETE : LEARNER_DAILY_PLAN_STATE.OPTIONAL,
      };
    }

    if (!foundCurrent) {
      foundCurrent = true;
      return { ...step, state: LEARNER_DAILY_PLAN_STATE.CURRENT };
    }

    return { ...step, state: LEARNER_DAILY_PLAN_STATE.NEXT };
  });
}

export function buildLearnerDailyPlan({ journey, reviewQuest, dailyChallenge, dailyCompletedCount = 0 }) {
  if (!journey?.path || !journey?.cta || !journey?.title) {
    throw new Error('Learner daily plan requires a valid journey');
  }

  const rawSteps = [];
  const totalDue = normalizeCount(reviewQuest?.totalDue);

  if (!journey.firstRun && reviewQuest?.hasDueReviews && reviewQuest?.nextPath) {
    rawSteps.push({
      kind: LEARNER_DAILY_PLAN_KIND.REVIEW,
      required: true,
      path: reviewQuest.nextPath,
      title: totalDue === 1 ? 'Revisão rápida' : `${totalDue} revisões rápidas`,
      description: 'Reforce o que já aprendeu antes de seguir viagem.',
      progressCurrent: 0,
      progressTotal: Math.max(1, totalDue),
    });
  }

  rawSteps.push({
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
    rawSteps.push({
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

  const steps = withFocusState(rawSteps);
  const requiredSteps = steps.filter((step) => step.required);
  const hasReviewFirst = requiredSteps[0]?.kind === LEARNER_DAILY_PLAN_KIND.REVIEW;
  const hasDailyBonus = steps.some((step) => step.kind === LEARNER_DAILY_PLAN_KIND.DAILY_BONUS);
  const requiredSequence = hasReviewFirst ? 'Revisão curta → missão atual' : 'Missão atual';
  const currentStep = steps.find((step) => step.state === LEARNER_DAILY_PLAN_STATE.CURRENT) || null;
  const nextRequiredStep = steps.find((step) => step.state === LEARNER_DAILY_PLAN_STATE.NEXT) || null;
  const bonusStep = steps.find((step) => step.kind === LEARNER_DAILY_PLAN_KIND.DAILY_BONUS) || null;

  return {
    steps,
    requiredCount: requiredSteps.length,
    hasReviewFirst,
    hasDailyBonus,
    currentStep,
    nextRequiredStep,
    bonusStep,
    headline: journey.firstRun
      ? 'Sua primeira aventura começa aqui'
      : hasReviewFirst
        ? 'Primeiro relembrar, depois avançar'
        : 'Seu caminho de hoje está pronto',
    summary: hasDailyBonus ? `${requiredSequence} → bônus opcional` : requiredSequence,
  };
}
