import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MascotAvatar from '@/components/game/MascotAvatar';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';
import SessionQuestBar from '@/components/game/SessionQuestBar';
import SessionQuestComplete from '@/components/game/SessionQuestComplete';
import CurriculumGameplayHud from '@/components/game/CurriculumGameplayHud';
import GameActionButton from '@/components/game/GameActionButton';
import GamePanel from '@/components/game/GamePanel';
import { lexiaPlatform } from '@/platform';
import { BASIC_SENTENCES } from '@/lib/sentencesData';
import { loadLearnerReviewContinuation, navigateLearnerReviewContinuation } from '@/game/learnerReviewRuntime';
import { pickNextJourneyItemIndex, reviewJourneyProgress } from '@/learning/journeyReviewEngine';
import {
  getChallengeStarMultiplier,
  getDailyChallenge,
  getNextChallengeTarget,
} from '@/lib/dailyChallenge';
import { JOURNEY_STAGES } from '@/game/journeyEngine';
import { advanceSessionQuest, createSessionQuest } from '@/game/sessionQuestEngine';
import { playClickSound, playCorrectSound, playWrongSound, speak } from '@/lib/sounds';
import { getSpokenFeedback, getStreakPhrase } from '@/lib/motivationalPhrases';

const urlParams = new URLSearchParams(window.location.search);
const isDailyMode = urlParams.get('daily') === '1';
const isReviewMode = urlParams.get('review') === '1';
const isPracticeMode = urlParams.get('practice') === 'true';
const requestedDailyTargetKey = urlParams.get('dailyTarget');
const requestedReviewTargetKey = isReviewMode ? urlParams.get('reviewTarget') : null;
const homePath = isPracticeMode ? '/practice' : isReviewMode ? '/' : '/world';

function shuffledTokens(words) {
  const tokens = words.map((word, index) => ({ id: `${index}-${word}`, word }));
  for (let index = tokens.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [tokens[index], tokens[swap]] = [tokens[swap], tokens[index]];
  }
  return tokens;
}

function findDailySentenceIndex(targetKey) {
  if (!targetKey) return -1;
  return BASIC_SENTENCES.findIndex((sentence) => `SENT_${sentence.id}` === targetKey);
}

function findReviewSentenceIndex(targetKey) {
  if (!targetKey) return -1;
  return BASIC_SENTENCES.findIndex((sentence) => `SENT_${sentence.id}` === targetKey);
}

const requestedDailySentenceIndex = isDailyMode ? findDailySentenceIndex(requestedDailyTargetKey) : -1;
const requestedReviewSentenceIndex = isReviewMode ? findReviewSentenceIndex(requestedReviewTargetKey) : -1;

function getInitialSentenceIndex() {
  if (requestedDailySentenceIndex >= 0) return requestedDailySentenceIndex;
  if (requestedReviewSentenceIndex >= 0) return requestedReviewSentenceIndex;
  return 0;
}

export default function PlaySentences() {
  const [index, setIndex] = useState(getInitialSentenceIndex);
  const [tokens, setTokens] = useState(() => shuffledTokens(BASIC_SENTENCES[index].words));
  const [selectedIds, setSelectedIds] = useState([]);
  const [phase, setPhase] = useState('build');
  const [mascotExpression, setMascotExpression] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('Monte a frase!');
  const [streak, setStreak] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [lastStarMultiplier, setLastStarMultiplier] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const initialQuest = createSessionQuest(
    { stage: JOURNEY_STAGES.SENTENCES, worldId: 'sentences' },
    { enabled: !isPracticeMode },
  );
  const [sessionQuest, setSessionQuest] = useState(initialQuest);
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const sessionQuestRef = useRef(initialQuest);
  const encounterSequenceRef = useRef(0);
  const reviewSelectionInitializedRef = useRef(isDailyMode || requestedReviewSentenceIndex >= 0);
  const queryClient = useQueryClient();

  const current = BASIC_SENTENCES[index];
  const selectedTokens = useMemo(
    () => selectedIds.map((id) => tokens.find((token) => token.id === id)).filter(Boolean),
    [selectedIds, tokens],
  );
  const selectedSentence = selectedTokens.map((token) => token.word).join(' ');
  const availableTokens = tokens.filter((token) => !selectedIds.includes(token.id));

  const { data: allProgress = [], isFetched } = useQuery({
    queryKey: ['childProgress'],
    queryFn: () => lexiaPlatform.progress.list(),
    initialData: [],
  });

  useEffect(() => {
    setTotalStars(allProgress.reduce((sum, record) => sum + (record.stars_earned || 0), 0));
  }, [allProgress]);

  useEffect(() => {
    if (!isFetched || reviewSelectionInitializedRef.current) return;
    const recommendedIndex = pickNextJourneyItemIndex({
      items: BASIC_SENTENCES,
      allProgress,
      entityPrefix: 'SENT_',
      targetKey: 'id',
      currentIndex: -1,
    });
    setIndex(recommendedIndex);
    reviewSelectionInitializedRef.current = true;
  }, [isFetched, allProgress]);

  const saveMutation = useMutation({
    mutationFn: async (/** @type {{ isCorrect: boolean, encounterId: string }} */ variables) => {
      const { isCorrect, encounterId } = variables;
      const entityKey = `SENT_${current.id}`;
      const existing = allProgress.find((record) => record.letter === entityKey);
      const challenge = getDailyChallenge(allProgress);
      const effectiveMultiplier = isCorrect
        ? getChallengeStarMultiplier(challenge, entityKey)
        : 1;
      const reviewed = reviewJourneyProgress(existing, isCorrect);
      const data = {
        child_name: 'Jogador',
        letter: entityKey,
        total_attempts: (existing?.total_attempts || 0) + 1,
        correct_attempts: (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0),
        streak: isCorrect ? (existing?.streak || 0) + 1 : 0,
        stars_earned: (existing?.stars_earned || 0) + (isCorrect ? 1 : 0),
        stability: reviewed.stability,
        difficulty: reviewed.difficulty,
        interval: reviewed.interval,
        repetitions: reviewed.repetitions,
        next_review: reviewed.next_review,
        last_grade: reviewed.last_grade,
        level: 1,
      };

      if (existing) await lexiaPlatform.progress.update(existing.id, data);
      else await lexiaPlatform.progress.create(data);
      return {
        isCorrect,
        starsEarned: isCorrect ? effectiveMultiplier : 0,
        effectiveMultiplier,
        entityKey,
        encounterId,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['childProgress'] });
      setLastStarMultiplier(result.effectiveMultiplier || 1);
      if (result.isCorrect && result.effectiveMultiplier > 1) {
        setTotalStars((stars) => stars + (result.effectiveMultiplier - 1));
        setMascotMessage(`⭐×${result.effectiveMultiplier} Desafio diário!`);
      }
      if (!result.isCorrect || !sessionQuestRef.current?.enabled) return;
      const previousQuest = sessionQuestRef.current;
      const nextQuest = advanceSessionQuest(previousQuest, result);
      if (nextQuest === previousQuest) return;
      sessionQuestRef.current = nextQuest;
      setSessionQuest(nextQuest);
      if (!previousQuest.completed && nextQuest.completed) {
        setShowCelebration(false);
        setShowQuestComplete(true);
        setMascotExpression('excited');
        setMascotMessage('Expedição concluída!');
        setTimeout(() => speak(nextQuest.completionMessage), 450);
      }
    },
  });

  useEffect(() => {
    setTokens(shuffledTokens(current.words));
    setSelectedIds([]);
    setPhase('build');
    setLastStarMultiplier(1);
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
    const encounterId = `SENT_${current.id}-${++encounterSequenceRef.current}`;
    if (isCorrect) {
      playCorrectSound();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setTotalStars((stars) => stars + 1);
      setPhase('correct');
      setMascotExpression('excited');
      setMascotMessage('A frase ganhou vida!');
      if (!isPracticeMode) saveMutation.mutate({ isCorrect: true, encounterId });
      setTimeout(() => speak(getSpokenFeedback(true, `Você montou: ${current.sentence}.`, { motivationalChance: 0.55 })), 350);
      if (nextStreak > 0 && nextStreak % 5 === 0 && !sessionQuestRef.current?.completed) {
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
    if (!isPracticeMode) saveMutation.mutate({ isCorrect: false, encounterId });
    setTimeout(() => speak(getSpokenFeedback(false, current.hint, { motivationalChance: 0.3 })), 400);
  }, [current, selectedSentence, streak, saveMutation]);

  const continueReviewSession = useCallback(async () => {
    setMascotExpression('thinking');
    setMascotMessage('Atualizando suas revisões...');
    try {
      const { allProgress: freshProgress, continuation } = await loadLearnerReviewContinuation(lexiaPlatform.progress);
      queryClient.setQueryData(['childProgress'], freshProgress);
      navigateLearnerReviewContinuation(continuation);
    } catch (error) {
      console.error('Learner review continuation failed:', error);
      setMascotExpression('encouraging');
      setMascotMessage('Não consegui atualizar a revisão. Tente novamente.');
    }
  }, [queryClient]);

  const nextItem = useCallback(async () => {
    playClickSound();
    setShowCelebration(false);

    if (isDailyMode) {
      const challenge = getDailyChallenge(allProgress);
      const nextTarget = getNextChallengeTarget(challenge);
      const nextDailyIndex = findDailySentenceIndex(nextTarget?.key);
      if (nextDailyIndex >= 0 && nextDailyIndex !== index) {
        setIndex(nextDailyIndex);
        return;
      }
      if (challenge?.completed) {
        setMascotExpression('excited');
        setMascotMessage('Desafio diário completo! 🏆');
      }
    }

    if (isReviewMode && !isDailyMode) {
      await continueReviewSession();
      return;
    }

    const next = pickNextJourneyItemIndex({
      items: BASIC_SENTENCES,
      allProgress,
      entityPrefix: 'SENT_',
      targetKey: 'id',
      currentIndex: index,
    });
    setIndex(next);
  }, [index, allProgress, continueReviewSession]);

  const handleContinueAfterQuest = useCallback(() => {
    setShowQuestComplete(false);
    nextItem();
  }, [nextItem]);

  const panelTone = isReviewMode ? 'review' : isDailyMode ? 'reward' : 'paper';

  return (
    <div className="game-viewport flex flex-col bg-background">
      <SessionQuestComplete
        quest={showQuestComplete ? sessionQuest : null}
        onContinue={handleContinueAfterQuest}
      />

      <CurriculumGameplayHud
        title="Frases Mágicas"
        missionLabel="O Jardim das Histórias"
        dailyBonusLabel="alvo novo vale ⭐×2"
        homePath={homePath}
        isPracticeMode={isPracticeMode}
        isReviewMode={isReviewMode}
        isDailyMode={isDailyMode}
        totalStars={totalStars}
        streak={streak}
        onHome={playClickSound}
      />

      <SessionQuestBar quest={sessionQuest} />

      <div className="game-scroll-y game-safe-bottom flex-1 flex flex-col items-center justify-center gap-3 px-4 py-3 max-w-lg mx-auto w-full">
        <MascotAvatar className="game-compact-mascot" expression={mascotExpression} size="sm" message={mascotMessage} />

        <GamePanel
          key={current.id}
          tone={panelTone}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-4"
        >
          <motion.span className="text-6xl" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            {current.emoji}
          </motion.span>

          <div className="text-center">
            <p className="font-body text-xs uppercase tracking-[0.13em] font-bold text-primary">Pista</p>
            <p className="font-body text-sm text-muted-foreground mt-1">{current.hint}</p>
          </div>

          <GameActionButton
            gameVariant="neutral"
            variant="ghost"
            size="sm"
            className="rounded-full gap-1 text-muted-foreground"
            onClick={() => speak(current.hint)}
          >
            <Volume2 className="w-4 h-4" /> Ouvir pista
          </GameActionButton>

          <div className="w-full min-h-16 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 p-2 flex flex-wrap gap-2 items-center justify-center">
            {selectedTokens.length === 0 ? (
              <p className="font-body text-xs text-muted-foreground">Toque nas palavras na ordem correta</p>
            ) : selectedTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                onClick={() => removeToken(token.id)}
                className="lexia-sentence-token lexia-sentence-token-selected rounded-xl border border-primary/30 bg-primary text-primary-foreground px-3 py-2 font-body font-bold text-sm active:scale-95 transition-transform"
                aria-label={`Remover ${token.word} da frase`}
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
                      className="lexia-sentence-token lexia-sentence-token-available rounded-xl border-2 border-border bg-background px-3 py-2 font-body font-bold text-sm active:scale-95 transition-all"
                      aria-label={`Adicionar ${token.word} à frase`}
                    >
                      {token.word}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <GameActionButton
                    gameVariant="secondary"
                    variant="outline"
                    size="lg"
                    onClick={resetBuild}
                    disabled={selectedIds.length === 0}
                    className="px-4"
                    aria-label="Recomeçar frase"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </GameActionButton>
                  <GameActionButton
                    gameVariant="primary"
                    size="lg"
                    onClick={checkAnswer}
                    disabled={selectedIds.length !== current.words.length}
                    className="font-display text-lg gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Verificar frase
                  </GameActionButton>
                </div>
              </motion.div>
            )}

            {phase === 'correct' && (
              <motion.div key="correct" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                <GamePanel tone="success" className="rounded-2xl p-4 text-center">
                  <p className="font-display text-xl text-secondary">{current.sentence}</p>
                  <p className="font-body text-sm text-secondary mt-1">
                    {isPracticeMode ? 'Frase completa! Treino livre.' : `Frase completa! +${lastStarMultiplier} ⭐`}
                  </p>
                  <GameActionButton
                    gameVariant="primary"
                    onClick={nextItem}
                    disabled={!isPracticeMode && saveMutation.isPending}
                    className="mt-3 gap-2 font-display"
                  >
                    {isReviewMode ? 'Próxima revisão' : 'Próxima história'} <ChevronRight className="w-4 h-4" />
                  </GameActionButton>
                </GamePanel>
              </motion.div>
            )}

            {phase === 'wrong' && (
              <motion.div key="wrong" initial={{ opacity: 0, scale: 0.9 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                <GamePanel tone="reward" className="rounded-2xl p-4 text-center">
                  <p className="font-body text-sm text-foreground">As palavras estão certas, mas a ordem ainda pode mudar.</p>
                  <GameActionButton gameVariant="secondary" onClick={resetBuild} className="mt-3 gap-2 font-display">
                    <RotateCcw className="w-4 h-4" /> Tentar outra ordem
                  </GameActionButton>
                </GamePanel>
              </motion.div>
            )}
          </AnimatePresence>
        </GamePanel>
      </div>

      <CelebrationOverlay show={showCelebration} stars={3} message={`Combo ${streak}x! 🔥`} onDone={nextItem} />
    </div>
  );
}