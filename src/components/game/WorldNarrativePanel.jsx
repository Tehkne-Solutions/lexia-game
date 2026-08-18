import React from 'react';
import { BookOpen, Compass, LockKeyhole, Sparkles } from 'lucide-react';

export default function WorldNarrativePanel({ experience, journey }) {
  if (!experience) return null;

  return (
    <section className="rounded-3xl border-2 border-primary/20 bg-card p-4 shadow-sm" aria-label="Capítulo atual da jornada">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-primary">{experience.chapter}</p>
          <h2 className="font-display text-lg text-foreground">{experience.title}</h2>
          <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">{experience.briefing}</p>
        </div>
      </div>

      {journey && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2.5">
          <Compass className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">Missão atual</p>
            <p className="font-body text-sm font-bold text-foreground">{journey.title}</p>
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">{journey.description}</p>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-border bg-muted/35 px-3 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center">
          {experience.relicUnlocked
            ? <Sparkles className="w-4 h-4 text-amber-600" />
            : <LockKeyhole className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">Relíquia do capítulo</p>
          <p className="font-body text-sm font-bold text-foreground">{experience.relic.name}</p>
          <p className="font-body text-[11px] text-muted-foreground">
            {experience.relicUnlocked ? experience.relic.description : 'Complete o domínio deste capítulo para revelar a relíquia.'}
          </p>
        </div>
      </div>
    </section>
  );
}
