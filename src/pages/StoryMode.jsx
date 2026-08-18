import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Lock, ChevronRight, ChevronLeft, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import { STORY_CHAPTERS, getUnlockedChapters } from '@/lib/stories';
import { buildStats } from '@/lib/achievements';
import { speak, playClickSound } from '@/lib/sounds';

export default function StoryMode() {
  const [activeChapter, setActiveChapter] = useState(null);
  const [pageIdx, setPageIdx] = useState(0);

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => base44.entities.ChildProgress.list(),
    initialData: [],
  });

  const stats = buildStats(allProgress);
  const unlockedChapters = getUnlockedChapters(stats.lettersMastered || 0);

  // Read page aloud when it changes
  useEffect(() => {
    if (activeChapter && activeChapter.pages[pageIdx]) {
      const page = activeChapter.pages[pageIdx];
      setTimeout(() => speak(page.text), 300);
    }
  }, [activeChapter, pageIdx]);

  function openChapter(chapter) {
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
      setPageIdx(p => p + 1);
    } else {
      closeChapter();
    }
  }

  function prevPage() {
    if (pageIdx > 0) setPageIdx(p => p - 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 pt-[env(safe-area-inset-top)] border-b border-border bg-card/50 flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        <span className="font-display text-base text-foreground">Modo História 📖</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-4 max-w-lg mx-auto w-full">
        {!activeChapter && (
          <>
            <MascotAvatar expression="happy" size="md" message="Vamos ler uma história?" />
            <p className="font-body text-sm text-muted-foreground text-center mt-4 mb-6">
              Cada história se desbloquea quando você domina mais letras!
            </p>
            <div className="w-full space-y-3">
              {STORY_CHAPTERS.map((chapter, i) => {
                const unlocked = unlockedChapters.includes(chapter);
                return (
                  <motion.div key={chapter.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}>
                    <button
                      onClick={() => unlocked && openChapter(chapter)}
                      disabled={!unlocked}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left
                        ${unlocked ? 'bg-card border-primary/30 hover:border-primary hover:shadow-md cursor-pointer'
                                   : 'bg-muted/30 border-border opacity-60 cursor-not-allowed'}`}
                    >
                      <span className="text-4xl">{unlocked ? chapter.emoji : '🔒'}</span>
                      <div className="flex-1">
                        <p className="font-display text-lg text-foreground">{chapter.title}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {unlocked ? `${chapter.pages.length} páginas` : `Domine ${chapter.unlockLetters} letras para desbloquear`}
                        </p>
                      </div>
                      {unlocked ? <ChevronRight className="w-5 h-5 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
            <p className="font-body text-xs text-muted-foreground text-center mt-6">
              Letras dominadas: <strong>{stats.lettersMastered || 0}/26</strong>
            </p>
          </>
        )}

        {activeChapter && (
          <motion.div
            key={pageIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full flex flex-col items-center gap-4 mt-4"
          >
            {/* Page indicator */}
            <div className="flex gap-1.5">
              {activeChapter.pages.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all
                  ${i === pageIdx ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'}`} />
              ))}
            </div>

            {/* Story page */}
            <div className="bg-card rounded-3xl border-2 border-primary/20 shadow-xl p-8 w-full flex flex-col items-center gap-4 min-h-[280px] justify-center">
              <motion.span className="text-7xl"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                {activeChapter.pages[pageIdx].emoji}
              </motion.span>
              <p className="font-body text-lg text-foreground text-center leading-relaxed">
                {activeChapter.pages[pageIdx].text}
              </p>
              <Button variant="ghost" size="sm" className="rounded-full gap-1 text-muted-foreground"
                onClick={() => speak(activeChapter.pages[pageIdx].text)}>
                <Volume2 className="w-4 h-4" /> Ouvir de novo
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={prevPage} disabled={pageIdx === 0}
                className="rounded-2xl gap-1 flex-1">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button onClick={nextPage}
                className="rounded-2xl gap-1 flex-1 font-display">
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