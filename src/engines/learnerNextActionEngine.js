export function calculateNextAction(userProfile, journeyProgress) {
  if (!userProfile || !journeyProgress) {
    return {
      journeyPath: "world_1",
      cta: { label: "Continuar", target: "/journey" }
    };
  }

  const journeyPath = journeyProgress?.currentPath || "world_1";
  const cta = journeyProgress?.nextCta || { label: "Continuar", target: "/journey" };

  return { journeyPath, cta };
}

export function getLearnerNextAction(userProfile, journeyProgress) {
  if (!userProfile || !journeyProgress) {
    return {
      journeyPath: "world_1",
      cta: { label: "Continuar", target: "/journey" }
    };
  }

  try {
    const action = calculateNextAction(userProfile, journeyProgress);
    return {
      journeyPath: action?.journeyPath || "world_1",
      cta: {
        label: action?.cta?.label || "Continuar",
        target: action?.cta?.target || "/journey"
      }
    };
  } catch {
    return {
      journeyPath: "world_1",
      cta: { label: "Continuar", target: "/journey" }
    };
  }
}
