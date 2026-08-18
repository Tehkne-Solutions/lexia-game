import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Timer, Zap, Trophy, RotateCcw, Layers3 } from 'lucide-react';
import { lexiaPlatform } from '@/platform';
import { useQuery } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import OnScreenKeyboard from '@/components/game/OnScreenKeyboard';
import { buildStats } from '@/lib/achievements';
import { getSpeedChallengeProfile } from '@/game/sideModesEngine';
import { speak, playCorrectSound, playWrongSound, playClickSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';

const GAME_DURATION = 60;

function bestScoreKey(profileId) {
  return `lexia_speed_best_${profileId || 'letters'}`;
}

export default function SpeedChallenge() {
  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });
  const stats = buildStats(allProgress);
  const speedProfile = getSpeedChallengeProfile(stats);
  const pool = speedProfile.pool;

  const [phase, setPhase] = useState('ready');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [currentItem, setCurrentItem] = useState(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      setBestScore(parseInt(localStorage.getItem(bestScoreKey(speedProfile.id)) || '0', 10));
    } catch {
      setBestScore(0);
    }
  }, [speedProfile.id]);

  const pickItem = useCallback(() => {
    if (pool.length === 0) return;
    let next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (currentItem && next.display === currentItem.display && pool.length > 1);
    setCurrentItem(next);
    setTyped('');
    setFeedback(null);
  }, [pool, currentItem]);

  const startGame = useCallback(() => {
    playClickSound();
    setScore(0);
    setStreak(0);
    setTimeLeft(GAME_DURATION);
    setPhase('playing');
    pickItem();
  }, [pickItem]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return time - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const checkAnswer = useCallback(() => {
    if (!currentItem || typed.length === 0) return;
    const answer = typed.trim().toUpperCase();
    const correct = answer === currentItem.display;
    if (correct) {
      playCorrectSound();
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
      setFeedback('correct');
    } else {
      playWrongSound();
      setStreak(0);
      setFeedback('wrong');
    }
    setTimeout(() => pickItem(), correct ? 250 : 500);
  }, [typed, currentItem, pickItem]);

  useEffect(() => {
    if (phase === 'playing' && currentItem && typed.length === currentItem.display.length && typed.length > 0) {
      const timer = setTimeout(() => checkAnswer(), 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [typed, phase, currentItem, checkAnswer]);

  useEffect(() => {
    if (phase !== 'done') return;
    if (score > bestScore && score > 0) {
      setBestScore(score);
      localStorage.setItem(bestScoreKey(speedProfile.id), String(score));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    speak(`Tempo esgotado! Você acertou ${score}!`);
    // The done transition is the only point that commits a per-pool record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-2 pt-[env(safe-area-inset-top)] border-b border-border bg-card flex-shrink-0">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        <span className="font-display text-base text-foreground">Desafio Relâmpago ⚡</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-4 max-w-md mx-auto w-full">
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 text-center w-full"
          >
            <MascotAvatar expression="excited" size="lg" message="Pronto para o desafio?" />
            <div>
              <h2 className="font-display text-2xl text-foreground">Desafio Relâmpago!</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Acerte o máximo possível em 60 segundos sem perder a precisão.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-primary/25 bg-primary/5 p-3 text-left">
              <div className="flex items-center gap-2">
                <Layers3 className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-body text-[10px] uppercase tracking-[0.12em] font-bold text-primary">Treino atual</p>
                  <p className="font-display text-base text-foreground">Até {speedProfile.label}</p>
                </div>
                <span className="font-body text-xs font-bold text-muted-foreground">
                  {speedProfile.unlockedTierCount}/{speedProfile.totalTierCount}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-2">{speedProfile.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {speedProfile.tiers.map((tier) => (
                  <span
                    key={tier.id}
                    className={`rounded-full border px-2 py-1 font-body text-[10px] font-bold
                      ${tier.unlocked
                        ? 'border-primary/30 bg-card text-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground'}`}
                  >
                    {tier.unlocked ? '✓' : '🔒'} {tier.label}
                  </span>
                ))}
              </div>
            </div>

            {bestScore > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-body font-bold text-amber-700">Recorde deste nível: {bestScore}</span>
              </div>
            )}

            <Button
              size="lg"
              onClick={startGame}
              className="rounded-2xl font-display text-xl gap-2 px-12 py-6 bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Zap className="w-6 h-6" />
              Começar!
            </Button>

            <p className="font-body text-[11px] text-muted-foreground max-w-sm">
              Frases continuam no modo próprio de composição, onde a ordem das palavras faz parte do aprendizado.
            </p>
          </motion.div>
        )}

        {phase === 'playing' && currentItem && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center gap-3">
              <div className={`flex items-center gap-1 bg-card border-2 rounded-2xl px-3 py-1.5
                ${timeLeft <= 10 ? 'border-red-400 animate-pulse' : 'border-border'}`}>
                <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={`font-display text-xl ${timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  <span className="font-display text-lg text-amber-700">{score}</span>
                </div>
                {streak >= 3 && (
                  <div className="bg-red-50 border border-red-200 rounded-full px-2 py-1 flex items-center gap-1">
                    <span className="text-sm">🔥</span>
                    <span className="font-body font-bold text-sm text-red-600">{streak}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex items-center justify-between gap-2 px-1">
              <span className="font-body text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                {currentItem.kindLabel}
              </span>
              <span className="font-body text-[10px] text-muted-foreground truncate">{currentItem.source}</span>
            </div>

            <motion.div
              key={`${currentItem.display}-${score}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-3xl border-2 border-primary/20 shadow-xl p-6 flex flex-col items-center gap-3 w-full"
            >
              <motion.span
                className="text-6xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {currentItem.emoji}
              </motion.span>

              <AnimatePresence>
                {feedback === 'correct' && (
                  <motion.div
                    key="ok"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-green-500 font-display text-2xl"
                  >✓</motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div
                    key="no"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-red-500 font-display text-2xl"
                  >✗</motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-1.5 justify-center flex-wrap">
                {currentItem.display.split('').map((_, index) => (
                  <div
                    key={index}
                    className={`w-9 h-10 sm:w-10 rounded-xl border-2 flex items-center justify-center font-display text-xl transition-all
                      ${typed[index]
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-dashed border-muted-foreground/40 bg-muted/30'}`}
                  >
                    {(typed[index] || '').toUpperCase()}
                  </div>
                ))}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(event) => setTyped(event.target.value.toUpperCase().slice(0, currentItem.display.length))}
                maxLength={currentItem.display.length}
                className="opacity-0 absolute pointer-events-none"
                autoComplete="off"
              />

              <OnScreenKeyboard
                onKey={(key) => setTyped((previous) => (previous + key).slice(0, currentItem.display.length))}
                onDelete={() => setTyped((previous) => previous.slice(0, -1))}
              />
            </motion.div>
          </div>
        )}

        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <MascotAvatar expression={score >= bestScore && score > 0 ? 'celebrating' : 'happy'} size="lg" />
            <div>
              <h2 className="font-display text-3xl text-foreground">Tempo Esgotado!</h2>
              <p className="font-body text-lg text-muted-foreground mt-2">
                Você acertou <span className="font-display text-2xl text-primary">{score}</span> vezes!
              </p>
              {score >= bestScore && score > 0 && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="font-display text-lg text-amber-500 mt-2"
                >
                  🏆 Novo Recorde deste nível!
                </motion.p>
              )}
              {bestScore > score && (
                <p className="font-body text-sm text-muted-foreground mt-2">Recorde deste nível: {bestScore}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => { playClickSound(); setPhase('ready'); }}
                className="rounded-2xl gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Voltar
              </Button>
              <Button
                size="lg"
                onClick={startGame}
                className="rounded-2xl font-display text-lg gap-2 bg-primary hover:bg-primary/90"
              >
                <Zap className="w-5 h-5" /> Jogar de Novo
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
