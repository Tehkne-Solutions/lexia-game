import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Timer, Zap, Trophy, RotateCcw } from 'lucide-react';
import MascotAvatar from '@/components/game/MascotAvatar';
import OnScreenKeyboard from '@/components/game/OnScreenKeyboard';
import { ALPHABET } from '@/lib/alphabetData';
import { BASIC_SYLLABLES } from '@/lib/syllablesData';
import { speak, playCorrectSound, playWrongSound, playClickSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';

const GAME_DURATION = 60;

export default function SpeedChallenge() {
  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('lexia_speed_best') || '0'); } catch { return 0; }
  });
  const [currentItem, setCurrentItem] = useState(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const pool = React.useMemo(() => {
    const letters = ALPHABET.map(a => ({ display: a.letter, emoji: a.emoji }));
    const syllables = BASIC_SYLLABLES.map(s => ({ display: s.syllable, emoji: s.emoji }));
    return [...letters, ...syllables];
  }, []);

  const pickItem = useCallback(() => {
    let next;
    do { next = pool[Math.floor(Math.random() * pool.length)]; } while (currentItem && next.display === currentItem.display && pool.length > 1);
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
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return t - 1;
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
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setFeedback('correct');
    } else {
      playWrongSound();
      setStreak(0);
      setFeedback('wrong');
    }
    setTimeout(() => pickItem(), correct ? 250 : 500);
  }, [typed, currentItem, pickItem]);

  // Auto-check when typed length matches target
  useEffect(() => {
    if (phase === 'playing' && currentItem && typed.length === currentItem.display.length && typed.length > 0) {
      const t = setTimeout(() => checkAnswer(), 150);
      return () => clearTimeout(t);
    }
  }, [typed, phase, currentItem, checkAnswer]);

  useEffect(() => {
    if (phase === 'done') {
      if (score > bestScore && score > 0) {
        setBestScore(score);
        localStorage.setItem('lexia_speed_best', String(score));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
      speak(`Tempo esgotado! Você acertou ${score}!`);
    }
  }, [phase]); // eslint-disable-line

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 pt-[env(safe-area-inset-top)] border-b border-border bg-card/50 flex-shrink-0">
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
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center">
            <MascotAvatar expression="excited" size="lg" message="Pronto para o desafio?" />
            <div>
              <h2 className="font-display text-2xl text-foreground">Desafio Relâmpago!</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Quantas letras e sílabas você acerta em 60 segundos?
              </p>
            </div>
            {bestScore > 0 && (
              <div className="bg-amber-100 border border-amber-400 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-body font-bold text-amber-700">Recorde: {bestScore}</span>
              </div>
            )}
            <Button size="lg" onClick={startGame}
              className="rounded-2xl font-display text-xl gap-2 px-12 py-6
                bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                shadow-lg shadow-amber-500/30">
              <Zap className="w-6 h-6" />
              Começar!
            </Button>
          </motion.div>
        )}

        {phase === 'playing' && currentItem && (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Timer + Score */}
            <div className="w-full flex justify-between items-center gap-3">
              <div className={`flex items-center gap-1 bg-card border-2 rounded-2xl px-3 py-1.5
                ${timeLeft <= 10 ? 'border-red-400 animate-pulse' : 'border-border'}`}>
                <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={`font-display text-xl ${timeLeft <= 10 ? 'text-red-500' : 'text-foreground'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 rounded-full px-3 py-1 flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  <span className="font-display text-lg text-amber-700">{score}</span>
                </div>
                {streak >= 3 && (
                  <div className="bg-red-100 rounded-full px-2 py-1 flex items-center gap-1">
                    <span className="text-sm">🔥</span>
                    <span className="font-body font-bold text-sm text-red-600">{streak}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current item */}
            <motion.div
              key={currentItem.display + score}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-3xl border-2 border-primary/20 shadow-xl p-6 flex flex-col items-center gap-3 w-full"
            >
              <motion.span className="text-6xl"
                animate={{ y: [0, -6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                {currentItem.emoji}
              </motion.span>

              <AnimatePresence>
                {feedback === 'correct' && (
                  <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="text-green-500 font-display text-2xl">✓</motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div key="no" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="text-red-500 font-display text-2xl">✗</motion.div>
                )}
              </AnimatePresence>

              {/* Letter tiles */}
              <div className="flex gap-2 justify-center">
                {currentItem.display.split('').map((_, i) => (
                  <div key={i}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-display text-xl transition-all
                      ${typed[i] ? 'border-primary bg-primary/10 text-primary' : 'border-dashed border-muted-foreground/40 bg-muted/30'}`}>
                    {(typed[i] || '').toUpperCase()}
                  </div>
                ))}
              </div>

              <input ref={inputRef} type="text" value={typed}
                onChange={(e) => setTyped(e.target.value.toUpperCase().slice(0, currentItem.display.length))}
                maxLength={currentItem.display.length}
                className="opacity-0 absolute pointer-events-none" autoComplete="off" />

              <OnScreenKeyboard
                onKey={(k) => setTyped(p => (p + k).slice(0, currentItem.display.length))}
                onDelete={() => setTyped(p => p.slice(0, -1))}
              />
            </motion.div>
          </div>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center">
            <MascotAvatar expression={score >= bestScore && score > 0 ? 'celebrating' : 'happy'} size="lg" />
            <div>
              <h2 className="font-display text-3xl text-foreground">Tempo Esgotado!</h2>
              <p className="font-body text-lg text-muted-foreground mt-2">
                Você acertou <span className="font-display text-2xl text-primary">{score}</span> vezes!
              </p>
              {score >= bestScore && score > 0 && (
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="font-display text-lg text-amber-500 mt-2">
                  🏆 Novo Recorde!
                </motion.p>
              )}
              {bestScore > score && (
                <p className="font-body text-sm text-muted-foreground mt-2">Recorde: {bestScore}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => { playClickSound(); setPhase('ready'); }}
                className="rounded-2xl gap-2">
                <RotateCcw className="w-5 h-5" /> Voltar
              </Button>
              <Button size="lg" onClick={startGame}
                className="rounded-2xl font-display text-lg gap-2
                  bg-gradient-to-r from-amber-500 to-orange-500">
                <Zap className="w-5 h-5" /> Jogar de Novo
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}