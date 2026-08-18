import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Star, Play, Keyboard } from 'lucide-react';
import { buildStats } from '@/lib/achievements';
import { WORLDS, isWorldUnlocked } from '@/lib/worldMap';
import { playClickSound } from '@/lib/sounds';
import WorldUnlockCelebration from '@/components/game/WorldUnlockCelebration';

export default function WorldMap() {
  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const stats = buildStats(allProgress);
  const prevCompletedRef = useRef(new Set());
  const [celebrationWorld, setCelebrationWorld] = useState(null);

  useEffect(() => {
    const completedSet = new Set();
    WORLDS.forEach(world => {
      if (world.getLessonsCompleted(stats) >= world.totalLessons) {
        completedSet.add(world.id);
      }
    });
    if (prevCompletedRef.current.size > 0) {
      for (const id of completedSet) {
        if (!prevCompletedRef.current.has(id)) {
          const world = WORLDS.find(w => w.id === id);
          if (world) {
            setCelebrationWorld(world);
            break;
          }
        }
      }
    }
    prevCompletedRef.current = completedSet;
  }, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-4 pt-[env(safe-area-inset-top)] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={playClickSound}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl text-foreground">Mapa do Mundo</h1>
            <p className="font-body text-sm text-muted-foreground">Sua jornada de aprendizado</p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {['☁️', '⭐', '🌈', '☁️', '✨'].map((e, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl opacity-20"
              style={{ left: `${15 + i * 18}%`, top: `${5 + (i % 3) * 8}%` }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            >
              {e}
            </motion.span>
          ))}
        </div>

        <div className="max-w-lg mx-auto p-4 pt-6 space-y-4 relative z-10">
          <div className="relative">
            {WORLDS.map((world, index) => {
              const completed = Math.min(world.getLessonsCompleted(stats), world.totalLessons);
              const total = world.totalLessons;
              const pct = Math.round((completed / total) * 100);
              const unlocked = isWorldUnlocked(world, stats);
              const isActive = unlocked && pct < 100;
              const isDone = pct >= 100;

              return (
                <motion.div
                  key={world.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.12 }}
                  className="relative mb-4"
                >
                  {index < WORLDS.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-1 h-4 bg-border rounded-full z-0" />
                  )}

                  <div
                    className={`relative rounded-2xl border-2 overflow-hidden shadow-lg transition-all
                      ${!unlocked ? 'border-border opacity-60' : isDone ? 'border-yellow-400' : 'border-primary/50'}
                    `}
                  >
                    <div className={`bg-gradient-to-r ${world.bgColor} p-4 flex items-center gap-4`}>
                      <motion.div
                        className="text-5xl"
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {world.emoji}
                      </motion.div>

                      <div className="flex-1 text-white">
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-lg">{world.name}</h2>
                          {isDone && <span className="text-lg">🏆</span>}
                          {!unlocked && <Lock className="w-4 h-4 opacity-70" />}
                        </div>
                        <p className="font-body text-sm opacity-90">{world.description}</p>

                        {unlocked && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs opacity-80">{completed}/{total} completos</span>
                              <span className="text-xs font-bold">{pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {!unlocked && (
                          <p className="text-xs opacity-80 mt-1">
                            {world.unlockType === 'stars_or_mastery'
                              ? `🔒 ${world.unlockRequirement}⭐ ou ${Math.round(world.unlockMasteryPct * 100)}% das letras`
                              : `🔒 Domine ${world.unlockRequirement} letras`}
                          </p>
                        )}
                      </div>

                      {unlocked && world.playPath && (
                        <Link to={world.playPath}>
                          <Button
                            size="sm"
                            onClick={playClickSound}
                            className="bg-white text-primary hover:bg-white/90 rounded-xl font-body font-bold gap-1 shadow-md"
                          >
                            {world.id === 'alphabet' ? <Play className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
                            Jogar
                          </Button>
                        </Link>
                      )}
                      {unlocked && !world.playPath && (
                        <Button
                          size="sm"
                          disabled
                          className="bg-white/20 text-white rounded-xl font-body font-bold text-xs"
                        >
                          Em breve
                        </Button>
                      )}
                    </div>

                    {isDone && (
                      <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 flex items-center gap-1">
                        {[1, 2, 3].map(s => (
                          <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                        <span className="text-xs font-body text-yellow-700 ml-1">Mundo completo!</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center py-4">
            <p className="font-body text-sm text-muted-foreground">
              🦉 Continue aprendendo para desbloquear novos mundos!
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Letras: <strong>{stats.lettersMastered || 0}/26</strong> · Sílabas: <strong>{stats.syllablesBasicMastered || 0}/20</strong> · Palavras: <strong>{stats.wordsMastered || 0}/20</strong>
            </p>
          </div>
        </div>
      </div>
      <WorldUnlockCelebration
        show={!!celebrationWorld}
        world={celebrationWorld}
        onDone={() => setCelebrationWorld(null)}
      />
    </div>
  );
}