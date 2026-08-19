import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock, Star, Play, Keyboard, Compass } from 'lucide-react';
import { buildStats } from '@/lib/achievements';
import { WORLDS, isWorldUnlocked } from '@/lib/worldMap';
import { playClickSound } from '@/lib/sounds';
import { getJourneyState } from '@/game/journeyEngine';
import {
  getJourneyWorldExperience,
  getWorldExperience,
  getWorldRelicProgress,
} from '@/game/worldExperienceEngine';
import GameActionButton from '@/components/game/GameActionButton';
import GamePanel from '@/components/game/GamePanel';
import WorldUnlockCelebration from '@/components/game/WorldUnlockCelebration';
import WorldNarrativePanel from '@/components/game/WorldNarrativePanel';
import WorldRelicBadge from '@/components/game/WorldRelicBadge';

function getUnlockHint(world) {
  if (world.unlockType === 'stars_or_mastery') {
    return `🔒 ${world.unlockRequirement}⭐ ou ${Math.round(world.unlockMasteryPct * 100)}% das letras`;
  }
  if (world.unlockType === 'previous_or_stars') {
    return `🔒 Conclua o mundo anterior ou alcance ${world.unlockRequirement}⭐`;
  }
  return '🔒 Continue sua jornada para desbloquear';
}

export default function WorldMap() {
  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const stats = buildStats(allProgress);
  const journey = getJourneyState(allProgress);
  const activeExperience = getJourneyWorldExperience(journey, stats);
  const relicProgress = getWorldRelicProgress(stats);
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
    <div className="game-viewport flex flex-col bg-background">
      <header className="game-safe-top lexia-gameplay-hud p-3 flex-shrink-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/" aria-label="Voltar ao início">
            <GameActionButton
              gameVariant="neutral"
              variant="ghost"
              size="icon"
              className="lexia-hud-icon h-9 w-9 rounded-xl"
              onClick={playClickSound}
            >
              <ArrowLeft className="w-4 h-4" />
            </GameActionButton>
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl text-foreground">Mapa do Mundo</h1>
            <p className="font-body text-xs sm:text-sm text-muted-foreground">Sua jornada de aprendizado</p>
          </div>
        </div>
      </header>

      <div className="game-scroll-y flex-1 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

        <div className="game-safe-bottom max-w-lg mx-auto p-4 pt-6 space-y-4 relative z-10">
          <WorldNarrativePanel experience={activeExperience} journey={journey} />

          <div className="relative">
            {WORLDS.map((world, index) => {
              const completed = Math.min(world.getLessonsCompleted(stats), world.totalLessons);
              const total = world.totalLessons;
              const pct = Math.round((completed / total) * 100);
              const unlocked = isWorldUnlocked(world, stats);
              const isActive = unlocked && pct < 100;
              const isDone = pct >= 100;
              const isRecommended = journey.worldId === world.id;
              const worldExperience = getWorldExperience(world.id, stats);
              const panelTone = isDone ? 'success' : isRecommended ? 'reward' : 'paper';

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

                  <GamePanel
                    tone={panelTone}
                    className={`relative overflow-hidden p-0 ${unlocked ? '' : 'opacity-60'}`}
                  >
                    {isRecommended && (
                      <div className="absolute top-2 right-2 z-10 lexia-stat-chip">
                        <Compass className="w-3 h-3" />
                        <span className="font-body text-[10px] font-bold uppercase">Missão atual</span>
                      </div>
                    )}

                    <div className="p-4 flex items-center gap-4">
                      <motion.div
                        className="text-5xl"
                        animate={isRecommended ? { scale: [1, 1.12, 1] } : isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {world.emoji}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {worldExperience.chapter} · {worldExperience.title}
                        </p>
                        <div className="flex items-center gap-2 pr-20">
                          <h2 className="font-display text-lg text-foreground">{world.name}</h2>
                          {isDone && <span className="text-lg">🏆</span>}
                          {!unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <p className="font-body text-sm text-muted-foreground">{world.description}</p>

                        {unlocked && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">{completed}/{total} dominados</span>
                              <span className="text-xs font-bold text-foreground">{pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-primary/15 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-2">
                          <WorldRelicBadge experience={worldExperience} />
                        </div>

                        {!unlocked && (
                          <p className="font-body text-xs text-muted-foreground mt-1">{getUnlockHint(world)}</p>
                        )}
                      </div>

                      {unlocked && world.playPath && (
                        <Link to={isRecommended ? journey.path : world.playPath}>
                          <GameActionButton
                            gameVariant={isRecommended ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={playClickSound}
                            className="rounded-xl font-body font-bold gap-1"
                          >
                            {world.id === 'alphabet' || world.id === 'sentences'
                              ? <Play className="w-4 h-4" />
                              : <Keyboard className="w-4 h-4" />}
                            {isRecommended ? 'Continuar' : 'Jogar'}
                          </GameActionButton>
                        </Link>
                      )}
                    </div>

                    {isDone && (
                      <div className="border-t border-border px-4 py-2 flex items-center gap-1">
                        {[1, 2, 3].map(s => (
                          <Star key={s} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                        <span className="text-xs font-body text-muted-foreground ml-1">
                          {worldExperience.relicUnlocked
                            ? `${worldExperience.relic.name} conquistada!`
                            : 'Mundo completo!'}
                        </span>
                      </div>
                    )}
                  </GamePanel>
                </motion.div>
              );
            })}
          </div>

          <GamePanel tone="paper" className="p-4 text-center">
            <p className="font-body text-sm text-muted-foreground">
              🦉 Continue aprendendo para desbloquear novos mundos e relíquias!
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
              Letras <strong>{stats.lettersMastered || 0}/26</strong> · Simples <strong>{stats.syllablesBasicMastered || 0}/20</strong> · Complexas <strong>{stats.syllablesComplexMastered || 0}/20</strong><br />
              Palavras <strong>{stats.wordsMastered || 0}/20</strong> · Frases <strong>{stats.sentencesMastered || 0}/20</strong> · Relíquias <strong>{relicProgress.unlocked}/{relicProgress.total}</strong>
            </p>
          </GamePanel>
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
