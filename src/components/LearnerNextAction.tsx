import { useMemo } from "react";
import LoadingState from "./LoadingState";
import { getLearnerNextAction } from "../engines/learnerNextActionEngine";
import type { UserProfile, JourneyProgress } from "../types";

interface Props {
  userProfile?: UserProfile;
  journeyProgress?: JourneyProgress;
}

export default function LearnerNextAction({ userProfile, journeyProgress }: Props) {
  const nextAction = useMemo(() => {
    try {
      return getLearnerNextAction(userProfile, journeyProgress);
    } catch {
      return null;
    }
  }, [userProfile, journeyProgress]);

  if (!nextAction || !nextAction.journeyPath || !nextAction.cta) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">Próxima ação</h3>
      <a href={nextAction.cta.target} className="btn-primary">
        {nextAction.cta.label}
      </a>
    </div>
  );
}
