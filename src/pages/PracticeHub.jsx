import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Lock, Play, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MascotAvatar from '@/components/game/MascotAvatar';
import { lexiaPlatform } from '@/platform';
import { getJourneyPracticeState } from '@/game/practiceEngine';
import { buildLearnerReviewQuest, getLearnerReviewQuestLabel } from '@/game/learnerReviewQuestEngine';
import { playClickSound } from '@/lib/sounds';

export default function PracticeHub() {
  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const practice = useMemo(() => getJourneyPracticeState(allProgress), [allProgress]);
  const reviewQuest = useMemo(() => buildLearnerReviewQuest(allProgress), [allProgress]);

  return (
    <div className="game-viewport-scroll bg-background">
      <header className="game-safe-top sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur px-3 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={playClickSound} aria-label="Voltar ao início">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-center min-w-0">
            <p className="font-display text-lg sm:text-xl text-foreground">Prática Livre</p>
            <p className="font-body text-[11px] text-muted-foreground">Treine sem pressão e sem avançar a missão</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="game-safe-bottom max-w-3xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col items-center text-center gap-2 mb-5">
          <MascotAvatar expression="encouraging" size="sm" message="Escolha o que quer treinar!" accessories={null} />
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-body font-bold text-secondary">
            <Sparkles className="w-4 h-4" />
            {practice.unlockedCount}/{practice.totalCount} práticas disponíveis
          </div>
        </div>

        {reviewQuest.hasDueReviews && reviewQuest.nextPath && (
          <section className="mb-4 rounded-3xl border-2 border-sky-300 bg-sky-50 p-4" aria-label="Revisões prontas">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center flex-none">
                <RotateCcw className="w-5 h-5 text-sky-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[10px] uppercase tracking-[0.12em] font-bold text-sky-700">Revisão inteligente</p>
                <h2 className="font-display text-base text-foreground">{getLearnerReviewQuestLabel(reviewQuest)}</h2>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Comece por {reviewQuest.nextChapter?.title}. Revisar atualiza sua memória sem avançar a expedição principal.
                </p>
              </div>
            </div>
            <Link to={reviewQuest.nextPath} className="block mt-3">
              <Button className="w-full rounded-2xl gap-2 bg-sky-700 hover:bg-sky-800" onClick={playClickSound}>
                <RotateCcw className="w-4 h-4" /> Revisar agora
              </Button>
            </Link>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Práticas da jornada">
          {practice.options.map((option) => {
            const reviewChapter = reviewQuest.chapters.find((chapter) => chapter.stage === option.id);
            const dueCount = Number(reviewChapter?.dueCount || 0);
            return (
              <article
                key={option.id}
                className={`rounded-3xl border-2 p-4 min-h-40 flex flex-col gap-3 transition-colors
                  ${option.unlocked
                    ? option.current
                      ? 'border-primary/40 bg-card shadow-md'
                      : 'border-border bg-card'
                    : 'border-border/70 bg-muted/30 opacity-70'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{option.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base text-foreground">{option.title}</h2>
                      {option.current && option.unlocked && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-primary">
                          Atual
                        </span>
                      )}
                      {dueCount > 0 && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-sky-700">
                          {dueCount} {dueCount === 1 ? 'revisão' : 'revisões'}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs font-bold text-secondary mt-0.5">{option.label}</p>
                  </div>
                </div>

                <p className="font-body text-sm text-muted-foreground flex-1">{option.description}</p>

                {option.unlocked ? (
                  <div className="grid gap-2">
                    {dueCount > 0 && reviewChapter?.reviewPath && (
                      <Link to={reviewChapter.reviewPath} className="w-full">
                        <Button variant="outline" className="w-full rounded-2xl gap-2 font-body font-bold border-sky-300 text-sky-700 hover:bg-sky-50" onClick={playClickSound}>
                          <RotateCcw className="w-4 h-4" /> Revisar {dueCount} agora
                        </Button>
                      </Link>
                    )}
                    <Link to={option.path} className="w-full">
                      <Button className="w-full rounded-2xl gap-2 font-display" onClick={playClickSound}>
                        <Play className="w-4 h-4" /> Treinar
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button variant="outline" disabled className="w-full rounded-2xl gap-2 font-body font-bold">
                    <Lock className="w-4 h-4" /> Continue a jornada para liberar
                  </Button>
                )}
              </article>
            );
          })}
        </section>

        <p className="font-body text-xs text-muted-foreground text-center mt-5">
          A Prática Livre não substitui sua missão atual nem altera a sequência da jornada. Revisões inteligentes atualizam o FSRS sem avançar a expedição.
        </p>
      </main>
    </div>
  );
}
