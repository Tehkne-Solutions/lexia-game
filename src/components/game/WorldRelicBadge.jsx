import React from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';

export default function WorldRelicBadge({ experience }) {
  if (!experience?.relic) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-body">
      {experience.relicUnlocked
        ? <Sparkles className="w-3.5 h-3.5 text-accent" />
        : <LockKeyhole className="w-3.5 h-3.5 opacity-70" />}
      <span className={experience.relicUnlocked ? 'font-bold' : 'opacity-80'}>
        {experience.relicUnlocked ? experience.relic.name : `Relíquia: ${experience.relic.name}`}
      </span>
    </div>
  );
}
