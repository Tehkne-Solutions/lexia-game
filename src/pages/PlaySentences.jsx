import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Home, RotateCcw, Volume2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import MascotAvatar from '@/components/game/MascotAvatar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import { lexiaPlatform } from '@/platform';
import { BASIC_SENTENCES } from '@/lib/sentencesData';
import { playClickSound, playCorrectSound, playWrongSound, speak } from '@/lib/sounds';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';

function shuffledTokens(words) {
  const tokens = words.map((word, index) => ({ id: `${index}-${word}`, word }));
  for (let index = tokens.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [tokens[index], tokens[swap]] = [tokens[swap], tokens[index]];
  }
  return tokens;
}

export default function PlaySentences() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BASIC_SENTENCES.length));
  const [tokens, setTokens] = useState(() => shuffledTokens(BASIC_SENTENCES[index].words));
  const [selectedIds, setSelectedIds] = useState([]);
  const [phase, setPhase] = useState('build');
  const [mascotExpression, setMascotExpression] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('Monte a frase!');
  const [streak, setStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const queryClient = useQueryClient();

  const current = BASIC_SENTENCES[index];
  const selectedTokens = useMemo(
    () => selectedIds.map((id) => tokens.find((token) => token.id === id)).filter(Boolean),
    [selectedIds, tokens],
  );
  const selectedSentence = selectedTokens.map((token) => token.word).join(' ');
  const availableTokens = tokens.filter((token) => !selectedIds.includes(token.id));

  const { data: allProgress = [] } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  useEffect(() => {
    setTotalStars(allProgress.reduce((sum, record) => sum + (record.stars_earned || 0), 0));
  }, [allProgress]);

  const saveMutation = useMutation({
    mutationFn: async ({ isCorrect }) => {
      const entityKey = `SENT_${current.id}`;
      const existing = allProgress.find((record) => record.letter === entityKey);
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

      if (existing) await lexiaPlatform.progress.update(existing.id, data);
      else await lexiaPlatform.progress.create(data);
      return { isCorrect };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['childProgress'] }),
  });

  useEffect(() => {
    setTokens(shuffledTokens(current.words));
    setSelectedIds([]);
    setPhase('build');
    setMascotExpression('happy');
    setMascotMessage('Monte a frase!');
    setTimeout(() => speak(`${current.hint} Monte a frase com as palavras.`), 350);
  }, [index]);

  const addToken = useCallback((id) => {
    if (phase !== 'build') return;
    playClickSound();
    setSelectedIds((currentIds) => [...currentIds, id]);
  }, [phase]);

  const removeToken = useCallback((id) => {
    if (phase !== 'build') return;
    playClickSound();
    setSelectedIds((currentIds) => currentIds.filter((currentId) => currentId !== id));
  }, [phase]);

  const resetBuild = useCallback(() => {
    playClickSound();
    setSelectedIds([]);
    setPhase('build');
    setMascotExpression('encouraging');
    setMascotMessage('Tente outra ordem!');
  }, []);

  const checkAnswer = useCallback(() => {
    const isCorrect = selectedSentence === current.sentence;
    if (isCorrect) {
      playCorrectSound();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setTotalStars((stars) => stars + 1);
      setPhase('correct');
      setMascotExpression('excited');
      setMascotMessage('A frase ganhou vida!');
      saveMutation.mutate({ isCorrect: true });
      setTimeout(() => speak(getSpokenFeedback(true, `Você montou: ${current.sentence}.`, { motivationalChance: 0.55 })), 350);
      if (nextStreak > 0 && nextStreak % 5 === 0) {
        setShowCelebration(true);
        setTimeout(() => speak(getStreakPhrase()), 1500);
      }
      return;
    }

    playWrongSound();
    setStreak(0);
    setPhase('wrong');
    setMascotExpression('encouraging');
    setMascotMessage('A ordem pode mudar!');
    saveMutation.mutate({ isCorrect: false });
    setTimeout(() => speak(getSpokenFeedback(false, current.hint, { motivationalChance: 0.3 })), 400);
  }, [current, selectedSentence, streak, saveMutation]);

  const nextItem = useCallback(() => {
    playClickSound();
    setShowCelebration(false);
    let next;
    do { next = Math.floor(Math.random() * BASIC_SENTENCES.length); } while (next === index && BASIC_SENTENCES.length > 1);
    setIndex(next);
  }, [index]);

  return (
    <div className="game-viewport flex flex-col bg-background">
      <header className="game-safe-top flex items-center justify-between px-3 py-2 border-b border-border bg-card/50 flex-shrink-0">
        <Link to="/world">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={playClickSound}>
            <Home className="w-4 h-4" />
          </Button>
        </Link>
        <div className="text-center min-w-0">
          <p className="font-display text-sm sm:text-base text-foreground">Frases Mágicas</p>
          <p className="font-body text-[10px] text-muted-foreground">O Jardim das Histórias</p>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 rounded-full px-2 py-0.5">
          <span className="text-sm">⭐</span>
          <span className="font-body font-bold text-sm text-amber-700">{totalStars}</span>
        </div>
      </header>

      <div className="game-scroll-y game-safe-bottom flex-1 flex flex-col items-center justify-center gap-3 px-4 py-3 max-w-lg mx-auto w-full">
        <MascotAvatar className="game-compact-mascot" expression={mascotExpression} size="sm" message={mascotMessage} />

        <motion.section
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border-2 border-primary/20 bg-card shadow-xl p-4 sm:p-6 flex flex-col items-center gap-4"
        >
          <motion.span className="text-6xl" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            {current.emoji}
          </motion.span>

          <div className="text-center">
            <p className="font-body text-xs uppercase tracking-[0.13em] font-bold text-primary">Pista</p>
            <p className="font-body text-sm text-muted-foreground mt-1">{current.hint}</p>
          </div>

          <Button variant="ghost" size="sm" className="rounded-full gap-1 text-muted-foreground"
            onClick={() => speak(current.hint)}>
            <Volume2 className="w-4 h-4" /> Ouvir pista
          </Button>

          <div className="w-full min-h-16 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 p-2 flex flex-wrap gap-2 items-center justify-center">
            {selectedTokens.length === 0 ? (
              <p className="font-body text-xs text-muted-foreground">Toque nas palavras na ordem correta</p>
            ) : selectedTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => removeToken(token.id)}
                className="rounded-xl border border-primary/30 bg-primary text-primary-foreground px-3 py-2 font-body font-bold text-sm shadow-sm active:scale-95 transition-transform"
              >
                {token.word}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {phase === 'build' && (
              <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full space-y-3">
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableTokens.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => addToken(token.id)}
                      className="rounded-xl border-2 border-border bg-background px-3 py-2 font-body font-bold text-sm shadow-sm hover:border-primary/50 active:scale-95 transition-all"
                    >
                      {token.word}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <Button variant="outline" size="lg" onClick={resetBuild} disabled={selectedIds.length === 0} className="rounded-2xl px-4">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button size="lg" onClick={checkAnswer} disabled={selectedIds.length !== current.words.length}
                    className="rounded-2xl font-display text-lg gap-2">
                    <CheckCircle className="w-5 h-5" /> Verificar frase
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === 'correct' && (
              <motion.div key="correct" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full rounded-2xl border-2 border-green-400 bg-green-50 p-4 text-center">
                <p className="font-display text-xl text-green-700">{current.sentence}</p>
                <p className="font-body text-sm text-green-600 mt-1">Frase completa! +1 ⭐</p>
                <Button onClick={nextItem} className="mt-3 rounded-2xl gap-2 font-display">
                  Próxima história <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {phase === 'wrong' && (
              <motion.div key="wrong" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
                <p className="font-body text-sm text-amber-800">As palavras estão certas, mas a ordem ainda pode mudar.</p>
                <Button onClick={resetBuild} className="mt-3 rounded-2xl gap-2 font-display">
                  <RotateCcw className="w-4 h-4" /> Tentar outra ordem
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>

      <CelebrationOverlay show={showCelebration} stars={3} message={`Combo ${streak}x! 🔥`} onDone={nextItem} />
    </div>
  );
}
