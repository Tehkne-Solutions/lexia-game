import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Lock, ChevronRight, ChevronLeft, Volume2, BookOpen } from 'lucide-react';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import { buildStats } from '@/lib/achievements';
import { getStoryLibrary } from '@/game/sideModesEngine';
import { speak, playClickSound } from '@/lib/sounds';

export default function StoryMode() {
  const [activeChapter, setActiveChapter] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  const stats = buildStats(allProgress);
  const storyLibrary = getStoryLibrary(stats);
  const unlockedCount = storyLibrary.filter((chapter) => chapter.unlocked).length;

  useEffect(() => {
    if (activeChapter && activeChapter.pages[pageIdx]) {
      const page = activeChapter.pages[pageIdx];
      const timer = setTimeout(() => speak(page.text), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeChapter, pageIdx]);

  function openChapter(chapter) {
    if (!chapter.unlocked) return;
    playClickSound();
    setActiveChapter(chapter);
    setPageIdx(0);
  }

  function closeChapter() {
    playClickSound();
    setActiveChapter(null);
    setPageIdx(0);
  }

  function nextPage() {
    if (pageIdx < activeChapter.pages.length - 1) {
      setPageIdx((page) => page + 1);
    } else {
      closeChapter();
    }
  }

  function prevPage() {
    if (pageIdx > 0) setPageIdx((page) => page - 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-2 pt-[env(safe-area-inset-top)] border-b border-border bg-card flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        <span className="font-display text-base text-foreground">Biblioteca da Jornada 📖</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-4 max-w-lg mx-auto w-full">
        {!activeChapter && (
          <>
            <MascotAvatar expression="happy" size="md" message="Vamos continuar nossa história?" />
            <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-3 mt-4 mb-4 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-none" />
              <div>
                <p className="font-body text-sm font-bold text-foreground">Histórias que acompanham seus mundos</p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">
                  Cada nova relíquia abre o próximo livro. Ler não substitui as missões: transforma o que você aprendeu em aventura.
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              {storyLibrary.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <button
                    type="button"
                    onClick={() => openChapter(chapter)}
                    disabled={!chapter.unlocked}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left
                      ${chapter.unlocked
                        ? 'bg-card border-primary/30 hover:border-primary hover:shadow-md cursor-pointer'
                        : 'bg-muted/30 border-border opacity-65 cursor-not-allowed'}`}
                  >
                    <span className={`text-4xl ${chapter.unlocked ? '' : 'grayscale'}`}>
                      {chapter.unlocked ? chapter.emoji : '🔒'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[10px] uppercase tracking-[0.12em] text-primary font-bold">
                        {chapter.chapter}
                      </p>
                      <p className="font-display text-lg text-foreground leading-tight">{chapter.title}</p>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {chapter.unlocked
                          ? `${chapter.pages.length} páginas · mundo desbloqueado`
                          : `Conquiste ${chapter.requiredRelicName} para abrir este livro`}
                      </p>
                    </div>
                    {chapter.unlocked
                      ? <ChevronRight className="w-5 h-5 text-muted-foreground flex-none" />
                      : <Lock className="w-4 h-4 text-muted-foreground flex-none" />}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="w-full rounded-xl border border-border bg-card p-3 mt-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-body text-xs text-muted-foreground">Biblioteca descoberta</p>
                <p className="font-display text-base text-foreground">{unlockedCount}/{storyLibrary.length} livros</p>
              </div>
              <p className="font-body text-xs text-muted-foreground text-right">
                As relíquias da jornada<br />abrem novas histórias.
              </p>
            </div>
          </>
        )}

        {activeChapter && (
          <motion.div
            key={`${activeChapter.id}-${pageIdx}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full flex flex-col items-center gap-4 mt-4"
          >
            <div className="w-full text-center">
              <p className="font-body text-[10px] uppercase tracking-[0.12em] text-primary font-bold">{activeChapter.chapter}</p>
              <h2 className="font-display text-xl text-foreground">{activeChapter.title}</h2>
            </div>

            <div className="flex gap-1.5">
              {activeChapter.pages.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${index === pageIdx ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`}
                />
              ))}
            </div>

            <div className="bg-card rounded-3xl border-2 border-primary/20 shadow-xl p-8 w-full flex flex-col items-center gap-4 min-h-[280px] justify-center">
              <motion.span
                className="text-7xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {activeChapter.pages[pageIdx].emoji}
              </motion.span>
              <p className="font-body text-lg text-foreground text-center leading-relaxed">
                {activeChapter.pages[pageIdx].text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-1 text-muted-foreground"
                onClick={() => speak(activeChapter.pages[pageIdx].text)}
              >
                <Volume2 className="w-4 h-4" /> Ouvir de novo
              </Button>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={pageIdx === 0}
                className="rounded-2xl gap-1 flex-1"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button onClick={nextPage} className="rounded-2xl gap-1 flex-1 font-display">
                {pageIdx < activeChapter.pages.length - 1 ? 'Próxima' : 'Concluir'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
