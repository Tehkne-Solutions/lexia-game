import React from 'react';
import { Compass, Star, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lexiaPlatform } from '@/platform';
import { getSessionQuestPercent, isLearnerReviewRuntime } from '@/game/sessionQuestEngine';
import { buildLearnerReviewQuest } from '@/game/learnerReviewQuestEngine';
import { getLearnerReviewRemaining } from '@/game/learnerReviewRuntime';

export default function SessionQuestBar({ quest }) {
  const { data: reviewProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  if (isLearnerReviewRuntime()) {
    const reviewQuest = buildLearnerReviewQuest(reviewProgress);
    const canonicalRemaining = reviewQuest.totalDue > 0 ? reviewQuest.totalDue : null;
    const storedRemaining = getLearnerReviewRemaining();
    const reviewRemaining = canonicalRemaining ?? storedRemaining;
    const reviewMessage = reviewRemaining === 1
      ? 'Última revisão pronta'
      : reviewRemaining > 1
        ? `${reviewRemaining} revisões na fila`
        : 'Reforce sua memória sem avançar a expedição principal.';

    return (
      <div className="lexia-gameplay-context px-3 py-2 border-primary/30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-primary">Revisão inteligente</p>
              {reviewRemaining && (
                <span className="text-[10px] font-bold text-primary flex-shrink-0">
                  {reviewRemaining === 1 ? '1 restante' : `${reviewRemaining} restantes`}
                </span>
              )}
            </div>
            <p className="text-xs font-body text-foreground">{reviewMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quest?.enabled) return null;

  const percent = getSessionQuestPercent(quest);

  return (
    <div className="lexia-gameplay-context px-3 py-2">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl border border-primary/25 bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Compass className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">Expedição atual</p>
              <p className="text-xs font-display text-foreground truncate">{quest.title}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold flex-shrink-0">
              <span className="text-primary">{quest.progress}/{quest.goal}</span>
              {quest.stars > 0 && (
                <span className="flex items-center gap-0.5 text-accent">
                  <Star className="w-3 h-3 fill-current" /> {quest.stars}
                </span>
              )}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-label={`${quest.progress} de ${quest.goal} objetivos concluídos`}>
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
