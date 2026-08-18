import React from 'react';
import { ALPHABET } from '@/lib/alphabetData';
import { calculateMastery } from '@/lib/fsrs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LetterProgressGrid({ progressMap }) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
        {ALPHABET.map(item => {
          const p = progressMap[item.letter];
          const mastery = p ? calculateMastery(p) : 0;
          
          let bg = 'bg-muted';
          if (mastery >= 80) bg = 'bg-secondary';
          else if (mastery >= 50) bg = 'bg-accent';
          else if (mastery >= 20) bg = 'bg-primary/40';
          else if (p && p.total_attempts > 0) bg = 'bg-primary/20';

          return (
            <Tooltip key={item.letter}>
              <TooltipTrigger>
                <div className={`aspect-square rounded-lg ${bg} flex items-center justify-center
                  font-display text-sm transition-colors cursor-default
                  ${mastery >= 80 ? 'text-white' : mastery >= 50 ? 'text-accent-foreground' : 'text-foreground/60'}`}>
                  {item.letter}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-body text-sm">
                  <strong>{item.letter}</strong> de {item.word} {item.emoji}
                  <br />
                  Domínio: {mastery}%
                  {p && <><br />Tentativas: {p.total_attempts}</>}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}