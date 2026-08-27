export function getLearnerNextAction(userProfile, journeyProgress) {
  // Fallback para estado não inicializado
  if (!userProfile || !journeyProgress) {
    return {
      journeyPath: "world_1",
      cta: { 
        label: "Continuar", 
        target: "/journey" 
      }
    };
  }

  try {
    const action = calculateNextAction(userProfile, journeyProgress);
    
    // Verificação estrutural do resultado
    return {
      journeyPath: action?.journeyPath || "world_1",
      cta: {
        label: action?.cta?.label || "Continuar",
        target: action?.cta?.target || "/journey"
      }
    };
  } catch (error) {
    console.error('Erro ao calcular próxima ação:', error);
    return {
      journeyPath: "world_1",
      cta: { 
        label: "Continuar", 
        target: "/journey" 
      }
    };
  }
}
