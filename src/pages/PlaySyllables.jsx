import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Volume2, ChevronRight, Delete, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import { BASIC_SYLLABLES, BASIC_WORDS } from '@/lib/syllablesData';
import { speak, playCorrectSound, playWrongSound, playClickSound, playStarSound } from '@/lib/sounds';
import { getTypingFeedback, getTypingMascotMessage } from '@/lib/typingFeedback';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';

const urlParams = new URLSearchParams(window.location.search);
const MODE = urlParams.get('mode') === 'words' ? 'words' : 'syllables';
const isPracticeMode = urlParams.get('mode') === 'practice' || urlParams.get('practice') === 'true';

const ITEMS = MODE === 'words' ? BASIC_WORDS : BASIC_SYLLABLES;
const TARGET_KEY = MODE === 'words' ? 'word' : 'syllable';
const ENTITY_PREFIX = MODE === 'words' ? 'WORD_' : 'SYL_';

export default function PlaySyllables() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * ITEMS.length));
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('type'); // type | correct | wrong
  const [mascotExpression, setMascotExpression] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const current = ITEMS[index];
  const target = current[TARGET_KEY];

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => base44.entities.ChildProgress.list(),
    initialData: [],
  });

  useEffect(() => {
    const stars = allProgress.reduce((s, p) => s + (p.stars_earned || 0), 0);
    setTotalStars(stars);
  }, [allProgress]);

  const saveMutation = useMutation({
    mutationFn: async ({ isCorrect }) => {
      const entityKey = ENTITY_PREFIX + target;
      const existing = allProgress.find(p => p.letter === entityKey);
      const data = {
        child_name: 'Jogador',
        letter: entityKey,
        total_attempts: (existing?.total_attempts || 0) + 1,
        correct_attempts: (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0),
        streak: isCorrect ? (existing?.streak || 0) + 1 : 0,
        stars_earned: (existing?.stars_earned || 0) + (isCorrect ? 1 : 0),
        stability: existing?.stability || 0,
        difficulty: existing?.difficulty || 0,
        interval: existing?.interval || 0,
        repetitions: existing?.repetitions || 0,
        next_review: existing?.next_review || new Date().toISOString(),
        last_grade: isCorrect ? 3 : 1,
        level: 1,
      };
      if (existing) {
        await base44.entities.ChildProgress.update(existing.id, data);
      } else {
        await base44.entities.ChildProgress.create(data);
      }
      return { isCorrect };
    },
    onSuccess: ({ isCorrect }) => {
      queryClient.invalidateQueries({ queryKey: ['childProgress'] });
    },
  });

  useEffect(() => {
    setTyped('');
    setPhase('type');
    setMascotExpression('happy');
    setMascotMessage(`Digite: ${target}`);
    setTimeout(() => speak(`${MODE === 'words' ? 'Palavra' : 'Sílaba'}: ${target}. ${current[MODE === 'words' ? 'hint' : 'word']}!`), 300);
    inputRef.current?.focus();
  }, [index]);

  const checkAnswer = useCallback(() => {
    const answer = typed.trim().toUpperCase();
    const correct = answer === target;
    if (correct) {
      playCorrectSound();
      setPhase('correct');
      setMascotExpression('excited');
      setMascotMessage(getTypingMascotMessage(typed, target, true));
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTotalStars(s => s + 1);
      if (!isPracticeMode) saveMutation.mutate({ isCorrect: true });
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowCelebration(true);
      }
      const specificHint = getTypingFeedback(typed, target, true);
      const successSpeech = getSpokenFeedback(true, specificHint, { motivationalChance: 0.6 });
      setTimeout(() => speak(successSpeech), 400);
      // Streak milestone phrase
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => speak(getStreakPhrase()), 1600);
      }
    } else {
      playWrongSound();
      setPhase('wrong');
      setMascotExpression('encouraging');
      setMascotMessage(getTypingMascotMessage(typed, target, false));
      setStreak(0);
      if (!isPracticeMode) saveMutation.mutate({ isCorrect: false });
      const specificHint = getTypingFeedback(typed, target, false);
      const hintSpeech = getSpokenFeedback(false, specificHint, { motivationalChance: 0.35 });
      setTimeout(() => speak(hintSpeech), 500);
    }
  }, [typed, target, streak, saveMutation]);

  const nextItem = useCallback(() => {
    playClickSound();
    setShowCelebration(false);
    // Pick next random different item
    let next;
    do { next = Math.floor(Math.random() * ITEMS.length); } while (next === index && ITEMS.length > 1);
    setIndex(next);
  }, [index]);

  // Keyboard: Enter to submit, Backspace etc handled by input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && phase === 'type' && typed.length > 0) {
      checkAnswer();
    }
  };

  const title = MODE === 'words' ? 'Palavras' : 'Sílabas';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 pt-[env(safe-area-inset-top)] border-b border-border bg-card/50 flex-shrink-0">
        <Link to="/world">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {isPracticeMode && (
            <span className="bg-secondary/20 text-secondary border border-secondary/40 rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-body font-bold">
              <Sparkles className="w-3 h-3" /> Prática
            </span>
          )}
          <span className="font-display text-base text-foreground">{title}</span>
          <div className="flex items-center gap-1 bg-amber-100 rounded-full px-2 py-0.5">
            <span className="text-sm">⭐</span>
            <span className="font-body font-bold text-sm text-amber-700">{totalStars}</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-red-100 rounded-full px-2 py-0.5">
              <span className="text-sm">🔥</span>
              <span className="font-body font-bold text-sm text-red-600">{streak}</span>
            </div>
          )}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-4 max-w-md mx-auto w-full">

        {/* Mascot */}
        <MascotAvatar expression={mascotExpression} size="sm" message={mascotMessage} />

        {/* Item card */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-card rounded-3xl border-2 border-primary/20 shadow-xl p-6 flex flex-col items-center gap-3"
        >
          <motion.span
            className="text-7xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {current.emoji}
          </motion.span>

          {MODE === 'words' && (
            <p className="font-body text-muted-foreground text-sm text-center">{current.hint}</p>
          )}

          <Button variant="ghost" size="sm" className="rounded-full gap-1 text-muted-foreground"
            onClick={() => speak(`${MODE === 'words' ? 'Palavra' : 'Sílaba'}: ${target}. ${current[MODE === 'words' ? 'hint' : 'word']}!`)}>
            <Volume2 className="w-4 h-4" />
            Ouvir
          </Button>

          {/* Typing area */}
          <AnimatePresence mode="wait">
            {phase === 'type' && (
              <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center gap-3">
                {/* Visual letter tiles */}
                <div className="flex gap-2 justify-center">
                  {target.split('').map((_, i) => (
                    <div key={i}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-display text-2xl transition-all
                        ${typed[i] ? 'border-primary bg-primary/10 text-primary' : 'border-dashed border-muted-foreground/40 bg-muted/30 text-transparent'}`}
                    >
                      {(typed[i] || '').toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Hidden real input for keyboard */}
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase().slice(0, target.length))}
                  onKeyDown={handleKeyDown}
                  maxLength={target.length}
                  className="opacity-0 absolute pointer-events-none"
                  autoComplete="off"
                  autoCapitalize="characters"
                />

                {/* On-screen keyboard for touch */}
                <OnScreenKeyboard
                  onKey={(k) => setTyped(p => (p + k).slice(0, target.length))}
                  onDelete={() => setTyped(p => p.slice(0, -1))}
                />

                <Button
                  size="lg"
                  onClick={checkAnswer}
                  disabled={typed.length === 0}
                  className="w-full rounded-2xl font-display text-lg gap-2 shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  Verificar
                </Button>
              </motion.div>
            )}

            {phase === 'correct' && (
              <motion.div key="correct" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3">
                <div className="bg-green-100 border-2 border-green-400 rounded-2xl px-6 py-3 text-center">
                  <p className="font-display text-3xl text-green-700">{target}</p>
                  <p className="font-body text-sm text-green-600">✅ Correto! +1 ⭐</p>
                </div>
                <Button onClick={nextItem} className="rounded-2xl gap-2 font-display">
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {phase === 'wrong' && (
              <motion.div key="wrong" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3">
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl px-6 py-3 text-center">
                  <p className="font-body text-sm text-muted-foreground">Você digitou: <strong>{typed}</strong></p>
                  <p className="font-display text-2xl text-red-500">Correto: {target}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setTyped(''); setPhase('type'); inputRef.current?.focus(); }}
                    className="rounded-2xl gap-1">
                    Tentar Novamente
                  </Button>
                  <Button onClick={nextItem} className="rounded-2xl gap-2 font-display">
                    Próximo <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <CelebrationOverlay show={showCelebration} stars={3} message={`Combo ${streak}x! 🔥`} onDone={nextItem} />
    </div>
  );
}

import OnScreenKeyboard from '@/components/game/OnScreenKeyboard';