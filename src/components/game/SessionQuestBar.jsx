import React from 'react';
import { Compass, Star } from 'lucide-react';
import { getSessionQuestPercent } from '@/game/sessionQuestEngine';

export default function SessionQuestBar({ quest }) {
  if (!quest?.enabled) return null;

  const percent = getSessionQuestPercent(quest);

  return (
    <div className="px-3 py-2 border-b border-border/60 bg-card/80">
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
                <span className="flex items-center gap-0.5 text-amber-600">
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
