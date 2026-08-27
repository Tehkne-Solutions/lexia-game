export function getLearnerNextAction(userProfile, journeyProgress) {
  if (!userProfile || !journeyProgress) {
    return {
      journeyPath: "world_1",
      cta: { label: "Continuar", target: "/journey" }
    };
  }

  const action = calculateNextAction(userProfile, journeyProgress);

  return {
    journeyPath: action?.journeyPath || "world_1",
    cta: {
      label: action?.cta?.label || "Continuar",
      target: action?.cta?.target || "/journey"
    }
  };
}
